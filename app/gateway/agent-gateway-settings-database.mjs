import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  decryptAgentGatewayToken,
  encryptAgentGatewayToken,
} from "./credential-crypto.mjs";

const { Pool } = pg;

export function mapAgentGatewaySettings(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    endpoint: String(row.endpoint_url),
    accessToken: row.encrypted_access_token
      ? decryptAgentGatewayToken(row.id, row.encrypted_access_token)
      : "",
    accessTokenConfigured: Boolean(row.encrypted_access_token),
    enabled: Boolean(row.enabled),
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
    updatedBy: String(row.updated_by ?? ""),
  };
}

export function createAgentGatewaySettingsRepository(
  connectionString,
  onPoolError,
) {
  const pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => onPoolError?.(error));

  const selectColumns = `
    setting.id,
    setting.name,
    setting.endpoint_url,
    setting.encrypted_access_token,
    setting.enabled,
    setting.updated_at,
    COALESCE(actor.display_name, actor.username, '') AS updated_by`;

  return {
    async list() {
      const result = await pool.query(
        `SELECT ${selectColumns}
         FROM agent_gateway_settings AS setting
         LEFT JOIN users AS actor ON actor.id = setting.updated_by_user_id
         ORDER BY setting.name, setting.id`,
      );
      return result.rows.map(mapAgentGatewaySettings);
    },

    async get(id) {
      const result = await pool.query(
        `SELECT ${selectColumns}
         FROM agent_gateway_settings AS setting
         LEFT JOIN users AS actor ON actor.id = setting.updated_by_user_id
         WHERE setting.id = $1`,
        [id],
      );
      return mapAgentGatewaySettings(result.rows[0]);
    },

    async save(settings, actorUserId) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const id = settings.id || randomUUID();
        const currentResult = await client.query(
          `SELECT encrypted_access_token
           FROM agent_gateway_settings
           WHERE id = $1
           FOR UPDATE`,
          [id],
        );
        const current = currentResult.rows[0];
        const encryptedAccessToken = settings.accessToken
          ? encryptAgentGatewayToken(id, settings.accessToken)
          : current?.encrypted_access_token ?? null;
        const result = await client.query(
          `INSERT INTO agent_gateway_settings (
             id,
             name,
             endpoint_url,
             encrypted_access_token,
             enabled,
             updated_by_user_id
           )
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               endpoint_url = EXCLUDED.endpoint_url,
               encrypted_access_token = EXCLUDED.encrypted_access_token,
               enabled = EXCLUDED.enabled,
               updated_by_user_id = EXCLUDED.updated_by_user_id,
               updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [
            id,
            settings.name,
            settings.endpoint,
            encryptedAccessToken,
            settings.enabled,
            actorUserId,
          ],
        );
        await client.query("COMMIT");
        return this.get(result.rows[0].id);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async remove(id) {
      const result = await pool.query(
        `DELETE FROM agent_gateway_settings
         WHERE id = $1
         RETURNING id`,
        [id],
      );
      return Boolean(result.rowCount);
    },

    async close() {
      await pool.end();
    },
  };
}
