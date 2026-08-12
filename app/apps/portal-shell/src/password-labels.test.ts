import { describe, expect, it } from "vitest";
import { messages } from "./i18n";

describe("パスワード変更の利用者向け表示名", () => {
  it("認証方式の技術名を表示しない", () => {
    expect(messages["ja-JP"].profilePasswordChange).toBe("パスワード変更");
    expect(messages["zh-CN"].profilePasswordChange).toBe("修改密码");
    expect(messages["en-US"].profilePasswordChange).toBe("Change password");

    for (const locale of ["ja-JP", "zh-CN", "en-US"] as const) {
      expect(messages[locale].profilePasswordChange).not.toContain("LOCAL");
      expect(messages[locale].profilePasswordDescription).not.toContain("LOCAL");
      expect(messages[locale].profilePasswordChanged).not.toContain("LOCAL");
      expect(messages[locale].profilePasswordChangeFailed).not.toContain("LOCAL");
    }
  });
});
