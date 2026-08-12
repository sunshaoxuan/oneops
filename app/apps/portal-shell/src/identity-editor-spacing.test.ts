import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/IdentityManagementPage.tsx"),
  "utf8",
);
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

describe("ユーザー編集画面の縦方向間隔", () => {
  it("Windows SSO操作区と次のロール項目の間に標準間隔を確保する", () => {
    expect(source).toMatch(
      /className="identity-editor-section windows-identity-editor"[\s\S]*?<Text strong>\{text\.role\}<\/Text>/,
    );
    expect(styles).toMatch(
      /\.windows-identity-editor\s*\{\s*margin-bottom:\s*var\(--oneops-space-xl,\s*24px\);\s*\}/,
    );
  });
});
