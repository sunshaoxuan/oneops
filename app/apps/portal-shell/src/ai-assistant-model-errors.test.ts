import { describe, expect, it } from "vitest";
import { aiAssistantSendErrorMessage } from "./AiAssistantChat";

describe("AIアシスタント Model Error 表示", () => {
  it("一時 Error と設定 Error を入力保持付きの案内へ分類する", () => {
    expect(
      aiAssistantSendErrorMessage("zh-CN", {
        code: "AI_ASSISTANT_MODEL_RATE_LIMITED",
      }),
    ).toBe("AI 暂时无法使用，输入内容已保留。");
    expect(
      aiAssistantSendErrorMessage("ja-JP", {
        code: "AI_ASSISTANT_MODEL_AUTH_FAILED",
      }),
    ).toBe("AI 接続設定を確認する必要があります。入力内容を保持しました。");
  });
});
