import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  BacklogTaskConnector,
  InquiryTaskConnector,
  createPersonalTaskSyncService,
  isExternalTaskTerminalStatus,
  normalizeExternalAccountInput,
  normalizeInquiryCandidateFilters,
  normalizePersonalTaskInput,
} from "./personal-task-connectors.mjs";
import { createPersonalTaskPromptService } from "./personal-task-ai.mjs";
import { createPersonalTaskRouteHandler } from "./personal-task-routes.mjs";

test("期限タスクと長期タスクを業務規則に従って正規化する", () => {
  const deadline = normalizePersonalTaskInput({
    title: "回答期限を確認",
    taskType: "DEADLINE",
    status: "TODO",
    priority: "HIGH",
    dueAt: "2026-08-01T09:00:00+09:00",
  });
  assert.equal(deadline.valid, true);
  assert.equal(deadline.value.reviewCycle, null);

  const longTerm = normalizePersonalTaskInput({
    title: "運用改善",
    taskType: "LONG_TERM",
    status: "IN_PROGRESS",
    priority: "NORMAL",
    nextReviewAt: "2026-08-07T09:00:00+09:00",
  });
  assert.equal(longTerm.valid, true);
  assert.equal(longTerm.value.customReviewDays, null);
  assert.equal(longTerm.value.reviewCycle, null);

  const semantic = normalizePersonalTaskInput({
    title: "条件発動",
    taskType: "LONG_TERM",
    automationPrompt: "新しい問い合わせが登録されたら確認する",
  });
  assert.equal(semantic.valid, true);
  assert.equal(semantic.value.nextReviewAt, null);
  assert.equal(semantic.value.promptScheduleEnabled, false);
});

test("期限タスクの期限と長期タスクの発動条件を検証する", () => {
  const deadline = normalizePersonalTaskInput({
    title: "期限なし",
    taskType: "DEADLINE",
  });
  assert.equal(deadline.valid, false);
  assert.ok(deadline.errors.dueAt);

  const longTerm = normalizePersonalTaskInput({
    title: "確認日なし",
    taskType: "LONG_TERM",
  });
  assert.equal(longTerm.valid, true);
  assert.equal(longTerm.value.nextReviewAt, null);
  assert.equal(longTerm.value.reviewCycle, null);

  const invalidTrigger = normalizePersonalTaskInput({
    title: "条件の重複",
    taskType: "LONG_TERM",
    nextReviewAt: "2026-08-07T09:00:00+09:00",
    automationPrompt: "別の条件",
  });
  assert.equal(invalidTrigger.valid, false);
  assert.ok(invalidTrigger.errors.triggerCondition);
});

test("個人タスクの AI 分析を既定 GPT Model の Session と Task へ登録する", async () => {
  let completedPayload;
  let createdTaskInput;
  let startedTaskId = "";
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ];
  const service = createPersonalTaskPromptService({
    repository: {
      async createPromptRun(ownerUserId, taskId, triggerType) {
        assert.equal(ownerUserId, "owner-1");
        assert.equal(taskId, "task-1");
        assert.equal(triggerType, "MANUAL");
        return { id: "run-1" };
      },
      async completePromptRun(ownerUserId, runId, payload) {
        assert.equal(ownerUserId, "owner-1");
        assert.equal(runId, "run-1");
        completedPayload = payload;
        return { id: runId, ...payload };
      },
      async failPromptRun() {
        assert.fail("成功経路で失敗記録を作成してはならない");
      },
    },
    aiAssistantRepository: {
      async create(input) {
        assert.equal(
          input.conversationId,
          "11111111-1111-4111-8111-111111111111",
        );
        assert.equal(input.ownerUserId, "owner-1");
        assert.equal(input.title, "タスク: 回答期限を確認");
        assert.equal(input.modelSettingId, "model-1");
        assert.equal(input.modelSnapshot, "gpt-5.6-terra");
        assert.equal(input.reasoningEffortSnapshot, "HIGH");
        assert.equal(input.speedLevelSnapshot, "FAST");
        return { id: input.conversationId };
      },
      async createTask(input) {
        createdTaskInput = input;
        return { id: input.id };
      },
    },
    modelSettingsRepository: {
      async getDefaultAssistantModel() {
        return {
          id: "model-1",
          purpose: "GENERAL",
          provider: "OPENAI",
          model: "gpt-5.6-terra",
          reasoningEffort: "HIGH",
          speedLevel: "FAST",
          enabled: true,
        };
      },
    },
    taskRunner: {
      start(taskId) {
        startedTaskId = taskId;
      },
    },
    idFactory: () => ids.shift(),
  });

  const result = await service.execute(
    "owner-1",
    {
      id: "task-1",
      title: "回答期限を確認",
      taskType: "DEADLINE",
      status: "TODO",
    },
    "MANUAL",
  );

  assert.equal(
    completedPayload.message,
    "AIアシスタントに分析を依頼しました。結果は同じ会話で確認できます。",
  );
  assert.equal(
    completedPayload.assistantSessionId,
    "11111111-1111-4111-8111-111111111111",
  );
  assert.equal(result.assistantSessionId, "11111111-1111-4111-8111-111111111111");
  assert.equal(result.assistantTaskId, "22222222-2222-4222-8222-222222222222");
  assert.equal(completedPayload.assistantTaskId, result.assistantTaskId);
  assert.equal(createdTaskInput.conversationId, result.assistantSessionId);
  assert.equal(createdTaskInput.ownerUserId, "owner-1");
  assert.equal(createdTaskInput.requestId, "personal-task:run-1");
  assert.equal(createdTaskInput.routing.selectionReason, "SESSION_STARTING_MODEL");
  assert.equal(createdTaskInput.routing.model, "gpt-5.6-terra");
  assert.match(createdTaskInput.prompt, /タスク名: 回答期限を確認/);
  assert.equal(startedTaskId, result.assistantTaskId);
});

