import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenerativeConversationLoader } from "./GenerativeConversationLoader";

const styles = readFileSync(
  resolve(process.cwd(), "src/generative-conversation-loader.css"),
  "utf8",
);

describe("GenerativeConversationLoader", () => {
  it("会話応答前は三点の小型アニメーションと状態文言だけを表示する", () => {
    const { container } = render(
      <GenerativeConversationLoader
        phase="QUEUED"
        receivedText=""
        statusLabel="AI の応答待ち"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("AI の応答待ち");
    expect(screen.getByRole("status")).toHaveAttribute("data-phase", "queued");
    expect(container.querySelector(
      ".generative-conversation-loader-activity",
    )).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(
      ".generative-conversation-loader-activity i",
    )).toHaveLength(3);
    expect(container.querySelector(".il-loader")).not.toBeInTheDocument();
    expect(container.querySelector("small")).not.toBeInTheDocument();
  });

  it("実行開始後も同じ小型アニメーションで状態文言を表示する", () => {
    render(
      <GenerativeConversationLoader
        phase="RUNNING"
        receivedText=""
        statusLabel="回答を生成中"
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("data-phase", "running");
    expect(screen.getByRole("status")).toHaveTextContent("回答を生成中");
  });

  it("Reduced Motion でも三点の明暗変化を継続する", () => {
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.generative-conversation-loader-activity i\s*\{[\s\S]*animation-duration:\s*1\.8s/,
    );
    expect(styles).toMatch(
      /@keyframes generative-conversation-loader-dot[\s\S]*opacity:\s*0\.22[\s\S]*opacity:\s*1/,
    );
    expect(styles).toContain("transform: none !important;");
  });

  it("受信済み全文をストリーミングテキストローダーへ渡す", () => {
    const { container, rerender } = render(
      <GenerativeConversationLoader
        phase="STREAMING"
        receivedText="調査"
        statusLabel="回答を生成中"
      />,
    );

    rerender(
      <GenerativeConversationLoader
        phase="STREAMING"
        receivedText="調査しました"
        statusLabel="回答を生成中"
      />,
    );

    const loader = screen.getByRole("status");
    expect(loader).toHaveAttribute("data-variant", "cascade");
    expect(loader).toHaveAttribute("data-received-length", "6");
    expect(loader).toHaveAttribute("aria-label", "調査しました");
    expect(container.querySelector(".tl-copy")).toHaveTextContent(
      "調査しました",
    );
    expect(styles).toMatch(
      /\.generative-conversation-loader-text\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%[^}]*overflow-x:\s*clip/,
    );
    expect(styles).toMatch(
      /\.generative-conversation-loader-text \.tl-copy\s*\{[^}]*overflow-wrap:\s*anywhere[^}]*word-break:\s*break-word/,
    );
  });

  it("非ストリーミング状態の受信済み文を静止表示する", () => {
    render(
      <GenerativeConversationLoader
        phase="RUNNING"
        receivedText="受信済み"
        statusLabel="準備中"
        className="custom-loader"
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("data-paused", "true");
    expect(screen.getByRole("status")).toHaveClass("custom-loader");
  });
});
