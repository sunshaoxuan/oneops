import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ExcelJS from "exceljs";
import {
  classifyProductCandidateValue,
  readOneOpsProductCandidates,
} from "./oneops-product-source.mjs";

const gatewayDirectory = dirname(fileURLToPath(import.meta.url));
const testDirectory = resolve(
  gatewayDirectory,
  "../.test-work/oneops-product-source-test",
);

test("OneOps product candidate values preserve review semantics", () => {
  assert.equal(classifyProductCandidateValue("◎"), "AFFIRMATIVE");
  assert.equal(classifyProductCandidateValue("◎SC"), "AFFIRMATIVE");
  assert.equal(classifyProductCandidateValue("▲Web認定"), "REVIEW");
  assert.equal(classifyProductCandidateValue("版数上は〇"), "REVIEW");
  assert.equal(classifyProductCandidateValue("利用停止"), "INACTIVE");
  assert.equal(classifyProductCandidateValue("－"), "INACTIVE");
});

test("OneOps product source reads version and module candidates", async () => {
  await rm(testDirectory, { recursive: true, force: true });
  await mkdir(testDirectory, { recursive: true });
  const workbookPath = resolve(testDirectory, "organizations.xlsx");
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("製品");
    sheet.addRow([
      "機関\nコード",
      "機関名",
      "バージョン\nV6/V7",
      "U-PDS 人事",
      "U-PDS 給与",
      "SmartGov",
    ]);
    sheet.addRow(["0408", "筑波大学", "V6", "◎", "利用停止", ""]);
    await workbook.xlsx.writeFile(workbookPath);

    const source = await readOneOpsProductCandidates(
      workbookPath,
      "製品",
    );

    assert.equal(source.records.length, 1);
    assert.equal(source.records[0].organizationCode, "0408");
    assert.equal(source.records[0].versionCandidate, "V6");
    assert.deepEqual(
      source.records[0].productCandidates.map((candidate) => ({
        name: candidate.name,
        classification: candidate.classification,
      })),
      [
        { name: "U-PDS 人事", classification: "AFFIRMATIVE" },
        { name: "U-PDS 給与", classification: "INACTIVE" },
      ],
    );
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
});
