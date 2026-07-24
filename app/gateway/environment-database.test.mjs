import assert from "node:assert/strict";
import test from "node:test";
import { formatDatabaseDate } from "./environment-database.mjs";

test("database dates are exposed as stable ISO calendar dates", () => {
  assert.equal(
    formatDatabaseDate(new Date(2026, 6, 23)),
    "2026-07-23",
  );
  assert.equal(formatDatabaseDate("2026-07-24"), "2026-07-24");
  assert.equal(formatDatabaseDate(null), "");
});

test("database dates reject non-calendar display strings", () => {
  assert.equal(formatDatabaseDate("Thu Jul 23 2026"), "");
});
