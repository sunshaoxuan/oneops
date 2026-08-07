import test from "node:test";
import assert from "node:assert/strict";
import {
  createCustomerKnowledgeScanService,
  normalizeCustomerKnowledgeResult,
} from "./customer-knowledge-scan.mjs";
import {
  applyFieldCandidate as applyDatabaseFieldCandidate,
  publicCustomerKnowledgeScanErrorMessage,
} from "./customer-knowledge-scan-database.mjs";

const citation = {
  document_id: "11111111-1111-4111-8111-111111111111",
  document_version_id: "22222222-2222-4222-8222-222222222222",
  chunk_id: "33333333-3333-4333-8333-333333333333",
  canonical_path: "し_0276_滋賀大学/V6/６．リモート接続情報/接続方法.txt",
  resource_uri: "knowledge://document/11111111-1111-4111-8111-111111111111",
  section: "接続方法",
  excerpt: "サポート用 SSH 接続",
};

test("台帳反映は抽出値をスカラーへ正規化し現行組織機関表を更新する", async () => {
  const calls = [];
  const client = {
    async query(sql, parameters) {
      calls.push({ sql, parameters });
      return { rowCount: 1, rows: [] };
    },
  };

  const refs = await applyDatabaseFieldCandidate(
    client,
    {
      organization_id: 2,
      field_code: "organization_code",
      value_json: { type: "string", value: "0408" },
    },
    "user-1",
  );

  assert.deepEqual(calls[0].parameters, [2, "0408"]);
  assert.doesNotMatch(calls[0].sql, /updated_at/);
  assert.deepEqual(refs, [{ recordType: "ORGANIZATION", recordId: "2" }]);
});

test("台帳反映は構造化値を文字列化せず不正な値を拒否する", async () => {
  await assert.rejects(
    applyDatabaseFieldCandidate(
      { async query() { assert.fail("不正な値で SQL を実行しない"); } },
      {
        organization_id: 2,
        field_code: "organization_name",
        value_json: { nested: { value: "筑波大学" } },
      },
      "user-1",
    ),
    { code: "CUSTOMER_SCAN_CANDIDATE_VALUE_INVALID" },
  );
});

test("カスタマイズ候補は Scan と Candidate の物理外部キーを持つ記録へ反映する", async () => {
  const calls = [];
  const client = {
    async query(sql, parameters) {
      calls.push({ sql, parameters });
      return { rowCount: 1, rows: [{ id: `custom-${calls.length}` }] };
    },
  };
  const refs = await applyDatabaseFieldCandidate(client, {
    id: "candidate-1",
    scan_id: "scan-1",
    organization_id: 2,
    field_code: "customizations",
    value_json: [{
      name: "帳票カスタマイズ",
      category: "REPORT",
      summary: "大学向け帳票を追加する",
      business_purpose: "運用帳票",
      affected_components: ["report-server"],
      status: "ACTIVE",
      notes: null,
    }],
  }, "user-1");

  assert.match(calls[0].sql, /INSERT INTO customer_customizations/);
  assert.deepEqual(calls[0].parameters.slice(8, 10), ["scan-1", "candidate-1"]);
  assert.deepEqual(refs, [{ recordType: "CUSTOMER_CUSTOMIZATION", recordId: "custom-1" }]);
});

test("リモート環境候補はお客様環境グループの物理レコードへ反映する", async () => {
  const calls = [];
  const client = {
    async query(sql, parameters) {
      calls.push({ sql, parameters });
      if (sql.includes("environment_groups")) return { rowCount: 1, rows: [{ id: 109 }] };
      return { rowCount: 1, rows: [{ id: 77 }] };
    },
  };
  const refs = await applyDatabaseFieldCandidate(client, {
    organization_id: 2,
    field_code: "environments",
    value_json: [{
      name: "本番環境",
      environment_type: "PRODUCTION",
      status: "ACTIVE",
      product_code: null,
      product_version: null,
      notes: "保守接続対象",
    }],
  }, "user-1");

  assert.match(calls[0].sql, /お客様環境/);
  assert.match(calls[1].sql, /INSERT INTO environments/);
  assert.deepEqual(calls[1].parameters.slice(0, 6), [2, 109, "本番環境", "CUSTOMER", "PRODUCTION", "ACTIVE"]);
  assert.deepEqual(refs, [{ recordType: "ENVIRONMENT", recordId: "77" }]);
});

