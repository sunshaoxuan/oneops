import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("ホーム画面の権限境界", () => {
  it("dashboard のデータ取得と SSE 接続を機能権限へ結び付ける", () => {
    expect(app).toContain('const builderReadable = can("builder.use")');
    expect(app).toContain(
      'const organizationDirectoryReadable =\n    can("catalog.read") && can("organizations.read")',
    );
    expect(app).toContain("queryKey: [\"work-center-dashboard\", permissionSignature]");
    expect(app).toContain("enabled: dashboardDataReadable");
    expect(app).toContain("const dashboardLiveReadable = dashboardReadable && builderReadable");
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
