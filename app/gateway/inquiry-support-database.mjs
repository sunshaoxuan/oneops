import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  decryptSensitiveValue,
  encryptSensitiveValue,
} from "./credential-crypto.mjs";

const { Pool } = pg;
const sourceCode = "ONEHR_UPDS";

function credentialContext(id) {
  return `inquiry-source:${String(id)}`;
}

function decodeCredentials(row) {
  if (!row?.encrypted_credentials) return { username: "", password: "" };
  const value = JSON.parse(
    decryptSensitiveValue(
      credentialContext(row.id),
      row.encrypted_credentials,
    ),
  );
  return {
    username: String(value?.username ?? ""),
    password: String(value?.password ?? ""),
  };
}

export function mapInquirySourceSettings(row, includeCredentials = false) {
  if (!row) {
    return {
      id: null,
      code: sourceCode,
      baseUrl: "https://ss.onehr.jp/",
      productCode: "UPDS",
      username: "",
      password: "",
      passwordConfigured: false,
      enabled: true,
      analysisProvider: "MODEL",
      modelSettingId: null,
      agentGatewaySettingId: null,
      agentGatewayProjectRef: "",
      revision: 0,
      updatedAt: null,
      updatedBy: "",
    };
  }
  const decrypted = row.encrypted_credentials
    ? decodeCredentials(row)
    : { username: "", password: "" };
  const credentials = includeCredentials
    ? decrypted
    : { username: decrypted.username, password: "" };
  return {
    id: String(row.id),
    code: String(row.code),
    baseUrl: String(row.base_url),
    productCode: String(row.product_code),
    username: credentials.username,
    password: credentials.password,
    passwordConfigured: Boolean(row.encrypted_credentials),
    enabled: Boolean(row.enabled),
    analysisProvider: String(row.analysis_provider),
    modelSettingId: row.model_setting_id ? String(row.model_setting_id) : null,
    agentGatewaySettingId: row.agent_gateway_setting_id
      ? String(row.agent_gateway_setting_id)
      : null,
    agentGatewayProjectRef: String(row.agent_gateway_project_ref ?? ""),
    revision: Number(row.revision),
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
    updatedBy: String(row.updated_by ?? ""),
  };
}

function mapRun(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    ticketNo: String(row.ticket_no),
    questionKey: String(row.question_key),
    focusMessageKey: row.focus_message_key
      ? String(row.focus_message_key)
      : null,
    provider: String(row.provider),
    providerLabel: String(row.provider_label),
    requestedByUserId: row.requested_by_user_id
      ? String(row.requested_by_user_id)
      : null,
    requestedSessionId: row.requested_session_id
      ? String(row.requested_session_id)
      : null,
    status: String(row.status),
    analysis: row.analysis_json ?? null,
    draftReply: row.draft_reply ?? "",
    error: row.error_code
      ? {
          code: String(row.error_code),
          message: String(row.error_message ?? ""),
        }
      : null,
    tokenUsage: row.token_usage ?? (
      row.input_tokens !== null ||
        row.output_tokens !== null ||
        row.total_tokens !== null
        ? {
            inputTokens: row.input_tokens,
            outputTokens: row.output_tokens,
            totalTokens: row.total_tokens,
          }
        : null
    ),
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    startedAt: row.started_at?.toISOString?.() ?? row.started_at,
    completedAt: row.completed_at?.toISOString?.() ?? row.completed_at,
  };
}

