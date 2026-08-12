import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(process.cwd(), "src/AiTokenUsageReportPage.tsx"), "utf8");
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const migration = readFileSync(resolve(process.cwd(), "../../db/migrations/046_create_ai_token_usage_report.sql"), "utf8");

describe("AI Token使用量レポート", () => {
  it("管理者専用権限を入口と画面の両方へ適用する", () => {
    expect(migration).toContain("reports.ai-token-usage.read");
    expect(migration).toContain("role_record.code = 'SYSTEM_ADMIN'");
    expect(app).toContain('can("reports.read") && can("reports.ai-token-usage.read")');
    expect(app).toContain('<AiTokenUsageReportPage locale={locale} />');
  });

  it("合計Token順位と期間選択を表示し横スクロールを表内へ限定する", () => {
    expect(page).toContain('queryKey: ["ai-token-usage-report", period]');
    expect(page).toContain('defaultSortOrder: "descend"');
    expect(page).toContain('scroll={{ x: 1450');
    expect(page).toContain('value={period ?? "all"}');
    expect(styles).toContain(".ai-token-usage-table-card");
    expect(styles).toContain("overflow: hidden;");
  });
});
