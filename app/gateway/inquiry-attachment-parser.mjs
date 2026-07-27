import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const parserDirectory = dirname(fileURLToPath(import.meta.url));
const parserScript = resolve(
  parserDirectory,
  "inquiry_attachment_parser.py",
);
const defaultPythonExecutable = resolve(
  parserDirectory,
  "..",
  "..",
  "runtime",
  "python",
  "python.exe",
);
const maximumAttachmentBytes = 20 * 1024 * 1024;
const maximumParsedCharacters = 200_000;
const parserTimeoutMs = 120_000;
const defaultCacheTtlMs = 30 * 60_000;
const maximumCacheEntries = 200;

function parsingFailure(code, message, extra = {}) {
  return {
    parsingStatus: "FAILED",
    parsedText: "",
    parsingError: {
      code,
      message,
    },
    parser: "",
    parsedAt: new Date().toISOString(),
    truncated: false,
    ...extra,
  };
}

async function readResponseBuffer(response) {
  const declaredSize = Number(response.headers.get("content-length"));
  if (
    Number.isFinite(declaredSize) &&
    declaredSize > maximumAttachmentBytes
  ) {
    const error = new Error("Attachment exceeds the 20 MB parsing limit.");
    error.code = "ATTACHMENT_TOO_LARGE";
    throw error;
  }
  const reader = response.body?.getReader();
  if (!reader) {
    const error = new Error("Attachment response body is unavailable.");
    error.code = "ATTACHMENT_BODY_UNAVAILABLE";
    throw error;
  }
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumAttachmentBytes) {
        const error = new Error(
          "Attachment exceeds the 20 MB parsing limit.",
        );
        error.code = "ATTACHMENT_TOO_LARGE";
        throw error;
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

function runPythonParser(
  buffer,
  name,
  contentType,
  pythonExecutable,
) {
  return new Promise((resolveResult, rejectResult) => {
    const child = spawn(
      pythonExecutable,
      [
        "-X",
        "utf8",
        parserScript,
        "--name",
        String(name),
        "--content-type",
        String(contentType ?? ""),
      ],
      {
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    const stdout = [];
    const stderr = [];
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      const error = new Error("Attachment parsing timed out.");
      error.code = "ATTACHMENT_PARSE_TIMEOUT";
      rejectResult(error);
    }, parserTimeoutMs);
    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => {
      if (Buffer.concat(stderr).length < 64 * 1024) {
        stderr.push(Buffer.from(chunk));
      }
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      error.code = error.code ?? "ATTACHMENT_PARSER_UNAVAILABLE";
      rejectResult(error);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        const error = new Error(
          Buffer.concat(stderr).toString("utf8").trim() ||
            `Attachment parser exited with code ${code}.`,
        );
        error.code = "ATTACHMENT_PARSER_FAILED";
        rejectResult(error);
        return;
      }
      try {
        const output = Buffer.concat(stdout).toString("utf8").trim();
        const firstObject = output.indexOf("{");
        const lastObject = output.lastIndexOf("}");
        if (firstObject < 0 || lastObject < firstObject) {
          throw new Error("Attachment parser JSON was not found.");
        }
        resolveResult(
          JSON.parse(output.slice(firstObject, lastObject + 1)),
        );
      } catch {
        const error = new Error(
          "Attachment parser returned an invalid response.",
        );
        error.code = "ATTACHMENT_PARSER_INVALID_RESPONSE";
        rejectResult(error);
      }
    });
    child.stdin.end(buffer);
  });
}

export async function parseInquiryAttachmentBuffer(
  buffer,
  {
    name,
    contentType = "",
    pythonExecutable =
      process.env.OPS_INQUIRY_ATTACHMENT_PYTHON ??
      defaultPythonExecutable,
  },
) {
  if (!Buffer.isBuffer(buffer)) {
    return parsingFailure(
      "ATTACHMENT_BUFFER_INVALID",
      "Attachment content is invalid.",
    );
  }
  if (buffer.length > maximumAttachmentBytes) {
    return parsingFailure(
      "ATTACHMENT_TOO_LARGE",
      "Attachment exceeds the 20 MB parsing limit.",
      { size: buffer.length, contentType },
    );
  }
  try {
    const result = await runPythonParser(
      buffer,
      name,
      contentType,
      pythonExecutable,
    );
    const fullText = String(result.text ?? "");
    const parsedText = fullText.slice(0, maximumParsedCharacters);
    return {
      parsingStatus: String(result.status ?? "FAILED"),
      parsedText,
      parsingError: result.message
        ? {
            code: String(result.errorCode ?? "ATTACHMENT_PARSE_FAILED"),
            message: String(result.message),
          }
        : null,
      parser: String(result.parser ?? ""),
      parsedAt: new Date().toISOString(),
      truncated:
        result.truncated === true ||
        fullText.length > parsedText.length,
      pageCount: Number.isInteger(result.pageCount)
        ? result.pageCount
        : null,
      sheetCount: Number.isInteger(result.sheetCount)
        ? result.sheetCount
        : null,
      slideCount: Number.isInteger(result.slideCount)
        ? result.slideCount
        : null,
      size: buffer.length,
      contentType,
      contentSha256: createHash("sha256").update(buffer).digest("hex"),
    };
  } catch (error) {
    return parsingFailure(
      error.code ?? "ATTACHMENT_PARSE_FAILED",
      error.message ?? "Attachment parsing failed.",
      { size: buffer.length, contentType },
    );
  }
}

