import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const assistantStyles = readFileSync(
  resolve(process.cwd(), "src/ai-assistant.css"),
  "utf8",
);
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

function getRule(selector: string, source = styles): string {
  const escapedSelector = selector
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));

  expect(match, `${selector} rule`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("AI アシスタントページのスクロール境界", () => {
  it("AI アシスタント選択時だけ外側 Layout を画面高へ固定する", () => {
    expect(app).toMatch(
      /activeNavigation\s*===\s*"aiAssistant"\s*\?\s*"portal-main-ai-assistant"\s*:\s*""/,
    );

    const rule = getRule(".portal-main-ai-assistant");
    expect(rule).toMatch(/height:\s*100dvh/);
    expect(rule).toMatch(/min-height:\s*0/);
    expect(rule).toMatch(/overflow:\s*hidden/);
  });

  it("共通ページ高を再利用せず会話領域だけを内部スクロールにする", () => {
    const contentRule = getRule(".portal-content-ai-assistant");
    const conversationRule = getRule(
      ".ai-assistant-conversation",
      assistantStyles,
    );

    expect(contentRule).toMatch(/height:\s*auto/);
    expect(contentRule).toMatch(/flex:\s*1\s+1\s+0/);
    expect(contentRule).toMatch(/overflow:\s*hidden/);
    expect(conversationRule).toMatch(/overflow-y:\s*auto/);
  });
});
