import {
  BulbOutlined,
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileOutlined,
  FlagFilled,
  GlobalOutlined,
  HistoryOutlined,
  LockOutlined,
  MessageOutlined,
  ReloadOutlined,
  RobotOutlined,
  SearchOutlined,
  StarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Segmented,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createInquiryAssistRun,
  fetchInquiryAssistRun,
  fetchInquirySupportOptions,
  fetchInquiryTicket,
  inquiryAttachmentUrl,
  searchInquiryTickets,
  type InquiryAssistRun,
  type InquiryMessage,
  type InquiryQuestionThread,
  type InquirySearchInput,
  type InquirySearchTicket,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import { formatInquiryLocalDate } from "./inquiry-support-utils";

const { Paragraph, Text, Title } = Typography;

const copy = {
  "ja-JP": {
    title: "問合支援",
    description: "実際のサポートサイトからお問い合わせを検索し、内容を時系列で確認します。",
    createdRange: "作成期間",
    ticketNoSearch: "チケット No.",
    ticketNoPlaceholder: "No.を入力",
    contentSearch: "内容",
    contentPlaceholder: "件名・質問・回答・コメント",
    from: "開始日",
    to: "終了日",
    assignee: "担当者",
    allAssignees: "すべて",
    status: "ステータス",
    required: "ステータスを選択してください",
    search: "検索",
    aiHistory: "AI履歴",
    aiProcessedOnly: "AI対応履歴あり",
    no: "No.",
    subject: "件名",
    updated: "更新日時",
    requested: "回答希望日",
    customer: "お客様",
    customerList: "顧客",
    results: "検索結果",
    sourceLimited: "実サイトの表示上限により、一部のお問い合わせのみ表示しています。",
    openSource: "実サイトで開く",
    customerInfo: "お客様情報",
    customerEvaluation: "お客様評価",
    satisfaction: "満足度",
    evaluationReceived: "評価受信日時",
    noEvaluationComment: "コメントなし",
    category: "分類",
    urgency: "緊急度",
    ticketLevel: "問合せレベル",
    levelUnset: "未設定",
    created: "作成日時",
    attachments: "添付",
    question: "お客様からの質問",
    followUp: "追加質問",
    internal: "内部",
    customerVisible: "お客様に公開",
    system: "システム",
    useContext: "このメッセージを重点コンテキストにする",
    aiAssist: "AI補助",
    nextReply: "次の返信",
    analysis: "問題分析",
    draft: "返信案",
    facts: "確認できる事実",
    disputes: "論点",
    missing: "不足情報",
    risks: "リスク",
    checks: "確認事項",
    evidence: "根拠",
    regenerate: "再生成",
    copyDraft: "返信案をコピー",
    hide: "閉じる",
    running: "分析中です",
    editable: "返信案は編集できます。実サイトへの送信は行いません。",
    scope: "対象範囲",
    wholeThread: "現在の質問と、この質問内の全サポート記録",
    focused: "重点メッセージ",
    tokenUsage: "Token",
    tokenUnavailable: "未提供",
    loadFailed: "工单を読み込めませんでした。",
    searchFailed: "検索に失敗しました。",
    close: "閉じる",
    unassigned: "未割当",
  },
  "zh-CN": {
    title: "问询支援",
    description: "从真实支持网站查询工单，并按时间顺序查看完整内容。",
    createdRange: "创建时间",
    ticketNoSearch: "工单 No.",
    ticketNoPlaceholder: "输入工单号",
    contentSearch: "内容",
    contentPlaceholder: "标题、提问、回复或评论",
    from: "开始日期",
    to: "结束日期",
    assignee: "负责人",
    allAssignees: "全部",
    status: "工单状态",
    required: "请选择工单状态",
    search: "查询",
    aiHistory: "AI 历史",
    aiProcessedOnly: "仅显示 AI 处理过",
    no: "工单 No.",
    subject: "标题",
    updated: "更新时间",
    requested: "希望回答日",
    customer: "客户",
    customerList: "客户",
    results: "查询结果",
    sourceLimited: "受真实网站显示上限影响，当前只显示部分工单。",
    openSource: "在真实网站打开",
    customerInfo: "客户信息",
    customerEvaluation: "客户评价",
    satisfaction: "满意度",
    evaluationReceived: "评价时间",
    noEvaluationComment: "没有评价留言",
    category: "问题分类",
    urgency: "紧急度",
    ticketLevel: "工单等级",
    levelUnset: "未设置",
    created: "创建时间",
    attachments: "附件",
    question: "客户初始提问",
    followUp: "客户追加提问",
    internal: "内部",
    customerVisible: "客户可见",
    system: "系统",
    useContext: "以此消息为重点上下文",
    aiAssist: "AI 辅助",
    nextReply: "下一条回复",
    analysis: "问题分析",
    draft: "辅助回复",
    facts: "事实",
    disputes: "争议点",
    missing: "缺失信息",
    risks: "风险",
    checks: "建议确认事项",
    evidence: "证据引用",
    regenerate: "重新生成",
    copyDraft: "复制草案",
    hide: "收起",
    running: "正在分析",
    editable: "草案可以编辑。本页面不会向真实网站提交回复。",
    scope: "当前分析范围",
    wholeThread: "当前客户问题及该问题块内的全部支持记录",
    focused: "重点消息",
    tokenUsage: "Token",
    tokenUnavailable: "未提供",
    loadFailed: "工单详情加载失败。",
    searchFailed: "工单查询失败。",
    close: "关闭",
    unassigned: "未分配",
  },
  "en-US": {
    title: "Inquiry Support",
    description: "Search the live support site and review complete ticket history.",
    createdRange: "Created range",
    ticketNoSearch: "Ticket No.",
    ticketNoPlaceholder: "Enter ticket number",
    contentSearch: "Content",
    contentPlaceholder: "Title, question, reply, or comment",
    from: "From",
    to: "To",
    assignee: "Assignee",
    allAssignees: "All",
    status: "Ticket status",
    required: "Select a ticket status",
    search: "Search",
    aiHistory: "AI history",
    aiProcessedOnly: "AI processed only",
    no: "Ticket No.",
    subject: "Title",
    updated: "Updated",
    requested: "Requested reply",
    customer: "Customer",
    customerList: "Customer",
    results: "Results",
    sourceLimited: "Only part of the result is shown due to the source display limit.",
    openSource: "Open source ticket",
    customerInfo: "Customer information",
    customerEvaluation: "Customer evaluation",
    satisfaction: "Satisfaction",
    evaluationReceived: "Evaluation received",
    noEvaluationComment: "No evaluation comment",
    category: "Category",
    urgency: "Urgency",
    ticketLevel: "Ticket level",
    levelUnset: "Not set",
    created: "Created",
    attachments: "Attachments",
    question: "Initial customer question",
    followUp: "Customer follow-up",
    internal: "Internal",
    customerVisible: "Customer visible",
    system: "System",
    useContext: "Use this message as focus context",
    aiAssist: "AI assist",
    nextReply: "Next reply",
    analysis: "Issue analysis",
    draft: "Reply draft",
    facts: "Facts",
    disputes: "Disputes",
    missing: "Missing information",
    risks: "Risks",
    checks: "Recommended checks",
    evidence: "Evidence",
    regenerate: "Regenerate",
    copyDraft: "Copy draft",
    hide: "Hide",
    running: "Analysis in progress",
    editable: "The draft is editable. This page never posts to the source site.",
    scope: "Analysis scope",
    wholeThread: "Current customer question and every support record in this thread",
    focused: "Focused message",
    tokenUsage: "Tokens",
    tokenUnavailable: "Not provided",
    loadFailed: "Ticket details could not be loaded.",
    searchFailed: "Ticket search failed.",
    close: "Close",
    unassigned: "Unassigned",
  },
} as const;

const statuses = [
  ["open", "OPEN"],
  ["1", "OPEN: 未回答"],
  ["2", "OPEN: 回答中"],
  ["3", "OPEN: チェック依頼中"],
  ["4", "OPEN: チェック済 OK"],
  ["5", "OPEN: チェック済 NG"],
  ["6", "OPEN: 一次回答済"],
  ["7", "OPEN: 保留中"],
  ["close", "CLOSED"],
  ["8", "CLOSED: 回答済"],
  ["9", "CLOSED: 処理済"],
  ["10", "CLOSED: 評価受信"],
].map(([value, label]) => ({ value, label }));

function dateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString();
}

