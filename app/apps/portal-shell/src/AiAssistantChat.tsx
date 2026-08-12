import {
  CheckOutlined,
  CloseOutlined,
  CommentOutlined,
  CopyOutlined,
  DeleteOutlined,
  DoubleRightOutlined,
  DownOutlined,
  ExpandOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  LoadingOutlined,
  MessageOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import {
  createAiAssistantSession,
  cancelAiAssistantTask,
  deleteAiAssistantAttachment,
  deleteAiAssistantSession,
  fetchAiAssistantSession,
  listAiAssistantShortcuts,
  listAiAssistantSessions,
  renameAiAssistantSession,
  sendAiAssistantMessage,
  subscribeAiAssistantTaskEvents,
  uploadAiAssistantAttachment,
  aiAssistantAttachmentUrl,
  type AiAssistantAttachment,
  type AiAssistantEvent,
  type AiAssistantSession,
  type AiAssistantSessionDetail,
  type AiAssistantShortcut,
  type AiAssistantTask,
} from "@one-ops/api-client";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Button,
  Dropdown,
  Empty,
  Input,
  Modal,
  Spin,
  Tooltip,
  type MenuProps,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiMarkdown } from "./AiMarkdown";
import {
  GenerativeConversationLoader,
  type GenerativeConversationLoaderPhase,
} from "./GenerativeConversationLoader";
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
    title: "AIアシスタント",
    open: "AIアシスタントを開く",
    close: "閉じる",
    maximize: "AIアシスタント画面で開く",
    newTopic: "新しい話題",
    quickAssistants: "クイックアシスタント",
    subscriptions: "購読した機能",
    subscribe: "この機能を購読",
    unsubscribe: "購読を解除",
    history: "会話履歴",
    noSessions: "会話はまだありません",
    start: "新しい話題を作成して、AI との会話を始めます。",
    placeholder: "メッセージを入力",
    send: "送信",
    stopResponse: "回答の生成を停止",
    stoppingResponse: "回答の生成を停止しています",
    responseStopped: "回答の生成を停止しました",
    stopFailed: "回答の生成を停止できませんでした。もう一度お試しください。",
    delete: "会話を削除",
    deleteConfirm: "この会話を履歴から削除しますか？",
    thinking: "考えています",
    queued: "AI の応答待ち",
    preparing: "処理を開始しています",
    disconnected: "再接続中",
    connected: "リアルタイム接続",
    ready: "待機中",
    loadFailed: "会話を読み込めませんでした",
    retry: "再読込",
    failed: "応答を取得できませんでした",
    createFailed: "新しい話題を作成できませんでした",
    sendFailed: "メッセージを送信できませんでした",
    resubmit: "AI に再質問",
    modelUnavailable: "AI は一時的に利用できません。入力内容を保持しました。",
    modelConfigurationInvalid: "AI 接続設定を確認する必要があります。入力内容を保持しました。",
    responseInProgress:
      "回答を生成中です。次のメッセージを入力できます。送信する前に完了を待つか、生成を停止してください。",
    longWait:
      "通常より時間がかかっています。このまま待つか、停止してからもう一度送信できます。",
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
      "現在の分析位置と、問合せ全体の質問・対応記録・顧客評価を AI の参照情報として使用します",
    openInquiry: "問合せを開く",
    quickNavigation: "会話のクイックナビゲーション",
    goToMessage: "ユーザーの質問へ移動",
    navigationUserMessage: "ユーザーの発言",
    navigationAiResponse: "AI の回答",
    responsePending: "回答を待っています",
    process: "処理状況",
    processAccepted: "依頼を受け付けました",
    processPreparing: "回答を準備しています",
    processGenerating: "回答を生成しています",
    processCompleted: "回答を生成しました",
    processExpand: "処理状況を開く",
    processCollapse: "処理状況を閉じる",
    copyAnswer: "回答をコピー",
    copiedAnswer: "コピーしました",
     copyAnswerFailed: "コピーできませんでした",
     refreshAnswer: "回答を再生成",
    latestConversation: "最新の会話へ移動",
    composerHint: "Enter で送信、Shift + Enter で改行",
    defaultTitle: "新しいチャット",
    reasoning: "推理",
    speed: "速度",
  },
  "zh-CN": {
    title: "AI 助手",
    open: "打开 AI 助手",
    close: "关闭",
    maximize: "在 AI 助手页面中打开",
    newTopic: "新话题",
    quickAssistants: "快捷助手",
    subscriptions: "已订阅功能",
    subscribe: "订阅此功能",
    unsubscribe: "取消订阅",
    history: "会话历史",
    noSessions: "还没有会话",
    start: "新建话题后即可开始与 AI 对话。",
    placeholder: "输入消息",
    send: "发送",
    stopResponse: "停止生成",
    stoppingResponse: "正在停止生成",
    responseStopped: "已停止生成",
    stopFailed: "无法停止生成，请重试。",
    delete: "删除会话",
    deleteConfirm: "从历史记录中删除这个会话吗？",
    thinking: "正在思考",
    queued: "等待 AI 响应",
    preparing: "正在开始处理",
    disconnected: "正在重新连接",
    connected: "实时连接",
    ready: "待命",
    loadFailed: "无法加载会话",
    retry: "重新加载",
    failed: "无法取得回答",
    createFailed: "无法新建话题",
    sendFailed: "无法发送消息",
    resubmit: "重新向 AI 提问",
    modelUnavailable: "AI 暂时无法使用，输入内容已保留。",
    modelConfigurationInvalid: "需要检查 AI 连接设置，输入内容已保留。",
    responseInProgress:
      "正在生成回复。您可以继续输入下一条消息，发送前请等待完成或停止生成。",
    longWait: "等待时间较长。您可以继续等待，或停止生成后重新发送。",
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
      "当前分析位置以及整张工单的全部问题、处理记录和客户评价将作为 AI 的参考信息",
    openInquiry: "打开问询",
    quickNavigation: "会话快速导航",
    goToMessage: "跳转到用户提问",
    navigationUserMessage: "用户发言",
    navigationAiResponse: "AI 回复",
    responsePending: "正在等待回答",
    process: "处理状态",
    processAccepted: "已接收请求",
    processPreparing: "正在准备回答",
    processGenerating: "正在生成回答",
    processCompleted: "回答已生成",
    processExpand: "展开处理状态",
    processCollapse: "收起处理状态",
    copyAnswer: "复制回答",
    copiedAnswer: "已复制",
     copyAnswerFailed: "复制失败",
     refreshAnswer: "刷新回答",
    latestConversation: "跳转到最新会话",
    composerHint: "Enter 发送，Shift + Enter 换行",
    defaultTitle: "新对话",
    reasoning: "推理",
    speed: "速度",
  },
  "en-US": {
    title: "AI Assistant",
    open: "Open AI Assistant",
    close: "Close",
    maximize: "Open the AI Assistant page",
    newTopic: "New topic",
    quickAssistants: "Quick assistants",
    subscriptions: "Subscribed features",
    subscribe: "Subscribe to this feature",
    unsubscribe: "Unsubscribe",
    history: "Chat history",
    noSessions: "No conversations yet",
    start: "Create a topic to start chatting with AI.",
    placeholder: "Type a message",
    send: "Send",
    stopResponse: "Stop generating",
    stoppingResponse: "Stopping generation",
    responseStopped: "Generation stopped",
    stopFailed: "The response could not be stopped. Please try again.",
    delete: "Delete conversation",
    deleteConfirm: "Delete this conversation from history?",
    thinking: "Thinking",
    queued: "Waiting for AI to respond",
    preparing: "Starting processing",
    disconnected: "Reconnecting",
    connected: "Live",
    ready: "Ready",
    loadFailed: "The conversation could not be loaded",
    retry: "Reload",
    failed: "The response could not be loaded",
    createFailed: "The topic could not be created",
    sendFailed: "The message could not be sent",
    resubmit: "Ask AI again",
    modelUnavailable: "AI is temporarily unavailable. Your input was preserved.",
    modelConfigurationInvalid: "The AI connection settings need attention. Your input was preserved.",
    responseInProgress:
      "A response is being generated. You can type the next message now, then wait for completion or stop generation before sending it.",
    longWait:
      "This is taking longer than usual. You can keep waiting, or stop generation and send it again.",
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
      "The current analysis target and the ticket's full questions, support records, and customer evaluation will be used as AI reference information",
    openInquiry: "Open inquiry",
    quickNavigation: "Conversation quick navigation",
    goToMessage: "Go to user question",
    navigationUserMessage: "User message",
    navigationAiResponse: "AI response",
    responsePending: "Waiting for a response",
    process: "Process",
    processAccepted: "Request accepted",
    processPreparing: "Preparing the answer",
    processGenerating: "Generating the answer",
    processCompleted: "Answer generated",
    processExpand: "Expand process status",
    processCollapse: "Collapse process status",
    copyAnswer: "Copy answer",
    copiedAnswer: "Copied",
     copyAnswerFailed: "Copy failed",
     refreshAnswer: "Regenerate answer",
    latestConversation: "Go to the latest conversation",
    composerHint: "Enter to send, Shift + Enter for a new line",
    defaultTitle: "New chat",
    reasoning: "Reasoning",
    speed: "Speed",
  },
} as const;

