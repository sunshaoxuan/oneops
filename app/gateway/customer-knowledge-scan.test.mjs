import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomerKnowledgeScanPrompt,
  createCustomerKnowledgeScanService,
  normalizeCustomerKnowledgeResult,
} from "./customer-knowledge-scan.mjs";

const citation = {
  source_id: "source-1",
  source_name: "顧客資料",
  path: "customers/9330/network.xlsx",
  resource_uri: "knowledge://source-1/network.xlsx#sheet1",
  score: 0.91,
};

test("顧客スキャン Prompt は Code、正式名、略称と推測禁止を保持する", () => {
  const prompt = buildCustomerKnowledgeScanPrompt({
    code: "9330",
    name: "岡山市立総合医療センター",
    shortName: "岡山市民病院",
  });
  assert.match(prompt, /9330/);
  assert.match(prompt, /岡山市立総合医療センター/);
  assert.match(prompt, /岡山市民病院/);
  assert.match(prompt, /推測は禁止/);
  assert.match(prompt, /resource_uri/);
});

test("CAG 結果は実際の knowledge citation を持つ候補だけを採用する", () => {
  const normalized = normalizeCustomerKnowledgeResult({
    summary: JSON.stringify({
      contracts: [
        {
          itemType: "SERVICE",
          serviceName: "運用保守サービス",
          introductionStatus: "ACTIVE",
          maintenanceStatus: "ACTIVE",
          confidence: 0.88,
          evidenceResourceUris: [citation.resource_uri],
        },
        {
          itemType: "SERVICE",
          serviceName: "根拠なしサービス",
          confidence: 1,
          evidenceResourceUris: ["knowledge://unknown"],
        },
      ],
      vpnConnections: [{
        name: "保守 VPN",
        vpnType: "IPSEC",
        status: "ACTIVE",
        confidence: 0.9,
        evidenceResourceUris: [citation.resource_uri],
      }],
      environments: [],
      learningGaps: ["サーバー IP の資料が不足しています。"],
    }),
    knowledge_citations: [citation],
  });
  assert.equal(normalized.valid, true);
  assert.equal(normalized.candidates.length, 2);
  assert.deepEqual(
    normalized.candidates.map((item) => item.candidateType),
    ["CONTRACT", "VPN"],
  );
  assert.equal(normalized.candidates[0].evidence[0].path, citation.path);
  assert.deepEqual(normalized.learningGaps, ["サーバー IP の資料が不足しています。"]);
});

test("構造化できない CAG 回答は失敗として明示する", () => {
  const normalized = normalizeCustomerKnowledgeResult({
    summary: "資料が見つかりませんでした。",
    knowledge_citations: [],
  });
  assert.equal(normalized.valid, false);
  assert.equal(normalized.errorCode, "CAG_SCAN_RESULT_INVALID");
  assert.equal(normalized.candidates.length, 0);
});

test("顧客スキャンは物理 Scan ID で非同期 CAG Task を開始する", async () => {
  const calls = [];
  const repository = {
    async getOrganization() {
      return { code: "9330", name: "岡山市立総合医療センター", shortName: "" };
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
    agentGatewaySettingsRepository: {
      async list() {
        return [{ id: "gateway-1", enabled: true, endpoint: "http://cag/api/v1" }];
      },
    },
    fetchTask: async (_gateway, path, options) => {
      assert.equal(path, "/tasks");
      const body = JSON.parse(options.body);
      assert.equal(body.knowledge_mode, "required");
      assert.equal(body.learning_mode, "off");
      return { id: "22222222-2222-4222-8222-222222222222", status: "queued" };
    },
  });
  const scan = await service.start("9330", "user-1", "request-1");
  assert.equal(scan.status, "QUEUED");
  assert.equal(calls[0][0], "createScan");
  assert.equal(calls[1][0], "attachTask");
});

test("CAG 状態取得失敗は Scan を消さず可視エラーとして保持する", async () => {
  let recorded;
  const repository = {
    async getScan() {
      return {
        id: "11111111-1111-4111-8111-111111111111",
        status: "RUNNING",
        gatewaySettingId: "gateway-1",
        cagTaskId: "22222222-2222-4222-8222-222222222222",
      };
    },
    async recordRefreshError(scanId, code, message) {
      recorded = { scanId, code, message };
      return { id: scanId, status: "RUNNING", errorCode: code };
    },
  };
  const service = createCustomerKnowledgeScanService({
    repository,
    agentGatewaySettingsRepository: {
      async get() {
        return { id: "gateway-1", enabled: true };
      },
    },
    fetchTask: async () => {
      throw Object.assign(new Error("timeout"), { code: "CAG_SCAN_TIMEOUT" });
    },
  });
  const scan = await service.refresh("9330", "scan-1");
  assert.equal(scan.status, "RUNNING");
  assert.equal(recorded.code, "CAG_SCAN_TIMEOUT");
});

test("15 分を超えた CAG 状態取得失敗は再スキャン可能な失敗へ確定する", async () => {
  let failed;
  const repository = {
    async getScan() {
      return {
        id: "11111111-1111-4111-8111-111111111111",
        status: "RUNNING",
        gatewaySettingId: "gateway-1",
        cagTaskId: "22222222-2222-4222-8222-222222222222",
        createdAt: "2020-01-01T00:00:00Z",
      };
    },
    async failScan(scanId, code) {
      failed = { scanId, code };
      return { id: scanId, status: "FAILED", errorCode: code };
    },
  };
  const service = createCustomerKnowledgeScanService({
    repository,
    agentGatewaySettingsRepository: {
      async get() {
        return { id: "gateway-1", enabled: true };
      },
    },
    fetchTask: async () => {
      throw Object.assign(new Error("timeout"), { code: "CAG_SCAN_TIMEOUT" });
    },
  });
  const scan = await service.refresh("9330", "scan-1");
  assert.equal(scan.status, "FAILED");
  assert.equal(failed.code, "CAG_SCAN_EXECUTION_TIMEOUT");
});
