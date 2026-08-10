import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { encryptModelApiKey } from "./credential-crypto.mjs";
import { mapModelSettings } from "./model-settings-database.mjs";
import {
  emptyModelSettings,
  testOpenAIConnection,
  validateModelSettings,
} from "./model-settings.mjs";

test("現行 AI 設定 migration は SIMPLE 用途を削除する", async () => {
  const migration = await readFile(
    new URL("../db/migrations/039_expand_general_models_and_shortcut_starting_model.sql", import.meta.url),
    "utf8",
  );

  assert.match(
    migration,
    /CHECK \(purpose IN \('GENERAL', 'INQUIRY'\)\)/,
  );
  assert.match(migration, /WHERE purpose = 'SIMPLE'/);
});

test("model settings accept only a clean OpenAI compatible API root", () => {
  const result = validateModelSettings({
    purpose: "GENERAL",
    displayName: "標準モデル",
    provider: "openai",
    endpoint: "https://models.example.test/v1/",
    model: "customer-chat",
    apiKey: "secret",
    reasoningEffort: "HIGH",
    speedLevel: "FAST",
    enabled: true,
    sortOrder: 10,
    isDefault: true,
  }, { requireApiKey: true });

  assert.equal(result.valid, true);
  assert.deepEqual(result.settings, {
    provider: "OPENAI",
    purpose: "GENERAL",
    displayName: "標準モデル",
    endpoint: "https://models.example.test/v1",
    model: "customer-chat",
    apiKey: "secret",
    reasoningEffort: "HIGH",
    speedLevel: "FAST",
    enabled: true,
    sortOrder: 10,
    isDefault: true,
  });
  assert.equal(emptyModelSettings().apiKeyConfigured, false);
  assert.equal(emptyModelSettings().apiKey, "");
});

test("database settings refill the decrypted API key for the admin form", () => {
  const previousSecret = process.env.OPS_CREDENTIAL_ENCRYPTION_KEY;
  process.env.OPS_CREDENTIAL_ENCRYPTION_KEY =
    "model-settings-refill-test-secret";
  try {
    const id = randomUUID();
    const apiKey = "complete-compatible-api-key";
    const settings = mapModelSettings({
      id,
      purpose: "GENERAL",
      display_name: "標準モデル",
      provider: "OPENAI",
      endpoint_url: "https://models.example.test/v1",
      model: "customer-chat",
      encrypted_api_key: encryptModelApiKey(id, apiKey),
      reasoning_effort: "MEDIUM",
      speed_level: "MEDIUM",
      enabled: true,
      sort_order: 10,
      is_default: true,
      updated_at: new Date("2026-07-27T00:00:00Z"),
      updated_by: "System Admin",
    });

    assert.equal(settings.apiKeyConfigured, true);
    assert.equal(settings.apiKey, apiKey);
  } finally {
    if (previousSecret === undefined) {
      delete process.env.OPS_CREDENTIAL_ENCRYPTION_KEY;
    } else {
      process.env.OPS_CREDENTIAL_ENCRYPTION_KEY = previousSecret;
    }
  }
});

test("model settings reject unsupported providers and unsafe URL parts", () => {
  const result = validateModelSettings({
    purpose: "GENERAL",
    displayName: "",
    provider: "OTHER",
    endpoint: "https://user:pass@example.test/v1?token=secret",
    model: "",
    apiKey: "",
    reasoningEffort: "LOW",
    speedLevel: "UNKNOWN",
    enabled: true,
    sortOrder: 0,
    isDefault: false,
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
