import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAuthConfig } from "@one-ops/api-client";
import {
  AuthPage,
  WINDOWS_SSO_AUTO_ATTEMPTED_KEY,
  windowsSsoDestination,
} from "./AuthPage";

vi.mock("@one-ops/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@one-ops/api-client")>()),
  fetchAuthConfig: vi.fn(),
  loginLocalAccount: vi.fn(),
}));

const mockedFetchAuthConfig = vi.mocked(fetchAuthConfig);

function renderAuthPage(onAuthenticated = vi.fn().mockResolvedValue(undefined)) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthPage onAuthenticated={onAuthenticated} />
    </QueryClientProvider>,
  );
  return onAuthenticated;
}

describe("Windows SSO の直接 Navigation", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    window.sessionStorage.clear();
    mockedFetchAuthConfig.mockResolvedValue({
      windowsSsoEnabled: true,
      windowsSsoAutoLogin: true,
      windowsSsoUrl: "http://domain-proxy.example/oneops_sso.jsp",
      bootstrapRequired: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("EnvPortal SSO の直接遷移先を構成する", () => {
    expect(windowsSsoDestination("http://domain-proxy.example/oneops_sso.jsp")).toBe(
      "http://domain-proxy.example/oneops_sso.jsp?returnTo=%2F",
    );
  });

  it("自動試行済みなら LOCAL Login と手動 SSO 操作を維持する", async () => {
    window.sessionStorage.setItem(WINDOWS_SSO_AUTO_ATTEMPTED_KEY, "1");
    renderAuthPage();

    expect(await screen.findByText("ユーザー名またはメール")).toBeTruthy();
    expect(screen.getByText("パスワード")).toBeTruthy();
    expect(screen.getByRole("button", {
      name: /Windows にログイン中のアカウントで認証/,
    })).toBeTruthy();
  });
});
