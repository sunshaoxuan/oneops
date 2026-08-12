import pg from "pg";

const { Pool } = pg;
const terminalTaskStatuses = new Set(["completed", "failed", "cancelled"]);

export function mapAiAssistantSession(row) {
  if (!row) return null;
  return {
    id: String(row.conversation_id),
    ownerUserId: String(row.owner_user_id),
    title: String(row.title),
    status: String(row.status),
    lastTaskId: row.last_task_id ? String(row.last_task_id) : null,
    inquiryTicketNo: row.inquiry_ticket_no
      ? String(row.inquiry_ticket_no)
      : null,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
    archivedAt: row.archived_at?.toISOString?.() ?? row.archived_at,
    startingModel: {
      id: String(row.model_setting_id),
      model: String(row.model_snapshot),
      reasoningEffort: String(row.reasoning_effort_snapshot),
      speedLevel: String(row.speed_level_snapshot),
    },
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

export function mapAiAssistantTask(row) {
  if (!row) return null;
  const status = String(row.status);
  const completed = status === "completed";
  return {
    id: String(row.id),
    conversation_id: String(row.conversation_id),
    status,
    prompt: String(row.prompt),
    inquiryContext: row.inquiry_context ?? null,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    routing: row.routing && typeof row.routing === "object" ? row.routing : {},
    messageState: String(row.message_state ?? "VISIBLE"),
    messagePosition: Number(row.message_position ?? 0),
    intentAnalysis: row.intent_analysis && typeof row.intent_analysis === "object"
      ? row.intent_analysis
      : null,
    modelSettingId: String(row.model_setting_id),
    model: String(row.model_snapshot),
    reasoningEffort: String(row.reasoning_effort_snapshot),
    providerResponseId: row.provider_response_id
      ? String(row.provider_response_id)
      : null,
    providerOutput: Array.isArray(row.provider_output)
      ? row.provider_output
      : [],
    tokenUsage: row.token_usage ?? null,
    errorCode: row.error_code ? String(row.error_code) : null,
    error: row.error_message ? String(row.error_message) : null,
    final_report: completed && row.output_text
      ? { summary: String(row.output_text) }
      : null,
    created_at: row.created_at?.toISOString?.() ?? row.created_at,
    completed_at: row.completed_at?.toISOString?.() ?? row.completed_at,
  };
}

export function mapAiAssistantTaskEvent(row) {
  if (!row) return null;
  const sequence = Number(row.sequence);
  const timestamp = row.created_at?.toISOString?.() ?? String(row.created_at);
  return {
    event_id: String(row.id),
    task_id: String(row.task_id),
    sequence,
    type: String(row.event_type),
    timestamp,
    data: row.event_data && typeof row.event_data === "object"
      ? row.event_data
      : {},
  };
}

function aiAssistantLockError(error) {
  if (error?.code !== "55P03" && error?.code !== "23505") return error;
  return Object.assign(
    new Error("An AI assistant response is already in progress."),
    {
      code: "AI_ASSISTANT_RESPONSE_IN_PROGRESS",
      cause: error,
    },
  );
}

function sessionNotFound() {
  return Object.assign(new Error("AI assistant session was not found."), {
    code: "AI_ASSISTANT_SESSION_NOT_FOUND",
  });
}

function taskNotFound() {
  return Object.assign(new Error("AI assistant task was not found."), {
    code: "AI_ASSISTANT_TASK_NOT_FOUND",
  });
}

function sessionArchived() {
  return Object.assign(new Error("AI assistant session is archived."), {
    code: "AI_ASSISTANT_SESSION_ARCHIVED",
  });
}

async function transaction(pool, operation) {
  const client = await pool.connect();
  let started = false;
  try {
    await client.query("BEGIN");
    started = true;
    const result = await operation(client);
    await client.query("COMMIT");
    started = false;
    return result;
  } catch (error) {
    if (started) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // 元の失敗を保持する。
      }
    }
    throw aiAssistantLockError(error);
  } finally {
    client.release();
  }
}