test("Prompt Run の完了記録に失敗した場合は作成済み Assistant Task を Failed へ確定する", async () => {
  const completionError = Object.assign(new Error("Prompt Run update failed."), {
    code: "PERSONAL_TASK_RUN_WRITE_FAILED",
  });
  let failedPromptRunCode = "";
  let failedAssistantTask = null;
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ];
  const service = createPersonalTaskPromptService({
    repository: {
      async createPromptRun() { return { id: "run-1" }; },
      async completePromptRun() { throw completionError; },
      async failPromptRun(_ownerUserId, _runId, error) {
        failedPromptRunCode = error.code;
      },
    },
    aiAssistantRepository: {
      async create(input) { return { id: input.conversationId }; },
      async createTask(input) { return { id: input.id }; },
      async failTask(taskId, code, message) {
        failedAssistantTask = { taskId, code, message };
      },
    },
    modelSettingsRepository: {
      async getDefaultAssistantModel() {
        return {
          id: "model-1",
          purpose: "GENERAL",
          provider: "OPENAI",
          model: "gpt-5.6-terra",
          reasoningEffort: "HIGH",
          speedLevel: "FAST",
          enabled: true,
        };
      },
    },
    taskRunner: {
      start() {
        assert.fail("Prompt Run の完了記録前に GPT Runner を開始してはならない");
      },
    },
    idFactory: () => ids.shift(),
  });

  await assert.rejects(
    () => service.execute(
      "owner-1",
      { id: "task-1", title: "確認", taskType: "DEADLINE", status: "TODO" },
      "MANUAL",
    ),
    completionError,
  );

  assert.equal(failedPromptRunCode, "PERSONAL_TASK_RUN_WRITE_FAILED");
  assert.deepEqual(failedAssistantTask, {
    taskId: "22222222-2222-4222-8222-222222222222",
    code: "PERSONAL_TASK_RUN_WRITE_FAILED",
    message: "Personal task AI request could not start.",
  });
});

test("個人タスクの Task Ledger 競合を Prompt Run の失敗へ記録する", async () => {
  let failedCode = "";
  const lockError = Object.assign(
    new Error("An AI assistant response is already in progress."),
    { code: "AI_ASSISTANT_RESPONSE_IN_PROGRESS" },
  );
  const service = createPersonalTaskPromptService({
    repository: {
      async createPromptRun() {
        return { id: "run-locked" };
      },
      async completePromptRun() {
        assert.fail("Lock 競合時に完了記録を作成してはならない");
      },
      async failPromptRun(_ownerUserId, _runId, error) {
        failedCode = error.code;
      },
    },
    aiAssistantRepository: {
      async create(input) {
        return { id: input.conversationId };
      },
      async createTask(input) {
        assert.equal(input.ownerUserId, "owner-locked");
        throw lockError;
      },
    },
    modelSettingsRepository: {
      async getDefaultAssistantModel() {
        return {
          id: "model-1",
          purpose: "GENERAL",
          provider: "OPENAI",
          model: "gpt-5.6-terra",
          reasoningEffort: "MEDIUM",
          speedLevel: "FAST",
          enabled: true,
        };
      },
    },
    taskRunner: {
      start() {
        assert.fail("Task 登録失敗時に GPT Runner を開始してはならない");
      },
    },
    idFactory: (() => {
      const ids = [
        "33333333-3333-4333-8333-333333333333",
        "44444444-4444-4444-8444-444444444444",
      ];
      return () => ids.shift();
    })(),
  });

  await assert.rejects(
    () => service.execute(
      "owner-locked",
      {
        id: "task-locked",
        title: "Lock 検証",
        taskType: "DEADLINE",
        status: "TODO",
      },
      "MANUAL",
    ),
    (error) => error === lockError,
  );

  assert.equal(failedCode, "AI_ASSISTANT_RESPONSE_IN_PROGRESS");
});

