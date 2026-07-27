import {
  BulbOutlined,
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileOutlined,
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
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createInquiryAssistRun,
  fetchInquiryAssistRun,
  fetchInquirySupportOptions,
  fetchInquiryTicket,
  fetchInquiryTicketAssistRuns,
  inquiryAttachmentUrl,
  searchInquiryTickets,
  type InquiryAssistRun,
  type InquiryAttachment,
  type InquiryMessage,
  type InquiryQuestionThread,
  type InquirySearchInput,
  type InquirySearchTicket,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import {
  displayInquiryUrgency,
  formatInquiryLocalDate,
  hasInquirySearchConstraint,
  inquiryAttachmentPresentation,
} from "./inquiry-support-utils";

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
    allStatuses: "すべて",
    required: "ステータスを選択してください",
    statusAllRequiresFilter:
      "他の検索条件がない場合は、具体的なステータスを選択してください",
    search: "検索",
    aiHistory: "AI履歴",
    aiProcessedOnly: "AI対応履歴あり",
    assistHistory: "AI補助履歴",
    assistHistoryHint: "この問合せで実行した AI 分析と返信案を確認します",
    assistHistoryEmpty: "この問合せには AI 補助履歴がありません",
    assistHistoryLoadFailed: "AI 補助履歴を読み込めませんでした",
    assistHistoryCount: "件",
    provider: "Provider",
    questionBlock: "質問ブロック",
    completed: "完了日時",
    completedStatus: "完了",
    queued: "待機中",
    failed: "失敗",
    inputTokens: "入力",
    outputTokens: "出力",
    totalTokens: "合計",
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
    normalUrgency: "一般",
    created: "作成日時",
    attachments: "添付",
    attachmentPreview: "プレビュー",
    attachmentDownload: "ダウンロード",
    attachmentPreviewTitle: "添付ファイルをプレビュー",
    attachmentOfficeHint:
      "ブラウザーの Office 表示機能で開きます。表示できない場合はダウンロードしてください。",
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
    unansweredAnalysis: "未回答の質問分析",
    repliedAnalysis: "返信内容の分析",
    keyPoints: "問題の要点",
    investigationDirections: "調査方向",
    facts: "確認できる事実",
    disputes: "論点",
    replyAssessment: "返信全体の評価",
    focusedReplyAssessment: "重点返信の評価",
    missing: "不足情報",
    missingViewpoints: "不足している観点",
    risks: "リスク",
    checks: "確認事項",
    replyStructure: "推奨する返信構成",
    draftDecision: "返信案の判断理由",
    readyToDraft: "返信案を作成可能",
    needsInvestigation: "調査後に返信",
    draftDeferred:
      "現時点の証拠だけでは確実な回答を作成できません。問題分析の調査方向と確認事項を先に確認してください。",
    focusedReplyReview: "選択した返信を重点評価",
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
    allStatuses: "全部",
    required: "请选择工单状态",
    statusAllRequiresFilter: "没有其他查询条件时，请选择具体的工单状态",
    search: "查询",
    aiHistory: "AI 历史",
    aiProcessedOnly: "仅显示 AI 处理过",
    assistHistory: "AI 辅助历史",
    assistHistoryHint: "查看此工单过去执行的 AI 分析和辅助回复",
    assistHistoryEmpty: "此工单还没有 AI 辅助历史",
    assistHistoryLoadFailed: "AI 辅助历史加载失败",
    assistHistoryCount: "条",
    provider: "Provider",
    questionBlock: "问题块",
    completed: "完成时间",
    completedStatus: "已完成",
    queued: "等待中",
    failed: "失败",
    inputTokens: "输入",
    outputTokens: "输出",
    totalTokens: "合计",
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
    normalUrgency: "一般",
    created: "创建时间",
    attachments: "附件",
    attachmentPreview: "预览",
    attachmentDownload: "下载",
    attachmentPreviewTitle: "预览附件",
    attachmentOfficeHint:
      "将使用浏览器的 Office 查看功能打开。无法显示时请下载文件。",
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
    unansweredAnalysis: "未回复问题分析",
    repliedAnalysis: "已有回复分析",
    keyPoints: "问题要点",
    investigationDirections: "调查方向",
    facts: "事实",
    disputes: "争议点",
    replyAssessment: "全部回复评价",
    focusedReplyAssessment: "重点回复评价",
    missing: "缺失信息",
    missingViewpoints: "缺失观点",
    risks: "风险",
    checks: "建议确认事项",
    replyStructure: "建议回复结构",
    draftDecision: "回复草案判断",
    readyToDraft: "可以生成客户回复",
    needsInvestigation: "调查后再回复",
    draftDeferred:
      "根据现有证据无法形成可靠结论。请先按照问题分析中的调查方向和确认事项完成调查。",
    focusedReplyReview: "重点审查选中的回复",
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
    allStatuses: "All",
    required: "Select a ticket status",
    statusAllRequiresFilter:
      "Select a specific ticket status when no other search condition is set",
    search: "Search",
    aiHistory: "AI history",
    aiProcessedOnly: "AI processed only",
    assistHistory: "AI assistance history",
    assistHistoryHint: "Review previous AI analyses and reply drafts for this ticket",
    assistHistoryEmpty: "This ticket has no AI assistance history",
    assistHistoryLoadFailed: "AI assistance history could not be loaded",
    assistHistoryCount: "runs",
    provider: "Provider",
    questionBlock: "Question block",
    completed: "Completed",
    completedStatus: "Completed",
    queued: "Queued",
    failed: "Failed",
    inputTokens: "Input",
    outputTokens: "Output",
    totalTokens: "Total",
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
    normalUrgency: "Normal",
    created: "Created",
    attachments: "Attachments",
    attachmentPreview: "Preview",
    attachmentDownload: "Download",
    attachmentPreviewTitle: "Preview attachment",
    attachmentOfficeHint:
      "This file opens with the browser Office viewer. Download it if the preview is unavailable.",
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
    unansweredAnalysis: "Unanswered question analysis",
    repliedAnalysis: "Existing reply analysis",
    keyPoints: "Key issue points",
    investigationDirections: "Investigation directions",
    facts: "Facts",
    disputes: "Disputes",
    replyAssessment: "Reply assessment",
    focusedReplyAssessment: "Focused reply assessment",
    missing: "Missing information",
    missingViewpoints: "Missing viewpoints",
    risks: "Risks",
    checks: "Recommended checks",
    replyStructure: "Recommended reply structure",
    draftDecision: "Draft decision",
    readyToDraft: "Customer reply can be drafted",
    needsInvestigation: "Investigate before replying",
    draftDeferred:
      "The available evidence does not support a reliable conclusion. Complete the investigation directions and checks first.",
    focusedReplyReview: "Review the selected reply",
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
  labels,
  onPreview,
}: {
  ticketNo: string;
  attachments: InquiryAttachment[];
  labels: (typeof copy)[LocaleKey];
  onPreview: (attachment: InquiryAttachment) => void;
}) {
  if (!attachments.length) return null;
  return (
    <div className="inquiry-attachments">
      {attachments.map((attachment) => {
        const previewable = inquiryAttachmentPresentation(attachment.name);
        return (
          <section className="inquiry-attachment" key={attachment.id}>
            <div className="inquiry-attachment-file">
              <FileOutlined aria-hidden />
              <span title={attachment.name}>{attachment.name}</span>
              {attachment.size ? (
                <Text type="secondary">{attachment.size} B</Text>
              ) : null}
            </div>
            {previewable ? (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onPreview(attachment)}
                aria-label={`${labels.attachmentPreview}: ${attachment.name}`}
              >
                {labels.attachmentPreview}
              </Button>
            ) : (
              <Button
                size="small"
                icon={<DownloadOutlined />}
                href={inquiryAttachmentUrl(ticketNo, attachment.id, {
                  mode: "download",
                  name: attachment.name,
                })}
                aria-label={`${labels.attachmentDownload}: ${attachment.name}`}
              >
                {labels.attachmentDownload}
              </Button>
            )}
          </section>
        );
      })}
    </div>
  );
}

