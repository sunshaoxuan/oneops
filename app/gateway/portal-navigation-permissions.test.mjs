import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("第1階層機能の権限定義と既定ロール割当を登録する", async () => {
  const migration = await readFile(
    new URL("../db/migrations/036_add_portal_navigation_permissions.sql", import.meta.url),
    "utf8",
  );

  for (const code of [
    "builder.use",
    "knowledge.use",
    "code.insight.use",
    "reports.read",
  ]) {
    assert.match(migration, new RegExp(`'${code.replaceAll(".", "\\.")}'`));
  }
  assert.match(
    migration,
    /WHERE role_record\.code IN \('SYSTEM_ADMIN', 'OPERATOR', 'VIEWER'\)/,
  );
});
