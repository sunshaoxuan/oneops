import { describe, expect, it } from "vitest";
import { findModuleScopedVersionsWithoutSelection } from "./environment-product-validation";

const products = [
  {
    versionSelectionMode: "MODULE_SCOPED" as const,
    versions: [
      {
        id: "uhr-2117",
        modules: [{ id: "web-salary" }, { id: "common" }],
      },
      {
        id: "uhr-2116",
        modules: [{ id: "common-2116" }],
      },
    ],
  },
  {
    versionSelectionMode: "SINGLE" as const,
    versions: [{ id: "upds-v7", modules: [] }],
  },
];

describe("environment product module validation", () => {
  it("reports a selected module-scoped version without a purchased module", () => {
    expect(
      findModuleScopedVersionsWithoutSelection(
        products,
        ["uhr-2117"],
        [],
      ),
    ).toEqual(["uhr-2117"]);
  });

  it("accepts a module belonging to the selected module-scoped version", () => {
    expect(
      findModuleScopedVersionsWithoutSelection(
        products,
        ["uhr-2117"],
        ["web-salary"],
      ),
    ).toEqual([]);
  });

  it("does not require modules for a single-version product", () => {
    expect(
      findModuleScopedVersionsWithoutSelection(
        products,
        ["upds-v7"],
        [],
      ),
    ).toEqual([]);
  });

  it("validates every selected module-scoped version independently", () => {
    expect(
      findModuleScopedVersionsWithoutSelection(
        products,
        ["uhr-2117", "uhr-2116"],
        ["web-salary"],
      ),
    ).toEqual(["uhr-2116"]);
  });
});
