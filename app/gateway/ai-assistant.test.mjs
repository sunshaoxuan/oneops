import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";
import {
  createAiAssistantRouteHandler,
  normalizeInquiryAssistantContext,
  publicAiAssistantTask,
} from "./ai-assistant-routes.mjs";

const conversationId = "11111111-2222-4333-8444-555555555555";
const taskId = "77777777-6666-4555-8444-333333333333";
const attachmentId = "33333333-4444-4555-8666-777777777777";
const userId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const startingModel = {
  id: "22222222-2222-4222-8222-222222222222",
  displayName: "汎用 GPT モデル",
  purpose: "GENERAL",
  provider: "OPENAI",
  endpoint: "https://api.openai.example.test/v1",
  model: "gpt-5.6-terra",
  reasoningEffort: "MEDIUM",
  speedLevel: "FAST",
  enabled: true,
  isDefault: true,
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

function streamResponseRecorder() {
  const chunks = [];
  const response = new PassThrough();
  response.headersSent = false;
  response.statusCode = 0;
  response.responseHeaders = {};
  response.payload = null;
  response.getHeader = (name) =>
    name === "X-Request-ID" ? "request-1" : undefined;
  response.writeHead = (statusCode, headers) => {
    response.statusCode = statusCode;
    response.responseHeaders = headers;
    response.headersSent = true;
    return response;
  };
  response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  return {
    response,
    body: () => Buffer.concat(chunks).toString("utf8"),
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
    title: "新しいチャット",
    status: "ACTIVE",
    lastTaskId: null,
    createdAt: "2026-08-11T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
    archivedAt: null,
    shortcut: null,
    shortcutPromptSnapshot: null,
    startingModel,
    ...overrides,
  };
}

function mappedTask(overrides = {}) {
  return {
    id: taskId,
    conversation_id: conversationId,
    status: "completed",
    prompt: "調査結果を整理してください",
    inquiryContext: null,
    attachments: [],
    routing: {
      routePolicyVersion: "oneops-ai-direct-gpt-v1",
      taskClass: "COMPLEX_ANALYSIS",
      modelSettingId: startingModel.id,
      model: startingModel.model,
      reasoningEffort: "medium",
      selectionReason: "SESSION_STARTING_MODEL",
    },
    modelSettingId: startingModel.id,
    model: startingModel.model,
    reasoningEffort: "MEDIUM",
    providerResponseId: "resp_private",
    providerOutput: [{ id: "reasoning_private" }],
    tokenUsage: { input_tokens: 10, output_tokens: 20 },
    errorCode: null,
    error: null,
    final_report: { summary: "整理済みです。" },
    created_at: "2026-08-11T00:00:01.000Z",
    completed_at: "2026-08-11T00:00:02.000Z",
    ...overrides,
  };
}

function modelSettingsRepository(overrides = {}) {
  return {
    async getDefaultAssistantModel() {
      return startingModel;
    },
    async getById() {
      return startingModel;
    },
    ...overrides,
  };
}

function taskRunner(overrides = {}) {
  return {
    start() {},
    cancel() {
      return true;
    },
    ...overrides,
  };
}

function routeHandler({
  repository,
  shortcutRepository = null,
  models = modelSettingsRepository(),
  runner = taskRunner(),
  body = {},
  attachmentStore = null,
  eventPollIntervalMs = 10,
}) {
  return createAiAssistantRouteHandler({
    repository,
    shortcutRepository,
    modelSettingsRepository: models,
    taskRunner: runner,
    sendJson,
    readJsonBody: async () => body,
    attachmentStore,
    eventPollIntervalMs,
  });
}

test("Session ID は OneOps が発行し Default GPT Model を固定する", async () => {
  let savedInput;
  const handler = routeHandler({
    repository: {
      async create(input) {
        savedInput = input;
        return mappedSession({
          id: input.conversationId,
          title: input.title,
          startingModel: {
            id: input.modelSettingId,
            model: input.modelSnapshot,
            reasoningEffort: input.reasoningEffortSnapshot,
            speedLevel: input.speedLevelSnapshot,
          },
        });
      },
    },
    body: { title: "運用相談" },
  });
  const request = { method: "POST", headers: {} };
  const response = responseRecorder();

  const handled = await handler(
    request,
    response,
    new URL(
      "https://oneops.example.test/api/work-center/v1/ai-assistant/sessions",
    ),
    { id: userId },
  );

  assert.equal(handled, true);
  assert.equal(response.statusCode, 201);
  assert.match(savedInput.conversationId, /^[0-9a-f-]{36}$/);
  assert.equal(response.payload.session.id, savedInput.conversationId);
  assert.equal(savedInput.ownerUserId, userId);
  assert.equal(savedInput.title, "運用相談");
  assert.equal(savedInput.modelSettingId, startingModel.id);
  assert.equal(savedInput.modelSnapshot, startingModel.model);
  assert.equal(savedInput.reasoningEffortSnapshot, "MEDIUM");
  assert.equal("gatewaySettingId" in savedInput, false);
  assert.equal("projectRef" in savedInput, false);
  assert.deepEqual(request.auditContext, {
    conversationId: savedInput.conversationId,
    modelSettingId: startingModel.id,
    shortcutId: null,
  });
});

test("Quick Assistant の Model と Prompt Snapshot を Session に保存する", async () => {
  const shortcutId = "88888888-7777-4666-8555-444444444444";
  const shortcut = {
    id: shortcutId,
    name: { ja: "日中翻訳", zh: "日中翻译", en: "JP ZH Translation" },
    systemPrompt: "翻訳結果だけを返してください。",
    startingModel: {
      ...startingModel,
      reasoningEffort: "HIGH",
    },
  };
  let savedInput;
  const handler = routeHandler({
    repository: {
      async create(input) {
        savedInput = input;
        return mappedSession({
          id: input.conversationId,
          title: input.title,
          shortcut: { ...shortcut },
          shortcutPromptSnapshot: input.shortcutPromptSnapshot,
        });
      },
    },
    shortcutRepository: {
      async getEnabled(id) {
        assert.equal(id, shortcutId);
        return shortcut;
      },
    },
    body: { shortcutId },
  });
  const response = responseRecorder();

  await handler(
    { method: "POST", headers: {} },
    response,
    new URL(
      "https://oneops.example.test/api/work-center/v1/ai-assistant/sessions",
    ),
    { id: userId },
  );

  assert.equal(response.statusCode, 201);
  assert.equal(savedInput.title, "日中翻訳");
  assert.equal(savedInput.reasoningEffortSnapshot, "HIGH");
  assert.equal(
    savedInput.shortcutPromptSnapshot,
    "翻訳結果だけを返してください。",
  );
  assert.equal("shortcutPromptSnapshot" in response.payload.session, false);
  assert.equal("systemPrompt" in response.payload.session.shortcut, false);
});

test("OpenAI 以外の Default Model では Session を作成しない", async () => {
  let created = false;
  const handler = routeHandler({
    repository: {
      async create() {
        created = true;
      },
    },
    models: modelSettingsRepository({
      async getDefaultAssistantModel() {
        return { ...startingModel, provider: "OTHER" };
      },
    }),
    body: { title: "無効な設定" },
  });
  const response = responseRecorder();

  await handler(
    { method: "POST", headers: {} },
    response,
    new URL(
      "https://oneops.example.test/api/work-center/v1/ai-assistant/sessions",
    ),
    { id: userId },
  );

  assert.equal(created, false);
  assert.equal(response.statusCode, 409);
  assert.equal(
    response.payload.error.code,
    "AI_ASSISTANT_CONFIGURATION_REQUIRED",
  );
});

test("Quick Assistant の公開一覧と管理一覧を分離する", async () => {
  const calls = [];
  const handler = routeHandler({
    repository: {},
    shortcutRepository: {
      async listPublic() {
        calls.push("public");
        return [{ id: "public" }];
      },
      async listAdmin() {
        calls.push("admin");
        return [{ id: "admin", systemPrompt: "管理用" }];
      },
    },
  });
  const publicResponse = responseRecorder();
  const adminResponse = responseRecorder();

  await handler(
    { method: "GET", headers: {} },
    publicResponse,
    new URL(
      "https://oneops.example.test/api/work-center/v1/ai-assistant/shortcuts",
    ),
    { id: userId },
  );
  await handler(
    { method: "GET", headers: {} },
    adminResponse,
    new URL(
      "https://oneops.example.test/api/work-center/v1/ai-assistant/shortcuts/admin",
    ),
    { id: userId },
  );

  assert.deepEqual(calls, ["public", "admin"]);
  assert.deepEqual(publicResponse.payload.categories, [{ id: "public" }]);
  assert.deepEqual(adminResponse.payload.categories, [
    { id: "admin", systemPrompt: "管理用" },
  ]);
});

test("管理者は OpenAI Model を指定した Quick Assistant を作成する", async () => {
  const categoryId = "44444444-5555-4666-8777-888888888888";
  let created;
  const input = {
    categoryId,
    startingModelSettingId: startingModel.id,
    startingReasoningEffort: "HIGH",
    name: { ja: "文章校正", zh: "文章润色", en: "Copy editing" },
    description: { ja: "説明", zh: "说明", en: "Description" },
    starterPrompt: { ja: "本文", zh: "正文", en: "Text" },
    systemPrompt: "文章を校正してください。",
    sortOrder: 10,
    enabled: true,
  };
  const handler = routeHandler({
    repository: {},
    shortcutRepository: {
      async create(...args) {
        created = args;
      },
    },
    body: input,
  });
  const response = responseRecorder();

  await handler(
    { method: "POST", headers: {} },
    response,
    new URL(
      "https://oneops.example.test/api/work-center/v1/ai-assistant/shortcuts/admin",
    ),
    { id: userId },
  );

  assert.equal(response.statusCode, 201);
  assert.match(response.payload.shortcutId, /^[0-9a-f-]{36}$/);
  assert.equal(created[0], response.payload.shortcutId);
  assert.equal(created[2].startingModelSettingId, startingModel.id);
  assert.equal(created[2].startingReasoningEffort, "HIGH");
  assert.equal(created[3], userId);
});

test("問合せ Context は機密文字列を除外して構造を維持する", () => {
  const normalized = normalizeInquiryAssistantContext({
    ticketNo: "INC-900",
    ticketTitle: "障害",
    status: "対応中",
    questionKey: "Q-5",
    questionSequence: 5,
    questionLabel: "第五問",
    questionBody: "連絡先 user@example.test password=secret",
    category: ["運用"],
    messages: [{
      messageKey: "M-1",
      kind: "回答",
      author: "担当 03-1234-5678",
      visibility: "INTERNAL",
      body: "access_token=hidden",
    }],
  });

  assert.equal(normalized.ticketNo, "INC-900");
  assert.equal(normalized.questionSequence, 5);
  assert.match(normalized.questionBody, /\[メールアドレス除外\]/);
  assert.match(normalized.questionBody, /password=\[機密情報除外\]/);
  assert.match(normalized.messages[0].author, /\[電話番号除外\]/);
  assert.match(normalized.messages[0].body, /access_token=\[機密情報除外\]/);
});

test("Message は Local Task Ledger へ保存して GPT Runner を開始する", async () => {
  const order = [];
  let createInput;
  const preparedAttachment = {
    id: attachmentId,
    name: "設計書.pdf",
    contentType: "application/pdf",
    size: 1200,
    sha256: "a".repeat(64),
  };
  const repository = {
    async getOwned() {
      return mappedSession();
    },
    async listTasksOwned() {
      return [mappedTask({
        id: "66666666-5555-4444-8333-222222222222",
        routing: {
          taskClass: "COMPLEX_ANALYSIS",
          objectiveSummary: "設計を分析する",
          targetLanguage: null,
          constraints: [],
        },
      })];
    },
    async createTask(input) {
      createInput = input;
      order.push("create");
      return mappedTask({
        id: input.id,
        status: "queued",
        prompt: input.prompt,
        inquiryContext: input.inquiryContext,
        attachments: input.attachments,
        routing: input.routing,
        providerResponseId: null,
        providerOutput: [],
        tokenUsage: null,
        final_report: null,
        completed_at: null,
      });
    },
    async failTask() {
      throw new Error("failTask must not be called");
    },
  };
  const handler = routeHandler({
    repository,
    runner: taskRunner({
      start(id) {
        order.push("start");
        assert.equal(id, createInput.id);
      },
    }),
    attachmentStore: {
      async resolveForTask(ids, sessionId, ownerId) {
        assert.deepEqual(ids, [attachmentId]);
        assert.equal(sessionId, conversationId);
        assert.equal(ownerId, userId);
        return [preparedAttachment];
      },
      async bindToTask(ids, sessionId, ownerId, id) {
        order.push("bind");
        assert.deepEqual(ids, [attachmentId]);
        assert.equal(sessionId, conversationId);
        assert.equal(ownerId, userId);
        assert.equal(id, createInput.id);
      },
    },
    body: {
      prompt: "この設計を続けて分析してください",
      inquiryContext: null,
      attachmentIds: [attachmentId],
    },
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
  assert.deepEqual(order, ["create", "bind", "start"]);
  assert.match(createInput.id, /^[0-9a-f-]{36}$/);
  assert.equal(createInput.conversationId, conversationId);
  assert.equal(createInput.ownerUserId, userId);
  assert.equal(createInput.requestId, "request-1");
  assert.deepEqual(createInput.attachments, [{
    id: attachmentId,
    name: "設計書.pdf",
    contentType: "application/pdf",
    size: 1200,
    sha256: "a".repeat(64),
  }]);
  assert.equal(createInput.routing.modelSettingId, startingModel.id);
  assert.equal(createInput.routing.model, startingModel.model);
  assert.equal(createInput.routing.reasoningEffort, "medium");
  assert.equal(
    createInput.routing.selectionReason,
    "SESSION_STARTING_MODEL",
  );
  assert.equal(response.payload.task.id, createInput.id);
  assert.equal("providerResponseId" in response.payload.task, false);
  assert.equal("providerOutput" in response.payload.task, false);
  assert.equal("tokenUsage" in response.payload.task, false);
  assert.equal("downloadUrl" in response.payload.task.attachments[0], false);
});

test("Local Ledger の活動 Task 制約 Error は 409 として返す", async () => {
  let started = false;
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return mappedSession({ lastTaskId: taskId });
      },
      async listTasksOwned() {
        return [mappedTask({ status: "running", final_report: null })];
      },
      async createTask() {
        throw Object.assign(
          new Error("An AI assistant response is already in progress."),
          { code: "AI_ASSISTANT_RESPONSE_IN_PROGRESS" },
        );
      },
    },
    runner: taskRunner({
      start() {
        started = true;
      },
    }),
    body: { prompt: "二件目", attachmentIds: [] },
  });
  const response = responseRecorder();

  await handler(
    { method: "POST", headers: {} },
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/messages`,
    ),
    { id: userId },
  );

  assert.equal(response.statusCode, 409);
  assert.equal(
    response.payload.error.code,
    "AI_ASSISTANT_RESPONSE_IN_PROGRESS",
  );
  assert.equal(started, false);
});

test("Attachment Bind 失敗時は Local Task を Failed へ確定する", async () => {
  let failed;
  let started = false;
  const repository = {
    async getOwned() {
      return mappedSession();
    },
    async listTasksOwned() {
      return [];
    },
    async createTask(input) {
      return mappedTask({
        id: input.id,
        status: "queued",
        prompt: input.prompt,
        attachments: input.attachments,
        routing: input.routing,
        final_report: null,
        completed_at: null,
      });
    },
    async failTask(id, code, message) {
      failed = { id, code, message };
    },
  };
  const handler = routeHandler({
    repository,
    runner: taskRunner({
      start() {
        started = true;
      },
    }),
    attachmentStore: {
      async resolveForTask() {
        return [{
          id: attachmentId,
          name: "失敗.pdf",
          contentType: "application/pdf",
          size: 1,
          sha256: "b".repeat(64),
        }];
      },
      async bindToTask() {
        throw Object.assign(new Error("Attachment bind failed."), {
          code: "AI_ASSISTANT_ATTACHMENT_BIND_FAILED",
        });
      },
    },
    body: { prompt: "確認", attachmentIds: [attachmentId] },
  });
  const response = responseRecorder();

  await handler(
    { method: "POST", headers: {} },
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/messages`,
    ),
    { id: userId },
  );

  assert.equal(started, false);
  assert.equal(failed.code, "AI_ASSISTANT_ATTACHMENT_BIND_FAILED");
  assert.match(failed.id, /^[0-9a-f-]{36}$/);
  assert.equal(response.statusCode, 502);
});

