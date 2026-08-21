import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/AiAssistantChat.tsx"), "utf8");
const style = readFileSync(join(process.cwd(), "src/ai-assistant.css"), "utf8");

describe("AI アシスタント失敗質問の再送信", () => {
  it("末尾かつ回答本文のない失敗 Task だけに再質問操作を表示する", () => {
    expect(source).toContain("const canResubmit = failed &&");
    expect(source).toContain("!answer &&");
    expect(source).toContain("taskIndex === tasks.length - 1");
    expect(source).toContain("{canResubmit && (");
  });

  it("保存済み質問、問合せ参照、添付を新しい Task へ再送信する", () => {
    expect(source).toContain("replaceTaskWithPrompt(task, task.prompt)");
    expect(source).toContain("prompt: replacementPrompt");
    expect(source).toContain("context: task.inquiryContext ?? null");
    expect(source).toContain("attachments: task.attachments ?? []");
    expect(source).toContain("isFirstTask: false");
  });

  it("三言語の小型文字 Button と無効状態を持つ", () => {
    expect(source).toContain('resubmit: "AI に再質問"');
    expect(source).toContain('resubmit: "重新向 AI 提问"');
    expect(source).toContain('resubmit: "Ask AI again"');
    expect(source).toContain("disabled={submissionBlocked}");
    expect(style).toContain(".ai-assistant-resubmit");
    expect(style).toContain("font-size: 12px");
  });
});
