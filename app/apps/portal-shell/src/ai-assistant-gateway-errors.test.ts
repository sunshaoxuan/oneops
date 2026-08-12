import { describe, expect, it } from "vitest";
import { aiAssistantSendErrorMessage } from "./AiAssistantChat";

describe("AI assistant model error presentation", () => {
  it("keeps a localized actionable message for temporary and configuration failures", () => {
    expect(
      aiAssistantSendErrorMessage("zh-CN", {
        code: "AI_ASSISTANT_MODEL_TIMEOUT",
      }),
    ).toBe("AI 暂时无法使用，输入内容已保留。");
    expect(
      aiAssistantSendErrorMessage("ja-JP", {
        code: "AI_ASSISTANT_CONFIGURATION_REQUIRED",
      }),
    ).toBe("AI 接続設定を確認する必要があります。入力内容を保持しました。");
  });
});