test("Session Detail は Local Task の公開項目だけを返す", async () => {
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return mappedSession();
      },
      async listTasksOwned(sessionId, ownerId) {
        assert.equal(sessionId, conversationId);
        assert.equal(ownerId, userId);
        return [mappedTask()];
      },
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

  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.tasks.length, 1);
  assert.deepEqual(
    Object.keys(response.payload.tasks[0]).sort(),
    [
      "attachments",
      "completed_at",
      "conversation_id",
      "created_at",
      "error",
      "errorCode",
      "final_report",
      "id",
      "inquiryContext",
      "prompt",
      "routing",
      "status",
    ].sort(),
  );
  assert.equal(response.payload.tasks[0].final_report.summary, "整理済みです。");
});

test("公開 Task から Provider 内部情報を除外する", () => {
  const task = publicAiAssistantTask(mappedTask());

  assert.equal("providerResponseId" in task, false);
  assert.equal("providerOutput" in task, false);
  assert.equal("tokenUsage" in task, false);
  assert.equal("modelSettingId" in task, false);
  assert.deepEqual(task.routing, {
    taskClass: "COMPLEX_ANALYSIS",
  });
  assert.equal("modelSettingId" in task.routing, false);
  assert.equal("model" in task.routing, false);
  assert.equal("taskFingerprint" in task.routing, false);
  assert.equal(task.errorCode, null);
});

