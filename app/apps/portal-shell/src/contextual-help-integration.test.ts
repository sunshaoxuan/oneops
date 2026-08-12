import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("画面別ヘルプ入口", () => {
  it("現在画面の文書だけを新しいタブで開く", () => {
    expect(app).toContain("contextualHelpPath(activeNavigation)");
    expect(app).toContain('target="_blank"');
    expect(app).toContain('rel="noreferrer"');
    expect(app).toContain("contextualHelpLabel(locale)");
    expect(app).toContain("<QuestionCircleOutlined />");
  });
});