function statusColor(status: string) {
  if (/CLOSED|回答済|処理済/.test(status)) return "success";
  if (/保留|待/.test(status)) return "warning";
  if (/未回答|未割当/.test(status)) return "error";
  return "processing";
}

function AttachmentList({
  ticketNo,
  attachments,
}: {
  ticketNo: string;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: number | null;
    parsingStatus: string;
  }>;
}) {
  if (!attachments.length) return null;
  return (
    <Space wrap className="inquiry-attachments">
      {attachments.map((attachment) => (
        <Button
          key={attachment.id}
          size="small"
          icon={<DownloadOutlined />}
          href={inquiryAttachmentUrl(ticketNo, attachment.id)}
          target="_blank"
          rel="noreferrer"
        >
          {attachment.name}
          <Text type="secondary">
            {attachment.size ? ` · ${attachment.size} B` : ""}
            {` · ${attachment.parsingStatus}`}
          </Text>
        </Button>
      ))}
    </Space>
  );
}

function MessageBubble({
  ticketNo,
  message,
  labels,
  focused,
  onFocus,
}: {
  ticketNo: string;
  message: InquiryMessage;
  labels: (typeof copy)[LocaleKey];
  focused: boolean;
  onFocus: () => void;
}) {
  if (
    message.kind === "SYSTEM_EVENT" ||
    message.kind === "ATTACHMENT_EVENT"
  ) {
    return (
      <div
        id={`inquiry-message-${message.messageKey}`}
        className="inquiry-system-event"
      >
        <Tag icon={<FileOutlined />}>{labels.system}</Tag>
        <span>{message.body}</span>
        <time>{dateTime(message.createdAt)}</time>
      </div>
    );
  }
  const own = message.relation === "CURRENT_USER";
  const visible = message.visibility === "CUSTOMER_VISIBLE";
  return (
    <article
      id={`inquiry-message-${message.messageKey}`}
      className={`inquiry-message ${own ? "own" : "other"} ${
        focused ? "focused" : ""
      }`}
    >
      <div className="inquiry-message-meta">
        <strong>{message.author?.displayName || labels.system}</strong>
        <span>{message.author?.role}</span>
        <time>{dateTime(message.createdAt)}</time>
      </div>
      <div className="inquiry-message-bubble">
        <div className="inquiry-message-labels">
          {visible ? (
            <Tag
              color="blue"
              icon={<EyeOutlined />}
              aria-label={labels.customerVisible}
            >
              {labels.customerVisible}
            </Tag>
          ) : (
            <Tag
              icon={<LockOutlined />}
              aria-label={labels.internal}
            >
              {labels.internal}
            </Tag>
          )}
          <Tooltip title={labels.useContext}>
            <Button
              className="inquiry-focus-action"
              type="text"
              size="small"
              icon={<BulbOutlined />}
              aria-label={labels.useContext}
              onClick={onFocus}
            />
          </Tooltip>
        </div>
        <Paragraph
          className="inquiry-message-body"
          ellipsis={{ rows: 12, expandable: true, symbol: "More" }}
        >
          {message.body}
        </Paragraph>
        <AttachmentList
          ticketNo={ticketNo}
          attachments={message.attachments}
        />
      </div>
    </article>
  );
}