function modelReasoningLabel(locale: LocaleKey, value: string) {
  const labels = {
    "ja-JP": { XHIGH: "極高", HIGH: "高", MEDIUM: "中" },
    "zh-CN": { XHIGH: "极高", HIGH: "高", MEDIUM: "中" },
    "en-US": { XHIGH: "Extra high", HIGH: "High", MEDIUM: "Medium" },
  } as const;
  return labels[locale][value as keyof typeof labels[typeof locale]] ?? value;
}

function modelSpeedLabel(locale: LocaleKey, value: string) {
  const labels = {
    "ja-JP": { FAST: "速い", MEDIUM: "標準", SLOW: "低速" },
    "zh-CN": { FAST: "快", MEDIUM: "标准", SLOW: "较慢" },
    "en-US": { FAST: "Fast", MEDIUM: "Standard", SLOW: "Slow" },
  } as const;
  return labels[locale][value as keyof typeof labels[typeof locale]] ?? value;
}

export interface AssistantReply {
  text: string;
  status:
    | "QUEUED"
    | "RUNNING"
    | "STREAMING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
}

export type AssistantProcessPhase =
  | "QUEUED"
  | "RUNNING"
  | "STREAMING"
  | "COMPLETED";

export function assistantProcessStepStates(phase: AssistantProcessPhase) {
  const current = {
    QUEUED: 0,
    RUNNING: 1,
    STREAMING: 2,
    COMPLETED: 3,
  }[phase];
  return [0, 1, 2].map((index) =>
    current > index ? "complete" : current === index ? "active" : "pending"
  );
}

export function formatAssistantElapsed(
  startedAt: string,
  completedAt: string | null,
  now = Date.now(),
) {
  const started = Date.parse(startedAt);
  const ended = completedAt ? Date.parse(completedAt) : now;
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return "";
  const seconds = Math.max(0, Math.floor((ended - started) / 1000));
  return `${seconds}s`;
}

