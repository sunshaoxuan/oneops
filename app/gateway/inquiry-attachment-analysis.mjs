import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import JSZip from "jszip";

const maximumAttachmentBytes = 20 * 1024 * 1024;
const maximumTotalAttachmentBytes = 40 * 1024 * 1024;
const maximumExtractedTextCharacters = 50_000;
const maximumTotalExtractedTextCharacters = 80_000;
const maximumVisualBytes = 4 * 1024 * 1024;
const maximumTotalVisualBytes = 12 * 1024 * 1024;
const maximumVisualCount = 10;

const directImageMimeTypes = new Map([
  ["PNG", "image/png"],
  ["JPG", "image/jpeg"],
  ["JPEG", "image/jpeg"],
  ["WEBP", "image/webp"],
  ["GIF", "image/gif"],
]);

const openXmlPrefixes = new Map([
  ["PPTX", ["ppt/slides/", "ppt/notesSlides/"]],
  ["DOCX", ["word/document.xml", "word/header", "word/footer"]],
  ["XLSX", ["xl/sharedStrings.xml", "xl/worksheets/"]],
]);

const openXmlMediaPrefixes = new Map([
  ["PPTX", "ppt/media/"],
  ["DOCX", "word/media/"],
  ["XLSX", "xl/media/"],
]);

function attachmentType(attachment) {
  const explicit = String(attachment?.type ?? "").trim().toUpperCase();
  if (explicit) return explicit;
  return String(attachment?.name ?? "")
    .split(".")
    .pop()
    ?.toUpperCase() ?? "FILE";
}

function numericArchiveOrder(left, right) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function normalizedXmlText(xml) {
  try {
    const document = new JSDOM(xml, {
      contentType: "text/xml",
    }).window.document;
    return Array.from(document.getElementsByTagNameNS("*", "t"))
      .map((node) => String(node.textContent ?? "").trim())
      .filter(Boolean)
      .join(" ");
  } catch {
    return "";
  }
}

function imageMimeType(name) {
  return directImageMimeTypes.get(
    String(name).split(".").pop()?.toUpperCase() ?? "",
  ) ?? null;
}

function uniqueTicketAttachments(ticket) {
  const values = new Map();
  const add = (attachment, evidenceKey, location) => {
    const id = String(attachment?.id ?? "");
    if (!id) return;
    const existing = values.get(id);
    if (existing) {
      existing.locations.add(location);
      return;
    }
    values.set(id, {
      attachment,
      evidenceKey,
      locations: new Set([location]),
    });
  };
  for (const thread of ticket.questionThreads ?? []) {
    for (const attachment of thread.customerQuestion?.attachments ?? []) {
      add(attachment, thread.questionKey, `Q${thread.sequence}`);
    }
    for (const message of thread.messages ?? []) {
      for (const attachment of message.attachments ?? []) {
        add(
          attachment,
          message.messageKey,
          `Q${thread.sequence}:${message.kind}`,
        );
      }
    }
  }
  const fallbackEvidenceKey = ticket.questionThreads?.[0]?.questionKey ?? "";
  for (const attachment of ticket.attachments ?? []) {
    add(attachment, fallbackEvidenceKey, "TICKET");
  }
  return Array.from(values.values()).map((value) => ({
    ...value,
    locations: Array.from(value.locations),
  }));
}

async function limitedAttachmentBuffer(response, remainingBytes) {
  const declared = Number(response.headers.get("content-length") ?? "0");
  const limit = Math.min(maximumAttachmentBytes, remainingBytes);
  if (declared > limit) {
    const error = new Error("Attachment exceeds the analysis size limit.");
    error.code = "TOO_LARGE";
    throw error;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > limit) {
    const error = new Error("Attachment exceeds the analysis size limit.");
    error.code = "TOO_LARGE";
    throw error;
  }
  return buffer;
}

