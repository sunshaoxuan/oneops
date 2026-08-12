import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assistantProcessStepStates,
  formatAssistantElapsed,
  visibleAssistantTasks,
} from "./AiAssistantChat";

const component = readFileSync(
  resolve(process.cwd(), "src/AiAssistantChat.tsx"),
  "utf8",
);
const styles = readFileSync(
  resolve(process.cwd(), "src/ai-assistant.css"),
  "utf8",
);

describe("AIアシスタントの会話インタラクション", () => {
  it("実際の処理段階だけを完了、実行中、待機へ対応させる", () => {
    expect(assistantProcessStepStates("QUEUED")).toEqual([
      "active",
      "pending",
      "pending",
    ]);
    expect(assistantProcessStepStates("RUNNING")).toEqual([
      "complete",
      "active",
      "pending",
    ]);
    expect(assistantProcessStepStates("STREAMING")).toEqual([
      "complete",
      "complete",
      "active",
    ]);
    expect(assistantProcessStepStates("COMPLETED")).toEqual([
      "complete",
      "complete",
      "complete",
    ]);
  });

  it("Task の実時刻から経過秒数を表示する", () => {
    expect(formatAssistantElapsed(
      "2026-08-11T03:00:00.000Z",
      "2026-08-11T03:00:07.900Z",
    )).toBe("7s");
    expect(formatAssistantElapsed("invalid", null, 0)).toBe("");
    expect(formatAssistantElapsed(
      "2026-08-11T03:00:00.000Z",
      null,
      Date.parse("2026-08-11T03:00:01.900Z"),
    )).toBe("1s");
  });

  it("再生成を連続しても最新の可視タスクだけを残す", () => {
    const tasks = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ] as never[];
    expect(visibleAssistantTasks(tasks, { a: "b", b: "c" }).map((task) => task.id))
      .toEqual(["c"]);
    expect(visibleAssistantTasks(
      [...tasks, { id: "d" }] as never[],
      { a: "d" },
    ).map((task) => task.id)).toEqual(["d"]);
  });

  it("回答受信前も処理トレースを表示して計時を開始する", () => {
    expect(component).toContain(
      '{showProcessTrace &&',
    );
    expect(component).not.toContain(
      "(Boolean(answer) || processPhase === \"COMPLETED\")",
    );
    expect(component).toContain("clientStartedAt = new Date().toISOString()");
    expect(component).toContain(
      "taskStartedAt[task.id] ?? task.created_at",
    );
    expect(component).toContain("taskFinishedAt[task.id] ?? task.completed_at");
    expect(component).toContain('"COMPLEX_ANALYSIS"');
    expect(component).toContain("visibleAssistantTasks(rawTasks");
    expect(component).toContain("variables.replacesTaskId");
    expect(component).toContain("ReloadOutlined");
    expect(component).not.toContain("icon={<LoadingOutlined />} aria-label={labels.refreshAnswer}");
  });

  it("回答操作と最新会話への復帰を提供する", () => {
    expect(component).toContain("<AssistantProcessTrace");
    expect(component).toContain("wasActiveRef.current");
    expect(component).toContain("navigator.clipboard.writeText(answer)");
    expect(component).toContain("followLatestRef.current = nearLatest");
    expect(component).toContain("container.scrollTo({");
    expect(component).toContain("text.latestConversation");
    expect(component).toContain("text.composerHint");
  });

  it("既存の明色デザインと Reduced Motion を維持する", () => {
    expect(styles).toContain(".ai-assistant-process-summary");
    expect(styles).toContain(".ai-assistant-answer-actions");
    expect(styles).toContain(".ai-assistant-scroll-latest.ant-btn");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("background: rgb(255 255 255 / 96%)");
    expect(styles).toContain(
      ".ai-assistant-attachment-hint > .ai-assistant-composer-hint",
    );
  });
});
