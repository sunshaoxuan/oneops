import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assistantInquiryReferences } from "./AiAssistantChat";
import type { AiAssistantTask } from "@one-ops/api-client";
import type { AiAssistantInquiryContext } from "./ai-assistant-context";

const component = readFileSync(
  resolve(process.cwd(), "src/AiAssistantChat.tsx"),
  "utf8",
).replace(/\r\n/g, "\n");
const app = readFileSync(
  resolve(process.cwd(), "src/App.tsx"),
  "utf8",
).replace(/\r\n/g, "\n");

function inquiryContext(questionKey: string, questionSequence: number) {
  return {
    ticketNo: "93103",
    ticketTitle: "令和8年給与実態調査について",
    status: "OPEN",
    category: ["U-PDS"],
    questionKey,
    questionSequence,
    questionLabel: "追加質問",
    questionCreatedAt: "2026-08-12T00:00:00Z",
    questionBody: "質問",
    attachmentNames: [],
    messages: [],
  } satisfies AiAssistantInquiryContext;
}

describe("問合支援クイックチャットの利用者・票単位分離", () => {
  it("Client CacheとComponent Lifecycleを利用者物理IDで隔離する", () => {
    expect(component).toContain('["ai-assistant-session", userId, selectedId]');
    expect(component).toContain("const storagePrefix = `oneops.ai-assistant.${userId}`");
    expect(app).toContain("key={auth.user!.id}");
  });

  it("同一利用者の同一票最終会話を選択し未存在時だけ作成する", () => {
    expect(component).toContain("session.inquiryTicketNo === ticketNo");
    expect(component).toContain("createMutation.mutate({ inquiryTicketNo: ticketNo })");
    expect(component).toContain("if (selectedId || sessions.length) return");
  });

  it("同一票の複数質問を一つの関連表示へ統合する", () => {
    const first = inquiryContext("q-1", 1);
    const second = inquiryContext("q-2", 2);
    expect(assistantInquiryReferences([
      { inquiryContext: first } as AiAssistantTask,
    ], second)).toEqual([
      { ...first, active: true, used: true },
    ]);
    expect(component).not.toContain("No. ${reference.ticketNo} · Q${reference.questionSequence}");
  });
});