function AssistantProcessTrace({
  phase,
  startedAt,
  completedAt,
  labels,
}: {
  phase: AssistantProcessPhase;
  startedAt: string;
  completedAt: string | null;
  labels: (typeof copy)[LocaleKey];
}) {
  const active = phase !== "COMPLETED";
  const [expanded, setExpanded] = useState(active);
  const [now, setNow] = useState(() => Date.now());
  const wasActiveRef = useRef(active);

  useEffect(() => {
    if (active) {
      setExpanded(true);
    } else if (wasActiveRef.current) {
      setExpanded(false);
    }
    wasActiveRef.current = active;
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  const states = assistantProcessStepStates(phase);
  const phaseLabel = phase === "QUEUED"
    ? labels.processAccepted
    : phase === "RUNNING"
      ? labels.processPreparing
      : phase === "STREAMING"
        ? labels.processGenerating
        : labels.processCompleted;
  const elapsed = formatAssistantElapsed(startedAt, completedAt, now);

  return (
    <div className={`ai-assistant-process ${active ? "active" : "complete"}`}>
      <button
        type="button"
        className="ai-assistant-process-summary"
        aria-expanded={expanded}
        aria-label={expanded ? labels.processCollapse : labels.processExpand}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="ai-assistant-process-indicator" aria-hidden="true" />
        <strong>{phaseLabel}</strong>
        {elapsed && <small>{elapsed}</small>}
        <DownOutlined />
      </button>
      {expanded && (
        <ol className="ai-assistant-process-steps" aria-label={labels.process}>
          {[labels.processAccepted, labels.processPreparing,
            labels.processGenerating].map((label, index) => (
            <li className={states[index]} key={label}>
              <span aria-hidden="true" />
              {label}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function AssistantAnswerActions({
  answer,
  labels,
  elapsed,
  onRefresh,
}: {
  answer: string;
  labels: (typeof copy)[LocaleKey];
  elapsed: string;
  onRefresh: () => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const label = copyState === "copied"
    ? labels.copiedAnswer
    : copyState === "failed"
      ? labels.copyAnswerFailed
      : labels.copyAnswer;

  return (
    <div className="ai-assistant-answer-actions">
      {elapsed && <small className="ai-assistant-answer-elapsed">{elapsed}</small>}
      <Tooltip title={labels.refreshAnswer} zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}>
        <Button type="text" size="small" icon={<ReloadOutlined />} aria-label={labels.refreshAnswer} onClick={onRefresh} />
      </Tooltip>
      <Tooltip title={label} zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}>
        <Button
          type="text"
          size="small"
          icon={copyState === "copied" ? <CheckOutlined /> : <CopyOutlined />}
          aria-label={label}
          onClick={() => {
            void navigator.clipboard.writeText(answer)
              .then(() => setCopyState("copied"))
              .catch(() => setCopyState("failed"));
          }}
        >
          {label}
        </Button>
      </Tooltip>
    </div>
  );
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

export function reduceAiAssistantReply(
  current: AssistantReply | undefined,
  event: AiAssistantEvent,
): AssistantReply | undefined {
  if (!event.taskId) return current;
  if (event.type === "task.created") {
    return { text: current?.text ?? "", status: "QUEUED" };
  }
  if (event.type === "task.started") {
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
  if (event.type === "task.cancelled") {
    return {
      text: current?.text ?? "",
      status: "CANCELLED",
    };
  }
  if (event.type === "task.failed") {
    return {
      text: current?.text ?? "",
      status: "FAILED",
    };
  }
  if (event.type === "task.completed" && current) {
    return { ...current, status: "COMPLETED" };
  }
  return current;
}

export function aiAssistantSendErrorMessage(
  locale: LocaleKey,
  error: unknown,
) {
  const code = String((error as { code?: string } | null)?.code ?? "");
  const text = copy[locale];
  if (code === "AI_ASSISTANT_RESPONSE_IN_PROGRESS") {
    return text.responseInProgress;
  }
  if (
    code === "AI_ASSISTANT_CONFIGURATION_REQUIRED" ||
    code === "AI_ASSISTANT_MODEL_AUTH_FAILED" ||
    code === "AI_ASSISTANT_MODEL_NOT_FOUND"
  ) {
    return text.modelConfigurationInvalid;
  }
  if (
    code === "AI_ASSISTANT_MODEL_RATE_LIMITED" ||
    code === "AI_ASSISTANT_MODEL_HTTP_ERROR" ||
    code === "AI_ASSISTANT_MODEL_REQUEST_FAILED" ||
    code === "AI_ASSISTANT_MODEL_TIMEOUT" ||
    code === "AI_ASSISTANT_MODEL_STREAM_INVALID" ||
    code === "AI_ASSISTANT_MODEL_STREAM_TOO_LARGE" ||
    code === "AI_ASSISTANT_MODEL_STREAM_INCOMPLETE" ||
    code === "AI_ASSISTANT_MODEL_RESPONSE_FAILED" ||
    code === "AI_ASSISTANT_MODEL_RESPONSE_INCOMPLETE" ||
    code === "AI_ASSISTANT_MODEL_RESPONSE_EMPTY"
  ) {
    return text.modelUnavailable;
  }
  return text.sendFailed;
}

function fallbackReply(task: Pick<AiAssistantTask, "final_report">) {
  const summary = task.final_report?.summary;
  return typeof summary === "string" ? summary : "";
}

function activeAssistantTask(task: AiAssistantTask) {
  return !["completed", "failed", "cancelled"].includes(
    String(task.status).toLowerCase(),
  );
}

export function aiAssistantComposerState(
  tasks: ReadonlyArray<{ status: string }>,
  requestPending: boolean,
  detailReady: boolean,
  stopPending = false,
) {
  const responseActive = requestPending || stopPending || tasks.some(
    (task) =>
      !["completed", "failed", "cancelled"].includes(
        String(task.status).toLowerCase(),
      ),
  );
  return {
    responseActive,
    composerInputDisabled: !detailReady,
    attachmentLocked: !detailReady || responseActive,
    submissionBlocked: !detailReady || responseActive,
  };
}

interface AssistantStopOperation {
  sessionId: string;
  taskId: string;
  attemptId: number;
  phase: "REQUESTING" | "AWAITING_TERMINAL";
}

export function reconcileAiAssistantReply(
  current: AssistantReply | undefined,
  task: Pick<AiAssistantTask, "status" | "error" | "final_report">,
): AssistantReply | undefined {
  const status = String(task.status).toLowerCase();
  const terminalStatus = status === "completed"
    ? "COMPLETED"
    : status === "failed"
      ? "FAILED"
      : status === "cancelled"
        ? "CANCELLED"
        : "";
  if (!terminalStatus) return current;
  const finalReport = fallbackReply(task);
  if (
    current &&
    ["COMPLETED", "FAILED", "CANCELLED"].includes(current.status)
  ) {
    if (
      current.status === "COMPLETED" &&
      terminalStatus === "COMPLETED" &&
      finalReport &&
      finalReport !== current.text
    ) {
      return { ...current, text: finalReport };
    }
    return current;
  }
  return {
    text: terminalStatus === "COMPLETED"
      ? finalReport || current?.text || task.error || ""
      : terminalStatus === "FAILED"
        ? current?.text || ""
        : current?.text || finalReport || "",
    status: terminalStatus,
  } as AssistantReply;
}

export function reconcileAiAssistantReplies(
  current: Readonly<Record<string, AssistantReply>>,
  tasks: ReadonlyArray<
    Pick<AiAssistantTask, "id" | "status" | "error" | "final_report">
  >,
  pendingTerminalTaskIds: ReadonlySet<string> = new Set(),
) {
  let changed = false;
  const next = { ...current };
  for (const task of tasks) {
    if (pendingTerminalTaskIds.has(task.id)) continue;
    const reply = current[task.id];
    const reconciled = reconcileAiAssistantReply(reply, task);
    if (
      reconciled &&
      (!reply ||
        reconciled.status !== reply.status ||
        reconciled.text !== reply.text)
    ) {
      next[task.id] = reconciled;
      changed = true;
    }
  }
  return changed ? next : current;
}

export function aiAssistantStopErrorKey(sessionId: string, taskId: string) {
  return `${sessionId}:${taskId}`;
}

function terminalAssistantTaskStatus(
  eventType: string,
): AiAssistantTask["status"] | null {
  if (eventType === "task.completed") return "completed";
  if (eventType === "task.failed") return "failed";
  if (eventType === "task.cancelled") return "cancelled";
  return null;
}

export async function optimisticallyRemoveAiAssistantSession(
  queryClient: QueryClient,
  userId: string,
  sessionId: string,
  fallbackSessions: AiAssistantSession[],
) {
  const sessionsKey = ["ai-assistant-sessions", userId] as const;
  await Promise.all([
    queryClient.cancelQueries({ queryKey: sessionsKey }),
    queryClient.cancelQueries({
      queryKey: ["ai-assistant-session", userId, sessionId],
    }),
  ]);
  const previousSessions =
    queryClient.getQueryData<AiAssistantSession[]>(sessionsKey) ??
    fallbackSessions;
  const remainingSessions = previousSessions.filter(
    (session) => session.id !== sessionId,
  );
  queryClient.setQueryData(sessionsKey, remainingSessions);
  return { previousSessions, remainingSessions };
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

interface AssistantTitleRouting {
  taskClass?: string;
  targetLanguage?: string | null;
}

const titleLanguages = [
  {
    code: "ja",
    pattern: /日文|日语|日語|日本語|japanese/i,
    zh: "日文",
    ja: "日本語",
    en: "Japanese",
  },
  {
    code: "zh",
    pattern: /中文|汉语|漢語|中国語|chinese/i,
    zh: "中文",
    ja: "中国語",
    en: "Chinese",
  },
  {
    code: "en",
    pattern: /英文|英语|英語|english/i,
    zh: "英文",
    ja: "英語",
    en: "English",
  },
  {
    code: "ko",
    pattern: /韩文|韓文|韩语|韓語|韓国語|korean/i,
    zh: "韩文",
    ja: "韓国語",
    en: "Korean",
  },
] as const;

function titleLocale(prompt: string) {
  if (/翻译|翻譯|摘要|总结|總結|请|請|对话|對話/.test(prompt)) return "zh";
  if (/翻訳|要約|してください|会話|調査/.test(prompt)) return "ja";
  return "en";
}

function titleLanguage(
  value: string,
  locale: "zh" | "ja" | "en",
  fallbackCode?: string | null,
) {
  const detected = titleLanguages
    .map((language) => ({
      language,
      index: value.search(language.pattern),
    }))
    .filter((candidate) => candidate.index >= 0)
    .sort((left, right) => left.index - right.index)[0]?.language;
  const fallback = titleLanguages.find((language) => language.code === fallbackCode);
  return (detected ?? fallback)?.[locale] ?? "";
}

function titleContentType(value: string, locale: "zh" | "ja" | "en") {
  const definitions = [
    { pattern: /对话|對話|会話|conversation|dialogue/i, zh: "对话", ja: "会話", en: "conversation" },
    { pattern: /邮件|郵件|メール|email/i, zh: "邮件", ja: "メール", en: "email" },
    { pattern: /工单|工單|問合せ|ticket/i, zh: "工单", ja: "問合せ", en: "ticket" },
    { pattern: /文档|文件|文書|document/i, zh: "文档", ja: "文書", en: "document" },
    { pattern: /代码|程式|コード|code/i, zh: "代码", ja: "コード", en: "code" },
    { pattern: /文章|文本|句子|内容|內容|本文|text|sentence/i, zh: "内容", ja: "内容", en: "content" },
  ] as const;
  return definitions.find((definition) => definition.pattern.test(value))?.[locale]
    ?? (locale === "zh" ? "内容" : locale === "ja" ? "内容" : "content");
}

function translationTopicTitle(
  prompt: string,
  routing?: AssistantTitleRouting | null,
) {
  const action = prompt.match(/翻译|翻譯|翻訳|translate/i);
  if (!action && routing?.taskClass !== "TRANSLATION") return "";
  const locale = titleLocale(prompt);
  const actionIndex = action?.index ?? prompt.length;
  const beforeAction = prompt.slice(0, actionIndex);
  const afterAction = prompt.slice(actionIndex + (action?.[0].length ?? 0));
  const source = titleLanguage(beforeAction, locale);
  const target = titleLanguage(afterAction, locale, routing?.targetLanguage);
  const contentType = titleContentType(beforeAction || prompt, locale);
  if (locale === "zh") {
    return `${source}${contentType}翻译为${target || "目标语言"}`;
  }
  if (locale === "ja") {
    return `${source}${contentType}の${target || "指定言語"}翻訳`;
  }
  return `${source ? `${source} ` : ""}${contentType} translation to ${target || "target language"}`;
}

function classifiedTopicTitle(prompt: string, routing?: AssistantTitleRouting | null) {
  const locale = titleLocale(prompt);
  const contentType = titleContentType(prompt, locale);
  const taskClass = routing?.taskClass ?? "";
  if (/要約|摘要|总结|總結|summari[sz]e/i.test(prompt) || taskClass === "SUMMARIZATION") {
    return locale === "zh"
      ? `${contentType}摘要`
      : locale === "ja"
        ? `${contentType}要約`
        : `${contentType} summary`;
  }
  if (/分析|解析|調査|调查|調べ|investigat|analy[sz]e/i.test(prompt) || ["COMPLEX_ANALYSIS", "INQUIRY_ANALYSIS"].includes(taskClass)) {
    return locale === "zh"
      ? `${contentType}分析`
      : locale === "ja"
        ? `${contentType}分析`
        : `${contentType} analysis`;
  }
  const classificationRequested = taskClass === "CLASSIFICATION"
    || /^(?:分類|分类|classif)/i.test(prompt.trim())
    || /^(?:请|請)(?:将|將|把).*(?:分類|分类)/i.test(prompt.trim());
  if (classificationRequested) {
    return locale === "zh"
      ? `${contentType}分类`
      : locale === "ja"
        ? `${contentType}分類`
        : `${contentType} classification`;
  }
  return "";
}

export function summarizeAssistantTitle(
  prompt: string,
  inquiryContext?: AiAssistantInquiryContext | null,
  routing?: AssistantTitleRouting | null,
) {
  const normalized = prompt
    .replace(/^[#>*\s-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (inquiryContext) {
    const firstSentence =
      normalized.split(/[。！？!?]/, 1)[0]?.trim() || normalized;
    return `${inquiryContext.ticketNo} ${firstSentence}`;
  }
  const instruction = normalized.split(/[：:\n]/, 1)[0]?.trim() || normalized;
  const translationTitle = translationTopicTitle(instruction, routing);
  if (translationTitle) return translationTitle;
  const classifiedTitle = classifiedTopicTitle(instruction, routing);
  if (classifiedTitle) return classifiedTitle;
  const locale = titleLocale(instruction);
  return locale === "zh" ? "一般咨询" : locale === "ja" ? "一般相談" : "General inquiry";
}

export interface AssistantInquiryReference
  extends AiAssistantInquiryContext {
  active: boolean;
  used: boolean;
}

function inquiryContextKey(context: AiAssistantInquiryContext) {
  return context.ticketNo;
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
  const localizedField = locale === "zh-CN"
    ? "zh"
    : locale === "en-US"
      ? "en"
      : "ja";
  const queryClient = useQueryClient();
  const storagePrefix = `oneops.ai-assistant.${userId}`;
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedId, setSelectedId] = useState(
    () => localStorage.getItem(`${storagePrefix}.session`) ?? "",
  );
  const [sessionInputs, setSessionInputs] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState(false);
  const [replies, setReplies] = useState<Record<string, AssistantReply>>({});
  const [taskStartedAt, setTaskStartedAt] = useState<Record<string, string>>({});
  const [taskFinishedAt, setTaskFinishedAt] = useState<Record<string, string>>({});
  const [replacedTaskIds, setReplacedTaskIds] = useState<Record<string, string>>({});
  const [suppressedTaskIds, setSuppressedTaskIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [activeNavigationId, setActiveNavigationId] = useState("");
  const [hoveredNavigationId, setHoveredNavigationId] = useState("");
  const [focusedNavigationId, setFocusedNavigationId] = useState("");
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [deleteCandidate, setDeleteCandidate] =
    useState<AiAssistantSession | null>(null);
  const [shortcutMenuOpen, setShortcutMenuOpen] = useState(false);
  const [subscribedShortcutIds, setSubscribedShortcutIds] = useState<string[]>(
    () => {
      try {
        const raw = localStorage.getItem(`${storagePrefix}.shortcut-subscriptions`);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === "string")
          : [];
      } catch {
        return [];
      }
    },
  );
  const [sendingSessionIds, setSendingSessionIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [stopOperations, setStopOperations] = useState<
    ReadonlyMap<string, AssistantStopOperation>
  >(() => new Map());
  const [stopFailureKeys, setStopFailureKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileDragDepthRef = useRef(0);
  const conversationRef = useRef<HTMLDivElement>(null);
  const followLatestRef = useRef(true);
  const shortcutContainerRef = useRef<HTMLDivElement>(null);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
  const replySequencesRef = useRef<Record<string, number>>({});
  const selectedIdRef = useRef(selectedId);
  const attachmentLockedRef = useRef(true);
  const submissionBlockedRef = useRef(true);
  const sendingSessionIdsRef = useRef(new Set<string>());
  const stopOperationsRef = useRef(new Map<string, AssistantStopOperation>());
  const stopAttemptSequenceRef = useRef(0);
  const autoCreatedContextRef = useRef("");
  const creatingInquirySessionRef = useRef(false);
  selectedIdRef.current = selectedId;
  const visible = mode === "page" || open;
  const composerSessionId = selectedId || (
    inquiryContext?.ticketNo ? `inquiry:${inquiryContext.ticketNo}` : ""
  );
  const input = sessionInputs[composerSessionId] ?? "";

  const updateSessionInput = (
    sessionId: string,
    updater: string | ((current: string) => string),
  ) => {
    if (!sessionId) return;
    setSessionInputs((current) => {
      const currentValue = current[sessionId] ?? "";
      const nextValue = typeof updater === "function"
        ? updater(currentValue)
        : updater;
      return nextValue === currentValue
        ? current
        : { ...current, [sessionId]: nextValue };
    });
  };

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
    setShowScrollToLatest(false);
    followLatestRef.current = true;
    fileDragDepthRef.current = 0;
  }, [selectedId]);

  const addFiles = (files: File[]) => {
    if (attachmentLockedRef.current || !selectedId || !files.length) return;
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
    if (attachmentLockedRef.current) return;
    updatePendingAttachments((current) =>
      current.filter((candidate) => candidate.localId !== item.localId),
    );
    if (item.attachment && selectedId) {
      void deleteAiAssistantAttachment(selectedId, item.attachment.id).catch(
        () => {},
      );
    }
  };

  const sessionsQuery = useQuery({
    queryKey: ["ai-assistant-sessions", userId],
    queryFn: ({ signal }) => listAiAssistantSessions(false, signal),
    enabled: visible,
  });
  const sessions = sessionsQuery.data ?? [];
  const shortcutsQuery = useQuery({
    queryKey: ["ai-assistant-shortcuts", "public"],
    queryFn: listAiAssistantShortcuts,
    enabled: visible,
  });

  useEffect(() => {
    if (!visible || sessionsQuery.isLoading) return;
    if (selectedId && sessions.some((session) => session.id === selectedId)) {
      return;
    }
    setSelectedId(sessions[0]?.id ?? "");
  }, [selectedId, sessions, sessionsQuery.isLoading, visible]);

  const detailQuery = useQuery({
    queryKey: ["ai-assistant-session", userId, selectedId],
    queryFn: ({ signal }) => fetchAiAssistantSession(selectedId, signal),
    enabled: visible && Boolean(selectedId),
    retry: false,
  });
  const rawTasks = [...(detailQuery.data?.tasks ?? [])].sort((left, right) =>
    String(left.created_at).localeCompare(String(right.created_at)),
  );
  const tasks = rawTasks.flatMap((task) => {
    if (suppressedTaskIds.has(task.id)) return [];
    const replacementId = replacedTaskIds[task.id];
    if (!replacementId) return [task];
    const replacement = rawTasks.find((candidate) => candidate.id === replacementId);
    return replacement ? [replacement] : [task];
  }).filter((task, index, all) =>
    all.findIndex((candidate) => candidate.id === task.id) === index,
  );
  const activeTaskId = [...tasks].reverse().find(activeAssistantTask)?.id ?? "";
  const selectedStopOperation = [...stopOperations.values()].reverse().find(
    (operation) => operation.sessionId === selectedId,
  );
  const pendingStopTaskIds = useMemo(
    () => new Set(
      [...stopOperations.values()].map((operation) => operation.taskId),
    ),
    [stopOperations],
  );
  const liveTaskId = selectedStopOperation?.taskId || activeTaskId;
  const reconciledReplies = reconcileAiAssistantReplies(
    replies,
    tasks,
    pendingStopTaskIds,
  );

  const handleAiAssistantEvent = useCallback((
    sessionId: string,
    subscribedTaskId: string,
    event: AiAssistantEvent,
  ) => {
    const taskId = event.taskId || subscribedTaskId;
    if (taskId !== subscribedTaskId) return;
    const taskKey = aiAssistantStopErrorKey(sessionId, taskId);
    const previousSequence = replySequencesRef.current[taskKey] ?? 0;
    if (event.sequence > 0 && event.sequence <= previousSequence) return;
    if (event.sequence > 0) {
      replySequencesRef.current[taskKey] = event.sequence;
    }
    setReplies((current) => {
      const next = reduceAiAssistantReply(current[taskId], {
        ...event,
        taskId,
      });
      return next ? { ...current, [taskId]: next } : current;
    });
    if (
      event.type !== "task.completed" &&
      event.type !== "task.failed" &&
      event.type !== "task.cancelled"
    ) return;

    if (stopOperationsRef.current.delete(taskKey)) {
      setStopOperations(new Map(stopOperationsRef.current));
    }
    setStopFailureKeys((current) => {
      if (!current.has(taskKey)) return current;
      const next = new Set(current);
      next.delete(taskKey);
      return next;
    });
    const terminalStatus = terminalAssistantTaskStatus(event.type);
    if (!terminalStatus) return;
    setTaskFinishedAt((current) => ({
      ...current,
      [taskId]: new Date().toISOString(),
    }));
    queryClient.setQueryData<AiAssistantSessionDetail>(
      ["ai-assistant-session", userId, sessionId],
      (current) => current
        ? {
            ...current,
            tasks: current.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status: terminalStatus,
                    completed_at: event.timestamp || task.completed_at,
                  }
                : task,
            ),
          }
        : current,
    );
    void queryClient.invalidateQueries({
      queryKey: ["ai-assistant-session", userId, sessionId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["ai-assistant-sessions", userId],
    });
  }, [queryClient, userId]);

  useEffect(() => {
    setConnected(false);
    if (!visible || !selectedId || !liveTaskId) return;
    const taskKey = aiAssistantStopErrorKey(selectedId, liveTaskId);
    const source = subscribeAiAssistantTaskEvents(
      selectedId,
      liveTaskId,
      (event) => handleAiAssistantEvent(selectedId, liveTaskId, event),
      replySequencesRef.current[taskKey] ?? 0,
      setConnected,
    );
    return () => source.close();
  }, [
    handleAiAssistantEvent,
    liveTaskId,
    selectedId,
    visible,
  ]);

  const backgroundStopOperations = useMemo(
    () => [...stopOperations.values()].filter((operation) =>
      !(
        visible &&
        operation.sessionId === selectedId &&
        operation.taskId === liveTaskId
      )
    ),
    [liveTaskId, selectedId, stopOperations, visible],
  );

  useEffect(() => {
    const sources = backgroundStopOperations.map((operation) => {
      const taskKey = aiAssistantStopErrorKey(
        operation.sessionId,
        operation.taskId,
      );
      return subscribeAiAssistantTaskEvents(
        operation.sessionId,
        operation.taskId,
        (event) => handleAiAssistantEvent(
          operation.sessionId,
          operation.taskId,
          event,
        ),
        replySequencesRef.current[taskKey] ?? 0,
        () => {},
      );
    });
    return () => {
      for (const source of sources) source.close();
    };
  }, [backgroundStopOperations, handleAiAssistantEvent]);

  const createMutation = useMutation({
    mutationFn: ({
      shortcut,
      inquiryTicketNo,
    }: {
      shortcut?: AiAssistantShortcut;
      inquiryTicketNo?: string;
    }) =>
      createAiAssistantSession(
        shortcut?.name[localizedField] ?? text.defaultTitle,
        shortcut?.id,
        inquiryTicketNo,
      ),
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
  useEffect(() => {
    const ticketNo = inquiryContext?.ticketNo.trim() ?? "";
    if (!visible || sessionsQuery.isLoading || createMutation.isPending) return;
    if (ticketNo) {
      const matching = sessions.find(
        (session) => session.inquiryTicketNo === ticketNo,
      );
      if (matching) {
        autoCreatedContextRef.current = `${userId}:${ticketNo}`;
        setSelectedId(matching.id);
        return;
      }
      const contextKey = `${userId}:${ticketNo}`;
      autoCreatedContextRef.current = contextKey;
      setSelectedId("");
      return;
    }
    if (selectedId || sessions.length) return;
    const contextKey = `${userId}:default`;
    if (autoCreatedContextRef.current === contextKey) return;
    autoCreatedContextRef.current = contextKey;
    createMutation.mutate({});
  }, [
    createMutation.isPending,
    inquiryContext?.ticketNo,
    selectedId,
    sessions,
    sessionsQuery.isLoading,
    userId,
    visible,
  ]);
  const shortcutsById = useMemo(
    () => new Map(
      (shortcutsQuery.data ?? []).flatMap((category) =>
        category.shortcuts.map((shortcut) => [shortcut.id, shortcut] as const)
      ),
    ),
    [shortcutsQuery.data],
  );
  const shortcutMenuItems: MenuProps["items"] = (
    shortcutsQuery.data ?? []
  ).map((category) => ({
    key: category.id,
    label: category.name[localizedField],
    children: category.shortcuts.map((shortcut) => ({
      key: shortcut.id,
      label: (
        <span className="ai-assistant-shortcut-menu-item">
          <strong className="ai-assistant-shortcut-menu-title">
            {shortcut.name[localizedField]}
            <button
              type="button"
              className={`ai-assistant-shortcut-subscribe${subscribedShortcutIds.includes(shortcut.id) ? " subscribed" : ""}`}
              aria-label={subscribedShortcutIds.includes(shortcut.id) ? text.unsubscribe : text.subscribe}
              title={subscribedShortcutIds.includes(shortcut.id) ? text.unsubscribe : text.subscribe}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleShortcutSubscription(shortcut);
              }}
            >
              {subscribedShortcutIds.includes(shortcut.id) ? <StarFilled /> : <StarOutlined />}
            </button>
          </strong>
          <small>{shortcut.description[localizedField]}</small>
        </span>
      ),
    })),
  }));
  const shortcutMenu: MenuProps = {
    items: shortcutMenuItems,
    getPopupContainer: () => shortcutContainerRef.current as HTMLElement,
    onClick: ({ key }: { key: string }) => {
      const shortcut = shortcutsById.get(key);
      if (shortcut) {
        setShortcutMenuOpen(false);
        createMutation.mutate({ shortcut });
      }
    },
  };
  const shortcutTrigger = (
    <Dropdown
      menu={shortcutMenu}
      trigger={["hover", "click"]}
      open={shortcutMenuOpen}
      onOpenChange={setShortcutMenuOpen}
      placement="bottomRight"
      getPopupContainer={(triggerNode) => triggerNode.parentElement as HTMLElement}
      classNames={{ root: "ai-assistant-shortcut-dropdown" }}
      disabled={!shortcutMenuItems.length}
    >
      <Button
        className="ai-assistant-shortcut-trigger"
        type="text"
        icon={<DoubleRightOutlined />}
        aria-label={text.quickAssistants}
        loading={shortcutsQuery.isLoading}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setShortcutMenuOpen(false);
            return;
          }
          if (["Enter", " ", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
            setShortcutMenuOpen(true);
          }
        }}
      />
    </Dropdown>
  );

  const sendMutation = useMutation({
    mutationFn: async ({
      sessionId,
      prompt,
      context,
      attachments,
    }: {
      sessionId: string;
      prompt: string;
      context: AiAssistantInquiryContext | null;
      attachments: AiAssistantAttachment[];
      isFirstTask: boolean;
      clientStartedAt: string;
      replacesTaskId?: string;
    }) => {
      return sendAiAssistantMessage(
        sessionId,
        prompt,
        context,
        attachments.map((attachment) => attachment.id),
      );
    },
    onSuccess: async (task, variables) => {
      if (variables.replacesTaskId) {
        setReplacedTaskIds((current) => ({
          ...current,
          [variables.replacesTaskId!]: task.id,
        }));
      }
      setTaskStartedAt((current) => ({
        ...current,
        [task.id]: variables.clientStartedAt,
      }));
      queryClient.setQueryData<AiAssistantSessionDetail>(
        ["ai-assistant-session", userId, variables.sessionId],
        (current) =>
          current
            ? {
                ...current,
                tasks: variables.replacesTaskId
                  ? current.tasks.map((candidate) =>
                      candidate.id === variables.replacesTaskId ? task : candidate,
                    )
                  : current.tasks.some((candidate) => candidate.id === task.id)
                    ? current.tasks.map((candidate) =>
                        candidate.id === task.id ? task : candidate,
                      )
                    : [...current.tasks, task],
              }
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
      if (selectedIdRef.current === variables.sessionId) {
        const sentIds = new Set(
          variables.attachments.map((attachment) => attachment.id),
        );
        updatePendingAttachments((current) =>
          current.filter(
            (item) => !item.attachment || !sentIds.has(item.attachment.id),
          ),
        );
      }
      const currentSession = (
        queryClient.getQueryData<AiAssistantSession[]>([
          "ai-assistant-sessions",
          userId,
        ]) ?? sessions
      ).find((session) => session.id === variables.sessionId);
      if (
        currentSession &&
        variables.isFirstTask &&
        [text.defaultTitle, "新しいチャット"].includes(currentSession.title)
      ) {
        const title = summarizeAssistantTitle(
          variables.prompt,
          variables.context,
          task.routing as AssistantTitleRouting | undefined,
        );
        try {
          const renamed = await renameAiAssistantSession(
            variables.sessionId,
            title,
          );
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
    onError: (error, variables) => {
      updateSessionInput(
        variables.sessionId,
        (current) => current || variables.prompt,
      );
      void message.error(aiAssistantSendErrorMessage(locale, error));
    },
    onSettled: (_task, _error, variables) => {
      sendingSessionIdsRef.current.delete(variables.sessionId);
      setSendingSessionIds(new Set(sendingSessionIdsRef.current));
    },
  });

  const stopMutation = useMutation({
    mutationFn: ({ sessionId, taskId }: AssistantStopOperation) =>
      cancelAiAssistantTask(sessionId, taskId),
    onSuccess: (_result, variables) => {
      const taskKey = aiAssistantStopErrorKey(
        variables.sessionId,
        variables.taskId,
      );
      const current = stopOperationsRef.current.get(taskKey);
      if (!current || current.attemptId !== variables.attemptId) return;
      const awaitingTerminal = {
        ...current,
        phase: "AWAITING_TERMINAL" as const,
      };
      stopOperationsRef.current.set(taskKey, awaitingTerminal);
      setStopOperations(new Map(stopOperationsRef.current));
    },
    onError: (_error, variables) => {
      const taskKey = aiAssistantStopErrorKey(
        variables.sessionId,
        variables.taskId,
      );
      const current = stopOperationsRef.current.get(taskKey);
      if (!current || current.attemptId !== variables.attemptId) return;
      stopOperationsRef.current.delete(taskKey);
      setStopOperations(new Map(stopOperationsRef.current));
      setStopFailureKeys((keys) => new Set(keys).add(taskKey));
    },
  });

  const selectedSendPending = sendingSessionIds.has(selectedId) || (
    sendMutation.isPending && sendMutation.variables?.sessionId === selectedId
  );
  const subscribedShortcuts = useMemo(
    () => subscribedShortcutIds
      .map((id) => shortcutsById.get(id))
      .filter((shortcut): shortcut is AiAssistantShortcut => Boolean(shortcut)),
    [shortcutsById, subscribedShortcutIds],
  );
  const toggleShortcutSubscription = (shortcut: AiAssistantShortcut) => {
    setSubscribedShortcutIds((current) => {
      const next = current.includes(shortcut.id)
        ? current.filter((id) => id !== shortcut.id)
        : [...current, shortcut.id];
      localStorage.setItem(
        `${storagePrefix}.shortcut-subscriptions`,
        JSON.stringify(next),
      );
      return next;
    });
  };
  const selectedStopPending = Boolean(
    liveTaskId && stopOperations.has(
      aiAssistantStopErrorKey(selectedId, liveTaskId),
    ),
  );
  const {
    responseActive,
    composerInputDisabled,
    attachmentLocked,
    submissionBlocked,
  } = aiAssistantComposerState(
    tasks,
    selectedSendPending,
    detailQuery.isSuccess || Boolean(inquiryContext),
    selectedStopPending,
  );
  attachmentLockedRef.current = attachmentLocked;
  submissionBlockedRef.current = submissionBlocked;

  useEffect(() => {
    if (!attachmentLocked) return;
    fileDragDepthRef.current = 0;
    setDraggingFiles(false);
  }, [attachmentLocked]);

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) =>
      deleteAiAssistantSession(sessionId),
    onMutate: async (sessionId) => {
      const { previousSessions, remainingSessions } =
        await optimisticallyRemoveAiAssistantSession(
          queryClient,
          userId,
          sessionId,
          sessions,
        );
      const previousSelectedId = selectedId;
      if (selectedId === sessionId) {
        setSelectedId(remainingSessions[0]?.id ?? "");
      }
      setShowHistory(Boolean(remainingSessions.length));
      return { previousSessions, previousSelectedId };
    },
    onSuccess: (_, deletedId) => {
      setDeleteCandidate(null);
      queryClient.removeQueries({
        queryKey: ["ai-assistant-session", userId, deletedId],
      });
    },
    onError: (_error, _deletedId, context) => {
      queryClient.setQueryData(
        ["ai-assistant-sessions", userId],
        context?.previousSessions ?? sessions,
      );
      if (context?.previousSelectedId) {
        setSelectedId(context.previousSelectedId);
      }
      setShowHistory(Boolean((context?.previousSessions ?? sessions).length));
      void message.error(text.deleteFailed);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["ai-assistant-sessions", userId],
      });
    },
  });

  const navigationItems = useMemo<AssistantNavigationItem[]>(
    () =>
      tasks.map((task) => {
        const reply = reconciledReplies[task.id];
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
              : reply?.status === "CANCELLED" ||
                  String(task.status).toLowerCase() === "cancelled"
                ? text.responseStopped
              : text.responsePending,
          ),
        };
      }),
    [reconciledReplies, tasks, text],
  );
  const navigationIds = navigationItems.map((item) => item.id).join("|");
  const hoveredNavigationIndex = navigationItems.findIndex(
    (item) => item.id === (hoveredNavigationId || focusedNavigationId),
  );
  const inquiryReferences = useMemo(
    () => assistantInquiryReferences(tasks, inquiryContext),
    [inquiryContext, tasks],
  );

  useEffect(() => {
    const container = conversationRef.current;
    if (!container || !followLatestRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [replies, selectedId, tasks.length]);

  useEffect(() => {
    const availableIds = navigationIds ? navigationIds.split("|") : [];
    if (!availableIds.includes(activeNavigationId)) {
      setActiveNavigationId("");
    }
    setHoveredNavigationId("");
  }, [activeNavigationId, navigationIds, selectedId]);

  useEffect(() => {
    setFocusedNavigationId("");
  }, [navigationIds, selectedId]);

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

  const submitMessage = ({
    prompt,
    context,
    attachments,
    isFirstTask,
    sessionId: requestedSessionId,
    replacesTaskId,
    clientStartedAt = new Date().toISOString(),
  }: {
    prompt: string;
    context: AiAssistantInquiryContext | null;
    attachments: AiAssistantAttachment[];
    isFirstTask: boolean;
    sessionId?: string;
    replacesTaskId?: string;
    clientStartedAt?: string;
  }) => {
    const sessionId = requestedSessionId ?? selectedId;
    if (
      !prompt ||
      !sessionId ||
      submissionBlockedRef.current ||
      sendingSessionIdsRef.current.has(sessionId)
    ) return;
    submissionBlockedRef.current = true;
    sendingSessionIdsRef.current.add(sessionId);
    setSendingSessionIds(new Set(sendingSessionIdsRef.current));
    sendMutation.mutate({
      sessionId,
      prompt,
      context,
      attachments,
      isFirstTask,
      clientStartedAt,
      replacesTaskId,
    });
  };
  const send = async () => {
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
      submissionBlockedRef.current ||
      pendingAttachments.some((item) => item.status === "UPLOADING")
    ) return;
    if (creatingInquirySessionRef.current) return;
    let sessionId = selectedId;
    if (!sessionId && inquiryContext?.ticketNo.trim()) {
      creatingInquirySessionRef.current = true;
      try {
        const session = await createMutation.mutateAsync({
          inquiryTicketNo: inquiryContext.ticketNo.trim(),
        });
        sessionId = session.id;
      } catch {
        return;
      } finally {
        creatingInquirySessionRef.current = false;
      }
    }
    if (!sessionId || sendingSessionIdsRef.current.has(sessionId)) return;
    updateSessionInput(sessionId, "");
    submitMessage({
      prompt,
      context: inquiryContext ?? null,
      attachments,
      isFirstTask: tasks.length === 0,
      sessionId,
    });
  };
  const resubmitFailedTask = (task: AiAssistantTask) => {
    const taskIndex = tasks.findIndex((candidate) => candidate.id === task.id);
    if (taskIndex >= 0) {
      setSuppressedTaskIds(new Set(
        tasks.slice(taskIndex + 1).map((candidate) => candidate.id),
      ));
    }
    const clientStartedAt = new Date().toISOString();
    setTaskStartedAt((current) => ({ ...current, [task.id]: clientStartedAt }));
    setReplies((current) => ({
      ...current,
      [task.id]: { text: "", status: "QUEUED" },
    }));
    submitMessage({
      prompt: task.prompt,
      context: task.inquiryContext ?? null,
      attachments: task.attachments ?? [],
      isFirstTask: false,
      replacesTaskId: task.id,
      clientStartedAt,
    });
  };
  const stopResponse = () => {
    const sessionId = selectedId;
    const taskId = liveTaskId;
    if (!sessionId || !taskId) return;
    const taskKey = aiAssistantStopErrorKey(sessionId, taskId);
    if (stopOperationsRef.current.has(taskKey)) return;
    setStopFailureKeys((current) => {
      if (!current.has(taskKey)) return current;
      const next = new Set(current);
      next.delete(taskKey);
      return next;
    });
    const operation: AssistantStopOperation = {
      sessionId,
      taskId,
      attemptId: ++stopAttemptSequenceRef.current,
      phase: "REQUESTING",
    };
    stopOperationsRef.current.set(taskKey, operation);
    setStopOperations(new Map(stopOperationsRef.current));
    stopMutation.mutate(operation);
  };
  const pageMode = mode === "page";
  const connectionReady = detailQuery.isSuccess && (!liveTaskId || connected);
  const connectionLabel = liveTaskId
    ? connected ? text.connected : text.disconnected
    : detailQuery.isSuccess ? text.ready : text.disconnected;

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
            if (attachmentLocked) {
              event.dataTransfer.dropEffect = "none";
              return;
            }
            fileDragDepthRef.current += 1;
            setDraggingFiles(true);
          }}
          onDragOver={(event) => {
            if (!transferContainsFiles(event.dataTransfer)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = attachmentLocked
              ? "none"
              : "copy";
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
            if (attachmentLocked) return;
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
                <small className={connectionReady ? "connected" : ""}>
                  <span />
                  {connectionLabel}
                </small>
              </div>
            </div>
            {!pageMode && (
              <div className="ai-assistant-header-actions">
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
              </div>
            )}
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
                      {" · "}No. {reference.ticketNo}
                    </strong>
                    <span>{reference.ticketTitle}</span>
                  </div>
                  {onOpenInquiry && (
                    <Tooltip
                      title={`${text.openInquiry}: No. ${reference.ticketNo}`}
                      placement="left"
                      zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
                    >
                      <Button
                        className="ai-assistant-context-open"
                        type="text"
                        shape="circle"
                        size="small"
                        icon={<FolderOpenOutlined />}
                        aria-label={`${text.openInquiry}: No. ${reference.ticketNo}`}
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
                <div
                  ref={shortcutContainerRef}
                  className="ai-assistant-new-topic-row"
                >
                  <Button
                    className="ai-assistant-new-topic-trigger"
                    type="primary"
                    icon={<PlusOutlined />}
                    block
                    loading={
                      createMutation.isPending && !createMutation.variables
                    }
                    onClick={() => createMutation.mutate({})}
                  >
                    {text.newTopic}
                  </Button>
                  {shortcutTrigger}
                </div>
                {subscribedShortcuts.length > 0 && (
                  <section
                    className="ai-assistant-subscription-section"
                    aria-label={text.subscriptions}
                  >
                    <div className="ai-assistant-subscription-heading">
                      <StarFilled />
                      <span>{text.subscriptions}</span>
                    </div>
                    <div className="ai-assistant-subscription-list">
                      {subscribedShortcuts.map((shortcut) => (
                        <button
                          key={shortcut.id}
                          type="button"
                          className="ai-assistant-subscription-item"
                          onClick={() => createMutation.mutate({ shortcut })}
                        >
                          <StarFilled />
                          <span>{shortcut.name[localizedField]}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
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
                        onClick={() => setDeleteCandidate(session)}
                      />
                    </div>
                  ))}
                </div>
              </aside>
            )}

            <div className="ai-assistant-conversation-shell">
              <div
                ref={conversationRef}
                className="ai-assistant-conversation"
                onScroll={(event) => {
                  const container = event.currentTarget;
                  const distance = container.scrollHeight -
                    container.clientHeight - container.scrollTop;
                  const nearLatest = distance <= 72;
                  followLatestRef.current = nearLatest;
                  setShowScrollToLatest(!nearLatest);
                }}
              >
                {sessionsQuery.isLoading || detailQuery.isLoading ? (
                  <div className="ai-assistant-center"><Spin /></div>
                ) : detailQuery.isError && selectedId ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={text.loadFailed}
                  >
                    <Button onClick={() => void detailQuery.refetch()}>
                      {text.retry}
                    </Button>
                  </Empty>
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
                      onClick={() => createMutation.mutate({})}
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
                  >
                    {tasks.map((task, taskIndex) => {
                      const reply = reconciledReplies[task.id];
                      const stopFailed = activeAssistantTask(task) &&
                        stopFailureKeys.has(
                          aiAssistantStopErrorKey(selectedId, task.id),
                        );
                      const fallback = fallbackReply(task);
                      const answer = assistantDisplayText(
                        reply?.text || fallback,
                        task.inquiryContext,
                      );
                      const failed = reply?.status === "FAILED" ||
                        String(task.status).toLowerCase() === "failed";
                      const canResubmit = failed &&
                        !answer &&
                        taskIndex === tasks.length - 1;
                      const failureMessage = task.errorCode
                        ? aiAssistantSendErrorMessage(locale, {
                            code: task.errorCode,
                          })
                        : text.failed;
                      const cancelled = reply?.status === "CANCELLED" ||
                        String(task.status).toLowerCase() === "cancelled";
                      const loaderPhase: GenerativeConversationLoaderPhase =
                        reply?.status === "STREAMING"
                          ? "STREAMING"
                          : reply?.status === "QUEUED" ||
                              String(task.status).toLowerCase() === "queued"
                            ? "QUEUED"
                            : "RUNNING";
                      const loaderLabel = loaderPhase === "QUEUED"
                        ? text.queued
                        : loaderPhase === "RUNNING"
                          ? text.preparing
                          : text.thinking;
                      const taskStatus = String(task.status).toLowerCase();
                      const processPhase: AssistantProcessPhase =
                        reply?.status === "COMPLETED" ||
                          Boolean(task.completed_at) ||
                          taskStatus === "completed"
                          ? "COMPLETED"
                          : loaderPhase;
                      const showProcessTrace = [
                        "COMPLEX_ANALYSIS",
                        "INQUIRY_ANALYSIS",
                      ].includes(String(task.routing?.taskClass ?? ""));
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
                              {showProcessTrace &&
                                (Boolean(answer) || processPhase !== "COMPLETED") &&
                                !failed && !cancelled && (
                                <AssistantProcessTrace
                                  phase={processPhase}
                                  startedAt={taskStartedAt[task.id] ?? task.created_at}
                                  completedAt={taskFinishedAt[task.id] ?? task.completed_at}
                                  labels={text}
                                />
                              )}
                              {reply?.status === "STREAMING" ? (
                                <GenerativeConversationLoader
                                  phase={loaderPhase}
                                  receivedText={answer}
                                  statusLabel={loaderLabel}
                                  startedAt={taskStartedAt[task.id] ?? task.created_at}
                                  longWaitLabel={text.longWait}
                                />
                              ) : failed ? (
                                <div className="ai-assistant-failure-row">
                                  <span
                                    className="ai-assistant-error"
                                    role="alert"
                                  >
                                    {failureMessage}
                                  </span>
                                  {canResubmit && (
                                    <button
                                      type="button"
                                      className="ai-assistant-resubmit"
                                      disabled={submissionBlocked}
                                      onClick={() => resubmitFailedTask(task)}
                                    >
                                      {text.resubmit}
                                    </button>
                                  )}
                                </div>
                              ) : answer ? (
                                <>
                                  <AiMarkdown className="ai-assistant-answer">
                                    {answer}
                                  </AiMarkdown>
                                  {cancelled && (
                                    <span
                                      className="ai-assistant-cancelled"
                                      role="status"
                                    >
                                      {text.responseStopped}
                                    </span>
                                  )}
                                  <AssistantAnswerActions
                                    answer={answer}
                                    labels={text}
                                    elapsed={formatAssistantElapsed(
                                      taskStartedAt[task.id] ?? task.created_at,
                                      taskFinishedAt[task.id] ?? task.completed_at,
                                    )}
                                    onRefresh={() => resubmitFailedTask(task)}
                                  />
                                </>
                              ) : cancelled ? (
                                <span
                                  className="ai-assistant-cancelled"
                                  role="status"
                                >
                                  {text.responseStopped}
                                </span>
                              ) : (
                                <GenerativeConversationLoader
                                  phase={loaderPhase}
                                  receivedText=""
                                  statusLabel={loaderLabel}
                                  startedAt={taskStartedAt[task.id] ?? task.created_at}
                                  longWaitLabel={text.longWait}
                                  className="ai-assistant-thinking"
                                />
                              )}
                              {stopFailed && (
                                <span
                                  className="ai-assistant-error"
                                  role="alert"
                                >
                                  {text.stopFailed}
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
                        <strong>
                          {detailQuery.data?.session.shortcut
                            ?.name[localizedField] ?? text.title}
                        </strong>
                        <span>
                          {detailQuery.data?.session.shortcut
                            ?.description[localizedField] ?? text.start}
                        </span>
                        {detailQuery.data?.session.shortcut && (
                          <small>
                            {detailQuery.data.session.shortcut
                              .starterPrompt[localizedField]}
                          </small>
                        )}
                        {detailQuery.data?.session.startingModel && (
                          <small>
                            {detailQuery.data.session.startingModel.model} · {
                              text.reasoning
                            } {modelReasoningLabel(
                              locale,
                              detailQuery.data.session.startingModel.reasoningEffort,
                            )} · {
                              text.speed
                            } {modelSpeedLabel(
                              locale,
                              detailQuery.data.session.startingModel.speedLevel,
                            )}
                          </small>
                        )}
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
                  {navigationItems.map((item, index) => {
                    const previewId = `ai-assistant-quick-preview-${index}`;
                    const previewPosition = index < 2
                      ? " edge-top"
                      : index >= navigationItems.length - 2
                        ? " edge-bottom"
                        : "";
                    const previewVisible = (
                      hoveredNavigationId || focusedNavigationId
                    ) === item.id;
                    return (
                      <div
                        className="ai-assistant-quick-navigation-item"
                        key={item.id}
                        onMouseEnter={() => setHoveredNavigationId(item.id)}
                        onMouseLeave={() => setHoveredNavigationId("")}
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
                        aria-describedby={previewVisible ? previewId : undefined}
                        onMouseEnter={() => setHoveredNavigationId(item.id)}
                        onFocus={() => setFocusedNavigationId(item.id)}
                        onBlur={() => setFocusedNavigationId("")}
                        onClick={() => goToNavigationItem(item.id)}
                      />
                        {previewVisible && (
                          <div
                            className={`ai-assistant-quick-preview${previewPosition}`}
                            id={previewId}
                            role="tooltip"
                          >
                            <span className="ai-assistant-quick-preview-label">
                              {text.navigationUserMessage}
                            </span>
                            <strong>{item.questionPreview}</strong>
                            <span className="ai-assistant-quick-preview-label">
                              {text.navigationAiResponse}
                            </span>
                            <span className="ai-assistant-quick-preview-answer">
                              {item.answerPreview}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              )}
              {showScrollToLatest && (
                <Tooltip
                  title={text.latestConversation}
                  zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX}
                >
                  <Button
                    className="ai-assistant-scroll-latest"
                    type="default"
                    shape="round"
                    icon={<DownOutlined />}
                    aria-label={text.latestConversation}
                    onClick={() => {
                      const container = conversationRef.current;
                      if (!container) return;
                      followLatestRef.current = true;
                      setShowScrollToLatest(false);
                      container.scrollTo({
                        top: container.scrollHeight,
                        behavior: window.matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                          ? "auto"
                          : "smooth",
                      });
                    }}
                  >
                    {text.latestConversation}
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>

           {(selectedId || inquiryContext) && (
            <footer
              className={`ai-assistant-composer${
                draggingFiles ? " dragging" : ""
              }${
                submissionBlocked ? " locked" : ""
              }`}
              aria-busy={responseActive}
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
                          disabled={attachmentLocked}
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
                          disabled={attachmentLocked}
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
                  disabled={attachmentLocked}
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={(event) => {
                    if (attachmentLocked) {
                      event.target.value = "";
                      return;
                    }
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
                    disabled={attachmentLocked || !selectedId}
                    onClick={() => fileInputRef.current?.click()}
                  />
                </Tooltip>
                <Input.TextArea
                   value={input}
                  autoSize={{ minRows: 1, maxRows: 5 }}
                  disabled={composerInputDisabled}
                  placeholder={
                    detailQuery.data?.session.shortcut
                      ?.starterPrompt[localizedField] ?? text.placeholder
                  }
                  onChange={(event) => {
                     updateSessionInput(composerSessionId, event.target.value);
                  }}
                  onPaste={(event) => {
                    if (composerInputDisabled) {
                      event.preventDefault();
                      return;
                    }
                    const pastedFiles = filesFromTransfer(
                      event.clipboardData,
                    );
                    if (pastedFiles.length) {
                      event.preventDefault();
                      if (!attachmentLocked) addFiles(pastedFiles);
                      return;
                    }
                    if (attachmentLocked) return;
                    const value = event.clipboardData.getData("text/plain");
                    const file = largePastedTextFile(value);
                    if (!file) return;
                    event.preventDefault();
                    addFiles([file]);
                  }}
                  onPressEnter={(event) => {
                    if (!event.shiftKey) {
                      event.preventDefault();
                      if (!submissionBlocked) send();
                    }
                  }}
                />
                {liveTaskId ? (
                  <Button
                    className="ai-assistant-stop-response"
                    type="primary"
                    shape="circle"
                    icon={<span className="ai-assistant-stop-glyph" />}
                    aria-label={
                      selectedStopPending
                        ? text.stoppingResponse
                        : text.stopResponse
                    }
                    loading={selectedStopPending}
                    disabled={selectedStopPending}
                    onClick={stopResponse}
                  />
                ) : (
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<SendOutlined />}
                    aria-label={text.send}
                    loading={selectedSendPending}
                    disabled={
                      submissionBlocked ||
                      (!input.trim() &&
                        !pendingAttachments.some(
                          (item) => item.status === "READY",
                        )) ||
                      pendingAttachments.some(
                        (item) => item.status === "UPLOADING",
                      )
                    }
                    onClick={send}
                  />
                )}
              </div>
              <div
                className={`ai-assistant-attachment-hint${
                  submissionBlocked ? " locked" : ""
                }`}
              >
                {submissionBlocked ? (
                  <span
                    className="ai-assistant-conversation-lock-message"
                    role="status"
                  >
                    {detailQuery.isSuccess
                      ? selectedStopPending
                        ? text.stoppingResponse
                        : text.responseInProgress
                      : detailQuery.isError
                        ? text.loadFailed
                        : text.disconnected}
                  </span>
                ) : (
                  <>
                    <span><PaperClipOutlined /> {text.attachHint}</span>
                    <span className="ai-assistant-composer-hint">
                      {text.composerHint}
                    </span>
                  </>
                )}
              </div>
            </footer>
          )}
        </section>
      )}
      <Modal
        open={Boolean(deleteCandidate)}
        title={text.delete}
        centered
        zIndex={AI_ASSISTANT_OVERLAY_Z_INDEX + 100}
        okText={text.delete}
        cancelText={text.close}
        okButtonProps={{ danger: true }}
        confirmLoading={deleteMutation.isPending}
        closable={!deleteMutation.isPending}
        mask={{ closable: !deleteMutation.isPending }}
        onCancel={() => setDeleteCandidate(null)}
        onOk={() => {
          if (deleteCandidate) {
            deleteMutation.mutate(deleteCandidate.id);
          }
        }}
      >
        <p>{text.deleteConfirm}</p>
        <strong>{deleteCandidate?.title}</strong>
      </Modal>
    </>
  );
}
