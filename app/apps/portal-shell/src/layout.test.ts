import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

function getRule(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));

  expect(match, `${selector} rule`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("portal workspace layout", () => {
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
    expect(app).toContain("const actionIconCount = 1");
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

  it("separates master data and identity functions in system management", () => {
    expect(app).toContain('activeNavigation === "admin"');
    expect(app).toContain("function SystemManagementPage");
    expect(app).toContain('type: "group"');
    expect(app).toContain('key: "master-data-group"');
    expect(app).toContain('key: "identity-group"');
    expect(app).toContain('  | "organization-classifications"');
    expect(app).toContain('  | "product-versions"');
    expect(app).toContain('  | "users"');
    expect(app).toContain('  | "roles"');
    expect(app).toContain('  | "audit"');
    expect(app).not.toContain('"access-control"');
    expect(app).not.toContain("ユーザーとアクセス権");
    expect(app).toContain("function OrganizationClassificationMaster");
    expect(app).toContain("function ProductVersionMaster");
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

  it("hides organization context on directory and system administration pages", () => {
    expect(app).toContain(
      'activeNavigation === "organizations" ||',
    );
    expect(app).toContain('activeNavigation === "admin"');
    expect(app).toMatch(
      /organizationContextVisible[\s\S]*?<ContextBar/,
    );
  });

  it("searches the organization context by code and name", () => {
    expect(app).toContain(
      "matchesSearchFields(input, option?.value, option?.label)",
    );
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

  it("embeds product building on the OneOps origin with organization context", () => {
    expect(app).toContain('activeNavigation === "builder"');
    expect(app).toContain("<BuilderPage");
    expect(app).toContain("organisation_name: organization?.name");
    expect(app).toContain("src={source}");
    expect(app).not.toContain(
      'window.open("http://192.168.20.54:8091/',
    );
    expect(getRule(".builder-module")).toMatch(
      /height:\s*calc\(100vh\s*-\s*166px\)/,
    );
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