function collectAttachments(ticket) {
  const byId = new Map();
  const add = (attachment) => {
    if (attachment?.id && !byId.has(attachment.id)) {
      byId.set(attachment.id, attachment);
    }
  };
  for (const attachment of ticket.attachments ?? []) add(attachment);
  for (const thread of ticket.questionThreads ?? []) {
    for (const attachment of thread.customerQuestion?.attachments ?? []) {
      add(attachment);
    }
    for (const message of thread.messages ?? []) {
      for (const attachment of message.attachments ?? []) add(attachment);
    }
  }
  return Array.from(byId.values());
}

function applyParsedAttachments(ticket, parsedById) {
  const apply = (attachment) => ({
    ...attachment,
    ...(parsedById.get(attachment.id) ?? {}),
  });
  return {
    ...ticket,
    attachments: (ticket.attachments ?? []).map(apply),
    questionThreads: (ticket.questionThreads ?? []).map((thread) => ({
      ...thread,
      customerQuestion: {
        ...thread.customerQuestion,
        attachments: (thread.customerQuestion.attachments ?? []).map(apply),
      },
      messages: (thread.messages ?? []).map((message) => ({
        ...message,
        attachments: (message.attachments ?? []).map(apply),
      })),
    })),
  };
}

export function createInquiryAttachmentParser({
  sourceClient,
  pythonExecutable =
    process.env.OPS_INQUIRY_ATTACHMENT_PYTHON ??
    defaultPythonExecutable,
  cacheTtlMs = defaultCacheTtlMs,
} = {}) {
  const cache = new Map();

  function pruneCache(now = Date.now()) {
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(key);
    }
    while (cache.size > maximumCacheEntries) {
      cache.delete(cache.keys().next().value);
    }
  }

  async function parseAttachment(
    settings,
    ticketNo,
    attachment,
    { force = false } = {},
  ) {
    const key = [
      settings.id,
      settings.revision,
      ticketNo,
      attachment.id,
    ].join(":");
    const now = Date.now();
    pruneCache(now);
    if (!force && cache.get(key)?.expiresAt > now) {
      return cache.get(key).value;
    }
    let value;
    try {
      const upstream = await sourceClient.attachment(
        settings,
        ticketNo,
        attachment.id,
      );
      if (!upstream.ok) {
        value = parsingFailure(
          "ATTACHMENT_DOWNLOAD_FAILED",
          `Attachment download failed with status ${upstream.status}.`,
        );
      } else {
        const contentType =
          upstream.headers.get("content-type") ??
          "application/octet-stream";
        const buffer = await readResponseBuffer(upstream);
        value = await parseInquiryAttachmentBuffer(buffer, {
          name: attachment.name,
          contentType,
          pythonExecutable,
        });
      }
    } catch (error) {
      value = parsingFailure(
        error.code ?? "ATTACHMENT_DOWNLOAD_FAILED",
        error.message ?? "Attachment download failed.",
      );
    }
    cache.set(key, {
      value,
      expiresAt: now + cacheTtlMs,
    });
    pruneCache();
    return value;
  }

  return {
    parseAttachment,

    async enrichTicket(settings, ticket, { forceAttachmentId = null } = {}) {
      const parsedById = new Map();
      for (const attachment of collectAttachments(ticket)) {
        parsedById.set(
          attachment.id,
          await parseAttachment(settings, ticket.ticketNo, attachment, {
            force: attachment.id === forceAttachmentId,
          }),
        );
      }
      return applyParsedAttachments(ticket, parsedById);
    },

    clear() {
      cache.clear();
    },
  };
}
