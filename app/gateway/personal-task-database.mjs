import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  decryptSensitiveValue,
  encryptSensitiveValue,
} from "./credential-crypto.mjs";

const { Pool } = pg;

function iso(value) {
  return value?.toISOString?.() ?? value ?? null;
}

function credentialContext(ownerUserId, accountId) {
  return `personal-task-account:${String(ownerUserId)}:${String(accountId)}`;
}

function decodeCredential(row) {
  if (!row?.encrypted_credentials) return {};
  return JSON.parse(
    decryptSensitiveValue(
      credentialContext(row.owner_user_id, row.id),
      row.encrypted_credentials,
    ),
  );
}

function mapLink(row) {
  if (!row?.link_id) return null;
  return {
    id: String(row.link_id),
    externalAccountId: String(row.link_external_account_id),
    providerCode: String(row.link_provider_code),
    externalObjectId: String(row.link_external_object_id),
    externalKey: String(row.link_external_key),
    externalUrl: String(row.link_external_url),
    externalStatus: String(row.link_external_status ?? ""),
    externalUpdatedAt: iso(row.link_external_updated_at),
  };
}

export function mapPersonalTask(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    title: String(row.title),
    taskType: String(row.task_type),
    status: String(row.status),
    priority: String(row.priority),
    description: String(row.description ?? ""),
    automationPrompt: String(row.automation_prompt ?? ""),
    promptScheduleEnabled: Boolean(row.prompt_schedule_enabled),
    dueAt: iso(row.due_at),
    nextReviewAt: iso(row.next_review_at),
    reviewCycle: row.review_cycle ? String(row.review_cycle) : null,
    customReviewDays:
      row.custom_review_days === null || row.custom_review_days === undefined
        ? null
        : Number(row.custom_review_days),
    revision: Number(row.revision),
    archivedAt: iso(row.archived_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    sourceLink: mapLink(row),
  };
}

