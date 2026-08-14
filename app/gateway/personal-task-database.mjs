import { randomUUID } from "node:crypto";
import pg from "pg";
import { decryptSensitiveValue } from "./credential-crypto.mjs";

const { Pool } = pg;

function iso(value) {
  return value?.toISOString?.() ?? value ?? null;
}

function sourceCredentialContext(sourceId) {
  return `inquiry-source:${String(sourceId)}`;
}

function decodeSourceCredential(row) {
  if (!row?.encrypted_credentials) return {};
  return JSON.parse(
    decryptSensitiveValue(
      sourceCredentialContext(row.source_id),
      row.encrypted_credentials,
    ),
  );
}

function mapLink(row) {
  if (!row?.link_id) return null;
  return {
    id: String(row.link_id),
    externalSystemId: String(row.link_external_system_id),
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

export function mapCandidate(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    externalSystemId: String(row.external_system_id),
    userExternalProfileId: String(row.user_external_profile_id),
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
    seenFilterRevision: Number(row.seen_filter_revision ?? 1),
    sourceData: row.source_data ?? {},
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapUserNotification(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    type: String(row.notification_type),
    title: String(row.title),
    body: String(row.body),
    resourceType: String(row.resource_type),
    resourceId: String(row.resource_id),
    sourceSystemId: row.source_system_id ? String(row.source_system_id) : null,
    sourceCode: row.source_code ? String(row.source_code) : null,
    sourceName: row.source_name ? String(row.source_name) : null,
    sourceObjectId: row.source_object_id ? String(row.source_object_id) : null,
    sourceKey: row.source_key ? String(row.source_key) : null,
    actionPath: String(row.action_path),
    readAt: iso(row.read_at),
    createdAt: iso(row.created_at),
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
         link.external_system_id AS link_external_system_id,
         system.code AS link_provider_code,
         link.external_object_id AS link_external_object_id,
         link.external_key AS link_external_key,
         link.external_url AS link_external_url,
         link.external_status AS link_external_status,
         link.external_updated_at AS link_external_updated_at
  FROM personal_tasks AS task
  LEFT JOIN personal_task_external_links AS link
    ON link.task_id = task.id AND link.owner_user_id = task.owner_user_id
  LEFT JOIN external_systems AS system
    ON system.id = link.external_system_id
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

    async listCandidates(ownerUserId, disposition = "PENDING") {
      const result = await pool.query(
        `SELECT candidate.*,
                system.code AS provider_code,
                system.name AS account_name
         FROM personal_task_candidates AS candidate
         JOIN external_systems AS system
           ON system.id = candidate.external_system_id
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
          `SELECT candidate.*, system.code AS provider_code
           FROM personal_task_candidates AS candidate
           JOIN external_systems AS system
             ON system.id = candidate.external_system_id
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
             task_id, owner_user_id, external_system_id,
             user_external_profile_id, candidate_id,
             external_object_id, external_key, external_url,
             external_status, external_updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            taskId,
            ownerUserId,
            candidate.external_system_id,
            candidate.user_external_profile_id,
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

    async listDueProfiles() {
      const result = await pool.query(
        `SELECT profile.id, profile.user_id, profile.external_user_id,
                profile.external_user_code, profile.external_display_name,
                profile.last_cursor, system.id AS external_system_id,
                system.code AS provider_code, source.id AS source_id,
                source.base_url, source.filter_json,
                source.encrypted_credentials
         FROM user_external_profiles profile
         JOIN external_systems system ON system.id = profile.external_system_id
         JOIN inquiry_source_settings source ON source.external_system_id = system.id
         WHERE profile.enabled AND system.enabled AND source.enabled
           AND system.code IN ('BACKLOG', 'INQUIRY')
           AND (profile.last_sync_at IS NULL OR profile.last_sync_at <= CURRENT_TIMESTAMP - make_interval(mins => source.sync_interval_minutes))
         ORDER BY profile.last_sync_at NULLS FIRST
         LIMIT 50`,
      );
      return result.rows.map((row) => {
        const credential = decodeSourceCredential(row);
        return {
          id: String(row.id), ownerUserId: String(row.user_id),
          externalSystemId: String(row.external_system_id),
          providerCode: String(row.provider_code), externalUserId: String(row.external_user_id),
          externalUserCode: String(row.external_user_code ?? ""),
          ownerDisplayName: String(row.external_display_name ?? ""),
          baseUrl: String(row.base_url), systemUsername: String(credential.username ?? ""),
          credential: String(credential.apiKey || credential.password || ""),
          filters: row.filter_json ?? {}, lastCursor: row.last_cursor ? String(row.last_cursor) : null,
        };
      });
    },

    async finishProfileSync(profileId, result) {
      await pool.query(
        `UPDATE user_external_profiles SET last_sync_at = CURRENT_TIMESTAMP,
             last_sync_status = $2, last_error_code = $3, last_error_message = $4,
             last_cursor = COALESCE($5, last_cursor), updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [profileId, result.status, result.errorCode ?? null, result.errorMessage ?? null, result.cursor ?? null],
      );
    },

    async upsertCandidates(ownerUserId, profileId, externalSystemId, items) {
      const client = await pool.connect();
      let createdCount = 0;
      let updatedCount = 0;
      let staleCount = 0;
      try {
        await client.query("BEGIN");
        for (const item of items) {
          if (item.terminal) {
            const staleResult = await client.query(
              `UPDATE personal_task_candidates
               SET external_key = $3,
                   title = $4,
                   description = $5,
                   external_status = $6,
                   external_assignee = $7,
                   external_url = $8,
                   external_created_at = $9,
                   external_updated_at = $10,
                   source_data = $11,
                   disposition = 'STALE',
                   updated_at = CURRENT_TIMESTAMP
               WHERE owner_user_id = $1
                 AND user_external_profile_id = $2
                 AND external_object_id = $12
                 AND disposition = 'PENDING'
               RETURNING id`,
              [
                ownerUserId,
                profileId,
                item.externalKey,
                item.title,
                item.description,
                item.externalStatus,
                item.externalAssignee,
                item.externalUrl,
                item.externalCreatedAt,
                item.externalUpdatedAt,
                item.sourceData,
                item.externalObjectId,
              ],
            );
            if (staleResult.rows.length > 0) {
              staleCount += staleResult.rows.length;
              await client.query(
                `DELETE FROM user_notifications
                 WHERE resource_type = 'PERSONAL_TASK_CANDIDATE'
                   AND resource_id = ANY($1::uuid[])`,
                [staleResult.rows.map((row) => row.id)],
              );
            }
            await client.query(
              `UPDATE personal_task_external_links
               SET external_key = $4,
                   external_url = $5,
                   external_status = $6,
                   external_updated_at = $7,
                   updated_at = CURRENT_TIMESTAMP
               WHERE owner_user_id = $1
                 AND user_external_profile_id = $2
                 AND external_object_id = $3`,
              [
                ownerUserId,
                profileId,
                item.externalObjectId,
                item.externalKey,
                item.externalUrl,
                item.externalStatus,
                item.externalUpdatedAt,
              ],
            );
            continue;
          }
          const result = await client.query(
          `INSERT INTO personal_task_candidates (
             owner_user_id, user_external_profile_id, external_system_id, external_object_id,
             external_key, title, description, external_status,
             external_assignee, external_url, external_created_at,
             external_updated_at, source_data, seen_filter_revision
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1)
           ON CONFLICT (user_external_profile_id, external_object_id) DO UPDATE
           SET external_key = EXCLUDED.external_key,
               title = EXCLUDED.title,
               description = EXCLUDED.description,
               external_status = EXCLUDED.external_status,
               external_assignee = EXCLUDED.external_assignee,
               external_url = EXCLUDED.external_url,
               external_created_at = EXCLUDED.external_created_at,
               external_updated_at = EXCLUDED.external_updated_at,
               source_data = EXCLUDED.source_data,
               seen_filter_revision = EXCLUDED.seen_filter_revision,
               disposition = CASE
                 WHEN personal_task_candidates.disposition = 'DISMISSED'
                   AND personal_task_candidates.external_updated_at
                     IS DISTINCT FROM EXCLUDED.external_updated_at
                   THEN 'PENDING'
                 WHEN personal_task_candidates.disposition = 'STALE' THEN 'PENDING'
                 ELSE personal_task_candidates.disposition
               END,
               updated_at = CURRENT_TIMESTAMP
           RETURNING (xmax = 0) AS inserted`,
          [
            ownerUserId,
            profileId,
            externalSystemId,
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
          if (result.rows[0]?.inserted) {
            createdCount += 1;
            await client.query(
              `INSERT INTO user_notifications (
                 user_id, notification_type, title, body, resource_type,
                 resource_id, source_system_id, source_object_id, action_path
               )
               SELECT $1, 'PERSONAL_TASK_CANDIDATE_CREATED', $2, $3,
                      'PERSONAL_TASK_CANDIDATE', candidate.id,
                      candidate.external_system_id, candidate.external_object_id,
                      '/tasks?view=candidates&candidateId=' || candidate.id::text
               FROM personal_task_candidates candidate
               WHERE candidate.user_external_profile_id = $4 AND candidate.external_object_id = $5
               ON CONFLICT DO NOTHING`,
              [ownerUserId, `新しい候補: ${item.title}`, item.externalKey, profileId, item.externalObjectId],
            );
          } else updatedCount += 1;
          await client.query(
          `UPDATE personal_task_external_links
           SET external_key = $4,
               external_url = $5,
               external_status = $6,
               external_updated_at = $7,
               updated_at = CURRENT_TIMESTAMP
           WHERE owner_user_id = $1
             AND user_external_profile_id = $2
             AND external_object_id = $3`,
          [
            ownerUserId,
            profileId,
            item.externalObjectId,
            item.externalKey,
            item.externalUrl,
            item.externalStatus,
            item.externalUpdatedAt,
          ],
          );
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
      return { createdCount, updatedCount, staleCount };
    },

    async listNotifications(ownerUserId) {
      const result = await pool.query(
        `SELECT notification.*,
                system.code AS source_code,
                system.name AS source_name,
                candidate.external_key AS source_key
         FROM user_notifications AS notification
         LEFT JOIN external_systems AS system
           ON system.id = notification.source_system_id
         LEFT JOIN personal_task_candidates AS candidate
           ON notification.resource_type = 'PERSONAL_TASK_CANDIDATE'
          AND candidate.id = notification.resource_id
         WHERE notification.user_id = $1
         ORDER BY notification.created_at DESC
         LIMIT 100`,
        [ownerUserId],
      );
      return result.rows.map(mapUserNotification);
    },

    async markNotificationRead(ownerUserId, notificationId) {
      const result = await pool.query(
        `UPDATE user_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE user_id = $1 AND id = $2 RETURNING id`,
        [ownerUserId, notificationId],
      );
      return Boolean(result.rows[0]);
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
           AND task.task_type = 'DEADLINE'
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
