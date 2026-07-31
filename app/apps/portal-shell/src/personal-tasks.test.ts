import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(
  resolve(process.cwd(), "src/PersonalTasksPage.tsx"),
  "utf8",
);
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const navigation = readFileSync(
  resolve(process.cwd(), "src/portal-navigation.ts"),
  "utf8",
);
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const api = readFileSync(
  resolve(process.cwd(), "../../packages/api-client/src/index.ts"),
  "utf8",
);

describe("個人タスク", () => {
  it("ワークベンチ直後の独立ナビゲーションと URL を使用する", () => {
    const workbenchIndex = app.indexOf('key: "workbench"');
    const personalTaskIndex = app.indexOf('key: "personalTasks"');
    const environmentsIndex = app.indexOf('key: "environments"');
    expect(personalTaskIndex).toBeGreaterThan(workbenchIndex);
    expect(personalTaskIndex).toBeLessThan(environmentsIndex);
    expect(navigation).toContain('personalTasks: "/tasks"');
    expect(navigation).toContain('aiAssistant: "/ai-assistant"');
    expect(app).toContain(
      'if (item.key === "personalTasks") return can("personal.tasks.use");',
    );
  });

  it("期限、長期、候補と完了を独立表示する", () => {
    for (const key of [
      'key: "today"',
      'key: "upcoming"',
      'key: "long"',
      'key: "candidates"',
      'key: "completed"',
    ]) {
      expect(page).toContain(key);
    }
    expect(page).toContain('task.taskType === "LONG_TERM"');
    expect(page).toContain("adoptTaskCandidate");
    expect(page).toContain("dismissTaskCandidate");
  });

  it("説明と AI Prompt を分離して保存する", () => {
    expect(page).toContain('name="description"');
    expect(page).toContain('name="automationPrompt"');
    expect(page).toContain('name="promptScheduleEnabled"');
    expect(page).toContain("executePersonalTaskPrompt");
  });

  it("個人外部接続の保存、同期、表示とコピーを提供する", () => {
    expect(page).toContain("saveTaskExternalAccount");
    expect(page).toContain("syncTaskExternalAccount");
    expect(page).toContain("revealTaskExternalCredential");
    expect(page).toContain("navigator.clipboard.writeText");
    expect(page).toContain('{ value: "BACKLOG"');
    expect(page).toContain('{ value: "INQUIRY"');
    expect(page).toContain('<Input autoComplete="off" />');
    expect(page).toContain(
      '<Input.Password autoComplete="new-password" />',
    );
  });

  it("共有 API 型と物理 ID ベースの操作を公開する", () => {
    expect(api).toContain("export interface PersonalTask");
    expect(api).toContain("export interface TaskCandidate");
    expect(api).toContain("export interface TaskExternalAccount");
    expect(api).toContain("export interface TaskSyncRun");
    expect(api).toContain("export interface TaskPromptRun");
    expect(api).toContain(
      "/api/work-center/v1/personal-task-connections",
    );
  });

  it("共通余白とレスポンシブ表示を定義する", () => {
    expect(styles).toContain(".personal-tasks-page");
    expect(styles).toContain(".personal-tasks-hero");
    expect(styles).toContain(".personal-task-summary");
    expect(styles).toContain("@media (max-width: 560px)");
  });
});
