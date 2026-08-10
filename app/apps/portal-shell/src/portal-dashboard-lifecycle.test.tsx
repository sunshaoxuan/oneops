import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type {
  AuthSession,
  Organization,
  PersonalTaskSummary,
  WorkCenterSnapshot,
} from "@one-ops/api-client";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  AuthenticatedPortal,
  dashboardFallbackIntervalMs,
  dashboardLiveSnapshotStaleMs,
} from "./App";

const api = vi.hoisted(() => ({
  fetchDashboard: vi.fn(),
  fetchPersonalTaskSummary: vi.fn(),
  subscribeDashboard: vi.fn(),
  closeDashboardSubscription: vi.fn(),
  onSnapshot: undefined as ((snapshot: unknown) => void) | undefined,
  onState: undefined as ((connected: boolean) => void) | undefined,
}));

vi.mock("@one-ops/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@one-ops/api-client")>()),
  fetchDashboard: api.fetchDashboard,
  fetchPersonalTaskSummary: api.fetchPersonalTaskSummary,
  subscribeDashboard: api.subscribeDashboard,
}));

vi.mock("./AiAssistantChat", () => ({
  AiAssistantChat: ({ mode }: { mode: string }) => (
    <div data-testid="assistant-mode">{mode}</div>
  ),
}));

vi.mock("./IdentityManagementPage", () => ({
  IdentityManagementPage: ({ organizations }: { organizations: unknown[] }) => (
    <div data-testid="admin-organization-count">{organizations.length}</div>
  ),
}));

vi.mock("./CustomerKnowledgeSettingsPage", () => ({
  CustomerKnowledgeSettingsPage: ({
    initialOrganizationId,
    organizations,
  }: {
    initialOrganizationId?: string;
    organizations: unknown[];
  }) => (
    <div
      data-testid="customer-knowledge-organization"
      data-organization-count={organizations.length}
    >
      {initialOrganizationId ?? "未選択"}
    </div>
  ),
}));

vi.mock("./ModelDesignPage", () => ({
  ModelDesignPage: () => <div data-testid="model-api-page" />,
}));

vi.mock("./ProgressOrb", () => ({
  ProgressOrb: () => <div data-testid="progress-orb" />,
}));

const snapshot: WorkCenterSnapshot = {
  generatedAt: "2026-08-10T12:00:00.000Z",
  correlationId: "dashboard-lifecycle-test",
  upstream: {
    online: true,
    latencyMs: 12,
    message: "ready",
  },
  summary: {
    total: 0,
    running: 0,
    failed: 0,
    completed: 0,
    organizations: 1,
  },
  resources: {
    cpuCount: 4,
    memoryAvailableBytes: 1_024,
    diskFreeBytes: 2_048,
  },
  tasks: [],
  organizations: [
    {
      id: "organization-1",
      classificationId: "classification-1",
      classificationCode: "CUSTOMER",
      classificationName: "顧客",
      code: "TEST",
      name: "テスト組織",
      shortName: "テスト",
      maintenanceStatus: "〇",
      remarks: "",
      inquiryCustomerCode: "TEST",
      inquiryCustomerName: "テスト組織",
      inquiryLastSyncedAt: null,
    },
  ],
};

const secondOrganization: Organization = {
  id: "organization-2",
  classificationId: "classification-1",
  classificationCode: "CUSTOMER",
  classificationName: "顧客",
  code: "SECOND",
  name: "第二組織",
  shortName: "第二",
  maintenanceStatus: "〇",
  remarks: "",
  inquiryCustomerCode: "SECOND",
  inquiryCustomerName: "第二組織",
  inquiryLastSyncedAt: null,
};

const personalTaskSummary: PersonalTaskSummary = {
  overdue: 0,
  dueToday: 0,
  reviewDue: 0,
  candidates: 0,
};

const user = {
  id: "user-1",
  username: "lifecycle-user",
  displayName: "ライフサイクル利用者",
  email: "lifecycle@example.test",
  locale: "ja-JP" as const,
};

function authSession(permissions: string[]): AuthSession {
  return {
    authenticated: true,
    user,
    permissions,
    impersonation: null,
  };
}

function renderPortal(pathname: string, permissions: string[]) {
  window.history.replaceState({}, "", pathname);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <AuthenticatedPortal
        auth={authSession(permissions)}
        onLogout={vi.fn()}
        onStartImpersonation={vi.fn().mockResolvedValue(undefined)}
        onStopImpersonation={vi.fn().mockResolvedValue(undefined)}
      />
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}

