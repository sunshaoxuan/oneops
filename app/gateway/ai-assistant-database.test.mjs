import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createAiAssistantRepository } from "./ai-assistant-database.mjs";

const conversationId = "11111111-2222-4333-8444-555555555555";
const ownerUserId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const taskId = "12345678-1234-4234-8234-123456789012";
const modelSettingId = "99999999-9999-4999-8999-999999999999";

function taskRow(overrides = {}) {
  return {
    id: taskId,
    conversation_id: conversationId,
    model_setting_id: modelSettingId,
    model_snapshot: "gpt-example",
    reasoning_effort_snapshot: "HIGH",
    status: "running",
    prompt: "利用者入力",
    inquiry_context: null,
    attachments: [],
    routing: { taskClass: "GENERAL_ASSIST" },
    output_text: null,
    provider_response_id: null,
    provider_output: [],
    token_usage: null,
    error_code: null,
    error_message: null,
    cancel_requested_at: null,
    last_event_sequence: 0,
    created_at: new Date("2026-08-11T00:00:00Z"),
    started_at: new Date("2026-08-11T00:00:01Z"),
    completed_at: null,
    ...overrides,
  };
}

class MemoryPool {
  constructor({ task = null } = {}) {
    this.session = {
      conversation_id: conversationId,
      owner_user_id: ownerUserId,
      status: "ACTIVE",
      last_task_id: task?.id ?? null,
      model_setting_id: modelSettingId,
      model_snapshot: "gpt-example",
      reasoning_effort_snapshot: "HIGH",
      inquiry_ticket_no: null,
    };
    this.tasks = new Map(task ? [[task.id, { ...task }]] : []);
    this.events = [];
    this.queries = [];
    this.releaseCount = 0;
  }

  on() {}

  async connect() {
    return {
      query: (sql, parameters) => this.query(sql, parameters),
      release: () => { this.releaseCount += 1; },
    };
  }

  async end() {}

