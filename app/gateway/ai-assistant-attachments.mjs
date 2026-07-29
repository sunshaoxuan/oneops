import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";

const attachmentIdPattern = /^[0-9a-fA-F-]{36}$/;
export const maxAiAssistantAttachmentBytes = 25 * 1024 * 1024;
export const maxAiAssistantAttachmentsPerMessage = 10;
export const maxAiAssistantAttachmentTotalBytes = 50 * 1024 * 1024;
const defaultRetentionMs = 7 * 24 * 60 * 60 * 1000;
const defaultSignatureTtlMs = 72 * 60 * 60 * 1000;

function attachmentError(message, code, statusCode = 400) {
  return Object.assign(new Error(message), { code, statusCode });
}

function normalizedFilename(input) {
  const value = String(input ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .trim();
  if (!value) {
    throw attachmentError(
      "Attachment filename is required.",
      "AI_ASSISTANT_ATTACHMENT_INVALID",
    );
  }
  return Array.from(value).slice(0, 255).join("");
}

function normalizedContentType(input) {
  const value = String(input ?? "application/octet-stream")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(value)
    ? value
    : "application/octet-stream";
}

function metadataPath(rootDirectory, attachmentId) {
  return resolve(rootDirectory, `${attachmentId}.json`);
}

function contentPath(rootDirectory, attachmentId) {
  return resolve(rootDirectory, `${attachmentId}.bin`);
}

function publicAttachment(metadata) {
  return {
    id: metadata.id,
    name: metadata.name,
    contentType: metadata.contentType,
    size: metadata.size,
    sha256: metadata.sha256,
    createdAt: metadata.createdAt,
  };
}

async function writeMetadata(rootDirectory, metadata) {
  const target = metadataPath(rootDirectory, metadata.id);
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(metadata), {
    encoding: "utf8",
    flag: "wx",
  });
  await rename(temporary, target);
}

