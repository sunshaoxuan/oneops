import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  decryptModelApiKey,
  encryptModelApiKey,
} from "./credential-crypto.mjs";
import { emptyModelSettings } from "./model-settings.mjs";

const { Pool } = pg;

export function mapModelSettings(row) {
  if (!row) return emptyModelSettings();
  return {
    id: String(row.id),
    purpose: String(row.purpose ?? "GENERAL"),
    provider: String(row.provider),
    endpoint: String(row.endpoint_url),
    model: String(row.model),
    apiKey: row.encrypted_api_key
      ? decryptModelApiKey(row.id, row.encrypted_api_key)
      : "",
    apiKeyConfigured: Boolean(row.encrypted_api_key),
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
    updatedBy: String(row.updated_by ?? ""),
  };
}

export function createModelSettingsRepository(connectionString, onPoolError) {
  const pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => {
    onPoolError?.(error);
  });

  return {
    async get(purpose = "GENERAL") {
      const result = await pool.query(
        `SELECT
           setting.id,
           setting.purpose,
           setting.provider,
           setting.endpoint_url,
           setting.model,
           setting.encrypted_api_key,
           setting.updated_at,
           COALESCE(actor.display_name, actor.username, '') AS updated_by
         FROM ai_model_settings AS setting
         LEFT JOIN users AS actor ON actor.id = setting.updated_by_user_id
         WHERE setting.purpose = $1
         LIMIT 1`,
        [purpose],
      );
      return result.rows[0]
        ? mapModelSettings(result.rows[0])
        : emptyModelSettings(purpose);
    },

    async list() {
      const result = await pool.query(
        `SELECT
           setting.id,
           setting.purpose,
           setting.provider,
           setting.endpoint_url,
           setting.model,
           setting.encrypted_api_key,
           setting.updated_at,
           COALESCE(actor.display_name, actor.username, '') AS updated_by
         FROM ai_model_settings AS setting
         LEFT JOIN users AS actor ON actor.id = setting.updated_by_user_id
         ORDER BY CASE setting.purpose
           WHEN 'GENERAL' THEN 0
           WHEN 'SIMPLE' THEN 1
           WHEN 'INQUIRY' THEN 2
           ELSE 3
         END`,
      );
      const byPurpose = new Map(
        result.rows.map((row) => [row.purpose, mapModelSettings(row)]),
      );
      return ["GENERAL", "SIMPLE", "INQUIRY"].map(
        (purpose) => byPurpose.get(purpose) ?? emptyModelSettings(purpose),
      );
    },

    async getApiKey(purpose = "GENERAL") {
      const result = await pool.query(
        `SELECT id, encrypted_api_key
         FROM ai_model_settings
         WHERE purpose = $1
         LIMIT 1`,
        [purpose],
      );
      const row = result.rows[0];
      return row?.encrypted_api_key
        ? decryptModelApiKey(row.id, row.encrypted_api_key)
        : "";
    },

    async ensureInquiryDefault() {
      const existing = await this.get("INQUIRY");
      if (existing.id) return existing;
      const legacyResult = await pool.query(
        `SELECT setting.*
         FROM ai_model_settings AS setting
         LEFT JOIN inquiry_source_settings AS source
           ON source.model_setting_id = setting.id
          AND source.code = 'ONEHR_UPDS'
         ORDER BY CASE
           WHEN source.id IS NOT NULL THEN 0
           WHEN setting.purpose = 'GENERAL' THEN 1
           ELSE 2
         END
         LIMIT 1`,
      );
      const legacy = legacyResult.rows[0]
        ? mapModelSettings(legacyResult.rows[0])
        : null;
      if (!legacy?.id || !legacy.apiKeyConfigured) return existing;
      return this.save(
        {
          provider: legacy.provider,
          endpoint: legacy.endpoint,
          model: legacy.model,
          apiKey: legacy.apiKey,
        },
        null,
        "INQUIRY",
      );
    },

    async save(settings, actorUserId, purpose = "GENERAL") {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const currentResult = await client.query(
          `SELECT id, encrypted_api_key
           FROM ai_model_settings
           WHERE purpose = $1
           FOR UPDATE`,
          [purpose],
        );
        const current = currentResult.rows[0];
        const id = current?.id ?? randomUUID();
        const encryptedApiKey = settings.apiKey
          ? encryptModelApiKey(id, settings.apiKey)
          : current?.encrypted_api_key;
        if (!encryptedApiKey) {
          const error = new Error("API Key is required.");
          error.code = "MODEL_API_KEY_REQUIRED";
          throw error;
        }
        await client.query(
          `INSERT INTO ai_model_settings (
             id,
             purpose,
             provider,
             endpoint_url,
             model,
             encrypted_api_key,
             updated_by_user_id
           )
           VALUES ($1, $2, 'OPENAI', $3, $4, $5, $6)
           ON CONFLICT (purpose) DO UPDATE
           SET endpoint_url = EXCLUDED.endpoint_url,
               model = EXCLUDED.model,
               encrypted_api_key = EXCLUDED.encrypted_api_key,
               updated_by_user_id = EXCLUDED.updated_by_user_id,
               updated_at = CURRENT_TIMESTAMP`,
          [
            id,
            purpose,
            settings.endpoint,
            settings.model,
            encryptedApiKey,
            actorUserId,
          ],
        );
        await client.query("COMMIT");
        return this.get(purpose);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async close() {
      await pool.end();
    },
  };
}
