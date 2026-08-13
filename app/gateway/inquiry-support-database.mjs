import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  decryptSensitiveValue,
  encryptSensitiveValue,
} from "./credential-crypto.mjs";

const { Pool } = pg;
const updsSourceCode = "ONEHR_UPDS";
const backlogSourceCode = "BACKLOG_SYSTEM";

function credentialContext(id) {
  return `inquiry-source:${String(id)}`;
}

function decodeCredentials(row) {
  if (!row?.encrypted_credentials) {
    return { username: "", password: "", apiKey: "" };
  }
  const value = JSON.parse(
    decryptSensitiveValue(
      credentialContext(row.id),
      row.encrypted_credentials,
    ),
  );
  return {
    username: String(value?.username ?? ""),
    password: String(value?.password ?? ""),
    apiKey: String(value?.apiKey ?? ""),
  };
}

function mapBacklogSearchTemplate(row) {
  return {
    id: String(row.id),
    templateName: String(row.template_name),
    projectId: String(row.project_id),
    projectKey: String(row.project_key),
    projectName: String(row.project_name),
    fieldId: String(row.field_id),
    fieldName: String(row.field_name),
    matchMode: String(row.match_mode),
    valueSource: String(row.value_source),
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order),
    revision: Number(row.revision),
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
  };
}

function emptySourceSettings(code) {
  const backlog = code === backlogSourceCode;
  return {
    id: null,
    code,
    baseUrl: backlog ? "" : "https://ss.onehr.jp/",
    apiUrl: "",
    productCode: backlog ? "BACKLOG" : "UPDS",
    username: "",
    password: "",
    passwordConfigured: false,
    apiKey: "",
    apiKeyConfigured: false,
    enabled: !backlog,
    syncIntervalMinutes: 10,
    analysisProvider: "MODEL",
    modelSettingId: null,
    agentGatewaySettingId: null,
    agentGatewayProjectRef: "",
    revision: 0,
    updatedAt: null,
    updatedBy: "",
  };
}

export function mapInquirySourceSettings(row, includeCredentials = false) {
  if (!row) return emptySourceSettings(updsSourceCode);
  const decrypted = row.encrypted_credentials
    ? decodeCredentials(row)
    : { username: "", password: "", apiKey: "" };
  const credentials = includeCredentials
    ? decrypted
    : { username: decrypted.username, password: "", apiKey: "" };
  return {
    id: String(row.id),
    code: String(row.code),
    baseUrl: String(row.base_url),
    apiUrl: String(row.api_url ?? ""),
    productCode: String(row.product_code),
    username: credentials.username,
    password: credentials.password,
    passwordConfigured: Boolean(row.encrypted_credentials),
    apiKey: credentials.apiKey,
    apiKeyConfigured: Boolean(decrypted.apiKey),
    enabled: Boolean(row.enabled),
    syncIntervalMinutes: Number(row.sync_interval_minutes ?? 10),
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
    anchor: row.assist_anchor
      ? String(row.assist_anchor)
      : row.focus_message_key
        ? "MESSAGE"
        : "NEXT_REPLY",
    focusMessageKey: row.focus_message_key
      ? String(row.focus_message_key)
      : null,
    provider: String(row.provider),
    providerLabel: String(row.provider_label),
    generatedBy: row.requested_by_user_id
      ? {
          id: String(row.requested_by_user_id),
          displayName: String(row.requested_by_display_name ?? ""),
          username: String(row.requested_by_username ?? ""),
        }
      : null,
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
    deletedAt: row.deleted_at?.toISOString?.() ?? row.deleted_at ?? null,
    deletedBy: row.deleted_by_user_id
      ? {
          id: String(row.deleted_by_user_id),
          displayName: String(row.deleted_by_display_name ?? ""),
          username: String(row.deleted_by_username ?? ""),
        }
      : null,
  };
}

function mapEvaluation(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    assistRunId: String(row.assist_run_id),
    rating: String(row.rating),
    comment: String(row.comment ?? ""),
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
  };
}

