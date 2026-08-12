import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  resolve(process.cwd(), "src/AiAssistantChat.tsx"),
  "utf8",
);

describe("AI assistant waiting guidance", () => {
  it("Task の作成時刻と長時間待機案内を待機 Loader へ渡す", () => {
    expect(component).toContain(
      "startedAt={taskStartedAt[task.id] ?? task.created_at}",
    );
    expect(component).toContain("longWaitLabel={text.longWait}");
  });

  it("長時間待機時の判断材料を三言語で提供する", () => {
    expect(component).toContain("このまま待つか、停止してからもう一度送信できます");
    expect(component).toContain("继续等待，或停止生成后重新发送");
    expect(component).toContain("keep waiting, or stop generation and send it again");
  });
});