test("Task SSE は Local Event Ledger を Resume Cursor から返す", async () => {
  const calls = [];
  const events = [
    {
      event_id: "event-3",
      task_id: taskId,
      sequence: 3,
      type: "agent.message.delta",
      timestamp: "2026-08-11T00:00:03.000Z",
      data: { delta: "回答" },
    },
    {
      event_id: "event-4",
      task_id: taskId,
      sequence: 4,
      type: "task.completed",
      timestamp: "2026-08-11T00:00:04.000Z",
      data: {},
    },
  ];
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return mappedSession({ lastTaskId: taskId });
      },
      async listTaskEventsOwned(...args) {
        calls.push(args);
        return { taskStatus: "completed", events };
      },
    },
  });
  const streamed = streamResponseRecorder();

  await handler(
    { method: "GET", headers: { "last-event-id": "2" } },
    streamed.response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/events?task_id=${taskId}&after_sequence=1&follow=true`,
    ),
    { id: userId },
  );

  assert.equal(streamed.response.statusCode, 200);
  assert.equal(
    streamed.response.responseHeaders["Content-Type"],
    "text/event-stream; charset=utf-8",
  );
  assert.deepEqual(calls[0], [conversationId, userId, taskId, 2, 200]);
  assert.match(streamed.body(), /id: 3/);
  assert.match(streamed.body(), /event: agent\.message\.delta/);
  assert.match(streamed.body(), /"delta":"回答"/);
  assert.match(streamed.body(), /event: task\.completed/);
});

test("Task SSE は活動 Task を Local Ledger 上の終端まで追跡する", async () => {
  let callCount = 0;
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return mappedSession({ lastTaskId: taskId });
      },
      async listTaskEventsOwned() {
        callCount += 1;
        if (callCount === 1) {
          return {
            taskStatus: "running",
            events: [{
              event_id: "event-1",
              task_id: taskId,
              sequence: 1,
              type: "task.started",
              timestamp: "2026-08-11T00:00:01.000Z",
              data: {},
            }],
          };
        }
        return {
          taskStatus: "cancelled",
          events: [{
            event_id: "event-2",
            task_id: taskId,
            sequence: 2,
            type: "task.cancelled",
            timestamp: "2026-08-11T00:00:02.000Z",
            data: {},
          }],
        };
      },
    },
    eventPollIntervalMs: 10,
  });
  const streamed = streamResponseRecorder();

  await handler(
    { method: "GET", headers: {} },
    streamed.response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/events?task_id=${taskId}&follow=true`,
    ),
    { id: userId },
  );

  assert.equal(callCount, 2);
  assert.match(streamed.body(), /event: task\.started/);
  assert.match(streamed.body(), /event: task\.cancelled/);
});