export function createInquirySupportRepository(
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

  return {
    async getSettings({ includeCredentials = false } = {}) {
      const result = await pool.query(
        `SELECT source.*,
                COALESCE(actor.display_name, actor.username, '') AS updated_by
         FROM inquiry_source_settings AS source
         LEFT JOIN users AS actor ON actor.id = source.updated_by_user_id
         WHERE source.code = $1
         LIMIT 1`,
        [sourceCode],
      );
      return mapInquirySourceSettings(
        result.rows[0],
        includeCredentials,
      );
    },

    async saveSettings(input, actorUserId) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const currentResult = await client.query(
          `SELECT *
           FROM inquiry_source_settings
           WHERE code = $1
           FOR UPDATE`,
          [sourceCode],
        );
        const current = currentResult.rows[0];
        const id = current?.id ?? randomUUID();
        const previous = current ? decodeCredentials(current) : null;
        const username = String(input.username ?? previous?.username ?? "");
        const password = String(input.password ?? "") ||
          String(previous?.password ?? "");
        if (!username || !password) {
          const error = new Error("Source username and password are required.");
          error.code = "INQUIRY_SOURCE_CREDENTIALS_REQUIRED";
          throw error;
        }
        const encryptedCredentials = encryptSensitiveValue(
          credentialContext(id),
          JSON.stringify({ username, password }),
        );
        await client.query(
          `INSERT INTO inquiry_source_settings (
             id, code, base_url, product_code, encrypted_credentials,
             enabled, analysis_provider, model_setting_id,
             agent_gateway_setting_id, agent_gateway_project_ref,
             revision, updated_by_user_id
           )
           VALUES (
             $1, $2, $3, 'UPDS', $4, $5, $6, $7, $8, $9, 1, $10
           )
           ON CONFLICT (code) DO UPDATE
           SET base_url = EXCLUDED.base_url,
               encrypted_credentials = EXCLUDED.encrypted_credentials,
               enabled = EXCLUDED.enabled,
               analysis_provider = EXCLUDED.analysis_provider,
               model_setting_id = EXCLUDED.model_setting_id,
               agent_gateway_setting_id =
                 EXCLUDED.agent_gateway_setting_id,
               agent_gateway_project_ref =
                 EXCLUDED.agent_gateway_project_ref,
               revision = inquiry_source_settings.revision + 1,
               updated_by_user_id = EXCLUDED.updated_by_user_id,
               updated_at = CURRENT_TIMESTAMP`,
          [
            id,
            sourceCode,
            input.baseUrl,
            encryptedCredentials,
            input.enabled,
            input.analysisProvider,
            input.modelSettingId || null,
            input.agentGatewaySettingId || null,
            input.agentGatewayProjectRef || null,
            actorUserId,
          ],
        );
        await client.query("COMMIT");
        return this.getSettings({ includeCredentials: true });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async createRun(input) {
      const result = await pool.query(
        `INSERT INTO inquiry_assist_runs (
           ticket_no, question_key, focus_message_key, provider,
           provider_label, model_setting_id, agent_gateway_setting_id,
           requested_by_user_id, requested_session_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          input.ticketNo,
          input.questionKey,
          input.focusMessageKey || null,
          input.provider,
          input.providerLabel,
          input.modelSettingId || null,
          input.agentGatewaySettingId || null,
          input.requestedByUserId,
          input.requestedSessionId || null,
        ],
      );
      return mapRun(result.rows[0]);
    },

    async markRunning(id) {
      await pool.query(
        `UPDATE inquiry_assist_runs
         SET status = 'RUNNING', started_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id],
      );
    },

    async completeRun(id, result) {
      const updated = await pool.query(
        `UPDATE inquiry_assist_runs
         SET status = 'COMPLETED',
             analysis_json = $2,
             draft_reply = $3,
             input_tokens = $4,
             output_tokens = $5,
             total_tokens = $6,
             token_usage = $7,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [
          id,
          result.analysis,
          result.draftReply,
          result.tokenUsage?.inputTokens ?? null,
          result.tokenUsage?.outputTokens ?? null,
          result.tokenUsage?.totalTokens ?? null,
          result.tokenUsage,
        ],
      );
      return mapRun(updated.rows[0]);
    },

    async failRun(id, error) {
      const updated = await pool.query(
        `UPDATE inquiry_assist_runs
         SET status = 'FAILED',
             error_code = $2,
             error_message = $3,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id, error.code ?? "INQUIRY_ANALYSIS_FAILED", error.message],
      );
      return mapRun(updated.rows[0]);
    },

    async appendEvent(id, eventType, eventData) {
      const result = await pool.query(
        `INSERT INTO inquiry_assist_run_events (
           assist_run_id, sequence, event_type, event_data
         )
         SELECT $1, COALESCE(MAX(sequence), 0) + 1, $2, $3
         FROM inquiry_assist_run_events
         WHERE assist_run_id = $1
         RETURNING id, sequence, event_type, event_data, created_at`,
        [id, eventType, eventData],
      );
      const row = result.rows[0];
      return {
        id: String(row.id),
        sequence: Number(row.sequence),
        type: String(row.event_type),
        data: row.event_data,
        createdAt: row.created_at?.toISOString?.() ?? row.created_at,
      };
    },

    async getRun(id) {
      const result = await pool.query(
        `SELECT * FROM inquiry_assist_runs WHERE id = $1 LIMIT 1`,
        [id],
      );
      return mapRun(result.rows[0]);
    },

    async listRuns(ticketNo) {
      const result = await pool.query(
        `SELECT *
         FROM inquiry_assist_runs
         WHERE ticket_no = $1
         ORDER BY created_at DESC`,
        [ticketNo],
      );
      return result.rows.map(mapRun);
    },

    async listAssistedTicketNos() {
      const result = await pool.query(
        `SELECT ticket_no, MAX(created_at) AS latest_run_at
         FROM inquiry_assist_runs
         GROUP BY ticket_no
         ORDER BY latest_run_at DESC`,
      );
      return result.rows.map((row) => String(row.ticket_no));
    },

    async listEvents(id, afterSequence = 0) {
      const result = await pool.query(
        `SELECT id, sequence, event_type, event_data, created_at
         FROM inquiry_assist_run_events
         WHERE assist_run_id = $1 AND sequence > $2
         ORDER BY sequence`,
        [id, afterSequence],
      );
      return result.rows.map((row) => ({
        id: String(row.id),
        sequence: Number(row.sequence),
        type: String(row.event_type),
        data: row.event_data,
        createdAt: row.created_at?.toISOString?.() ?? row.created_at,
      }));
    },

    async close() {
      await pool.end();
    },
  };
}
