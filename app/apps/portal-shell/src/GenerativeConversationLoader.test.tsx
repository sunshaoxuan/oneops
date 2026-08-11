import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import { GenerativeConversationLoader } from "./GenerativeConversationLoader";

const styles = readFileSync(
  resolve(process.cwd(), "src/generative-conversation-loader.css"),
  "utf8",
);

describe("GenerativeConversationLoader", () => {
  it("会話応答前は装飾用インラインローダーと状態文言を表示する", () => {
    const { container } = render(
      <GenerativeConversationLoader
        phase="QUEUED"
        receivedText=""
        statusLabel="AI の応答待ち"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("AI の応答待ち");
    expect(screen.getByRole("status")).toHaveAttribute("data-phase", "queued");
    const indicator = container.querySelector(".il-loader");
    expect(indicator).toHaveAttribute("data-variant", "orbit");
    expect(indicator).toHaveAttribute("data-speed", "1.1");
    expect(indicator).toHaveStyle({
      "--il-color": "#ff6b2c",
      "--il-size": "1.55em",
    });
    expect(indicator).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelectorAll(
      ".generative-conversation-loader-meter i",
    )).toHaveLength(5);
    expect(screen.getByText("0s")).toHaveAttribute("aria-hidden", "true");
  });

  it("実時間を更新して処理継続を明示する", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-11T00:00:00Z"));
    const { container, unmount } = render(
      <GenerativeConversationLoader
        phase="QUEUED"
        receivedText=""
        statusLabel="AI の応答待ち"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(2250);
    });

    expect(screen.getByText("2s")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute(
      "data-elapsed-seconds",
      "2",
    );
    unmount();
    vi.useRealTimers();
  });

  it("実行開始後は重力ローダーで待機段階と区別する", () => {
    const { container } = render(
      <GenerativeConversationLoader
        phase="RUNNING"
        receivedText=""
        statusLabel="回答を生成中"
      />,
    );

    expect(container.querySelector(".il-loader")).toHaveAttribute(
      "data-variant",
      "gravity",
    );
  });

  it("Reduced Motion でも分段明暗変化で処理中を明示する", () => {
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.generative-conversation-loader-meter i\s*\{[\s\S]*animation-duration:\s*1\.8s/,
    );
    expect(styles).toMatch(
      /@keyframes generative-conversation-loader-meter[\s\S]*opacity:\s*0\.24[\s\S]*opacity:\s*1/,
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
