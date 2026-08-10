import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("ホーム画面の権限境界", () => {
  it("dashboard のデータ取得と SSE 接続を画面と機能権限へ結び付ける", () => {
    expect(app).toContain('const builderReadable = can("builder.use")');
    expect(app).toMatch(
      /const organizationDirectoryReadable =\s+can\("catalog\.read"\) && can\("organizations\.read"\)/,
    );
    expect(app).toContain('"work-center-dashboard",');
    expect(app).toContain("enabled: dashboardDataReadable");
    expect(app).toContain("navigationUsesDashboardData(activeNavigation)");
    expect(app).toContain("navigationUsesDashboardLive(activeNavigation)");
    expect(app).toContain(
      'activeNavigation === "workbench" && !liveSnapshotFresh',
    );
    expect(app).toContain('activeNavigation === "workbench" && can("personal.tasks.use")');
    expect(app).toContain("void queryClient.cancelQueries({");
    expect(app).toContain("queryKey: currentDashboardQueryKey");
    expect(app).toContain("queryKey: currentPersonalTaskSummaryQueryKey");
    expect(app).toContain("if (!dashboardLiveReadable)");
    expect(app).toContain("{dashboardLiveReadable && (");
  });

  it("機能権限がない状態カードとショートカットを描画しない", () => {
    expect(app).toContain("{canUseBuilder && (");
    expect(app).toContain("{canReadOrganizationDirectory && (");
    expect(app).toContain("{canUseEnvironments && (");
    expect(app).toContain("{canUseInquiries && (");
    expect(app).toContain("canUseBuilder={builderReadable}");
    expect(app).toContain("canReadOrganizationDirectory={organizationDirectoryReadable}");
  });
});
