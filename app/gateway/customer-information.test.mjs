import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isEffectiveContract,
  pagination,
  validateBacklogProjects,
  validateCustomerContract,
  validateCustomerVpn,
} from "./customer-information.mjs";
import { createCustomerInformationRouteHandler } from "./customer-information-routes.mjs";
import { BacklogSystemSourceClient } from "./external-task-settings.mjs";

test("顧客契約は製品物理 ID と期間を検証する", () => {
  const valid = validateCustomerContract({
    itemType: "PRODUCT",
    productId: "12",
    introductionStatus: "ACTIVE",
    introductionStartDate: "2026-08-01",
    introductionEndDate: "2026-08-31",
    maintenanceStatus: "PLANNED",
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.contract.productId, "12");

  const invalid = validateCustomerContract({
    itemType: "SERVICE",
    serviceName: "",
    introductionStatus: "ACTIVE",
    introductionStartDate: "2026-09-01",
    introductionEndDate: "2026-08-01",
    maintenanceStatus: "NONE",
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.serviceName, "CONTRACT_SERVICE_NAME_REQUIRED");
  assert.equal(invalid.errors.introductionEndDate, "DATE_ORDER_INVALID");
});

test("VPN、Backlog 対応を正規化する", () => {
  assert.equal(validateCustomerVpn({
    name: "Tokyo VPN",
    vpnType: "ssl",
    status: "active",
  }).valid, true);
  const projects = validateBacklogProjects({
    projects: [
      { externalProjectId: "7", projectKey: "OPS", projectName: "Operations" },
      { externalProjectId: "7", projectKey: "OLD", projectName: "Duplicate" },
    ],
  });
  assert.equal(projects.valid, true);
  assert.equal(projects.projects.length, 1);
});

test("有効契約とページ番号を現在日で判定する", () => {
  assert.equal(isEffectiveContract({
    introductionStatus: "ACTIVE",
    introductionStartDate: "2026-08-01",
    introductionEndDate: "2026-08-31",
    maintenanceStatus: "NONE",
    maintenanceStartDate: null,
    maintenanceEndDate: null,
  }, new Date("2026-08-05T00:00:00Z")), true);
  assert.deepEqual(pagination({ page: "3", pageSize: "20" }), {
    page: 3,
    pageSize: 20,
    offset: 40,
  });
});

test("顧客 Backlog チケットは担当者条件を付けず実 API ページを送信する", async () => {
  const requests = [];
  const client = new BacklogSystemSourceClient({
    fetchImpl: async (url) => {
      requests.push(new URL(url));
      if (String(url).includes("issues/count")) {
        return new Response(JSON.stringify({ count: 41 }), { status: 200 });
      }
      return new Response(JSON.stringify([{ id: 1, issueKey: "OPS-1", summary: "Issue", projectId: 7 }]), { status: 200 });
    },
  });
  const result = await client.listIssues({
    baseUrl: "https://example.backlog.com/",
    apiUrl: "https://example.backlog.com/api/v2",
    apiKey: "secret",
  }, { projectIds: ["7"], offset: 20, count: 20 });
  assert.equal(result.total, 41);
  const issueRequest = requests.find((url) => url.pathname.endsWith("/issues"));
  assert.deepEqual(issueRequest.searchParams.getAll("projectId[]"), ["7"]);
  assert.equal(issueRequest.searchParams.get("offset"), "20");
  assert.equal(issueRequest.searchParams.get("count"), "20");
  assert.equal(issueRequest.searchParams.has("assigneeId[]"), false);
  assert.equal(String(issueRequest).includes("secret"), true);
});

test("顧客問合一覧は顧客 Code を使い担当者条件を送信しない", async () => {
  let capturedFilters;
  let status;
  let body;
  const handler = createCustomerInformationRouteHandler({
    repository: {
      getInformation: async () => ({
        settings: { inquiryCustomerCode: "CUSTOMER-01" },
      }),
    },
    inquiryRepository: {
      getSettings: async () => ({ enabled: true, password: "secret" }),
    },
    inquirySourceClient: {
      search: async (_settings, filters) => {
        capturedFilters = filters;
        return {
          actualCount: 1,
          sourceTruncated: false,
          tickets: [{ ticketNo: "100" }],
        };
      },
    },
    backlogSourceClient: {},
    hasPermission: () => true,
    sendJson: (_response, responseStatus, responseBody) => {
      status = responseStatus;
      body = responseBody;
    },
    readJsonBody: async () => ({}),
  });
  const handled = await handler(
    { method: "GET" },
    {},
    new URL("http://localhost/api/work-center/v1/customers/1/inquiries?page=1&pageSize=20"),
    { id: "user" },
  );
  assert.equal(handled, true);
  assert.equal(status, 200);
  assert.equal(body.total, 1);
  assert.equal(capturedFilters.customerCode, "CUSTOMER-01");
  assert.equal(capturedFilters.assignee, null);
  assert.equal(capturedFilters.assigneeName, null);
  assert.equal(capturedFilters.unassignedOnly, false);
});

test("顧客問合一覧は全取得結果を件名順に並べてからページングする", async () => {
  let status;
  let body;
  const handler = createCustomerInformationRouteHandler({
    repository: {
      getInformation: async () => ({
        settings: { inquiryCustomerCode: "CUSTOMER-01" },
      }),
    },
    inquiryRepository: {
      getSettings: async () => ({ enabled: true, password: "secret" }),
    },
    inquirySourceClient: {
      search: async () => ({
        actualCount: 11,
        sourceTruncated: false,
        tickets: ["K", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map(
          (title, index) => ({
            ticketNo: String(index + 1),
            title,
            status: "OPEN",
            assignee: "",
            customer: "",
            updatedAt: "",
          }),
        ),
      }),
    },
    backlogSourceClient: {},
    hasPermission: () => true,
    sendJson: (_response, responseStatus, responseBody) => {
      status = responseStatus;
      body = responseBody;
    },
    readJsonBody: async () => ({}),
  });

  await handler(
    { method: "GET" },
    {},
    new URL("http://localhost/api/work-center/v1/customers/1/inquiries?page=2&pageSize=10&sortField=title&sortOrder=asc"),
    { id: "user" },
  );

  assert.equal(status, 200);
  assert.deepEqual(body.tickets.map((ticket) => ticket.ticketNo), ["1"]);
});

test("顧客 Backlog 一覧は共通テンプレートをまとめて実行する", async () => {
  let capturedInput;
  let status;
  let body;
  const handler = createCustomerInformationRouteHandler({
    repository: {
      getInformation: async () => ({
        settings: {
          organizationCode: "0496",
          organizationName: "政策研究大学院大学",
          organizationShortName: "",
        },
      }),
    },
    inquiryRepository: {
      getBacklogSettings: async () => ({ enabled: true, apiKey: "secret" }),
      listBacklogSearchTemplates: async () => [{
        id: "template-1",
        projectId: "155893",
        projectKey: "TS2_ITS",
        projectName: "TS2課_導入・保守支援",
        fieldId: "120235",
        fieldName: "機関名",
        matchMode: "CUSTOM_FIELD",
        valueSource: "AUTO",
        enabled: true,
      }],
    },
    inquirySourceClient: {},
    backlogSourceClient: {
      listIssuesByTemplates: async (_settings, input) => {
        capturedInput = input;
        return {
          total: 1,
          projects: [{
            externalProjectId: "155893",
            projectKey: "TS2_ITS",
            projectName: "TS2課_導入・保守支援",
          }],
          issues: [{ id: "99", issueKey: "TS2_ITS-215" }],
        };
      },
    },
    hasPermission: () => true,
    sendJson: (_response, responseStatus, responseBody) => {
      status = responseStatus;
      body = responseBody;
    },
    readJsonBody: async () => ({}),
  });

  const handled = await handler(
    { method: "GET" },
    {},
    new URL("http://localhost/api/work-center/v1/customers/1/backlog-issues?page=1&pageSize=20"),
    { id: "user" },
  );
  assert.equal(handled, true);
  assert.equal(status, 200);
  assert.equal(body.total, 1);
  assert.equal(capturedInput.customer.code, "0496");
  assert.equal(capturedInput.templates.length, 1);
  assert.equal(capturedInput.sortField, "summary");
  assert.equal(capturedInput.sortOrder, "asc");
  assert.equal(body.issues[0].issueKey, "TS2_ITS-215");
});

test("Migration 028 は顧客物理 ID 外部キーと秘密情報非保持を定義する", async () => {
  const migration = await readFile(
    new URL("../db/migrations/028_create_customer_information.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /customer_contracts/);
  assert.match(migration, /organization_id BIGINT NOT NULL[\s\S]*REFERENCES organizations\(id\)/);
  assert.match(migration, /customer_backlog_projects/);
  assert.doesNotMatch(migration, /password|secret|api_key/i);
});

test("Migration 030 は顧客設定へ独立した物理 ID を追加する", async () => {
  const migration = await readFile(
    new URL(
      "../db/migrations/030_add_customer_information_setting_physical_id.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /id UUID DEFAULT gen_random_uuid\(\)/);
  assert.match(
    migration,
    /customer_information_settings_pkey PRIMARY KEY \(id\)/,
  );
  assert.match(migration, /UNIQUE \(organization_id\)/);
});

test("Migration 031 は問合顧客対応を組織及びデータソースの物理 ID で保持する", async () => {
  const migration = await readFile(
    new URL(
      "../db/migrations/031_expand_inquiry_customer_mapping_sync.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /inquiry_source_setting_id UUID/);
  assert.match(migration, /REFERENCES inquiry_source_settings\(id\)/);
  assert.match(migration, /inquiry_external_customer_id VARCHAR\(100\)/);
  assert.match(migration, /inquiry_customer_name VARCHAR\(255\)/);
  assert.match(migration, /inquiry_last_synced_at TIMESTAMPTZ/);
});

test("Migration 032 は顧客スキャンと候補を独立物理 ID 及び外部キーで保持する", async () => {
  const migration = await readFile(
    new URL(
      "../db/migrations/032_create_customer_knowledge_scans.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /customer_knowledge_scans/);
  assert.match(migration, /id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  assert.match(migration, /REFERENCES organizations\(id\)/);
  assert.match(migration, /REFERENCES agent_gateway_settings\(id\)/);
  assert.match(migration, /customer_knowledge_scan_candidates/);
  assert.match(migration, /REFERENCES customer_knowledge_scans\(id\)/);
  assert.match(migration, /applied_contract_id UUID[\s\S]*REFERENCES customer_contracts\(id\)/);
  assert.match(migration, /applied_vpn_id UUID[\s\S]*REFERENCES customer_vpn_connections\(id\)/);
  assert.match(migration, /applied_environment_id BIGINT[\s\S]*REFERENCES environments\(id\)/);
});

test("Migration 034 は Scope、項目候補、知識源用途及び専用権限を物理 ID で保持する", async () => {
  const migration = await readFile(
    new URL("../db/migrations/034_scoped_customer_ledger_extraction.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /customer_knowledge_source_settings/);
  assert.match(migration, /cag_project_id UUID NOT NULL/);
  assert.match(migration, /cag_source_id UUID NOT NULL/);
  assert.match(migration, /cag_scope_id UUID/);
  assert.match(migration, /field_code VARCHAR\(128\) NOT NULL/);
  assert.match(migration, /option_external_id UUID/);
  assert.match(migration, /customer\.knowledge\.scan/);
  assert.match(migration, /customer\.knowledge\.review/);
  assert.match(migration, /customer\.knowledge\.manage/);
});

test("Migration 035 はカスタマイズ記録を組織、Scan、Candidate の物理 ID で保持する", async () => {
  const migration = await readFile(
    new URL("../db/migrations/035_create_customer_customizations.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /customer_customizations/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS cag_ingestion_id UUID/);
  assert.match(migration, /DROP CONSTRAINT IF EXISTS customer_knowledge_source_settings_template_valid/);
  assert.match(migration, /SET analysis_template_version = 2/);
  assert.match(migration, /analysis_template_version = 2/);
  assert.match(migration, /id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  assert.match(migration, /organization_id BIGINT[\s\S]*REFERENCES organizations\(id\)/);
  assert.match(migration, /source_scan_id UUID[\s\S]*REFERENCES customer_knowledge_scans\(id\)/);
  assert.match(migration, /source_candidate_id UUID[\s\S]*REFERENCES customer_knowledge_scan_candidates\(id\)/);
  assert.match(migration, /affected_components TEXT\[\]/);
});

test("Migration 003 は廃止済み区分文字列列を再作成しない", async () => {
  const migration = await readFile(
    new URL("../db/migrations/003_add_organization_business_fields.sql", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(migration, /ADD COLUMN IF NOT EXISTS classification\b/);
  assert.match(migration, /short_name/);
  assert.match(migration, /maintenance_status/);
});

test("Migration 029 は Backlog 検索テンプレートを共通設定として定義する", async () => {
  const migration = await readFile(
    new URL("../db/migrations/029_create_backlog_search_templates.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /backlog_search_templates/);
  assert.match(migration, /project_id VARCHAR\(100\) NOT NULL/);
  assert.match(migration, /field_id VARCHAR\(100\) NOT NULL/);
  assert.match(migration, /match_mode IN \('CUSTOM_FIELD', 'TITLE_CONTAINS'\)/);
  assert.match(migration, /revision INTEGER NOT NULL DEFAULT 1/);
});