async function extractOpenXml(buffer, type, attachmentLabel) {
  const archive = await JSZip.loadAsync(buffer, {
    checkCRC32: true,
  });
  const prefixes = openXmlPrefixes.get(type) ?? [];
  const textEntries = Object.keys(archive.files)
    .filter((name) =>
      name.endsWith(".xml") &&
      prefixes.some((prefix) => name.startsWith(prefix))
    )
    .sort(numericArchiveOrder);
  const textParts = [];
  for (const name of textEntries) {
    const extracted = normalizedXmlText(
      await archive.file(name).async("string"),
    );
    if (extracted) {
      textParts.push(`${name}: ${extracted}`);
    }
    if (textParts.join("\n").length >= maximumExtractedTextCharacters) {
      break;
    }
  }

  const mediaPrefix = openXmlMediaPrefixes.get(type);
  const mediaEntries = Object.keys(archive.files)
    .filter((name) => name.startsWith(mediaPrefix) && imageMimeType(name))
    .sort(numericArchiveOrder);
  const visuals = [];
  for (const name of mediaEntries) {
    const data = await archive.file(name).async("nodebuffer");
    visuals.push({
      name: `${attachmentLabel}:${name}`,
      mimeType: imageMimeType(name),
      data,
    });
  }
  return {
    text: textParts.join("\n").slice(0, maximumExtractedTextCharacters),
    visuals,
  };
}

function visualReference(attachmentId, index, data) {
  return `attachment-${createHash("sha256")
    .update(`${attachmentId}:${index}:`)
    .update(data)
    .digest("hex")
    .slice(0, 16)}`;
}

export async function prepareInquiryAnalysisAttachments({
  sourceClient,
  settings,
  ticket,
}) {
  const attachments = uniqueTicketAttachments(ticket);
  const context = [];
  const images = [];
  const seenImages = new Set();
  let consumedAttachmentBytes = 0;
  let consumedVisualBytes = 0;
  let consumedTextCharacters = 0;
  let skippedVisualCount = 0;

  for (const item of attachments) {
    const type = attachmentType(item.attachment);
    const record = {
      id: String(item.attachment.id),
      name: String(item.attachment.name ?? "attachment"),
      type,
      evidenceKey: String(item.evidenceKey ?? ""),
      locations: item.locations,
      status: "UNSUPPORTED",
      text: "",
      visualRefs: [],
    };
    try {
      const remainingBytes =
        maximumTotalAttachmentBytes - consumedAttachmentBytes;
      if (remainingBytes <= 0) {
        throw Object.assign(
          new Error("Total attachment size exceeds the analysis limit."),
          { code: "TOO_LARGE" },
        );
      }
      const response = await sourceClient.attachment(
        settings,
        ticket.ticketNo,
        item.attachment.id,
      );
      if (!response.ok) {
        throw Object.assign(new Error("Attachment download failed."), {
          code: "DOWNLOAD_FAILED",
        });
      }
      const buffer = await limitedAttachmentBuffer(response, remainingBytes);
      consumedAttachmentBytes += buffer.length;
      let extracted;
      if (openXmlPrefixes.has(type)) {
        extracted = await extractOpenXml(buffer, type, record.name);
      } else if (directImageMimeTypes.has(type)) {
        extracted = {
          text: "",
          visuals: [{
            name: record.name,
            mimeType: directImageMimeTypes.get(type),
            data: buffer,
          }],
        };
      } else {
        context.push(record);
        continue;
      }
      record.status = "PARSED";
      const remainingTextCharacters = Math.max(
        0,
        maximumTotalExtractedTextCharacters - consumedTextCharacters,
      );
      record.text = extracted.text.slice(0, remainingTextCharacters);
      consumedTextCharacters += record.text.length;
      for (const [index, visual] of extracted.visuals.entries()) {
        const digest = createHash("sha256").update(visual.data).digest("hex");
        if (seenImages.has(digest)) continue;
        if (
          visual.data.length > maximumVisualBytes ||
          consumedVisualBytes + visual.data.length > maximumTotalVisualBytes ||
          images.length >= maximumVisualCount
        ) {
          skippedVisualCount += 1;
          continue;
        }
        seenImages.add(digest);
        consumedVisualBytes += visual.data.length;
        const ref = visualReference(record.id, index, visual.data);
        record.visualRefs.push(ref);
        images.push({
          ref,
          name: visual.name,
          mimeType: visual.mimeType,
          dataUrl: `data:${visual.mimeType};base64,${visual.data.toString("base64")}`,
          evidenceKey: record.evidenceKey,
        });
      }
    } catch (error) {
      record.status = error?.code === "TOO_LARGE" ? "TOO_LARGE" : "FAILED";
    }
    context.push(record);
  }

  const summary = {
    total: context.length,
    parsed: context.filter((item) => item.status === "PARSED").length,
    visualCount: images.length,
    unsupported: context.filter((item) => item.status === "UNSUPPORTED").length,
    failed: context.filter((item) =>
      ["FAILED", "TOO_LARGE"].includes(item.status)
    ).length,
    skippedVisualCount,
  };
  return { context, images, summary };
}