function valueText(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function AnalysisList({
  title,
  values,
}: {
  title: string;
  values: unknown[];
}) {
  return (
    <section>
      <Text strong>{title}</Text>
      {values.length ? (
        <ul>
          {values.map((value, index) => (
            <li key={`${title}-${index}`}>{valueText(value)}</li>
          ))}
        </ul>
      ) : (
        <Text type="secondary">—</Text>
      )}
    </section>
  );
}

function AssistPanel({
  ticketNo,
  thread,
  labels,
  focusMessageKey,
  cachedRun,
  onRun,
  onClose,
  onDraftChange,
}: {
  ticketNo: string;
  thread: InquiryQuestionThread;
  labels: (typeof copy)[LocaleKey];
  focusMessageKey: string | null;
  cachedRun: InquiryAssistRun | undefined;
  onRun: (run: InquiryAssistRun) => void;
  onClose: () => void;
  onDraftChange: (value: string) => void;
}) {
  const [view, setView] = useState<"analysis" | "draft">("analysis");
  const requestedContextRef = useRef("");
  const createMutation = useMutation({
    mutationFn: () =>
      createInquiryAssistRun(
        ticketNo,
        thread.questionKey,
        focusMessageKey,
      ),
    onSuccess: onRun,
  });
  const runQuery = useQuery({
    queryKey: ["inquiry-assist-run", cachedRun?.id],
    queryFn: ({ signal }) => fetchInquiryAssistRun(cachedRun!.id, signal),
    enabled: Boolean(cachedRun?.id) &&
      !["COMPLETED", "FAILED"].includes(cachedRun?.status ?? ""),
    refetchInterval: (query) =>
      ["COMPLETED", "FAILED"].includes(
        (query.state.data as InquiryAssistRun | undefined)?.status ?? "",
      )
        ? false
        : 1_000,
  });
  const run = runQuery.data ?? cachedRun;
  const draftReply = normalizeInquiryDraftText(run?.draftReply ?? "");

  useEffect(() => {
    if (run && run !== cachedRun) onRun(run);
  }, [cachedRun, onRun, run]);

  useEffect(() => {
    const contextKey = `${thread.questionKey}:${focusMessageKey ?? ""}`;
    if (!run && requestedContextRef.current !== contextKey) {
      requestedContextRef.current = contextKey;
      createMutation.mutate();
    }
  }, [focusMessageKey, run, thread.questionKey]);

  const running =
    createMutation.isPending ||
    run?.status === "QUEUED" ||
    run?.status === "RUNNING";
  return (
    <Card className="inquiry-assist-panel" size="small">
      <div className="inquiry-assist-heading">
        <Space wrap>
          <RobotOutlined />
          <Text strong>{labels.aiAssist}</Text>
          {run?.providerLabel && <Tag>{run.providerLabel}</Tag>}
          {run?.status === "COMPLETED" && (
            <Tag>
              {labels.tokenUsage}:{" "}
              {run.tokenUsage?.totalTokens ?? labels.tokenUnavailable}
            </Tag>
          )}
        </Space>
        <Button type="text" size="small" onClick={onClose}>
          {labels.hide}
        </Button>
      </div>
      <div className="inquiry-assist-scope">
        <Text strong>{labels.scope}</Text>
        <span>{labels.wholeThread}</span>
        {focusMessageKey && (
          <Tag color="purple">
            {labels.focused}: {focusMessageKey.slice(0, 8)}
          </Tag>
        )}
      </div>
      {createMutation.error || run?.status === "FAILED" ? (
        <Alert
          type="error"
          showIcon
          message={run?.error?.message ?? createMutation.error?.message}
        />
      ) : running ? (
        <Skeleton active paragraph={{ rows: 4 }} title={false} />
      ) : run?.analysis ? (
        <>
          <Segmented
            value={view}
            onChange={(value) => setView(value as "analysis" | "draft")}
            options={[
              { value: "analysis", label: labels.analysis },
              { value: "draft", label: labels.draft },
            ]}
          />
          {view === "analysis" ? (
            <div className="inquiry-analysis-grid">
              <AnalysisList title={labels.facts} values={run.analysis.facts} />
              <AnalysisList
                title={labels.disputes}
                values={run.analysis.disputes}
              />
              <AnalysisList
                title={labels.missing}
                values={run.analysis.missingInformation}
              />
              <AnalysisList title={labels.risks} values={run.analysis.risks} />
              <AnalysisList
                title={labels.checks}
                values={run.analysis.recommendedChecks}
              />
              <section>
                <Text strong>{labels.evidence}</Text>
                <div className="inquiry-evidence-list">
                  {run.analysis.evidence.map((item) => (
                    <Button
                      key={`${item.messageKey}-${item.reason}`}
                      type="link"
                      size="small"
                      onClick={() => {
                        document
                          .getElementById(
                            `inquiry-message-${item.messageKey}`,
                          )
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                      }}
                    >
                      {item.reason}
                    </Button>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="inquiry-draft-editor">
              <Alert type="info" showIcon message={labels.editable} />
              <Input.TextArea
                rows={10}
                value={draftReply}
                onChange={(event) => onDraftChange(event.target.value)}
              />
              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => createMutation.mutate()}
                  loading={createMutation.isPending}
                >
                  {labels.regenerate}
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => navigator.clipboard.writeText(draftReply)}
                >
                  {labels.copyDraft}
                </Button>
              </Space>
            </div>
          )}
        </>
      ) : null}
    </Card>
  );
}

export function normalizeInquiryDraftText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\\+r\\+n|\\+n|\\+r/g, "\n");
}

