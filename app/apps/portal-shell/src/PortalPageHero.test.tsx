import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortalPageHero, PortalPageHeroProvider } from "./PortalPageHero";

function renderHero(compact: boolean) {
  return render(
    <PortalPageHeroProvider compact={compact} locale="zh-CN">
      <PortalPageHero
        icon={<span>图标</span>}
        eyebrow="UPDS"
        title="问询支援"
        description="查询工单"
        actions={<button type="button">新建</button>}
      />
    </PortalPageHeroProvider>,
  );
}

describe("PortalPageHero", () => {
  it("通常表示では大見出し、説明及び操作を表示する", () => {
    renderHero(false);

    expect(screen.getByRole("heading", { name: "问询支援" })).toBeTruthy();
    expect(screen.getByText("查询工单")).toBeTruthy();
    expect(screen.getByRole("button", { name: "新建" })).toBeTruthy();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("省スペース表示では面包屑だけを見出し位置へ表示する", () => {
    renderHero(true);

    const breadcrumb = screen.getByRole("navigation", { name: "问询支援" });
    expect(breadcrumb.textContent).toContain("首页");
    expect(breadcrumb.textContent).toContain("问询支援");
    expect(screen.getByText("问询支援").getAttribute("aria-current")).toBe("page");
    expect(screen.queryByText("查询工单")).toBeNull();
    expect(screen.getByRole("button", { name: "新建" })).toBeTruthy();
  });
});
