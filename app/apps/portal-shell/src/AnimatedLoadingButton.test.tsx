import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnimatedLoadingButton } from "./AnimatedLoadingButton";

describe("AnimatedLoadingButton", () => {
  it("ローディング中は指定 variant を描画し、二重送信を防止する", () => {
    render(
      <AnimatedLoadingButton loading loaderVariant="braille-flipwave">
        保存
      </AnimatedLoadingButton>,
    );

    const button = screen.getByRole("button", { name: /保\s*存/ });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(
      document.querySelector('[data-loader-variant="braille-flipwave"]'),
    ).not.toBeNull();
  });

  it("通常時は既存のボタン操作を維持する", () => {
    render(<AnimatedLoadingButton>実行</AnimatedLoadingButton>);

    const button = screen.getByRole("button", { name: /実\s*行/ });
    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(document.querySelector("[data-loader-variant]")).toBeNull();
  });
});
