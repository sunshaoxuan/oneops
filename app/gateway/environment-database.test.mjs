import assert from "node:assert/strict";
import test from "node:test";
import {
  assertEnvironmentProductRules,
  compareProductVersions,
  formatDatabaseDate,
} from "./environment-database.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

test("product versions use numeric segment ordering", () => {
  const versions = [
    "2.11.1",
    "2.11.2",
    "2.11.7",
    "2.9",
    "2.9.1",
    "2.9.2",
    "V10",
    "V7",
    "V6",
  ];

  assert.deepEqual(versions.sort(compareProductVersions), [
    "2.9",
    "2.9.1",
    "2.9.2",
    "2.11.1",
    "2.11.2",
    "2.11.7",
    "V6",
    "V7",
    "V10",
  ]);
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

test("module-scoped products require a selected module", async () => {
  const executor = {
    async query(sql) {
      if (sql.includes("product.version_selection_mode = 'MODULE_SCOPED'")) {
        return { rowCount: 1, rows: [{ id: 34 }] };
      }
      return { rowCount: 0, rows: [] };
    },
  };
  await assert.rejects(
    () =>
      assertEnvironmentProductRules(executor, [
        { productVersionId: "34", moduleIds: [] },
      ]),
    (error) => error.code === "PRODUCT_MODULE_REQUIRED",
  );
});

test("environment product rule errors are returned as actionable client errors", () => {
  const serverSource = readFileSync(
    resolve(import.meta.dirname, "server.mjs"),
    "utf8",
  );
  assert.match(serverSource, /PRODUCT_MODULE_REQUIRED:/);
  assert.match(serverSource, /PRODUCT_VERSION_SELECTION_CONFLICT:/);
  assert.match(serverSource, /PRODUCT_MODULE_VERSION_CONFLICT:/);
});

test("product master exposes physical ID update routes for all three levels", () => {
  const databaseSource = readFileSync(
    resolve(import.meta.dirname, "environment-database.mjs"),
    "utf8",
  );
  const serverSource = readFileSync(
    resolve(import.meta.dirname, "server.mjs"),
    "utf8",
  );
  assert.match(databaseSource, /async updateProduct\(id, product\)/);
  assert.match(
    databaseSource,
    /async updateProductVersion\(id, productVersion\)/,
  );
  assert.match(
    databaseSource,
    /async updateProductVersionModule\(id, productVersionModule\)/,
  );
  assert.match(
    databaseSource,
    /WHERE product_module_id = \$1[\s\S]*RETURNING/,
  );
  assert.match(
    serverSource,
    /request\.method === "PUT" && productMatch/,
  );
  assert.match(
    serverSource,
    /request\.method === "PUT" && productVersionMatch/,
  );
  assert.match(
    serverSource,
    /request\.method === "PUT" && productVersionModuleMatch/,
  );
});
