import assert from "node:assert/strict";
import test from "node:test";
import {
  BacklogTaskConnector,
  InquiryTaskConnector,
  createPersonalTaskSyncService,
  normalizeExternalAccountInput,
  normalizePersonalTaskInput,
} from "./personal-task-connectors.mjs";
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
    reviewCycle: "CUSTOM",
    customReviewDays: 14,
  });
  assert.equal(longTerm.valid, true);
  assert.equal(longTerm.value.customReviewDays, 14);
});

test("タスク種別に必要な日付を検証する", () => {
  const deadline = normalizePersonalTaskInput({
    title: "期限なし",
    taskType: "DEADLINE",
  });
  assert.equal(deadline.valid, false);
  assert.ok(deadline.errors.dueAt);

  const longTerm = normalizePersonalTaskInput({
    title: "確認日なし",
    taskType: "LONG_TERM",
    reviewCycle: "WEEKLY",
  });
  assert.equal(longTerm.valid, false);
  assert.ok(longTerm.errors.nextReviewAt);
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

test("Backlog は本人、プロジェクト、状態と更新日で担当課題を取得する", async () => {
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
        status: { name: "処理中" },
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
    filters: { projectIds: ["7"], statusIds: ["2"] },
    lastCursor: "2026-07-30T00:00:00Z",
  });
  assert.equal(result.items[0].externalKey, "OPS-100");
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

test("問合せ接続は個人認証情報と担当条件を既存クライアントへ渡す", async () => {
  let received;
  const connector = new InquiryTaskConnector({
    sourceClient: {
      async search(settings, filters) {
        received = { settings, filters };
        return {
          tickets: [
            {
              ticketNo: "94056",
              title: "給与明細",
              status: "対応中",
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
    externalUsername: "X0001",
    credential: "password",
    filters: { status: "open", assignee: "33" },
  });
  assert.equal(received.settings.username, "X0001");
  assert.equal(received.settings.password, "password");
  assert.equal(received.filters.assignee, "33");
  assert.equal(result.items[0].externalObjectId, "94056");
});

test("同期サービスは候補の追加件数と履歴を確定する", async () => {
  const completed = [];
  const repository = {
    async beginSync(ownerUserId, accountId) {
      return {
        client: {},
        run: { id: "run", ownerUserId, externalAccountId: accountId },
      };
    },
    async getAccount() {
      return {
        id: "account",
        providerCode: "BACKLOG",
        credential: "secret",
      };
    },
    async upsertCandidates(_owner, _account, items) {
      assert.equal(items.length, 1);
      return { createdCount: 1, updatedCount: 0 };
    },
    async finishSync(_handle, value) {
      completed.push(value);
      return value;
    },
    async listDueAccounts() {
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
  const run = await service.sync("owner", "account");
  assert.equal(run.status, "SUCCESS");
  assert.equal(completed[0].createdCount, 1);
  assert.equal(completed[0].cursor, "cursor");
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
