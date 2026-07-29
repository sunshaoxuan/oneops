import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseAiAssistantSse } from "@one-ops/api-client";
import { describe, expect, it } from "vitest";
import {
  assistantInquiryReferences,
  summarizeAssistantTitle,
} from "./AiAssistantChat";
import type { AiAssistantTask } from "@one-ops/api-client";
import type { AiAssistantInquiryContext } from "./ai-assistant-context";

const component = readFileSync(
  resolve(process.cwd(), "src/AiAssistantChat.tsx"),
  "utf8",
);
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const styles = readFileSync(
  resolve(process.cwd(), "src/ai-assistant.css"),
  "utf8",
);
const apiClient = readFileSync(
  resolve(process.cwd(), "../../packages/api-client/src/index.ts"),
  "utf8",
);

describe("AI assistant CAG conversation integration", () => {
  it("parses CAG conversation sequence and incremental message data", () => {
    const events = parseAiAssistantSse(
      [
        "id: 18",
        "event: agent.message.delta",
        `data: ${JSON.stringify({
          event_id: "event-18",
          task_id: "task-1",
          sequence: 7,
          conversation_sequence: 18,
          type: "agent.message.delta",
          timestamp: "2026-07-29T00:00:00Z",
          data: { item_id: "item-1", turn_id: "turn-1", delta: "回答" },
        })}`,
        "",
        "",
      ].join("\n"),
    );

    expect(events).toHaveLength(1);
    expect(events[0].conversationSequence).toBe(18);
    expect(events[0].taskId).toBe("task-1");
    expect(events[0].data.delta).toBe("回答");
  });

  it("keeps one CAG conversation ID as the selected session ID", () => {
    expect(component).toContain("setSelectedId(session.id)");
    expect(component).toContain("fetchAiAssistantSession(selectedId)");
    expect(component).toContain("selectedId,");
    expect(component).not.toContain("assistantSessionId");
  });

  it("keeps the composer available while CAG tasks run", () => {
    expect(component).not.toContain("const busy =");
    expect(component).not.toContain("disabled={busy}");
    expect(component).toContain(
      "if (!prompt || !selectedId || sendMutation.isPending) return;",
    );
    expect(component).toContain(
      "disabled={!input.trim() || sendMutation.isPending}",
    );
    expect(component).toContain(
      "setInput((current) => current || variables.prompt)",
    );
  });

  it("uses the same public OneOps session service for HTTP and SSE", () => {
    expect(apiClient).toContain(
      'const base = "/api/work-center/v1/ai-assistant/sessions"',
    );
    expect(apiClient).toContain(
      "`${aiAssistantSessionPath(sessionId)}/messages`",
    );
    expect(apiClient).toContain(
      "`${aiAssistantSessionPath(sessionId)}/events?${query}`",
    );
    expect(apiClient).toContain("new EventSource(");
  });

  it("shows a localized foreground chat only with assistant permission", () => {
    expect(app).toContain('can("ai.assistant.use")');
    expect(app).toContain("<AiAssistantChat");
    expect(component).toContain('className="ai-assistant-launcher"');
    expect(component).toContain("ai-assistant-window");
    expect(styles).toMatch(/\.ai-assistant-window[\s\S]*?z-index:\s*1600/);
    expect(styles).toContain("@media (max-width: 600px)");
  });

  it("uses one assistant instance as a full page on the AI navigation node", () => {
    expect(app).toContain(
      'mode={activeNavigation === "tasks" ? "page" : "floating"}',
    );
    expect(app).toContain('onMaximize={() => navigateTo("tasks")}');
    expect(app).toContain(
      'if (item.key === "tasks") return can("ai.assistant.use");',
    );
    expect(component).toContain('const visible = mode === "page" || open');
    expect(component).toContain("!pageMode && !open");
    expect(component).toContain("(pageMode || showHistory)");
    expect(styles).toMatch(
      /\.ai-assistant-page[\s\S]*?position:\s*relative/,
    );
    expect(styles).toMatch(
      /\.ai-assistant-history-page[\s\S]*?width:\s*292px/,
    );
  });

  it("places deletion on each history item and removes it from the composer", () => {
    expect(component).toContain("`ai-assistant-session-item${");
    expect(component).toContain("deleteMutation.mutate(session.id)");
    expect(component).not.toContain("<InboxOutlined");
  });

  it("summarizes the first request with the open inquiry number", () => {
    expect(
      summarizeAssistantTitle("原因を調査してください。回答案も確認します", {
        ticketNo: "38950",
        ticketTitle: "雇用継続給付について",
        status: "OPEN",
        category: ["U-PDS"],
        questionKey: "q-1",
        questionSequence: 1,
        questionLabel: "お客様からの質問",
        questionCreatedAt: "2026-07-29T00:00:00Z",
        questionBody: "質問",
        attachmentNames: [],
        messages: [],
      }),
    ).toBe("38950 原因を調査してください");
  });

  it("shows the open inquiry context and sends it with the message", () => {
    expect(component).toContain('className="ai-assistant-contexts"');
    expect(component).toContain("reference.questionSequence");
    expect(component).toContain("context: inquiryContext ?? null");
    expect(app).toContain(
      "onAssistantContextChange={setAiAssistantInquiryContext}",
    );
  });

  it("keeps used inquiry references grey and appends the active question", () => {
    const first: AiAssistantInquiryContext = {
      ticketNo: "38950",
      ticketTitle: "雇用継続給付について",
      status: "OPEN",
      category: ["U-PDS"],
      questionKey: "q-1",
      questionSequence: 1,
      questionLabel: "お客様からの質問",
      questionCreatedAt: "2026-07-29T00:00:00Z",
      questionBody: "最初の質問",
      attachmentNames: [],
      messages: [],
    };
    const second: AiAssistantInquiryContext = {
      ...first,
      ticketNo: "94056",
      ticketTitle: "住民税受給者番号について",
      questionKey: "q-2",
      questionSequence: 2,
      questionBody: "追加質問",
    };
    const tasks = [
      { inquiryContext: first } as AiAssistantTask,
    ];

    expect(assistantInquiryReferences(tasks, null)).toEqual([
      { ...first, active: false, used: true },
    ]);
    expect(assistantInquiryReferences(tasks, second)).toEqual([
      { ...first, active: false, used: true },
      { ...second, active: true, used: false },
    ]);
    expect(assistantInquiryReferences([], first)).toEqual([
      { ...first, active: true, used: false },
    ]);
    expect(assistantInquiryReferences([], null)).toEqual([]);
  });
});
