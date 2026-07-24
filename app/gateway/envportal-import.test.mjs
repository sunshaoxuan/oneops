import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fingerprintImportRow,
  parseCsv,
  planEnvPortalImport,
  publicImportReport,
  sanitizeSourceRow,
} from "./envportal-import.mjs";

test("EnvPortal CSV parser preserves quoted commas and line breaks", () => {
  const parsed = parseCsv(
    "\uFEFF組織コード,組織名,備考\r\n" +
      '0408,"筑波,大学","一行目\n二行目"\r\n',
  );

  assert.deepEqual(parsed.headers, ["組織コード", "組織名", "備考"]);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].rowNumber, 2);
  assert.equal(parsed.rows[0].values["組織名"], "筑波,大学");
  assert.equal(parsed.rows[0].values["備考"], "一行目\n二行目");
});

test("EnvPortal sanitization excludes credential values and counts fields", () => {
  const secretFields = new Set([
    "ログインID",
    "ログインパスワード",
  ]);
  const result = sanitizeSourceRow(
    {
      "組織コード": "0408",
      "組織名": "筑波大学",
      "ログインID": "example-user",
      "ログインパスワード": "must-not-persist",
    },
    secretFields,
  );

  assert.deepEqual(result.sanitizedPayload, {
    "組織コード": "0408",
    "組織名": "筑波大学",
  });
  assert.equal(result.credentialFieldCount, 2);
  assert.doesNotMatch(
    JSON.stringify(result),
    /example-user|must-not-persist/,
  );
});

test("row fingerprints do not depend on excluded credential values", () => {
  const secretFields = new Set(["ログインパスワード"]);
  const first = sanitizeSourceRow(
    { "組織コード": "0408", "ログインパスワード": "first" },
    secretFields,
  );
  const second = sanitizeSourceRow(
    { "組織コード": "0408", "ログインパスワード": "second" },
    secretFields,
  );

  assert.equal(
    fingerprintImportRow("ENVIRONMENT", first.sanitizedPayload),
    fingerprintImportRow("ENVIRONMENT", second.sanitizedPayload),
  );
});

test("EnvPortal import plan matches by code and stages unresolved data", () => {
  const source = {
    sourceSystem: "ENVPORTAL",
    manifestSha256: "a".repeat(64),
    sourceManifest: {
      files: [
        { fileName: "data.csv", sha256: "b".repeat(64), rowCount: 2 },
      ],
      missingOptionalFiles: [],
    },
    dataRows: [
      {
        rowNumber: 2,
        values: {
          "組織コード": "0408",
          "組織名": "筑波大学",
          "構築環境名": "UHR",
          URL: "https://example.test/uhr",
          "ログインID": "user",
          "ログインパスワード": "password",
          "DBタイプ": "Oracle",
          "DBバージョン": "19",
          "DB名": "service",
          "DBユーザー名": "db-user",
          "DBパスワード": "db-password",
        },
      },
      {
        rowNumber: 3,
        values: {
          "組織コード": "0000",
          "組織名": "標準版",
          "構築環境名": "UHR",
          URL: "https://example.test/demo",
        },
      },
    ],
    rdpRows: [
      {
        rowNumber: 2,
        values: {
          "組織名": "筑波大学",
          "接続タイプ": "RDP",
          "接続先(IP:Port)": "example.test:3389",
          "RDPユーザー名": "rdp-user",
          "RDPパスワード": "rdp-password",
        },
      },
    ],
    tagRows: [],
  };
  const plan = planEnvPortalImport({
    source,
    organizations: [
      { id: "2", code: "0408", name: "筑波大学" },
    ],
  });

  assert.equal(plan.summary.total, 3);
  assert.equal(plan.summary.imported, 1);
  assert.equal(plan.summary.staged, 1);
  assert.equal(plan.summary.unmatched, 1);
  assert.equal(plan.summary.credentialFieldsExcluded, 6);
  assert.equal(plan.rows[0].environmentInput.scope, "CUSTOMER");
  assert.equal(plan.rows[0].environmentInput.purpose, "OTHER");
  assert.equal(plan.rows[1].resolutionStatus, "UNMATCHED");
  assert.equal(plan.rows[2].resolutionStatus, "STAGED");
  assert.equal(
    plan.rows[2].linkedEnvironmentFingerprint,
    plan.rows[0].rowFingerprint,
  );

  const report = publicImportReport(plan, {
    mode: "apply",
    environmentIds: {
      [plan.rows[0].rowFingerprint]: "123",
    },
  });
  assert.equal(report.rows[0].targetEnvironmentId, "123");
  assert.equal(report.rows[2].targetEnvironmentId, "123");
  assert.doesNotMatch(
    JSON.stringify(report),
    /password|db-password|rdp-password|db-user|rdp-user/,
  );
});

test("an unmatched source code does not silently fall back to name", () => {
  const source = {
    sourceSystem: "ENVPORTAL",
    manifestSha256: "d".repeat(64),
    sourceManifest: { files: [], missingOptionalFiles: [] },
    dataRows: [
      {
        rowNumber: 2,
        values: {
          "組織コード": "LEGACY",
          "組織名": "筑波大学",
          "構築環境名": "UHR",
          URL: "https://example.test/uhr",
        },
      },
    ],
    rdpRows: [],
    tagRows: [],
  };
  const plan = planEnvPortalImport({
    source,
    organizations: [
      { id: "2", code: "0408", name: "筑波大学" },
    ],
  });

  assert.equal(plan.summary.imported, 0);
  assert.equal(plan.summary.unmatched, 1);
  assert.match(plan.rows[0].message, /requires confirmation/);
});