export function mapExternalAccount(row, includeCredential = false) {
  if (!row) return null;
  const credential = includeCredential ? decodeCredential(row) : {};
  return {
    id: String(row.id),
    providerCode: String(row.provider_code),
    displayName: String(row.display_name),
    baseUrl: String(row.base_url),
    externalUsername: String(row.external_username ?? ""),
    credential: includeCredential ? String(credential.secret ?? "") : "",
    credentialConfigured: Boolean(row.encrypted_credentials),
    filters: row.filter_json ?? {},
    enabled: Boolean(row.enabled),
    syncIntervalMinutes: Number(row.sync_interval_minutes),
    lastSyncAt: iso(row.last_sync_at),
    lastCursor: row.last_cursor ? String(row.last_cursor) : null,
    lastSyncStatus: row.last_sync_status
      ? String(row.last_sync_status)
      : null,
    lastError:
      row.last_error_code || row.last_error_message
        ? {
            code: String(row.last_error_code ?? "SYNC_FAILED"),
            message: String(row.last_error_message ?? ""),
          }
        : null,
    revision: Number(row.revision),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapCandidate(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    externalAccountId: String(row.external_account_id),
    providerCode: String(row.provider_code),
    accountName: String(row.account_name),
    externalObjectId: String(row.external_object_id),
    externalKey: String(row.external_key),
    title: String(row.title),
    description: String(row.description ?? ""),
    externalStatus: String(row.external_status ?? ""),
    externalAssignee: String(row.external_assignee ?? ""),
    externalUrl: String(row.external_url),
    externalCreatedAt: iso(row.external_created_at),
    externalUpdatedAt: iso(row.external_updated_at),
    disposition: String(row.disposition),
    sourceData: row.source_data ?? {},
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapSyncRun(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : "",
    externalAccountId: String(row.external_account_id),
    accountName: String(row.account_name ?? ""),
    providerCode: String(row.provider_code ?? ""),
    triggerType: String(row.trigger_type),
    status: String(row.status),
    fetchedCount: Number(row.fetched_count),
    createdCount: Number(row.created_count),
    updatedCount: Number(row.updated_count),
    error:
      row.error_code || row.error_message
        ? {
            code: String(row.error_code ?? "SYNC_FAILED"),
            message: String(row.error_message ?? ""),
          }
        : null,
    startedAt: iso(row.started_at),
    completedAt: iso(row.completed_at),
  };
}

function mapPromptRun(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    triggerType: String(row.trigger_type),
    status: String(row.status),
    inputSnapshot: row.input_snapshot ?? {},
    result: row.result_json ?? null,
    error:
      row.error_code || row.error_message
        ? {
            code: String(row.error_code ?? "PROMPT_FAILED"),
            message: String(row.error_message ?? ""),
          }
        : null,
    createdAt: iso(row.created_at),
    startedAt: iso(row.started_at),
    completedAt: iso(row.completed_at),
  };
}

const taskSelect = `
  SELECT task.*,
         link.id AS link_id,
         link.external_account_id AS link_external_account_id,
         account.provider_code AS link_provider_code,
         link.external_object_id AS link_external_object_id,
         link.external_key AS link_external_key,
         link.external_url AS link_external_url,
         link.external_status AS link_external_status,
         link.external_updated_at AS link_external_updated_at
  FROM personal_tasks AS task
  LEFT JOIN personal_task_external_links AS link
    ON link.task_id = task.id AND link.owner_user_id = task.owner_user_id
  LEFT JOIN personal_task_external_accounts AS account
    ON account.id = link.external_account_id
`;

function taskParameters(input) {
  return [
    input.title,
    input.taskType,
    input.status,
    input.priority,
    input.description,
    input.automationPrompt,
    input.promptScheduleEnabled,
    input.dueAt,
    input.nextReviewAt,
    input.reviewCycle,
    input.customReviewDays,
  ];
}

export function createPersonalTaskRepository(connectionString, onPoolError) {
  const pool = new Pool({
    connectionString,
    max: 4,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => onPoolError?.(error));

  async function appendTaskEvent(
    executor,
    ownerUserId,
    taskId,
    eventType,
    eventData = {},
  ) {
    await executor.query(
      `INSERT INTO personal_task_events (
         task_id, owner_user_id, event_type, event_data
       )
       VALUES ($1, $2, $3, $4)`,
      [taskId, ownerUserId, eventType, eventData],
    );
  }

  async function taskById(ownerUserId, taskId, executor = pool) {
    const result = await executor.query(
      `${taskSelect}
       WHERE task.owner_user_id = $1 AND task.id = $2
       LIMIT 1`,
      [ownerUserId, taskId],
    );
    return mapPersonalTask(result.rows[0]);
  }

  return {
    async listTasks(ownerUserId, { includeArchived = false } = {}) {
      const result = await pool.query(
        `${taskSelect}
         WHERE task.owner_user_id = $1
           AND ($2::boolean OR task.archived_at IS NULL)
         ORDER BY
           CASE task.status WHEN 'COMPLETED' THEN 1 ELSE 0 END,
           COALESCE(task.due_at, task.next_review_at),
           task.updated_at DESC`,
        [ownerUserId, includeArchived],
      );
      return result.rows.map(mapPersonalTask);
    },

    async getTask(ownerUserId, taskId) {
      return taskById(ownerUserId, taskId);
    },

    async createTask(ownerUserId, input, eventType = "TASK_CREATED") {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          `INSERT INTO personal_tasks (
             owner_user_id, title, task_type, status, priority,
             description, automation_prompt, prompt_schedule_enabled,
             due_at, next_review_at, review_cycle, custom_review_days
           )
           VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
           )
           RETURNING id`,
          [ownerUserId, ...taskParameters(input)],
        );
        const taskId = result.rows[0].id;
        await appendTaskEvent(client, ownerUserId, taskId, eventType, {
          status: input.status,
        });
        await client.query("COMMIT");
        return taskById(ownerUserId, taskId);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async updateTask(ownerUserId, taskId, input) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const current = await client.query(
          `SELECT revision, status
           FROM personal_tasks
           WHERE owner_user_id = $1 AND id = $2
           FOR UPDATE`,
          [ownerUserId, taskId],
        );
        if (!current.rows[0]) {
          await client.query("ROLLBACK");
          return null;
        }
        if (Number(current.rows[0].revision) !== Number(input.revision)) {
          const error = new Error("Task was updated by another request.");
          error.code = "PERSONAL_TASK_REVISION_CONFLICT";
          error.statusCode = 409;
          throw error;
        }
        await client.query(
          `UPDATE personal_tasks
           SET title = $3,
               task_type = $4,
               status = $5,
               priority = $6,
               description = $7,
               automation_prompt = $8,
               prompt_schedule_enabled = $9,
               due_at = $10,
               next_review_at = $11,
               review_cycle = $12,
               custom_review_days = $13,
               revision = revision + 1,
               updated_at = CURRENT_TIMESTAMP
           WHERE owner_user_id = $1 AND id = $2`,
          [ownerUserId, taskId, ...taskParameters(input)],
        );
        await appendTaskEvent(client, ownerUserId, taskId, "TASK_UPDATED", {
          previousStatus: current.rows[0].status,
          status: input.status,
        });
        await client.query("COMMIT");
        return taskById(ownerUserId, taskId);
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async archiveTask(ownerUserId, taskId) {
      const result = await pool.query(
        `UPDATE personal_tasks
         SET archived_at = CURRENT_TIMESTAMP,
             revision = revision + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE owner_user_id = $1 AND id = $2 AND archived_at IS NULL
         RETURNING id`,
        [ownerUserId, taskId],
      );
      if (!result.rows[0]) return null;
      await appendTaskEvent(
        pool,
        ownerUserId,
        taskId,
        "TASK_ARCHIVED",
      );
      return taskById(ownerUserId, taskId);
    },

    async listEvents(ownerUserId, taskId) {
      const result = await pool.query(
        `SELECT id, event_type, event_data, created_at
         FROM personal_task_events
         WHERE owner_user_id = $1 AND task_id = $2
         ORDER BY created_at DESC`,
        [ownerUserId, taskId],
      );
      return result.rows.map((row) => ({
        id: String(row.id),
        eventType: String(row.event_type),
        eventData: row.event_data ?? {},
        createdAt: iso(row.created_at),
      }));
    },

    async getSummary(ownerUserId) {
      const result = await pool.query(
        `SELECT
           COUNT(*) FILTER (
             WHERE task_type = 'DEADLINE'
               AND status <> 'COMPLETED'
               AND due_at < CURRENT_TIMESTAMP
           ) AS overdue,
           COUNT(*) FILTER (
             WHERE task_type = 'DEADLINE'
               AND status <> 'COMPLETED'
               AND due_at >= date_trunc('day', CURRENT_TIMESTAMP)
               AND due_at < date_trunc('day', CURRENT_TIMESTAMP)
                 + INTERVAL '1 day'
           ) AS due_today,
           COUNT(*) FILTER (
             WHERE task_type = 'LONG_TERM'
               AND status <> 'COMPLETED'
               AND next_review_at <= CURRENT_TIMESTAMP
           ) AS review_due,
           (
             SELECT COUNT(*)
             FROM personal_task_candidates AS candidate
             WHERE candidate.owner_user_id = $1
               AND candidate.disposition = 'PENDING'
           ) AS candidates
         FROM personal_tasks
         WHERE owner_user_id = $1 AND archived_at IS NULL`,
        [ownerUserId],
      );
      const row = result.rows[0];
      return {
        overdue: Number(row.overdue),
        dueToday: Number(row.due_today),
        reviewDue: Number(row.review_due),
        candidates: Number(row.candidates),
      };
    },

    async listAccounts(ownerUserId, includeCredential = false) {
      const result = await pool.query(
        `SELECT *
         FROM personal_task_external_accounts
         WHERE owner_user_id = $1
         ORDER BY provider_code, display_name`,
        [ownerUserId],
      );
      return result.rows.map((row) =>
        mapExternalAccount(row, includeCredential),
      );
    },

    async getAccount(ownerUserId, accountId, includeCredential = false) {
      const result = await pool.query(
        `SELECT *
         FROM personal_task_external_accounts
         WHERE owner_user_id = $1 AND id = $2
         LIMIT 1`,
        [ownerUserId, accountId],
      );
      return mapExternalAccount(result.rows[0], includeCredential);
    },

    async saveAccount(ownerUserId, input) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const accountId = input.id || randomUUID();
        const currentResult = input.id
          ? await client.query(
              `SELECT *
               FROM personal_task_external_accounts
               WHERE owner_user_id = $1 AND id = $2
               FOR UPDATE`,
              [ownerUserId, input.id],
            )
          : { rows: [] };
        const current = currentResult.rows[0];
        if (input.id && !current) {
          await client.query("ROLLBACK");
          return null;
        }
        if (
          current &&
          Number(current.revision) !== Number(input.revision)
        ) {
          const error = new Error(
            "External account was updated by another request.",
          );
          error.code = "PERSONAL_TASK_ACCOUNT_REVISION_CONFLICT";
          error.statusCode = 409;
          throw error;
        }
        const previousCredential = current ? decodeCredential(current) : {};
        const secret =
          String(input.credential ?? "") ||
          String(previousCredential.secret ?? "");
        if (!secret) {
          const error = new Error("External account credential is required.");
          error.code = "PERSONAL_TASK_CREDENTIAL_REQUIRED";
          error.statusCode = 400;
          throw error;
        }
        const encrypted = encryptSensitiveValue(
          credentialContext(ownerUserId, accountId),
          JSON.stringify({ secret }),
        );
        const result = await client.query(
          `INSERT INTO personal_task_external_accounts (
             id, owner_user_id, provider_code, display_name, base_url,
             external_username, encrypted_credentials, filter_json,
             enabled, sync_interval_minutes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE
           SET provider_code = EXCLUDED.provider_code,
               display_name = EXCLUDED.display_name,
               base_url = EXCLUDED.base_url,
               external_username = EXCLUDED.external_username,
               encrypted_credentials = EXCLUDED.encrypted_credentials,
               filter_json = EXCLUDED.filter_json,
               enabled = EXCLUDED.enabled,
               sync_interval_minutes = EXCLUDED.sync_interval_minutes,
               revision = personal_task_external_accounts.revision + 1,
               updated_at = CURRENT_TIMESTAMP
           WHERE personal_task_external_accounts.owner_user_id = $2
           RETURNING *`,
          [
            accountId,
            ownerUserId,
            input.providerCode,
            input.displayName,
            input.baseUrl,
            input.externalUsername,
            encrypted,
            input.filters,
            input.enabled,
            input.syncIntervalMinutes,
          ],
        );
        await client.query("COMMIT");
        return mapExternalAccount(result.rows[0], true);
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async deleteAccount(ownerUserId, accountId) {
      const result = await pool.query(
        `DELETE FROM personal_task_external_accounts
         WHERE owner_user_id = $1 AND id = $2
         RETURNING id`,
        [ownerUserId, accountId],
      );
      return Boolean(result.rows[0]);
    },

    async listCandidates(ownerUserId, disposition = "PENDING") {
      const result = await pool.query(
        `SELECT candidate.*,
                account.provider_code,
                account.display_name AS account_name
         FROM personal_task_candidates AS candidate
         JOIN personal_task_external_accounts AS account
           ON account.id = candidate.external_account_id
          AND account.owner_user_id = candidate.owner_user_id
         WHERE candidate.owner_user_id = $1
           AND candidate.disposition = $2
         ORDER BY candidate.external_updated_at DESC NULLS LAST,
                  candidate.updated_at DESC`,
        [ownerUserId, disposition],
      );
      return result.rows.map(mapCandidate);
    },

    async dismissCandidate(ownerUserId, candidateId) {
      const result = await pool.query(
        `UPDATE personal_task_candidates
         SET disposition = 'DISMISSED', updated_at = CURRENT_TIMESTAMP
         WHERE owner_user_id = $1 AND id = $2
         RETURNING id`,
        [ownerUserId, candidateId],
      );
      return Boolean(result.rows[0]);
    },

    async adoptCandidate(ownerUserId, candidateId, taskInput) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const candidateResult = await client.query(
          `SELECT candidate.*, account.provider_code
           FROM personal_task_candidates AS candidate
           JOIN personal_task_external_accounts AS account
             ON account.id = candidate.external_account_id
            AND account.owner_user_id = candidate.owner_user_id
           WHERE candidate.owner_user_id = $1
             AND candidate.id = $2
             AND candidate.disposition = 'PENDING'
           FOR UPDATE`,
          [ownerUserId, candidateId],
        );
        const candidate = candidateResult.rows[0];
        if (!candidate) {
          await client.query("ROLLBACK");
          return null;
        }
        const taskResult = await client.query(
          `INSERT INTO personal_tasks (
             owner_user_id, title, task_type, status, priority,
             description, automation_prompt, prompt_schedule_enabled,
             due_at, next_review_at, review_cycle, custom_review_days
           )
           VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
           )
           RETURNING id`,
          [ownerUserId, ...taskParameters(taskInput)],
        );
        const taskId = taskResult.rows[0].id;
        await client.query(
          `INSERT INTO personal_task_external_links (
             task_id, owner_user_id, external_account_id, candidate_id,
             external_object_id, external_key, external_url,
             external_status, external_updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            taskId,
            ownerUserId,
            candidate.external_account_id,
            candidate.id,
            candidate.external_object_id,
            candidate.external_key,
            candidate.external_url,
            candidate.external_status,
            candidate.external_updated_at,
          ],
        );
        await client.query(
          `UPDATE personal_task_candidates
           SET disposition = 'ADOPTED', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [candidate.id],
        );
        await appendTaskEvent(
          client,
          ownerUserId,
          taskId,
          "CANDIDATE_ADOPTED",
          {
            candidateId: String(candidate.id),
            providerCode: String(candidate.provider_code),
            externalKey: String(candidate.external_key),
          },
        );
        await client.query("COMMIT");
        return taskById(ownerUserId, taskId);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async beginSync(ownerUserId, accountId, triggerType) {
      const client = await pool.connect();
      try {
        const lock = await client.query(
          "SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",
          [`personal-task-sync:${accountId}`],
        );
        if (!lock.rows[0]?.acquired) {
          client.release();
          return null;
        }
        const result = await client.query(
          `INSERT INTO personal_task_sync_runs (
             owner_user_id, external_account_id, trigger_type
           )
           SELECT $1, id, $3
           FROM personal_task_external_accounts
           WHERE owner_user_id = $1 AND id = $2
           RETURNING *`,
          [ownerUserId, accountId, triggerType],
        );
        if (!result.rows[0]) {
          await client.query(
            "SELECT pg_advisory_unlock(hashtext($1))",
            [`personal-task-sync:${accountId}`],
          );
          client.release();
          return null;
        }
        return {
          client,
          run: mapSyncRun(result.rows[0]),
        };
      } catch (error) {
        client.release();
        throw error;
      }
    },

    async finishSync(handle, result) {
      const { client, run } = handle;
      try {
        const completed = await client.query(
          `UPDATE personal_task_sync_runs
           SET status = $2,
               fetched_count = $3,
               created_count = $4,
               updated_count = $5,
               error_code = $6,
               error_message = $7,
               completed_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING *`,
          [
            run.id,
            result.status,
            result.fetchedCount ?? 0,
            result.createdCount ?? 0,
            result.updatedCount ?? 0,
            result.errorCode ?? null,
            result.errorMessage ?? null,
          ],
        );
        await client.query(
          `UPDATE personal_task_external_accounts
           SET last_sync_at = CURRENT_TIMESTAMP,
               last_sync_status = $3,
               last_error_code = $4,
               last_error_message = $5,
               last_cursor = COALESCE($6, last_cursor),
               updated_at = CURRENT_TIMESTAMP
           WHERE owner_user_id = $1 AND id = $2`,
          [
            run.ownerUserId,
            run.externalAccountId,
            result.status,
            result.errorCode ?? null,
            result.errorMessage ?? null,
            result.cursor ?? null,
          ],
        );
        return mapSyncRun(completed.rows[0]);
      } finally {
        await client.query(
          "SELECT pg_advisory_unlock(hashtext($1))",
          [`personal-task-sync:${run.externalAccountId}`],
        ).catch(() => {});
        client.release();
      }
    },

    async upsertCandidates(ownerUserId, accountId, items) {
      let createdCount = 0;
      let updatedCount = 0;
      for (const item of items) {
        const result = await pool.query(
          `INSERT INTO personal_task_candidates (
             owner_user_id, external_account_id, external_object_id,
             external_key, title, description, external_status,
             external_assignee, external_url, external_created_at,
             external_updated_at, source_data
           )
           VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
           )
           ON CONFLICT (external_account_id, external_object_id) DO UPDATE
           SET external_key = EXCLUDED.external_key,
               title = EXCLUDED.title,
               description = EXCLUDED.description,
               external_status = EXCLUDED.external_status,
               external_assignee = EXCLUDED.external_assignee,
               external_url = EXCLUDED.external_url,
               external_created_at = EXCLUDED.external_created_at,
               external_updated_at = EXCLUDED.external_updated_at,
               source_data = EXCLUDED.source_data,
               disposition = CASE
                 WHEN personal_task_candidates.disposition = 'DISMISSED'
                   AND personal_task_candidates.external_updated_at
                     IS DISTINCT FROM EXCLUDED.external_updated_at
                   THEN 'PENDING'
                 ELSE personal_task_candidates.disposition
               END,
               updated_at = CURRENT_TIMESTAMP
           RETURNING (xmax = 0) AS inserted`,
          [
            ownerUserId,
            accountId,
            item.externalObjectId,
            item.externalKey,
            item.title,
            item.description,
            item.externalStatus,
            item.externalAssignee,
            item.externalUrl,
            item.externalCreatedAt,
            item.externalUpdatedAt,
            item.sourceData,
          ],
        );
        if (result.rows[0]?.inserted) createdCount += 1;
        else updatedCount += 1;
        await pool.query(
          `UPDATE personal_task_external_links
           SET external_key = $4,
               external_url = $5,
               external_status = $6,
               external_updated_at = $7,
               updated_at = CURRENT_TIMESTAMP
           WHERE owner_user_id = $1
             AND external_account_id = $2
             AND external_object_id = $3`,
          [
            ownerUserId,
            accountId,
            item.externalObjectId,
            item.externalKey,
            item.externalUrl,
            item.externalStatus,
            item.externalUpdatedAt,
          ],
        );
      }
      return { createdCount, updatedCount };
    },

    async listSyncRuns(ownerUserId, limit = 50) {
      const result = await pool.query(
        `SELECT run.*, account.display_name AS account_name,
                account.provider_code
         FROM personal_task_sync_runs AS run
         JOIN personal_task_external_accounts AS account
           ON account.id = run.external_account_id
          AND account.owner_user_id = run.owner_user_id
         WHERE run.owner_user_id = $1
         ORDER BY run.started_at DESC
         LIMIT $2`,
        [ownerUserId, limit],
      );
      return result.rows.map(mapSyncRun);
    },

    async listDueAccounts() {
      const result = await pool.query(
        `SELECT owner_user_id, id
         FROM personal_task_external_accounts
         WHERE enabled
           AND (
             last_sync_at IS NULL
             OR last_sync_at
               <= CURRENT_TIMESTAMP
                  - make_interval(mins => sync_interval_minutes)
           )
         ORDER BY last_sync_at NULLS FIRST
         LIMIT 20`,
      );
      return result.rows.map((row) => ({
        ownerUserId: String(row.owner_user_id),
        accountId: String(row.id),
      }));
    },

    async createPromptRun(ownerUserId, taskId, triggerType) {
      const task = await taskById(ownerUserId, taskId);
      if (!task) return null;
      const result = await pool.query(
        `INSERT INTO personal_task_prompt_runs (
           task_id, owner_user_id, trigger_type, input_snapshot
         )
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          taskId,
          ownerUserId,
          triggerType,
          {
            title: task.title,
            description: task.description,
            automationPrompt: task.automationPrompt,
            sourceLink: task.sourceLink,
          },
        ],
      );
      return mapPromptRun(result.rows[0]);
    },

    async completePromptRun(ownerUserId, runId, resultValue) {
      const result = await pool.query(
        `UPDATE personal_task_prompt_runs
         SET status = 'COMPLETED',
             result_json = $3,
             started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
             completed_at = CURRENT_TIMESTAMP
         WHERE owner_user_id = $1 AND id = $2
         RETURNING *`,
        [ownerUserId, runId, resultValue],
      );
      return mapPromptRun(result.rows[0]);
    },

    async failPromptRun(ownerUserId, runId, error) {
      const result = await pool.query(
        `UPDATE personal_task_prompt_runs
         SET status = 'FAILED',
             error_code = $3,
             error_message = $4,
             started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
             completed_at = CURRENT_TIMESTAMP
         WHERE owner_user_id = $1 AND id = $2
         RETURNING *`,
        [
          ownerUserId,
          runId,
          error.code ?? "PERSONAL_TASK_PROMPT_FAILED",
          error.message,
        ],
      );
      return mapPromptRun(result.rows[0]);
    },

    async listPromptRuns(ownerUserId, taskId) {
      const result = await pool.query(
        `SELECT *
         FROM personal_task_prompt_runs
         WHERE owner_user_id = $1 AND task_id = $2
         ORDER BY created_at DESC`,
        [ownerUserId, taskId],
      );
      return result.rows.map(mapPromptRun);
    },

    async listDuePromptTasks() {
      const result = await pool.query(
        `${taskSelect}
         WHERE task.prompt_schedule_enabled
           AND task.automation_prompt <> ''
           AND task.status <> 'COMPLETED'
           AND task.archived_at IS NULL
           AND EXISTS (
             SELECT 1
             FROM user_role_assignments AS assignment
             JOIN role_permissions AS role_permission
               ON role_permission.role_id = assignment.role_id
             JOIN permissions AS permission
               ON permission.id = role_permission.permission_id
             WHERE assignment.user_id = task.owner_user_id
               AND assignment.organization_id IS NULL
               AND permission.code = 'ai.assistant.use'
           )
           AND NOT EXISTS (
             SELECT 1
             FROM personal_task_prompt_runs AS run
             WHERE run.owner_user_id = task.owner_user_id
               AND run.task_id = task.id
               AND run.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
           )
         ORDER BY task.updated_at
         LIMIT 10`,
      );
      return result.rows.map((row) => ({
        ownerUserId: String(row.owner_user_id),
        task: mapPersonalTask(row),
      }));
    },

    async close() {
      await pool.end();
    },
  };
}
