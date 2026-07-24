import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/EnvironmentPage.tsx"),
  "utf8",
);
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("environment inventory page", () => {
  it("is routed through the selected organization physical ID", () => {
    expect(app).toContain('activeNavigation === "environments"');
    expect(app).toContain("<EnvironmentPage");
    expect(source).toContain(
      'queryKey: ["environment-inventory", organization?.id]',
    );
    expect(source).toContain("organizationId: organization!.id");
  });

  it("supports group and environment maintenance with archive recovery", () => {
    expect(source).toContain("createEnvironmentGroup");
    expect(source).toContain("updateEnvironmentGroup");
    expect(source).toContain("archiveEnvironmentGroup");
    expect(source).toContain("createEnvironment");
    expect(source).toContain("updateEnvironment");
    expect(source).toContain("setEnvironmentArchived");
    expect(source).toContain("revision: editingEnvironment?.revision ?? 0");
  });

  it("keeps product versions as physical ID associations", () => {
    expect(source).toContain('name="productVersionIds"');
    expect(source).toContain("productVersionId");
    expect(source).not.toContain("createProductVersion");
    expect(source).not.toContain("setProductModalOpen");
    expect(app).toContain("function ProductVersionMaster");
    expect(app).toContain("createProductVersion");
    expect(app).toContain("createProductVersionModule");
    expect(app).toContain('key: "product-versions"');
    expect(app).toContain("selectedProduct.versions");
    expect(app).toContain("selectedVersion.modules");
    expect(app).toContain(
      'className="product-version-grandchildren-layout"',
    );
    expect(source).toContain('name="productVersionModuleIds"');
    expect(source).toContain("moduleIds:");
  });

  it("uses the OneHR visual foundation across the three-panel workspace", () => {
    expect(source).toContain('className="environment-group-panel"');
    expect(source).toContain('className="environment-list-panel"');
    expect(source).toContain('className="environment-detail-panel"');
    expect(styles).toContain("#fd6c26");
    expect(styles).toContain("#00c4cc");
    expect(styles).toMatch(
      /\.environment-workspace\s*\{[\s\S]*?grid-template-columns:\s*230px/,
    );
    expect(styles).toMatch(
      /\.environment-hero-actions \.ant-btn\s*\{[\s\S]*?border-radius:\s*100px/,
    );
  });

  it("marks connection, VPN, evidence, and history as later phases", () => {
    expect(source).toContain('key: "connections"');
    expect(source).toContain('key: "vpn"');
    expect(source).toContain('key: "evidence"');
    expect(source).toContain('key: "history"');
    expect(source).toContain("<FuturePanel");
  });
});
