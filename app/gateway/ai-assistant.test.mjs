import assert from "node:assert/strict";
import test from "node:test";
import {
  attachmentsFromCagPrompt,
  buildCagAssistantPrompt,
  createAiAssistantRouteHandler,
  displayPromptFromCagPrompt,
  inquiryContextFromCagPrompt,
  normalizeInquiryAssistantContext,
} from "./ai-assistant-routes.mjs";

const conversationId = "11111111-2222-4333-8444-555555555555";
const userId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const gateway = {
  id: "99999999-8888-4777-8666-555555555555",
  name: "OneCAG",
  endpoint: "https://cag.example.test/api/v1",
  accessToken: "",
  enabled: true,
};

function responseRecorder() {
  return {
    headersSent: false,
    statusCode: 0,
    payload: null,
    getHeader(name) {
      return name === "X-Request-ID" ? "request-1" : undefined;
    },
  };
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.payload = payload;
}

function mappedSession(overrides = {}) {
  return {
    id: conversationId,
    ownerUserId: userId,
    gatewaySettingId: gateway.id,
    gatewayName: gateway.name,
    projectRef: "cag",
    projectCode: "cag",
    runtimeProfile: "general-engineering",
    title: "新しいチャット",
    status: "ACTIVE",
    lastTaskId: null,
    createdAt: "2026-07-29T00:00:00.000Z",
    updatedAt: "2026-07-29T00:00:00.000Z",
    archivedAt: null,
    ...overrides,
  };
}

