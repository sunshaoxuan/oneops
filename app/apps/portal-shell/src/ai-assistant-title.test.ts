import { describe, expect, it } from "vitest";
import { summarizeAssistantTitle } from "./AiAssistantChat";

describe("AIアシスタント会話テーマ要約", () => {
  it("本文の先頭文字列ではなく翻訳対象と方向を題名にする", () => {
    expect(
      summarizeAssistantTitle(
        "帮我把这段日文对话翻译成中文：こんにちは。今日は元気ですか。",
        null,
        { taskClass: "TRANSLATION", targetLanguage: "zh" },
      ),
    ).toBe("日文对话翻译为中文");
  });

  it("英語メールの翻訳対象を日本語題名にする", () => {
    expect(
      summarizeAssistantTitle(
        "この英語メールを日本語に翻訳してください。本文は後で送ります。",
        null,
        { taskClass: "TRANSLATION", targetLanguage: "ja" },
      ),
    ).toBe("英語メールの日本語翻訳");
  });

  it("長い本文を題名として切り取らない", () => {
    const title = summarizeAssistantTitle(
      "请告诉我这段非常长而且没有明确分类的内容应该如何处理，后面还有大量正文和补充说明。",
    );
    expect(title).toBe("一般咨询");
    expect(title).not.toContain("…");
  });

  it("摘要和分析使用明确的任务主题", () => {
    expect(summarizeAssistantTitle("请总结以下文档：正文", null, {
      taskClass: "SUMMARIZATION",
    })).toBe("文档摘要");
    expect(summarizeAssistantTitle("请分析这个工单的原因", null, {
      taskClass: "COMPLEX_ANALYSIS",
    })).toBe("工单分析");
  });
});
