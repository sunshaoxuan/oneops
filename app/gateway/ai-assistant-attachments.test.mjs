import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { Readable, Writable } from "node:stream";
import { resolve } from "node:path";
import test from "node:test";
import {
  createAiAssistantAttachmentStore,
} from "./ai-assistant-attachments.mjs";

class ResponseRecorder extends Writable {
  constructor() {
    super();
    this.statusCode = 0;
    this.headers = {};
    this.chunks = [];
  }

  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    this.headers = headers;
  }

  _write(chunk, _encoding, callback) {
    this.chunks.push(Buffer.from(chunk));
    callback();
  }
}

async function temporaryStore(t) {
  const parent = resolve(".test-work");
  await mkdir(parent, { recursive: true });
  const rootDirectory = await mkdtemp(resolve(parent, "ai-attachments-"));
  t.after(async () => {
    await rm(rootDirectory, { recursive: true, force: true });
  });
  return createAiAssistantAttachmentStore({
    rootDirectory,
    internalBaseUrl: "http://127.0.0.1:8092",
    now: () => Date.parse("2026-07-29T00:00:00Z"),
  });
}

test("an uploaded attachment is owned, signed and bound to one CAG task", async (t) => {
  const store = await temporaryStore(t);
  const attachment = await store.upload({
    request: Readable.from([Buffer.from("添付内容", "utf8")]),
    conversationId: "11111111-1111-4111-8111-111111111111",
    ownerUserId: "user-1",
    filename: "調査資料.txt",
    contentType: "text/plain; charset=utf-8",
  });

  assert.equal(attachment.name, "調査資料.txt");
  assert.equal(attachment.contentType, "text/plain");
  assert.equal(attachment.size, Buffer.byteLength("添付内容"));
  assert.match(attachment.sha256, /^[0-9a-f]{64}$/);

  const [prepared] = await store.resolveForTask(
    [attachment.id],
    "11111111-1111-4111-8111-111111111111",
    "user-1",
  );
  const signedUrl = new URL(prepared.downloadUrl);
  assert.equal(signedUrl.hostname, "127.0.0.1");
  assert.equal(signedUrl.port, "8092");
  assert.ok(signedUrl.searchParams.get("token"));

  const response = new ResponseRecorder();
  const handled = await store.serveSigned(
    { method: "GET" },
    response,
    signedUrl,
  );
  assert.equal(handled, true);
  assert.equal(response.statusCode, 200);
  assert.equal(Buffer.concat(response.chunks).toString("utf8"), "添付内容");

  await store.bindToTask(
    [attachment.id],
    "11111111-1111-4111-8111-111111111111",
    "user-1",
    "22222222-2222-4222-8222-222222222222",
  );
  await assert.rejects(
    () =>
      store.removeOwned(
        attachment.id,
        "11111111-1111-4111-8111-111111111111",
        "user-1",
      ),
    { code: "AI_ASSISTANT_ATTACHMENT_IN_USE" },
  );
});

test("attachments cannot cross a conversation or owner boundary", async (t) => {
  const store = await temporaryStore(t);
  const attachment = await store.upload({
    request: Readable.from([Buffer.from("secret")]),
    conversationId: "11111111-1111-4111-8111-111111111111",
    ownerUserId: "user-1",
    filename: "../secret.txt",
    contentType: "text/plain",
  });

  assert.equal(attachment.name, ".._secret.txt");
  await assert.rejects(
    () =>
      store.resolveForTask(
        [attachment.id],
        "33333333-3333-4333-8333-333333333333",
        "user-2",
      ),
    { code: "AI_ASSISTANT_ATTACHMENT_NOT_FOUND" },
  );
});
