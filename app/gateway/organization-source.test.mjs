import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import ExcelJS from "exceljs";
import {
  findOrganizationHeader,
  loadXlsxOrganizationSource,
  readOrganizationRows,
  resolveSourceFiles,
} from "./organization-source.mjs";

const source = {
  id: "test-source",
  type: "xlsx",
  pathPattern: "",
  headerSearchRows: 10,
  columns: {
    classification: ["区分"],
    code: ["機関Code"],
    name: ["機関名"],
    shortName: ["略称"],
    maintenanceStatus: ["保守有無"],
  },
};

test("organization source finds localized headers and reads five business fields", () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("機関一覧");
  worksheet.addRow(["参考資料"]);
  worksheet.addRow(["区分", "機関Code", "機関名", "略称", "保守有無"]);
  worksheet.addRow(["顧客", "ORG001", "第一機関", "第一", "有"]);

  const header = findOrganizationHeader(worksheet, source);
  assert.deepEqual(header, {
    rowNumber: 2,
    fieldColumns: {
      classification: 1,
      code: 2,
      name: 3,
      shortName: 4,
      maintenanceStatus: 5,
    },
  });
  assert.deepEqual(readOrganizationRows(worksheet, source, header), [
    {
      classification: "顧客",
      code: "ORG001",
      name: "第一機関",
      shortName: "第一",
      maintenanceStatus: "〇",
      remarks: "",
      sourceRow: 3,
    },
  ]);
});

test("organization source resolves wildcard files and reads xlsx batches", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oneops-source-"));
  try {
    const file = join(directory, "★各機関情報一覧_20250530_サポート確認.xlsx");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("機関一覧");
    worksheet.addRow(["区分", "機関Code", "機関名", "略称", "保守有無"]);
    worksheet.addRow(["公共", "ORG002", "第二機関", "第二", "無"]);
    await workbook.xlsx.writeFile(file);

    const configuredSource = {
      ...source,
      pathPattern: join(
        directory,
        "★各機関情報一覧*20250530*サポート確認.xlsx",
      ),
    };
    assert.deepEqual(await resolveSourceFiles(configuredSource.pathPattern), [
      file,
    ]);
    const batches = await loadXlsxOrganizationSource(configuredSource);
    assert.equal(batches.length, 1);
    assert.equal(batches[0].records[0].code, "ORG002");
    assert.equal(batches[0].records[0].maintenanceStatus, "✕");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
