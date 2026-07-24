import assert from "node:assert/strict";
import test from "node:test";
import { loadSystemConfig } from "./system-config.mjs";

test("system config retains an expandable organization data source mechanism", async () => {
  const config = await loadSystemConfig();
  const directory = config.organizationDirectory;

  assert.equal(directory.dataSources.length, 1);
  assert.equal(directory.dataSources[0].type, "xlsx");
  assert.match(
    directory.dataSources[0].pathPattern,
    /20250530.*サポート確認\.xlsx$/,
  );
  assert.equal(
    directory.dataSources[0].sheetName,
    "機関別導入製品一覧 (サポート確認後)",
  );
  assert.equal(directory.synchronization.insertMissing, true);
  assert.equal(directory.synchronization.supplementEmptyFields, true);
  assert.equal(directory.synchronization.updateExisting, false);
  assert.equal(directory.synchronization.deleteMissing, false);
  assert.equal(directory.conflicts.sameCodeDifferentName, "system-message");
  assert.equal(directory.conflicts.implementationStatus, "TODO");
});