function navigate(pathname: string) {
  act(() => {
    window.history.pushState({}, "", pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
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
  Object.defineProperty(window, "requestAnimationFrame", {
    writable: true,
    value: (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0),
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    writable: true,
    value: (handle: number) => window.clearTimeout(handle),
  });
  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: vi.fn(),
  });
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  api.fetchDashboard.mockReset();
  api.fetchPersonalTaskSummary.mockReset();
  api.subscribeDashboard.mockReset();
  api.closeDashboardSubscription.mockReset();
  api.onSnapshot = undefined;
  api.onState = undefined;
  api.fetchDashboard.mockResolvedValue(snapshot);
  api.fetchPersonalTaskSummary.mockResolvedValue(personalTaskSummary);
  api.subscribeDashboard.mockImplementation(
    (
      onSnapshot: (value: WorkCenterSnapshot) => void,
      onState: (connected: boolean) => void,
    ) => {
      api.onSnapshot = onSnapshot as (value: unknown) => void;
      api.onState = onState;
      return api.closeDashboardSubscription;
    },
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState({}, "", "/");
});

describe("Portal Dashboard ライフサイクル", () => {
  it("AIアシスタントでは停止し、Workbench で再開し、離脱時に要求と SSE を終了する", async () => {
    const permissions = [
      "dashboard.read",
      "builder.use",
      "personal.tasks.use",
      "ai.assistant.use",
    ];
    let dashboardSignal: AbortSignal | undefined;
    let personalTaskSummarySignal: AbortSignal | undefined;
    api.fetchDashboard.mockImplementation((signal?: AbortSignal) => {
      dashboardSignal = signal;
      return new Promise<WorkCenterSnapshot>((_resolve, reject) => {
        signal?.addEventListener(
          "abort",
          () => reject(new DOMException("中断", "AbortError")),
          { once: true },
        );
      });
    });
    api.fetchPersonalTaskSummary.mockImplementation((signal?: AbortSignal) => {
      personalTaskSummarySignal = signal;
      return new Promise<PersonalTaskSummary>((_resolve, reject) => {
        signal?.addEventListener(
          "abort",
          () => reject(new DOMException("中断", "AbortError")),
          { once: true },
        );
      });
    });

    const { queryClient } = renderPortal("/ai-assistant", permissions);
    const cancelQueries = vi.spyOn(queryClient, "cancelQueries");

    expect(await screen.findByTestId("assistant-mode")).toHaveTextContent("page");
    expect(api.fetchDashboard).not.toHaveBeenCalled();
    expect(api.fetchPersonalTaskSummary).not.toHaveBeenCalled();
    expect(api.subscribeDashboard).not.toHaveBeenCalled();

    navigate("/");

    await waitFor(() => {
      expect(api.fetchDashboard).toHaveBeenCalledTimes(1);
      expect(api.fetchPersonalTaskSummary).toHaveBeenCalledTimes(1);
      expect(api.subscribeDashboard).toHaveBeenCalledTimes(1);
    });
    expect(dashboardSignal?.aborted).toBe(false);
    expect(personalTaskSummarySignal?.aborted).toBe(false);

    navigate("/ai-assistant");

    const permissionSignature = [...permissions].sort().join(",");
    await waitFor(() => {
      expect(dashboardSignal?.aborted).toBe(true);
      expect(personalTaskSummarySignal?.aborted).toBe(true);
      expect(api.closeDashboardSubscription).toHaveBeenCalledTimes(1);
    });
    expect(cancelQueries).toHaveBeenCalledWith({
      queryKey: [
        "work-center-dashboard",
        permissionSignature,
        "workbench",
      ],
      exact: true,
    });
    expect(cancelQueries).toHaveBeenCalledWith({
      queryKey: ["personal-task-summary", permissionSignature],
      exact: true,
    });
    expect(api.fetchDashboard).toHaveBeenCalledTimes(1);
    expect(api.fetchPersonalTaskSummary).toHaveBeenCalledTimes(1);
    expect(api.subscribeDashboard).toHaveBeenCalledTimes(1);
  });

  it("有効な Snapshot までは GET を継続し、長時間途絶時に GET を再開する", async () => {
    vi.useFakeTimers();
    renderPortal("/", [
      "dashboard.read",
      "builder.use",
      "personal.tasks.use",
    ]);

    await act(async () => {
      await Promise.resolve();
    });
    expect(api.fetchDashboard).toHaveBeenCalledTimes(1);
    expect(api.subscribeDashboard).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(dashboardFallbackIntervalMs);
    });
    expect(api.fetchDashboard).toHaveBeenCalledTimes(2);

    act(() => {
      api.onSnapshot?.(snapshot);
      api.onState?.(true);
    });
    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(dashboardFallbackIntervalMs);
    });
    expect(api.fetchDashboard).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(
        dashboardLiveSnapshotStaleMs - dashboardFallbackIntervalMs,
      );
      await Promise.resolve();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(dashboardFallbackIntervalMs);
    });
    expect(api.fetchDashboard).toHaveBeenCalledTimes(3);
  });

  it("管理画面では組織を含む Dashboard Data を取得し、SSE は開始しない", async () => {
    renderPortal("/system-management/users", [
      "dashboard.read",
      "organizations.read",
      "identity.users.read",
    ]);

    await waitFor(() => {
      expect(api.fetchDashboard).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("admin-organization-count")).toHaveTextContent(
        "1",
      );
    });
    expect(api.fetchPersonalTaskSummary).not.toHaveBeenCalled();
    expect(api.subscribeDashboard).not.toHaveBeenCalled();
  });

  it("利用者が選択した二番目の組織を AIアシスタントとシステム管理の往復後も保持する", async () => {
    const permissions = [
      "dashboard.read",
      "builder.use",
      "catalog.read",
      "organizations.read",
      "ai.assistant.use",
      "customer.knowledge.manage",
      "models.settings.read",
    ];
    const firstOrganization = snapshot.organizations[0];
    const initialSnapshot: WorkCenterSnapshot = {
      ...snapshot,
      correlationId: "organization-selection-initial",
      generatedAt: "2026-08-10T12:00:00.000Z",
    };
    const selectedSnapshot: WorkCenterSnapshot = {
      ...snapshot,
      correlationId: "organization-selection-live",
      generatedAt: "2026-08-10T12:01:00.000Z",
      summary: { ...snapshot.summary, organizations: 2 },
      organizations: [firstOrganization, secondOrganization],
    };
    const administrationSnapshot: WorkCenterSnapshot = {
      ...initialSnapshot,
      correlationId: "organization-selection-administration",
      generatedAt: "2026-08-10T12:02:00.000Z",
    };
    const refreshedSnapshot: WorkCenterSnapshot = {
      ...selectedSnapshot,
      correlationId: "organization-selection-refreshed",
      generatedAt: "2026-08-10T12:03:00.000Z",
    };
    let resolveWorkbenchRefresh:
      | ((value: WorkCenterSnapshot) => void)
      | undefined;
    api.fetchDashboard
      .mockResolvedValueOnce(initialSnapshot)
      .mockResolvedValueOnce(administrationSnapshot)
      .mockImplementationOnce(
        () =>
          new Promise<WorkCenterSnapshot>((resolve) => {
            resolveWorkbenchRefresh = resolve;
          }),
      );

    renderPortal("/", permissions);

    expect(await screen.findByText("TEST テスト組織")).toBeTruthy();
    act(() => {
      api.onSnapshot?.(selectedSnapshot);
      api.onState?.(true);
    });
    const organizationSelector = screen.getByRole("combobox", {
      name: "組織機関",
    });
    fireEvent.mouseDown(organizationSelector);
    fireEvent.click(await screen.findByTitle("SECOND 第二組織"));
    await waitFor(() => {
      expect(organizationSelector.parentElement).toHaveTextContent(
        "SECOND 第二組織",
      );
    });
    expect(organizationSelector.parentElement).toHaveTextContent(
      "SECOND 第二組織",
    );

    navigate("/ai-assistant");
    expect(await screen.findByTestId("assistant-mode")).toHaveTextContent(
      "page",
    );
    navigate("/system-management/model-api");
    expect(await screen.findByTestId("model-api-page")).toBeTruthy();
    await waitFor(() => {
      expect(api.fetchDashboard).toHaveBeenCalledTimes(2);
    });
    await act(async () => {
      await Promise.resolve();
    });
    navigate("/system-management/customer-knowledge");
    const customerKnowledgeOrganization = await screen.findByTestId(
      "customer-knowledge-organization",
    );
    expect(customerKnowledgeOrganization).toHaveTextContent(
      secondOrganization.id,
    );
    expect(customerKnowledgeOrganization).toHaveAttribute(
      "data-organization-count",
      "2",
    );
    navigate("/");

    await waitFor(() => {
      expect(api.fetchDashboard).toHaveBeenCalledTimes(3);
      expect(
        screen.getByRole("combobox", { name: "組織機関" }).parentElement,
      ).toHaveTextContent("SECOND 第二組織");
    });
    await act(async () => {
      resolveWorkbenchRefresh?.(refreshedSnapshot);
      await Promise.resolve();
    });
    expect(
      screen.getByRole("combobox", { name: "組織機関" }).parentElement,
    ).toHaveTextContent("SECOND 第二組織");
  });
});