const runSelect = `SELECT run.*,
    creator.display_name AS requested_by_display_name,
    creator.username AS requested_by_username,
    deleter.display_name AS deleted_by_display_name,
    deleter.username AS deleted_by_username
  FROM inquiry_assist_runs AS run
  LEFT JOIN users AS creator ON creator.id = run.requested_by_user_id
  LEFT JOIN users AS deleter ON deleter.id = run.deleted_by_user_id`;

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
    async getSourceSettings(code, { includeCredentials = false } = {}) {
      const normalizedCode = code === backlogSourceCode
        ? backlogSourceCode
        : updsSourceCode;
      const result = await pool.query(
        `SELECT source.*,
                COALESCE(actor.display_name, actor.username, '') AS updated_by
         FROM inquiry_source_settings AS source
         LEFT JOIN users AS actor ON actor.id = source.updated_by_user_id
         WHERE source.code = $1
         LIMIT 1`,
        [normalizedCode],
      );
      return result.rows[0]
        ? mapInquirySourceSettings(result.rows[0], includeCredentials)
        : emptySourceSettings(normalizedCode);
    },

    async getSettings({ includeCredentials = false } = {}) {
      return this.getSourceSettings(updsSourceCode, { includeCredentials });
    },

    async getBacklogSettings({ includeCredentials = false } = {}) {
      return this.getSourceSettings(backlogSourceCode, { includeCredentials });
    },

    async listBacklogSearchTemplates() {
      const result = await pool.query(
        `SELECT *
         FROM backlog_search_templates
         ORDER BY sort_order, project_name, template_name, id`,
      );
      return result.rows.map(mapBacklogSearchTemplate);
    },

    async createBacklogSearchTemplate(input, actorUserId) {
      const result = await pool.query(
        `INSERT INTO backlog_search_templates (
           template_name, project_id, project_key, project_name,
           field_id, field_name, match_mode, value_source, enabled,
           sort_order, created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
         RETURNING *`,
        [
          input.templateName,
          input.projectId,
          input.projectKey,
          input.projectName,
          input.fieldId,
          input.fieldName,
          input.matchMode,
          input.valueSource,
          input.enabled,
          input.sortOrder,
          actorUserId,
        ],
      );
      return mapBacklogSearchTemplate(result.rows[0]);
    },

    async updateBacklogSearchTemplate(id, input, actorUserId) {
      const result = await pool.query(
        `UPDATE backlog_search_templates
         SET template_name = $1,
             project_id = $2,
             project_key = $3,
             project_name = $4,
             field_id = $5,
             field_name = $6,
             match_mode = $7,
             value_source = $8,
             enabled = $9,
             sort_order = $10,
             revision = revision + 1,
             updated_by_user_id = $11,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 AND revision = $13
         RETURNING *`,
        [
          input.templateName,
          input.projectId,
          input.projectKey,
          input.projectName,
          input.fieldId,
          input.fieldName,
          input.matchMode,
          input.valueSource,
          input.enabled,
          input.sortOrder,
          actorUserId,
          id,
          input.revision,
        ],
      );
      return result.rows[0] ? mapBacklogSearchTemplate(result.rows[0]) : null;
    },

    async deleteBacklogSearchTemplate(id, revision) {
      const result = await pool.query(
        `DELETE FROM backlog_search_templates
         WHERE id = $1 AND revision = $2`,
        [id, revision],
      );
      return Boolean(result.rowCount);
    },

    async saveSourceSettings(code, input, actorUserId) {
      const normalizedCode = code === backlogSourceCode
        ? backlogSourceCode
        : updsSourceCode;
      const productCode = normalizedCode === backlogSourceCode
        ? "BACKLOG"
        : "UPDS";
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const currentResult = await client.query(
          `SELECT *
           FROM inquiry_source_settings
           WHERE code = $1
           FOR UPDATE`,
          [normalizedCode],
        );
        const current = currentResult.rows[0];
        const id = current?.id ?? randomUUID();
        const previous = current ? decodeCredentials(current) : null;
        const username = String(input.username ?? previous?.username ?? "");
        const password = String(input.password ?? "") ||
          String(previous?.password ?? "");
        const apiKey = input.apiKey === undefined
          ? String(previous?.apiKey ?? "")
          : String(input.apiKey ?? "");
        if (!username || !password) {
          const error = new Error("Source username and password are required.");
          error.code = "INQUIRY_SOURCE_CREDENTIALS_REQUIRED";
          throw error;
        }
        const encryptedCredentials = encryptSensitiveValue(
          credentialContext(id),
          JSON.stringify({ username, password, apiKey }),
        );
        await client.query(
          `INSERT INTO inquiry_source_settings (
             id, code, base_url, api_url, product_code, encrypted_credentials,
             enabled, sync_interval_minutes, analysis_provider, model_setting_id,
             agent_gateway_setting_id, agent_gateway_project_ref,
             revision, updated_by_user_id
           )
           VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, 'MODEL', NULL, NULL, NULL, 1, $9
           )
           ON CONFLICT (code) DO UPDATE
           SET base_url = EXCLUDED.base_url,
               api_url = EXCLUDED.api_url,
               product_code = EXCLUDED.product_code,
               encrypted_credentials = EXCLUDED.encrypted_credentials,
               enabled = EXCLUDED.enabled,
               sync_interval_minutes = EXCLUDED.sync_interval_minutes,
               analysis_provider = 'MODEL',
               model_setting_id = NULL,
               agent_gateway_setting_id = NULL,
               agent_gateway_project_ref = NULL,
               revision = inquiry_source_settings.revision + 1,
               updated_by_user_id = EXCLUDED.updated_by_user_id,
               updated_at = CURRENT_TIMESTAMP`,
          [
            id,
            normalizedCode,
            input.baseUrl,
            input.apiUrl || null,
            productCode,
            encryptedCredentials,
            input.enabled,
            Number(input.syncIntervalMinutes ?? 10),
            actorUserId,
          ],
        );
        await client.query("COMMIT");
        return this.getSourceSettings(normalizedCode, {
          includeCredentials: true,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async saveSettings(input, actorUserId) {
      return this.saveSourceSettings(updsSourceCode, input, actorUserId);
    },

    async saveBacklogSettings(input, actorUserId) {
      return this.saveSourceSettings(backlogSourceCode, input, actorUserId);
    },

    async createRun(input) {
      const result = await pool.query(
        `INSERT INTO inquiry_assist_runs (
           ticket_no, question_key, assist_anchor, focus_message_key, provider,
           provider_label, model_setting_id, agent_gateway_setting_id,
           requested_by_user_id, requested_session_id, created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          input.ticketNo,
          input.questionKey,
          input.anchor,
          input.focusMessageKey || null,
          input.provider,
          input.providerLabel,
          input.modelSettingId || null,
          input.agentGatewaySettingId || null,
          input.requestedByUserId,
          input.requestedSessionId || null,
          input.createdAt,
        ],
      );
      return this.getRun(result.rows[0].id);
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
      return this.getRun(updated.rows[0].id);
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
      return this.getRun(updated.rows[0].id);
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
        `${runSelect} WHERE run.id = $1 LIMIT 1`,
        [id],
      );
      return mapRun(result.rows[0]);
    },

    async getRunEvaluation(id, evaluatorUserId) {
      const result = await pool.query(
        `SELECT id, assist_run_id, rating, comment, created_at, updated_at
         FROM inquiry_assist_run_evaluations
         WHERE assist_run_id = $1 AND evaluator_user_id = $2
         LIMIT 1`,
        [id, evaluatorUserId],
      );
      return mapEvaluation(result.rows[0]);
    },

    async saveRunEvaluation(id, evaluatorUserId, input) {
      const result = await pool.query(
        `INSERT INTO inquiry_assist_run_evaluations (
           assist_run_id, evaluator_user_id, rating, comment
         )
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (assist_run_id, evaluator_user_id) DO UPDATE
           SET rating = EXCLUDED.rating,
               comment = EXCLUDED.comment,
               updated_at = CURRENT_TIMESTAMP
         RETURNING id, assist_run_id, rating, comment, created_at, updated_at`,
        [id, evaluatorUserId, input.rating, input.comment],
      );
      return mapEvaluation(result.rows[0]);
    },

    async listRuns(ticketNo, includeDeleted = false) {
      const result = await pool.query(
        `${runSelect}
         WHERE run.ticket_no = $1
           AND ($2::boolean OR run.deleted_at IS NULL)
         ORDER BY run.created_at DESC`,
        [ticketNo, includeDeleted],
      );
      return result.rows.map(mapRun);
    },

    async softDeleteRun(id, actorUserId) {
      const result = await pool.query(
        `UPDATE inquiry_assist_runs
         SET deleted_at = CURRENT_TIMESTAMP,
             deleted_by_user_id = $2
         WHERE id = $1
           AND requested_by_user_id = $2
           AND deleted_at IS NULL
         RETURNING id`,
        [id, actorUserId],
      );
      return result.rows[0] ? this.getRun(result.rows[0].id) : null;
    },

    async listAssistedTicketNos() {
      const result = await pool.query(
        `SELECT ticket_no, MAX(created_at) AS latest_run_at
         FROM inquiry_assist_runs
         WHERE deleted_at IS NULL
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
