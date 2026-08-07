import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const migrationRoot = new URL("../db/migrations/", import.meta.url);
test("RBAC 初期権限種子は保存済みロールを再び変更しない", async () => {
  const initialMigration = await readFile(
    new URL("009_create_identity_and_rbac.sql", migrationRoot),
    "utf8",
  );

  assert.match(
    initialMigration,
    /permission_seed_enabled boolean NOT NULL DEFAULT false/i,
  );
  assert.match(
    initialMigration,
    /ALTER TABLE roles[\s\S]*ADD COLUMN IF NOT EXISTS permission_seed_enabled/i,
  );
  assert.match(
    initialMigration,
    /permission_seed_enabled\s*\n\)\s*VALUES[\s\S]*true/i,
  );
  assert.match(
    initialMigration,
    /role_record\.permission_seed_enabled/i,
  );

  const migrationNames = (await readdir(migrationRoot))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();
  for (const migrationName of migrationNames) {
    const migration = await readFile(new URL(migrationName, migrationRoot), "utf8");
    if (!/INSERT\s+INTO\s+role_permissions/i.test(migration)) {
      continue;
    }
    assert.match(
      migration,
      /role(?:_record)?\.permission_seed_enabled/i,
      `${migrationName} のロール権限種子に保存状態の判定がありません`,
    );
  }
});

test("ロール保存はデフォルト権限の自動追加を停止する", async () => {
  const springSource = await readFile(
    new URL(
      "../backend/src/main/java/jp/onehr/oneops/identity/application/IdentityService.java",
      import.meta.url,
    ),
    "utf8",
  );
  const gatewaySource = await readFile(
    new URL("./identity-database.mjs", import.meta.url),
    "utf8",
  );

  assert.match(springSource, /permission_seed_enabled\s*=\s*false/i);
  assert.match(gatewaySource, /permission_seed_enabled\s*=\s*FALSE/i);
});
