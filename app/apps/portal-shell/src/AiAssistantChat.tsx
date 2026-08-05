import {
  CloseOutlined,
  CommentOutlined,
  DeleteOutlined,
  ExpandOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  LoadingOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  createAiAssistantSession,
  deleteAiAssistantAttachment,
  deleteAiAssistantSession,
  fetchAiAssistantHistory,
  fetchAiAssistantSession,
  listAiAssistantSessions,
  renameAiAssistantSession,
  sendAiAssistantMessage,
  subscribeAiAssistantEvents,
  uploadAiAssistantAttachment,
  aiAssistantAttachmentUrl,
  type AiAssistantAttachment,
  type AiAssistantEvent,
  type AiAssistantSession,
  type AiAssistantSessionDetail,
  type AiAssistantTask,
} from "@one-ops/api-client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Button,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Spin,
  Tooltip,
  message,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { AiMarkdown } from "./AiMarkdown";
import type { AiAssistantInquiryContext } from "./ai-assistant-context";
import type { LocaleKey } from "./i18n";
import "./ai-assistant.css";

export const LARGE_PASTE_THRESHOLD_BYTES = 32 * 1024;
const AI_ASSISTANT_OVERLAY_Z_INDEX = 1700;
const MAX_ATTACHMENTS_PER_MESSAGE = 10;
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MAX_ATTACHMENT_TOTAL_BYTES = 50 * 1024 * 1024;

export function largePastedTextFile(
  value: string,
  timestamp = new Date(),
): File | null {
  if (new TextEncoder().encode(value).byteLength <= LARGE_PASTE_THRESHOLD_BYTES) {
    return null;
  }
  const stamp = timestamp.toISOString().replace(/[-:]/g, "").slice(0, 15);
  return new File(
    [value],
    `pasted-text-${stamp}.txt`,
    { type: "text/plain;charset=utf-8" },
  );
}

interface TransferFileItem {
  kind: string;
  getAsFile: () => File | null;
}

interface TransferFileSource {
  files?: ArrayLike<File> | null;
  items?: ArrayLike<TransferFileItem> | null;
  types?: ArrayLike<string> | null;
}

function transferFileIdentity(file: File) {
  return [file.name, file.size, file.type].join("\u0000");
}

export function isImageAttachment(name: string, contentType: string) {
  return /^(image\/(png|jpeg|gif|webp|bmp|avif))$/i.test(contentType) ||
    /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(name);
}

function pendingFileIdentity(file: File) {
  const base = transferFileIdentity(file);
  return isImageAttachment(file.name, file.type)
    ? base
    : `${base}\u0000${file.lastModified}`;
}

export function uniqueAttachmentFiles(
  existing: File[],
  incoming: File[],
): File[] {
  const identities = new Set(existing.map(pendingFileIdentity));
  return incoming.filter((file) => {
    const identity = pendingFileIdentity(file);
    if (identities.has(identity)) return false;
    identities.add(identity);
    return true;
  });
}

export function filesFromTransfer(source: TransferFileSource): File[] {
  const files = Array.from(source.files ?? []);
  const identities = new Set(files.map(transferFileIdentity));
  for (const item of Array.from(source.items ?? [])) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (!file) continue;
    const identity = transferFileIdentity(file);
    if (identities.has(identity)) continue;
    identities.add(identity);
    files.push(file);
  }
  return files;
}

export function transferContainsFiles(source: TransferFileSource): boolean {
  return (
    Array.from(source.types ?? []).includes("Files") ||
    Array.from(source.items ?? []).some((item) => item.kind === "file") ||
    Number(source.files?.length ?? 0) > 0
  );
}

interface PendingAttachment {
  localId: string;
  file: File;
  status: "UPLOADING" | "READY" | "FAILED";
  attachment?: AiAssistantAttachment;
}

function AttachmentImagePreview({
  src,
  name,
  previewLabel,
  className = "",
}: {
  src: string;
  name: string;
  previewLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`ai-assistant-image-thumbnail ${className}`.trim()}
        aria-label={`${previewLabel}: ${name}`}
        onClick={() => setOpen(true)}
      >
        <img src={src} alt="" />
      </button>
      <Modal
        open={open}
        footer={null}
        centered
        mask={{ closable: true }}
        width="min(92vw, 1120px)"
        zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX + 100}
        className="ai-assistant-image-preview-modal"
        onCancel={() => setOpen(false)}
      >
        <img src={src} alt={name} />
      </Modal>
    </>
  );
}

function LocalAttachmentImagePreview({
  file,
  previewLabel,
}: {
  file: File;
  previewLabel: string;
}) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const nextSrc = URL.createObjectURL(file);
    setSrc(nextSrc);
    return () => URL.revokeObjectURL(nextSrc);
  }, [file]);
  if (!src) {
    return (
      <span
        className="ai-assistant-image-thumbnail local loading"
        aria-label={`${previewLabel}: ${file.name}`}
      />
    );
  }
  return (
    <AttachmentImagePreview
      src={src}
      name={file.name}
      previewLabel={previewLabel}
      className="local"
    />
  );
}

function formatAttachmentBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)} KiB`;
  return `${bytes} B`;
}

const copy = {
  "ja-JP": {
    title: "AI助手",
    open: "AI助手を開く",
    close: "閉じる",
    maximize: "AI助手画面で開く",
    newTopic: "新しい話題",
    history: "会話履歴",
    noSessions: "会話はまだありません",
    start: "新しい話題を作成して、CAG と会話を始めます。",
    placeholder: "メッセージを入力",
    send: "送信",
    delete: "会話を削除",
    deleteConfirm: "この会話を履歴から削除しますか？",
    thinking: "考えています",
    queued: "CAG の実行待ち",
    preparing: "処理を開始しています",
    disconnected: "再接続中",
    connected: "リアルタイム接続",
    failed: "応答を取得できませんでした",
    createFailed: "新しい話題を作成できませんでした",
    sendFailed: "メッセージを送信できませんでした",
    deleteFailed: "会話を削除できませんでした",
    attach: "ファイルを添付",
    attachHint:
      "画像・ファイルを貼り付け、またはドラッグ＆ドロップできます",
    removeAttachment: "添付を外す",
    previewImage: "画像を拡大表示",
    uploadFailed: "ファイルをアップロードできませんでした",
    dropFiles: "ここにファイルをドロップ",
    attachmentOnlyPrompt: "添付ファイルを解析してください。",
    attachmentLimit:
      "1 ファイル 25 MiB、1 回 10 件、合計 50 MiB まで添付できます。",
    inquiryContext: "問合せを参照中",
    inquiryContextUsed: "参照済み",
    inquiryContexts: "この会話の問合せ",
    inquiryContextHint:
      "現在の分析位置と、問合せ全体の質問・対応記録・顧客評価を CAG に送信します",
    openInquiry: "問合せを開く",
    quickNavigation: "会話のクイックナビゲーション",
    goToMessage: "ユーザーの質問へ移動",
    responsePending: "回答を待っています",
    defaultTitle: "新しいチャット",
  },
  "zh-CN": {
    title: "AI 助手",
    open: "打开 AI 助手",
    close: "关闭",
    maximize: "在 AI 助手页面中打开",
    newTopic: "新话题",
    history: "会话历史",
    noSessions: "还没有会话",
    start: "新建话题后即可开始与 CAG 对话。",
    placeholder: "输入消息",
    send: "发送",
    delete: "删除会话",
    deleteConfirm: "从历史记录中删除这个会话吗？",
    thinking: "正在思考",
    queued: "等待 CAG 执行",
    preparing: "正在开始处理",
    disconnected: "正在重新连接",
    connected: "实时连接",
    failed: "无法取得回答",
    createFailed: "无法新建话题",
    sendFailed: "无法发送消息",
    deleteFailed: "无法删除会话",
    attach: "添加附件",
    attachHint: "可直接粘贴图片或文件，也可拖放多个文件",
    removeAttachment: "移除附件",
    previewImage: "放大查看图片",
    uploadFailed: "文件上传失败",
    dropFiles: "将文件拖到这里",
    attachmentOnlyPrompt: "请解析附件内容。",
    attachmentLimit: "单个文件不超过 25 MiB，每次最多 10 个、合计 50 MiB。",
    inquiryContext: "正在参考问询",
    inquiryContextUsed: "已讨论",
    inquiryContexts: "本会话的问询",
    inquiryContextHint:
      "当前分析位置以及整张工单的全部问题、处理记录和客户评价将发送给 CAG",
    openInquiry: "打开问询",
    quickNavigation: "会话快速导航",
    goToMessage: "跳转到用户提问",
    responsePending: "正在等待回答",
    defaultTitle: "新对话",
  },
  "en-US": {
    title: "AI Assistant",
    open: "Open AI Assistant",
    close: "Close",
    maximize: "Open the AI Assistant page",
    newTopic: "New topic",
    history: "Chat history",
    noSessions: "No conversations yet",
    start: "Create a topic to start chatting with CAG.",
    placeholder: "Type a message",
    send: "Send",
    delete: "Delete conversation",
    deleteConfirm: "Delete this conversation from history?",
    thinking: "Thinking",
    queued: "Waiting in the CAG queue",
    preparing: "Starting processing",
    disconnected: "Reconnecting",
    connected: "Live",
    failed: "The response could not be loaded",
    createFailed: "The topic could not be created",
    sendFailed: "The message could not be sent",
    deleteFailed: "The conversation could not be deleted",
    attach: "Attach files",
    attachHint: "Paste images or files, or drag and drop multiple files",
    removeAttachment: "Remove attachment",
    previewImage: "Preview image",
    uploadFailed: "The file could not be uploaded",
    dropFiles: "Drop files here",
    attachmentOnlyPrompt: "Please analyze the attached files.",
    attachmentLimit:
      "Up to 10 files, 25 MiB each and 50 MiB total, can be attached.",
    inquiryContext: "Using inquiry context",
    inquiryContextUsed: "Previously discussed",
    inquiryContexts: "Inquiries in this conversation",
    inquiryContextHint:
      "The current analysis target and the ticket's full questions, support records, and customer evaluation will be sent to CAG",
    openInquiry: "Open inquiry",
    quickNavigation: "Conversation quick navigation",
    goToMessage: "Go to user question",
    responsePending: "Waiting for a response",
    defaultTitle: "New chat",
  },
} as const;

interface AssistantReply {
  text: string;
  status: "QUEUED" | "RUNNING" | "STREAMING" | "COMPLETED" | "FAILED";
}

interface AssistantNavigationItem {
  id: string;
  questionPreview: string;
  answerPreview: string;
}

export function assistantNavigationPreview(
  value: string,
  fallback: string,
  maximumCharacters = 360,
) {
  const normalized = String(value || fallback)
    .replace(/```[\s\S]*?```/g, " コード ")
    .replace(/[#>*_`~|[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const characters = Array.from(normalized);
  return characters.length > maximumCharacters
    ? `${characters.slice(0, maximumCharacters - 1).join("")}…`
    : normalized;
}