test("別 Session の Task SSE は Header 送信前に 404 とする", async () => {
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return mappedSession();
      },
      async listTaskEventsOwned() {
        throw Object.assign(new Error("AI assistant task was not found."), {
          code: "AI_ASSISTANT_TASK_NOT_FOUND",
        });
      },
    },
  });
  const response = responseRecorder();

  await handler(
    { method: "GET", headers: {} },
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/events?task_id=${taskId}`,
    ),
    { id: userId },
  );

  assert.equal(response.headersSent, false);
  assert.equal(response.statusCode, 404);
  assert.equal(response.payload.error.code, "AI_ASSISTANT_TASK_NOT_FOUND");
});

test("Stop は Local Ledger に要求を保存して該当 Runner だけを中断する", async () => {
  let cancellationArgs;
  const cancelled = [];
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return mappedSession({ lastTaskId: taskId });
      },
      async requestCancelOwned(...args) {
        cancellationArgs = args;
        return {
          status: "requested",
          task: mappedTask({ status: "running", final_report: null }),
        };
      },
    },
    runner: taskRunner({
      cancel(id) {
        cancelled.push(id);
        return true;
      },
    }),
  });
  const response = responseRecorder();

  await handler(
    { method: "POST", headers: {} },
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/tasks/${taskId}/cancel`,
    ),
    { id: userId },
  );

  assert.deepEqual(cancellationArgs, [conversationId, userId, taskId]);
  assert.deepEqual(cancelled, [taskId]);
  assert.equal(response.statusCode, 202);
  assert.deepEqual(response.payload, { accepted: true, taskId });
});