  async query(sql, parameters = []) {
    const source = String(sql);
    const normalized = source.trim().replace(/\s+/g, " ");
    this.queries.push({ sql: normalized, parameters });
    if (["BEGIN", "COMMIT", "ROLLBACK"].includes(normalized)) {
      return { rows: [], rowCount: 0 };
    }
    if (
      normalized.includes("SELECT status, model_setting_id, model_snapshot")
      && normalized.includes("FROM ai_assistant_sessions")
    ) {
      const owned = parameters[0] === conversationId
        && parameters[1] === ownerUserId;
      return { rows: owned ? [{ ...this.session }] : [], rowCount: owned ? 1 : 0 };
    }
    if (
      normalized.includes("SELECT status, last_task_id")
      && normalized.includes("FROM ai_assistant_sessions")
    ) {
      const owned = parameters[0] === conversationId
        && parameters[1] === ownerUserId;
      return { rows: owned ? [{ ...this.session }] : [], rowCount: owned ? 1 : 0 };
    }
    if (
      normalized.startsWith("SELECT id FROM ai_assistant_tasks")
      && normalized.includes("status IN ('queued', 'running')")
    ) {
      const active = [...this.tasks.values()].find((task) =>
        task.conversation_id === parameters[0]
        && ["queued", "running"].includes(task.status)
      );
      return { rows: active ? [{ id: active.id }] : [], rowCount: active ? 1 : 0 };
    }
    if (normalized.startsWith("INSERT INTO ai_assistant_tasks")) {
      const [
        id,
        targetConversationId,
        targetModelSettingId,
        model,
        effort,
        prompt,
        inquiryContext,
        attachmentsJson,
        routingJson,
        requestId,
      ] = parameters;
      this.tasks.set(id, taskRow({
        id,
        conversation_id: targetConversationId,
        model_setting_id: targetModelSettingId,
        model_snapshot: model,
        reasoning_effort_snapshot: effort,
        status: "queued",
        prompt,
        inquiry_context: inquiryContext,
        attachments: JSON.parse(attachmentsJson),
        routing: JSON.parse(routingJson),
        request_id: requestId,
        started_at: null,
      }));
      return { rows: [], rowCount: 1 };
    }
    if (
      normalized.startsWith("UPDATE ai_assistant_tasks")
      && normalized.includes("last_event_sequence = last_event_sequence + 1")
    ) {
      const task = this.tasks.get(parameters[0]);
      task.last_event_sequence += 1;
      return {
        rows: [{ last_event_sequence: task.last_event_sequence }],
        rowCount: 1,
      };
    }
    if (normalized.startsWith("INSERT INTO ai_assistant_task_events")) {
      const [id, sequence, eventType, eventData] = parameters;
      const event = {
        id: `event-${sequence}`,
        task_id: id,
        sequence,
        event_type: eventType,
        event_data: eventData,
        created_at: new Date(`2026-08-11T00:00:0${sequence}Z`),
      };
      this.events.push(event);
      return { rows: [event], rowCount: 1 };
    }
    if (
      normalized.startsWith("UPDATE ai_assistant_sessions")
      && normalized.includes("SET last_task_id")
    ) {
      this.session.last_task_id = parameters[2];
      return { rows: [], rowCount: 1 };
    }
    if (
      normalized.startsWith("SELECT task.id")
      && normalized.includes("FROM ai_assistant_tasks AS task")
      && normalized.includes("WHERE task.id = $1")
    ) {
      const task = this.tasks.get(parameters[0]);
      return { rows: task ? [{ ...task }] : [], rowCount: task ? 1 : 0 };
    }
    if (
      normalized.startsWith("SELECT * FROM ai_assistant_tasks")
      && normalized.includes("FOR UPDATE")
    ) {
      const task = this.tasks.get(parameters[0]);
      return { rows: task ? [{ ...task }] : [], rowCount: task ? 1 : 0 };
    }
    if (
      normalized.startsWith("UPDATE ai_assistant_tasks")
      && normalized.includes("SET cancel_requested_at = COALESCE")
    ) {
      const task = this.tasks.get(parameters[0]);
      task.cancel_requested_at ??= new Date("2026-08-11T00:00:02Z");
      return { rows: [{ ...task }], rowCount: 1 };
    }
    if (
      normalized.startsWith("UPDATE ai_assistant_tasks")
      && normalized.includes("SET status = 'cancelled'")
    ) {
      const task = this.tasks.get(parameters[0]);
      task.status = "cancelled";
      task.cancel_requested_at ??= new Date("2026-08-11T00:00:02Z");
      task.completed_at = new Date("2026-08-11T00:00:03Z");
      if (normalized.includes("provider_response_id")) {
        task.provider_response_id ??= parameters[1];
        task.token_usage = parameters[2] ?? task.token_usage;
        task.provider_output = parameters[3]
          ? JSON.parse(parameters[3])
          : task.provider_output;
      }
      return { rows: [{ ...task }], rowCount: 1 };
    }
    if (
      normalized.startsWith("UPDATE ai_assistant_tasks")
      && normalized.includes("SET status = 'completed'")
    ) {
      const task = this.tasks.get(parameters[0]);
      task.status = "completed";
      task.output_text = parameters[1];
      task.provider_response_id ??= parameters[2];
      task.token_usage = parameters[3];
      task.provider_output = JSON.parse(parameters[4]);
      task.completed_at = new Date("2026-08-11T00:00:03Z");
      return { rows: [{ ...task }], rowCount: 1 };
    }
    throw new Error(`未対応 SQL: ${normalized}`);
  }
}

function repository(pool) {
  return createAiAssistantRepository("postgres://unused", null, { pool });
}

