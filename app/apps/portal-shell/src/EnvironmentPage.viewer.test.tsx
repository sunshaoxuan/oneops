import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { EnvironmentInventory, Organization } from "@one-ops/api-client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentPage } from "./EnvironmentPage";

const api = vi.hoisted(() => ({
  fetchEnvironmentInventory: vi.fn(),
  fetchProducts: vi.fn(),
}));

vi.mock("@one-ops/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@one-ops/api-client")>()),
  fetchEnvironmentInventory: api.fetchEnvironmentInventory,
  fetchProducts: api.fetchProducts,
}));

const organization: Organization = {
  id: "6",
  classificationId: "1",
  classificationCode: "CUSTOMER",
  classificationName: "顧客",
  code: "ONEHR",
  name: "OneHR株式会社",
  shortName: "OneHR",
  maintenanceStatus: "〇",
  remarks: "",
};

function renderViewerPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EnvironmentPage
        locale="ja-JP"
        organization={organization}
        title="環境情報"
        permissions={["environments.read"]}
      />
    </QueryClientProvider>,
  );
}

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

beforeEach(() => {
  api.fetchEnvironmentInventory.mockReset();
  api.fetchProducts.mockReset();
});

describe("閲覧者の環境情報画面", () => {
  it("空の環境台帳を白画面にせず表示する", async () => {
    api.fetchEnvironmentInventory.mockResolvedValue({
      organizationId: "6",
      groups: [],
      environments: [],
      summary: {
        total: 0,
        production: 0,
        verification: 0,
        internal: 0,
        retired: 0,
      },
    } satisfies EnvironmentInventory);

    renderViewerPage();

    expect(await screen.findByText("表示できる環境がありません")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "環境情報" })).toBeNull();
    expect(screen.getByRole("button", { name: "有効環境0" })).toBeTruthy();
    expect(screen.queryByText("OneHR株式会社")).toBeNull();
    expect(api.fetchProducts).not.toHaveBeenCalled();
  });

  it("配列項目が欠けた応答でも閲覧画面を維持する", async () => {
    api.fetchEnvironmentInventory.mockResolvedValue({
      organizationId: "6",
      groups: [],
      environments: [
        {
          id: "10",
          organizationId: "6",
          groupId: "1",
          groupName: "基本環境",
          name: "閲覧検証環境",
          scope: "CUSTOMER",
          purpose: "PRODUCTION",
          status: "ACTIVE",
          url: "",
          ownerName: "",
          notes: "",
          sortOrder: 1,
          revision: 1,
          lastVerifiedAt: "",
          archivedAt: null,
        },
      ],
      summary: {
        total: 1,
        production: 1,
        verification: 0,
        internal: 0,
        retired: 0,
      },
    } as unknown as EnvironmentInventory);

    renderViewerPage();

    expect(await screen.findByText("閲覧検証環境")).toBeTruthy();
    expect(screen.getByText("1 環境")).toBeTruthy();
  });

  it("環境API失敗時に再読込可能なエラーを表示する", async () => {
    api.fetchEnvironmentInventory.mockRejectedValue(
      new Error("inventory failed"),
    );

    renderViewerPage();

    await waitFor(() =>
      expect(
        screen.getByText(
          "環境情報を読み込めませんでした。再読込してください。",
        ),
      ).toBeTruthy(),
    );
    expect(
      screen.getByRole("button", { name: "reload 再読込" }),
    ).toBeTruthy();
  });
});
