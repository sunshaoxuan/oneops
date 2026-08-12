import { describe, expect, it } from "vitest";
import { messages } from "./i18n";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const identityPage = readFileSync(
  resolve(process.cwd(), "src/IdentityManagementPage.tsx"),
  "utf8",
);

describe("ホームナビゲーション表示名", () => {
  it("各言語で HOME 系の利用者向け名称を表示する", () => {
    expect(messages["ja-JP"].workbench).toBe("ホーム");
    expect(messages["zh-CN"].workbench).toBe("首页");
    expect(messages["en-US"].workbench).toBe("HOME");
  });

  it("ロール権限画面も同じ機能名称を表示する", () => {
    expect(identityPage).toContain('"dashboard.read": "ホーム参照"');
    expect(identityPage).toContain('"dashboard.read": "查看首页"');
    expect(identityPage).toContain('dashboard: "ホーム"');
    expect(identityPage).toContain('dashboard: "首页"');
    expect(identityPage).toContain('dashboard: "HOME"');
  });
});