test("終端済み Task への Stop は Runner を中断しない", async () => {
  let cancelled = false;
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return mappedSession({ lastTaskId: taskId });
      },
      async requestCancelOwned() {
        return { status: "already_terminal", task: mappedTask() };
      },
    },
    runner: taskRunner({
      cancel() {
        cancelled = true;
      },
    }),
  });
  const response = responseRecorder();

  await handler(
    { method: "POST", headers: {} },
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/tasks/${taskId}/cancel`,
    ),
    { id: userId },
  );

  assert.equal(cancelled, false);
  assert.deepEqual(response.payload, { accepted: false, taskId });
});

test("最新 Task 以外への Stop は 404 として隔離する", async () => {
  let cancelled = false;
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return mappedSession({ lastTaskId: taskId });
      },
      async requestCancelOwned() {
        throw Object.assign(new Error("AI assistant task was not found."), {
          code: "AI_ASSISTANT_TASK_NOT_FOUND",
        });
      },
    },
    runner: taskRunner({
      cancel() {
        cancelled = true;
      },
    }),
  });
  const response = responseRecorder();

  await handler(
    { method: "POST", headers: {} },
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/tasks/${taskId}/cancel`,
    ),
    { id: userId },
  );

  assert.equal(cancelled, false);
  assert.equal(response.statusCode, 404);
  assert.equal(response.payload.error.code, "AI_ASSISTANT_TASK_NOT_FOUND");
});

