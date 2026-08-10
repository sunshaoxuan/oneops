import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runMigrations } from "./database.mjs";

test("schema 初期化は PostgreSQL Advisory Lock 内で現行 Migration を再実行する", async () => {
  const queries = [];
  await runMigrations({
    async query(sql) {
      queries.push(String(sql));
      return { rows: [] };
    },
  });

  assert.match(queries[0], /pg_advisory_lock/);
  assert.equal(queries[1], "BEGIN");
  assert.equal(queries.at(-2), "COMMIT");
  assert.match(queries.at(-1), /pg_advisory_unlock/);

  const legacyModelMigration = queries.find((sql) =>
    sql.includes("CREATE TABLE IF NOT EXISTS agent_gateway_settings"),
  );
  assert.ok(legacyModelMigration);
  assert.doesNotMatch(
    legacyModelMigration,
    /ai_model_settings_purpose_unique/,
  );

  const currentModelMigration = queries.find((sql) =>
    sql.includes("ai_model_settings_general_identity_unique"),
  );
  assert.ok(currentModelMigration);
  assert.match(
    currentModelMigration,
    /CHECK \(purpose IN \('GENERAL', 'INQUIRY'\)\)/,
  );
  assert.doesNotMatch(currentModelMigration, /SET is_default = TRUE/);
  assert.doesNotMatch(
    currentModelMigration,
    /UPDATE ai_assistant_shortcuts[\s\S]*SET enabled/,
  );
});

test("schema 初期化失敗時は全変更を Rollback して Advisory Lock を解放する", async () => {
  const queries = [];
  await assert.rejects(
    runMigrations({
      async query(sql) {
        queries.push(String(sql));
        if (queries.length === 3) {
          throw new Error("migration test failure");
        }
        return { rows: [] };
      },
    }),
    /migration test failure/,
  );

  assert.match(queries[0], /pg_advisory_lock/);
  assert.equal(queries.at(-2), "ROLLBACK");
  assert.match(queries.at(-1), /pg_advisory_unlock/);
});

test("同一 Gateway 内の同時要求は一つの初期化 Promise を共有する", async () => {
  const source = await readFile(new URL("./server.mjs", import.meta.url), "utf8");

  assert.match(source, /let databaseInitializing = null/);
  assert.match(
    source,
    /if \(!databaseInitializing\)[\s\S]*organizationRepository\.migrate\(\)[\s\S]*await databaseInitializing/,
  );
  assert.match(
    source,
    /\/api\/work-center\/v1\/readiness[\s\S]*ensureDatabase\(\)[\s\S]*organizationRepository\.ping\(\)/,
  );
});

test("database repository は migration 後の接続確認を提供する", async () => {
  const source = await readFile(new URL("./database.mjs", import.meta.url), "utf8");

  assert.match(source, /async ping\(\)[\s\S]*pool\.query\("SELECT 1"\)/);
  assert.match(
    source,
    /COALESCE\(classification_id, \$1::UUID\)[\s\S]*\$1::UUID IS NOT NULL/,
  );
});

test("migration 再実行は管理画面で変更した初期データを上書きしない", async () => {
  const migrationUrl = new URL("../db/migrations/", import.meta.url);
  const [identity, catalog, workforce, customerKnowledge] = await Promise.all([
    readFile(new URL("009_create_identity_and_rbac.sql", migrationUrl), "utf8"),
    readFile(
      new URL("012_correct_product_catalog_and_module_versions.sql", migrationUrl),
      "utf8",
    ),
    readFile(
      new URL(
        "026_create_internal_workforce_and_inquiry_search_policy.sql",
        migrationUrl,
      ),
      "utf8",
    ),
    readFile(
      new URL("034_scoped_customer_ledger_extraction.sql", migrationUrl),
      "utf8",
    ),
  ]);

  assert.match(
    identity,
    /INSERT INTO roles \([^;]*ON CONFLICT \(code\) DO NOTHING;/,
  );
  assert.doesNotMatch(catalog, /UPDATE products\s+SET name = 'U-PDS人事給与'/);
  assert.doesNotMatch(catalog, /DO UPDATE SET\s+display_version/);
  assert.doesNotMatch(catalog, /DO UPDATE SET\s+confirmation_status/);
  assert.match(
    workforce,
    /INSERT INTO internal_departments[^;]*ON CONFLICT \(code\) DO NOTHING;/,
  );
  assert.match(
    workforce,
    /INSERT INTO business_responsibilities[^;]*ON CONFLICT \(code\) DO NOTHING;/,
  );
  assert.match(
    customerKnowledge,
    /INSERT INTO customer_knowledge_field_options[^;]*ON CONFLICT \(id\) DO NOTHING;/,
  );
});
