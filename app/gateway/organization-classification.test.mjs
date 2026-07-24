import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeOrganizationClassification,
  validateOrganizationClassification,
} from "./organization-classification.mjs";

test("classification archive exposes its physical ID and business fields", () => {
  assert.deepEqual(
    normalizeOrganizationClassification({
      id: 8,
      code: " CLASS-001 ",
      name: " 国立大学法人 ",
      internal: "hidden",
    }),
    {
      id: "8",
      code: "CLASS-001",
      name: "国立大学法人",
    },
  );
});

test("classification archive requires a valid business code and name", () => {
  const result = validateOrganizationClassification({
    code: "invalid code",
    name: "",
  });

  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ["code", "name"]);
});

test("classification archive accepts a valid business record", () => {
  const result = validateOrganizationClassification({
    code: "CLASS-001",
    name: "国立大学法人",
  });

  assert.equal(result.valid, true);
});
