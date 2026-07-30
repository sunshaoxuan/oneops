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
  Checkbox,
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
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createInquiryAssistRun,
  fetchInquiryAssistRun,
  fetchInquirySupportOptions,
  fetchInquiryTicket,
  fetchInquiryTicketAssistRuns,
  inquiryAttachmentUrl,
  searchInquiryTickets,
  type InquiryAssistAnchor,
  type InquiryAssistRun,
  type InquiryAttachment,
  type InquiryMessage,
  type InquiryQuestionThread,
  type InquirySearchInput,
  type InquirySearchTicket,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import {
  buildAiAssistantInquiryContext,
  type AiAssistantInquiryContext,
} from "./ai-assistant-context";
import {
  compareInquiryDate,
  compareInquiryText,
  displayInquiryUrgency,
  formatInquiryLocalDate,
  hasInquirySearchConstraint,
  inquiryAttachmentPresentation,
  inquiryAssistHistoryPlacement,
} from "./inquiry-support-utils";

const { Paragraph, Text, Title } = Typography;

const copy = {
  "ja-JP": {
    title: "問合支援",
    description: "実際のサポートサイトからお問い合わせを検索し、内容を時系列で確認します。",
    createdRange: "作成期間",
    requestedRange: "回答希望期間",
    updatedRange: "更新期間",
    ticketNoSearch: "チケット No.",
    ticketNoPlaceholder: "No.を入力",
    contentSearch: "キーワード",
    contentPlaceholder: "件名・質問・回答・コメント",
    keywordOperator: "キーワード条件",
    includeRelatedRecords: "追加質問・回答・コメントも検索",
    from: "開始日",
    to: "終了日",
    assignee: "担当者",
    allAssignees: "すべて",
    unassignedOnly: "担当者未設定",
    assigneeName: "担当者・確認先の氏名",
    assigneeNamePlaceholder: "氏名から検索",
    advancedConditions: "詳細条件",
    customerSearch: "顧客",
    allCustomers: "すべて",
    customerName: "顧客名",
    customerNamePlaceholder: "顧客名から検索",
    customerCode: "顧客コード",
    customerCodePlaceholder: "顧客コードから検索",
    subStatus: "サブステータス",
    searchCategory: "カテゴリー",
    classificationResult: "分類・調査結果",
    questionerName: "質問者名",
    questionerNamePlaceholder: "質問者名から検索",
    allOptions: "すべて",
    status: "ステータス",
    allStatuses: "すべて",
    required: "ステータスを選択してください",
    statusAllRequiresFilter:
      "他の検索条件がない場合は、具体的なステータスを選択してください",
    search: "検索",
    aiHistory: "AI履歴",
    aiProcessedOnly: "AI対応履歴あり",
    assistHistory: "AI補助履歴",
    assistHistoryLoadFailed: "AI 補助履歴を読み込めませんでした",
    assistHistoryCount: "件",
    assistHistoryUnlocated: "位置を特定できない AI 補助履歴",
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
    useContext: "この返信の品質を分析する",
    useQuestionContext: "お客様の質問を分析する",
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
    replyAssessment: "現在の回答の充足度",
    focusedReplyAssessment: "選択した回答の充足度",
    missing: "不足情報",
    missingViewpoints: "回答できていない要点",
    risks: "リスク",
    checks: "確認事項",
    replyStructure: "推奨する返信構成",
    draftDecision: "返信案の判断理由",
    readyToDraft: "返信案を作成可能",
    needsInvestigation: "調査後に返信",
    noFurtherReplyNeeded: "現在の回答で充足",
    replyAlreadySufficient:
      "現在の回答でお客様の質問を満たしているため、追加返信は不要です。",
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
    requestedRange: "希望回答时间",
    updatedRange: "更新时间",
    ticketNoSearch: "工单 No.",
    ticketNoPlaceholder: "输入工单号",
    contentSearch: "关键词",
    contentPlaceholder: "标题、提问、回复或评论",
    keywordOperator: "关键词条件",
    includeRelatedRecords: "同时查询追加提问、回复和评论",
    from: "开始日期",
    to: "结束日期",
    assignee: "负责人",
    allAssignees: "全部",
    unassignedOnly: "仅未分配",
    assigneeName: "负责人或确认人的姓名",
    assigneeNamePlaceholder: "按姓名查询",
    advancedConditions: "详细条件",
    customerSearch: "客户",
    allCustomers: "全部",
    customerName: "客户名称",
    customerNamePlaceholder: "按客户名称查询",
    customerCode: "客户代码",
    customerCodePlaceholder: "按客户代码查询",
    subStatus: "子状态",
    searchCategory: "类别",
    classificationResult: "分类或调查结果",
    questionerName: "提问人姓名",
    questionerNamePlaceholder: "按提问人查询",
    allOptions: "全部",
    status: "工单状态",
    allStatuses: "全部",
    required: "请选择工单状态",
    statusAllRequiresFilter: "没有其他查询条件时，请选择具体的工单状态",
    search: "查询",
    aiHistory: "AI 历史",
    aiProcessedOnly: "仅显示 AI 处理过",
    assistHistory: "AI 辅助历史",
    assistHistoryLoadFailed: "AI 辅助历史加载失败",
    assistHistoryCount: "条",
    assistHistoryUnlocated: "无法确定位置的 AI 辅助历史",
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
    useContext: "分析该回复的质量",
    useQuestionContext: "分析客户的提问",
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
    replyAssessment: "当前回答满足度",
    focusedReplyAssessment: "所选回答满足度",
    missing: "缺失信息",
    missingViewpoints: "尚未回答的要点",
    risks: "风险",
    checks: "建议确认事项",
    replyStructure: "建议回复结构",
    draftDecision: "回复草案判断",
    readyToDraft: "可以生成客户回复",
    needsInvestigation: "调查后再回复",
    noFurtherReplyNeeded: "当前回答已经充分",
    replyAlreadySufficient: "当前回答已经满足客户问题，无需追加回复。",
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
    requestedRange: "Requested reply range",
    updatedRange: "Updated range",
    ticketNoSearch: "Ticket No.",
    ticketNoPlaceholder: "Enter ticket number",
    contentSearch: "Keyword",
    contentPlaceholder: "Title, question, reply, or comment",
    keywordOperator: "Keyword operator",
    includeRelatedRecords: "Include follow-ups, replies, and comments",
    from: "From",
    to: "To",
    assignee: "Assignee",
    allAssignees: "All",
    unassignedOnly: "Unassigned only",
    assigneeName: "Assignee or reviewer name",
    assigneeNamePlaceholder: "Search by name",
    advancedConditions: "Advanced conditions",
    customerSearch: "Customer",
    allCustomers: "All",
    customerName: "Customer name",
    customerNamePlaceholder: "Search by customer name",
    customerCode: "Customer code",
    customerCodePlaceholder: "Search by customer code",
    subStatus: "Substatus",
    searchCategory: "Category",
    classificationResult: "Classification or investigation result",
    questionerName: "Questioner name",
    questionerNamePlaceholder: "Search by questioner",
    allOptions: "All",
    status: "Ticket status",
    allStatuses: "All",
    required: "Select a ticket status",
    statusAllRequiresFilter:
      "Select a specific ticket status when no other search condition is set",
    search: "Search",
    aiHistory: "AI history",
    aiProcessedOnly: "AI processed only",
    assistHistory: "AI assistance history",
    assistHistoryLoadFailed: "AI assistance history could not be loaded",
    assistHistoryCount: "runs",
    assistHistoryUnlocated: "AI assistance history with an unknown position",
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
    useContext: "Analyze the quality of this reply",
    useQuestionContext: "Analyze the customer question",
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
    replyAssessment: "Current reply coverage",
    focusedReplyAssessment: "Selected reply coverage",
    missing: "Missing information",
    missingViewpoints: "Unanswered points",
    risks: "Risks",
    checks: "Recommended checks",
    replyStructure: "Recommended reply structure",
    draftDecision: "Draft decision",
    readyToDraft: "Customer reply can be drafted",
    needsInvestigation: "Investigate before replying",
    noFurtherReplyNeeded: "Current reply is sufficient",
    replyAlreadySufficient:
      "The current reply satisfies the customer question. No additional reply is needed.",
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

const inquirySearchConstraintFields = [
  "ticketNo",
  "content",
  "createdFrom",
  "createdTo",
  "requestedReplyFrom",
  "requestedReplyTo",
  "updatedFrom",
  "updatedTo",
  "customer",
  "customerName",
  "customerCode",
  "assignee",
  "unassignedOnly",
  "assigneeName",
  "subStatus",
  "category",
  "classificationResult",
  "questionerName",
  "aiProcessedOnly",
] as const;

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
                draftReadiness === "READY_TO_DRAFT"
                  ? "success"
                  : draftReadiness === "NO_FURTHER_REPLY_NEEDED"
                    ? "blue"
                    : "warning"
              }
            >
              {draftReadiness === "READY_TO_DRAFT"
                ? labels.readyToDraft
                : draftReadiness === "NO_FURTHER_REPLY_NEEDED"
                  ? labels.noFurtherReplyNeeded
                  : labels.needsInvestigation}
            </Tag>
          )}
        </div>
      )}
      <div className="inquiry-analysis-grid">
        {analysis.keyPoints?.length ? (
          <AnalysisList
            title={labels.keyPoints}
            values={analysis.keyPoints}
            wide
          />
        ) : null}
        {analysis.investigationDirections?.length ? (
          <AnalysisList
            title={labels.investigationDirections}
            values={analysis.investigationDirections}
            wide
          />
        ) : null}
        {mode === "REPLIED" && analysis.replyAssessment?.length ? (
          <AnalysisList
            title={labels.replyAssessment}
            values={analysis.replyAssessment}
            wide
          />
        ) : null}
        {analysis.focusedReplyAssessment?.length ? (
          <AnalysisList
            title={labels.focusedReplyAssessment}
            values={analysis.focusedReplyAssessment}
            wide
          />
        ) : null}
        {mode === "REPLIED" && analysis.missingViewpoints?.length ? (
          <AnalysisList
            title={labels.missingViewpoints}
            values={analysis.missingViewpoints}
            wide
          />
        ) : null}
      </div>
      {analysis.evidence?.length ? (
        <Collapse
          className="inquiry-analysis-evidence"
          ghost
          size="small"
          items={[
            {
              key: "evidence",
              label: labels.evidence,
              children: (
                <div className="inquiry-evidence-list">
                  {analysis.evidence.map((item) => (
                    <Button
                      key={`${item.messageKey}-${item.reason}`}
                      type="link"
                      size="small"
                      onClick={() => {
                        const target =
                          document.getElementById(
                            `inquiry-message-${item.messageKey}`,
                          ) ??
                          document.getElementById(
                            `inquiry-question-${item.messageKey}`,
                          );
                        target?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }}
                    >
                      {item.reason}
                    </Button>
                  ))}
                </div>
              ),
            },
          ]}
        />
      ) : null}
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
          {!draftReply &&
            run.analysis?.draftReadiness ===
              "NO_FURTHER_REPLY_NEEDED" && (
              <Alert
                type="success"
                showIcon
                message={labels.noFurtherReplyNeeded}
                description={labels.replyAlreadySufficient}
              />
            )}
        </>
      )}
    </div>
  );
}

