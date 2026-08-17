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

  it("ホーム概要へ予定件数を表示し、各カードから対応タブを開く", () => {
    expect(app).toContain('["予定", personalTaskSummary.scheduled, "upcoming"]');
    expect(app).toContain('["计划", personalTaskSummary.scheduled, "upcoming"]');
    expect(app).toContain('["Upcoming", personalTaskSummary.scheduled, "upcoming"]');
    expect(app).toContain('`/tasks?view=${view}`');
    expect(styles).toMatch(
      /\.workbench-personal-task-summary\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5,/,
    );
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

  it("通知の URL から候補タブの具体的な作業ノードを開く", () => {
    expect(page).toContain('new URLSearchParams(window.location.search).get("view")');
    expect(page).toContain('new URLSearchParams(window.location.search).get("candidateId")');
    expect(page).toContain('taskViews.has(view) ? view : "today"');
    expect(page).toContain('window.addEventListener("popstate", applyRequestedView)');
    expect(page).toContain("openedCandidateRequestRef");
    expect(page).toContain("openCandidate(candidate)");
    expect(app).toContain("notification.actionPath");
  });

  it("通知の内部参照を画面へ表示せず、ベルと件数を一体表示する", () => {
    expect(api).not.toContain("sourceSystemId: string | null");
    expect(api).not.toContain("sourceObjectId: string | null");
    expect(app).not.toContain('t("notificationSource")');
    expect(app).not.toContain('t("notificationKeyId")');
    expect(app).not.toContain('className="notification-reference"');
    expect(app).toContain('className="notification-button"');
    expect(app).toContain("offset={[-5, 5]}");
    expect(styles).toContain(".notification-button.ant-btn");
    expect(styles).toContain("background: #fff0e9");
    expect(styles).toContain("background: #fd6c26 !important");
  });

  it("通知タイトルと行を選択可能として明示する", () => {
    expect(app).toContain('className="notification-list-item"');
    expect(app).toContain('role="button"');
    expect(app).toContain("tabIndex={0}");
    expect(app).toContain("aria-label={notification.title}");
    expect(app).toContain('event.key === "Enter"');
    expect(app).toContain('event.key === " "');
    expect(styles).toMatch(
      /\.notification-list-item\s*\{[\s\S]*?cursor:\s*pointer;/,
    );
    expect(styles).toContain("padding: 14px 16px");
    expect(styles).toContain("margin-bottom: 8px");
    expect(styles).toContain(".notification-list-item:hover");
    expect(styles).toContain(".notification-list-item:hover .ant-list-item-meta-title");
    expect(styles).toContain(".notification-list-item:focus-visible");
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
