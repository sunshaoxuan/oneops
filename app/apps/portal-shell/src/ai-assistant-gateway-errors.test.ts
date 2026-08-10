import { describe, expect, it } from "vitest";
import { aiAssistantSendErrorMessage } from "./AiAssistantChat";

describe("AI assistant gateway error presentation", () => {
  it("keeps a localized actionable message for temporary and contract failures", () => {
    expect(
      aiAssistantSendErrorMessage("zh-CN", {
        code: "AGENT_GATEWAY_CIRCUIT_OPEN",
      }),
    ).toBe("AI 暂时无法使用，输入内容已保留。");
    expect(
      aiAssistantSendErrorMessage("ja-JP", {
        code: "AGENT_GATEWAY_CONTRACT_INVALID",
      }),
    ).toBe("AI 接続設定を確認する必要があります。入力内容を保持しました。");
  });
});