function AssistHistoryAtAnchor({
  runs,
  questionSequence,
  labels,
  title,
}: {
  runs: InquiryAssistRun[];
  questionSequence: number | null;
  labels: (typeof copy)[LocaleKey];
  title?: string;
}) {
  if (!runs.length) return null;

  return (
    <Collapse
      className="inquiry-inline-assist-history"
      items={[
        {
          key: "history",
          label: (
            <Space wrap>
              <HistoryOutlined aria-hidden />
              <Text strong>{title ?? labels.assistHistory}</Text>
              <Tag color="purple">
                {runs.length} {labels.assistHistoryCount}
              </Tag>
            </Space>
          ),
          children: (
            <Collapse
              className="inquiry-assist-history-runs"
              items={runs.map((run) => {
                const status = assistRunStatus(run, labels);
                return {
                  key: run.id,
                  label: (
                    <div className="inquiry-assist-history-run-heading">
                      <Space wrap>
                        <Tag color={status.color}>{status.label}</Tag>
                        <Text strong>{dateTime(run.createdAt)}</Text>
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
          ),
        },
      ]}
    />
  );
}

function AssistPanel({
  ticketNo,
  thread,
  labels,
  anchor,
  focusMessageKey,
  cachedRun,
  onRun,
  onClose,
  onDraftChange,
}: {
  ticketNo: string;
  thread: InquiryQuestionThread;
  labels: (typeof copy)[LocaleKey];
  anchor: InquiryAssistAnchor;
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
        anchor,
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
  const noFurtherReplyNeeded =
    run?.analysis?.draftReadiness === "NO_FURTHER_REPLY_NEEDED";

  useEffect(() => {
    if (run && run !== cachedRun) onRun(run);
  }, [cachedRun, onRun, run]);

  useEffect(() => {
    const contextKey =
      `${thread.questionKey}:${anchor}:${focusMessageKey ?? ""}`;
    if (!run && requestedContextRef.current !== contextKey) {
      requestedContextRef.current = contextKey;
      createMutation.mutate();
    }
  }, [anchor, focusMessageKey, run, thread.questionKey]);

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
              {noFurtherReplyNeeded ? (
                <Alert
                  type="success"
                  showIcon
                  message={labels.noFurtherReplyNeeded}
                  description={labels.replyAlreadySufficient}
                />
              ) : draftDeferred ? (
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

export function inquiryAssistCacheKey(
  questionKey: string,
  anchor: InquiryAssistAnchor,
  focusMessageKey: string | null,
) {
  return `${questionKey}:${anchor}:${focusMessageKey ?? ""}`;
}

export function InquirySupportPage({
  locale,
  onAssistantContextChange,
}: {
  locale: LocaleKey;
  onAssistantContextChange?: (
    context: AiAssistantInquiryContext | null,
  ) => void;
}) {
  const labels = copy[locale];
  const [form] = Form.useForm<InquirySearchInput>();
  const aiProcessedOnly = Form.useWatch("aiProcessedOnly", form) ?? false;
  const unassignedOnly = Form.useWatch("unassignedOnly", form) ?? false;
  const [selectedTicketNo, setSelectedTicketNo] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [activeQuestionKey, setActiveQuestionKey] = useState("");
  const [previewAttachment, setPreviewAttachment] =
    useState<InquiryAttachment | null>(null);
  const [activeAssist, setActiveAssist] = useState<{
    questionKey: string;
    anchor: InquiryAssistAnchor;
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
  const assistHistoryQuery = useQuery({
    queryKey: ["inquiry-ticket-assist-runs", selectedTicketNo],
    queryFn: ({ signal }) =>
      fetchInquiryTicketAssistRuns(selectedTicketNo!, signal),
    enabled: Boolean(selectedTicketNo),
    staleTime: 0,
    refetchInterval: (query) =>
      (query.state.data ?? []).some(
        (run) => run.status === "QUEUED" || run.status === "RUNNING",
      )
        ? 2_000
        : false,
  });

  useEffect(
    () => () => onAssistantContextChange?.(null),
    [onAssistantContextChange],
  );

  useEffect(() => {
    setActiveQuestionKey(
      detailQuery.data?.questionThreads.at(-1)?.questionKey ?? "",
    );
  }, [detailQuery.data?.ticketNo]);

  useEffect(() => {
    const activeThread = detailQuery.data?.questionThreads.find(
      (thread) => thread.questionKey === activeQuestionKey,
    );
    if (!activeThread) {
      onAssistantContextChange?.(null);
      return;
    }
    onAssistantContextChange?.(
      buildAiAssistantInquiryContext(detailQuery.data!, activeThread),
    );
  }, [
    activeQuestionKey,
    detailQuery.data,
    onAssistantContextChange,
  ]);
  const tickets = searchMutation.data?.tickets ?? [];
  const columns = useMemo<TableColumnsType<InquirySearchTicket>>(
    () => [
      {
        title: labels.no,
        dataIndex: "ticketNo",
        width: 112,
        sorter: (left, right) =>
          compareInquiryText(left.ticketNo, right.ticketNo),
        render: (value) => <span className="business-code">{value}</span>,
      },
      {
        title: labels.subject,
        dataIndex: "title",
        sorter: (left, right) => compareInquiryText(left.title, right.title),
      },
      {
        title: labels.assignee,
        dataIndex: "assignee",
        width: 150,
        sorter: (left, right) =>
          compareInquiryText(left.assignee, right.assignee),
        render: (value) => value || labels.unassigned,
      },
      {
        title: labels.status,
        dataIndex: "status",
        width: 170,
        sorter: (left, right) => compareInquiryText(left.status, right.status),
        render: (value) => <Tag color={statusColor(value)}>{value}</Tag>,
      },
      {
        title: labels.updated,
        dataIndex: "updatedAt",
        width: 170,
        sorter: (left, right) =>
          compareInquiryDate(left.updatedAt, right.updatedAt),
        defaultSortOrder: "descend",
        render: dateTime,
      },
      {
        title: labels.requested,
        dataIndex: "requestedReplyAt",
        width: 150,
        sorter: (left, right) =>
          compareInquiryDate(left.requestedReplyAt, right.requestedReplyAt),
        render: dateTime,
      },
      {
        title: labels.customerList,
        dataIndex: "customer",
        width: 190,
        sorter: (left, right) =>
          compareInquiryText(left.customer, right.customer),
      },
    ],
    [labels],
  );
  const detail = detailQuery.data;
  const assistHistoryRuns = useMemo(() => {
    const runById = new Map<string, InquiryAssistRun>();
    for (const run of [
      ...(assistHistoryQuery.data ?? []),
      ...Object.values(runs),
    ]) {
      runById.set(run.id, run);
    }
    return [...runById.values()].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
  }, [assistHistoryQuery.data, runs]);
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
  const unlocatedAssistHistoryRuns = detail
    ? assistHistoryRuns.filter(
        (run) =>
          inquiryAssistHistoryPlacement(
            run,
            detail.questionThreads,
          ) === null,
      )
    : [];
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
    setPreviewAttachment(null);
    setRuns({});
    setActiveQuestionKey("");
    setSelectedTicketNo(ticketNo);
    setDetailDrawerOpen(true);
  }

  function closeTicket() {
    setPreviewAttachment(null);
    setDetailDrawerOpen(false);
    onAssistantContextChange?.(null);
  }

  function finishDetailDrawerTransition(open: boolean) {
    if (open) return;
    setSelectedTicketNo(null);
    setActiveQuestionKey("");
    setActiveAssist(null);
    setRuns({});
  }

  function updateRun(cacheKey: string, run: InquiryAssistRun) {
    setRuns((current) => ({ ...current, [cacheKey]: run }));
  }

  function historyRunsAt(
    thread: InquiryQuestionThread,
    anchor: InquiryAssistAnchor,
    focusMessageKey: string | null,
  ) {
    if (!detail) return [];
    const activeCacheKey = activeAssist
      ? inquiryAssistCacheKey(
          activeAssist.questionKey,
          activeAssist.anchor,
          activeAssist.focusMessageKey,
        )
      : null;
    const activeRunId = activeCacheKey ? runs[activeCacheKey]?.id : null;
    return assistHistoryRuns.filter((run) => {
      if (run.id === activeRunId) return false;
      const placement = inquiryAssistHistoryPlacement(
        run,
        detail.questionThreads,
      );
      return (
        placement?.questionKey === thread.questionKey &&
        placement.anchor === anchor &&
        placement.focusMessageKey === focusMessageKey
      );
    });
  }

  function renderAssistHistory(
    thread: InquiryQuestionThread,
    anchor: InquiryAssistAnchor,
    focusMessageKey: string | null,
  ) {
    return (
      <AssistHistoryAtAnchor
        runs={historyRunsAt(thread, anchor, focusMessageKey)}
        questionSequence={thread.sequence}
        labels={labels}
      />
    );
  }

  function renderAssistPanel(
    thread: InquiryQuestionThread,
    anchor: InquiryAssistAnchor,
    focusMessageKey: string | null,
  ) {
    if (
      !detail ||
      activeAssist?.questionKey !== thread.questionKey ||
      activeAssist.anchor !== anchor ||
      activeAssist.focusMessageKey !== focusMessageKey
    ) {
      return null;
    }
    const cacheKey = inquiryAssistCacheKey(
      thread.questionKey,
      anchor,
      focusMessageKey,
    );
    return (
      <AssistPanel
        ticketNo={detail.ticketNo}
        thread={thread}
        labels={labels}
        anchor={anchor}
        focusMessageKey={focusMessageKey}
        cachedRun={runs[cacheKey]}
        onRun={(run) => updateRun(cacheKey, run)}
        onClose={() => setActiveAssist(null)}
        onDraftChange={(value) => {
          const run = runs[cacheKey];
          if (run) {
            updateRun(cacheKey, { ...run, draftReply: value });
          }
        }}
      />
    );
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
            keywordOperator: "AND",
            includeRelatedRecords: true,
            createdTo: formatInquiryLocalDate(),
            unassignedOnly: false,
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
          <div className="inquiry-search-grid inquiry-search-main-grid">
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
              label={labels.keywordOperator}
              className="inquiry-search-keyword-options"
            >
              <Space direction="vertical" size={6}>
                <Form.Item name="keywordOperator" noStyle>
                  <Segmented
                    options={[
                      { value: "AND", label: "AND" },
                      { value: "OR", label: "OR" },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="includeRelatedRecords"
                  valuePropName="checked"
                  noStyle
                >
                  <Checkbox>{labels.includeRelatedRecords}</Checkbox>
                </Form.Item>
              </Space>
            </Form.Item>
            <Form.Item
              name="status"
              label={labels.status}
              className="inquiry-search-status"
              dependencies={[...inquirySearchConstraintFields]}
              rules={[
                { required: true, message: labels.required },
                ({ getFieldsValue }) => ({
                  validator(_, value) {
                    if (
                      value !== "all" ||
                      hasInquirySearchConstraint(
                        getFieldsValue([
                          ...inquirySearchConstraintFields,
                        ]),
                      )
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
                disabled={unassignedOnly}
              />
            </Form.Item>
            <Form.Item
              name="unassignedOnly"
              valuePropName="checked"
              className="inquiry-search-unassigned"
            >
              <Checkbox
                onChange={(event) => {
                  if (event.target.checked) {
                    form.setFieldValue("assignee", undefined);
                  }
                }}
              >
                {labels.unassignedOnly}
              </Checkbox>
            </Form.Item>
          </div>
          <Collapse
            className="inquiry-search-advanced"
            defaultActiveKey={["advanced"]}
            items={[
              {
                key: "advanced",
                label: labels.advancedConditions,
                children: (
                  <div className="inquiry-search-grid inquiry-search-advanced-grid">
                    <Form.Item
                      name="customer"
                      label={labels.customerSearch}
                      className="inquiry-search-customer"
                    >
                      <Select
                        allowClear
                        showSearch
                        placeholder={labels.allCustomers}
                        optionFilterProp="label"
                        options={optionsQuery.data?.customers ?? []}
                        loading={optionsQuery.isLoading}
                      />
                    </Form.Item>
                    <Form.Item
                      name="customerName"
                      label={labels.customerName}
                      className="inquiry-search-customer-name"
                    >
                      <Input
                        allowClear
                        maxLength={200}
                        placeholder={labels.customerNamePlaceholder}
                      />
                    </Form.Item>
                    <Form.Item
                      name="customerCode"
                      label={labels.customerCode}
                      className="inquiry-search-customer-code"
                    >
                      <Input
                        allowClear
                        maxLength={100}
                        placeholder={labels.customerCodePlaceholder}
                      />
                    </Form.Item>
                    <Form.Item
                      name="assigneeName"
                      label={labels.assigneeName}
                      className="inquiry-search-assignee-name"
                    >
                      <Input
                        allowClear
                        maxLength={200}
                        placeholder={labels.assigneeNamePlaceholder}
                      />
                    </Form.Item>
                    <Form.Item
                      label={labels.requestedRange}
                      className="inquiry-search-range"
                    >
                      <Space.Compact block>
                        <Form.Item name="requestedReplyFrom" noStyle>
                          <Input type="date" aria-label={labels.from} />
                        </Form.Item>
                        <Form.Item name="requestedReplyTo" noStyle>
                          <Input type="date" aria-label={labels.to} />
                        </Form.Item>
                      </Space.Compact>
                    </Form.Item>
                    <Form.Item
                      label={labels.updatedRange}
                      className="inquiry-search-range"
                    >
                      <Space.Compact block>
                        <Form.Item name="updatedFrom" noStyle>
                          <Input type="date" aria-label={labels.from} />
                        </Form.Item>
                        <Form.Item name="updatedTo" noStyle>
                          <Input type="date" aria-label={labels.to} />
                        </Form.Item>
                      </Space.Compact>
                    </Form.Item>
                    <Form.Item
                      name="subStatus"
                      label={labels.subStatus}
                      className="inquiry-search-substatus"
                    >
                      <Select
                        allowClear
                        placeholder={labels.allOptions}
                        options={optionsQuery.data?.subStatuses ?? []}
                        loading={optionsQuery.isLoading}
                      />
                    </Form.Item>
                    <Form.Item
                      name="category"
                      label={labels.searchCategory}
                      className="inquiry-search-category"
                    >
                      <Select
                        allowClear
                        showSearch
                        placeholder={labels.allOptions}
                        optionFilterProp="label"
                        options={optionsQuery.data?.categories ?? []}
                        loading={optionsQuery.isLoading}
                        popupMatchSelectWidth={520}
                      />
                    </Form.Item>
                    <Form.Item
                      name="classificationResult"
                      label={labels.classificationResult}
                      className="inquiry-search-classification"
                    >
                      <Select
                        allowClear
                        showSearch
                        placeholder={labels.allOptions}
                        optionFilterProp="label"
                        options={
                          optionsQuery.data?.classificationResults ?? []
                        }
                        loading={optionsQuery.isLoading}
                      />
                    </Form.Item>
                    <Form.Item
                      name="questionerName"
                      label={labels.questionerName}
                      className="inquiry-search-questioner"
                    >
                      <Input
                        allowClear
                        maxLength={200}
                        placeholder={labels.questionerNamePlaceholder}
                      />
                    </Form.Item>
                  </div>
                ),
              },
            ]}
          />
          <div className="inquiry-search-footer">
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
            sortDirections={["ascend", "descend"]}
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
        open={detailDrawerOpen}
        onClose={closeTicket}
        afterOpenChange={finishDetailDrawerTransition}
        focusable={{ trap: false, focusTriggerAfterClose: true }}
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
              {assistHistoryQuery.error && (
                <Alert
                  className="inquiry-assist-history-load-error"
                  type="error"
                  showIcon
                  message={labels.assistHistoryLoadFailed}
                  description={assistHistoryQuery.error.message}
                />
              )}
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
                activeKey={activeQuestionKey ? [activeQuestionKey] : []}
                accordion
                onChange={(key) =>
                  setActiveQuestionKey(
                    Array.isArray(key)
                      ? String(key.at(-1) ?? "")
                      : String(key ?? ""),
                  )
                }
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
                        <div className="inquiry-customer-question-heading">
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
                          <Tooltip title={labels.useQuestionContext}>
                            <Button
                              type="text"
                              size="small"
                              icon={<BulbOutlined />}
                              aria-label={labels.useQuestionContext}
                              onClick={() =>
                                setActiveAssist({
                                  questionKey: thread.questionKey,
                                  anchor: "QUESTION",
                                  focusMessageKey: null,
                                })
                              }
                            />
                          </Tooltip>
                        </div>
                        <Paragraph>{thread.customerQuestion.body}</Paragraph>
                        <AttachmentList
                          ticketNo={detail.ticketNo}
                          attachments={thread.customerQuestion.attachments}
                          labels={labels}
                          onPreview={setPreviewAttachment}
                        />
                      </article>
                      {renderAssistPanel(thread, "QUESTION", null)}
                      {renderAssistHistory(thread, "QUESTION", null)}
                      <div className="inquiry-conversation">
                        {thread.messages.map((message) => (
                          <Fragment key={message.messageKey}>
                            <MessageBubble
                              ticketNo={detail.ticketNo}
                              message={message}
                              labels={labels}
                              focused={
                                activeAssist?.anchor === "MESSAGE" &&
                                activeAssist.focusMessageKey ===
                                  message.messageKey
                              }
                              onFocus={() =>
                                setActiveAssist({
                                  questionKey: thread.questionKey,
                                  anchor: "MESSAGE",
                                  focusMessageKey: message.messageKey,
                                })
                              }
                              onPreviewAttachment={setPreviewAttachment}
                            />
                            {renderAssistPanel(
                              thread,
                              "MESSAGE",
                              message.messageKey,
                            )}
                            {renderAssistHistory(
                              thread,
                              "MESSAGE",
                              message.messageKey,
                            )}
                          </Fragment>
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
                                anchor: "NEXT_REPLY",
                                focusMessageKey: null,
                              })
                            }
                          >
                            {labels.aiAssist}
                          </Button>
                        </Tooltip>
                      </footer>
                      {renderAssistPanel(thread, "NEXT_REPLY", null)}
                      {renderAssistHistory(thread, "NEXT_REPLY", null)}
                    </section>
                  ),
                }))}
              />
              <AssistHistoryAtAnchor
                runs={unlocatedAssistHistoryRuns}
                questionSequence={null}
                labels={labels}
                title={labels.assistHistoryUnlocated}
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
        focusable={{ trap: false, focusTriggerAfterClose: true }}
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
