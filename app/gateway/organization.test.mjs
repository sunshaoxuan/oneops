import assert from "node:assert/strict";
import test from "node:test";
import {
  classificationBusinessCode,
  legacyOrganizationCode,
  normalizeSourceMaintenance,
  normalizeOrganization,
  planLegacyOrganizationReconciliation,
  planOrganizationSourceMerge,
  normalizeSourceMaintenanceStatus,
  validateOrganization,
} from "./organization.mjs";

test("organization records expose the physical ID and archive fields", () => {
  assert.deepEqual(
    normalizeOrganization({
      id: 42,
      code: " ONEHR ",
      name: " OneHR株式会社 ",
      environment: "production",
    }),
    {
      id: "42",
      classificationId: "",
      classificationCode: "",
      classificationName: "",
      code: "ONEHR",
      name: "OneHR株式会社",
      shortName: "",
      maintenanceStatus: "",
      remarks: "",
      inquiryCustomerCode: "",
      inquiryCustomerName: "",
      inquiryLastSyncedAt: null,
    },
  );
});

test("source reconciliation preserves physical ID when replacing a legacy code", () => {
  assert.deepEqual(
    planLegacyOrganizationReconciliation(
      { id: 42, code: "LEGACY-ABC", name: "第一機関" },
      { code: "0001", name: "第一機関" },
    ),
    {
      action: "reconcile-legacy-code",
      id: "42",
      existingCode: "LEGACY-ABC",
      incomingCode: "0001",
    },
  );
});

test("source reconciliation reports same-name different-code conflicts", () => {
  assert.deepEqual(
    planLegacyOrganizationReconciliation(
      { id: 42, code: "EXISTING", name: "第一機関" },
      { code: "0001", name: "第一機関" },
    ),
    {
      action: "conflict",
      type: "same-name-different-code",
      existingCode: "EXISTING",
      incomingCode: "0001",
    },
  );
});

test("source merge supplements blanks without overwriting existing business data", () => {
  assert.deepEqual(
    planOrganizationSourceMerge(
      {
        name: "第一機関",
        classification_id: null,
        short_name: "既存略称",
        maintenance_status: null,
        remarks: null,
      },
      {
        name: "第一機関",
        classification: "公共",
        shortName: "新略称",
        maintenanceStatus: "〇",
        remarks: "例外原文",
      },
    ),
    {
      action: "supplement",
      supplements: {
        classificationName: "公共",
        maintenanceStatus: "〇",
        remarks: "例外原文",
      },
    },
  );
});

test("source merge reports same-code different-name conflict", () => {
  assert.deepEqual(
    planOrganizationSourceMerge(
      { name: "既存機関" },
      { name: "別機関" },
    ),
    {
      action: "conflict",
      type: "same-code-different-name",
      existingName: "既存機関",
      incomingName: "別機関",
    },
  );
});

test("organization input remains valid without a client supplied physical ID", () => {
  const result = validateOrganization({
    code: "ONEHR",
    name: "OneHR株式会社",
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.organization, {
    classificationId: "",
    classificationCode: "",
    classificationName: "",
    code: "ONEHR",
    name: "OneHR株式会社",
    shortName: "",
    maintenanceStatus: "",
    remarks: "",
    inquiryCustomerCode: "",
    inquiryCustomerName: "",
    inquiryLastSyncedAt: null,
  });
});

test("organization archive validates the inquiry customer code mapping", () => {
  const valid = validateOrganization({
    code: "ONEHR",
    name: "OneHR株式会社",
    inquiryCustomerCode: " UPDS-001 ",
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.organization.inquiryCustomerCode, "UPDS-001");

  const invalid = validateOrganization({
    code: "ONEHR",
    name: "OneHR株式会社",
    inquiryCustomerCode: `UPDS${String.fromCharCode(10)}001`,
  });
  assert.equal(invalid.valid, false);
  assert.deepEqual(Object.keys(invalid.errors), ["inquiryCustomerCode"]);
});

test("organization validation rejects invalid codes and blank names", () => {
  const result = validateOrganization({
    code: "invalid code",
    name: "",
  });

  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ["code", "name"]);
});

test("organization validation restricts maintenance status to the enum", () => {
  const result = validateOrganization({
    code: "ONEHR",
    name: "OneHR株式会社",
    maintenanceStatus: "自由入力",
  });

  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors), ["maintenanceStatus"]);
});

test("organization source maintenance values normalize to circle cross or empty", () => {
  assert.equal(normalizeSourceMaintenanceStatus("有"), "〇");
  assert.equal(normalizeSourceMaintenanceStatus("無"), "✕");
  assert.equal(
    normalizeSourceMaintenanceStatus("文部科学本省と一緒"),
    "〇",
  );
  assert.equal(normalizeSourceMaintenanceStatus("未確認"), "");
  assert.deepEqual(normalizeSourceMaintenance("文部科学本省と一緒"), {
    maintenanceStatus: "〇",
    remarks: "保守有無原文：文部科学本省と一緒",
  });
  assert.deepEqual(normalizeSourceMaintenance("未確認"), {
    maintenanceStatus: "",
    remarks: "保守有無原文：未確認",
  });
});

test("legacy organization codes are deterministic and contain no name data", () => {
  const first = legacyOrganizationCode("OneHR株式会社");
  const second = legacyOrganizationCode("OneHR株式会社");

  assert.equal(first, second);
  assert.match(first, /^LEGACY-[A-F0-9]{12}$/);
  assert.equal(first.includes("OneHR"), false);
});

test("classification archive business codes are deterministic", () => {
  const first = classificationBusinessCode("国立大学法人");
  const second = classificationBusinessCode(" 国立大学法人 ");

  assert.equal(first, second);
  assert.match(first, /^CLASS-[A-F0-9]{12}$/);
});
