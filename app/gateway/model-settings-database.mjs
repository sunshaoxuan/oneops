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
    purpose: String(row.purpose),
    displayName: String(row.display_name),
    provider: String(row.provider),
    endpoint: String(row.endpoint_url),
    model: String(row.model),
    apiKey: row.encrypted_api_key
      ? decryptModelApiKey(row.id, row.encrypted_api_key)
      : "",
    apiKeyConfigured: Boolean(row.encrypted_api_key),
    reasoningEffort: String(row.reasoning_effort),
    speedLevel: String(row.speed_level),
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
    isDefault: Boolean(row.is_default),
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
  pool.on("error", (error) => onPoolError?.(error));

  const columns = `
    setting.id,
    setting.purpose,
    setting.display_name,
    setting.provider,
    setting.endpoint_url,
    setting.model,
    setting.encrypted_api_key,
    setting.reasoning_effort,
    setting.speed_level,
    setting.enabled,
    setting.sort_order,
    setting.is_default,
    setting.updated_at,
    COALESCE(actor.display_name, actor.username, '') AS updated_by`;

  async function mappedQuery(sql, values = []) {
    const result = await pool.query(sql, values);
    return result.rows.map(mapModelSettings);
  }

  return {
    async get(purpose = "GENERAL") {
      const values = await mappedQuery(
        `SELECT ${columns}
         FROM ai_model_settings AS setting
         LEFT JOIN users AS actor ON actor.id = setting.updated_by_user_id
         WHERE setting.purpose = $1
         ORDER BY setting.enabled DESC,
                  setting.is_default DESC,
                  setting.sort_order,
                  setting.id
         LIMIT 1`,
        [purpose],
      );
      return values[0] ?? emptyModelSettings(purpose);
    },

    async getById(id) {
      const values = await mappedQuery(
        `SELECT ${columns}
         FROM ai_model_settings AS setting
         LEFT JOIN users AS actor ON actor.id = setting.updated_by_user_id
         WHERE setting.id = $1`,
        [id],
      );
      return values[0] ?? null;
    },

    async list() {
      return mappedQuery(
        `SELECT ${columns}
         FROM ai_model_settings AS setting
         LEFT JOIN users AS actor ON actor.id = setting.updated_by_user_id
         ORDER BY CASE setting.purpose WHEN 'GENERAL' THEN 0 ELSE 1 END,
                  setting.is_default DESC,
                  setting.sort_order,
                  setting.id`,
      );
    },

    async getDefaultAssistantModel() {
      const values = await mappedQuery(
        `SELECT ${columns}
         FROM ai_model_settings AS setting
         LEFT JOIN users AS actor ON actor.id = setting.updated_by_user_id
         WHERE setting.purpose = 'GENERAL'
           AND setting.enabled
         ORDER BY setting.is_default DESC,
                  setting.sort_order,
                  setting.id`,
      );
      return values.find((setting) => setting.isDefault) ?? values[0] ?? null;
    },

    async getApiKey(id) {
      const result = await pool.query(
        `SELECT id, encrypted_api_key
         FROM ai_model_settings
         WHERE id = $1`,
        [id],
      );
      const row = result.rows[0];
      return row?.encrypted_api_key
        ? decryptModelApiKey(row.id, row.encrypted_api_key)
        : "";
    },

    async save(settings, actorUserId, settingId = null) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        let current = null;
        if (settingId) {
          const currentResult = await client.query(
            `SELECT id, purpose, encrypted_api_key
             FROM ai_model_settings
             WHERE id = $1
             FOR UPDATE`,
            [settingId],
          );
          current = currentResult.rows[0] ?? null;
          if (!current) {
            throw Object.assign(new Error("Model setting was not found."), {
              code: "MODEL_SETTINGS_NOT_FOUND",
            });
          }
          if (current.purpose !== settings.purpose) {
            throw Object.assign(new Error("Model purpose cannot be changed."), {
              code: "MODEL_PURPOSE_IMMUTABLE",
            });
          }
        } else if (settings.purpose === "INQUIRY") {
          const currentResult = await client.query(
            `SELECT id, purpose, encrypted_api_key
             FROM ai_model_settings
             WHERE purpose = 'INQUIRY'
             FOR UPDATE`,
          );
          current = currentResult.rows[0] ?? null;
        }
        const id = current?.id ?? randomUUID();
        const encryptedApiKey = settings.apiKey
          ? encryptModelApiKey(id, settings.apiKey)
          : current?.encrypted_api_key;
        if (!encryptedApiKey) {
          throw Object.assign(new Error("API Key is required."), {
            code: "MODEL_API_KEY_REQUIRED",
          });
        }
        if (settings.purpose === "GENERAL" && settings.isDefault) {
          await client.query(
            `UPDATE ai_model_settings
             SET is_default = FALSE
             WHERE purpose = 'GENERAL' AND id <> $1`,
            [id],
          );
        }
        await client.query(
          `INSERT INTO ai_model_settings (
             id, purpose, display_name, provider, endpoint_url, model,
             encrypted_api_key, reasoning_effort, speed_level, enabled,
             sort_order, is_default, updated_by_user_id
           ) VALUES ($1, $2, $3, 'OPENAI', $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE
           SET display_name = EXCLUDED.display_name,
               endpoint_url = EXCLUDED.endpoint_url,
               model = EXCLUDED.model,
               encrypted_api_key = EXCLUDED.encrypted_api_key,
               reasoning_effort = EXCLUDED.reasoning_effort,
               speed_level = EXCLUDED.speed_level,
               enabled = EXCLUDED.enabled,
               sort_order = EXCLUDED.sort_order,
               is_default = EXCLUDED.is_default,
               updated_by_user_id = EXCLUDED.updated_by_user_id,
               updated_at = CURRENT_TIMESTAMP`,
          [
            id,
            settings.purpose,
            settings.displayName,
            settings.endpoint,
            settings.model,
            encryptedApiKey,
            settings.reasoningEffort,
            settings.speedLevel,
            settings.enabled,
            settings.sortOrder,
            settings.isDefault,
            actorUserId,
          ],
        );
        const defaultResult = await client.query(
          `SELECT id
           FROM ai_model_settings
           WHERE purpose = 'GENERAL' AND enabled AND is_default
           LIMIT 1`,
        );
        if (settings.purpose === "GENERAL" && !defaultResult.rows[0]) {
          await client.query(
            `UPDATE ai_model_settings
             SET is_default = TRUE
             WHERE id = (
               SELECT id FROM ai_model_settings
               WHERE purpose = 'GENERAL' AND enabled
               ORDER BY sort_order, id
               LIMIT 1
             )`,
          );
        }
        await client.query("COMMIT");
        return this.getById(id);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async remove(id) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          `DELETE FROM ai_model_settings
           WHERE id = $1 AND purpose = 'GENERAL'
           RETURNING id`,
          [id],
        );
        if (result.rowCount) {
          await client.query(
            `UPDATE ai_model_settings
             SET is_default = TRUE
             WHERE id = (
               SELECT id FROM ai_model_settings
               WHERE purpose = 'GENERAL' AND enabled
                 AND NOT EXISTS (
                   SELECT 1 FROM ai_model_settings
                   WHERE purpose = 'GENERAL' AND enabled AND is_default
                 )
               ORDER BY sort_order, id
               LIMIT 1
             )`,
          );
        }
        await client.query("COMMIT");
        return Boolean(result.rowCount);
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
