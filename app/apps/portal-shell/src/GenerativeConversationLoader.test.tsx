import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
        startedAt="2026-08-12T00:00:00Z"
        longWaitLabel="通常より時間がかかっています"
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
    expect(screen.getByText(/s$/)).toHaveAttribute("aria-hidden", "true");
  });

  it("Task 作成時刻から経過秒数を更新し、30 秒後に操作案内を表示する", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T00:00:29Z"));
    const { unmount } = render(
      <GenerativeConversationLoader
        phase="RUNNING"
        receivedText=""
        statusLabel="処理を開始しています"
        startedAt="2026-08-12T00:00:00Z"
        longWaitLabel="このまま待つか、停止してからもう一度送信できます。"
      />,
    );

    expect(screen.getByText("29s")).toBeInTheDocument();
    expect(screen.queryByText(/このまま待つか/)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("data-long-wait", "false");

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(screen.getByText(/このまま待つか/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("data-long-wait", "true");
    unmount();
    vi.useRealTimers();
  });

  it("実行開始後も同じ小型アニメーションで状態文言を表示する", () => {
    render(
      <GenerativeConversationLoader
        phase="RUNNING"
        receivedText=""
        statusLabel="回答を生成中"
        startedAt="2026-08-12T00:00:00Z"
        longWaitLabel="通常より時間がかかっています"
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
        startedAt="2026-08-12T00:00:00Z"
        longWaitLabel="通常より時間がかかっています"
      />,
    );

    rerender(
      <GenerativeConversationLoader
        phase="STREAMING"
        receivedText="調査しました"
        statusLabel="回答を生成中"
        startedAt="2026-08-12T00:00:00Z"
        longWaitLabel="通常より時間がかかっています"
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
        startedAt="2026-08-12T00:00:00Z"
        longWaitLabel="通常より時間がかかっています"
        className="custom-loader"
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("data-paused", "true");
    expect(screen.getByRole("status")).toHaveClass("custom-loader");
  });
});