test("CAG conversation.id is stored and returned as the OneOps session ID", async () => {
  let savedInput;
  const repository = {
    async create(input) {
      savedInput = input;
      return mappedSession({ id: input.conversationId, title: input.title });
    },
  };
  const fetchImpl = async (url, options) => {
    assert.equal(url, `${gateway.endpoint}/conversations`);
    assert.deepEqual(JSON.parse(options.body), {
      project_id: "cag",
      title: "運用相談",
    });
    return new Response(
      JSON.stringify({
        id: conversationId,
        project_id: "project-id",
        project_code: "cag",
        title: "運用相談",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  };
  const handler = createAiAssistantRouteHandler({
    repository,
    agentGatewaySettingsRepository: {
      async list() {
        return [gateway];
      },
    },
    sendJson,
    readJsonBody: async () => ({ title: "運用相談" }),
    fetchImpl,
  });
  const request = { method: "POST", headers: {} };
  const response = responseRecorder();

  const handled = await handler(
    request,
    response,
    new URL("https://oneops.example.test/api/work-center/v1/ai-assistant/sessions"),
    { id: userId },
  );

  assert.equal(handled, true);
  assert.equal(response.statusCode, 201);
  assert.equal(response.payload.session.id, conversationId);
  assert.equal(savedInput.conversationId, conversationId);
  assert.equal(savedInput.ownerUserId, userId);
});

test("message tasks use the owned CAG conversation ID directly", async () => {
  let sentBody;
  let touchedTask;
  let acceptedRequestBytes;
  const session = mappedSession();
  const repository = {
    async getOwned(id, owner) {
      assert.equal(id, conversationId);
      assert.equal(owner, userId);
      return session;
    },
    async touchTask(id, owner, taskId) {
      touchedTask = { id, owner, taskId };
      return true;
    },
  };
  const fetchImpl = async (url, options) => {
    assert.equal(url, `${gateway.endpoint}/tasks`);
    sentBody = JSON.parse(options.body);
    return new Response(
      JSON.stringify({
        id: "12345678-1234-4234-8234-123456789012",
        conversation_id: conversationId,
        status: "queued",
      }),
      { status: 202, headers: { "Content-Type": "application/json" } },
    );
  };
  const handler = createAiAssistantRouteHandler({
    repository,
    agentGatewaySettingsRepository: {
      async get(id) {
        assert.equal(id, gateway.id);
        return gateway;
      },
    },
    sendJson,
    readJsonBody: async (_request, maxBytes) => {
      acceptedRequestBytes = maxBytes;
      return { prompt: "調査してください" };
    },
    fetchImpl,
  });
  const request = { method: "POST", headers: {} };
  const response = responseRecorder();

  await handler(
    request,
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/messages`,
    ),
    { id: userId },
  );

  assert.equal(response.statusCode, 202);
  assert.equal(sentBody.conversation_id, conversationId);
  assert.equal(sentBody.project_id, "cag");
  assert.equal(sentBody.runtime_profile, "general-engineering");
  assert.equal(acceptedRequestBytes, 4 * 1024 * 1024);
  assert.deepEqual(touchedTask, {
    id: conversationId,
    owner: userId,
    taskId: "12345678-1234-4234-8234-123456789012",
  });
});

test("inquiry context is sanitized, sent with the prompt, and hidden from display", () => {
  const allSupportMessages = Array.from({ length: 35 }, (_, index) => ({
    messageKey: `all-${index + 1}`,
    kind: index % 2
      ? "INTERNAL_DISCUSSION"
      : "CUSTOMER_VISIBLE_REPLY",
    author: `担当者 ${index + 1}`,
    visibility: index % 2 ? "INTERNAL" : "CUSTOMER_VISIBLE",
    createdAt: `2026-07-29T01:${String(index).padStart(2, "0")}:00Z`,
    body: `対応記録 ${index + 1}`,
    attachmentNames: index === 0 ? ["回答資料.pdf"] : [],
  }));
  const normalized = normalizeInquiryAssistantContext({
    ticketNo: "38950",
    ticketTitle: "雇用継続給付について",
    status: "OPEN",
    subStatus: "一次回答済",
    assigneeName: "担当者",
    customerName: "京都大学",
    category: ["U-PDS"],
    urgency: "一般",
    inquiryLevel: null,
    createdAt: "2026-07-28T00:00:00Z",
    updatedAt: "2026-07-30T00:00:00Z",
    requestedReplyAt: "2026-07-31T00:00:00Z",
    questionKey: "q-1",
    questionSequence: 1,
    questionLabel: "お客様からの質問",
    questionCreatedAt: "2026-07-29T00:00:00Z",
    questionBody:
      "連絡先 test@example.com、03-1234-5678、password: secret",
    attachmentNames: ["資料.pdf"],
    messages: [
      {
        messageKey: "m-1",
        kind: "INTERNAL_DISCUSSION",
        author: "担当者",
        createdAt: "2026-07-29T01:00:00Z",
        body: "確認済み",
      },
    ],
    ticketAttachmentNames: ["問合せ全体資料.xlsx"],
    questionThreads: [
      {
        questionKey: "q-0",
        sequence: 1,
        questionLabel: "お客様からの質問",
        questionCreatedAt: "2026-07-28T00:00:00Z",
        requestedReplyAt: null,
        questionBody: "最初の質問 test@example.com",
        attachmentNames: [],
        messages: allSupportMessages,
      },
      {
        questionKey: "q-1",
        sequence: 2,
        questionLabel: "追加質問",
        questionCreatedAt: "2026-07-29T00:00:00Z",
        requestedReplyAt: null,
        questionBody: "今回分析する追加質問",
        attachmentNames: ["資料.pdf"],
        messages: [],
      },
    ],
    customerEvaluation: {
      satisfaction: "やや悪い",
      comment: "回答されていない質問が多すぎます。",
      submittedAt: "2026-07-30T00:00:00Z",
    },
  });
  const prompt = buildCagAssistantPrompt("原因を整理してください", normalized);

  assert.match(prompt, /\[ONEOPS_INQUIRY_CONTEXT_V1\]/);
  assert.match(prompt, /"ticketNo":"38950"/);
  assert.match(prompt, /"customerName":"京都大学"/);
  assert.match(prompt, /"subStatus":"一次回答済"/);
  assert.doesNotMatch(prompt, /test@example\.com/);
  assert.doesNotMatch(prompt, /03-1234-5678/);
  assert.doesNotMatch(prompt, /password: secret/);
  assert.equal(normalized.questionThreads.length, 2);
  assert.equal(normalized.questionThreads[0].messages.length, 35);
  assert.equal(
    normalized.questionThreads[0].messages.at(-1).body,
    "対応記録 35",
  );
  assert.equal(normalized.customerEvaluation.satisfaction, "やや悪い");
  assert.match(prompt, /questionThreads 全体と customerEvaluation/);
  assert.match(prompt, /回答されていない質問が多すぎます/);
  assert.equal(
    displayPromptFromCagPrompt(prompt),
    "原因を整理してください",
  );
  assert.equal(
    inquiryContextFromCagPrompt(prompt).ticketNo,
    "38950",
  );
});

test("task attachments include signed download instructions and hide URLs from display", () => {
  const prompt = buildCagAssistantPrompt(
    "二つの資料を比較してください",
    null,
    [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "比較資料.txt",
        contentType: "text/plain",
        size: 120,
        sha256: "a".repeat(64),
        downloadUrl:
          "http://127.0.0.1:8092/api/work-center/v1/ai-assistant/task-attachments/22222222-2222-4222-8222-222222222222/content?token=secret",
      },
    ],
  );

  assert.match(prompt, /\[ONEOPS_ATTACHMENTS_V1\]/);
  assert.match(prompt, /127\.0\.0\.1:8092/);
  assert.equal(
    displayPromptFromCagPrompt(prompt),
    "二つの資料を比較してください",
  );
  assert.deepEqual(attachmentsFromCagPrompt(prompt), [
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "比較資料.txt",
      contentType: "text/plain",
      size: 120,
      sha256: "a".repeat(64),
    },
  ]);
  assert.doesNotMatch(
    JSON.stringify(attachmentsFromCagPrompt(prompt)),
    /token=secret/,
  );
});

test("deleting a session removes only the owned OneOps mapping", async () => {
  let removed = null;
  let gatewayRead = false;
  const handler = createAiAssistantRouteHandler({
    repository: {
      async getOwned() {
        return mappedSession();
      },
      async remove(id, owner) {
        removed = { id, owner };
        return true;
      },
    },
    agentGatewaySettingsRepository: {
      async get() {
        gatewayRead = true;
        throw new Error("unexpected gateway read");
      },
    },
    sendJson,
    readJsonBody: async () => ({}),
  });
  const response = responseRecorder();

  await handler(
    { method: "DELETE", headers: {} },
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}`,
    ),
    { id: userId },
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, { deleted: true });
  assert.deepEqual(removed, { id: conversationId, owner: userId });
  assert.equal(gatewayRead, false);
});

test("a conversation ID without an owner mapping is not proxied", async () => {
  let fetchCalled = false;
  const handler = createAiAssistantRouteHandler({
    repository: {
      async getOwned() {
        return null;
      },
    },
    agentGatewaySettingsRepository: {},
    sendJson,
    readJsonBody: async () => ({}),
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error("unexpected fetch");
    },
  });
  const response = responseRecorder();

  await handler(
    { method: "GET", headers: {} },
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}`,
    ),
    { id: userId },
  );

  assert.equal(response.statusCode, 404);
  assert.equal(
    response.payload.error.code,
    "AI_ASSISTANT_SESSION_NOT_FOUND",
  );
  assert.equal(fetchCalled, false);
});