function MessageBubble({
  ticketNo,
  message,
  labels,
  focused,
  onFocus,
  onPreviewAttachment,
}: {
  ticketNo: string;
  message: InquiryMessage;
  labels: (typeof copy)[LocaleKey];
  focused: boolean;
  onFocus: () => void;
  onPreviewAttachment: (attachment: InquiryAttachment) => void;
}) {
  if (
    message.kind === "SYSTEM_EVENT" ||
    message.kind === "ATTACHMENT_EVENT"
  ) {
    return (
      <div
        id={`inquiry-message-${message.messageKey}`}
        className={`inquiry-system-event${
          message.kind === "ATTACHMENT_EVENT"
            ? " attachment-event"
            : ""
        }`}
      >
        <div className="inquiry-system-event-line">
          <Tag icon={<FileOutlined />}>
            {message.kind === "ATTACHMENT_EVENT"
              ? labels.attachments
              : labels.system}
          </Tag>
          <span>{message.body}</span>
          <time>{dateTime(message.createdAt)}</time>
        </div>
        {message.kind === "ATTACHMENT_EVENT" && (
          <AttachmentList
            ticketNo={ticketNo}
            attachments={message.attachments}
            labels={labels}
            onPreview={onPreviewAttachment}
          />
        )}
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
          labels={labels}
          onPreview={onPreviewAttachment}
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
  wide = false,
}: {
  title: string;
  values: unknown[];
  wide?: boolean;
}) {
  return (
    <section className={wide ? "wide" : undefined}>
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

function AnalysisDetails({
  analysis,
  labels,
}: {
  analysis: NonNullable<InquiryAssistRun["analysis"]>;
  labels: (typeof copy)[LocaleKey];
}) {
  const mode = analysis.mode;
  const draftReadiness = analysis.draftReadiness;
  return (
    <>
      {(mode || draftReadiness) && (
        <div className="inquiry-analysis-summary">
          {mode && (
            <Tag color={mode === "REPLIED" ? "blue" : "cyan"}>
              {mode === "REPLIED"
                ? labels.repliedAnalysis
                : labels.unansweredAnalysis}
            </Tag>
          )}
          {draftReadiness && (
            <Tag
              color={
                draftReadiness === "READY_TO_DRAFT" ? "success" : "warning"
              }
            >
              {draftReadiness === "READY_TO_DRAFT"
                ? labels.readyToDraft
                : labels.needsInvestigation}
            </Tag>
          )}
        </div>
      )}
      <div className="inquiry-analysis-grid">
        {analysis.keyPoints && (
          <AnalysisList
            title={labels.keyPoints}
            values={analysis.keyPoints}
            wide
          />
        )}
        {analysis.investigationDirections && (
          <AnalysisList
            title={labels.investigationDirections}
            values={analysis.investigationDirections}
            wide
          />
        )}
        <AnalysisList title={labels.facts} values={analysis.facts} />
        <AnalysisList title={labels.disputes} values={analysis.disputes} />
        {analysis.replyAssessment && (
          <AnalysisList
            title={labels.replyAssessment}
            values={analysis.replyAssessment}
            wide
          />
        )}
        {analysis.focusedReplyAssessment?.length ? (
          <AnalysisList
            title={labels.focusedReplyAssessment}
            values={analysis.focusedReplyAssessment}
            wide
          />
        ) : null}
        <AnalysisList
          title={labels.missing}
          values={analysis.missingInformation}
        />
        {analysis.missingViewpoints && (
          <AnalysisList
            title={labels.missingViewpoints}
            values={analysis.missingViewpoints}
          />
        )}
        <AnalysisList title={labels.risks} values={analysis.risks} />
        <AnalysisList
          title={labels.checks}
          values={analysis.recommendedChecks}
        />
        {analysis.replyStructure && (
          <AnalysisList
            title={labels.replyStructure}
            values={analysis.replyStructure}
            wide
          />
        )}
        {analysis.draftDecisionReasons && (
          <AnalysisList
            title={labels.draftDecision}
            values={analysis.draftDecisionReasons}
            wide
          />
        )}
        <section className="wide">
          <Text strong>{labels.evidence}</Text>
          <div className="inquiry-evidence-list">
            {analysis.evidence.map((item) => (
              <Button
                key={`${item.messageKey}-${item.reason}`}
                type="link"
                size="small"
                onClick={() => {
                  document
                    .getElementById(`inquiry-message-${item.messageKey}`)
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
    </>
  );
}

function inquiryThreadAnalysisMode(
  thread: InquiryQuestionThread,
): "UNANSWERED" | "REPLIED" {
  return thread.messages.some(
    (message) =>
      message.kind === "INTERNAL_DISCUSSION" ||
      message.kind === "CUSTOMER_VISIBLE_REPLY",
  )
    ? "REPLIED"
    : "UNANSWERED";
}

function assistRunStatus(
  run: InquiryAssistRun,
  labels: (typeof copy)[LocaleKey],
) {
  switch (run.status) {
    case "QUEUED":
      return { color: "default", label: labels.queued };
    case "RUNNING":
      return { color: "processing", label: labels.running };
    case "COMPLETED":
      return { color: "success", label: labels.completedStatus };
    case "FAILED":
      return { color: "error", label: labels.failed };
  }
}

function AssistHistoryRun({
  run,
  questionSequence,
  labels,
}: {
  run: InquiryAssistRun;
  questionSequence: number | null;
  labels: (typeof copy)[LocaleKey];
}) {
  const status = assistRunStatus(run, labels);
  const draftReply = normalizeInquiryDraftText(run.draftReply);
  return (
    <div className="inquiry-assist-history-run">
      <Descriptions
        size="small"
        column={{ xs: 1, sm: 2, lg: 4 }}
        className="inquiry-assist-history-meta"
      >
        <Descriptions.Item label={labels.questionBlock}>
          {questionSequence
            ? `Q${questionSequence}`
            : run.questionKey.slice(0, 8)}
        </Descriptions.Item>
        <Descriptions.Item label={labels.provider}>
          <Space wrap size={4}>
            <Tag>{run.provider === "MODEL" ? "Model API" : "Agent Gateway"}</Tag>
            <Text>{run.providerLabel}</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={labels.created}>
          {dateTime(run.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label={labels.completed}>
          {dateTime(run.completedAt)}
        </Descriptions.Item>
      </Descriptions>
      <div className="inquiry-assist-history-context">
        <Tag color={status.color}>{status.label}</Tag>
        {run.focusMessageKey && (
          <Tag color="purple">
            {labels.focused}: {run.focusMessageKey.slice(0, 8)}
          </Tag>
        )}
        <Tag>
          {labels.tokenUsage}: {labels.inputTokens}{" "}
          {run.tokenUsage?.inputTokens ?? labels.tokenUnavailable} /{" "}
          {labels.outputTokens}{" "}
          {run.tokenUsage?.outputTokens ?? labels.tokenUnavailable} /{" "}
          {labels.totalTokens}{" "}
          {run.tokenUsage?.totalTokens ?? labels.tokenUnavailable}
        </Tag>
      </div>
      {run.error ? (
        <Alert type="error" showIcon message={run.error.message} />
      ) : run.status === "QUEUED" || run.status === "RUNNING" ? (
        <Alert type="info" showIcon message={status.label} />
      ) : (
        <>
          {run.analysis && (
            <section className="inquiry-assist-history-analysis">
              <Title level={5}>{labels.analysis}</Title>
              <AnalysisDetails analysis={run.analysis} labels={labels} />
            </section>
          )}
          {draftReply && (
            <section className="inquiry-assist-history-draft">
              <div className="inquiry-assist-history-draft-heading">
                <Title level={5}>{labels.draft}</Title>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => navigator.clipboard.writeText(draftReply)}
                >
                  {labels.copyDraft}
                </Button>
              </div>
              <Paragraph>{draftReply}</Paragraph>
            </section>
          )}
          {!draftReply &&
            run.analysis?.draftReadiness === "NEEDS_INVESTIGATION" && (
              <Alert
                type="warning"
                showIcon
                message={labels.needsInvestigation}
                description={labels.draftDeferred}
              />
            )}
        </>
      )}
    </div>
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
  const analysisMode =
    run?.analysis?.mode ?? inquiryThreadAnalysisMode(thread);
  const draftDeferred =
    run?.analysis?.draftReadiness === "NEEDS_INVESTIGATION";

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
        <Tag color={analysisMode === "REPLIED" ? "blue" : "cyan"}>
          {analysisMode === "REPLIED"
            ? labels.repliedAnalysis
            : labels.unansweredAnalysis}
        </Tag>
        {focusMessageKey && (
          <>
            <Tag color="purple">
              {labels.focused}: {focusMessageKey.slice(0, 8)}
            </Tag>
            <Tag color="purple">{labels.focusedReplyReview}</Tag>
          </>
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
            <AnalysisDetails analysis={run.analysis} labels={labels} />
          ) : (
            <div className="inquiry-draft-editor">
              {draftDeferred ? (
                <Alert
                  type="warning"
                  showIcon
                  message={labels.needsInvestigation}
                  description={labels.draftDeferred}
                />
              ) : (
                <>
                  <Alert type="info" showIcon message={labels.editable} />
                  <Input.TextArea
                    rows={10}
                    value={draftReply}
                    onChange={(event) => onDraftChange(event.target.value)}
                  />
                </>
              )}
              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => createMutation.mutate()}
                  loading={createMutation.isPending}
                >
                  {labels.regenerate}
                </Button>
                {draftReply && (
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => navigator.clipboard.writeText(draftReply)}
                  >
                    {labels.copyDraft}
                  </Button>
                )}
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
  const [previewAttachment, setPreviewAttachment] =
    useState<InquiryAttachment | null>(null);
  const [activeAssist, setActiveAssist] = useState<{
    questionKey: string;
    focusMessageKey: string | null;
  } | null>(null);
  const [assistHistoryExpanded, setAssistHistoryExpanded] = useState(false);
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
  const assistHistoryQuery = useQuery({
    queryKey: ["inquiry-ticket-assist-runs", selectedTicketNo],
    queryFn: ({ signal }) =>
      fetchInquiryTicketAssistRuns(selectedTicketNo!, signal),
    enabled: Boolean(selectedTicketNo && assistHistoryExpanded),
    staleTime: 0,
    refetchInterval: (query) =>
      (query.state.data ?? []).some(
        (run) => run.status === "QUEUED" || run.status === "RUNNING",
      )
        ? 2_000
        : false,
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
  const displayedUrgency = detail
    ? displayInquiryUrgency(
        detail.title,
        detail.urgency,
        labels.normalUrgency,
      )
    : labels.normalUrgency;
  const contextualAttachmentIds = new Set(
    detail?.questionThreads.flatMap((thread) => [
      ...thread.customerQuestion.attachments.map(
        (attachment) => attachment.id,
      ),
      ...thread.messages.flatMap((message) =>
        message.attachments.map((attachment) => attachment.id),
      ),
    ]) ?? [],
  );
  const ungroupedAttachments =
    detail?.attachments.filter(
      (attachment) => !contextualAttachmentIds.has(attachment.id),
    ) ?? [];
  const previewPresentation = previewAttachment
    ? inquiryAttachmentPresentation(previewAttachment.name)
    : null;
  const previewUrl =
    selectedTicketNo && previewAttachment
      ? inquiryAttachmentUrl(
          selectedTicketNo,
          previewAttachment.id,
          {
            mode: "preview",
            name: previewAttachment.name,
          },
        )
      : "";

  function openTicket(ticketNo: string) {
    setActiveAssist(null);
    setAssistHistoryExpanded(false);
    setPreviewAttachment(null);
    setRuns({});
    setSelectedTicketNo(ticketNo);
  }

  function closeTicket() {
    setPreviewAttachment(null);
    setSelectedTicketNo(null);
    setActiveAssist(null);
    setAssistHistoryExpanded(false);
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
              dependencies={[
                "ticketNo",
                "content",
                "createdFrom",
                "createdTo",
                "assignee",
                "aiProcessedOnly",
              ]}
              rules={[
                { required: true, message: labels.required },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      value !== "all" ||
                      hasInquirySearchConstraint({
                        ticketNo: getFieldValue("ticketNo"),
                        content: getFieldValue("content"),
                        createdFrom: getFieldValue("createdFrom"),
                        createdTo: getFieldValue("createdTo"),
                        assignee: getFieldValue("assignee"),
                        aiProcessedOnly: getFieldValue("aiProcessedOnly"),
                      })
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(labels.statusAllRequiresFilter),
                    );
                  },
                }),
              ]}
            >
              <Select
                options={[
                  { value: "all", label: labels.allStatuses },
                  ...statuses,
                ]}
              />
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
        rootClassName="inquiry-detail-drawer-root"
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
                  <span
                    className={`inquiry-urgency-value${
                      displayedUrgency === "至急" ? " urgent" : ""
                    }`}
                  >
                    {displayedUrgency}
                  </span>
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
              <Collapse
                className="inquiry-assist-history"
                activeKey={assistHistoryExpanded ? ["assist-history"] : []}
                onChange={(keys) => {
                  const nextKeys = Array.isArray(keys) ? keys : [keys];
                  const expanded = nextKeys.includes("assist-history");
                  setAssistHistoryExpanded(expanded);
                  if (expanded && assistHistoryQuery.data) {
                    void assistHistoryQuery.refetch();
                  }
                }}
                items={[
                  {
                    key: "assist-history",
                    label: (
                      <div className="inquiry-assist-history-heading">
                        <Space wrap>
                          <HistoryOutlined aria-hidden />
                          <Text strong>{labels.assistHistory}</Text>
                          {assistHistoryQuery.data && (
                            <Tag color="purple">
                              {assistHistoryQuery.data.length}{" "}
                              {labels.assistHistoryCount}
                            </Tag>
                          )}
                        </Space>
                        <Text type="secondary">
                          {labels.assistHistoryHint}
                        </Text>
                      </div>
                    ),
                    children: assistHistoryQuery.isLoading ? (
                      <Skeleton active paragraph={{ rows: 3 }} title={false} />
                    ) : assistHistoryQuery.error ? (
                      <Alert
                        type="error"
                        showIcon
                        message={labels.assistHistoryLoadFailed}
                        description={assistHistoryQuery.error.message}
                      />
                    ) : assistHistoryQuery.data?.length ? (
                      <Collapse
                        className="inquiry-assist-history-runs"
                        items={assistHistoryQuery.data.map((run) => {
                          const questionSequence =
                            detail.questionThreads.find(
                              (thread) =>
                                thread.questionKey === run.questionKey ||
                                Boolean(
                                  run.focusMessageKey &&
                                    thread.messages.some(
                                      (message) =>
                                        message.messageKey ===
                                        run.focusMessageKey,
                                    ),
                                ),
                            )?.sequence ?? null;
                          const status = assistRunStatus(run, labels);
                          return {
                            key: run.id,
                            label: (
                              <div className="inquiry-assist-history-run-heading">
                                <Space wrap>
                                  <Tag color={status.color}>
                                    {status.label}
                                  </Tag>
                                  <Text strong>{dateTime(run.createdAt)}</Text>
                                  <Tag>
                                    {labels.questionBlock}:{" "}
                                    {questionSequence
                                      ? `Q${questionSequence}`
                                      : run.questionKey.slice(0, 8)}
                                  </Tag>
                                  <Tag>
                                    {run.provider === "MODEL"
                                      ? "Model API"
                                      : "Agent Gateway"}
                                  </Tag>
                                  <Text>{run.providerLabel}</Text>
                                </Space>
                                <Text type="secondary">
                                  {labels.tokenUsage}:{" "}
                                  {run.tokenUsage?.totalTokens ??
                                    labels.tokenUnavailable}
                                </Text>
                              </div>
                            ),
                            children: (
                              <AssistHistoryRun
                                run={run}
                                questionSequence={questionSequence}
                                labels={labels}
                              />
                            ),
                          };
                        })}
                      />
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={labels.assistHistoryEmpty}
                      />
                    ),
                  },
                ]}
              />
              {ungroupedAttachments.length > 0 && (
                <Card
                  size="small"
                  className="inquiry-ticket-attachments-card"
                  title={labels.attachments}
                >
                  <AttachmentList
                    ticketNo={detail.ticketNo}
                    attachments={ungroupedAttachments}
                    labels={labels}
                    onPreview={setPreviewAttachment}
                  />
                </Card>
              )}
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
                          labels={labels}
                          onPreview={setPreviewAttachment}
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
                            onPreviewAttachment={setPreviewAttachment}
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
      <Drawer
        rootClassName="inquiry-attachment-preview-drawer-root"
        className="inquiry-attachment-preview-drawer"
        placement="right"
        width="min(82vw, 1280px)"
        zIndex={1200}
        open={Boolean(previewAttachment && previewPresentation)}
        onClose={() => setPreviewAttachment(null)}
        destroyOnHidden
        title={
          <div>
            <Text type="secondary">{labels.attachmentPreviewTitle}</Text>
            <div className="inquiry-attachment-preview-title">
              {previewAttachment?.name}
            </div>
          </div>
        }
        extra={
          previewAttachment && selectedTicketNo ? (
            <Button
              icon={<DownloadOutlined />}
              href={inquiryAttachmentUrl(
                selectedTicketNo,
                previewAttachment.id,
                {
                  mode: "download",
                  name: previewAttachment.name,
                },
              )}
            >
              {labels.attachmentDownload}
            </Button>
          ) : null
        }
        styles={{ body: { padding: 0, overflow: "hidden" } }}
      >
        {previewAttachment && previewPresentation ? (
          <div className="inquiry-attachment-preview-shell">
            {previewPresentation === "IMAGE" ? (
              <div className="inquiry-attachment-preview-image-wrap">
                <img
                  className="inquiry-attachment-preview-image"
                  src={previewUrl}
                  alt={previewAttachment.name}
                />
              </div>
            ) : (
              <>
                {["WORD", "EXCEL"].includes(previewPresentation) ? (
                  <Alert
                    className="inquiry-attachment-preview-note"
                    type="info"
                    showIcon
                    message={labels.attachmentOfficeHint}
                  />
                ) : null}
                <iframe
                  className="inquiry-attachment-preview-frame"
                  src={previewUrl}
                  title={previewAttachment.name}
                />
              </>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