async function loadOrCreateSigningKey(rootDirectory) {
  const keyPath = resolve(rootDirectory, ".signing-key");
  try {
    return Buffer.from((await readFile(keyPath, "utf8")).trim(), "base64url");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const generated = randomBytes(32);
  try {
    await writeFile(keyPath, generated.toString("base64url"), {
      encoding: "utf8",
      flag: "wx",
    });
    return generated;
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    return Buffer.from((await readFile(keyPath, "utf8")).trim(), "base64url");
  }
}

function safeTokenEqual(left, right) {
  const leftBytes = Buffer.from(String(left ?? ""), "utf8");
  const rightBytes = Buffer.from(String(right ?? ""), "utf8");
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

function contentDisposition(filename) {
  const fallback = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${
    encodeURIComponent(filename)
  }`;
}

export function createAiAssistantAttachmentStore({
  rootDirectory,
  internalBaseUrl,
  retentionMs = defaultRetentionMs,
  signatureTtlMs = defaultSignatureTtlMs,
  now = () => Date.now(),
}) {
  let signingKeyPromise;

  async function initialize() {
    await mkdir(rootDirectory, { recursive: true });
    signingKeyPromise ??= loadOrCreateSigningKey(rootDirectory);
    await signingKeyPromise;
  }

  async function metadata(attachmentId) {
    if (!attachmentIdPattern.test(String(attachmentId ?? ""))) return null;
    try {
      return JSON.parse(
        await readFile(metadataPath(rootDirectory, attachmentId), "utf8"),
      );
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }

  async function ownedMetadata(attachmentId, conversationId, ownerUserId) {
    const value = await metadata(attachmentId);
    if (
      !value ||
      value.conversationId !== conversationId ||
      String(value.ownerUserId) !== String(ownerUserId)
    ) {
      throw attachmentError(
        "AI assistant attachment was not found.",
        "AI_ASSISTANT_ATTACHMENT_NOT_FOUND",
        404,
      );
    }
    return value;
  }

  async function upload({
    request,
    conversationId,
    ownerUserId,
    filename,
    contentType,
  }) {
    await initialize();
    const safeFilename = normalizedFilename(filename);
    const safeContentType = normalizedContentType(contentType);
    const id = randomUUID();
    const target = contentPath(rootDirectory, id);
    const temporary = `${target}.upload`;
    const handle = await open(temporary, "wx");
    const hash = createHash("sha256");
    let size = 0;
    try {
      for await (const chunk of request) {
        size += chunk.length;
        if (size > maxAiAssistantAttachmentBytes) {
          throw attachmentError(
            "Attachment exceeds the 25 MiB limit.",
            "AI_ASSISTANT_ATTACHMENT_TOO_LARGE",
            413,
          );
        }
        hash.update(chunk);
        await handle.write(chunk);
      }
      if (size === 0) {
        throw attachmentError(
          "Empty attachments are not accepted.",
          "AI_ASSISTANT_ATTACHMENT_INVALID",
        );
      }
    } catch (error) {
      await handle.close().catch(() => {});
      await rm(temporary, { force: true }).catch(() => {});
      throw error;
    }
    await handle.close();
    await rename(temporary, target);
    const createdAt = new Date(now()).toISOString();
    const value = {
      id,
      conversationId,
      ownerUserId: String(ownerUserId),
      name: safeFilename,
      contentType: safeContentType,
      size,
      sha256: hash.digest("hex"),
      createdAt,
      taskId: null,
    };
    try {
      await writeMetadata(rootDirectory, value);
    } catch (error) {
      await rm(target, { force: true }).catch(() => {});
      throw error;
    }
    return publicAttachment(value);
  }

  async function removeOwned(attachmentId, conversationId, ownerUserId) {
    const value = await ownedMetadata(
      attachmentId,
      conversationId,
      ownerUserId,
    );
    if (value.taskId) {
      throw attachmentError(
        "An attachment already assigned to a task cannot be deleted.",
        "AI_ASSISTANT_ATTACHMENT_IN_USE",
        409,
      );
    }
    await Promise.all([
      rm(metadataPath(rootDirectory, attachmentId), { force: true }),
      rm(contentPath(rootDirectory, attachmentId), { force: true }),
    ]);
  }

  async function resolveForTask(
    attachmentIds,
    conversationId,
    ownerUserId,
  ) {
    await initialize();
    const ids = [...new Set(
      (Array.isArray(attachmentIds) ? attachmentIds : [])
        .map((value) => String(value))
        .filter(Boolean),
    )];
    if (ids.length > maxAiAssistantAttachmentsPerMessage) {
      throw attachmentError(
        "A message can contain up to 10 attachments.",
        "AI_ASSISTANT_ATTACHMENT_LIMIT_EXCEEDED",
      );
    }
    const values = await Promise.all(
      ids.map((id) => ownedMetadata(id, conversationId, ownerUserId)),
    );
    const totalBytes = values.reduce((sum, value) => sum + value.size, 0);
    if (totalBytes > maxAiAssistantAttachmentTotalBytes) {
      throw attachmentError(
        "Attachments exceed the 50 MiB total limit.",
        "AI_ASSISTANT_ATTACHMENT_LIMIT_EXCEEDED",
        413,
      );
    }
    const key = await signingKeyPromise;
    const expires = now() + signatureTtlMs;
    return values.map((value) => {
      if (value.taskId) {
        throw attachmentError(
          "An attachment can only be sent once.",
          "AI_ASSISTANT_ATTACHMENT_IN_USE",
          409,
        );
      }
      const payload = `${value.id}.${expires}.${value.sha256}`;
      const token = createHmac("sha256", key)
        .update(payload)
        .digest("base64url");
      const url = new URL(
        `/api/work-center/v1/ai-assistant/task-attachments/${
          encodeURIComponent(value.id)
        }/content`,
        internalBaseUrl,
      );
      url.searchParams.set("expires", String(expires));
      url.searchParams.set("token", token);
      return {
        ...publicAttachment(value),
        downloadUrl: url.toString(),
      };
    });
  }

  async function bindToTask(
    attachmentIds,
    conversationId,
    ownerUserId,
    taskId,
  ) {
    await initialize();
    for (const attachmentId of attachmentIds) {
      const value = await ownedMetadata(
        attachmentId,
        conversationId,
        ownerUserId,
      );
      await writeMetadata(rootDirectory, {
        ...value,
        taskId,
      });
    }
  }

  async function sendContent(response, value) {
    const target = contentPath(rootDirectory, value.id);
    const file = await stat(target);
    response.writeHead(200, {
      "Content-Type": value.contentType,
      "Content-Length": String(file.size),
      "Content-Disposition": contentDisposition(value.name),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-OneOps-Content-SHA256": value.sha256,
    });
    await new Promise((resolvePromise, rejectPromise) => {
      const stream = createReadStream(target);
      stream.once("error", rejectPromise);
      stream.once("end", resolvePromise);
      response.once("close", resolvePromise);
      stream.pipe(response);
    });
  }

  async function serveOwned(
    response,
    attachmentId,
    conversationId,
    ownerUserId,
  ) {
    const value = await ownedMetadata(
      attachmentId,
      conversationId,
      ownerUserId,
    );
    await sendContent(response, value);
  }

  async function serveSigned(request, response, url) {
    const match = url.pathname.match(
      /^\/api\/work-center\/v1\/ai-assistant\/task-attachments\/([0-9a-fA-F-]{36})\/content$/,
    );
    if (!match || request.method !== "GET") return false;
    await initialize();
    const value = await metadata(match[1]);
    const expires = Number(url.searchParams.get("expires") ?? "0");
    const token = url.searchParams.get("token") ?? "";
    if (!value || !Number.isSafeInteger(expires) || expires < now()) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end();
      return true;
    }
    const key = await signingKeyPromise;
    const expected = createHmac("sha256", key)
      .update(`${value.id}.${expires}.${value.sha256}`)
      .digest("base64url");
    if (!safeTokenEqual(token, expected)) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end();
      return true;
    }
    await sendContent(response, value);
    return true;
  }

  async function cleanup() {
    await initialize();
    const threshold = now() - retentionMs;
    for (const name of await readdir(rootDirectory)) {
      if (!name.endsWith(".json")) continue;
      const id = name.slice(0, -5);
      const value = await metadata(id).catch(() => null);
      if (!value || Date.parse(value.createdAt) >= threshold) continue;
      await Promise.all([
        rm(metadataPath(rootDirectory, id), { force: true }),
        rm(contentPath(rootDirectory, id), { force: true }),
      ]);
    }
  }

  return {
    initialize,
    upload,
    removeOwned,
    resolveForTask,
    bindToTask,
    serveOwned,
    serveSigned,
    cleanup,
  };
}
