import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrganizationInquirySyncService,
  planOrganizationInquiryMapping,
} from "./organization-inquiry-sync.mjs";

const organization = {
  id: "42",
  code: "0280",
  name: "京都大学",
  shortName: "京大",
  explicitInquiryCustomerCode: "",
  inquiryExternalCustomerId: "",
};

test("問合顧客同期は Code 検索結果から名称が一意に一致する物理顧客を選ぶ", () => {
  assert.deepEqual(
    planOrganizationInquiryMapping(
      organization,
      {
        actualCount: 2,
        tickets: [
          { customer: "京大病院" },
          { customer: "京都大学" },
        ],
      },
      [
        { value: "210", label: "京都大学" },
        { value: "211", label: "京大病院" },
      ],
    ),
    {
      action: "map",
      organizationId: "42",
      inquiryCustomerCode: "0280",
      inquiryExternalCustomerId: "210",
      inquiryCustomerName: "京都大学",
      externalCustomerIdStatus: "resolved",
    },
  );
});

test("問合顧客同期は選択肢内部 ID が未解決でも一意の Code と名称対応を保存する", () => {
  assert.deepEqual(
    planOrganizationInquiryMapping(
      organization,
      { actualCount: 1, tickets: [{ customer: "京都大学" }] },
      [],
    ),
    {
      action: "map",
      organizationId: "42",
      inquiryCustomerCode: "0280",
      inquiryExternalCustomerId: null,
      inquiryCustomerName: "京都大学",
      externalCustomerIdStatus: "not-listed",
    },
  );
});

test("問合顧客同期は同 Code 異名を競合として保持する", () => {
  assert.deepEqual(
    planOrganizationInquiryMapping(
      organization,
      {
        actualCount: 1,
        tickets: [{ customer: "別機関" }],
      },
      [{ value: "999", label: "別機関" }],
    ),
    {
      action: "conflict",
      type: "same-code-different-name",
      externalNames: ["別機関"],
    },
  );
});

test("問合顧客同期は既存の異なる対応値を上書きしない", () => {
  const plan = planOrganizationInquiryMapping(
    { ...organization, explicitInquiryCustomerCode: "EXISTING" },
    {
      actualCount: 1,
      tickets: [{ customer: "京都大学" }],
    },
    [{ value: "210", label: "京都大学" }],
  );
  assert.equal(plan.action, "conflict");
  assert.equal(plan.type, "existing-mapping-differs");
});

test("問合顧客同期サービスは安全な対応だけを物理 ID で一括保存する", async () => {
  const applied = [];
  const warnings = [];
  const service = createOrganizationInquirySyncService({
    organizationRepository: {
      async listInquirySyncCandidates() {
        return [
          organization,
          { ...organization, id: "43", code: "0001", name: "本省" },
        ];
      },
      async applyInquiryMappings(input) {
        applied.push(input);
        return input.mappings.length;
      },
    },
    inquiryRepository: {
      async getSourceSettings() {
        return {
          id: "00000000-0000-4000-8000-000000000001",
          enabled: true,
          username: "configured-user",
          password: "configured-password",
        };
      },
    },
    sourceClient: {
      async options() {
        return {
          customers: [
            { value: "210", label: "京都大学" },
            { value: "124", label: "文部科学省" },
          ],
        };
      },
      async search(_settings, filters) {
        return filters.customerCode === "0280"
          ? { actualCount: 1, tickets: [{ customer: "京都大学" }] }
          : { actualCount: 1, tickets: [{ customer: "文部科学省" }] };
      },
    },
    logger: async (level, message, details) => {
      if (level === "warn") warnings.push({ message, details });
    },
  });

  const summary = await service.synchronize({
    id: "onehr-upds-customer-directory",
    sourceCode: "ONEHR_UPDS",
  });
  assert.equal(summary.mapped, 1);
  assert.equal(summary.conflicts.length, 1);
  assert.equal(summary.unmatched.length, 0);
  assert.equal(applied[0].sourceSettingId, "00000000-0000-4000-8000-000000000001");
  assert.equal(applied[0].mappings[0].organizationId, "42");
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].details.todo, "SYSTEM_MESSAGE");
});