test("個人タスク AI は既定 GPT Model がない場合に安定した設定エラーを返す", async () => {
  let failedCode = "";
  const service = createPersonalTaskPromptService({
    repository: {
      async createPromptRun() { return { id: "run-no-model" }; },
      async failPromptRun(_ownerUserId, _runId, error) {
        failedCode = error.code;
      },
    },
    aiAssistantRepository: {},
    modelSettingsRepository: {
      async getDefaultAssistantModel() { return null; },
    },
    taskRunner: { start() {} },
  });

  await assert.rejects(
    () => service.execute(
      "owner-no-model",
      {
        id: "task-no-model",
        title: "Model 設定確認",
        taskType: "DEADLINE",
        status: "TODO",
      },
      "MANUAL",
    ),
    (error) => error.code === "PERSONAL_TASK_AI_CONFIGURATION_REQUIRED",
  );
  assert.equal(failedCode, "PERSONAL_TASK_AI_CONFIGURATION_REQUIRED");
});

test("個人タスク Prompt API は Assistant Task ID を監査と応答へ返す", async () => {
  let responseStatus = 0;
  let responseBody;
  const request = { method: "POST" };
  const taskId = "55555555-5555-4555-8555-555555555555";
  const handler = createPersonalTaskRouteHandler({
    repository: {
      async getTask(ownerUserId, receivedTaskId) {
        assert.equal(ownerUserId, "owner-route");
        assert.equal(receivedTaskId, taskId);
        return {
          id: taskId,
          title: "Route 検証",
          taskType: "DEADLINE",
          status: "TODO",
        };
      },
    },
    connectorRegistry: {},
    syncService: {},
    promptService: {
      async execute() {
        return {
          run: { id: "prompt-run-1" },
          assistantSessionId: "66666666-6666-4666-8666-666666666666",
          assistantTaskId: "77777777-7777-4777-8777-777777777777",
        };
      },
    },
    sendJson(_response, status, body) {
      responseStatus = status;
      responseBody = body;
    },
    readJsonBody: async () => ({}),
  });

  const handled = await handler(
    request,
    {},
    new URL(
      `https://oneops.test/api/work-center/v1/personal-tasks/${taskId}/prompt-runs`,
    ),
    {
      id: "owner-route",
      systemPermissions: ["ai.assistant.use"],
    },
  );

  assert.equal(handled, true);
  assert.equal(responseStatus, 202);
  assert.equal(
    responseBody.assistantTaskId,
    "77777777-7777-4777-8777-777777777777",
  );
  assert.deepEqual(request.auditContext, {
    personalTaskId: taskId,
    promptRunId: "prompt-run-1",
    assistantSessionId: "66666666-6666-4666-8666-666666666666",
    assistantTaskId: "77777777-7777-4777-8777-777777777777",
  });
});

test("Gateway Server は AI Assistant と個人タスクで同じ GPT Runner を使用する", async () => {
  const source = await readFile(new URL("./server.mjs", import.meta.url), "utf8");
  assert.match(source, /createAiAssistantOpenAiRunner/);
  assert.match(source, /recoverInterruptedTasks\(\)/);
  assert.match(source, /taskRunner: aiAssistantTaskRunner/g);
  assert.match(
    source,
    /aiAssistantRunnerShutdown = aiAssistantTaskRunner\.shutdown\(\)/,
  );
  assert.match(source, /await aiAssistantRunnerShutdown/);
  assert.doesNotMatch(source, /OPS_AI_ASSISTANT_GATEWAY_ID/);
  assert.doesNotMatch(source, /OPS_AI_ASSISTANT_PROJECT_REF/);
  assert.doesNotMatch(source, /OPS_AI_ASSISTANT_RUNTIME_PROFILE/);
});

