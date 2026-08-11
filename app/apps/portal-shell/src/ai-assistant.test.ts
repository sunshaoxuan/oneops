import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeAiAssistantEvent } from "@one-ops/api-client";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  assistantDisplayText,
  assistantInquiryReferences,
  assistantNavigationMarkClass,
  assistantNavigationPreview,
  filesFromTransfer,
  isImageAttachment,
  LARGE_PASTE_THRESHOLD_BYTES,
  largePastedTextFile,
  optimisticallyRemoveAiAssistantSession,
  summarizeAssistantTitle,
  transferContainsFiles,
  uniqueAttachmentFiles,
} from "./AiAssistantChat";
import type {
  AiAssistantSession,
  AiAssistantTask,
  InquiryTicketDetail,
} from "@one-ops/api-client";
import {
  buildAiAssistantInquiryContext,
  type AiAssistantInquiryContext,
} from "./ai-assistant-context";

const component = readFileSync(
  resolve(process.cwd(), "src/AiAssistantChat.tsx"),
  "utf8",
);
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const portalNavigation = readFileSync(
  resolve(process.cwd(), "src/portal-navigation.ts"),
  "utf8",
);
const i18n = readFileSync(resolve(process.cwd(), "src/i18n.ts"), "utf8");
const styles = readFileSync(
  resolve(process.cwd(), "src/ai-assistant.css"),
  "utf8",
);
const apiClient = readFileSync(
  resolve(process.cwd(), "../../packages/api-client/src/index.ts"),
  "utf8",
);

