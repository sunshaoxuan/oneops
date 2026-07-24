import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeEnvironmentInput,
  validateEnvironmentGroup,
  validateEnvironmentInput,
  validateProductInput,
  validateProductVersionInput,
  validateProductVersionModuleInput,
} from "./environment.mjs";

test("environment input normalizes defaults and product links", () => {
  assert.deepEqual(
    normalizeEnvironmentInput({
      organizationId: 42,
      groupId: 7,
      name: " 本番環境 ",
      products: [{ productVersionId: 3 }],
    }),
    {
      organizationId: "42",
      groupId: "7",
      name: "本番環境",
      scope: "CUSTOMER",
      purpose: "PRODUCTION",
      status: "ACTIVE",
      url: "",
      ownerName: "",
      notes: "",
      sortOrder: 0,
      revision: 0,
      lastVerifiedAt: "",
      products: [
        {
          productVersionId: "3",
          usageStatus: "ACTIVE",
          notes: "",
          moduleIds: [],
        },
      ],
    },
  );
});

test("environment validation enforces physical IDs and fixed dimensions", () => {
  const result = validateEnvironmentInput({
    organizationId: "customer-code",
    groupId: "",
    name: "",
    scope: "EXTERNAL",
    purpose: "TEST",
    status: "UNKNOWN",
  });

  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    "groupId",
    "name",
    "organizationId",
    "purpose",
    "scope",
    "status",
  ]);
});

test("environment validation rejects duplicate product versions", () => {
  const result = validateEnvironmentInput({
    organizationId: "42",
    groupId: "7",
    name: "検証環境",
    products: [
      { productVersionId: "3" },
      { productVersionId: "3" },
    ],
  });

  assert.equal(result.valid, false);
  assert.equal(
    result.errors["products.1.productVersionId"],
    "Product version must not be duplicated.",
  );
});

test("environment update requires a positive revision", () => {
  const result = validateEnvironmentInput(
    {
      organizationId: "42",
      groupId: "7",
      name: "検証環境",
      revision: 0,
    },
    { requireRevision: true },
  );

  assert.equal(result.valid, false);
  assert.equal(result.errors.revision, "Revision must be a positive integer.");
});

test("environment URL accepts only valid HTTP and HTTPS addresses", () => {
  assert.equal(
    validateEnvironmentInput({
      organizationId: "42",
      groupId: "7",
      name: "本番環境",
      url: "https://example.test/",
    }).valid,
    true,
  );
  assert.equal(
    validateEnvironmentInput({
      organizationId: "42",
      groupId: "7",
      name: "本番環境",
      url: "file:///secret",
    }).valid,
    false,
  );
});

test("group and product master validation preserve physical ID rules", () => {
  assert.equal(
    validateEnvironmentGroup({
      organizationId: "42",
      name: "基幹環境",
      sortOrder: 2,
    }).valid,
    true,
  );
  assert.equal(
    validateProductInput({
      code: "upds-payroll",
      name: "U-PDS 給与",
    }).product.code,
    "UPDS-PAYROLL",
  );
  assert.equal(
    validateProductVersionInput({
      productId: "8",
      version: "V7.2",
    }).valid,
    true,
  );
});

test("product version module validation enforces its version parent", () => {
  const valid = validateProductVersionModuleInput({
    productVersionId: "8",
    code: " payroll ",
    name: "給与計算",
    shortName: "給与",
    sortOrder: 2,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.productVersionModule.code, "PAYROLL");

  const invalid = validateProductVersionModuleInput({
    productVersionId: "product-code",
    code: "",
    name: "",
  });
  assert.equal(invalid.valid, false);
  assert.deepEqual(Object.keys(invalid.errors).sort(), [
    "code",
    "name",
    "productVersionId",
  ]);
});

test("environment validation rejects duplicate module physical IDs", () => {
  const result = validateEnvironmentInput({
    organizationId: "42",
    groupId: "7",
    name: "本番環境",
    products: [
      {
        productVersionId: "3",
        moduleIds: ["11", "11"],
      },
    ],
  });

  assert.equal(result.valid, false);
  assert.equal(
    result.errors["products.0.moduleIds.1"],
    "Product version module must not be duplicated.",
  );
});
