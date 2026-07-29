import {
  CloseOutlined,
  CommentOutlined,
  DeleteOutlined,
  HistoryOutlined,
  LoadingOutlined,
  MessageOutlined,
  MinusOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  createAiAssistantSession,
  deleteAiAssistantSession,
  fetchAiAssistantHistory,
  fetchAiAssistantSession,
  listAiAssistantSessions,
  renameAiAssistantSession,
  sendAiAssistantMessage,
  subscribeAiAssistantEvents,
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
  Popconfirm,
  Spin,
  Tooltip,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import type { AiAssistantInquiryContext } from "./ai-assistant-context";
import type { LocaleKey } from "./i18n";
import "./ai-assistant.css";

const copy = {
  "ja-JP": {
    title: "AI アシスタント",
    open: "AI アシスタントを開く",
    close: "閉じる",
    minimize: "最小化",
    newTopic: "新しい話題",
    history: "会話履歴",
    noSessions: "会話はまだありません",
    start: "新しい話題を作成して、CAG と会話を始めます。",
    placeholder: "メッセージを入力",
    send: "送信",
    delete: "会話を削除",
    deleteConfirm: "この会話を履歴から削除しますか？",
    thinking: "考えています",
    disconnected: "再接続中",
    connected: "リアルタイム接続",
    failed: "応答を取得できませんでした",
    createFailed: "新しい話題を作成できませんでした",
    sendFailed: "メッセージを送信できませんでした",
    deleteFailed: "会話を削除できませんでした",
    inquiryContext: "問合せを参照中",
    inquiryContextUsed: "参照済み",
    inquiryContexts: "この会話の問合せ",
    inquiryContextHint: "開いている質問と対応記録を CAG に送信します",
    defaultTitle: "新しいチャット",
  },
  "zh-CN": {
    title: "AI 助手",
    open: "打开 AI 助手",
    close: "关闭",
    minimize: "最小化",
    newTopic: "新话题",
    history: "会话历史",
    noSessions: "还没有会话",
    start: "新建话题后即可开始与 CAG 对话。",
    placeholder: "输入消息",
    send: "发送",
    delete: "删除会话",
    deleteConfirm: "从历史记录中删除这个会话吗？",
    thinking: "正在思考",
    disconnected: "正在重新连接",
    connected: "实时连接",
    failed: "无法取得回答",
    createFailed: "无法新建话题",
    sendFailed: "无法发送消息",
    deleteFailed: "无法删除会话",
    inquiryContext: "正在参考问询",
    inquiryContextUsed: "已讨论",
    inquiryContexts: "本会话的问询",
    inquiryContextHint: "当前打开的问题及处理记录将发送给 CAG",
    defaultTitle: "新对话",
  },
  "en-US": {
    title: "AI Assistant",
    open: "Open AI Assistant",
    close: "Close",
    minimize: "Minimize",
    newTopic: "New topic",
    history: "Chat history",
    noSessions: "No conversations yet",
    start: "Create a topic to start chatting with CAG.",
    placeholder: "Type a message",
    send: "Send",
    delete: "Delete conversation",
    deleteConfirm: "Delete this conversation from history?",
    thinking: "Thinking",
    disconnected: "Reconnecting",
    connected: "Live",
    failed: "The response could not be loaded",
    createFailed: "The topic could not be created",
    sendFailed: "The message could not be sent",
    deleteFailed: "The conversation could not be deleted",
    inquiryContext: "Using inquiry context",
    inquiryContextUsed: "Previously discussed",
    inquiryContexts: "Inquiries in this conversation",
    inquiryContextHint: "The open question and support records will be sent to CAG",
    defaultTitle: "New chat",
  },
} as const;

interface AssistantReply {
  text: string;
  status: "STREAMING" | "COMPLETED" | "FAILED";
}

function eventReply(
  current: AssistantReply | undefined,
  event: AiAssistantEvent,
): AssistantReply | undefined {
  if (!event.taskId) return current;
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
}: {
  locale: LocaleKey;
  userId: string;
  inquiryContext?: AiAssistantInquiryContext | null;
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

  const sessionsQuery = useQuery({
    queryKey: ["ai-assistant-sessions", userId],
    queryFn: () => listAiAssistantSessions(),
    enabled: open,
  });
  const sessions = sessionsQuery.data ?? [];

  useEffect(() => {
    if (!open || sessionsQuery.isLoading) return;
    if (selectedId && sessions.some((session) => session.id === selectedId)) {
      return;
    }
    setSelectedId(sessions[0]?.id ?? "");
  }, [open, selectedId, sessions, sessionsQuery.isLoading]);

  const detailQuery = useQuery({
    queryKey: ["ai-assistant-session", selectedId],
    queryFn: () => fetchAiAssistantSession(selectedId),
    enabled: open && Boolean(selectedId),
  });
  const historyQuery = useQuery({
    queryKey: ["ai-assistant-history", selectedId],
    queryFn: () => fetchAiAssistantHistory(selectedId),
    enabled: open && Boolean(selectedId),
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
    if (!open || !selectedId || !historyQuery.isSuccess) return;
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
    open,
    queryClient,
    selectedId,
    userId,
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
    }: {
      prompt: string;
      context: AiAssistantInquiryContext | null;
    }) => {
      const task = await sendAiAssistantMessage(
        selectedId,
        prompt,
        context,
      );
      return { task, prompt, context };
    },
    onSuccess: async ({ task, prompt, context }) => {
      queryClient.setQueryData<AiAssistantSessionDetail>(
        ["ai-assistant-session", selectedId],
        (current) =>
          current
            ? { ...current, tasks: [...current.tasks, task] }
            : current,
      );
      setReplies((current) => ({
        ...current,
        [task.id]: { text: "", status: "STREAMING" },
      }));
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
  const inquiryReferences = useMemo(
    () => assistantInquiryReferences(tasks, inquiryContext),
    [inquiryContext, tasks],
  );

  const send = () => {
    const prompt = input.trim();
    if (!prompt || !selectedId || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate({
      prompt,
      context: inquiryContext ?? null,
    });
  };

  return (
    <>
      {!open && (
        <Tooltip title={text.open}>
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
      {open && (
        <section
          className="ai-assistant-window"
          aria-label={text.title}
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
              <Tooltip title={text.newTopic}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<PlusOutlined />}
                  aria-label={text.newTopic}
                  loading={createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                />
              </Tooltip>
              <Tooltip title={text.history}>
                <Button
                  type={showHistory ? "default" : "text"}
                  shape="circle"
                  icon={<HistoryOutlined />}
                  aria-label={text.history}
                  onClick={() => setShowHistory((current) => !current)}
                />
              </Tooltip>
              <Tooltip title={text.minimize}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<MinusOutlined />}
                  aria-label={text.minimize}
                  onClick={() => setOpen(false)}
                />
              </Tooltip>
              <Tooltip title={text.close}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<CloseOutlined />}
                  aria-label={text.close}
                  onClick={() => setOpen(false)}
                />
              </Tooltip>
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
                </div>
              ))}
            </div>
          )}

          <div className="ai-assistant-body">
            {showHistory && (
              <aside className="ai-assistant-history">
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
                          setShowHistory(false);
                        }}
                      >
                        <span>{session.title}</span>
                        <small>
                          {new Date(session.updatedAt).toLocaleString(locale)}
                        </small>
                      </button>
                      <Popconfirm
                        title={text.deleteConfirm}
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

            <div className="ai-assistant-conversation">
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
                <div className="ai-assistant-messages" aria-live="polite">
                  {tasks.map((task) => {
                    const reply = replies[task.id];
                    const fallback = fallbackReply(task);
                    return (
                      <div className="ai-assistant-turn" key={task.id}>
                        <div className="ai-assistant-message user">
                          <div>{task.prompt}</div>
                        </div>
                        <div className="ai-assistant-message assistant">
                          <span className="ai-assistant-avatar">
                            <RobotOutlined />
                          </span>
                          <div>
                            {reply?.text || fallback ? (
                              <div className="ai-assistant-answer">
                                {reply?.text || fallback}
                              </div>
                            ) : reply?.status === "FAILED" ||
                              String(task.status).toLowerCase() === "failed" ? (
                              <span className="ai-assistant-error">
                                {reply?.text || task.error || text.failed}
                              </span>
                            ) : (
                              <span className="ai-assistant-thinking">
                                <LoadingOutlined /> {text.thinking}
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
          </div>

          {selectedId && (
            <footer className="ai-assistant-composer">
              <Input.TextArea
                value={input}
                autoSize={{ minRows: 1, maxRows: 5 }}
                placeholder={text.placeholder}
                onChange={(event) => setInput(event.target.value)}
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
                disabled={!input.trim() || sendMutation.isPending}
                onClick={send}
              />
            </footer>
          )}
        </section>
      )}
    </>
  );
}
