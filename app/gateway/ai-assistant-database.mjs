import pg from "pg";

const { Pool } = pg;

export function mapAiAssistantSession(row) {
  if (!row) return null;
  return {
    id: String(row.conversation_id),
    ownerUserId: String(row.owner_user_id),
    gatewaySettingId: String(row.agent_gateway_setting_id),
    gatewayName: String(row.gateway_name ?? ""),
    projectRef: String(row.project_ref),
    projectCode: String(row.project_code ?? ""),
    runtimeProfile: String(row.runtime_profile),
    title: String(row.title),
    status: String(row.status),
    lastTaskId: row.last_task_id ? String(row.last_task_id) : null,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
    archivedAt: row.archived_at?.toISOString?.() ?? row.archived_at,
    shortcut: row.shortcut_id
      ? {
          id: String(row.shortcut_id),
          name: {
            ja: String(row.shortcut_name_ja),
            zh: String(row.shortcut_name_zh),
            en: String(row.shortcut_name_en),
          },
          description: {
            ja: String(row.shortcut_description_ja),
            zh: String(row.shortcut_description_zh),
            en: String(row.shortcut_description_en),
          },
          starterPrompt: {
            ja: String(row.shortcut_starter_prompt_ja),
            zh: String(row.shortcut_starter_prompt_zh),
            en: String(row.shortcut_starter_prompt_en),
          },
        }
      : null,
    shortcutPromptSnapshot: row.shortcut_prompt_snapshot
      ? String(row.shortcut_prompt_snapshot)
      : null,
  };
}

export function createAiAssistantRepository(connectionString, onPoolError) {
  const pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => onPoolError?.(error));

  const columns = `
    session.conversation_id,
    session.owner_user_id,
    session.agent_gateway_setting_id,
    gateway.name AS gateway_name,
    session.project_ref,
    session.project_code,
    session.runtime_profile,
    session.title,
    session.status,
    session.last_task_id,
    session.created_at,
    session.updated_at,
    session.archived_at,
    session.shortcut_id,
    session.shortcut_prompt_snapshot,
    shortcut.name_ja AS shortcut_name_ja,
    shortcut.name_zh AS shortcut_name_zh,
    shortcut.name_en AS shortcut_name_en,
    shortcut.description_ja AS shortcut_description_ja,
    shortcut.description_zh AS shortcut_description_zh,
    shortcut.description_en AS shortcut_description_en,
    shortcut.starter_prompt_ja AS shortcut_starter_prompt_ja,
    shortcut.starter_prompt_zh AS shortcut_starter_prompt_zh,
    shortcut.starter_prompt_en AS shortcut_starter_prompt_en`;

  return {
    async listByOwner(ownerUserId, { includeArchived = false } = {}) {
      const result = await pool.query(
        `SELECT ${columns}
         FROM ai_assistant_sessions AS session
         JOIN agent_gateway_settings AS gateway
           ON gateway.id = session.agent_gateway_setting_id
         LEFT JOIN ai_assistant_shortcuts AS shortcut
           ON shortcut.id = session.shortcut_id
         WHERE session.owner_user_id = $1
           AND ($2::boolean OR session.status = 'ACTIVE')
         ORDER BY session.updated_at DESC, session.conversation_id`,
        [ownerUserId, includeArchived],
      );
      return result.rows.map(mapAiAssistantSession);
    },

    async getOwned(conversationId, ownerUserId) {
      const result = await pool.query(
        `SELECT ${columns}
         FROM ai_assistant_sessions AS session
         JOIN agent_gateway_settings AS gateway
           ON gateway.id = session.agent_gateway_setting_id
         LEFT JOIN ai_assistant_shortcuts AS shortcut
           ON shortcut.id = session.shortcut_id
         WHERE session.conversation_id = $1
           AND session.owner_user_id = $2`,
        [conversationId, ownerUserId],
      );
      return mapAiAssistantSession(result.rows[0]);
    },

    async create({
      conversationId,
      ownerUserId,
      gatewaySettingId,
      projectRef,
      projectCode,
      runtimeProfile,
      title,
      shortcutId = null,
      shortcutPromptSnapshot = null,
    }) {
      const result = await pool.query(
        `INSERT INTO ai_assistant_sessions (
           conversation_id,
           owner_user_id,
           agent_gateway_setting_id,
           project_ref,
           project_code,
           runtime_profile,
           title,
           shortcut_id,
           shortcut_prompt_snapshot
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING conversation_id`,
        [
          conversationId,
          ownerUserId,
          gatewaySettingId,
          projectRef,
          projectCode || "",
          runtimeProfile,
          title,
          shortcutId,
          shortcutPromptSnapshot,
        ],
      );
      return this.getOwned(result.rows[0].conversation_id, ownerUserId);
    },

    async rename(conversationId, ownerUserId, title) {
      const result = await pool.query(
        `UPDATE ai_assistant_sessions
         SET title = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1
           AND owner_user_id = $2
         RETURNING conversation_id`,
        [conversationId, ownerUserId, title],
      );
      return result.rows[0]
        ? this.getOwned(result.rows[0].conversation_id, ownerUserId)
        : null;
    },

    async touchTask(conversationId, ownerUserId, taskId) {
      const result = await pool.query(
        `UPDATE ai_assistant_sessions
         SET last_task_id = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1
           AND owner_user_id = $2
           AND status = 'ACTIVE'
         RETURNING conversation_id`,
        [conversationId, ownerUserId, taskId],
      );
      return Boolean(result.rowCount);
    },

    async archive(conversationId, ownerUserId) {
      const result = await pool.query(
        `UPDATE ai_assistant_sessions
         SET status = 'ARCHIVED',
             archived_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1
           AND owner_user_id = $2
           AND status = 'ACTIVE'
         RETURNING conversation_id`,
        [conversationId, ownerUserId],
      );
      return Boolean(result.rowCount);
    },

    async remove(conversationId, ownerUserId) {
      const result = await pool.query(
        `DELETE FROM ai_assistant_sessions
         WHERE conversation_id = $1
           AND owner_user_id = $2
         RETURNING conversation_id`,
        [conversationId, ownerUserId],
      );
      return Boolean(result.rowCount);
    },

    async close() {
      await pool.end();
    },
  };
}
