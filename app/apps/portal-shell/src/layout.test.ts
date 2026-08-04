import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const portalNavigation = readFileSync(
  resolve(process.cwd(), "src/portal-navigation.ts"),
  "utf8",
);

function getRule(selector: string): string {
  const escapedSelector = selector
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));

  expect(match, `${selector} rule`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("portal workspace layout", () => {
  it("shows the synchronized project version", () => {
    expect(app).toContain("OneOps v0.9.1");
    expect(app).toContain("openInquiryFromAssistant");
    expect(app).toContain("onOpenInquiry={openInquiryFromAssistant}");
    expect(app).toContain("openRequest={inquirySupportOpenRequest}");
  });

  it("uses the full width available beside the navigation", () => {
    const contentRule = getRule(".portal-content");

    expect(contentRule).toMatch(/width:\s*100%/);
    expect(contentRule).toMatch(/max-width:\s*none/);
    expect(contentRule).toMatch(/margin:\s*0/);
    expect(contentRule).not.toMatch(/margin:\s*0\s+auto/);
  });

  it("keeps the brand subtitle on one line", () => {
    expect(getRule(".brand small")).toMatch(/white-space:\s*nowrap/);
    expect(getRule(".brand img")).toMatch(/flex:\s*0\s+0\s+auto/);
    expect(getRule(".brand > div")).toMatch(/min-width:\s*0/);
  });

  it("keeps the compact icon action column fixed on the right", () => {
    expect(app).toContain("icon={<EditOutlined />}");
    expect(app).toContain("const actionIconCount = canWrite ? 1 : 0");
    expect(app).toContain(
      "actionIconCount * organizationActionIconWidth",
    );
    expect(app).toMatch(
      /key:\s*"actions"[\s\S]*?width:\s*actionColumnWidth/,
    );
    expect(app).toMatch(/key:\s*"actions"[\s\S]*?fixed:\s*"right"/);
    expect(app).not.toContain("{t(\"editOrganization\")}\n        </Button>");
  });

  it("supports persisted manual column resizing", () => {
    expect(app).toContain("function ResizableHeaderCell");
    expect(app).toContain("className=\"column-resize-handle\"");
    expect(app).toContain(
      "components={{ header: { cell: ResizableHeaderCell } }}",
    );
    expect(app).toContain("organizationColumnStorageKey");
    expect(getRule(".column-resize-handle")).toMatch(/cursor:\s*col-resize/);
  });

  it("sorts master and organization columns and controls page size", () => {
    expect(app.match(/sorter:\s*\(left, right\)/g)).toHaveLength(10);
    expect(app).toContain('sortDirections={["ascend", "descend"]}');
    expect(app).toContain("showSizeChanger: true");
    expect(app).toContain(
      "const organizationPageSizeOptions = [20, 50, 100]",
    );
    expect(app).toContain("organizationPageSizeOptions.map(String)");
    expect(app).toContain("organizationPageSizeStorageKey");
    expect(app).toContain("organizationSortStorageKey");
    expect(app).toContain('columnKey: "code"');
    expect(app).toContain('order: "ascend"');
    expect(app).toContain("sortOrder: sortOrderFor");
    expect(app).toContain("setSortState");
  });

  it("references the classification archive by physical ID", () => {
    expect(app).toContain('queryKey: ["organization-classifications"]');
    expect(app).toContain('name="classificationId"');
    expect(app).toContain('dataIndex: "classificationName"');
    expect(app).not.toContain('name="classification"\n');
  });

  it("does not show a database status in the organization card title", () => {
    const organizationCard = app.match(
      /className="organization-directory-card"[\s\S]*?<\/Card>/,
    )?.[0];

    expect(organizationCard).toBeDefined();
    expect(organizationCard).not.toContain(
      '<Tag color="success">{t("live")}</Tag>',
    );
  });

  it("places master data management beside system management", () => {
    const navigationSource = app.match(
      /const navigation: NavigationItem\[\] = \[[\s\S]*?\n\];/,
    )?.[0];

    expect(navigationSource).toBeDefined();
    expect(navigationSource!.indexOf('key: "masterData"')).toBeGreaterThan(
      navigationSource!.indexOf('key: "reports"'),
    );
    expect(navigationSource!.indexOf('key: "masterData"')).toBeLessThan(
      navigationSource!.indexOf('key: "admin"'),
    );
    expect(app).toContain('key: "masterData"');
    expect(app).toContain(
      'return can("catalog.read");',
    );
    expect(app).not.toContain(
      'return can("organizations.read") || can("catalog.write");',
    );
    expect(app).toContain('activeNavigation === "admin"');
    expect(app).toContain('activeNavigation === "masterData"');
    expect(app).toContain(
      "(item) => item.key === portalRoute.navigation",
    );
    expect(app).toContain("function MasterDataManagementPage");
    expect(app).toContain("function SystemManagementPage");
    expect(app).not.toContain('key: "master-data-group"');
    expect(app).toContain('key: "identity-group"');
    expect(app).toContain('key: "model-settings-group"');
    expect(portalNavigation).toContain('  | "organizations"');
    expect(portalNavigation).toContain('  | "model-api"');
    expect(portalNavigation).toContain('  | "agent-gateways"');
    expect(app).toContain("<ModelDesignPage");
    expect(app).toContain('key: "model-api"');
    expect(app).toContain('key: "agent-gateways"');
    expect(app).toContain('label: t("modelApiSettings")');
    expect(app).toContain('label: t("agentGatewaySettings")');
    expect(app).toContain('mode="horizontal"');
    expect(app).toContain('className="management-navigation"');
    expect(app).toContain('aria-label={t("basicMasterManagement")}');
    expect(app).toContain('aria-label={t("systemManagement")}');
    expect(app).not.toContain(
      '<aside className="management-navigation">',
    );
    expect(app).not.toContain('type: "group"');
    expect(getRule(".management-layout")).not.toMatch(
      /grid-template-columns/,
    );
    expect(getRule(".management-navigation")).toMatch(
      /border-bottom:\s*1px\s+solid/,
    );
    expect(portalNavigation).toContain('  | "organization-classifications"');
    expect(portalNavigation).toContain('  | "product-versions"');
    expect(portalNavigation).toContain('  | "users"');
    expect(portalNavigation).toContain('  | "workforce"');
    expect(portalNavigation).toContain('  | "inquiry-search-templates"');
    expect(portalNavigation).toContain('  | "roles"');
    expect(portalNavigation).toContain('  | "audit"');
    expect(app).not.toContain('"access-control"');
    expect(app).not.toContain("ユーザーとアクセス権");
    expect(app).toContain("function OrganizationClassificationMaster");
    expect(app).toContain("function ProductVersionMaster");
    expect(app).toContain("canWrite={organizationWritable}");
    expect(app).toContain("canWrite={catalogWritable}");
    expect(app).toContain('const catalogReadable = can("catalog.read");');
    expect(app).toContain('if (catalogReadable) {');
    expect(app).toContain("createOrganizationClassification");
    expect(app).toContain("updateOrganizationClassification");
    expect(app).toContain("createProductVersion");
    expect(app).toContain("updateProduct(");
    expect(app).toContain("updateProductVersion(");
    expect(app).toContain("updateProductVersionModule(");
    expect(app).toContain('aria-label={t("editProduct")}');
    expect(app).toContain('aria-label={t("editVersion")}');
    expect(app).toContain('aria-label={t("editModule")}');
    expect(app).toContain('rowKey="id"');
  });

  it("承認済みの第1階層ナビゲーション順序を使用する", () => {
    const navigationSource = app.match(
      /const navigation: NavigationItem\[\] = \[[\s\S]*?\n\];/,
    )?.[0];

    expect(navigationSource).toBeDefined();
    expect(
      [...navigationSource!.matchAll(/key:\s*"([^"]+)"/g)].map(
        (match) => match[1],
      ),
    ).toEqual([
      "workbench",
      "personalTasks",
      "environments",
      "consulting",
      "builder",
      "aiAssistant",
      "knowledge",
      "codeInsight",
      "reports",
      "masterData",
      "admin",
    ]);
    expect(navigationSource).not.toContain('key: "tools"');
    expect(app).not.toContain('t("tools")');
  });

  it("lets model settings fill the management workspace", () => {
    expect(getRule(".model-design-page")).toMatch(/width:\s*100%/);
    expect(getRule(".model-design-page")).toMatch(/min-width:\s*0/);
    expect(getRule(".model-design-page")).not.toMatch(/max-width/);
    expect(getRule(".model-settings-form")).toMatch(/display:\s*grid/);
    expect(getRule(".model-settings-form")).toMatch(/width:\s*100%/);
    expect(getRule(".management-card-footer")).toMatch(
      /align-items:\s*center/,
    );
    expect(getRule(".management-card-footer")).toMatch(
      /border-top:\s*1px\s+solid/,
    );
    expect(getRule(".management-card-actions")).toMatch(
      /justify-content:\s*flex-end/,
    );
    expect(getRule(".management-card-actions")).toMatch(
      /margin-left:\s*auto/,
    );
  });

  it("limits shell padding reset to the outer management card", () => {
    expect(getRule(".management-shell > .ant-card-body")).toMatch(
      /padding:\s*0/,
    );
    expect(styles).not.toMatch(
      /\.management-shell\s+\.ant-card-body\s*\{/,
    );
    expect(
      getRule(".management-content .ant-card > .ant-card-body"),
    ).toMatch(/padding:\s*var\(--oneops-card-content-padding\)/);
  });

  it("hides organization context on master data and system administration pages", () => {
    expect(app).toContain(
      'activeNavigation === "masterData" ||',
    );
    expect(app).toContain('activeNavigation === "admin"');
    expect(app).toMatch(
      /organizationContextVisible[\s\S]*?<ContextBar/,
    );
  });

  it("searches the organization context by code name and short name", () => {
    expect(app).toContain(
      "option?.shortName",
    );
    expect(app).toContain("shortName: value.shortName");
  });

  it("uses larger borderless text for business codes", () => {
    expect(app.match(/className="business-code"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(app).not.toContain("<Text code>");
    expect(getRule(".business-code")).toMatch(/font-size:\s*16px/);
    expect(getRule(".business-code")).not.toMatch(/border|background/);
  });

  it("restricts maintenance status to circle cross or empty", () => {
    expect(app).toMatch(
      /name="maintenanceStatus"[\s\S]*?<Select[\s\S]*?allowClear/,
    );
    expect(app).toContain('{ value: "〇", label: "〇" }');
    expect(app).toContain('{ value: "✕", label: "✕" }');
  });

  it("keeps exception details in organization remarks", () => {
    expect(app).toContain('key: "remarks"');
    expect(app).toContain('dataIndex: "remarks"');
    expect(app).toContain('name="remarks"');
    expect(app).toContain("<Input.TextArea");
    expect(app).toContain("maxLength={1000}");
  });

  it("resets document and content scroll on main navigation changes", () => {
    expect(app).toContain("window.scrollTo({ top: 0, left: 0");
    expect(app).toContain("document.scrollingElement");
    expect(app).toContain('document.querySelector(".portal-main")');
    expect(app).toContain('document.querySelector(".portal-content")');
    expect(app).toContain("}, [activeNavigation]);");
    expect(app).toContain(
      'className="module-page placeholder-module-page"',
    );
    expect(getRule(".placeholder-module-page .module-hero")).toMatch(
      /min-height:\s*176px/,
    );
  });

  it("URL から画面を復元しブラウザー履歴を処理する", () => {
    expect(app).toContain(
      "portalRouteFromPathname(window.location.pathname)",
    );
    expect(app).toContain(
      'window.addEventListener("popstate", restorePortalRoute)',
    );
    expect(app).toContain(
      'window.removeEventListener("popstate", restorePortalRoute)',
    );
    expect(app).toContain(
      'window.history[replace ? "replaceState" : "pushState"]',
    );
    expect(portalNavigation).toContain(
      'consulting: "/inquiry-support"',
    );
    expect(portalNavigation).toContain(
      'admin: "/system-management"',
    );
    expect(portalNavigation).toContain(
      'audit: "audit-logs"',
    );
  });

  it("embeds product building on the OneOps origin with organization context", () => {
    expect(app).toContain('activeNavigation === "builder"');
    expect(app).toContain("<BuilderPage");
    expect(app).toContain("organisation_name: organization?.name");
    expect(app).toContain('embedded: "oneops"');
    expect(app).toContain('"portal-content-builder"');
    expect(app).toContain("src={source}");
    expect(app).not.toContain(
      'window.open("http://192.168.20.54:8091/',
    );
    expect(getRule(".builder-module")).toMatch(/flex:\s*1\s+1\s+auto/);
    expect(getRule(".builder-module")).toMatch(/min-height:\s*0/);
    expect(getRule(".portal-content-builder")).toMatch(
      /height:\s*calc\(100dvh\s*-\s*70px\)/,
    );
    expect(getRule(".portal-content-builder")).toMatch(/overflow:\s*hidden/);
    expect(getRule(".builder-frame")).toMatch(/border:\s*0/);
  });

  it("allows the organization card and table to shrink with the viewport", () => {
    expect(getRule(".organization-directory-card")).toMatch(/min-width:\s*0/);
    expect(
      getRule(
        ".organization-directory-card .ant-card-body,\n.organization-directory-card .ant-table-wrapper",
      ),
    ).toMatch(/min-width:\s*0/);
  });
});
