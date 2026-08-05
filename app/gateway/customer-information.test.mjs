import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isEffectiveContract,
  pagination,
  validateBacklogProjects,
  validateCustomerContract,
  validateCustomerSettings,
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

test("顧客設定、VPN、Backlog 対応を正規化する", () => {
  assert.deepEqual(validateCustomerSettings({ inquiryCustomerCode: " C001 " }).settings, {
    inquiryCustomerCode: "C001",
    revision: 0,
  });
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
