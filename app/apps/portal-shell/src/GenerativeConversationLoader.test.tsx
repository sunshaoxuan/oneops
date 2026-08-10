import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenerativeConversationLoader } from "./GenerativeConversationLoader";

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
    expect(container.querySelector(".il-loader")).toHaveAttribute(
      "data-variant",
      "signal",
    );
    expect(container.querySelector(".il-loader")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
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