test("Task 作成は Session 行 Lock、単一 Active Task、Created Event と last_task_id を一 Transaction で確定する", async () => {
  const pool = new MemoryPool();
  const value = await repository(pool).createTask({
    id: taskId,
    conversationId,
    ownerUserId,
    prompt: "利用者入力",
    routing: { taskClass: "GENERAL_ASSIST" },
    requestId: "request-1",
  });

  assert.equal(value.id, taskId);
  assert.equal(value.status, "queued");
  assert.deepEqual(value.attachments, []);
  assert.equal(value.routing.taskClass, "GENERAL_ASSIST");
  assert.equal(pool.session.last_task_id, taskId);
  assert.deepEqual(pool.events.map((event) => event.event_type), ["task.created"]);
  assert.match(pool.queries[1].sql, /FOR UPDATE NOWAIT/);
  assert.equal(pool.queries[0].sql, "BEGIN");
  assert.equal(pool.queries.at(-1).sql, "COMMIT");
  assert.equal(pool.releaseCount, 1);
});

test("同一 Session に Active Task がある場合は新規 Task を原子的に拒否する", async () => {
  const existing = taskRow({ status: "running" });
  const pool = new MemoryPool({ task: existing });

  await assert.rejects(
    () => repository(pool).createTask({
      id: "87654321-4321-4321-8321-210987654321",
      conversationId,
      ownerUserId,
      prompt: "後続入力",
    }),
    { code: "AI_ASSISTANT_RESPONSE_IN_PROGRESS" },
  );

  assert.equal(pool.tasks.size, 1);
  assert.equal(pool.queries.at(-1).sql, "ROLLBACK");
  assert.equal(pool.releaseCount, 1);
});

test("問合せ票に関連済みの Session は別票 Context を拒否する", async () => {
  const pool = new MemoryPool();
  pool.session.inquiry_ticket_no = "93103";

  await assert.rejects(
    () => repository(pool).createTask({
      id: taskId,
      conversationId,
      ownerUserId,
      prompt: "別票を確認",
      inquiryContext: { ticketNo: "94056" },
    }),
    { code: "AI_ASSISTANT_INQUIRY_TICKET_MISMATCH" },
  );

  assert.equal(pool.tasks.size, 0);
  assert.equal(pool.queries.at(-1).sql, "ROLLBACK");
});

test("Completion が先に確定した場合は後続 Stop が既存 Completed 終端を維持する", async () => {
  const pool = new MemoryPool({ task: taskRow() });
  const repo = repository(pool);

  const completed = await repo.completeTask(
    taskId,
    "完成回答",
    "resp_123",
    { total_tokens: 12 },
    [{ type: "message" }],
  );
  const cancel = await repo.requestCancelOwned(
    conversationId,
    ownerUserId,
    taskId,
  );

  assert.equal(completed.status, "completed");
  assert.deepEqual(completed.providerOutput, [{ type: "message" }]);
  assert.equal(cancel.status, "already_terminal");
  assert.equal(cancel.task.status, "completed");
  assert.deepEqual(
    pool.events.map((event) => event.event_type),
    ["agent.message", "task.completed"],
  );
});

test("Stop が先に受理された場合は Completion 競合を Cancelled 一終端へ確定する", async () => {
  const pool = new MemoryPool({ task: taskRow() });
  const repo = repository(pool);

  const cancel = await repo.requestCancelOwned(
    conversationId,
    ownerUserId,
    taskId,
  );
  const completed = await repo.completeTask(
    taskId,
    "停止後に到着した回答",
    "resp_123",
    { total_tokens: 12 },
    [{ type: "message" }],
  );

  assert.equal(cancel.status, "requested");
  assert.equal(completed.status, "cancelled");
  assert.deepEqual(
    pool.events.map((event) => event.event_type),
    ["task.cancelled"],
  );
  assert.equal(
    pool.events.some((event) => event.event_type === "task.completed"),
    false,
  );
  assert.equal(
    pool.events.some((event) => event.event_type === "task.failed"),
    false,
  );
});

