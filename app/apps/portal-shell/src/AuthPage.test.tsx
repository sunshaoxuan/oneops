import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAuthConfig } from "@one-ops/api-client";
import {
  AuthPage,
  WINDOWS_SSO_AUTO_ATTEMPTED_KEY,
  WINDOWS_SSO_TIMEOUT_MS,
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

describe("Windows SSO の高速ローカル復帰", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
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
    vi.useRealTimers();
  });

  it("認証中もローカルログイン欄を表示し、Sessionを短間隔で確認する", async () => {
    const onAuthenticated = renderAuthPage();

    expect(await screen.findByText("ユーザー名またはメール")).toBeTruthy();
    expect(screen.getByText("Windows にログイン中のアカウントを確認しています。")).toBeTruthy();
    expect(window.sessionStorage.getItem(WINDOWS_SSO_AUTO_ATTEMPTED_KEY)).toBe("1");
    expect(document.querySelector('.auth-sso-silent-frame')).toBeTruthy();

    await act(async () => vi.advanceTimersByTime(300));
    expect(onAuthenticated).toHaveBeenCalled();
  });

  it("5秒で静的認証を終了し、ユーザー名とパスワードへ復帰する", async () => {
    renderAuthPage();

    expect(await screen.findByText("ユーザー名またはメール")).toBeTruthy();
    await act(async () => vi.advanceTimersByTime(WINDOWS_SSO_TIMEOUT_MS));

    await waitFor(() => {
      expect(screen.getByText("Windows アカウントを確認できませんでした。ユーザー名とパスワードでログインしてください。")).toBeTruthy();
    });
    expect(document.querySelector('.auth-sso-silent-frame')).toBeNull();
    expect(screen.getByText("パスワード")).toBeTruthy();
  });

});