function sourceSetting() {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    gatewaySettingId: "gateway-1",
    cagProjectId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    cagSourceId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    analysisTemplateCode: "ORGANIZATION_PROFILE_ENRICHMENT",
    analysisTemplateVersion: 2,
  };
}

function gatewayRepository() {
  return {
    async get() {
      return { id: "gateway-1", enabled: true, endpoint: "http://cag/api/v1" };
    },
  };
}

test("CAG v1 の物理 ID 候補、根拠、網羅率及び未解決項目を正規化する", () => {
  const normalized = normalizeCustomerKnowledgeResult({
    schema_version: 1,
    status: "review_required",
    scope: { id: "44444444-4444-4444-8444-444444444444" },
    coverage: { total_documents: 1, analyzed_documents: 1, coverage_rate: 1 },
    field_candidates: [
      {
        id: "55555555-5555-4555-8555-555555555555",
        field_code: "vpns",
        value: [{ name: "Support VPN", vpn_type: "SSL", status: "ACTIVE" }],
        confidence: 0.95,
        evidence: [citation],
      },
    ],
    unresolved_fields: [
      { field_code: "repositories", reason_code: "EVIDENCE_NOT_FOUND" },
    ],
    conflicts: [],
    document_failures: [],
    versions: { extractor_version: "customer-ledger-v1" },
  });

  assert.equal(normalized.valid, true);
  assert.equal(normalized.status, "REVIEW_REQUIRED");
  assert.equal(normalized.scopeId, "44444444-4444-4444-8444-444444444444");
  assert.equal(normalized.coverage.coverage_rate, 1);
  assert.equal(normalized.candidates[0].fieldCode, "vpns");
  assert.equal(normalized.candidates[0].value[0].vpn_type, "SSL");
  assert.equal(normalized.candidates[0].status, "PROPOSED");
  assert.equal(normalized.candidates[0].evidence[0].path, citation.canonical_path);
  assert.equal(normalized.unresolvedFields[0].field_code, "repositories");
});

test("不明な CAG 結果は失敗として明示する", () => {
  const normalized = normalizeCustomerKnowledgeResult({ schema_version: 2 });
  assert.equal(normalized.valid, false);
  assert.equal(normalized.errorCode, "CAG_SCAN_RESULT_INVALID");
  assert.equal(normalized.candidates.length, 0);
});