test("Model 履歴は同一 Session の全終端 Task を順序どおり再構成する", async () => {
  const queries = [];
  const pool = {
    on() {},
    async query(sql, parameters) {
      queries.push({ sql, parameters });
      if (sql.includes("SELECT conversation_id, created_at")) {
        return {
          rows: [{
            conversation_id: conversationId,
            created_at: new Date("2026-08-11T00:02:00Z"),
          }],
        };
      }
      return {
        rows: [
          taskRow({
            id: "12345678-1234-4234-8234-123456789011",
            status: "completed",
            output_text: "次の回答",
            created_at: new Date("2026-08-11T00:01:00Z"),
            completed_at: new Date("2026-08-11T00:01:30Z"),
          }),
          taskRow({
            id: "12345678-1234-4234-8234-123456789010",
            status: "completed",
            output_text: "最初の回答",
            created_at: new Date("2026-08-11T00:00:00Z"),
            completed_at: new Date("2026-08-11T00:00:30Z"),
          }),
        ],
      };
    },
    async end() {},
  };
  const repository = createAiAssistantRepository("", null, { pool });

  const history = await repository.modelHistory(taskId);

  assert.deepEqual(
    history.map((task) => task.final_report?.summary),
    ["最初の回答", "次の回答"],
  );
  assert.doesNotMatch(queries[1].sql, /\bLIMIT\b/);
  assert.deepEqual(queries[1].parameters, [
    conversationId,
    new Date("2026-08-11T00:02:00Z"),
    taskId,
  ]);
});

test("Migration 042 は Local Task Ledger と Session 単一活動 Task を定義する", async () => {
  const migration = await readFile(
    new URL(
      "../db/migrations/042_prepare_ai_assistant_direct_gpt.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS ai_assistant_tasks/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS ai_assistant_task_events/);
  assert.match(
    migration,
    /ai_assistant_tasks_one_active_idx[\s\S]*status IN \('queued', 'running'\)/,
  );
  assert.match(migration, /REFERENCES ai_model_settings\(id\) ON DELETE RESTRICT/);
  assert.match(migration, /UNIQUE \(task_id, sequence\)/);
  assert.match(migration, /'completed', 'failed', 'cancelled'/);
});

test("Migration 047 は利用者と問合せ票の最近会話検索を定義する", async () => {
  const migration = await readFile(
    new URL(
      "../db/migrations/047_link_ai_assistant_sessions_to_inquiry_ticket.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /ADD COLUMN IF NOT EXISTS inquiry_ticket_no TEXT/);
  assert.match(migration, /owner_user_id,[\s\S]*inquiry_ticket_no,[\s\S]*updated_at DESC/);
  assert.match(migration, /DISTINCT ON \(task\.conversation_id\)/);
});

test("Migration 043 は Session の CAG 契約列を削除して Local Task 外部キーへ統一する", async () => {
  const migration = await readFile(
    new URL(
      "../db/migrations/043_remove_ai_assistant_cag_contract.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /REFERENCES ai_assistant_tasks\(id\)/);
  assert.match(migration, /DROP COLUMN IF EXISTS agent_gateway_setting_id/);
  assert.match(migration, /DROP COLUMN IF EXISTS project_ref/);
  assert.match(migration, /DROP COLUMN IF EXISTS project_code/);
  assert.match(migration, /DROP COLUMN IF EXISTS runtime_profile/);
  assert.doesNotMatch(migration, /ADD COLUMN/);
});

test("Migration 044 は未変更の日中翻訳 Prompt だけを目標言語限定契約へ更新する", async () => {
  const migration = await readFile(
    new URL(
      "../db/migrations/044_harden_ja_zh_translation_prompt.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /code = 'JA_ZH_TRANSLATION'/);
  assert.match(migration, /翻訳結果は目標言語だけで記述/);
  assert.match(migration, /原文言語の助詞、語尾及び機能語を残さない/);
  assert.match(migration, /送信前に原文言語の残留がないことを確認/);
  assert.match(migration, /AND system_prompt = 'あなたは日中業務翻訳/);
});

test("Migration 045 は意図分析結果を Task Ledger へ保存する", async () => {
  const migration = await readFile(
    new URL("../db/migrations/045_add_ai_assistant_intent_analysis.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /ADD COLUMN IF NOT EXISTS intent_analysis JSONB/);
  assert.match(migration, /jsonb_typeof\(intent_analysis\) = 'object'/);
});
