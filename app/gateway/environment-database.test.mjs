import assert from "node:assert/strict";
import test from "node:test";
import {
  assertEnvironmentProductRules,
  formatDatabaseDate,
} from "./environment-database.mjs";

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

test("single-version products reject multiple versions in one environment", async () => {
  const executor = {
    async query(sql) {
      if (sql.includes("product.version_selection_mode = 'SINGLE'")) {
        return { rowCount: 1, rows: [{ id: 3 }] };
      }
      return { rowCount: 0, rows: [] };
    },
  };
  await assert.rejects(
    () =>
      assertEnvironmentProductRules(executor, [
        { productVersionId: "3", moduleIds: [] },
        { productVersionId: "4", moduleIds: [] },
      ]),
    (error) => error.code === "PRODUCT_VERSION_SELECTION_CONFLICT",
  );
});

test("the same stable module rejects different versions in one environment", async () => {
  const executor = {
    async query(sql) {
      if (sql.includes("GROUP BY product_module_id")) {
        return {
          rowCount: 1,
          rows: [{ product_module_id: 20 }],
        };
      }
      return { rowCount: 0, rows: [] };
    },
  };
  await assert.rejects(
    () =>
      assertEnvironmentProductRules(executor, [
        { productVersionId: "30", moduleIds: ["300"] },
        { productVersionId: "31", moduleIds: ["301"] },
      ]),
    (error) => error.code === "PRODUCT_MODULE_VERSION_CONFLICT",
  );
});
