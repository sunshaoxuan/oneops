import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LinkOutlined,
  PlusOutlined,
  RobotOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  adoptTaskCandidate,
  archivePersonalTask,
  createPersonalTask,
  deleteTaskExternalAccount,
  dismissTaskCandidate,
  executePersonalTaskPrompt,
  fetchPersonalTaskEvents,
  fetchPersonalTaskSummary,
  fetchPersonalTasks,
  fetchTaskCandidates,
  fetchTaskExternalAccounts,
  revealTaskExternalCredential,
  saveTaskExternalAccount,
  syncTaskExternalAccount,
  testTaskExternalAccount,
  updatePersonalTask,
  type PersonalTask,
  type PersonalTaskInput,
  type TaskCandidate,
  type TaskExternalAccount,
  type TaskExternalAccountInput,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";

const { Paragraph, Text, Title } = Typography;

const copy = {
  "ja-JP": {
    eyebrow: "パーソナルオペレーション",
    title: "タスク",
    description:
      "期限のある作業と継続的な取り組みをまとめ、外部サービスの担当案件を自分の行動へつなげます。",
    newTask: "タスクを追加",
    connections: "外部接続",
    search: "タスク名、説明、外部キーを検索",
    today: "今日・期限超過",
    upcoming: "予定",
    longTerm: "長期",
    candidates: "候補",
    completed: "完了",
    overdue: "期限超過",
    dueToday: "今日",
    reviewDue: "確認待ち",
    candidateCount: "新しい候補",
    noTasks: "該当するタスクはありません",
    noCandidates: "確認待ちの候補はありません",
    editTask: "タスクを編集",
    createTask: "新しいタスク",
    adoptCandidate: "候補をタスクにする",
    titleLabel: "タスク名",
    type: "種別",
    deadline: "期限タスク",
    long: "長期タスク",
    status: "状態",
    priority: "優先度",
    dueAt: "期限",
    nextReviewAt: "日付条件",
    longTermPrompt: "意味条件 AI Prompt",
    longTermPromptHelp:
      "長期タスクの意味条件を AI に判定させる Prompt です。日付条件とは同時に設定できません。",
    descriptionLabel: "説明",
    prompt: "AI Prompt",
    promptHelp:
      "AI に依頼したい調査、整理、判断基準を記述します。説明とは別に保存されます。",
    promptSchedule: "定期実行を有効にする",
    save: "保存",
    cancel: "キャンセル",
    archive: "アーカイブ",
    runPrompt: "AIに依頼",
    source: "外部参照",
    updatedAt: "更新日時",
    events: "活動履歴",
    openSource: "外部画面を開く",
    dismiss: "今回は除外",
    externalStatus: "外部状態",
    assignee: "担当者",
    addConnection: "接続を追加",
    editConnection: "接続を編集",
    connectionDescription:
      "接続情報は現在のユーザーだけが利用します。認証情報は暗号化して保存します。",
    provider: "サービス",
    inquiry: "問合せサイト",
    backlog: "Backlog",
    displayName: "表示名",
    baseUrl: "サイト URL",
    username: "ログインユーザー",
    credential: "パスワード / API Key",
    credentialSaved: "保存済みの認証情報を使用",
    interval: "同期間隔（分）",
    enabled: "同期を有効にする",
    projects: "Backlog プロジェクト ID",
    statuses: "対象ステータス ID",
    inquiryStatus: "問合せ状態",
    inquiryAssignee: "担当者コード",
    test: "接続テスト",
    sync: "今すぐ同期",
    reveal: "原文を表示",
    hide: "隠す",
    copy: "コピー",
    delete: "削除",
    connectionOk: "接続を確認しました",
    saved: "保存しました",
    promptStarted: "AI助手へ分析を依頼しました",
    copied: "コピーしました",
    all: "すべて",
    open: "未完了",
    closed: "完了",
    low: "低",
    normal: "通常",
    high: "高",
    urgent: "至急",
    todo: "未着手",
    inProgress: "対応中",
    waiting: "確認待ち",
    error: "処理を完了できませんでした",
  },
  "zh-CN": {
    eyebrow: "个人运维",
    title: "任务",
    description: "集中管理时效任务与长期工作，将外部服务中的本人事项转为实际行动。",
    newTask: "新增任务",
    connections: "外部连接",
    search: "搜索任务名、说明或外部编号",
    today: "今日与逾期",
    upcoming: "计划",
    longTerm: "长期",
    candidates: "候选",
    completed: "完成",
    overdue: "逾期",
    dueToday: "今日",
    reviewDue: "待确认",
    candidateCount: "新候选",
    noTasks: "没有符合条件的任务",
    noCandidates: "没有待确认的候选",
    editTask: "编辑任务",
    createTask: "新任务",
    adoptCandidate: "将候选转为任务",
    titleLabel: "任务名",
    type: "类型",
    deadline: "时效任务",
    long: "长期任务",
    status: "状态",
    priority: "优先级",
    dueAt: "期限",
    nextReviewAt: "日期条件",
    longTermPrompt: "语义条件 AI Prompt",
    longTermPromptHelp:
      "长期任务的语义条件由 AI Prompt 表达，不能与日期条件同时设置。",
    descriptionLabel: "说明",
    prompt: "AI Prompt",
    promptHelp: "填写交给 AI 的调查、整理和判断规则，与普通说明分开保存。",
    promptSchedule: "启用定期执行",
    save: "保存",
    cancel: "取消",
    archive: "归档",
    runPrompt: "交给AI",
    source: "外部来源",
    updatedAt: "更新时间",
    events: "活动记录",
    openSource: "打开外部页面",
    dismiss: "本次忽略",
    externalStatus: "外部状态",
    assignee: "负责人",
    addConnection: "新增连接",
    editConnection: "编辑连接",
    connectionDescription: "连接信息仅供当前用户使用，认证信息将加密保存。",
    provider: "服务",
    inquiry: "问询网站",
    backlog: "Backlog",
    displayName: "显示名",
    baseUrl: "网站 URL",
    username: "登录用户",
    credential: "密码 / API Key",
    credentialSaved: "使用已保存的认证信息",
    interval: "同步间隔（分钟）",
    enabled: "启用同步",
    projects: "Backlog 项目 ID",
    statuses: "目标状态 ID",
    inquiryStatus: "问询状态",
    inquiryAssignee: "负责人编码",
    test: "连接测试",
    sync: "立即同步",
    reveal: "查看原文",
    hide: "隐藏",
    copy: "复制",
    delete: "删除",
    connectionOk: "连接成功",
    saved: "已保存",
    promptStarted: "已交给 AI 助手分析",
    copied: "已复制",
    all: "全部",
    open: "未完成",
    closed: "完成",
    low: "低",
    normal: "普通",
    high: "高",
    urgent: "紧急",
    todo: "未开始",
    inProgress: "处理中",
    waiting: "等待确认",
    error: "处理失败",
  },
  "en-US": {
    eyebrow: "PERSONAL OPERATIONS",
    title: "Tasks",
    description:
      "Bring deadline work, long-running initiatives, and assigned external items into one personal workspace.",
    newTask: "Add task",
    connections: "Connections",
    search: "Search title, description, or external key",
    today: "Today & overdue",
    upcoming: "Upcoming",
    longTerm: "Long-term",
    candidates: "Candidates",
    completed: "Completed",
    overdue: "Overdue",
    dueToday: "Due today",
    reviewDue: "Review due",
    candidateCount: "Candidates",
    noTasks: "No tasks match this view",
    noCandidates: "No candidates need review",
    editTask: "Edit task",
    createTask: "New task",
    adoptCandidate: "Convert candidate",
    titleLabel: "Task title",
    type: "Type",
    deadline: "Deadline task",
    long: "Long-term task",
    status: "Status",
    priority: "Priority",
    dueAt: "Due",
    nextReviewAt: "Date condition",
    longTermPrompt: "Semantic condition AI Prompt",
    longTermPromptHelp:
      "Use the AI Prompt as a semantic condition for a long-term task. It cannot be combined with a date condition.",
    descriptionLabel: "Description",
    prompt: "AI Prompt",
    promptHelp:
      "Describe research, organization, or decision rules for AI separately from the task description.",
    promptSchedule: "Enable scheduled execution",
    save: "Save",
    cancel: "Cancel",
    archive: "Archive",
    runPrompt: "Ask AI",
    source: "External source",
    updatedAt: "Updated",
    events: "Activity",
    openSource: "Open external page",
    dismiss: "Dismiss",
    externalStatus: "External status",
    assignee: "Assignee",
    addConnection: "Add connection",
    editConnection: "Edit connection",
    connectionDescription:
      "Connections belong to the current user. Credentials are stored encrypted.",
    provider: "Service",
    inquiry: "Inquiry site",
    backlog: "Backlog",
    displayName: "Display name",
    baseUrl: "Site URL",
    username: "Login user",
    credential: "Password / API Key",
    credentialSaved: "Use saved credential",
    interval: "Sync interval (minutes)",
    enabled: "Enable sync",
    projects: "Backlog project IDs",
    statuses: "Target status IDs",
    inquiryStatus: "Inquiry status",
    inquiryAssignee: "Assignee code",
    test: "Test connection",
    sync: "Sync now",
    reveal: "Reveal",
    hide: "Hide",
    copy: "Copy",
    delete: "Delete",
    connectionOk: "Connection verified",
    saved: "Saved",
    promptStarted: "Analysis was sent to AI Assistant",
    copied: "Copied",
    all: "All",
    open: "Open",
    closed: "Closed",
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
    todo: "To do",
    inProgress: "In progress",
    waiting: "Waiting",
    error: "The operation could not be completed",
  },
} as const;

