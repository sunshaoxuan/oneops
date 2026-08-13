import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pages = readFileSync(
  resolve(process.cwd(), "src/WorkforcePolicyPages.tsx"),
  "utf8",
);
const identity = readFileSync(
  resolve(process.cwd(), "src/IdentityManagementPage.tsx"),
  "utf8",
);
const inquiry = readFileSync(
  resolve(process.cwd(), "src/InquirySupportPage.tsx"),
  "utf8",
);
const routes = readFileSync(
  resolve(process.cwd(), "src/portal-navigation.ts"),
  "utf8",
);

describe("internal workforce and inquiry search policy", () => {
  it("provides separate system management routes and editors", () => {
    expect(routes).toContain('workforce: "workforce"');
    expect(routes).toContain('"inquiry-search-templates": "inquiry-search-templates"');
    expect(pages).toContain("WorkforceManagementPage");
    expect(pages).toContain("InquirySearchTemplateManagementPage");
    expect(pages).toContain("assigneeSourceValue");
    expect(pages).toContain("targetType: \"SYSTEM\"");
  });

  it("物理 ID で更新する部門と職責の Code を編集可能にする", () => {
    expect(pages).toContain('<Form.Item name="code" label={text.code} rules={[{ required: true, pattern: /^[A-Z][A-Z0-9_]{1,63}$/ }]}><Input /></Form.Item>');
    expect(pages).toContain('<Form.Item name="code" label={text.code} rules={[{ required: true, pattern: /^[A-Z][A-Z0-9_]{2,63}$/ }]}><Input /></Form.Item>');
    expect(pages).not.toContain('<Input disabled={Boolean(departmentEditor)} />');
    expect(pages).not.toContain('<Input disabled={Boolean(responsibilityEditor)} />');
  });

  it("edits user memberships and department-scoped responsibilities", () => {
    expect(identity).toContain("departmentMemberships");
    expect(identity).toContain("responsibilityAssignments");
    expect(identity).toContain("primaryDepartment");
    expect(identity).toContain("fetchInternalWorkforce");
  });

  it("restores active state before resolving and validating the default", () => {
    expect(inquiry).toContain("sessionStorage.getItem(storageKey)");
    expect(inquiry).toContain("fetchEffectiveInquirySearchPolicy");
    expect(inquiry).toContain("option.value === sourceValue");
    expect(inquiry).toContain("templateAssigneeInvalid");
    expect(inquiry).toContain("restoreDefault");
  });
});
