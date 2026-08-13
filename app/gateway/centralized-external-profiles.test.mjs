import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../db/migrations/053_centralize_user_external_profiles.sql", import.meta.url);

test("外部システムとユーザー外部档案は安定物理 ID と外部キーで一元管理する", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  assert.match(migration, /CREATE TABLE external_systems/);
  assert.match(migration, /CREATE TABLE user_external_profiles/);
  assert.match(migration, /user_id UUID NOT NULL REFERENCES users\(id\)/);
  assert.match(migration, /external_system_id UUID NOT NULL REFERENCES external_systems\(id\)/);
  assert.match(migration, /UNIQUE \(user_id, external_system_id\)/);
  assert.match(migration, /'WINDOWS_DOMAIN'/);
  assert.match(migration, /'BACKLOG'/);
  assert.match(migration, /'INQUIRY'/);
});

test("個人接続を削除し、集中同期とユーザー通知へ統一する", async () => {
  const migration = await readFile(migrationUrl, "utf8");
  assert.match(migration, /sync_interval_minutes INTEGER NOT NULL DEFAULT 10/);
  assert.match(migration, /CREATE TABLE user_notifications/);
  assert.match(migration, /DROP TABLE personal_task_external_accounts/);
  assert.match(migration, /user_external_profile_id UUID REFERENCES user_external_profiles/);
});
