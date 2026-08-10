import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  decryptAgentGatewayToken,
  encryptAgentGatewayToken,
} from "./credential-crypto.mjs";
import { mapAgentGatewaySettings } from "./agent-gateway-settings-database.mjs";
import {
  agentGatewayHeaders,
  buildAgentGatewaySseRequest,
  testAgentGatewayConnection,
  validateAgentGatewaySettings,
} from "./agent-gateway-settings.mjs";

test("Agent Gateway settings normalize an API root and optional token", () => {
  const result = validateAgentGatewaySettings({
    name: "Primary CAG",
    endpoint: "https://agents.example.test/api/v1/",
    fallbackEndpoints: ["https://agents-backup.example.test/api/v1/"],
    accessToken: "",
    enabled: true,
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.settings, {
    id: null,
    name: "Primary CAG",
    endpoint: "https://agents.example.test/api/v1",
    fallbackEndpoints: ["https://agents-backup.example.test/api/v1"],
    accessToken: "",
    enabled: true,
  });
  assert.deepEqual(agentGatewayHeaders("secret"), {
    Accept: "application/json",
    Authorization: "Bearer secret",
  });
});

test("Agent Gateway settings reject unsafe endpoints", () => {
  const result = validateAgentGatewaySettings({
    name: "",
    endpoint: "https://user:pass@example.test/api/v1?token=secret",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.name, "AGENT_GATEWAY_NAME_INVALID");
  assert.equal(
    result.errors.endpoint,
    "AGENT_GATEWAY_ENDPOINT_INVALID",
  );
});

test("Agent Gateway settings reject duplicate and excessive backup endpoints", () => {
  const duplicate = validateAgentGatewaySettings({
    name: "Primary CAG",
    endpoint: "https://agents.example.test/api/v1",
    fallbackEndpoints: ["https://agents.example.test/api/v1"],
    accessToken: "",
    enabled: true,
  });
  const excessive = validateAgentGatewaySettings({
    name: "Primary CAG",
    endpoint: "https://agents.example.test/api/v1",
    fallbackEndpoints: Array.from(
      { length: 5 },
      (_, index) => `https://backup-${index}.example.test/api/v1`,
    ),
    accessToken: "",
    enabled: true,
  });

  assert.equal(
    duplicate.errors.fallbackEndpoints,
    "AGENT_GATEWAY_FALLBACK_ENDPOINTS_INVALID",
  );
  assert.equal(
    excessive.errors.fallbackEndpoints,
    "AGENT_GATEWAY_FALLBACK_ENDPOINTS_INVALID",
  );
});

test("Agent Gateway token is fully refilled in the admin settings model", () => {
  const previousSecret = process.env.OPS_CREDENTIAL_ENCRYPTION_KEY;
  process.env.OPS_CREDENTIAL_ENCRYPTION_KEY =
    "agent-gateway-refill-test-secret";
  try {
    const id = randomUUID();
    const encrypted = encryptAgentGatewayToken(id, "gateway-token");
    assert.equal(decryptAgentGatewayToken(id, encrypted), "gateway-token");
    const settings = mapAgentGatewaySettings({
      id,
      name: "Primary CAG",
      endpoint_url: "https://agents.example.test/api/v1",
      fallback_endpoint_urls: ["https://backup.example.test/api/v1"],
      encrypted_access_token: encrypted,
      enabled: true,
      updated_at: new Date("2026-07-27T00:00:00Z"),
      updated_by: "System Admin",
    });
    assert.equal(settings.accessToken, "gateway-token");
    assert.deepEqual(settings.fallbackEndpoints, [
      "https://backup.example.test/api/v1",
    ]);
    assert.equal(settings.accessTokenConfigured, true);
  } finally {
    if (previousSecret === undefined) {
      delete process.env.OPS_CREDENTIAL_ENCRYPTION_KEY;
    } else {
      process.env.OPS_CREDENTIAL_ENCRYPTION_KEY = previousSecret;
    }
  }
});

test("Agent Gateway connection test validates the projects response", async () => {
  let requestedUrl = "";
  let authorization = "";
  const result = await testAgentGatewayConnection(
    {
      endpoint: "https://agents.example.test/api/v1",
      accessToken: "gateway-token",
    },
    {
      fetchImpl: async (url, options) => {
        requestedUrl = String(url);
        authorization = String(options.headers.Authorization);
        return new Response(
          JSON.stringify([{ id: "project-id", code: "oneops" }]),
          { status: 200 },
        );
      },
    },
  );

  assert.equal(
    requestedUrl,
    "https://agents.example.test/api/v1/projects",
  );
  assert.equal(authorization, "Bearer gateway-token");
  assert.equal(result.success, true);
  assert.equal(result.projectsCount, 1);
});

test("Agent Gateway connection test classifies authentication failure", async () => {
  const result = await testAgentGatewayConnection(
    {
      endpoint: "https://agents.example.test/api/v1",
      accessToken: "invalid",
    },
    {
      fetchImpl: async () => new Response("", { status: 401 }),
    },
  );

  assert.equal(result.success, false);
  assert.equal(result.code, "AGENT_GATEWAY_AUTHENTICATION_FAILED");
});

test("Agent Gateway SSE request preserves resume and authentication headers", () => {
  const request = buildAgentGatewaySseRequest(
    {
      endpoint: "https://agents.example.test/api/v1",
      accessToken: "gateway-token",
    },
    "/conversations/conversation-id/events",
    {
      afterSequence: "18",
      follow: "true",
      lastEventId: "18",
    },
  );

  assert.equal(
    request.url,
    "https://agents.example.test/api/v1/conversations/conversation-id/events" +
      "?after_sequence=18&follow=true",
  );
  assert.deepEqual(request.headers, {
    Accept: "text/event-stream",
    Authorization: "Bearer gateway-token",
    "Last-Event-ID": "18",
  });
});
