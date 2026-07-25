import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyModelSettings,
  testOpenAIConnection,
  validateModelSettings,
} from "./model-settings.mjs";

test("model settings accept only a clean OpenAI compatible API root", () => {
  const result = validateModelSettings({
    provider: "openai",
    endpoint: "https://models.example.test/v1/",
    model: "customer-chat",
    apiKey: "secret",
  }, { requireApiKey: true });

  assert.equal(result.valid, true);
  assert.deepEqual(result.settings, {
    provider: "OPENAI",
    endpoint: "https://models.example.test/v1",
    model: "customer-chat",
    apiKey: "secret",
  });
  assert.equal(emptyModelSettings().apiKeyConfigured, false);
});

test("model settings reject unsupported providers and unsafe URL parts", () => {
  const result = validateModelSettings({
    provider: "OTHER",
    endpoint: "https://user:pass@example.test/v1?token=secret",
    model: "",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.provider, "MODEL_PROVIDER_UNSUPPORTED");
  assert.equal(result.errors.endpoint, "MODEL_ENDPOINT_INVALID");
  assert.equal(result.errors.model, "MODEL_NAME_INVALID");
});

test("connection test verifies authentication and selected model visibility", async () => {
  let requestedUrl = "";
  let authorization = "";
  const result = await testOpenAIConnection(
    {
      endpoint: "https://models.example.test/v1",
      apiKey: "test-api-key",
      model: "customer-chat",
    },
    {
      fetchImpl: async (url, options) => {
        requestedUrl = String(url);
        authorization = String(options.headers.Authorization);
        return new Response(
          JSON.stringify({
            object: "list",
            data: [{ id: "customer-chat", object: "model" }],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  );

  assert.equal(requestedUrl, "https://models.example.test/v1/models");
  assert.equal(authorization, "Bearer test-api-key");
  assert.equal(result.success, true);
  assert.equal(result.modelAvailable, true);
  assert.equal(result.modelsCount, 1);
});

test("connection test returns actionable authentication and model errors", async () => {
  const authenticationFailure = await testOpenAIConnection(
    {
      endpoint: "https://models.example.test/v1",
      apiKey: "invalid",
      model: "customer-chat",
    },
    {
      fetchImpl: async () => new Response("", { status: 401 }),
    },
  );
  assert.equal(authenticationFailure.success, false);
  assert.equal(
    authenticationFailure.code,
    "MODEL_AUTHENTICATION_FAILED",
  );

  const missingModel = await testOpenAIConnection(
    {
      endpoint: "https://models.example.test/v1",
      apiKey: "valid",
      model: "customer-chat",
    },
    {
      fetchImpl: async () => new Response(
        JSON.stringify({ data: [{ id: "another-model" }] }),
        { status: 200 },
      ),
    },
  );
  assert.equal(missingModel.success, false);
  assert.equal(missingModel.code, "MODEL_NOT_AVAILABLE");
});
