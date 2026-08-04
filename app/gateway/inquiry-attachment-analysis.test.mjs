import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import {
  prepareInquiryAnalysisAttachments,
} from "./inquiry-attachment-analysis.mjs";
import {
  buildInquiryAnalysisPrompt,
  modelInquiryMessageContent,
} from "./inquiry-analysis.mjs";

async function presentationFixture() {
  const archive = new JSZip();
  archive.file(
    "ppt/slides/slide1.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
     <p:sld xmlns:p="urn:p" xmlns:a="urn:a">
       <a:t>ログイン画面の URL を確認してください。</a:t>
       <a:t>customer@example.test</a:t>
     </p:sld>`,
  );
  archive.file(
    "ppt/media/image1.png",
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  return archive.generateAsync({ type: "nodebuffer" });
}

test("PPTX attachment analysis extracts slide text and visual evidence once", async () => {
  const buffer = await presentationFixture();
  const attachment = {
    id: "attachment-1",
    name: "login-screen.pptx",
    type: "PPTX",
    size: null,
  };
  const thread = {
    questionKey: "question-1",
    sequence: 1,
    customerQuestion: {
      body: "ログインできません。",
      createdAt: "2026-08-04T09:00:00+09:00",
      requestedReplyAt: null,
      attachments: [attachment],
    },
    messages: [],
  };
  const sourceClient = {
    async attachment() {
      return new Response(buffer, {
        status: 200,
        headers: { "content-length": String(buffer.length) },
      });
    },
  };
  const result = await prepareInquiryAnalysisAttachments({
    sourceClient,
    settings: {},
    ticket: {
      ticketNo: "95073",
      attachments: [attachment],
      questionThreads: [thread],
    },
  });

  assert.deepEqual(result.summary, {
    total: 1,
    parsed: 1,
    visualCount: 1,
    unsupported: 0,
    failed: 0,
    skippedVisualCount: 0,
  });
  assert.match(result.context[0].text, /ログイン画面の URL/);
  assert.equal(result.context[0].visualRefs.length, 1);
  assert.match(result.images[0].dataUrl, /^data:image\/png;base64,/);

  const prompt = buildInquiryAnalysisPrompt(
    {
      ticketNo: "95073",
      title: "Login",
      status: "OPEN:未回答",
      subStatus: "",
      category: [],
      urgency: null,
      inquiryLevel: null,
      requestedReplyAt: null,
      attachments: [attachment],
      questionThreads: [thread],
      evaluation: null,
    },
    thread,
    null,
    "TICKET",
    result.context,
  );
  assert.match(prompt, /attachmentEvidence/);
  assert.match(prompt, /ログイン画面の URL/);
  assert.match(prompt, /\[REDACTED_EMAIL\]/);
  assert.match(prompt, /visualRefs/);
  assert.doesNotMatch(prompt, /customer@example\.test/);

  const content = modelInquiryMessageContent(prompt, result.images);
  assert.equal(Array.isArray(content), true);
  assert.equal(content.filter((item) => item.type === "image_url").length, 1);
  assert.equal(content.at(-1).image_url.detail, "high");
});

test("unsupported attachments are reported without fabricated content", async () => {
  const attachment = {
    id: "attachment-2",
    name: "archive.zip",
    type: "ZIP",
    size: null,
  };
  const result = await prepareInquiryAnalysisAttachments({
    sourceClient: {
      async attachment() {
        return new Response(Buffer.from("zip"), { status: 200 });
      },
    },
    settings: {},
    ticket: {
      ticketNo: "1",
      attachments: [attachment],
      questionThreads: [],
    },
  });
  assert.equal(result.summary.unsupported, 1);
  assert.equal(result.summary.parsed, 0);
  assert.equal(result.context[0].text, "");
  assert.deepEqual(result.images, []);
});
