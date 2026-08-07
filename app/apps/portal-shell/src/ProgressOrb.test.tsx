import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("thinking-orbs", () => ({
  MODE_DRAWS: {
    orbits: vi.fn(),
  },
  resolvePreset: () => ({ mode: "orbits", speed: 1, opts: {} }),
  ThinkingOrb: ({
    "aria-label": ariaLabel,
    size,
    state,
    ...props
  }: {
    "aria-label": string;
    size: number;
    state: string;
    className?: string;
  }) => (
    <canvas
      {...props}
      aria-label={ariaLabel}
      data-orb-size={size}
      data-orb-state={state}
      role="img"
    />
  ),
}));

import { ProgressOrb } from "./ProgressOrb";

describe("進行表示オーブ", () => {
  it("状態、サイズ、アクセシブルなラベルを共通コンポーネントから渡す", () => {
    render(
      <ProgressOrb
        label="空きディスクの確認"
        size={20}
        state="searching"
      />,
    );

    const orb = screen.getByRole("img", { name: "空きディスクの確認" });
    expect(orb.getAttribute("data-orb-state")).toBe("searching");
    expect(orb.getAttribute("data-orb-size")).toBe("20");
  });

  it("既定状態は作業中である", () => {
    render(<ProgressOrb label="リソース更新" />);

    expect(
      screen.getByRole("img", { name: "リソース更新" }).getAttribute(
        "data-orb-state",
      ),
    ).toBe("working");
  });

  it("明示的な常時 Animation は Library の描画定義を Canvas へ適用する", () => {
    const context = {
      clearRect: vi.fn(),
      setTransform: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    render(
      <ProgressOrb
        label="問合を分析中"
        motion="always"
        size={64}
        state="solving"
        theme="light"
      />,
    );

    const orb = screen.getByRole("img", { name: "問合を分析中" });
    expect(orb.getAttribute("data-progress-orb-motion")).toBe("always");
    expect(orb.tagName).toBe("CANVAS");
  });
});