type TaskFormValue = PersonalTaskInput;
type ConnectionFormValue = TaskExternalAccountInput & {
  projectIdsText?: string;
  statusIdsText?: string;
  inquiryStatus?: string;
  inquiryAssignee?: string;
};

function localDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function isoDateTime(value?: string | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

function tomorrowLocal(): string {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  value.setHours(17, 0, 0, 0);
  return localDateTime(value.toISOString());
}

function statusColor(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "IN_PROGRESS") return "processing";
  if (status === "WAITING") return "warning";
  return "default";
}

export function PersonalTasksPage({
  locale,
  canUseAi,
  onOpenAssistant,
}: {
  locale: LocaleKey;
  canUseAi: boolean;
  onOpenAssistant: () => void;
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const [taskForm] = Form.useForm<TaskFormValue>();
  const [connectionForm] = Form.useForm<ConnectionFormValue>();
  const [activeView, setActiveView] = useState("today");
  const [search, setSearch] = useState("");
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [connectionDrawerOpen, setConnectionDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [adoptingCandidate, setAdoptingCandidate] =
    useState<TaskCandidate | null>(null);
  const [editingConnection, setEditingConnection] =
    useState<TaskExternalAccount | null>(null);
  const [revealedCredentials, setRevealedCredentials] = useState<
    Record<string, string>
  >({});

  const tasksQuery = useQuery({
    queryKey: ["personal-tasks"],
    queryFn: ({ signal }) => fetchPersonalTasks(signal),
  });
  const summaryQuery = useQuery({
    queryKey: ["personal-task-summary"],
    queryFn: ({ signal }) => fetchPersonalTaskSummary(signal),
  });
  const candidatesQuery = useQuery({
    queryKey: ["personal-task-candidates"],
    queryFn: ({ signal }) => fetchTaskCandidates(signal),
  });
  const connectionsQuery = useQuery({
    queryKey: ["personal-task-connections"],
    queryFn: ({ signal }) => fetchTaskExternalAccounts(signal),
  });
  const eventsQuery = useQuery({
    queryKey: ["personal-task-events", editingTask?.id],
    queryFn: ({ signal }) =>
      fetchPersonalTaskEvents(editingTask!.id, signal),
    enabled: Boolean(editingTask?.id && taskDrawerOpen),
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["personal-tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["personal-task-summary"] }),
      queryClient.invalidateQueries({
        queryKey: ["personal-task-candidates"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["personal-task-connections"],
      }),
    ]);
  };

  const saveTaskMutation = useMutation({
    mutationFn: async (value: TaskFormValue) => {
      const normalized: PersonalTaskInput = {
        ...value,
        dueAt: isoDateTime(value.dueAt),
        nextReviewAt: isoDateTime(value.nextReviewAt),
        reviewCycle: null,
        customReviewDays: null,
        revision: editingTask?.revision,
      };
      if (adoptingCandidate) {
        return adoptTaskCandidate(adoptingCandidate.id, normalized);
      }
      return editingTask
        ? updatePersonalTask(editingTask.id, normalized)
        : createPersonalTask(normalized);
    },
    onSuccess: async () => {
      message.success(text.saved);
      setTaskDrawerOpen(false);
      setEditingTask(null);
      setAdoptingCandidate(null);
      await refreshAll();
    },
    onError: () => message.error(text.error),
  });

  const saveConnectionMutation = useMutation({
    mutationFn: async (value: ConnectionFormValue) => {
      const input: TaskExternalAccountInput = {
        id: editingConnection?.id,
        revision: editingConnection?.revision,
        providerCode: value.providerCode,
        displayName: value.displayName,
        baseUrl: value.baseUrl,
        externalUsername: value.externalUsername ?? "",
        credential: value.credential ?? "",
        enabled: value.enabled !== false,
        syncIntervalMinutes: Number(value.syncIntervalMinutes ?? 15),
        filters:
          value.providerCode === "BACKLOG"
            ? {
                projectIds: String(value.projectIdsText ?? "")
                  .split(/[\s,]+/)
                  .filter(Boolean),
                statusIds: String(value.statusIdsText ?? "")
                  .split(/[\s,]+/)
                  .filter(Boolean),
              }
            : {
                status: value.inquiryStatus ?? "open",
                assignee: value.inquiryAssignee ?? "",
              },
      };
      return saveTaskExternalAccount(input);
    },
    onSuccess: async () => {
      message.success(text.saved);
      setEditingConnection(null);
      connectionForm.resetFields();
      await refreshAll();
    },
    onError: () => message.error(text.error),
  });

  const visibleTasks = useMemo(() => {
    const now = new Date();
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);
    const term = search.trim().toLocaleLowerCase(locale);
    return (tasksQuery.data ?? []).filter((task) => {
      const matches =
        !term ||
        [
          task.title,
          task.description,
          task.sourceLink?.externalKey,
          task.sourceLink?.externalStatus,
        ]
          .join(" ")
          .toLocaleLowerCase(locale)
          .includes(term);
      if (!matches) return false;
      if (activeView === "completed") return task.status === "COMPLETED";
      if (task.status === "COMPLETED") return false;
      if (activeView === "long") return task.taskType === "LONG_TERM";
      if (task.taskType !== "DEADLINE" || !task.dueAt) return false;
      const due = new Date(task.dueAt);
      if (activeView === "today") return due <= endToday;
      return due > endToday && due > now;
    });
  }, [activeView, locale, search, tasksQuery.data]);

  const openNewTask = () => {
    setEditingTask(null);
    setAdoptingCandidate(null);
    taskForm.setFieldsValue({
      title: "",
      taskType: "DEADLINE",
      status: "TODO",
      priority: "NORMAL",
      description: "",
      automationPrompt: "",
      promptScheduleEnabled: false,
      dueAt: tomorrowLocal(),
      nextReviewAt: null,
      reviewCycle: null,
      customReviewDays: null,
    });
    setTaskDrawerOpen(true);
  };

  const openTask = (task: PersonalTask) => {
    setEditingTask(task);
    setAdoptingCandidate(null);
    taskForm.setFieldsValue({
      title: task.title,
      taskType: task.taskType,
      status: task.status,
      priority: task.priority,
      description: task.description,
      automationPrompt: task.automationPrompt,
      promptScheduleEnabled: task.promptScheduleEnabled,
      dueAt: localDateTime(task.dueAt),
      nextReviewAt: localDateTime(task.nextReviewAt),
      reviewCycle: task.reviewCycle,
      customReviewDays: task.customReviewDays,
      revision: task.revision,
    });
    setTaskDrawerOpen(true);
  };

  const openCandidate = (candidate: TaskCandidate) => {
    setEditingTask(null);
    setAdoptingCandidate(candidate);
    taskForm.setFieldsValue({
      title: candidate.title,
      taskType: "DEADLINE",
      status: "TODO",
      priority: "NORMAL",
      description: candidate.description,
      automationPrompt: "",
      promptScheduleEnabled: false,
      dueAt: tomorrowLocal(),
      nextReviewAt: null,
      reviewCycle: null,
      customReviewDays: null,
    });
    setTaskDrawerOpen(true);
  };

  const editConnection = (connection?: TaskExternalAccount) => {
    setEditingConnection(connection ?? null);
    const filters = connection?.filters ?? {};
    connectionForm.setFieldsValue({
      id: connection?.id,
      revision: connection?.revision,
      providerCode: connection?.providerCode ?? "INQUIRY",
      displayName: connection?.displayName ?? "",
      baseUrl:
        connection?.baseUrl ??
        (connection?.providerCode === "BACKLOG"
          ? "https://example.backlog.com/"
          : "https://ss.onehr.jp/"),
      externalUsername: connection?.externalUsername ?? "",
      credential: "",
      enabled: connection?.enabled ?? true,
      syncIntervalMinutes: connection?.syncIntervalMinutes ?? 15,
      projectIdsText: Array.isArray(filters.projectIds)
        ? filters.projectIds.join(", ")
        : "",
      statusIdsText: Array.isArray(filters.statusIds)
        ? filters.statusIds.join(", ")
        : "",
      inquiryStatus: String(filters.status ?? "open"),
      inquiryAssignee: String(filters.assignee ?? ""),
    });
  };

  const taskType = Form.useWatch("taskType", taskForm);
  const providerCode = Form.useWatch("providerCode", connectionForm);

  const taskItems = [
    { key: "today", label: text.today },
    { key: "upcoming", label: text.upcoming },
    { key: "long", label: text.longTerm },
    {
      key: "candidates",
      label: (
        <Badge
          count={summaryQuery.data?.candidates ?? 0}
          size="small"
          offset={[8, -2]}
        >
          <span>{text.candidates}</span>
        </Badge>
      ),
    },
    { key: "completed", label: text.completed },
  ];

  return (
    <main className="personal-tasks-page">
      <section className="portal-page-hero personal-tasks-hero">
        <div>
          <span className="personal-tasks-eyebrow">{text.eyebrow}</span>
          <Title level={1}>{text.title}</Title>
          <Paragraph>{text.description}</Paragraph>
        </div>
        <Space wrap>
          <Button
            icon={<ApiOutlined />}
            onClick={() => {
              setConnectionDrawerOpen(true);
              editConnection();
            }}
          >
            {text.connections}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openNewTask}>
            {text.newTask}
          </Button>
        </Space>
      </section>

      <section className="personal-task-summary">
        {[
          [text.overdue, summaryQuery.data?.overdue ?? 0, "urgent"],
          [text.dueToday, summaryQuery.data?.dueToday ?? 0, "today"],
          [text.reviewDue, summaryQuery.data?.reviewDue ?? 0, "review"],
          [text.candidateCount, summaryQuery.data?.candidates ?? 0, "candidate"],
        ].map(([label, value, tone]) => (
          <Card key={String(label)} className={`task-summary-card ${tone}`}>
            <Text>{label}</Text>
            <strong>{value}</strong>
          </Card>
        ))}
      </section>

      <section className="personal-task-workspace">
        <div className="personal-task-toolbar">
          <Input
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={text.search}
          />
        </div>
        <Tabs
          items={taskItems}
          activeKey={activeView}
          onChange={setActiveView}
        />
        {activeView === "candidates" ? (
          <List
            loading={candidatesQuery.isLoading}
            dataSource={candidatesQuery.data ?? []}
            locale={{ emptyText: <Empty description={text.noCandidates} /> }}
            renderItem={(candidate) => (
              <List.Item
                className="personal-task-row candidate"
                actions={[
                  <Button
                    key="adopt"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => openCandidate(candidate)}
                  >
                    {text.adoptCandidate}
                  </Button>,
                  <Popconfirm
                    key="dismiss"
                    title={text.dismiss}
                    onConfirm={async () => {
                      await dismissTaskCandidate(candidate.id);
                      await refreshAll();
                    }}
                  >
                    <Button>{text.dismiss}</Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Badge color="#12b8b0" />}
                  title={
                    <Space wrap>
                      <strong>{candidate.title}</strong>
                      <Tag>{candidate.providerCode}</Tag>
                      <Tag>{candidate.externalKey}</Tag>
                    </Space>
                  }
                  description={
                    <Space wrap split={<span>·</span>}>
                      <span>
                        {text.externalStatus}: {candidate.externalStatus || "－"}
                      </span>
                      <span>
                        {text.assignee}: {candidate.externalAssignee || "－"}
                      </span>
                      <a
                        href={candidate.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <LinkOutlined /> {text.openSource}
                      </a>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <List
            loading={tasksQuery.isLoading}
            dataSource={visibleTasks}
            locale={{ emptyText: <Empty description={text.noTasks} /> }}
            renderItem={(task) => {
              const scheduleAt = task.dueAt ?? task.nextReviewAt;
              return (
                <List.Item
                  className="personal-task-row"
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={text.editTask}
                      onClick={() => openTask(task)}
                    />,
                  ]}
                  onClick={() => openTask(task)}
                >
                  <List.Item.Meta
                    avatar={
                      task.taskType === "LONG_TERM" ? (
                        <SyncOutlined className="task-kind-icon" />
                      ) : (
                        <ClockCircleOutlined className="task-kind-icon" />
                      )
                    }
                    title={
                      <Space wrap>
                        <strong>{task.title}</strong>
                        <Tag color={statusColor(task.status)}>
                          {
                            {
                              TODO: text.todo,
                              IN_PROGRESS: text.inProgress,
                              WAITING: text.waiting,
                              COMPLETED: text.completed,
                            }[task.status]
                          }
                        </Tag>
                        <Tag>
                          {
                            {
                              LOW: text.low,
                              NORMAL: text.normal,
                              HIGH: text.high,
                              URGENT: text.urgent,
                            }[task.priority]
                          }
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space wrap split={<span>·</span>}>
                        {scheduleAt && (
                          <span>
                            {task.taskType === "DEADLINE"
                              ? text.dueAt
                              : text.nextReviewAt}
                            : {new Date(scheduleAt).toLocaleString(locale)}
                          </span>
                        )}
                        {task.sourceLink && (
                          <span>
                            {task.sourceLink.providerCode}{" "}
                            {task.sourceLink.externalKey} /{" "}
                            {task.sourceLink.externalStatus}
                          </span>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </section>

      <Drawer
        title={
          adoptingCandidate
            ? text.adoptCandidate
            : editingTask
              ? text.editTask
              : text.createTask
        }
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        size={620}
        destroyOnHidden
        extra={
          <Space>
            {editingTask && (
              <Button
                icon={<RobotOutlined />}
                disabled={!canUseAi || !editingTask.automationPrompt}
                loading={false}
                onClick={async () => {
                  try {
                    await executePersonalTaskPrompt(editingTask.id);
                    message.success(text.promptStarted);
                    onOpenAssistant();
                  } catch {
                    message.error(text.error);
                  }
                }}
              >
                {text.runPrompt}
              </Button>
            )}
            <Button
              type="primary"
              loading={saveTaskMutation.isPending}
              onClick={() => taskForm.submit()}
            >
              {text.save}
            </Button>
          </Space>
        }
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={(value) => saveTaskMutation.mutate(value)}
        >
          <Form.Item
            name="title"
            label={text.titleLabel}
            rules={[{ required: true, max: 200 }]}
          >
            <Input />
          </Form.Item>
          <div className="personal-task-form-grid">
            <Form.Item name="taskType" label={text.type} rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "DEADLINE", label: text.deadline },
                  { value: "LONG_TERM", label: text.long },
                ]}
              />
            </Form.Item>
            <Form.Item name="status" label={text.status} rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "TODO", label: text.todo },
                  { value: "IN_PROGRESS", label: text.inProgress },
                  { value: "WAITING", label: text.waiting },
                  { value: "COMPLETED", label: text.completed },
                ]}
              />
            </Form.Item>
            <Form.Item name="priority" label={text.priority} rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "LOW", label: text.low },
                  { value: "NORMAL", label: text.normal },
                  { value: "HIGH", label: text.high },
                  { value: "URGENT", label: text.urgent },
                ]}
              />
            </Form.Item>
            {taskType === "LONG_TERM" ? (
              <>
                <Form.Item name="nextReviewAt" label={text.nextReviewAt}>
                  <Input type="datetime-local" />
                </Form.Item>
              </>
            ) : (
              <Form.Item
                name="dueAt"
                label={text.dueAt}
                rules={[{ required: true }]}
              >
                <Input type="datetime-local" />
              </Form.Item>
            )}
          </div>
          <Form.Item name="description" label={text.descriptionLabel}>
            <Input.TextArea rows={6} maxLength={10_000} showCount />
          </Form.Item>
          <Form.Item
            name="automationPrompt"
            label={
              taskType === "LONG_TERM" ? text.longTermPrompt : text.prompt
            }
            extra={
              taskType === "LONG_TERM"
                ? text.longTermPromptHelp
                : text.promptHelp
            }
          >
            <Input.TextArea rows={6} maxLength={10_000} showCount />
          </Form.Item>
          {taskType !== "LONG_TERM" && (
            <Form.Item name="promptScheduleEnabled" valuePropName="checked">
              <Checkbox>{text.promptSchedule}</Checkbox>
            </Form.Item>
          )}
          {editingTask?.sourceLink && (
            <Card size="small" title={text.source}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={text.source}>
                  {editingTask.sourceLink.providerCode} /{" "}
                  {editingTask.sourceLink.externalKey}
                </Descriptions.Item>
                <Descriptions.Item label={text.externalStatus}>
                  {editingTask.sourceLink.externalStatus}
                </Descriptions.Item>
                <Descriptions.Item>
                  <a
                    href={editingTask.sourceLink.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <LinkOutlined /> {text.openSource}
                  </a>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
          {editingTask && (
            <Card size="small" title={text.events} className="task-events-card">
              {eventsQuery.isLoading ? (
                <Spin />
              ) : (
                <List
                  size="small"
                  dataSource={eventsQuery.data ?? []}
                  renderItem={(event) => (
                    <List.Item>
                      <Space>
                        <Tag>{event.eventType}</Tag>
                        <Text type="secondary">
                          {new Date(event.createdAt).toLocaleString(locale)}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          )}
          {editingTask && (
            <Popconfirm
              title={text.archive}
              onConfirm={async () => {
                await archivePersonalTask(editingTask.id);
                setTaskDrawerOpen(false);
                await refreshAll();
              }}
            >
              <Button danger icon={<DeleteOutlined />}>
                {text.archive}
              </Button>
            </Popconfirm>
          )}
        </Form>
      </Drawer>

      <Drawer
        title={text.connections}
        open={connectionDrawerOpen}
        onClose={() => setConnectionDrawerOpen(false)}
        size={720}
        extra={
          <Button icon={<PlusOutlined />} onClick={() => editConnection()}>
            {text.addConnection}
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          message={text.connectionDescription}
          className="task-connection-alert"
        />
        <List
          dataSource={connectionsQuery.data ?? []}
          renderItem={(connection) => (
            <List.Item className="task-connection-row">
              <List.Item.Meta
                title={
                  <Space>
                    <strong>{connection.displayName}</strong>
                    <Tag>{connection.providerCode}</Tag>
                    <Badge
                      status={
                        connection.lastSyncStatus === "FAILED"
                          ? "error"
                          : connection.enabled
                            ? "success"
                            : "default"
                      }
                    />
                  </Space>
                }
                description={
                  <div>
                    <div>{connection.baseUrl}</div>
                    <Space wrap>
                      <Button
                        size="small"
                        icon={
                          revealedCredentials[connection.id] ? (
                            <EyeInvisibleOutlined />
                          ) : (
                            <EyeOutlined />
                          )
                        }
                        onClick={async () => {
                          if (revealedCredentials[connection.id]) {
                            setRevealedCredentials((current) => {
                              const next = { ...current };
                              delete next[connection.id];
                              return next;
                            });
                            return;
                          }
                          const credential =
                            await revealTaskExternalCredential(connection.id);
                          setRevealedCredentials((current) => ({
                            ...current,
                            [connection.id]: credential,
                          }));
                        }}
                      >
                        {revealedCredentials[connection.id]
                          ? text.hide
                          : text.reveal}
                      </Button>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={async () => {
                          const credential =
                            revealedCredentials[connection.id] ??
                            (await revealTaskExternalCredential(connection.id));
                          await navigator.clipboard.writeText(credential);
                          message.success(text.copied);
                        }}
                      >
                        {text.copy}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => editConnection(connection)}
                      >
                        {text.editConnection}
                      </Button>
                      <Button
                        size="small"
                        onClick={async () => {
                          try {
                            await testTaskExternalAccount(connection.id);
                            message.success(text.connectionOk);
                          } catch {
                            message.error(text.error);
                          }
                        }}
                      >
                        {text.test}
                      </Button>
                      <Button
                        size="small"
                        icon={<SyncOutlined />}
                        onClick={async () => {
                          try {
                            await syncTaskExternalAccount(connection.id);
                            await refreshAll();
                          } catch {
                            message.error(text.error);
                          }
                        }}
                      >
                        {text.sync}
                      </Button>
                      <Popconfirm
                        title={text.delete}
                        onConfirm={async () => {
                          await deleteTaskExternalAccount(connection.id);
                          await refreshAll();
                        }}
                      >
                        <Button size="small" danger>
                          {text.delete}
                        </Button>
                      </Popconfirm>
                    </Space>
                    {revealedCredentials[connection.id] && (
                      <Input.Password
                        className="task-revealed-credential"
                        value={revealedCredentials[connection.id]}
                        visibilityToggle
                        readOnly
                      />
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />

        <Card
          title={
            editingConnection ? text.editConnection : text.addConnection
          }
          className="task-connection-form-card"
        >
          <Form
            form={connectionForm}
            layout="vertical"
            initialValues={{
              providerCode: "INQUIRY",
              baseUrl: "https://ss.onehr.jp/",
              enabled: true,
              syncIntervalMinutes: 15,
              inquiryStatus: "open",
            }}
            onFinish={(value) => saveConnectionMutation.mutate(value)}
          >
            <div className="personal-task-form-grid">
              <Form.Item
                name="providerCode"
                label={text.provider}
                rules={[{ required: true }]}
              >
                <Select
                  onChange={(value) => {
                    connectionForm.setFieldValue(
                      "baseUrl",
                      value === "INQUIRY"
                        ? "https://ss.onehr.jp/"
                        : "https://example.backlog.com/",
                    );
                  }}
                  options={[
                    { value: "INQUIRY", label: text.inquiry },
                    { value: "BACKLOG", label: text.backlog },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="displayName"
                label={text.displayName}
                rules={[{ required: true, max: 120 }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="baseUrl"
                label={text.baseUrl}
                rules={[{ required: true, type: "url" }]}
              >
                <Input />
              </Form.Item>
              {providerCode === "INQUIRY" && (
                <Form.Item
                  name="externalUsername"
                  label={text.username}
                  rules={[{ required: true }]}
                >
                  <Input autoComplete="off" />
                </Form.Item>
              )}
              <Form.Item
                name="credential"
                label={text.credential}
                extra={
                  editingConnection?.credentialConfigured
                    ? text.credentialSaved
                    : undefined
                }
                rules={[
                  {
                    required: !editingConnection?.credentialConfigured,
                  },
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                name="syncIntervalMinutes"
                label={text.interval}
                rules={[{ required: true }]}
              >
                <InputNumber min={5} max={1440} />
              </Form.Item>
              {providerCode === "BACKLOG" ? (
                <>
                  <Form.Item name="projectIdsText" label={text.projects}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="statusIdsText" label={text.statuses}>
                    <Input />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item name="inquiryStatus" label={text.inquiryStatus}>
                    <Select
                      options={[
                        { value: "all", label: text.all },
                        { value: "open", label: text.open },
                        { value: "closed", label: text.closed },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    name="inquiryAssignee"
                    label={text.inquiryAssignee}
                  >
                    <Input />
                  </Form.Item>
                </>
              )}
              <Form.Item
                name="enabled"
                label={text.enabled}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </div>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={saveConnectionMutation.isPending}
              >
                {text.save}
              </Button>
              <Button
                onClick={() => {
                  setEditingConnection(null);
                  connectionForm.resetFields();
                }}
              >
                {text.cancel}
              </Button>
            </Space>
          </Form>
        </Card>
      </Drawer>
    </main>
  );
}
