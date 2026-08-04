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