export function assistantNavigationMarkClass(
  index: number,
  hoveredIndex: number,
  selected: boolean,
) {
  const classes: string[] = [];
  if (hoveredIndex >= 0) {
    classes.push(
      `wave-${Math.min(Math.abs(index - hoveredIndex), 4)}`,
    );
  }
  if (selected) classes.push("active");
  return classes.join(" ");
}

function eventReply(
  current: AssistantReply | undefined,
  event: AiAssistantEvent,
): AssistantReply | undefined {
  if (!event.taskId) return current;
  if (event.type === "task.created" || event.type === "task.queued") {
    return { text: current?.text ?? "", status: "QUEUED" };
  }
  if (
    event.type === "task.started" ||
    event.type === "workspace.preparing" ||
    event.type === "workspace.ready" ||
    event.type === "runtime.connected"
  ) {
    return { text: current?.text ?? "", status: "RUNNING" };
  }
  if (event.type === "agent.message.delta") {
    const delta = String(event.data.delta ?? "");
    return {
      text: `${current?.text ?? ""}${delta}`,
      status: "STREAMING",
    };
  }
  if (event.type === "agent.message") {
    return {
      text: String(event.data.text ?? current?.text ?? ""),
      status: "COMPLETED",
    };
  }
  if (event.type === "task.failed" || event.type === "task.cancelled") {
    return {
      text: String(
        event.data.error ??
          event.data.message ??
          current?.text ??
          "",
      ),
      status: "FAILED",
    };
  }
  if (event.type === "task.completed" && current) {
    return { ...current, status: "COMPLETED" };
  }
  return current;
}

function repliesFromEvents(events: AiAssistantEvent[]) {
  const replies: Record<string, AssistantReply> = {};
  for (const event of events) {
    const next = eventReply(replies[event.taskId], event);
    if (next && event.taskId) replies[event.taskId] = next;
  }
  return replies;
}

function fallbackReply(task: AiAssistantTask) {
  const summary = task.final_report?.summary;
  return typeof summary === "string" ? summary : "";
}

export function assistantDisplayText(
  value: string,
  inquiryContext?: AiAssistantInquiryContext | null,
) {
  if (!inquiryContext) return value;
  const questionLabel = `Q${inquiryContext.questionSequence}`;
  return value
    .replace(/\btargetQuestionKey\b|\bquestionKey\b/g, questionLabel)
    .replace(/\bquestionThreads\b/g, "問合せ全体")
    .replace(/\bcustomerEvaluation\b/g, "顧客評価")
    .replace(/\bfocusedMessageKey\b|\bmessageKey\b/g, "対象メッセージ");
}

