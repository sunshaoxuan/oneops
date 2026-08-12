import { describe, expect, it } from "vitest";
import { contextualHelpLabel, contextualHelpPath } from "./contextual-help";

describe("画面別ヘルプ", () => {
  it.each([
    ["consulting", "/help/inquiry-support.html"],
    ["aiAssistant", "/help/ai-assistant.html"],
    ["builder", "/help/product-builder.html"],
    ["masterData", "/help/basic-master.html"],
  ] as const)("%s に対応する文書を返す", (navigation, expected) => {
    expect(contextualHelpPath(navigation)).toBe(expected);
  });

  it("対象外の画面ではリンクを返さない", () => {
    expect(contextualHelpPath("workbench")).toBeUndefined();
  });

  it("アクセシブル名称を画面言語へ合わせる", () => {
    expect(contextualHelpLabel("ja-JP")).toBe("この画面のヘルプを開く");
    expect(contextualHelpLabel("zh-CN")).toBe("打开当前画面的帮助");
    expect(contextualHelpLabel("en-US")).toBe("Open help for this page");
  });
});
