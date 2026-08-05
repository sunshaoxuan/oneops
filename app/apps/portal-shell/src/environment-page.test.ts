import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/EnvironmentPage.tsx"),
  "utf8",
);
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const customerPage = readFileSync(
  resolve(process.cwd(), "src/CustomerInformationPage.tsx"),
  "utf8",
);
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("environment inventory page", () => {
  it("is routed through the selected organization physical ID", () => {
    expect(app).toContain('activeNavigation === "environments"');
    expect(app).toContain("<CustomerInformationPage");
    expect(app).toContain("permissions={auth.permissions}");
    expect(customerPage).toContain("<EnvironmentPage");
    expect(customerPage).toContain("organization={organization}");
    expect(customerPage).toContain("embedded />");
    expect(source).toContain('permissions.includes("environments.write")');
    expect(source).toContain('"environments.credentials.read"');
    expect(source).toContain('"environments.credentials.write"');
    expect(source).not.toContain("<Title level={1}>{title}</Title>");
    expect(source).not.toMatch(/\btitle:\s*"(環境|环境|Environments)"/);
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
    expect(source).toContain("{environmentWritable && (");
    expect(source).toContain("function EndpointCredentialPanel");
    expect(source).toContain("saveEnvironmentEndpointCredential");
    expect(source).not.toContain("credentialModalOpen");
    expect(source).toContain("enabled: environmentWritable && catalogReadable");
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
    expect(source).toContain("findModuleScopedVersionsWithoutSelection");
    expect(source).toContain('environmentError.code === "PRODUCT_MODULE_REQUIRED"');
    expect(source).toContain("errors: [text.moduleRequired]");
  });

  it("uses a collapsible group bar and a two-panel workspace", () => {
    expect(source).toContain('className="environment-toolbar"');
    expect(source).toContain('className="environment-filter-tabs"');
    expect(source).toContain('className={`environment-filter-chip');
    expect(source).toContain("aria-pressed={active}");
    expect(source).toContain("{text.addEnvironment}");
    expect(source).not.toContain('className="environment-workspace-hero"');
    expect(source).not.toContain('className="environment-metrics"');
    expect(source).toContain('className="environment-group-switcher"');
    expect(source).toContain('className="environment-group-tabs"');
    expect(source).toContain("aria-expanded={groupTabsExpanded}");
    expect(source).not.toContain('className="environment-group-panel"');
    expect(source).toContain('className="environment-list-panel"');
    expect(source).toContain('className="environment-detail-panel"');
    expect(styles).toContain("#fd6c26");
    expect(styles).toContain("#00c4cc");
    expect(styles).toMatch(
      /\.environment-workspace\s*\{[\s\S]*?grid-template-columns:\s*minmax\(320px, 0\.72fr\) minmax\(480px, 1\.28fr\)/,
    );
    expect(styles).toMatch(
      /\.environment-toolbar > \.ant-btn-primary\s*\{[\s\S]*?margin-left:\s*auto[\s\S]*?border-radius:\s*100px/,
    );
  });

  it("keeps server connections and removes the duplicated VPN tab", () => {
    expect(source).toContain('key: "connections"');
    expect(source).not.toContain('key: "vpn"');
    expect(source).toContain('key: "evidence"');
    expect(source).toContain('key: "history"');
    expect(source).toContain("<FuturePanel");
  });

  it("shows endpoint credentials inline only with read permission", () => {
    expect(source).toContain("{credentialReadable && (");
    expect(source).toContain("<EndpointCredentialPanel");
    expect(source).toContain("enabled: endpoint.credentialConfigured");
    expect(source).toContain(
      'queryKey: ["environment-endpoint-credential"]',
    );
    expect(source).not.toContain("openCredentialEditor");
    expect(styles).toContain(".environment-inline-credential");
  });
});