export function summarizeAssistantTitle(
  prompt: string,
  inquiryContext?: AiAssistantInquiryContext | null,
) {
  const normalized = prompt
    .replace(/^[#>*\s-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  const firstSentence =
    normalized.split(/[。！？!?]/, 1)[0]?.trim() || normalized;
  const subject = inquiryContext
    ? `${inquiryContext.ticketNo} ${firstSentence}`
    : firstSentence;
  const characters = Array.from(subject);
  return characters.length > 40
    ? `${characters.slice(0, 39).join("")}…`
    : subject;
}

export interface AssistantInquiryReference
  extends AiAssistantInquiryContext {
  active: boolean;
  used: boolean;
}

function inquiryContextKey(context: AiAssistantInquiryContext) {
  return `${context.ticketNo}:${context.questionKey}`;
}

export function assistantInquiryReferences(
  tasks: AiAssistantTask[],
  activeContext?: AiAssistantInquiryContext | null,
): AssistantInquiryReference[] {
  const references = new Map<string, AssistantInquiryReference>();
  for (const task of tasks) {
    const context = task.inquiryContext;
    if (!context) continue;
    references.set(inquiryContextKey(context), {
      ...context,
      active: false,
      used: true,
    });
  }
  if (activeContext) {
    const key = inquiryContextKey(activeContext);
    const existing = references.get(key);
    references.set(key, {
      ...(existing ?? activeContext),
      active: true,
      used: existing?.used ?? false,
    });
  }
  return [...references.values()];
}

export function AiAssistantChat({
  locale,
  userId,
  inquiryContext,
  mode = "floating",
  onMaximize,
  onOpenInquiry,
}: {
  locale: LocaleKey;
  userId: string;
  inquiryContext?: AiAssistantInquiryContext | null;
  mode?: "floating" | "page";
  onMaximize?: () => void;
  onOpenInquiry?: (context: AiAssistantInquiryContext) => void;
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const storagePrefix = `oneops.ai-assistant.${userId}`;
  const [open, setOpen] = useState(
    () => localStorage.getItem(`${storagePrefix}.open`) === "true",
  );
  const [showHistory, setShowHistory] = useState(false);
  const [selectedId, setSelectedId] = useState(
    () => localStorage.getItem(`${storagePrefix}.session`) ?? "",
  );
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [replies, setReplies] = useState<Record<string, AssistantReply>>({});
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [activeNavigationId, setActiveNavigationId] = useState("");
  const [hoveredNavigationId, setHoveredNavigationId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileDragDepthRef = useRef(0);
  const conversationRef = useRef<HTMLDivElement>(null);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
  const visible = mode === "page" || open;

  const updatePendingAttachments = (
    updater: (current: PendingAttachment[]) => PendingAttachment[],
  ) => {
    const next = updater(pendingAttachmentsRef.current);
    pendingAttachmentsRef.current = next;
    setPendingAttachments(next);
  };

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}.open`, String(open));
  }, [open, storagePrefix]);
  useEffect(() => {
    if (selectedId) {
      localStorage.setItem(`${storagePrefix}.session`, selectedId);
    } else {
      localStorage.removeItem(`${storagePrefix}.session`);
    }
  }, [selectedId, storagePrefix]);
  useEffect(() => {
    pendingAttachmentsRef.current = [];
    setPendingAttachments([]);
    setDraggingFiles(false);
    fileDragDepthRef.current = 0;
  }, [selectedId]);

  const addFiles = (files: File[]) => {
    if (!selectedId || !files.length) return;
    const current = pendingAttachmentsRef.current;
    const uniqueFiles = uniqueAttachmentFiles(
      current.map((item) => item.file),
      files,
    );
    if (!uniqueFiles.length) return;
    const currentBytes = current.reduce(
      (sum, item) => sum + item.file.size,
      0,
    );
    const accepted: File[] = [];
    let nextBytes = currentBytes;
    for (const file of uniqueFiles) {
      if (
        file.size === 0 ||
        file.size > MAX_ATTACHMENT_BYTES ||
        current.length + accepted.length >=
          MAX_ATTACHMENTS_PER_MESSAGE ||
        nextBytes + file.size > MAX_ATTACHMENT_TOTAL_BYTES
      ) {
        void message.warning(text.attachmentLimit);
        continue;
      }
      accepted.push(file);
      nextBytes += file.size;
    }
    const pending = accepted.map((file, index) => ({
      localId: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      file,
      status: "UPLOADING" as const,
    }));
    pendingAttachmentsRef.current = [...current, ...pending];
    setPendingAttachments(pendingAttachmentsRef.current);
    for (const item of pending) {
      void uploadAiAssistantAttachment(selectedId, item.file)
        .then((attachment) => {
          updatePendingAttachments((current) =>
            current.map((candidate) =>
              candidate.localId === item.localId
                ? { ...candidate, status: "READY", attachment }
                : candidate,
            ),
          );
        })
        .catch(() => {
          updatePendingAttachments((current) =>
            current.map((candidate) =>
              candidate.localId === item.localId
                ? { ...candidate, status: "FAILED" }
                : candidate,
            ),
          );
          void message.error(`${text.uploadFailed}: ${item.file.name}`);
        });
    }
  };

  const removePendingAttachment = (item: PendingAttachment) => {
    updatePendingAttachments((current) =>
      current.filter((candidate) => candidate.localId !== item.localId),
    );
    if (item.attachment) {
      void deleteAiAssistantAttachment(selectedId, item.attachment.id).catch(
        () => {},
      );
    }
  };

  const sessionsQuery = useQuery({
    queryKey: ["ai-assistant-sessions", userId],
    queryFn: () => listAiAssistantSessions(),
    enabled: visible,
  });
  const sessions = sessionsQuery.data ?? [];

  useEffect(() => {
    if (!visible || sessionsQuery.isLoading) return;
    if (selectedId && sessions.some((session) => session.id === selectedId)) {
      return;
    }
    setSelectedId(sessions[0]?.id ?? "");
  }, [selectedId, sessions, sessionsQuery.isLoading, visible]);

  const detailQuery = useQuery({
    queryKey: ["ai-assistant-session", selectedId],
    queryFn: () => fetchAiAssistantSession(selectedId),
    enabled: visible && Boolean(selectedId),
  });
  const historyQuery = useQuery({
    queryKey: ["ai-assistant-history", selectedId],
    queryFn: () => fetchAiAssistantHistory(selectedId),
    enabled: visible && Boolean(selectedId),
  });

  useEffect(() => {
    if (!selectedId || !historyQuery.data) {
      setReplies({});
      return;
    }
    setReplies(repliesFromEvents(historyQuery.data));
  }, [selectedId, historyQuery.data]);

  const historySequence = useMemo(
    () =>
      Math.max(
        0,
        ...(historyQuery.data ?? []).map(
          (event) => event.conversationSequence,
        ),
      ),
    [historyQuery.data],
  );

  useEffect(() => {
    if (!visible || !selectedId || !historyQuery.isSuccess) return;
    const source = subscribeAiAssistantEvents(
      selectedId,
      (event) => {
        if (!event.taskId) return;
        setReplies((current) => {
          const next = eventReply(current[event.taskId], event);
          return next
            ? { ...current, [event.taskId]: next }
            : current;
        });
        if (
          event.type === "task.completed" ||
          event.type === "task.failed" ||
          event.type === "task.cancelled"
        ) {
          void queryClient.invalidateQueries({
            queryKey: ["ai-assistant-session", selectedId],
          });
          void queryClient.invalidateQueries({
            queryKey: ["ai-assistant-sessions", userId],
          });
        }
      },
      historySequence,
      setConnected,
    );
    return () => source.close();
  }, [
    historyQuery.isSuccess,
    historySequence,
    queryClient,
    selectedId,
    userId,
    visible,
  ]);

  const createMutation = useMutation({
    mutationFn: () => createAiAssistantSession(text.defaultTitle),
    onSuccess: async (session) => {
      queryClient.setQueryData<AiAssistantSession[]>(
        ["ai-assistant-sessions", userId],
        (current = []) => [session, ...current],
      );
      setSelectedId(session.id);
      setShowHistory(false);
    },
    onError: () => void message.error(text.createFailed),
  });

  const sendMutation = useMutation({
    mutationFn: async ({
      prompt,
      context,
      attachments,
    }: {
      prompt: string;
      context: AiAssistantInquiryContext | null;
      attachments: AiAssistantAttachment[];
    }) => {
      const task = await sendAiAssistantMessage(
        selectedId,
        prompt,
        context,
        attachments.map((attachment) => attachment.id),
      );
      return { task, prompt, context, attachments };
    },
    onSuccess: async ({ task, prompt, context, attachments }) => {
      queryClient.setQueryData<AiAssistantSessionDetail>(
        ["ai-assistant-session", selectedId],
        (current) =>
          current
            ? { ...current, tasks: [...current.tasks, task] }
            : current,
      );
      setReplies((current) => ({
        ...current,
        [task.id]: {
          text: "",
          status:
            String(task.status).toLowerCase() === "queued"
              ? "QUEUED"
              : "RUNNING",
        },
      }));
      const sentIds = new Set(attachments.map((attachment) => attachment.id));
      updatePendingAttachments((current) =>
        current.filter(
          (item) => !item.attachment || !sentIds.has(item.attachment.id),
        ),
      );
      const currentSession = sessions.find(
        (session) => session.id === selectedId,
      );
      if (
        currentSession &&
        tasks.length === 0 &&
        [text.defaultTitle, "新しいチャット"].includes(currentSession.title)
      ) {
        const title = summarizeAssistantTitle(prompt, context);
        try {
          const renamed = await renameAiAssistantSession(selectedId, title);
          queryClient.setQueryData<AiAssistantSession[]>(
            ["ai-assistant-sessions", userId],
            (current = []) =>
              current.map((session) =>
                session.id === renamed.id ? renamed : session,
              ),
          );
        } catch {
          return;
        }
      }
    },
    onError: (_error, variables) => {
      setInput((current) => current || variables.prompt);
      void message.error(text.sendFailed);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) =>
      deleteAiAssistantSession(sessionId),
    onSuccess: (_, deletedId) => {
      const remaining = sessions.filter(
        (session) => session.id !== deletedId,
      );
      queryClient.setQueryData(
        ["ai-assistant-sessions", userId],
        remaining,
      );
      if (selectedId === deletedId) {
        setSelectedId(remaining[0]?.id ?? "");
      }
      setShowHistory(Boolean(remaining.length));
    },
    onError: () => void message.error(text.deleteFailed),
  });

  const tasks = [...(detailQuery.data?.tasks ?? [])].sort((left, right) =>
    String(left.created_at).localeCompare(String(right.created_at)),
  );
  const navigationItems = useMemo<AssistantNavigationItem[]>(
    () =>
      tasks.map((task) => {
        const reply = replies[task.id];
        const answer = assistantDisplayText(
          reply?.text || fallbackReply(task),
          task.inquiryContext,
        );
        return {
          id: `${task.id}:user`,
          questionPreview: assistantNavigationPreview(
            task.prompt,
            text.attachmentOnlyPrompt,
            180,
          ),
          answerPreview: assistantNavigationPreview(
            answer,
            reply?.status === "FAILED" ||
              String(task.status).toLowerCase() === "failed"
              ? text.failed
              : text.responsePending,
          ),
        };
      }),
    [replies, tasks, text],
  );
  const navigationIds = navigationItems.map((item) => item.id).join("|");
  const hoveredNavigationIndex = navigationItems.findIndex(
    (item) => item.id === hoveredNavigationId,
  );
  const inquiryReferences = useMemo(
    () => assistantInquiryReferences(tasks, inquiryContext),
    [inquiryContext, tasks],
  );

  useEffect(() => {
    const availableIds = navigationIds ? navigationIds.split("|") : [];
    if (!availableIds.includes(activeNavigationId)) {
      setActiveNavigationId("");
    }
    setHoveredNavigationId("");
  }, [activeNavigationId, navigationIds, selectedId]);

  const goToNavigationItem = (id: string) => {
    const container = conversationRef.current;
    if (!container) return;
    const target = Array.from(
      container.querySelectorAll<HTMLElement>("[data-navigation-id]"),
    ).find((element) => element.dataset.navigationId === id);
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    setActiveNavigationId(id);
  };

  const send = () => {
    const attachments = pendingAttachments
      .filter(
        (item): item is PendingAttachment & {
          attachment: AiAssistantAttachment;
        } => item.status === "READY" && Boolean(item.attachment),
      )
      .map((item) => item.attachment);
    const prompt = input.trim() || (
      attachments.length ? text.attachmentOnlyPrompt : ""
    );
    if (
      !prompt ||
      !selectedId ||
      sendMutation.isPending ||
      pendingAttachments.some((item) => item.status === "UPLOADING")
    ) return;
    setInput("");
    sendMutation.mutate({
      prompt,
      context: inquiryContext ?? null,
      attachments,
    });
  };
  const pageMode = mode === "page";

  return (
    <>
      {!pageMode && !open && (
        <Tooltip
          title={text.open}
          zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
        >
          <button
            className="ai-assistant-launcher"
            type="button"
            aria-label={text.open}
            onClick={() => setOpen(true)}
          >
            <CommentOutlined />
          </button>
        </Tooltip>
      )}
      {visible && (
        <section
          className={`ai-assistant-window${
            pageMode ? " ai-assistant-page" : ""
          }`}
          aria-label={text.title}
          onDragEnter={(event) => {
            if (!transferContainsFiles(event.dataTransfer)) return;
            event.preventDefault();
            fileDragDepthRef.current += 1;
            setDraggingFiles(true);
          }}
          onDragOver={(event) => {
            if (!transferContainsFiles(event.dataTransfer)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(event) => {
            if (!transferContainsFiles(event.dataTransfer)) return;
            event.preventDefault();
            fileDragDepthRef.current = Math.max(
              0,
              fileDragDepthRef.current - 1,
            );
            if (fileDragDepthRef.current === 0) {
              setDraggingFiles(false);
            }
          }}
          onDrop={(event) => {
            if (!transferContainsFiles(event.dataTransfer)) return;
            event.preventDefault();
            fileDragDepthRef.current = 0;
            setDraggingFiles(false);
            addFiles(filesFromTransfer(event.dataTransfer));
          }}
        >
          <header className="ai-assistant-header">
            <div className="ai-assistant-heading">
              <span className="ai-assistant-mark"><RobotOutlined /></span>
              <div>
                <strong>
                  {sessions.find((session) => session.id === selectedId)
                    ?.title ?? text.title}
                </strong>
                <small className={connected ? "connected" : ""}>
                  <span />
                  {connected ? text.connected : text.disconnected}
                </small>
              </div>
            </div>
            <div className="ai-assistant-header-actions">
              <Tooltip
                title={text.newTopic}
                zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
              >
                <Button
                  type="text"
                  shape="circle"
                  icon={<PlusOutlined />}
                  aria-label={text.newTopic}
                  loading={createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                />
              </Tooltip>
              {!pageMode && (
                <>
                  <Tooltip
                    title={text.history}
                    zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
                  >
                    <Button
                      type={showHistory ? "default" : "text"}
                      shape="circle"
                      icon={<HistoryOutlined />}
                      aria-label={text.history}
                      onClick={() => setShowHistory((current) => !current)}
                    />
                  </Tooltip>
                  {onMaximize && (
                    <Tooltip
                      title={text.maximize}
                      zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
                    >
                      <Button
                        type="text"
                        shape="circle"
                        icon={<ExpandOutlined />}
                        aria-label={text.maximize}
                        onClick={onMaximize}
                      />
                    </Tooltip>
                  )}
                  <Tooltip
                    title={text.close}
                    zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
                  >
                    <Button
                      type="text"
                      shape="circle"
                      icon={<CloseOutlined />}
                      aria-label={text.close}
                      onClick={() => setOpen(false)}
                    />
                  </Tooltip>
                </>
              )}
            </div>
          </header>

          {inquiryReferences.length > 0 && (
            <div
              className="ai-assistant-contexts"
              aria-label={text.inquiryContexts}
            >
              {inquiryReferences.map((reference) => (
                <div
                  key={inquiryContextKey(reference)}
                  className={`ai-assistant-context ${
                    reference.active ? "active" : "used"
                  }`}
                  title={
                    reference.active ? text.inquiryContextHint : undefined
                  }
                >
                  {reference.active ? (
                    <MessageOutlined />
                  ) : (
                    <HistoryOutlined />
                  )}
                  <div>
                    <strong>
                      {reference.active
                        ? text.inquiryContext
                        : text.inquiryContextUsed}
                      {" · "}No. {reference.ticketNo}{" · "}Q
                      {reference.questionSequence}
                    </strong>
                    <span>{reference.ticketTitle}</span>
                  </div>
                  {onOpenInquiry && (
                    <Tooltip
                      title={`${text.openInquiry}: No. ${reference.ticketNo} · Q${reference.questionSequence}`}
                      placement="left"
                      zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
                    >
                      <Button
                        className="ai-assistant-context-open"
                        type="text"
                        shape="circle"
                        size="small"
                        icon={<FolderOpenOutlined />}
                        aria-label={`${text.openInquiry}: No. ${reference.ticketNo} · Q${reference.questionSequence}`}
                        onClick={() => onOpenInquiry(reference)}
                      />
                    </Tooltip>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="ai-assistant-body">
            {(pageMode || showHistory) && (
              <aside
                className={`ai-assistant-history${
                  pageMode ? " ai-assistant-history-page" : ""
                }`}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  block
                  loading={createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {text.newTopic}
                </Button>
                <div className="ai-assistant-session-list">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={
                        `ai-assistant-session-item${
                          session.id === selectedId ? " selected" : ""
                        }`
                      }
                    >
                      <button
                        type="button"
                        className="ai-assistant-session-select"
                        onClick={() => {
                          setSelectedId(session.id);
                          if (!pageMode) setShowHistory(false);
                        }}
                      >
                        <span>{session.title}</span>
                        <small>
                          {new Date(session.updatedAt).toLocaleString(locale)}
                        </small>
                      </button>
                      <Popconfirm
                        title={text.deleteConfirm}
                        zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
                        okText={text.delete}
                        cancelText={text.close}
                        okButtonProps={{ danger: true }}
                        onConfirm={() => deleteMutation.mutate(session.id)}
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          aria-label={`${text.delete}: ${session.title}`}
                          loading={
                            deleteMutation.isPending &&
                            deleteMutation.variables === session.id
                          }
                        />
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              </aside>
            )}

            <div className="ai-assistant-conversation-shell">
              <div
                ref={conversationRef}
                className="ai-assistant-conversation"
              >
                {sessionsQuery.isLoading || detailQuery.isLoading ? (
                  <div className="ai-assistant-center"><Spin /></div>
                ) : !selectedId ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={text.noSessions}
                  >
                    <p>{text.start}</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      loading={createMutation.isPending}
                      onClick={() => createMutation.mutate()}
                    >
                      {text.newTopic}
                    </Button>
                  </Empty>
                ) : (
                  <div
                    className={`ai-assistant-messages${
                      navigationItems.length
                        ? " has-quick-navigation"
                        : ""
                    }`}
                    aria-live="polite"
                  >
                    {tasks.map((task) => {
                      const reply = replies[task.id];
                      const fallback = fallbackReply(task);
                      return (
                        <div className="ai-assistant-turn" key={task.id}>
                          <div
                            className="ai-assistant-message user"
                            data-navigation-id={`${task.id}:user`}
                          >
                            <div>
                              <span>{task.prompt}</span>
                              {Boolean(task.attachments?.length) && (
                                <div className="ai-assistant-message-files">
                                  {task.attachments?.map((attachment) => (
                                    isImageAttachment(
                                      attachment.name,
                                      attachment.contentType,
                                    ) ? (
                                      <div
                                        className="ai-assistant-message-image-item"
                                        key={attachment.id}
                                      >
                                        <AttachmentImagePreview
                                          src={aiAssistantAttachmentUrl(
                                            selectedId,
                                            attachment.id,
                                          )}
                                          name={attachment.name}
                                          previewLabel={text.previewImage}
                                          className="message"
                                        />
                                      </div>
                                    ) : (
                                      <a
                                        key={attachment.id}
                                        href={aiAssistantAttachmentUrl(
                                          selectedId,
                                          attachment.id,
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <PaperClipOutlined />
                                        <span>{attachment.name}</span>
                                        <small>
                                          {formatAttachmentBytes(
                                            attachment.size,
                                          )}
                                        </small>
                                      </a>
                                    )
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div
                            className="ai-assistant-message assistant"
                          >
                            <span className="ai-assistant-avatar">
                              <RobotOutlined />
                            </span>
                            <div>
                              {reply?.text || fallback ? (
                                <AiMarkdown className="ai-assistant-answer">
                                  {assistantDisplayText(
                                    reply?.text || fallback,
                                    task.inquiryContext,
                                  )}
                                </AiMarkdown>
                              ) : reply?.status === "FAILED" ||
                                String(task.status).toLowerCase() === "failed" ? (
                                <span className="ai-assistant-error">
                                  {reply?.text || task.error || text.failed}
                                </span>
                              ) : (
                                <span className="ai-assistant-thinking">
                                  <LoadingOutlined />{" "}
                                  {reply?.status === "QUEUED" ||
                                  String(task.status).toLowerCase() === "queued"
                                    ? text.queued
                                    : reply?.status === "RUNNING"
                                      ? text.preparing
                                      : text.thinking}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {!tasks.length && (
                      <div className="ai-assistant-welcome">
                        <RobotOutlined />
                        <strong>{text.title}</strong>
                        <span>{text.start}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {navigationItems.length > 0 && (
                <nav
                  className="ai-assistant-quick-navigation"
                  aria-label={text.quickNavigation}
                  onMouseLeave={() => setHoveredNavigationId("")}
                >
                  {navigationItems.map((item, index) => (
                    <Tooltip
                      key={item.id}
                      placement="right"
                      zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
                      mouseEnterDelay={0.04}
                      trigger={["hover", "focus"]}
                      color="#fff"
                      title={(
                        <div className="ai-assistant-quick-preview">
                          <strong>{item.questionPreview}</strong>
                          <span>{item.answerPreview}</span>
                        </div>
                      )}
                    >
                      <button
                        type="button"
                        className={assistantNavigationMarkClass(
                          index,
                          hoveredNavigationIndex,
                          activeNavigationId === item.id,
                        )}
                        aria-label={`${text.goToMessage}: ${index + 1}`}
                        aria-current={
                          activeNavigationId === item.id ? "true" : undefined
                        }
                        onMouseEnter={() => setHoveredNavigationId(item.id)}
                        onFocus={() => setHoveredNavigationId(item.id)}
                        onBlur={() => setHoveredNavigationId("")}
                        onClick={() => goToNavigationItem(item.id)}
                      />
                    </Tooltip>
                  ))}
                </nav>
              )}
            </div>
          </div>

          {selectedId && (
            <footer
              className={`ai-assistant-composer${
                draggingFiles ? " dragging" : ""
              }`}
            >
              {draggingFiles && (
                <div className="ai-assistant-drop-overlay">
                  <PaperClipOutlined />
                  <strong>{text.dropFiles}</strong>
                </div>
              )}
              {pendingAttachments.length > 0 && (
                <div
                  className="ai-assistant-pending-files"
                  aria-label={text.attach}
                >
                  {pendingAttachments.map((item) => (
                    isImageAttachment(item.file.name, item.file.type) ? (
                      <div
                        className={`ai-assistant-pending-image ${
                          item.status.toLowerCase()
                        }`}
                        key={item.localId}
                      >
                        <LocalAttachmentImagePreview
                          file={item.file}
                          previewLabel={text.previewImage}
                        />
                        {item.status === "UPLOADING" && (
                          <span
                            className="ai-assistant-image-status"
                            aria-label={text.preparing}
                          >
                            <LoadingOutlined />
                          </span>
                        )}
                        <Button
                          className="ai-assistant-image-remove"
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          aria-label={`${text.removeAttachment}: ${item.file.name}`}
                          onClick={() => removePendingAttachment(item)}
                        />
                      </div>
                    ) : (
                      <div
                        className={`ai-assistant-pending-file ${
                          item.status.toLowerCase()
                        }`}
                        key={item.localId}
                      >
                        {item.status === "UPLOADING" ? (
                          <LoadingOutlined />
                        ) : (
                          <PaperClipOutlined />
                        )}
                        <span title={item.file.name}>{item.file.name}</span>
                        <small>{formatAttachmentBytes(item.file.size)}</small>
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          aria-label={`${text.removeAttachment}: ${item.file.name}`}
                          onClick={() => removePendingAttachment(item)}
                        />
                      </div>
                    )
                  ))}
                </div>
              )}
              <div className="ai-assistant-composer-row">
                <input
                  ref={fileInputRef}
                  className="ai-assistant-file-input"
                  type="file"
                  multiple
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={(event) => {
                    addFiles(Array.from(event.target.files ?? []));
                    event.target.value = "";
                  }}
                />
                <Tooltip
                  title={text.attachmentLimit}
                  zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
                >
                  <Button
                    type="text"
                    shape="circle"
                    icon={<PaperClipOutlined />}
                    aria-label={text.attach}
                    onClick={() => fileInputRef.current?.click()}
                  />
                </Tooltip>
                <Input.TextArea
                  value={input}
                  autoSize={{ minRows: 1, maxRows: 5 }}
                  placeholder={text.placeholder}
                  onChange={(event) => setInput(event.target.value)}
                  onPaste={(event) => {
                    const pastedFiles = filesFromTransfer(
                      event.clipboardData,
                    );
                    if (pastedFiles.length) {
                      event.preventDefault();
                      addFiles(pastedFiles);
                      return;
                    }
                    const value = event.clipboardData.getData("text/plain");
                    const file = largePastedTextFile(value);
                    if (!file) return;
                    event.preventDefault();
                    addFiles([file]);
                  }}
                  onPressEnter={(event) => {
                    if (!event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SendOutlined />}
                  aria-label={text.send}
                  loading={sendMutation.isPending}
                  disabled={
                    (!input.trim() &&
                      !pendingAttachments.some(
                        (item) => item.status === "READY",
                      )) ||
                    pendingAttachments.some(
                      (item) => item.status === "UPLOADING",
                    ) ||
                    sendMutation.isPending
                  }
                  onClick={send}
                />
              </div>
              <div className="ai-assistant-attachment-hint">
                <PaperClipOutlined />
                <span>{text.attachHint}</span>
              </div>
            </footer>
          )}
        </section>
      )}
    </>
  );
}