async function appendTaskEvent(client, taskId, eventType, eventData = {}) {
  const sequenceResult = await client.query(
    `UPDATE ai_assistant_tasks
     SET last_event_sequence = last_event_sequence + 1
     WHERE id = $1
     RETURNING last_event_sequence`,
    [taskId],
  );
  if (!sequenceResult.rows[0]) throw taskNotFound();
  const sequence = Number(sequenceResult.rows[0].last_event_sequence);
  const result = await client.query(
    `INSERT INTO ai_assistant_task_events (
       task_id, sequence, event_type, event_data
     ) VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [taskId, sequence, eventType, eventData],
  );
  return mapAiAssistantTaskEvent(result.rows[0]);
}

export function createAiAssistantRepository(
  connectionString,
  onPoolError,
  { pool: suppliedPool = null } = {},
) {
  const pool = suppliedPool ?? new Pool({
    connectionString,
    max: 8,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 5_000,
    lock_timeout: 1_000,
    query_timeout: 5_500,
  });
  pool.on?.("error", (error) => onPoolError?.(error));

  const sessionColumns = `
    session.conversation_id,
    session.owner_user_id,
    session.title,
    session.status,
    session.last_task_id,
    session.inquiry_ticket_no,
    session.created_at,
    session.updated_at,
    session.archived_at,
    session.shortcut_id,
    session.shortcut_prompt_snapshot,
    session.model_setting_id,
    session.model_snapshot,
    session.reasoning_effort_snapshot,
    session.speed_level_snapshot,
    shortcut.name_ja AS shortcut_name_ja,
    shortcut.name_zh AS shortcut_name_zh,
    shortcut.name_en AS shortcut_name_en,
    shortcut.description_ja AS shortcut_description_ja,
    shortcut.description_zh AS shortcut_description_zh,
    shortcut.description_en AS shortcut_description_en,
    shortcut.starter_prompt_ja AS shortcut_starter_prompt_ja,
    shortcut.starter_prompt_zh AS shortcut_starter_prompt_zh,
    shortcut.starter_prompt_en AS shortcut_starter_prompt_en`;

  const taskColumns = `
    task.id,
    task.conversation_id,
    task.model_setting_id,
    task.model_snapshot,
    task.reasoning_effort_snapshot,
    task.status,
    task.prompt,
    task.inquiry_context,
    task.attachments,
    task.routing,
    task.message_state,
    task.message_position,
    task.intent_analysis,
    task.output_text,
    task.provider_response_id,
    task.provider_output,
    task.token_usage,
    task.error_code,
    task.error_message,
    task.cancel_requested_at,
    task.last_event_sequence,
    task.created_at,
    task.started_at,
    task.completed_at`;

  async function getSession(executor, conversationId, ownerUserId) {
    const result = await executor.query(
      `SELECT ${sessionColumns}
       FROM ai_assistant_sessions AS session
       LEFT JOIN ai_assistant_shortcuts AS shortcut
         ON shortcut.id = session.shortcut_id
       WHERE session.conversation_id = $1
         AND session.owner_user_id = $2`,
      [conversationId, ownerUserId],
    );
    return mapAiAssistantSession(result.rows[0]);
  }

  async function getTask(executor, taskId) {
    const result = await executor.query(
      `SELECT ${taskColumns}
       FROM ai_assistant_tasks AS task
       WHERE task.id = $1`,
      [taskId],
    );
    return mapAiAssistantTask(result.rows[0]);
  }

  async function getTaskOwned(conversationId, ownerUserId, taskId) {
    const result = await pool.query(
      `SELECT ${taskColumns}
       FROM ai_assistant_tasks AS task
       JOIN ai_assistant_sessions AS session
         ON session.conversation_id = task.conversation_id
       WHERE task.conversation_id = $1
         AND session.owner_user_id = $2
         AND task.id = $3`,
      [conversationId, ownerUserId, taskId],
    );
    return mapAiAssistantTask(result.rows[0]);
  }

  async function lockTask(client, taskId) {
    const result = await client.query(
      `SELECT *
       FROM ai_assistant_tasks
       WHERE id = $1
       FOR UPDATE`,
      [taskId],
    );
    if (!result.rows[0]) throw taskNotFound();
    return result.rows[0];
  }

  return {
    async listByOwner(ownerUserId, { includeArchived = false } = {}) {
      const result = await pool.query(
        `SELECT ${sessionColumns}
         FROM ai_assistant_sessions AS session
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
      return getSession(pool, conversationId, ownerUserId);
    },

    async create({
      conversationId,
      ownerUserId,
      title,
      shortcutId = null,
      shortcutPromptSnapshot = null,
      inquiryTicketNo = null,
      modelSettingId,
      modelSnapshot,
      reasoningEffortSnapshot,
      speedLevelSnapshot,
    }) {
      const result = await pool.query(
        `INSERT INTO ai_assistant_sessions (
           conversation_id,
           owner_user_id,
           title,
           shortcut_id,
           shortcut_prompt_snapshot,
           inquiry_ticket_no,
           model_setting_id,
           model_snapshot,
           reasoning_effort_snapshot,
           speed_level_snapshot
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING conversation_id`,
        [
          conversationId,
          ownerUserId,
          title,
          shortcutId,
          shortcutPromptSnapshot,
          inquiryTicketNo,
          modelSettingId,
          modelSnapshot,
          reasoningEffortSnapshot,
          speedLevelSnapshot,
        ],
      );
      return getSession(pool, result.rows[0].conversation_id, ownerUserId);
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
        ? getSession(pool, result.rows[0].conversation_id, ownerUserId)
        : null;
    },

    async archive(conversationId, ownerUserId) {
      const result = await pool.query(
        `UPDATE ai_assistant_sessions AS session
         SET status = 'ARCHIVED',
             archived_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE session.conversation_id = $1
           AND session.owner_user_id = $2
           AND session.status = 'ACTIVE'
           AND NOT EXISTS (
             SELECT 1 FROM ai_assistant_tasks AS task
             WHERE task.conversation_id = session.conversation_id
               AND task.status IN ('queued', 'running')
           )
         RETURNING conversation_id`,
        [conversationId, ownerUserId],
      );
      return Boolean(result.rowCount);
    },

    async remove(conversationId, ownerUserId) {
      const result = await pool.query(
        `DELETE FROM ai_assistant_sessions AS session
         WHERE session.conversation_id = $1
           AND session.owner_user_id = $2
           AND NOT EXISTS (
             SELECT 1 FROM ai_assistant_tasks AS task
             WHERE task.conversation_id = session.conversation_id
               AND task.status IN ('queued', 'running')
           )
         RETURNING conversation_id`,
        [conversationId, ownerUserId],
      );
      return result.rows[0]
        ? { id: String(result.rows[0].conversation_id) }
        : null;
    },

    async listTasksOwned(conversationId, ownerUserId) {
      const result = await pool.query(
        `SELECT ${taskColumns}
         FROM ai_assistant_tasks AS task
         JOIN ai_assistant_sessions AS session
           ON session.conversation_id = task.conversation_id
         WHERE task.conversation_id = $1
           AND session.owner_user_id = $2
           AND task.message_state = 'VISIBLE'
         ORDER BY task.message_position, task.created_at, task.id`,
        [conversationId, ownerUserId],
      );
      return result.rows.map(mapAiAssistantTask);
    },

    async getTaskOwned(conversationId, ownerUserId, taskId) {
      return getTaskOwned(conversationId, ownerUserId, taskId);
    },

    async createTask({
      id,
      conversationId,
      ownerUserId,
      prompt,
      inquiryContext = null,
      attachments = [],
      routing = {},
      requestId = null,
      replacesTaskId = null,
    }) {
      return transaction(pool, async (client) => {
        const locked = await client.query(
          `SELECT status, model_setting_id, model_snapshot,
                  reasoning_effort_snapshot, inquiry_ticket_no
           FROM ai_assistant_sessions
           WHERE conversation_id = $1
             AND owner_user_id = $2
           FOR UPDATE NOWAIT`,
          [conversationId, ownerUserId],
        );
        if (!locked.rows[0]) throw sessionNotFound();
        if (locked.rows[0].status !== "ACTIVE") throw sessionArchived();
        const taskTicketNo = String(inquiryContext?.ticketNo ?? "").trim();
        const sessionTicketNo = String(
          locked.rows[0].inquiry_ticket_no ?? "",
        ).trim();
        if (taskTicketNo && sessionTicketNo && taskTicketNo !== sessionTicketNo) {
          throw Object.assign(
            new Error("AI assistant session is linked to another inquiry ticket."),
            { code: "AI_ASSISTANT_INQUIRY_TICKET_MISMATCH" },
          );
        }
        const active = await client.query(
          `SELECT id
           FROM ai_assistant_tasks
           WHERE conversation_id = $1
             AND status IN ('queued', 'running')
           LIMIT 1`,
          [conversationId],
        );
        if (active.rows[0]) {
          throw Object.assign(
            new Error("An AI assistant response is already in progress."),
            { code: "AI_ASSISTANT_RESPONSE_IN_PROGRESS" },
          );
        }
        let messagePosition;
        if (replacesTaskId) {
          const anchor = await client.query(
            `SELECT message_position
             FROM ai_assistant_tasks
             WHERE id = $1 AND conversation_id = $2
               AND message_state = 'VISIBLE'
             FOR UPDATE`,
            [replacesTaskId, conversationId],
          );
          if (!anchor.rows[0]) throw Object.assign(new Error("Retry target not found."), { code: "AI_ASSISTANT_TASK_NOT_FOUND" });
          messagePosition = Number(anchor.rows[0].message_position);
          await client.query(
            `UPDATE ai_assistant_tasks
             SET message_state = CASE WHEN id = $2 THEN 'REPLACED' ELSE 'TRUNCATED' END
             WHERE conversation_id = $1
               AND message_state = 'VISIBLE'
               AND message_position >= $3`,
            [conversationId, replacesTaskId, messagePosition],
          );
        } else {
          const position = await client.query(
            `SELECT COALESCE(MAX(message_position), 0) + 1 AS message_position
             FROM ai_assistant_tasks WHERE conversation_id = $1`,
            [conversationId],
          );
          messagePosition = Number(position.rows[0].message_position);
        }
        await client.query(
          `INSERT INTO ai_assistant_tasks (
             id, conversation_id, model_setting_id, model_snapshot,
             reasoning_effort_snapshot, prompt, inquiry_context,
             attachments, routing, request_id, message_state, message_position
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'VISIBLE', $11)`,
          [
            id,
            conversationId,
            locked.rows[0].model_setting_id,
            locked.rows[0].model_snapshot,
            locked.rows[0].reasoning_effort_snapshot,
            prompt,
            inquiryContext,
            JSON.stringify(attachments),
            JSON.stringify(routing),
            requestId,
            messagePosition,
          ],
        );
        await appendTaskEvent(client, id, "task.created", {
          model: String(locked.rows[0].model_snapshot),
          reasoning_effort: String(
            locked.rows[0].reasoning_effort_snapshot,
          ).toLowerCase(),
        });
        await client.query(
          `UPDATE ai_assistant_sessions
           SET last_task_id = $3,
               inquiry_ticket_no = COALESCE(inquiry_ticket_no, $4),
               updated_at = CURRENT_TIMESTAMP
           WHERE conversation_id = $1
             AND owner_user_id = $2`,
          [conversationId, ownerUserId, id, taskTicketNo || null],
        );
        return getTask(client, id);
      });
    },

    async executionContext(taskId) {
      const result = await pool.query(
        `SELECT ${taskColumns},
                session.owner_user_id,
                session.shortcut_prompt_snapshot,
                session.speed_level_snapshot
         FROM ai_assistant_tasks AS task
         JOIN ai_assistant_sessions AS session
           ON session.conversation_id = task.conversation_id
         WHERE task.id = $1`,
        [taskId],
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        task: mapAiAssistantTask(row),
        ownerUserId: String(row.owner_user_id),
        shortcutPromptSnapshot: row.shortcut_prompt_snapshot
          ? String(row.shortcut_prompt_snapshot)
          : null,
      };
    },

    async modelHistory(taskId) {
      const currentResult = await pool.query(
        `SELECT conversation_id, created_at
         FROM ai_assistant_tasks
         WHERE id = $1`,
        [taskId],
      );
      const current = currentResult.rows[0];
      if (!current) throw taskNotFound();
      const result = await pool.query(
        `SELECT ${taskColumns}
         FROM ai_assistant_tasks AS task
         WHERE task.conversation_id = $1
           AND (task.created_at, task.id) < ($2, $3)
           AND task.status IN ('completed', 'failed', 'cancelled')
         ORDER BY task.created_at DESC, task.id DESC`,
        [current.conversation_id, current.created_at, taskId],
      );
      return result.rows.reverse().map(mapAiAssistantTask);
    },

    async markTaskRunning(taskId) {
      return transaction(pool, async (client) => {
        const task = await lockTask(client, taskId);
        if (task.status !== "queued") return mapAiAssistantTask(task);
        const result = await client.query(
          `UPDATE ai_assistant_tasks
           SET status = 'running',
               started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
           WHERE id = $1
           RETURNING *`,
          [taskId],
        );
        await appendTaskEvent(client, taskId, "task.started", {});
        return mapAiAssistantTask(result.rows[0]);
      });
    },

    async setProviderResponseId(taskId, providerResponseId) {
      const result = await pool.query(
        `UPDATE ai_assistant_tasks
         SET provider_response_id = COALESCE(provider_response_id, $2)
         WHERE id = $1
           AND status IN ('queued', 'running')
         RETURNING id`,
        [taskId, providerResponseId],
      );
      return Boolean(result.rowCount);
    },

    async setIntentAnalysis(taskId, intentAnalysis, routing) {
      return transaction(pool, async (client) => {
        const task = await lockTask(client, taskId);
        if (!["queued", "running"].includes(task.status)) return false;
        const result = await client.query(
          `UPDATE ai_assistant_tasks
           SET intent_analysis = $2::jsonb,
               routing = $3::jsonb
           WHERE id = $1
           RETURNING *`,
          [taskId, JSON.stringify(intentAnalysis), JSON.stringify(routing)],
        );
        await appendTaskEvent(client, taskId, "task.routing", {
          taskClass: routing.taskClass,
          targetLanguage: routing.targetLanguage,
        });
        return mapAiAssistantTask(result.rows[0]);
      });
    },

    async appendTaskDelta(taskId, delta) {
      if (!delta) return false;
      return transaction(pool, async (client) => {
        const task = await lockTask(client, taskId);
        if (task.status !== "running" || task.cancel_requested_at) return false;
        await client.query(
          `UPDATE ai_assistant_tasks
           SET output_text = COALESCE(output_text, '') || $2
           WHERE id = $1`,
          [taskId, delta],
        );
        await appendTaskEvent(client, taskId, "agent.message.delta", { delta });
        return true;
      });
    },

    async completeTask(
      taskId,
      outputText,
      providerResponseId = null,
      tokenUsage = null,
      providerOutput = [],
    ) {
      return transaction(pool, async (client) => {
        const task = await lockTask(client, taskId);
        if (terminalTaskStatuses.has(task.status)) {
          return mapAiAssistantTask(task);
        }
        if (task.cancel_requested_at) {
          const cancelled = await client.query(
            `UPDATE ai_assistant_tasks
             SET status = 'cancelled',
                 completed_at = CURRENT_TIMESTAMP,
                 provider_response_id = COALESCE(provider_response_id, $2),
               token_usage = COALESCE($3, token_usage),
               provider_output = $4
             WHERE id = $1
             RETURNING *`,
            [
              taskId,
              providerResponseId,
              tokenUsage,
              JSON.stringify(providerOutput),
            ],
          );
          await appendTaskEvent(client, taskId, "task.cancelled", {});
          return mapAiAssistantTask(cancelled.rows[0]);
        }
        const completed = await client.query(
          `UPDATE ai_assistant_tasks
           SET status = 'completed',
               output_text = $2,
               provider_response_id = COALESCE(provider_response_id, $3),
               token_usage = $4,
               provider_output = $5,
               completed_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING *`,
          [
            taskId,
            outputText,
            providerResponseId,
            tokenUsage,
            JSON.stringify(providerOutput),
          ],
        );
        await appendTaskEvent(client, taskId, "agent.message", {
          text: outputText,
        });
        await appendTaskEvent(client, taskId, "task.completed", {});
        return mapAiAssistantTask(completed.rows[0]);
      });
    },

    async failTask(taskId, errorCode, errorMessage) {
      return transaction(pool, async (client) => {
        const task = await lockTask(client, taskId);
        if (terminalTaskStatuses.has(task.status)) {
          return mapAiAssistantTask(task);
        }
        if (task.cancel_requested_at) {
          const cancelled = await client.query(
            `UPDATE ai_assistant_tasks
             SET status = 'cancelled',
                 completed_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [taskId],
          );
          await appendTaskEvent(client, taskId, "task.cancelled", {});
          return mapAiAssistantTask(cancelled.rows[0]);
        }
        const failed = await client.query(
          `UPDATE ai_assistant_tasks
           SET status = 'failed',
               error_code = $2,
               error_message = $3,
               completed_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING *`,
          [taskId, errorCode, errorMessage],
        );
        await appendTaskEvent(client, taskId, "task.failed", {
          code: errorCode,
          error: errorMessage,
        });
        return mapAiAssistantTask(failed.rows[0]);
      });
    },

    async requestCancelOwned(conversationId, ownerUserId, taskId) {
      return transaction(pool, async (client) => {
        const sessionResult = await client.query(
          `SELECT status, last_task_id
           FROM ai_assistant_sessions
           WHERE conversation_id = $1
             AND owner_user_id = $2
           FOR UPDATE NOWAIT`,
          [conversationId, ownerUserId],
        );
        const session = sessionResult.rows[0];
        if (!session) throw sessionNotFound();
        if (session.status !== "ACTIVE") throw sessionArchived();
        if (String(session.last_task_id ?? "") !== String(taskId)) {
          throw taskNotFound();
        }
        const task = await lockTask(client, taskId);
        if (String(task.conversation_id) !== String(conversationId)) {
          throw taskNotFound();
        }
        if (terminalTaskStatuses.has(task.status)) {
          return { status: "already_terminal", task: mapAiAssistantTask(task) };
        }
        if (task.status === "queued") {
          const cancelled = await client.query(
            `UPDATE ai_assistant_tasks
             SET status = 'cancelled',
                 cancel_requested_at = CURRENT_TIMESTAMP,
                 completed_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [taskId],
          );
          await appendTaskEvent(client, taskId, "task.cancelled", {});
          return { status: "cancelled", task: mapAiAssistantTask(cancelled.rows[0]) };
        }
        const requested = await client.query(
          `UPDATE ai_assistant_tasks
           SET cancel_requested_at = COALESCE(
             cancel_requested_at,
             CURRENT_TIMESTAMP
           )
           WHERE id = $1
           RETURNING *`,
          [taskId],
        );
        return { status: "requested", task: mapAiAssistantTask(requested.rows[0]) };
      });
    },

    async listTaskEventsOwned(
      conversationId,
      ownerUserId,
      taskId,
      afterSequence = 0,
      limit = 200,
    ) {
      const result = await pool.query(
        `SELECT event.*, task.status AS task_status
         FROM ai_assistant_task_events AS event
         JOIN ai_assistant_tasks AS task ON task.id = event.task_id
         JOIN ai_assistant_sessions AS session
           ON session.conversation_id = task.conversation_id
         WHERE task.id = $1
           AND task.conversation_id = $2
           AND session.owner_user_id = $3
           AND event.sequence > $4
         ORDER BY event.sequence
         LIMIT $5`,
        [taskId, conversationId, ownerUserId, afterSequence, limit],
      );
      if (!result.rows.length) {
        const task = await getTaskOwned(
          conversationId,
          ownerUserId,
          taskId,
        );
        if (!task) throw taskNotFound();
        return { taskStatus: task.status, events: [] };
      }
      return {
        taskStatus: String(result.rows.at(-1).task_status),
        events: result.rows.map(mapAiAssistantTaskEvent),
      };
    },

    async recoverInterruptedTasks() {
      return transaction(pool, async (client) => {
        const result = await client.query(
          `SELECT id
           FROM ai_assistant_tasks
           WHERE status IN ('queued', 'running')
           ORDER BY created_at
           FOR UPDATE`,
        );
        for (const row of result.rows) {
          await client.query(
            `UPDATE ai_assistant_tasks
             SET status = 'failed',
                 error_code = 'AI_ASSISTANT_GATEWAY_RESTARTED',
                 error_message = 'AI assistant execution was interrupted by a gateway restart.',
                 completed_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [row.id],
          );
          await appendTaskEvent(client, row.id, "task.failed", {
            code: "AI_ASSISTANT_GATEWAY_RESTARTED",
            error: "AI assistant execution was interrupted by a gateway restart.",
          });
        }
        return result.rowCount;
      });
    },

    async close() {
      await pool.end();
    },
  };
}
