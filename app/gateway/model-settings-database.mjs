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
    async get() {
      const result = await pool.query(
        `SELECT
           setting.id,
           setting.provider,
           setting.endpoint_url,
           setting.model,
           setting.encrypted_api_key,
           setting.updated_at,
           COALESCE(actor.display_name, actor.username, '') AS updated_by
         FROM ai_model_settings AS setting
         LEFT JOIN users AS actor ON actor.id = setting.updated_by_user_id
         WHERE setting.provider = 'OPENAI'
         LIMIT 1`,
      );
      return mapModelSettings(result.rows[0]);
    },

    async getApiKey() {
      const result = await pool.query(
        `SELECT id, encrypted_api_key
         FROM ai_model_settings
         WHERE provider = 'OPENAI'
         LIMIT 1`,
      );
      const row = result.rows[0];
      return row?.encrypted_api_key
        ? decryptModelApiKey(row.id, row.encrypted_api_key)
        : "";
    },

    async save(settings, actorUserId) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const currentResult = await client.query(
          `SELECT id, encrypted_api_key
           FROM ai_model_settings
           WHERE provider = 'OPENAI'
           FOR UPDATE`,
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
             provider,
             endpoint_url,
             model,
             encrypted_api_key,
             updated_by_user_id
           )
           VALUES ($1, 'OPENAI', $2, $3, $4, $5)
           ON CONFLICT (provider) DO UPDATE
           SET endpoint_url = EXCLUDED.endpoint_url,
               model = EXCLUDED.model,
               encrypted_api_key = EXCLUDED.encrypted_api_key,
               updated_by_user_id = EXCLUDED.updated_by_user_id,
               updated_at = CURRENT_TIMESTAMP`,
          [
            id,
            settings.endpoint,
            settings.model,
            encryptedApiKey,
            actorUserId,
          ],
        );
        await client.query("COMMIT");
        return this.get();
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