test("Session 削除は所有確認後に Local Task と Event を Cascade 削除する", async () => {
  const calls = [];
  const handler = routeHandler({
    repository: {
      async getOwned(sessionId, ownerId) {
        calls.push(["get", sessionId, ownerId]);
        return mappedSession();
      },
      async remove(sessionId, ownerId) {
        calls.push(["remove", sessionId, ownerId]);
        return { id: sessionId };
      },
    },
  });
  const request = { method: "DELETE", headers: {} };
  const response = responseRecorder();

  await handler(
    request,
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}`,
    ),
    { id: userId },
  );

  assert.deepEqual(calls, [
    ["get", conversationId, userId],
    ["remove", conversationId, userId],
  ]);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, { deleted: true });
  assert.deepEqual(request.auditContext, { conversationId });
});

test("活動 Task がある Session の Archive を 409 とする", async () => {
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return mappedSession({ lastTaskId: taskId });
      },
      async archive() {
        return false;
      },
    },
  });
  const response = responseRecorder();

  await handler(
    { method: "POST", headers: {} },
    response,
    new URL(
      `https://oneops.example.test/api/work-center/v1/ai-assistant/sessions/${conversationId}/archive`,
    ),
    { id: userId },
  );

  assert.equal(response.statusCode, 409);
  assert.equal(
    response.payload.error.code,
    "AI_ASSISTANT_RESPONSE_IN_PROGRESS",
  );
});

test("所有 Mapping がない Session は Local 履歴を返さない", async () => {
  let listed = false;
  const handler = routeHandler({
    repository: {
      async getOwned() {
        return null;
      },
      async listTasksOwned() {
        listed = true;
        return [];
      },
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

  assert.equal(listed, false);
  assert.equal(response.statusCode, 404);
  assert.equal(response.payload.error.code, "AI_ASSISTANT_SESSION_NOT_FOUND");
});
