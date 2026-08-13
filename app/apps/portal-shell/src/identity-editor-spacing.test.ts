import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/IdentityManagementPage.tsx"),
  "utf8",
);
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("ユーザー編集画面の機能別タブ", () => {
  it("基本情報、外部対応、ロールと権限、所属と職務を分割する", () => {
    expect(source).toContain('key: "basic", label: text.basicInformationTab');
    expect(source).toContain('key: "external", label: text.externalProfilesTab');
    expect(source).toContain('key: "roles", label: text.rolesAndPermissionsTab');
    expect(source).toContain('key: "workforce", label: text.workforceTab');
    expect(source).toContain('editorTab === "basic"');
    expect(source).toContain('editorTab === "external"');
    expect(source).toContain('editorTab === "roles"');
    expect(source).toContain('editorTab === "workforce"');
  });

  it("編集対象を固定し、選択中タブの内容だけをスクロールする", () => {
    expect(source.indexOf('className="user-editor-context"')).toBeLessThan(
      source.indexOf('className="user-editor-tabs"'),
    );
    expect(styles).toContain(".user-editor-tab-panel");
    expect(styles).toMatch(
      /\.user-editor-tab-panel\s*\{[\s\S]*?overflow-y:\s*auto;/,
    );
    expect(styles).toMatch(
      /\.user-editor-modal \.ant-modal-body\s*\{[\s\S]*?overflow:\s*hidden;/,
    );
  });
});
