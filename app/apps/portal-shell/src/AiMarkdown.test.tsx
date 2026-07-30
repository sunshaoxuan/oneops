import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiMarkdown } from "./AiMarkdown";

const markdownStyles = readFileSync(
  resolve(process.cwd(), "src/ai-markdown.css"),
  "utf8",
);

describe("AiMarkdown", () => {
  it("renders GitHub Flavored Markdown structures", () => {
    render(
      <AiMarkdown>{[
        "## 調査結果",
        "",
        "| 項目 | 判定 |",
        "| --- | --- |",
        "| 回答 | 充足 |",
        "",
        "- [x] 確認済み",
        "- **重要事項**",
        "",
        "`E0048640`",
      ].join("\n")}</AiMarkdown>,
    );

    expect(
      screen.getByRole("heading", { name: "調査結果" }),
    ).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "項目" })).toBeTruthy();
    expect(screen.getByText("充足")).toBeTruthy();
    expect(
      (screen.getByRole("checkbox") as HTMLInputElement).disabled,
    ).toBe(true);
    expect(screen.getByText("重要事項").tagName).toBe("STRONG");
    expect(screen.getByText("E0048640").tagName).toBe("CODE");
  });

  it("blocks raw HTML and protects external navigation", () => {
    const { container } = render(
      <AiMarkdown>{[
        "[公式資料](https://example.com/guide)",
        "",
        '<img src="https://example.com/tracker.png" alt="tracker">',
        "",
        '<script>alert("x")</script>',
      ].join("\n")}</AiMarkdown>,
    );

    const link = screen.getByRole("link", { name: "公式資料" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).not.toContain('alert("x")');
  });

  it("keeps tables inside the message width and wraps cell content", () => {
    expect(markdownStyles).toMatch(
      /\.ai-markdown table\s*\{[\s\S]*?table-layout:\s*fixed/,
    );
    expect(markdownStyles).toMatch(
      /\.ai-markdown th,\s*\.ai-markdown td\s*\{[\s\S]*?overflow-wrap:\s*anywhere/,
    );
    expect(markdownStyles).not.toContain("min-width: max-content");
  });
});
