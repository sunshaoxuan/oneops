import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { UserStatusSelect } from "./IdentityManagementPage";
import "./styles.css";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function StatusSelectFixture() {
  const [value, setValue] = useState<"PENDING" | "ACTIVE" | "SUSPENDED">(
    "ACTIVE",
  );
  return (
    <UserStatusSelect
      value={value}
      onChange={setValue}
      labels={{ PENDING: "待审核", ACTIVE: "有效", SUSPENDED: "停用" }}
    />
  );
}

describe("利用者状態 Select", () => {
  it("展開及び値変更後も選択済み表示名を明瞭に表示する", async () => {
    render(<StatusSelectFixture />);
    const combobox = screen.getByRole("combobox");
    const selectedLabel = (label: string) =>
      screen.getByText(label, { selector: ".ant-select-content" });

    expect(selectedLabel("有效")).toBeVisible();

    fireEvent.mouseDown(combobox);
    expect(selectedLabel("有效")).toBeVisible();
    const suspendedOption = (
      await screen.findByText("停用", {
        selector: ".ant-select-item-option-content",
      })
    ).closest(".ant-select-item-option");
    expect(suspendedOption).not.toBeNull();
    fireEvent.mouseDown(suspendedOption!);
    fireEvent.click(suspendedOption!);

    await waitFor(() => expect(selectedLabel("停用")).toBeVisible());
    expect(getComputedStyle(selectedLabel("停用")).opacity).toBe("1");
    expect(getComputedStyle(selectedLabel("停用")).visibility).toBe("visible");
  });
});