test("外部接続先を許可済み HTTPS ホストへ限定する", () => {
  assert.equal(
    normalizeExternalAccountInput({
      providerCode: "INQUIRY",
      displayName: "問合せ",
      baseUrl: "https://ss.onehr.jp/",
      externalUsername: "X0001",
      credential: "secret",
    }).valid,
    true,
  );
  assert.equal(
    normalizeExternalAccountInput({
      providerCode: "BACKLOG",
      displayName: "Backlog",
      baseUrl: "https://example.backlog.com/",
      credential: "secret",
    }).valid,
    true,
  );
  const blocked = normalizeExternalAccountInput({
    providerCode: "BACKLOG",
    displayName: "不正",
    baseUrl: "https://127.0.0.1/",
    credential: "secret",
  });
  assert.equal(blocked.valid, false);
  assert.ok(blocked.errors.baseUrl);
});

test("Backlog 検索条件は数値の物理 ID だけを受け付ける", () => {
  const valid = normalizeExternalAccountInput({
    providerCode: "BACKLOG", displayName: "Backlog",
    baseUrl: "https://example.backlog.com/", credential: "secret",
    filters: { projectIds: ["155893", "155893"], statusIds: ["1"] },
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.value.filters, { projectIds: ["155893"], statusIds: ["1"] });
  const invalid = normalizeExternalAccountInput({
    providerCode: "BACKLOG", displayName: "Backlog",
    baseUrl: "https://example.backlog.com/", credential: "secret",
    filters: { projectIds: ["TS2_ITS"], statusIds: [] },
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.projectIds, /numeric IDs/);
});

test("問合せ候補条件は外部契約値と再生成 Migration を使用する", async () => {
  const me = normalizeInquiryCandidateFilters({ status: "open", assigneeMode: "ME", assignee: "X02851" });
  assert.equal(me.valid, true); assert.equal(me.value.assignee, "");
  assert.equal(normalizeInquiryCandidateFilters({ status: "closed", assigneeMode: "ME" }).valid, false);
  const migration = await readFile(new URL("../db/migrations/033_harden_personal_task_candidate_generation.sql", import.meta.url), "utf8");
  assert.match(migration, /last_generated_filter_revision/); assert.match(migration, /'STALE'/); assert.match(migration, /'REGENERATE'/);
});

test("Backlog は統一档案の外部ユーザー物理 ID、プロジェクト、状態と更新日で担当課題を取得する", async () => {
  const requests = [];
  const fetchImpl = async (url) => {
    requests.push(new URL(url));
    if (url.pathname.endsWith("/users/myself")) {
      return Response.json({ id: 42, name: "担当者" });
    }
    return Response.json([
      {
        id: 100,
        issueKey: "OPS-100",
        projectId: 7,
        summary: "確認事項",
        description: "詳細",
        status: { id: 2, name: "処理中" },
        assignee: { name: "担当者" },
        priority: { name: "高" },
        dueDate: "2026-08-01",
        created: "2026-07-30T01:00:00Z",
        updated: "2026-07-31T01:00:00Z",
      },
    ]);
  };
  const connector = new BacklogTaskConnector({ fetchImpl });
  const result = await connector.fetchItems({
    baseUrl: "https://example.backlog.com/",
    credential: "api-secret",
    externalUserId: "42",
    filters: { projectIds: ["7"], statusIds: ["2"] },
    lastCursor: "2026-07-30T00:00:00Z",
  });
  assert.equal(result.items[0].externalKey, "OPS-100");
  assert.equal(result.items[0].terminal, false);
  assert.equal(result.items[0].sourceData.statusId, 2);
  const issueRequest = requests.find((url) =>
    url.pathname.endsWith("/api/v2/issues"),
  );
  assert.deepEqual(issueRequest.searchParams.getAll("projectId[]"), ["7"]);
  assert.deepEqual(issueRequest.searchParams.getAll("statusId[]"), ["2"]);
  assert.deepEqual(issueRequest.searchParams.getAll("assigneeId[]"), ["42"]);
  assert.equal(issueRequest.searchParams.get("updatedSince"), "2026-07-30");
  assert.equal(issueRequest.searchParams.get("apiKey"), "api-secret");
});

test("Backlog の認証エラーと権限エラーを分類する", async () => {
  for (const [status, code] of [
    [401, "BACKLOG_AUTHENTICATION_FAILED"],
    [403, "BACKLOG_ACCESS_DENIED"],
  ]) {
    const connector = new BacklogTaskConnector({
      fetchImpl: async () => new Response(null, { status }),
    });
    await assert.rejects(
      connector.testConnection({
        baseUrl: "https://example.backlog.com/",
        credential: "api-secret",
      }),
      (error) => error.code === code,
    );
  }
});

test("Backlog の安全なエラー本文を同期診断へ保持する", async () => {
  const connector = new BacklogTaskConnector({
    fetchImpl: async () => Response.json(
      { errors: [{ message: "Invalid projectId.", code: 7, moreInfo: "" }] },
      { status: 400 },
    ),
  });
  await assert.rejects(
    connector.request(
      { baseUrl: "https://example.backlog.com/", credential: "api-secret" },
      "/api/v2/issues",
    ),
    (error) => error.code === "BACKLOG_REQUEST_FAILED" &&
      error.message === "Backlog returned status 400: Invalid projectId.",
  );
});

test("Backlog の 429 応答を一度だけ待機して再試行する", async () => {
  let requestCount = 0;
  const connector = new BacklogTaskConnector({
    fetchImpl: async () => {
      requestCount += 1;
      if (requestCount === 1) {
        return new Response(null, {
          status: 429,
          headers: {
            "x-ratelimit-reset": String(Math.floor(Date.now() / 1000)),
          },
        });
      }
      return Response.json({ id: 42, name: "担当者" });
    },
  });
  const result = await connector.request(
    {
      baseUrl: "https://example.backlog.com/",
      credential: "api-secret",
    },
    "/api/v2/users/myself",
  );
  assert.equal(result.id, 42);
  assert.equal(requestCount, 2);
});

test("Backlog のタイムアウトを安全なエラーコードへ変換する", async () => {
  const connector = new BacklogTaskConnector({
    fetchImpl: async () => {
      const error = new Error("timed out");
      error.name = "TimeoutError";
      throw error;
    },
  });
  await assert.rejects(
    connector.testConnection({
      baseUrl: "https://example.backlog.com/",
      credential: "api-secret",
    }),
    (error) =>
      error.code === "BACKLOG_TIMEOUT" &&
      error.message === "Backlog request timed out.",
  );
});

test("問合せ接続はシステム共通認証情報と統一档案の担当者 ID を既存クライアントへ渡す", async () => {
  let received;
  const connector = new InquiryTaskConnector({
    sourceClient: {
      async options() { return { assignees: [{ value: "33", label: "社内/担当者" }] }; },
      async search(settings, filters) {
        received = { settings, filters };
        return {
          tickets: [
            {
              ticketNo: "94056",
              title: "給与明細",
              status: "OPEN\n回答中",
              assignee: "担当者",
              createdAt: "2026-07-30T00:00:00+09:00",
              updatedAt: "2026-07-31T00:00:00+09:00",
            },
          ],
        };
      },
    },
  });
  const result = await connector.fetchItems({
    id: "account-id",
    revision: 1,
    baseUrl: "https://ss.onehr.jp/",
    systemUsername: "SYSTEM_USER",
    externalUserId: "33",
    ownerDisplayName: "担当者",
    credential: "password",
    filters: { status: "open", assigneeMode: "SPECIFIC_ASSIGNEE", assignee: "33" },
  });
  assert.equal(received.settings.username, "SYSTEM_USER");
  assert.equal(received.settings.password, "password");
  assert.equal(received.filters.assignee, "33");
  assert.equal(received.filters.assigneeName, "");
  assert.equal(result.items[0].externalObjectId, "94056");
});

test("問合せ候補は統一档案の外部物理 ID を使用し、切捨て結果を拒否する", async () => {
  let received;
  const connector = new InquiryTaskConnector({ sourceClient: {
    async options() { return { assignees: [{ value: "113210", label: "社内/孫 紹煊" }] }; },
    async search(_settings, filters) { received = filters; return { sourceTruncated: false, tickets: [] }; },
  } });
  await connector.fetchItems({ id: "a", revision: 1, baseUrl: "https://ss.onehr.jp/", systemUsername: "SYSTEM", externalUserId: "113210", credential: "x", filters: { status: "open" } });
  assert.equal(received.assignee, "113210");
  const truncated = new InquiryTaskConnector({ sourceClient: { async options() { return { assignees: [{ value: "113210", label: "社内/孫 紹煊" }] }; }, async search() { return { sourceTruncated: true, actualCount: 75452, displayedCount: 500, tickets: [] }; } } });
  await assert.rejects(truncated.fetchItems({ id: "a", revision: 1, baseUrl: "https://ss.onehr.jp/", systemUsername: "SYSTEM", externalUserId: "113210", credential: "x", filters: { status: "open" } }), (error) => error.code === "INQUIRY_CANDIDATE_RESULT_TRUNCATED");
});

test("同期サービスは統一档案の候補追加件数と同期状態を確定する", async () => {
  const completed = [];
  const repository = {
    async upsertCandidates(_owner, _profile, _system, items) {
      assert.equal(items.length, 1);
      return { createdCount: 1, updatedCount: 0 };
    },
    async finishProfileSync(_profileId, value) {
      completed.push(value);
      return value;
    },
    async listDueProfiles() {
      return [];
    },
  };
  const service = createPersonalTaskSyncService({
    repository,
    connectorRegistry: {
      get() {
        return {
          async fetchItems() {
            return {
              items: [{ externalObjectId: "1" }],
              cursor: "cursor",
            };
          },
        };
      },
      safeError(error) {
        return { code: "FAILED", message: error.message };
      },
    },
  });
  const run = await service.sync({ id: "profile", ownerUserId: "owner", externalSystemId: "system", providerCode: "BACKLOG" });
  assert.equal(run.createdCount, 1);
  assert.equal(completed[0].status, "SUCCESS");
  assert.equal(completed[0].cursor, "cursor");
});

test("外部終了状態を候補対象外として識別する", () => {
  for (const status of ["完了", "処理済み", "処理済", "解決済み", "DONE", "Resolved"]) {
    assert.equal(isExternalTaskTerminalStatus("BACKLOG", status), true);
  }
  assert.equal(isExternalTaskTerminalStatus("BACKLOG", "処理中"), false);
  assert.equal(
    isExternalTaskTerminalStatus("INQUIRY", "CLOSED\n回答済"),
    true,
  );
  assert.equal(
    isExternalTaskTerminalStatus("INQUIRY", "OPEN\n回答中"),
    false,
  );
});

test("候補同期は外部リンクを統一ユーザー档案物理 ID で更新する", async () => {
  const databaseSource = await readFile(
    new URL("./personal-task-database.mjs", import.meta.url),
    "utf8",
  );
  assert.match(
    databaseSource,
    /WHERE owner_user_id = \$1\s+AND user_external_profile_id = \$2[\s\S]*?\[\s*ownerUserId,\s*profileId,/,
  );
  assert.doesNotMatch(databaseSource, /external_account_id/);
});

test("外部終了案件は新規候補と通知を作成しない", async () => {
  const databaseSource = await readFile(
    new URL("./personal-task-database.mjs", import.meta.url),
    "utf8",
  );
  assert.match(databaseSource, /if \(item\.terminal\)/);
  assert.match(databaseSource, /disposition = 'STALE'/);
  assert.match(databaseSource, /DELETE FROM user_notifications/);
  assert.match(databaseSource, /continue;[\s\S]*?INSERT INTO personal_task_candidates/);

  const migration = await readFile(
    new URL(
      "../db/migrations/054_exclude_terminal_external_task_candidates.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /system\.code = 'BACKLOG'/);
  assert.match(migration, /system\.code = 'INQUIRY'/);
  assert.match(migration, /DELETE FROM user_notifications/);
  assert.match(migration, /SET disposition = 'STALE'/);
});

test("個人タスク API は現在ユーザー ID を Repository 境界へ渡す", async () => {
  let owner;
  let responseBody;
  const handler = createPersonalTaskRouteHandler({
    repository: {
      async listTasks(ownerUserId) {
        owner = ownerUserId;
        return [];
      },
    },
    connectorRegistry: {},
    syncService: {},
    aiAssistantRepository: {},
    agentGatewaySettingsRepository: {},
    sendJson(_response, _status, body) {
      responseBody = body;
    },
    readJsonBody: async () => ({}),
  });
  const handled = await handler(
    { method: "GET" },
    {},
    new URL("https://oneops.test/api/work-center/v1/personal-tasks"),
    { id: "user-physical-id", systemPermissions: [] },
  );
  assert.equal(handled, true);
  assert.equal(owner, "user-physical-id");
  assert.deepEqual(responseBody, { tasks: [] });
});
