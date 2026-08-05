import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKLOG_SUMMARY_FIELD_ID,
  validateBacklogSearchTemplate,
} from "./backlog-search-templates.mjs";

test("Backlog 検索テンプレートはプロジェクトと項目を正規化する", () => {
  const result = validateBacklogSearchTemplate({
    templateName: "TS2 機関名",
    projectId: "155893",
    projectKey: "TS2_ITS",
    projectName: "TS2課_導入・保守支援",
    fieldId: "120235",
    fieldName: "機関名",
    valueSource: "AUTO",
    enabled: true,
    sortOrder: 2,
  });

  assert.equal(result.valid, true);
  assert.equal(result.template.fieldId, "120235");
  assert.equal(result.template.matchMode, "CUSTOM_FIELD");
  assert.equal(result.template.sortOrder, 2);
});

test("件名テンプレートは共通出力のタイトル照合モードになる", () => {
  const result = validateBacklogSearchTemplate({
    templateName: "タイトル照合",
    projectId: "161497",
    projectKey: "OHR_TOKYO",
    projectName: "TS2課_PHR導入",
    fieldId: "ignored",
    fieldName: "ignored",
    matchMode: "TITLE_CONTAINS",
  });

  assert.equal(result.valid, true);
  assert.equal(result.template.fieldId, BACKLOG_SUMMARY_FIELD_ID);
  assert.equal(result.template.fieldName, "件名");
  assert.equal(result.template.matchMode, "TITLE_CONTAINS");
});

test("画面入力はプロジェクト ID と項目 ID だけでも保存前正規化できる", () => {
  const result = validateBacklogSearchTemplate({
    templateName: "TS2 機関名",
    projectId: "155893",
    fieldId: "120235",
    valueSource: "AUTO",
    enabled: true,
    sortOrder: 0,
  });

  assert.equal(result.valid, true);
  assert.equal(result.template.projectKey, "");
  assert.equal(result.template.projectName, "");
  assert.equal(result.template.fieldName, "");
});
