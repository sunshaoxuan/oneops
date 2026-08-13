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
    expect(navigation).toContain('personalTasks: "personal.tasks.use"');
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

  it("未完了タスク数を今日、予定、長期、候補のタブへ 0 件以外だけ表示する", () => {
    expect(page).toContain("function TabLabel");
    expect(page).toContain("count > 0");
    expect(page).toContain("taskTabCounts.today");
    expect(page).toContain("taskTabCounts.upcoming");
    expect(page).toContain("taskTabCounts.long");
    expect(page).toContain("summaryQuery.data?.candidates ?? 0");
  });

  it("長期タスクの確認項目を任意入力として表示する", () => {
    expect(page).toContain('name="nextReviewAt"');
    expect(page).toContain("longTermPromptHelp");
    expect(page).toContain('taskType !== "LONG_TERM"');
    expect(page).not.toContain('name="reviewCycle"');
    expect(page).not.toContain(
      'name="nextReviewAt"\n                  label={text.nextReviewAt}\n                  rules={[{ required: true }]}',
    );
    expect(page).not.toContain("Invalid Date");
  });

  it("説明と AI Prompt を分離して保存する", () => {
    expect(page).toContain('name="description"');
    expect(page).toContain('name="automationPrompt"');
    expect(page).toContain('name="promptScheduleEnabled"');
    expect(page).toContain("executePersonalTaskPrompt");
    expect(page).toContain(
      'promptStarted: "AIアシスタントへ分析を依頼しました"',
    );
  });

  it("個人外部接続の操作入口を提供しない", () => {
    expect(page).not.toContain('icon={<ApiOutlined />}');
    expect(page).not.toContain("personal-task-connections");
  });

  it("候補は集中同期されたユーザー所有データを 60 秒ごとに取得する", () => {
    expect(page).toContain("fetchTaskCandidates");
    expect(page).toContain("refetchInterval: 60_000");
    expect(api).toContain("/api/work-center/v1/personal-task-candidates");
  });

  it("通知の URL から候補タブを開く", () => {
    expect(page).toContain('new URLSearchParams(window.location.search).get("view")');
    expect(page).toContain('taskViews.has(view) ? view : "today"');
    expect(page).toContain('window.addEventListener("popstate", applyRequestedView)');
    expect(app).toContain("notification.actionPath");
  });

  it("個人画面に外部接続操作を表示しない", () => {
    expect(page).not.toContain('icon={<ApiOutlined />}');
    expect(page).not.toContain("personal-task-connections");
  });

  it("共有 API 型と物理 ID ベースの操作を公開する", () => {
    expect(api).toContain("export interface PersonalTask");
    expect(api).toContain("export interface TaskCandidate");
    expect(api).toContain("export interface TaskPromptRun");
    expect(api).toContain("fetchUserNotifications");
  });

  it("共通余白とレスポンシブ表示を定義する", () => {
    expect(styles).toContain(".personal-tasks-page");
    expect(styles).toContain(".personal-tasks-hero");
    expect(styles).toContain(".personal-task-summary");
    expect(styles).toContain("@media (max-width: 560px)");
    expect(page).toContain("<Drawer");
    expect(page).toContain("<Space wrap>");
  });
});
