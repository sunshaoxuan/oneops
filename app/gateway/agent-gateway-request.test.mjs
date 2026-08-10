import assert from "node:assert/strict";
import test from "node:test";
import {
  requestAgentGatewayJson,
  requestAgentGatewayStream,
  resetAgentGatewayCircuits,
} from "./agent-gateway-request.mjs";

const gateway = {
  endpoint: "https://primary.example.test/api/v1",
  fallbackEndpoints: ["https://backup.example.test/api/v1"],
  accessToken: "secret",
};

test.beforeEach(resetAgentGatewayCircuits);

test("一時障害を冪等再試行して予備 CAG へ切り替える", async () => {
  const calls = [];
  const result = await requestAgentGatewayJson(
    gateway,
    "/tasks",
    {
      method: "POST",
      headers: { "Idempotency-Key": "oneops:conversation:request" },
      body: JSON.stringify({ prompt: "test" }),
    },
    {
      sleep: async () => {},
      random: () => 0,
      fetchImpl: async (url, options) => {
        calls.push({ url: String(url), headers: options.headers });
        if (String(url).startsWith(gateway.endpoint)) {
          return new Response("temporary", { status: 503 });
        }
        return new Response(JSON.stringify({ id: "task-id" }), { status: 202 });
      },
    },
  );

  assert.equal(result.id, "task-id");
  assert.equal(calls.length, 3);
  assert.match(calls.at(-1).url, /^https:\/\/backup/);
  assert.equal(
    calls.at(-1).headers["Idempotency-Key"],
    "oneops:conversation:request",
  );
});

test("Contract Error は再試行しない", async () => {
  let calls = 0;
  await assert.rejects(
    requestAgentGatewayJson(
      gateway,
      "/tasks",
      {
        method: "POST",
        headers: { "Idempotency-Key": "oneops:contract:test" },
        body: "{}",
      },
      {
        fetchImpl: async () => {
          calls += 1;
          return new Response("schema invalid", { status: 422 });
        },
      },
    ),
    { code: "AGENT_GATEWAY_CONTRACT_INVALID" },
  );
  assert.equal(calls, 1);
});

test("非冪等 POST は自動再試行しない", async () => {
  let calls = 0;
  await assert.rejects(
    requestAgentGatewayJson(
      gateway,
      "/conversations",
      { method: "POST", body: "{}" },
      {
        fetchImpl: async () => {
          calls += 1;
          return new Response("temporary", { status: 503 });
        },
      },
    ),
  );
  assert.equal(calls, 1);
});

test("認証エラーは予備 Endpoint へ切り替えない", async () => {
  let calls = 0;
  await assert.rejects(
    requestAgentGatewayJson(
      gateway,
      "/projects",
      {},
      {
        fetchImpl: async () => {
          calls += 1;
          return new Response("unauthorized", { status: 401 });
        },
      },
    ),
    { upstreamStatusCode: 401 },
  );
  assert.equal(calls, 1);
});

test("SSE の一時障害時に Last-Event-ID を保持して予備へ切り替える", async () => {
  const calls = [];
  const response = await requestAgentGatewayStream(
    gateway,
    "/conversations/conversation-id/events?after_sequence=4&follow=true",
    {
      headers: { "Last-Event-ID": "7" },
    },
    {
      fetchImpl: async (url, options) => {
        calls.push({ url: String(url), headers: options.headers });
        if (String(url).startsWith(gateway.endpoint)) {
          return new Response("temporary", { status: 503 });
        }
        return new Response("event: task.completed\n\n", {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].headers["Last-Event-ID"], "7");
  assert.match(calls[1].url, /after_sequence=4&follow=true$/);
});

test("SSE の権限エラーは再試行しない", async () => {
  let calls = 0;
  await assert.rejects(
    requestAgentGatewayStream(
      gateway,
      "/conversations/conversation-id/events",
      {},
      {
        fetchImpl: async () => {
          calls += 1;
          return new Response("forbidden", { status: 403 });
        },
      },
    ),
    { upstreamStatusCode: 403 },
  );
  assert.equal(calls, 1);
});

test("呼出元の Abort は再試行しない", async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(
    requestAgentGatewayJson(
      gateway,
      "/projects",
      { signal: controller.signal },
      {
        fetchImpl: async () => {
          calls += 1;
          controller.abort();
          throw controller.signal.reason;
        },
      },
    ),
  );
  assert.equal(calls, 1);
});

test("全 Circuit を開き、期限後に主 Endpoint を再利用する", async () => {
  let currentTime = 1_000;
  let healthy = false;
  const fetchImpl = async () => healthy
    ? new Response(JSON.stringify({ ready: true }), { status: 200 })
    : new Response("temporary", { status: 503 });
  const options = {
    attemptsPerEndpoint: 1,
    circuitFailureThreshold: 1,
    circuitOpenMilliseconds: 500,
    fetchImpl,
    now: () => currentTime,
  };

  await assert.rejects(
    requestAgentGatewayJson(gateway, "/health", {}, options),
  );
  await assert.rejects(
    requestAgentGatewayJson(gateway, "/health", {}, options),
    { code: "AGENT_GATEWAY_CIRCUIT_OPEN" },
  );

  currentTime += 501;
  healthy = true;
  assert.deepEqual(
    await requestAgentGatewayJson(gateway, "/health", {}, options),
    { ready: true },
  );
});