describe("AI assistant CAG conversation integration", () => {
  it("provides one fixed quick-navigation mark for every user question", () => {
    expect(component).toContain("ai-assistant-quick-navigation");
    expect(component).toContain("data-navigation-id");
    expect(component).not.toContain(
      'data-navigation-id={`${task.id}:assistant`}',
    );
    expect(component).not.toContain('addEventListener("scroll"');
    expect(component).toContain("scrollIntoView({");
    expect(component).toContain('block: "start"');
    expect(component).toContain("activeNavigationId");
    expect(component).toContain("hoveredNavigationId");
    expect(component).toContain("text.quickNavigation");
    expect(component).toContain("item.questionPreview");
    expect(component).toContain("item.answerPreview");
    expect(component).toContain('trigger={["hover", "focus"]}');
    expect(component).toContain("hoveredNavigationIndex");
    expect(component).toContain("assistantNavigationMarkClass(");
    expect(component).toContain("onMouseEnter={() =>");
    expect(component).toContain("onMouseLeave={() =>");
    expect(styles).toContain(".ai-assistant-quick-navigation");
    expect(styles).toContain("position: absolute");
    expect(styles).toContain(".ai-assistant-quick-preview");
    expect(styles).toContain("width: 236px");
    expect(styles).toContain("-webkit-line-clamp: 3");
    expect(styles).toContain("flex: 0 1 8px");
    expect(styles).toContain("min-height: 2px");
    expect(styles).toContain("button.wave-0::before");
    expect(styles).toContain("button.wave-1::before");
    expect(styles).toContain("width 90ms ease-out");
    expect(styles).not.toContain("backdrop-filter: blur(8px)");

    expect(
      assistantNavigationPreview(
        "## 修復結果\n\n已修復並推送。 **次の操作** を確認してください。",
        "fallback",
        18,
      ),
    ).toBe("修復結果 已修復並推送。 次の操作…");
    expect(assistantNavigationPreview("", "回答を待っています")).toBe(
      "回答を待っています",
    );
    expect(assistantNavigationMarkClass(2, -1, false)).toBe("");
    expect(assistantNavigationMarkClass(2, -1, true)).toBe("active");
    expect(assistantNavigationMarkClass(2, 3, false)).toBe("wave-1");
    expect(assistantNavigationMarkClass(2, 4, true)).toBe(
      "wave-2 active",
    );
  });

  it("uses AIアシスタント consistently in the Japanese navigation and chat", () => {
    expect(i18n).toContain('tasks: "AIアシスタント"');
    expect(component).toContain('title: "AIアシスタント"');
    expect(component).toContain('open: "AIアシスタントを開く"');
    expect(component).toContain('maximize: "AIアシスタント画面で開く"');
    expect(i18n).toContain('tasks: "AI 助手"');
    expect(i18n).toContain('tasks: "AI Assistant"');
    expect(component).toContain('title: "AI 助手"');
    expect(component).toContain('title: "AI Assistant"');
    expect(component).not.toContain("AI アシスタント");
    expect(component).not.toContain('title: "AI助手"');
    expect(component).not.toContain("AAIアシスタント");
  });

  it("uses AI wording without exposing the conversation implementation to users", () => {
    expect(component).toContain(
      'start: "新しい話題を作成して、AI との会話を始めます。"',
    );
    expect(component).toContain('queued: "AI の応答待ち"');
    expect(component).not.toContain("CAG");
    expect(i18n).toContain(
      'tasksDescription: "AI とリアルタイムで会話し、話題ごとの履歴を管理します。"',
    );
    expect(i18n).toContain(
      'tasksDescription: "与 AI 实时对话并管理各个话题的历史记录。"',
    );
    expect(i18n).toContain(
      'tasksDescription: "Chat with AI in real time and manage topic history."',
    );
  });

  it("renders assistant responses through the shared Markdown component", () => {
    expect(component).toContain('import { AiMarkdown } from "./AiMarkdown"');
    expect(component).toContain(
      '<AiMarkdown className="ai-assistant-answer">',
    );
    expect(styles).not.toMatch(
      /\.ai-assistant-answer\s*\{[^}]*white-space:\s*pre-wrap/,
    );
  });

  it("offers a direct action for every referenced inquiry", () => {
    expect(component).toContain("FolderOpenOutlined");
    expect(component).toContain("onOpenInquiry(reference)");
    expect(component).toContain('className="ai-assistant-context-open"');
    expect(component).toContain("No. ${reference.ticketNo} · Q${reference.questionSequence}");
  });

  it("replaces internal inquiry field names in saved AI responses", () => {
    expect(
      assistantDisplayText(
        "questionKey を分析し、questionThreads と customerEvaluation を確認する。",
        {
          ticketNo: "94056",
          ticketTitle: "問合せ",
          questionKey: "q-5",
          questionSequence: 5,
          questionLabel: "追加質問",
          questionCreatedAt: "2026-07-30T00:00:00Z",
          questionBody: "質問",
          attachmentNames: [],
          messages: [],
          status: "OPEN",
          assigneeName: null,
          customerName: "顧客",
          category: [],
          urgency: "一般",
          inquiryLevel: null,
          createdAt: "2026-07-30T00:00:00Z",
          updatedAt: "2026-07-30T00:00:00Z",
          requestedReplyAt: null,
          ticketAttachmentNames: [],
          questionThreads: [],
          customerEvaluation: null,
        },
      ),
    ).toBe("Q5 を分析し、問合せ全体 と 顧客評価 を確認する。");
  });

  it("normalizes task SSE sequence and incremental message data", () => {
    const event = normalizeAiAssistantEvent({
      event_id: "event-7",
      task_id: "task-1",
      sequence: 7,
      type: "agent.message.delta",
      timestamp: "2026-07-29T00:00:00Z",
      data: { item_id: "item-1", turn_id: "turn-1", delta: "回答" },
    });

    expect(event?.sequence).toBe(7);
    expect(event?.taskId).toBe("task-1");
    expect(event?.data.delta).toBe("回答");
  });

  it("keeps one CAG conversation ID as the selected session ID", () => {
    expect(component).toContain("setSelectedId(session.id)");
    expect(component).toContain("fetchAiAssistantSession(selectedId, signal)");
    expect(component).toContain("selectedId,");
    expect(component).not.toContain("assistantSessionId");
  });

  it("loads compact task history once and streams only the active task", () => {
    expect(component).toContain(
      "fetchAiAssistantSession(selectedId, signal)",
    );
    expect(component).toContain("retry: false");
    expect(component).toContain("subscribeAiAssistantTaskEvents(");
    expect(component).toContain("replySequencesRef");
    expect(apiClient).toContain("task_id: taskId");
    expect(apiClient).not.toContain("fetchAiAssistantHistory");
    expect(component).not.toContain("fetchAiAssistantHistory");
    expect(component).not.toContain("subscribeAiAssistantEvents");
  });

  it("keeps the composer available while CAG tasks run", () => {
    expect(component).not.toContain("const busy =");
    expect(component).not.toContain("disabled={busy}");
    expect(component).toContain("pendingAttachments.some(");
    expect(component).toContain("sendMutation.isPending");
    expect(component).toContain(
      "setInput((current) => current || variables.prompt)",
    );
  });

  it("supports multiple files, stable drag and drop, clipboard files, and large paste conversion", () => {
    expect(component).toContain('type="file"');
    expect(component).toContain("multiple");
    expect(component).toContain("onDrop={(event) =>");
    expect(component).toContain("filesFromTransfer(event.dataTransfer)");
    expect(component).toContain("filesFromTransfer(");
    expect(component).toContain("event.clipboardData");
    expect(component).toContain('event.dataTransfer.dropEffect = "copy"');
    expect(component).toContain("fileDragDepthRef");
    expect(component).toContain("text.attachHint");
    expect(component).toContain("largePastedTextFile(value)");
    expect(apiClient).toContain("uploadAiAssistantAttachment");
    expect(apiClient).toContain("attachmentIds");

    const pastedImage = new File(["image"], "clipboard-image.png", {
      type: "image/png",
      lastModified: 1,
    });
    const copiedDocument = new File(["document"], "copied.pdf", {
      type: "application/pdf",
      lastModified: 2,
    });
    const extracted = filesFromTransfer({
      files: [pastedImage],
      items: [
        { kind: "file", getAsFile: () => pastedImage },
        { kind: "file", getAsFile: () => copiedDocument },
        { kind: "string", getAsFile: () => null },
      ],
      types: ["Files"],
    });
    expect(extracted).toEqual([pastedImage, copiedDocument]);
    const sameMetadataImage = new File(["image"], "clipboard-image.png", {
      type: "image/png",
      lastModified: 9,
    });
    expect(
      filesFromTransfer({
        files: [pastedImage],
        items: [
          { kind: "file", getAsFile: () => pastedImage },
          { kind: "file", getAsFile: () => sameMetadataImage },
        ],
      }),
    ).toEqual([pastedImage]);
    expect(uniqueAttachmentFiles([pastedImage], [sameMetadataImage])).toEqual(
      [],
    );
    expect(isImageAttachment("screen.PNG", "")).toBe(true);
    expect(isImageAttachment("upload", "image/webp")).toBe(true);
    expect(isImageAttachment("notes.txt", "text/plain")).toBe(false);

    const firstDocument = new File(["document"], "report.pdf", {
      type: "application/pdf",
      lastModified: 10,
    });
    const updatedDocument = new File(["document"], "report.pdf", {
      type: "application/pdf",
      lastModified: 11,
    });
    expect(
      uniqueAttachmentFiles([firstDocument], [firstDocument, updatedDocument]),
    ).toEqual([updatedDocument]);
    expect(
      transferContainsFiles({
        files: [],
        items: [{ kind: "file", getAsFile: () => copiedDocument }],
      }),
    ).toBe(true);
    expect(transferContainsFiles({ types: ["text/plain"] })).toBe(false);

    expect(largePastedTextFile("a".repeat(LARGE_PASTE_THRESHOLD_BYTES))).toBeNull();
    const file = largePastedTextFile(
      "a".repeat(LARGE_PASTE_THRESHOLD_BYTES + 1),
      new Date("2026-07-29T01:02:03Z"),
    );
    expect(file?.name).toBe("pasted-text-20260729T010203.txt");
    expect(file?.type).toBe("text/plain;charset=utf-8");
    expect(file?.size).toBe(LARGE_PASTE_THRESHOLD_BYTES + 1);
  });

  it("shows image attachments as thumbnails with a dismissible large preview", () => {
    expect(component).toContain("uniqueAttachmentFiles(");
    expect(component).toContain("pendingAttachmentsRef.current");
    expect(component).toContain("<LocalAttachmentImagePreview");
    expect(component).toContain("<AttachmentImagePreview");
    expect(component).toContain("mask={{ closable: true }}");
    expect(component).not.toContain("maskClosable");
    expect(component).toContain("onCancel={() => setOpen(false)}");
    expect(component).toContain("ai-assistant-pending-image");
    expect(component).toContain('className="ai-assistant-message-image-item"');
    expect(component).toContain("attachment.contentType");
    expect(component).toContain("item.file.type");
    expect(component).toContain("aria-label={`${previewLabel}: ${name}`}");
    expect(component).toContain("setSrc(nextSrc)");
    expect(component).toContain("URL.revokeObjectURL(nextSrc)");
    expect(component).toContain("<span>{attachment.name}</span>");
    expect(styles).toContain(".ai-assistant-image-thumbnail");
    expect(styles).toContain("width: 78px");
    expect(styles).toContain("object-fit: cover");
    expect(styles).toContain(
      ".ai-assistant-image-preview-modal .ant-modal-container",
    );
    expect(styles).toContain(".ai-assistant-image-preview-modal img");
    expect(styles).toContain("max-height: 78vh");
    expect(styles).toContain("object-fit: contain");
    expect(styles).toContain(".ai-assistant-image-remove.ant-btn");
  });

  it("shows queued tasks separately from running and streaming output", () => {
    expect(component).toContain('"task.queued"');
    expect(component).toContain('status: "QUEUED"');
    expect(component).toContain("text.queued");
    expect(component).toContain("text.preparing");
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
    expect(component).toContain("icon={<CloseOutlined />}");
    expect(component).not.toContain("MinusOutlined");
    expect(component).not.toContain("text.minimize");
    expect(
      component.match(/zIndex=\{AI_ASSISTANT_OVERLAY_Z_INDEX\}/g),
    ).toHaveLength(9);
    expect(
      component.match(/zIndex=\{AI_ASSISTANT_OVERLAY_Z_INDEX \+ 100\}/g),
    ).toHaveLength(2);
    expect(component).toContain(
      "const AI_ASSISTANT_OVERLAY_Z_INDEX = 1700",
    );
    expect(component).toContain('placement="left"');
    expect(styles).toMatch(/\.ai-assistant-window[\s\S]*?z-index:\s*1600/);
    expect(styles).toContain("@media (max-width: 600px)");
  });

  it("uses one assistant instance as a full page on the AI navigation node", () => {
    expect(app).toContain(
      'mode={activeNavigation === "aiAssistant" ? "page" : "floating"}',
    );
    expect(app).toContain('onMaximize={() => navigateTo("aiAssistant")}');
    expect(app).toContain("navigationPermissionCodes[item.key]");
    expect(portalNavigation).toContain('aiAssistant: "ai.assistant.use"');
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

  it("履歴削除前に一覧と詳細の在処理 Query を取消して即時反映する", async () => {
    const queryClient = new QueryClient();
    const first = { id: "session-1" } as AiAssistantSession;
    const second = { id: "session-2" } as AiAssistantSession;
    queryClient.setQueryData(
      ["ai-assistant-sessions", "user-1"],
      [first, second],
    );
    const cancel = vi.spyOn(queryClient, "cancelQueries");

    const snapshot = await optimisticallyRemoveAiAssistantSession(
      queryClient,
      "user-1",
      first.id,
      [],
    );

    expect(cancel).toHaveBeenNthCalledWith(1, {
      queryKey: ["ai-assistant-sessions", "user-1"],
    });
    expect(cancel).toHaveBeenNthCalledWith(2, {
      queryKey: ["ai-assistant-session", first.id],
    });
    expect(snapshot.previousSessions).toEqual([first, second]);
    expect(queryClient.getQueryData([
      "ai-assistant-sessions",
      "user-1",
    ])).toEqual([second]);
    expect(component).toContain("`ai-assistant-session-item${");
    expect(component).toContain("setDeleteCandidate(session)");
    expect(component).toContain("open={Boolean(deleteCandidate)}");
    expect(component).toContain("deleteMutation.mutate(deleteCandidate.id)");
    expect(component).toContain("confirmLoading={deleteMutation.isPending}");
    expect(component).not.toContain("<Popconfirm");
    expect(component).toContain("onMutate: async (sessionId) =>");
    expect(component).toContain("previousSessions");
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
        ticketAttachmentNames: [],
        questionThreads: [],
        customerEvaluation: null,
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
      ticketAttachmentNames: [],
      questionThreads: [],
      customerEvaluation: null,
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

  it("sends the whole ticket and customer evaluation for every focus question", () => {
    const detail = {
      ticketNo: "94056",
      title: "住民税受給者番号について",
      status: "CLOSED:評価受信",
      subStatus: "",
      assignee: null,
      customer: {
        id: "customer",
        name: "顧客",
        contactName: "",
        email: "",
        phone: "",
      },
      category: ["U-PDS HR", "その他"],
      urgency: "至急",
      inquiryLevel: null,
      createdAt: "2026-06-15T15:22:01+09:00",
      updatedAt: "2026-06-19T00:00:00+09:00",
      requestedReplyAt: null,
      attachments: [
        { id: "ticket-file", name: "全体資料.pdf", type: "PDF", size: 20 },
      ],
      evaluation: {
        satisfaction: "やや悪い",
        comment: "質問への回答が不足しています。",
        submittedAt: "2026-06-19T00:00:00+09:00",
      },
      questionThreads: [
        {
          questionKey: "q-1",
          sequence: 1,
          customerQuestion: {
            createdAt: "2026-06-15T15:22:01+09:00",
            requestedReplyAt: null,
            body: "最初の質問",
            attachments: [],
          },
          messages: [
            {
              messageKey: "m-1",
              kind: "CUSTOMER_VISIBLE_REPLY",
              author: { id: "support", displayName: "担当者", role: "SUPPORT" },
              relation: "OTHER_SUPPORT",
              visibility: "CUSTOMER_VISIBLE",
              createdAt: "2026-06-15T17:00:00+09:00",
              body: "最初の回答",
              attachments: [],
            },
          ],
        },
        {
          questionKey: "q-2",
          sequence: 2,
          customerQuestion: {
            createdAt: "2026-06-18T16:00:37+09:00",
            requestedReplyAt: null,
            body: "追加質問",
            attachments: [],
          },
          messages: [],
        },
      ],
      sourceUrl: "https://ss.onehr.jp/ticket/94056",
    } satisfies InquiryTicketDetail;

    const context = buildAiAssistantInquiryContext(
      detail,
      detail.questionThreads[1],
    );

    expect(context.questionKey).toBe("q-2");
    expect(
      context.questionThreads?.map((thread) => thread.questionKey),
    ).toEqual(["q-1", "q-2"]);
    expect(context.questionThreads?.[0].messages[0].body).toBe("最初の回答");
    expect(context.customerName).toBe("顧客");
    expect(context.assigneeName).toBeNull();
    expect(context.urgency).toBe("至急");
    expect(context.createdAt).toBe("2026-06-15T15:22:01+09:00");
    expect(context.ticketAttachmentNames).toEqual(["全体資料.pdf"]);
    expect(context.customerEvaluation).toEqual(detail.evaluation);
  });
});