test("EnvPortal import plan never overwrites an existing environment", () => {
  const source = {
    sourceSystem: "ENVPORTAL",
    manifestSha256: "c".repeat(64),
    sourceManifest: { files: [], missingOptionalFiles: [] },
    dataRows: [
      {
        rowNumber: 2,
        values: {
          "組織コード": "0408",
          "組織名": "筑波大学",
          "構築環境名": "UHR",
          URL: "https://example.test/uhr",
        },
      },
    ],
    rdpRows: [],
    tagRows: [],
  };
  const plan = planEnvPortalImport({
    source,
    organizations: [
      { id: "2", code: "0408", name: "筑波大学" },
    ],
    existingEnvironments: [
      { id: "10", organizationId: "2", name: "UHR" },
    ],
  });

  assert.equal(plan.summary.imported, 0);
  assert.equal(plan.summary.conflicts, 1);
  assert.equal(plan.rows[0].resolutionStatus, "CONFLICT");
});

test("duplicate source rows produce one import action", () => {
  const values = {
    "組織コード": "0408",
    "組織名": "筑波大学",
    "構築環境名": "UHR",
    URL: "https://example.test/uhr",
  };
  const source = {
    sourceSystem: "ENVPORTAL",
    manifestSha256: "e".repeat(64),
    sourceManifest: { files: [], missingOptionalFiles: [] },
    dataRows: [
      { rowNumber: 2, values },
      { rowNumber: 3, values: { ...values } },
    ],
    rdpRows: [],
    tagRows: [],
  };
  const plan = planEnvPortalImport({
    source,
    organizations: [
      { id: "2", code: "0408", name: "筑波大学" },
    ],
  });

  assert.equal(plan.summary.imported, 1);
  assert.equal(plan.summary.unchanged, 1);
});

test("previous EnvPortal rows are enriched with OneOps structure", () => {
  const source = {
    sourceSystem: "ENVPORTAL",
    manifestSha256: "f".repeat(64),
    sourceManifest: { files: [], missingOptionalFiles: [] },
    dataRows: [
      {
        rowNumber: 2,
        values: {
          "組織コード": "0408",
          "組織名": "筑波大学",
          "構築環境名": "UHR",
          URL: "https://192.0.2.10/uhr",
          "DBタイプ": "Oracle",
          "DBバージョン": "19",
          "DB名": "192.0.2.11:1521:UHR",
        },
      },
    ],
    rdpRows: [],
    tagRows: [],
    oneOpsProductSource: {
      fileName: "organizations.xlsx",
      records: [
        {
          sourceRowNumber: 40,
          organizationCode: "0408",
          organizationName: "筑波大学",
          versionCandidate: "V6",
          productCandidates: [
            {
              name: "U-PDS 人事",
              value: "◎",
              classification: "AFFIRMATIVE",
            },
          ],
        },
      ],
    },
  };
  const plan = planEnvPortalImport({
    source,
    organizations: [
      { id: "2", code: "0408", name: "筑波大学" },
    ],
    existingEnvironments: [
      { id: "10", organizationId: "2", name: "UHR" },
    ],
    priorSourceLinks: {
      "data.csv:2": {
        environmentId: "10",
        rowFingerprint: "old",
      },
    },
    products: [
      {
        id: "3",
        code: "01",
        name: "U-PDS人事給与",
        versions: [
          {
            id: "30",
            productId: "3",
            version: "6.0",
            displayVersion: "V6",
            modules: [
              {
                id: "300",
                productVersionId: "30",
                code: "UPDS-HR",
                name: "U-PDS 人事",
              },
            ],
          },
        ],
      },
    ],
  });

  assert.equal(plan.summary.enriched, 1);
  assert.equal(plan.summary.staged, 1);
  assert.equal(plan.summary.endpointsPlanned, 2);
  assert.equal(plan.summary.productVersionLinksPlanned, 1);
  assert.equal(plan.summary.moduleLinksPlanned, 1);
  assert.equal(plan.summary.productCandidatesStaged, 1);
  assert.equal(plan.rows[0].action, "ENRICH");
  assert.equal(plan.rows[0].environmentInput.groupName, "お客様環境");
  assert.equal(plan.rows[0].environmentInput.purpose, "OTHER");
  assert.equal(plan.rows[0].environmentInput.endpointInputs[1].role, "DB");
  assert.equal(
    plan.rows[0].environmentInput.productLinks[0].confirmationStatus,
    "PENDING",
  );
  assert.deepEqual(
    plan.rows[0].environmentInput.productLinks[0].moduleIds,
    ["300"],
  );
  assert.equal(plan.rows[1].rowKind, "PRODUCT_CANDIDATE");
});

test("OneOps purpose inference uses explicit environment evidence", () => {
  const source = {
    sourceSystem: "ENVPORTAL",
    manifestSha256: "1".repeat(64),
    sourceManifest: { files: [], missingOptionalFiles: [] },
    dataRows: [
      {
        rowNumber: 2,
        values: {
          "組織コード": "0408",
          "組織名": "筑波大学",
          "構築環境名": "UHR-検証",
          URL: "https://example.test/uhr",
        },
      },
    ],
    rdpRows: [],
    tagRows: [],
  };
  const plan = planEnvPortalImport({
    source,
    organizations: [
      { id: "2", code: "0408", name: "筑波大学" },
    ],
  });

  assert.equal(plan.rows[0].environmentInput.purpose, "VERIFICATION");
  assert.equal(plan.rows[0].environmentInput.groupName, "お客様環境");
});
