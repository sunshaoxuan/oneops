import assert from "node:assert/strict";
import test from "node:test";
import { withAiAssistantMessageLock } from "./ai-assistant-database.mjs";

const conversationId = "11111111-2222-4333-8444-555555555555";
const ownerUserId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const taskId = "12345678-1234-4234-8234-123456789012";

function queryOperation(sql) {
  return String(sql).trim().split(/\s+/)[0];
}

test("Conversation 行をロックした同一 Client で Task を更新して Commit する", async () => {
  const queries = [];
  let released = 0;
  const client = {
    async query(sql, parameters) {
      queries.push({ sql: String(sql), parameters });
      if (String(sql).includes("SELECT status")) {
        return {
          rows: [{ status: "ACTIVE", last_task_id: taskId }],
          rowCount: 1,
        };
      }
      if (String(sql).includes("UPDATE ai_assistant_sessions")) {
        return { rows: [{ conversation_id: conversationId }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    },
    release() {
      released += 1;
    },
  };
  const pool = {
    async connect() {
      return client;
    },
    async query() {
      assert.fail("Transaction 外の Pool で更新してはならない");
    },
  };

  const result = await withAiAssistantMessageLock(
    pool,
    conversationId,
    ownerUserId,
    async (lockedSession) => {
      assert.equal(lockedSession.status, "ACTIVE");
      assert.equal(lockedSession.lastTaskId, taskId);
      assert.equal(await lockedSession.touchTask(taskId), true);
      return "created";
    },
  );

  assert.equal(result, "created");
  assert.deepEqual(
    queries.map(({ sql }) => queryOperation(sql)),
    ["BEGIN", "SELECT", "UPDATE", "COMMIT"],
  );
  assert.match(queries[1].sql, /FOR UPDATE NOWAIT/);
  assert.deepEqual(queries[1].parameters, [conversationId, ownerUserId]);
  assert.deepEqual(
    queries[2].parameters,
    [conversationId, ownerUserId, taskId],
  );
  assert.equal(released, 1);
});

test("Operation が失敗した Transaction を Rollback して Client を解放する", async () => {
  const queries = [];
  let released = 0;
  const operationError = new Error("Task creation failed");
  const client = {
    async query(sql) {
      queries.push(String(sql));
      if (String(sql).includes("SELECT status")) {
        return {
          rows: [{ status: "ACTIVE", last_task_id: null }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    },
    release() {
      released += 1;
    },
  };
  const pool = { async connect() { return client; } };

  await assert.rejects(
    () => withAiAssistantMessageLock(
      pool,
      conversationId,
      ownerUserId,
      async () => {
        throw operationError;
      },
    ),
    (error) => error === operationError,
  );

  assert.deepEqual(
    queries.map(queryOperation),
    ["BEGIN", "SELECT", "ROLLBACK"],
  );
  assert.equal(released, 1);
});

test("NOWAIT の 55P03 を応答生成中エラーへ変換して Client を解放する", async () => {
  const queries = [];
  let released = 0;
  const lockError = Object.assign(new Error("lock not available"), {
    code: "55P03",
  });
  const client = {
    async query(sql) {
      queries.push(String(sql));
      if (String(sql).includes("SELECT status")) throw lockError;
      return { rows: [], rowCount: 0 };
    },
    release() {
      released += 1;
    },
  };
  const pool = { async connect() { return client; } };

  await assert.rejects(
    () => withAiAssistantMessageLock(
      pool,
      conversationId,
      ownerUserId,
      async () => assert.fail("ロック競合時に Operation を実行してはならない"),
    ),
    (error) => {
      assert.equal(error.code, "AI_ASSISTANT_RESPONSE_IN_PROGRESS");
      assert.equal(error.cause, lockError);
      return true;
    },
  );

  assert.deepEqual(
    queries.map(queryOperation),
    ["BEGIN", "SELECT", "ROLLBACK"],
  );
  assert.equal(released, 1);
});