test("顧客スキャンは物理対象 ID、Source ID 及び項目契約を送る", async () => {
  const calls = [];
  const repository = {
    async getOrganization() {
      return {
        id: "49",
        subjectExternalId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        code: "0276",
        name: "滋賀大学",
        shortName: "滋賀大",
      };
    },
    async getActiveSourceSetting() {
      return sourceSetting();
    },
    async getExtractionFieldContract() {
      return [{ code: "organization_code", type: "string", required: true }];
    },
    async createScan(input) {
      calls.push(["createScan", input]);
      return { id: "11111111-1111-4111-8111-111111111111" };
    },
    async attachTask(scanId, taskId) {
      calls.push(["attachTask", scanId, taskId]);
      return { id: scanId, cagTaskId: taskId, status: "QUEUED" };
    },
    async failScan() {
      assert.fail("start must not fail");
    },
  };
  const service = createCustomerKnowledgeScanService({
    repository,
    agentGatewaySettingsRepository: gatewayRepository(),
    fetchTask: async (_gateway, path, options) => {
      assert.equal(path, "/knowledge/extractions/customer-ledger");
      const body = JSON.parse(options.body);
      assert.equal(body.schema_version, 1);
      assert.equal(body.project_id, sourceSetting().cagProjectId);
      assert.equal(body.knowledge_source_id, sourceSetting().cagSourceId);
      assert.equal(body.subject.external_id, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
      assert.equal(body.subject.code, "0276");
      assert.equal(body.requested_fields[0].code, "organization_code");
      assert.equal("prompt" in body, false);
      return { id: "22222222-2222-4222-8222-222222222222", status: "queued" };
    },
  });

  const scan = await service.start("49", "user-1", "request-1");

  assert.equal(scan.status, "QUEUED");
  assert.equal(calls[0][0], "createScan");
  assert.equal(calls[1][0], "attachTask");
});

test("専用 Extraction の完了結果を Scan に保存する", async () => {
  let completed;
  const repository = {
    async getScan() {
      return {
        id: "11111111-1111-4111-8111-111111111111",
        status: "EXTRACTING",
        sourceSettingId: sourceSetting().id,
        cagTaskId: "22222222-2222-4222-8222-222222222222",
      };
    },
    async getSourceSetting() {
      return sourceSetting();
    },
    async completeScan(scanId, normalized) {
      completed = { scanId, normalized };
      return { id: scanId, status: normalized.status, ...normalized };
    },
  };
  const service = createCustomerKnowledgeScanService({
    repository,
    agentGatewaySettingsRepository: gatewayRepository(),
    fetchTask: async (_gateway, path) => {
      assert.equal(
        path,
        "/knowledge/extractions/customer-ledger/22222222-2222-4222-8222-222222222222",
      );
      return {
        id: "22222222-2222-4222-8222-222222222222",
        status: "completed",
        schema_version: 1,
        coverage: {},
        field_candidates: [],
        unresolved_fields: [],
        conflicts: [],
        document_failures: [],
        versions: {},
      };
    },
  });

  const scan = await service.refresh("49", "scan-id");

  assert.equal(scan.status, "COMPLETED");
  assert.equal(completed.normalized.valid, true);
});

test("CAG 状態取得失敗は Scan を消さず可視エラーとして保持する", async () => {
  let recorded;
  const repository = {
    async getScan() {
      return {
        id: "11111111-1111-4111-8111-111111111111",
        status: "EXTRACTING",
        sourceSettingId: sourceSetting().id,
        cagTaskId: "22222222-2222-4222-8222-222222222222",
      };
    },
    async getSourceSetting() {
      return sourceSetting();
    },
    async recordRefreshError(scanId, code, message) {
      recorded = { scanId, code, message };
      return { id: scanId, status: "EXTRACTING", errorCode: code };
    },
  };
  const service = createCustomerKnowledgeScanService({
    repository,
    agentGatewaySettingsRepository: gatewayRepository(),
    fetchTask: async () => {
      throw Object.assign(new Error("timeout"), { code: "CAG_SCAN_TIMEOUT" });
    },
  });

  const scan = await service.refresh("49", "scan-id");

  assert.equal(scan.status, "EXTRACTING");
  assert.equal(recorded.code, "CAG_SCAN_TIMEOUT");
});

test("CAG の内部 Error は利用者向け Scan に保存しない", async () => {
  let failed;
  const repository = {
    async getScan() {
      return {
        id: "11111111-1111-4111-8111-111111111111",
        status: "EXTRACTING",
        sourceSettingId: sourceSetting().id,
        cagTaskId: "22222222-2222-4222-8222-222222222222",
      };
    },
    async getSourceSetting() {
      return sourceSetting();
    },
    async failScan(scanId, code, message) {
      failed = { scanId, code, message };
      return { id: scanId, status: "FAILED", errorCode: code };
    },
  };
  const service = createCustomerKnowledgeScanService({
    repository,
    agentGatewaySettingsRepository: gatewayRepository(),
    fetchTask: async () => ({
      status: "failed",
      error: {
        code: "EXTRACTION_FAILED",
        internal: "SELECT secret_value FROM internal_table",
      },
    }),
  });

  await service.refresh("49", "scan-id");

  assert.equal(failed.code, "EXTRACTION_FAILED");
  assert.doesNotMatch(failed.message, /SELECT|internal_table/);
  assert.equal(
    publicCustomerKnowledgeScanErrorMessage("EXTRACTION_FAILED"),
    "顧客台帳候補の抽出に失敗しました。",
  );
});

test("CAG 受付失敗は作成済み Scan を失敗へ確定する", async () => {
  let failed;
  const repository = {
    async getOrganization() {
      return {
        id: "49",
        subjectExternalId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        code: "0276",
        name: "滋賀大学",
        shortName: "滋賀大",
      };
    },
    async getActiveSourceSetting() {
      return sourceSetting();
    },
    async getExtractionFieldContract() {
      return [{ code: "organization_code", type: "string", required: true }];
    },
    async createScan() {
      return { id: "11111111-1111-4111-8111-111111111111" };
    },
    async failScan(scanId, code, message) {
      failed = { scanId, code, message };
      return { id: scanId, status: "FAILED", errorCode: code };
    },
  };
  const service = createCustomerKnowledgeScanService({
    repository,
    agentGatewaySettingsRepository: gatewayRepository(),
    fetchTask: async () => {
      throw Object.assign(new Error("unavailable"), {
        code: "KNOWLEDGE_SOURCE_UNAVAILABLE",
      });
    },
  });

  const scan = await service.start("49", "user-1", "request-1");

  assert.equal(scan.status, "FAILED");
  assert.equal(failed.scanId, "11111111-1111-4111-8111-111111111111");
  assert.equal(failed.code, "KNOWLEDGE_SOURCE_UNAVAILABLE");
  assert.equal(failed.message, "CAG scan could not start.");
});

test("再取込完了後は元 Scan を親に持つ新しい Extraction Scan を作る", async () => {
  const calls = [];
  const parentScan = {
    id: "11111111-1111-4111-8111-111111111111",
    status: "INGESTING",
    sourceSettingId: sourceSetting().id,
    cagIngestionId: "22222222-2222-4222-8222-222222222222",
    createdByUserId: "user-1",
  };
  const repository = {
    async getScan() {
      return parentScan;
    },
    async getSourceSetting() {
      return sourceSetting();
    },
    async getActiveSourceSetting() {
      return sourceSetting();
    },
    async getOrganization() {
      return {
        id: "49",
        subjectExternalId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        code: "0276",
        name: "滋賀大学",
        shortName: "滋賀大",
      };
    },
    async getExtractionFieldContract() {
      return [{ code: "organization_code", type: "string", required: true }];
    },
    async createScan(input) {
      calls.push(input);
      return { id: "33333333-3333-4333-8333-333333333333" };
    },
    async attachTask(scanId, taskId) {
      return { id: scanId, cagTaskId: taskId, status: "QUEUED" };
    },
  };
  const service = createCustomerKnowledgeScanService({
    repository,
    agentGatewaySettingsRepository: gatewayRepository(),
    fetchTask: async (_gateway, path) => {
      if (path === "/knowledge/ingestions/22222222-2222-4222-8222-222222222222") {
        return { status: "completed" };
      }
      return { id: "44444444-4444-4444-8444-444444444444", status: "queued" };
    },
  });

  const child = await service.refresh("49", parentScan.id);

  assert.equal(child.status, "QUEUED");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].parentScanId, parentScan.id);
});