export function InquirySupportPage({
  locale,
}: {
  locale: LocaleKey;
}) {
  const labels = copy[locale];
  const [form] = Form.useForm<InquirySearchInput>();
  const aiProcessedOnly = Form.useWatch("aiProcessedOnly", form) ?? false;
  const [selectedTicketNo, setSelectedTicketNo] = useState<string | null>(null);
  const [activeAssist, setActiveAssist] = useState<{
    questionKey: string;
    focusMessageKey: string | null;
  } | null>(null);
  const [runs, setRuns] = useState<Record<string, InquiryAssistRun>>({});
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchMutation = useMutation({
    mutationFn: searchInquiryTickets,
  });
  const optionsQuery = useQuery({
    queryKey: ["inquiry-support-options"],
    queryFn: ({ signal }) => fetchInquirySupportOptions(signal),
  });
  const detailQuery = useQuery({
    queryKey: ["inquiry-ticket", selectedTicketNo],
    queryFn: ({ signal }) =>
      fetchInquiryTicket(selectedTicketNo!, signal),
    enabled: Boolean(selectedTicketNo),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const tickets = searchMutation.data?.tickets ?? [];
  const columns = useMemo<TableColumnsType<InquirySearchTicket>>(
    () => [
      {
        title: labels.no,
        dataIndex: "ticketNo",
        width: 112,
        render: (value) => <span className="business-code">{value}</span>,
      },
      { title: labels.subject, dataIndex: "title" },
      {
        title: labels.assignee,
        dataIndex: "assignee",
        width: 150,
        render: (value) => value || labels.unassigned,
      },
      {
        title: labels.status,
        dataIndex: "status",
        width: 170,
        render: (value) => <Tag color={statusColor(value)}>{value}</Tag>,
      },
      {
        title: labels.updated,
        dataIndex: "updatedAt",
        width: 170,
        render: dateTime,
      },
      {
        title: labels.requested,
        dataIndex: "requestedReplyAt",
        width: 150,
        render: dateTime,
      },
      { title: labels.customerList, dataIndex: "customer", width: 190 },
    ],
    [labels],
  );
  const detail = detailQuery.data;

  function openTicket(ticketNo: string) {
    setActiveAssist(null);
    setRuns({});
    setSelectedTicketNo(ticketNo);
  }

  function closeTicket() {
    setSelectedTicketNo(null);
    setActiveAssist(null);
  }

  function updateRun(run: InquiryAssistRun) {
    setRuns((current) => ({ ...current, [run.questionKey]: run }));
  }

  return (
    <div className="module-page inquiry-support-page">
      <section className="module-hero inquiry-support-hero">
        <span className="module-icon"><MessageOutlined /></span>
        <div>
          <span className="eyebrow">UPDS</span>
          <Title level={1}>{labels.title}</Title>
          <p>{labels.description}</p>
        </div>
      </section>
      <Card className="inquiry-search-card">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: "open",
            assignee: "",
            createdTo: formatInquiryLocalDate(),
            aiProcessedOnly: false,
          }}
          onFinish={(values) => searchMutation.mutate(values)}
        >
          <Form.Item
            name="aiProcessedOnly"
            valuePropName="checked"
            hidden
          >
            <input type="checkbox" />
          </Form.Item>
          <div className="inquiry-search-grid">
            <Form.Item
              name="ticketNo"
              label={labels.ticketNoSearch}
              className="inquiry-search-ticket"
              rules={[
                {
                  pattern: /^\d{1,20}$/,
                  message: labels.ticketNoPlaceholder,
                },
              ]}
            >
              <Input
                inputMode="numeric"
                maxLength={20}
                placeholder={labels.ticketNoPlaceholder}
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="content"
              label={labels.contentSearch}
              className="inquiry-search-content"
            >
              <Input
                maxLength={200}
                placeholder={labels.contentPlaceholder}
                allowClear
              />
            </Form.Item>
            <Form.Item
              label={labels.createdRange}
              className="inquiry-search-range"
            >
              <Space.Compact block>
                <Form.Item name="createdFrom" noStyle>
                  <Input type="date" aria-label={labels.from} />
                </Form.Item>
                <Form.Item name="createdTo" noStyle>
                  <Input type="date" aria-label={labels.to} />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
            <Form.Item
              name="assignee"
              label={labels.assignee}
              className="inquiry-search-assignee"
            >
              <Select
                allowClear
                showSearch
                placeholder={labels.allAssignees}
                optionFilterProp="label"
                options={optionsQuery.data?.assignees ?? []}
                loading={optionsQuery.isLoading}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={labels.status}
              className="inquiry-search-status"
              rules={[{ required: true, message: labels.required }]}
            >
              <Select options={statuses} />
            </Form.Item>
            <Form.Item
              label={labels.aiHistory}
              className="inquiry-search-history"
            >
              <Button
                type={aiProcessedOnly ? "primary" : "default"}
                icon={<HistoryOutlined />}
                aria-pressed={aiProcessedOnly}
                onClick={() => {
                  form.setFieldValue("aiProcessedOnly", !aiProcessedOnly);
                }}
              >
                {labels.aiProcessedOnly}
              </Button>
            </Form.Item>
            <Form.Item className="inquiry-search-action">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={searchMutation.isPending}
              >
                {labels.search}
              </Button>
            </Form.Item>
          </div>
        </Form>
      </Card>
      <div ref={resultsRef}>
        <Card
          className="inquiry-results-card"
          title={labels.results}
          extra={
            searchMutation.data && (
              <Text type="secondary">
                {searchMutation.data.displayedCount} /{" "}
                {searchMutation.data.actualCount}
              </Text>
            )
          }
        >
          {searchMutation.error && (
            <Alert
              type="error"
              showIcon
              message={labels.searchFailed}
              description={searchMutation.error.message}
            />
          )}
          {searchMutation.data?.sourceTruncated && (
            <Alert
              type="warning"
              showIcon
              message={labels.sourceLimited}
              className="inquiry-source-limit"
            />
          )}
          <Table
            rowKey="ticketNo"
            columns={columns}
            dataSource={tickets}
            loading={searchMutation.isPending}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            scroll={{ x: 1_180 }}
            onRow={(record) => ({
              tabIndex: 0,
              role: "button",
              onClick: () => openTicket(record.ticketNo),
              onKeyDown: (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openTicket(record.ticketNo);
                }
              },
            })}
          />
        </Card>
      </div>
      <Drawer
        className="inquiry-detail-drawer"
        placement="right"
        width="min(88vw, 1600px)"
        open={Boolean(selectedTicketNo)}
        onClose={closeTicket}
        destroyOnHidden
        title={null}
        styles={{ body: { padding: 0, overflow: "auto" } }}
      >
        {detailQuery.isLoading ? (
          <div className="inquiry-drawer-loading"><Skeleton active /></div>
        ) : detailQuery.error || !detail ? (
          <Alert
            type="error"
            showIcon
            message={labels.loadFailed}
            description={detailQuery.error?.message}
          />
        ) : (
          <>
            <header className="inquiry-detail-header">
              <div className="inquiry-detail-title">
                <div>
                  <Space wrap>
                    <span className="business-code">No. {detail.ticketNo}</span>
                    <span
                      className="inquiry-level-badge"
                      aria-label={`${labels.ticketLevel}: ${
                        detail.inquiryLevel || labels.levelUnset
                      }`}
                    >
                      <FlagFilled aria-hidden />
                      <span>{labels.ticketLevel}</span>
                      <strong>
                        {detail.inquiryLevel || labels.levelUnset}
                      </strong>
                    </span>
                    <Tag color={statusColor(detail.status)}>{detail.status}</Tag>
                    {detail.subStatus && <Tag>{detail.subStatus}</Tag>}
                  </Space>
                  <Title level={2}>{detail.title}</Title>
                </div>
                <Space wrap>
                  <Button
                    href={detail.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    icon={<GlobalOutlined />}
                  >
                    {labels.openSource}
                  </Button>
                  <Button onClick={closeTicket}>{labels.close}</Button>
                </Space>
              </div>
              <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }}>
                <Descriptions.Item label={labels.assignee}>
                  {detail.assignee?.displayName || labels.unassigned}
                </Descriptions.Item>
                <Descriptions.Item label={labels.customer}>
                  {detail.customer.name || "—"}
                </Descriptions.Item>
                <Descriptions.Item label={labels.category}>
                  {detail.category.join(" / ") || "—"}
                </Descriptions.Item>
                <Descriptions.Item label={labels.urgency}>
                  {detail.urgency || "—"}
                </Descriptions.Item>
                <Descriptions.Item label={labels.created}>
                  {dateTime(detail.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label={labels.updated}>
                  {dateTime(detail.updatedAt)}
                </Descriptions.Item>
                <Descriptions.Item label={labels.requested}>
                  {dateTime(detail.requestedReplyAt)}
                </Descriptions.Item>
                <Descriptions.Item label={labels.attachments}>
                  {detail.attachments.length}
                </Descriptions.Item>
              </Descriptions>
              <Collapse
                ghost
                size="small"
                items={[
                  {
                    key: "customer",
                    label: labels.customerInfo,
                    children: (
                      <Descriptions size="small" column={3}>
                        <Descriptions.Item label={labels.customer}>
                          {detail.customer.contactName || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                          {detail.customer.email || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="TEL">
                          {detail.customer.phone || "—"}
                        </Descriptions.Item>
                      </Descriptions>
                    ),
                  },
                ]}
              />
            </header>
            <main className="inquiry-thread-list">
              {detail.evaluation && (
                <Card
                  size="small"
                  className="inquiry-evaluation-card"
                  aria-label={labels.customerEvaluation}
                >
                  <div className="inquiry-evaluation-heading">
                    <Space wrap>
                      <StarOutlined aria-hidden />
                      <Text strong>{labels.customerEvaluation}</Text>
                      <Tag color="gold">
                        {labels.satisfaction}:{" "}
                        {detail.evaluation.satisfaction || "—"}
                      </Tag>
                    </Space>
                    {detail.evaluation.submittedAt && (
                      <Text type="secondary">
                        {labels.evaluationReceived}:{" "}
                        {dateTime(detail.evaluation.submittedAt)}
                      </Text>
                    )}
                  </div>
                  <Paragraph className="inquiry-evaluation-comment">
                    {detail.evaluation.comment ||
                      labels.noEvaluationComment}
                  </Paragraph>
                </Card>
              )}
              <Collapse
                defaultActiveKey={[
                  detail.questionThreads.at(-1)?.questionKey ?? "",
                ]}
                items={detail.questionThreads.map((thread) => ({
                  key: thread.questionKey,
                  label: (
                    <Space wrap>
                      <Tag color="cyan">Q{thread.sequence}</Tag>
                      <Text strong>
                        {thread.sequence === 1
                          ? labels.question
                          : labels.followUp}
                      </Text>
                      <Text type="secondary">
                        {dateTime(thread.customerQuestion.createdAt)}
                      </Text>
                    </Space>
                  ),
                  children: (
                    <section className="inquiry-thread">
                      <article
                        id={`inquiry-question-${thread.questionKey}`}
                        className="inquiry-customer-question"
                      >
                        <Space wrap>
                          <Tag color="cyan" icon={<UserOutlined />}>
                            {thread.sequence === 1
                              ? labels.question
                              : labels.followUp}
                          </Tag>
                          <time>
                            {dateTime(thread.customerQuestion.createdAt)}
                          </time>
                          {thread.customerQuestion.requestedReplyAt && (
                            <Text type="secondary">
                              {labels.requested}:{" "}
                              {dateTime(
                                thread.customerQuestion.requestedReplyAt,
                              )}
                            </Text>
                          )}
                        </Space>
                        <Paragraph>{thread.customerQuestion.body}</Paragraph>
                        <AttachmentList
                          ticketNo={detail.ticketNo}
                          attachments={thread.customerQuestion.attachments}
                        />
                      </article>
                      <div className="inquiry-conversation">
                        {thread.messages.map((message) => (
                          <MessageBubble
                            key={message.messageKey}
                            ticketNo={detail.ticketNo}
                            message={message}
                            labels={labels}
                            focused={
                              activeAssist?.focusMessageKey ===
                              message.messageKey
                            }
                            onFocus={() =>
                              setActiveAssist({
                                questionKey: thread.questionKey,
                                focusMessageKey: message.messageKey,
                              })
                            }
                          />
                        ))}
                      </div>
                      <footer className="inquiry-next-reply">
                        <span>{labels.nextReply}</span>
                        <Tooltip title={labels.aiAssist}>
                          <Button
                            type="text"
                            icon={<RobotOutlined />}
                            aria-label={labels.aiAssist}
                            onClick={() =>
                              setActiveAssist({
                                questionKey: thread.questionKey,
                                focusMessageKey: null,
                              })
                            }
                          >
                            {labels.aiAssist}
                          </Button>
                        </Tooltip>
                      </footer>
                      {activeAssist?.questionKey === thread.questionKey && (
                        <AssistPanel
                          ticketNo={detail.ticketNo}
                          thread={thread}
                          labels={labels}
                          focusMessageKey={activeAssist.focusMessageKey}
                          cachedRun={
                            runs[thread.questionKey]?.focusMessageKey ===
                            activeAssist.focusMessageKey
                              ? runs[thread.questionKey]
                              : undefined
                          }
                          onRun={updateRun}
                          onClose={() => setActiveAssist(null)}
                          onDraftChange={(value) => {
                            const run = runs[thread.questionKey];
                            if (run) {
                              updateRun({ ...run, draftReply: value });
                            }
                          }}
                        />
                      )}
                    </section>
                  ),
                }))}
              />
            </main>
          </>
        )}
      </Drawer>
    </div>
  );
}
