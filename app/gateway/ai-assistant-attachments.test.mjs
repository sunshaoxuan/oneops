import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { Readable, Writable } from "node:stream";
import { resolve } from "node:path";
import test from "node:test";
import {
  createAiAssistantAttachmentStore,
  maxAiAssistantAttachmentTotalBytes,
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
    now: () => Date.parse("2026-07-29T00:00:00Z"),
  });
}

test("送信済み添付は所有権を維持し OneOps Task と Model Input へ一度だけ結合する", async (t) => {
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
  assert.equal("downloadUrl" in prepared, false);
  const response = new ResponseRecorder();
  await store.serveOwned(
    response,
    attachment.id,
    "11111111-1111-4111-8111-111111111111",
    "user-1",
  );
  assert.equal(response.statusCode, 200);
  assert.equal(Buffer.concat(response.chunks).toString("utf8"), "添付内容");

  await store.bindToTask(
    [attachment.id],
    "11111111-1111-4111-8111-111111111111",
    "user-1",
    "22222222-2222-4222-8222-222222222222",
  );
  const [modelAttachment] = await store.readForModel(
    [attachment.id],
    "11111111-1111-4111-8111-111111111111",
    "user-1",
    "22222222-2222-4222-8222-222222222222",
  );
  assert.equal(modelAttachment.name, "調査資料.txt");
  assert.equal(modelAttachment.data.toString("utf8"), "添付内容");
  await assert.rejects(
    () => store.readForModel(
      [attachment.id],
      "11111111-1111-4111-8111-111111111111",
      "user-1",
      "33333333-3333-4333-8333-333333333333",
    ),
    { code: "AI_ASSISTANT_ATTACHMENT_NOT_FOUND" },
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

test("編集再送信は元 Task に結合済みの添付だけを再利用できる", async (t) => {
  const store = await temporaryStore(t);
  const sessionId = "11111111-1111-4111-8111-111111111111";
  const sourceTaskId = "22222222-2222-4222-8222-222222222222";
  const replacementTaskId = "33333333-3333-4333-8333-333333333333";
  const attachment = await store.upload({
    request: Readable.from([Buffer.from("添付内容", "utf8")]),
    conversationId: sessionId,
    ownerUserId: "user-1",
    filename: "履歴資料.txt",
    contentType: "text/plain",
  });
  await store.bindToTask([attachment.id], sessionId, "user-1", sourceTaskId);

  const reused = await store.reuseForTask(
    [attachment.id], sessionId, "user-1", sourceTaskId,
  );
  assert.deepEqual(reused.map((value) => value.id), [attachment.id]);
  await assert.rejects(
    () => store.reuseForTask(
      [attachment.id], sessionId, "user-1", replacementTaskId,
    ),
    { code: "AI_ASSISTANT_ATTACHMENT_NOT_FOUND" },
  );
  await store.bindToTask([attachment.id], sessionId, "user-1", replacementTaskId);
  const [modelAttachment] = await store.readForModel(
    [attachment.id], sessionId, "user-1", replacementTaskId,
  );
  assert.equal(modelAttachment.data.toString("utf8"), "添付内容");
});

test("Model Input の添付合計は OpenAI 契約の 50,000,000 Bytes を超過できない", async (t) => {
  assert.equal(maxAiAssistantAttachmentTotalBytes, 50_000_000);
  const store = await temporaryStore(t);
  const content = Buffer.alloc(25_000_001, 0x61);
  const first = await store.upload({
    request: Readable.from([content]),
    conversationId: "11111111-1111-4111-8111-111111111111",
    ownerUserId: "user-1",
    filename: "first.txt",
    contentType: "text/plain",
  });
  const second = await store.upload({
    request: Readable.from([content]),
    conversationId: "11111111-1111-4111-8111-111111111111",
    ownerUserId: "user-1",
    filename: "second.txt",
    contentType: "text/plain",
  });

  await assert.rejects(
    () => store.resolveForTask(
      [first.id, second.id],
      "11111111-1111-4111-8111-111111111111",
      "user-1",
    ),
    { code: "AI_ASSISTANT_ATTACHMENT_LIMIT_EXCEEDED" },
  );
});

test("添付は Session と所有者の境界を越えて利用できない", async (t) => {
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