test("再取込の再実行は直前 Ingestion 物理 ID で新しい幂等要求を識別する", async () => {
  const requests = [];
  const parentScan = {
    id: "11111111-1111-4111-8111-111111111111",
    sourceSettingId: sourceSetting().id,
    cagScopeId: "55555555-5555-4555-8555-555555555555",
    cagIngestionId: "22222222-2222-4222-8222-222222222222",
  };
  const repository = {
    async getScan() { return parentScan; },
    async getSourceSetting() { return sourceSetting(); },
    async attachIngestion(scanId, ingestionId) {
      return { ...parentScan, id: scanId, cagIngestionId: ingestionId };
    },
  };
  const service = createCustomerKnowledgeScanService({
    repository,
    agentGatewaySettingsRepository: gatewayRepository(),
    fetchTask: async (_gateway, path, options) => {
      requests.push({ path, options });
      return { id: "66666666-6666-4666-8666-666666666666" };
    },
  });

  const scan = await service.reingest("49", parentScan.id);

  assert.equal(scan.cagIngestionId, "66666666-6666-4666-8666-666666666666");
  assert.equal(
    requests[0].options.headers["Idempotency-Key"],
    `oneops-customer-scan-repair-${parentScan.id}-${parentScan.cagIngestionId}`,
  );
});

test("取消済み再取込は Scan を終了させて再実行可能にする", async () => {
  const failed = {};
  const parentScan = {
    id: "11111111-1111-4111-8111-111111111111",
    status: "INGESTING",
    sourceSettingId: sourceSetting().id,
    cagIngestionId: "22222222-2222-4222-8222-222222222222",
  };
  const service = createCustomerKnowledgeScanService({
    repository: {
      async getScan() { return parentScan; },
      async getSourceSetting() { return sourceSetting(); },
      async failScan(scanId, code, message) {
        Object.assign(failed, { scanId, code, message });
        return { ...parentScan, status: "FAILED", errorCode: code };
      },
    },
    agentGatewaySettingsRepository: gatewayRepository(),
    fetchTask: async () => ({ status: "cancelled" }),
  });

  const scan = await service.refresh("49", parentScan.id);

  assert.equal(scan.status, "FAILED");
  assert.equal(failed.code, "INGESTION_CANCELLED");
});
