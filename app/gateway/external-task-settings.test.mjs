import assert from "node:assert/strict";
import test from "node:test";
import {
  BacklogSystemSourceClient,
  validateBacklogSourceSettings,
} from "./external-task-settings.mjs";

test("Backlog の API URL は省略でき、ログイン URL と同一 Origin に限定する", () => {
  const fallback = validateBacklogSourceSettings({
    baseUrl: "https://example.backlog.com/",
    apiUrl: "",
    username: "shared-user",
    password: "shared-password",
    enabled: true,
  });
  assert.equal(fallback.valid, true);
  assert.equal(fallback.value.apiUrl, "");

  const crossOrigin = validateBacklogSourceSettings({
    baseUrl: "https://example.backlog.com/",
    apiUrl: "https://other.backlog.com/api/v2",
    username: "shared-user",
    password: "shared-password",
  });
  assert.equal(crossOrigin.valid, false);
  assert.ok(crossOrigin.errors.apiUrl);
});

test("Backlog API 接続は API Key で本人情報を確認する", async () => {
  let requestedUrl = "";
  let requestedHeaders = null;
  const client = new BacklogSystemSourceClient({
    fetchImpl: async (url, options) => {
      requestedUrl = String(url);
      requestedHeaders = options.headers;
      return new Response(JSON.stringify({ id: 21, name: "Shared Operator" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const result = await client.testConnection({
    baseUrl: "https://example.backlog.com/",
    apiUrl: "https://example.backlog.com/api/v2",
    username: "shared-user",
    password: "shared-password",
    apiKey: "shared-api-key",
  });

  assert.match(requestedUrl, /\/api\/v2\/users\/myself\?apiKey=/);
  assert.equal(requestedHeaders.Authorization, undefined);
  assert.equal(result.mode, "API");
  assert.equal(result.authenticated, true);
  assert.equal(result.identityName, "Shared Operator");
});

test("Backlog API のプロジェクト一覧は参加済みプロジェクトを要求する", async () => {
  let requestedUrl = "";
  const client = new BacklogSystemSourceClient({
    fetchImpl: async (url) => {
      requestedUrl = String(url);
      return new Response(JSON.stringify([
        { id: 155893, projectKey: "TS2_ITS", name: "TS2課_導入・保守支援" },
      ]), { status: 200 });
    },
  });

  const projects = await client.listProjects({
    baseUrl: "https://example.backlog.com/",
    apiUrl: "https://example.backlog.com/api/v2",
    apiKey: "shared-api-key",
  });

  assert.match(requestedUrl, /\/api\/v2\/projects\?apiKey=/);
  assert.deepEqual(projects, [{
    externalProjectId: "155893",
    projectKey: "TS2_ITS",
    projectName: "TS2課_導入・保守支援",
  }]);
});

test("Backlog ログイン URL フォールバックは到達確認と認証済みを区別する", async () => {
  let authorization = "";
  const client = new BacklogSystemSourceClient({
    fetchImpl: async (_url, options) => {
      authorization = options.headers.Authorization;
      return new Response("login", { status: 200 });
    },
  });

  const result = await client.testConnection({
    baseUrl: "https://example.backlog.com/",
    apiUrl: "",
    username: "shared-user",
    password: "shared-password",
    apiKey: "",
  });

  assert.match(authorization, /^Basic /);
  assert.equal(result.mode, "LOGIN_PAGE");
  assert.equal(result.authenticated, false);
});

test("複数 Backlog 検索テンプレートを共通形式へ集約し ID で重複排除する", async () => {
  const requests = [];
  const client = new BacklogSystemSourceClient({
    fetchImpl: async (url) => {
      const requestUrl = new URL(url);
      requests.push(requestUrl);
      if (requestUrl.pathname.endsWith("/customFields")) {
        return new Response(JSON.stringify([
          {
            id: 120235,
            name: "機関名",
            typeId: 5,
            items: [{ id: 53, name: "【0496】政策研究大院大学", displayOrder: 53 }],
          },
        ]), { status: 200 });
      }
      return new Response(JSON.stringify([
        {
          id: 99,
          issueKey: "TS2_ITS-215",
          summary: "【政策研究大学院大学】申請",
          projectId: 155893,
          status: { name: "処理済み" },
          assignee: { name: "担当者" },
          priority: { name: "中" },
          updated: "2026-08-05T04:16:58Z",
        },
      ]), { status: 200 });
    },
  });

  const result = await client.listIssuesByTemplates({
    baseUrl: "https://example.backlog.com/",
    apiUrl: "https://example.backlog.com/api/v2",
    apiKey: "secret",
  }, {
    templates: [
      {
        id: "template-1",
        projectId: "155893",
        projectKey: "TS2_ITS",
        projectName: "TS2課_導入・保守支援",
        fieldId: "120235",
        fieldName: "機関名",
        matchMode: "CUSTOM_FIELD",
        valueSource: "AUTO",
        enabled: true,
      },
      {
        id: "template-2",
        projectId: "155893",
        projectKey: "TS2_ITS",
        projectName: "TS2課_導入・保守支援",
        fieldId: "__SUMMARY__",
        fieldName: "件名",
        matchMode: "TITLE_CONTAINS",
        valueSource: "NAME",
        enabled: true,
      },
    ],
    customer: {
      code: "0496",
      name: "政策研究大学院大学",
      shortName: "",
    },
    offset: 0,
    count: 20,
  });

  assert.equal(result.total, 1);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].issueKey, "TS2_ITS-215");
  const issueRequest = requests.find((url) => url.pathname.endsWith("/issues") && url.searchParams.has("customField_120235[]"));
  assert.equal(issueRequest.searchParams.get("customField_120235[]"), "53");
});
