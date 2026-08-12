import {
  BulbOutlined,
  CopyOutlined,
  DeleteOutlined,
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
  DislikeOutlined,
  LikeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Cascader,
  Checkbox,
  Collapse,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
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
  useQueryClient,
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
  deleteInquiryAssistRun,
  fetchEffectiveInquirySearchPolicy,
  fetchInquiryAssistRun,
  fetchInquirySupportOptions,
  fetchInquiryTicket,
  fetchInquiryTicketAssistRuns,
  inquiryAttachmentUrl,
  searchInquiryTickets,
  saveInquiryAssistEvaluation,
  type InquiryAssistAnchor,
  type InquiryAssistRun,
  type InquiryAttachment,
  type InquiryMessage,
  type InquiryQuestionThread,
  type InquirySearchInput,
  type InquirySearchTicket,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import { AiMarkdown } from "./AiMarkdown";
import { ProgressOrb } from "./ProgressOrb";
import {
  buildAiAssistantInquiryContext,
  type AiAssistantInquiryContext,
} from "./ai-assistant-context";
import {
  compareInquiryDate,
  compareInquiryText,
  buildInquiryHierarchyOptions,
  displayInquiryUrgency,
  formatInquiryLocalDate,
  hasInquirySearchConstraint,
  inquiryAttachmentPresentation,
  inquiryAssistHistoryPlacement,
  inquiryAssistErrorMessage,
  isNegativeInquirySatisfaction,
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
    restoreDefault: "既定に戻す",
    defaultSource: "適用中の既定",
    restoredState: "保存中の検索条件",
    modifiedState: "一時変更済み",
    templateAssigneeInvalid: "既定テンプレートの担当者が実サイトに存在しません。管理者がテンプレートを更新してください。",
    templateConfigurationError: "既定テンプレートの同一段階に同じ優先順位の割当があります。管理者が設定を修正してください。",
    aiHistory: "AI履歴",
    aiProcessedOnly: "AI対応履歴あり",
    assistHistory: "AI補助履歴",
    assistHistoryLoadFailed: "AI 補助履歴を読み込めませんでした",
    analysisResponseInvalid:
      "AIの分析結果を画面用の形式へ変換できませんでした。再生成してください。",
    gatewayVisualUnsupported:
      "Agent Gateway は画像添付を受け取れません。Model API を使用するか、CAG の添付リソース対応後に再生成してください。",
    assistHistoryCount: "件",
    assistHistoryUnlocated: "位置を特定できない AI 補助履歴",
    generatedBy: "生成者",
    generatorUnknown: "生成者不明",
    deleteHistory: "この履歴を削除",
    deleteHistoryConfirm: "自分が生成した AI 補助履歴を削除しますか",
    deleteHistoryDescription: "削除後は管理者だけが折りたたまれた記録を参照できます。",
    deleteHistoryOk: "削除",
    cancel: "キャンセル",
    deletedHistory: "削除済みの AI 補助履歴",
    deletedHistoryDetail: "削除済み AI 補助履歴の詳細",
    openDeletedHistory: "削除前の詳細を表示",
    deletedAt: "削除日時",
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
    ticketAnalysis: "問合せ全体分析",
    ticketAnalysisDescription:
      "現在の対応段階を判定し、質問、公開回答、調査状況、添付内容を段階に合わせて分析します。",
    preResponseStage: "初回回答前",
    inProgressStage: "対応中",
    responseReviewStage: "回答確認",
    closedReviewStage: "完了後評価",
    currentHandlingStage: "現在の対応段階",
    questionHandlingStatus: "各質問の対応状況",
    investigationProgress: "調査進捗・確認事項・待ち時間",
    openInvestigationPoints: "未確認事項",
    currentHandlingRisks: "現在の対応状況・リスク",
    nextActions: "次に必要な対応",
    attachmentAnalysis: "添付解析",
    attachmentVisuals: "画像",
    attachmentIncomplete: "未解析あり",
    roundReplyMatches: "各質問と実回答の対応度",
    processFindings: "各回の見落とし・再質問・待ち時間",
    customerEvaluationCorrelation: "顧客評価と対応記録の関係",
    overallServiceAssessment: "全体のサービス品質・リスク・最終結論",
    remediationActions: "必要な是正対応",
    matchLevel: "対応度",
    matched: "充足",
    partial: "一部充足",
    unanswered: "未回答",
    noPublicReply: "公開回答なし",
    omittedPoints: "見落とし",
    repeatedQuestions: "再質問",
    firstPublicReplyWait: "最初の公開回答まで",
    serviceQuality: "サービス品質",
    riskAssessment: "リスク",
    finalConclusion: "最終結論",
    hoursShort: "時間",
    minutesShort: "分",
    nextReply: "次の返信",
    analysis: "問題分析",
    draft: "返信案",
    unansweredAnalysis: "未回答の質問分析",
    questionAnalysis: "お客様の質問分析",
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
    evaluationPrompt: "この AI 分析は参考になりましたか",
    positiveEvaluation: "参考になった",
    negativeEvaluation: "改善が必要",
    evaluationComment: "理由、提案又は評価",
    evaluationCommentPlaceholder: "改善してほしい点や、より良い分析にするための提案を入力してください",
    evaluationSave: "評価を保存",
    evaluationSaved: "評価を保存しました",
    evaluationSaveFailed: "評価を保存できませんでした",
    evaluationLearningNotice: "評価は AI 分析品質の検証及び将来の教師あり学習資料として保存されます。",
    running: "分析中です",
    waitingFullTicket: "問合せ全体と添付内容を分析しています",
    waitingSelection: "選択した内容と問合せ全体を分析しています",
    elapsed: "経過時間",
    editable: "返信案は編集できます。実サイトへの送信は行いません。",
    scope: "対象範囲",
    wholeThread: "選択した分析対象と、問合せ全体の質問・対応記録・顧客評価",
    wholeTicket: "問合せ全体の質問・対応記録・添付情報・顧客評価",
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
    restoreDefault: "恢复默认",
    defaultSource: "当前默认来源",
    restoredState: "已保存的查询条件",
    modifiedState: "已临时修改",
    templateAssigneeInvalid: "默认模板中的负责人已不在真实网站选项中，请管理员更新模板。",
    templateConfigurationError: "默认模板在同一层级存在相同优先级绑定，请管理员修正配置。",
    aiHistory: "AI 历史",
    aiProcessedOnly: "仅显示 AI 处理过",
    assistHistory: "AI 辅助历史",
    assistHistoryLoadFailed: "AI 辅助历史加载失败",
    analysisResponseInvalid:
      "AI 的分析结果格式无法转换为页面结构，请重新生成。",
    gatewayVisualUnsupported:
      "Agent Gateway 目前不能接收图片附件。请使用 Model API，或在 CAG 支持附件资源后重新生成。",
    assistHistoryCount: "条",
    assistHistoryUnlocated: "无法确定位置的 AI 辅助历史",
    generatedBy: "生成人",
    generatorUnknown: "生成人未知",
    deleteHistory: "删除此记录",
    deleteHistoryConfirm: "确定删除自己生成的 AI 辅助历史吗",
    deleteHistoryDescription: "删除后，仅管理员可以查看折叠记录。",
    deleteHistoryOk: "删除",
    cancel: "取消",
    deletedHistory: "已删除的 AI 辅助历史",
    deletedHistoryDetail: "已删除 AI 辅助历史详情",
    openDeletedHistory: "查看删除前的详情",
    deletedAt: "删除时间",
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
    ticketAnalysis: "整票分析",
    ticketAnalysisDescription:
      "自动判断当前处理阶段，并根据阶段分析问题、公开回复、调查进度和附件内容。",
    preResponseStage: "首次回复前",
    inProgressStage: "处理中",
    responseReviewStage: "回复确认",
    closedReviewStage: "完成后评价",
    currentHandlingStage: "当前处理阶段",
    questionHandlingStatus: "各轮问题处理状态",
    investigationProgress: "调查进度、待确认事项和等待时间",
    openInvestigationPoints: "待确认事项",
    currentHandlingRisks: "当前处理状态与风险",
    nextActions: "下一步处理",
    attachmentAnalysis: "附件解析",
    attachmentVisuals: "图片",
    attachmentIncomplete: "存在未解析附件",
    roundReplyMatches: "各轮客户问题与实际回答的匹配程度",
    processFindings: "各轮遗漏、重复询问及等待时间",
    customerEvaluationCorrelation: "客户评价与处理记录的对应关系",
    overallServiceAssessment: "整体服务质量、风险和最终结论",
    remediationActions: "需要补救的事项",
    matchLevel: "匹配程度",
    matched: "充分匹配",
    partial: "部分匹配",
    unanswered: "未回答",
    noPublicReply: "没有公开回复",
    omittedPoints: "遗漏",
    repeatedQuestions: "重复询问",
    firstPublicReplyWait: "首次公开回复等待时间",
    serviceQuality: "整体服务质量",
    riskAssessment: "风险",
    finalConclusion: "最终结论",
    hoursShort: "小时",
    minutesShort: "分钟",
    nextReply: "下一条回复",
    analysis: "问题分析",
    draft: "辅助回复",
    unansweredAnalysis: "未回复问题分析",
    questionAnalysis: "客户问题分析",
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
    evaluationPrompt: "这份 AI 分析对您有帮助吗",
    positiveEvaluation: "有帮助",
    negativeEvaluation: "需要改进",
    evaluationComment: "理由、建议或评价",
    evaluationCommentPlaceholder: "请输入需要改进的内容或使分析更好的建议",
    evaluationSave: "保存评价",
    evaluationSaved: "评价已保存",
    evaluationSaveFailed: "评价保存失败",
    evaluationLearningNotice: "评价将作为 AI 分析质量验证及今后监督学习的资料持久化保存。",
    running: "正在分析",
    waitingFullTicket: "正在分析整张工单及其附件内容",
    waitingSelection: "正在结合整张工单分析所选内容",
    elapsed: "已等待",
    editable: "草案可以编辑。本页面不会向真实网站提交回复。",
    scope: "当前分析范围",
    wholeThread: "当前分析目标，以及整张工单的全部问题、支持记录和客户评价",
    wholeTicket: "整张工单的全部问题、支持记录、附件信息和客户评价",
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
    restoreDefault: "Restore default",
    defaultSource: "Active default",
    restoredState: "Saved search state",
    modifiedState: "Temporarily modified",
    templateAssigneeInvalid: "The assignee in the default template is unavailable on the source site. Ask an administrator to update the template.",
    templateConfigurationError: "Multiple bindings at the same resolution stage have the same priority. Ask an administrator to correct the configuration.",
    aiHistory: "AI history",
    aiProcessedOnly: "AI processed only",
    assistHistory: "AI assistance history",
    assistHistoryLoadFailed: "AI assistance history could not be loaded",
    analysisResponseInvalid:
      "The AI analysis could not be converted to the screen format. Please regenerate it.",
    gatewayVisualUnsupported:
      "Agent Gateway cannot receive image attachments yet. Use Model API or retry after CAG supports attachment resources.",
    assistHistoryCount: "runs",
    assistHistoryUnlocated: "AI assistance history with an unknown position",
    generatedBy: "Generated by",
    generatorUnknown: "Unknown generator",
    deleteHistory: "Delete this history",
    deleteHistoryConfirm: "Delete the AI assistance history you generated?",
    deleteHistoryDescription: "After deletion, only administrators can view its collapsed record.",
    deleteHistoryOk: "Delete",
    cancel: "Cancel",
    deletedHistory: "Deleted AI assistance history",
    deletedHistoryDetail: "Deleted AI assistance history details",
    openDeletedHistory: "View details before deletion",
    deletedAt: "Deleted",
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
    ticketAnalysis: "Full-ticket analysis",
    ticketAnalysisDescription:
      "Detect the current handling stage and analyze questions, public replies, investigation progress, and attachments accordingly.",
    preResponseStage: "Before first reply",
    inProgressStage: "In progress",
    responseReviewStage: "Reply review",
    closedReviewStage: "Post-closure review",
    currentHandlingStage: "Current handling stage",
    questionHandlingStatus: "Handling status by question",
    investigationProgress: "Investigation progress, open points, and wait time",
    openInvestigationPoints: "Open investigation points",
    currentHandlingRisks: "Current handling status and risks",
    nextActions: "Next actions",
    attachmentAnalysis: "Attachment analysis",
    attachmentVisuals: "images",
    attachmentIncomplete: "some files were not parsed",
    roundReplyMatches: "Question and actual reply coverage by round",
    processFindings: "Omissions, repeated questions, and wait time by round",
    customerEvaluationCorrelation: "Customer feedback and handling record",
    overallServiceAssessment: "Overall service quality, risks, and conclusion",
    remediationActions: "Required remediation",
    matchLevel: "Coverage",
    matched: "Matched",
    partial: "Partially matched",
    unanswered: "Unanswered",
    noPublicReply: "No public reply",
    omittedPoints: "Omissions",
    repeatedQuestions: "Repeated questions",
    firstPublicReplyWait: "Wait to first public reply",
    serviceQuality: "Service quality",
    riskAssessment: "Risks",
    finalConclusion: "Final conclusion",
    hoursShort: "h",
    minutesShort: "min",
    nextReply: "Next reply",
    analysis: "Issue analysis",
    draft: "Reply draft",
    unansweredAnalysis: "Unanswered question analysis",
    questionAnalysis: "Customer question analysis",
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
    evaluationPrompt: "Was this AI analysis helpful?",
    positiveEvaluation: "Helpful",
    negativeEvaluation: "Needs improvement",
    evaluationComment: "Reason, suggestion, or evaluation",
    evaluationCommentPlaceholder: "Describe what should improve or suggest a better analysis approach",
    evaluationSave: "Save evaluation",
    evaluationSaved: "Evaluation saved",
    evaluationSaveFailed: "Evaluation could not be saved",
    evaluationLearningNotice: "Evaluations are retained for AI quality review and future supervised learning material.",
    running: "Analysis in progress",
    waitingFullTicket: "Analyzing the full ticket and its attachments",
    waitingSelection: "Analyzing the selection with the full ticket context",
    elapsed: "Elapsed",
    editable: "The draft is editable. This page never posts to the source site.",
    scope: "Analysis scope",
    wholeThread:
      "Selected analysis target plus every question, support record, and customer evaluation in the ticket",
    wholeTicket:
      "Every question, support record, attachment detail, and customer evaluation in the ticket",
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

function InquiryHierarchySelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  loading,
}: {
  value?: string;
  onChange?: (value?: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  ariaLabel: string;
  loading?: boolean;
}) {
  const hierarchy = useMemo(
    () => buildInquiryHierarchyOptions(options),
    [options],
  );
  const selectedPath = value
    ? hierarchy.pathByValue.get(value)
    : undefined;

  return (
    <Cascader
      allowClear
      changeOnSelect
      expandTrigger="hover"
      loading={loading}
      options={hierarchy.options}
      value={selectedPath}
      placeholder={placeholder}
      aria-label={ariaLabel}
      classNames={{
        popup: { root: "inquiry-hierarchy-cascader-popup" },
      }}
      displayRender={(labels) => labels.join(" > ")}
      showSearch={{ limit: false, matchInputWidth: false }}
      onChange={(nextPath) => {
        const selected = nextPath.at(-1);
        onChange?.(
          selected === undefined ? undefined : String(selected),
        );
      }}
    />
  );
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
            <li key={`${title}-${index}`}>
              <AiMarkdown compact>{valueText(value)}</AiMarkdown>
            </li>
          ))}
        </ul>
      ) : (
        <Text type="secondary">—</Text>
      )}
    </section>
  );
}

function formatInquiryWait(
  minutes: number | null,
  labels: (typeof copy)[LocaleKey],
) {
  if (minutes === null) return labels.noPublicReply;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}${labels.minutesShort}`;
  if (!remainder) return `${hours}${labels.hoursShort}`;
  return `${hours}${labels.hoursShort} ${remainder}${labels.minutesShort}`;
}

function FullTicketAnalysisDetails({
  analysis,
  labels,
}: {
  analysis: NonNullable<InquiryAssistRun["analysis"]>;
  labels: (typeof copy)[LocaleKey];
}) {
  const matchPresentation = {
    MATCHED: { color: "success", label: labels.matched },
    PARTIAL: { color: "warning", label: labels.partial },
    UNANSWERED: { color: "error", label: labels.unanswered },
    NO_PUBLIC_REPLY: { color: "default", label: labels.noPublicReply },
  } as const;
  const overall = analysis.overallAssessment;
  const handlingInProgress = ["PRE_RESPONSE", "IN_PROGRESS"].includes(
    analysis.reviewStage ?? "",
  );
  const customerEvaluationAssessment =
    analysis.customerEvaluationAssessment ?? [];
  return (
    <div className="inquiry-full-ticket-analysis">
      {analysis.stageAssessment && (
        <section className="inquiry-full-ticket-stage">
          <Title level={5}>{labels.currentHandlingStage}</Title>
          <AiMarkdown compact>{analysis.stageAssessment}</AiMarkdown>
        </section>
      )}
      <section>
        <Title level={5}>
          {handlingInProgress
            ? labels.questionHandlingStatus
            : labels.roundReplyMatches}
        </Title>
        <div className="inquiry-full-ticket-rounds">
          {(analysis.roundAssessments ?? []).map((item) => {
            const presentation = matchPresentation[item.matchLevel];
            return (
              <article key={`round-${item.questionSequence}`}>
                <div className="inquiry-full-ticket-round-heading">
                  <Text strong>Q{item.questionSequence}</Text>
                  <Tag color={presentation.color}>
                    {labels.matchLevel}: {presentation.label}
                  </Tag>
                </div>
                <AiMarkdown compact>{item.summary}</AiMarkdown>
              </article>
            );
          })}
        </div>
      </section>
      <section>
        <Title level={5}>
          {handlingInProgress
            ? labels.investigationProgress
            : labels.processFindings}
        </Title>
        <div className="inquiry-full-ticket-rounds">
          {(analysis.processFindings ?? []).map((item) => (
            <article key={`process-${item.questionSequence}`}>
              <div className="inquiry-full-ticket-round-heading">
                <Text strong>Q{item.questionSequence}</Text>
                <Tag>
                  {labels.firstPublicReplyWait}:{" "}
                  {formatInquiryWait(
                    item.firstPublicReplyWaitMinutes,
                    labels,
                  )}
                </Tag>
              </div>
              <div className="inquiry-full-ticket-process-grid">
                <div>
                  <Text type="secondary">
                    {handlingInProgress
                      ? labels.openInvestigationPoints
                      : labels.omittedPoints}
                  </Text>
                  <AnalysisList
                    title=""
                    values={item.omittedPoints}
                  />
                </div>
                <div>
                  <Text type="secondary">{labels.repeatedQuestions}</Text>
                  <AnalysisList
                    title=""
                    values={item.repeatedQuestions}
                  />
                </div>
              </div>
              {item.waitAssessment && (
                <AiMarkdown compact>{item.waitAssessment}</AiMarkdown>
              )}
            </article>
          ))}
        </div>
      </section>
      {customerEvaluationAssessment.length > 0 && (
        <AnalysisList
          title={labels.customerEvaluationCorrelation}
          values={customerEvaluationAssessment}
          wide
        />
      )}
      <section className={handlingInProgress ? "in-progress" : undefined}>
        <Title level={5}>
          {handlingInProgress
            ? labels.currentHandlingRisks
            : labels.overallServiceAssessment}
        </Title>
        {overall ? (
          <div className="inquiry-full-ticket-overall">
            {!handlingInProgress && overall.serviceQuality && (
              <div>
                <Text strong>{labels.serviceQuality}</Text>
                <AiMarkdown compact>{overall.serviceQuality}</AiMarkdown>
              </div>
            )}
            <AnalysisList
              title={labels.riskAssessment}
              values={overall.risks}
            />
            {overall.finalConclusion && (
              <div>
                <Text strong>{labels.finalConclusion}</Text>
                <AiMarkdown compact>{overall.finalConclusion}</AiMarkdown>
              </div>
            )}
          </div>
        ) : (
          <Text type="secondary">—</Text>
        )}
      </section>
      <AnalysisList
        title={handlingInProgress
          ? labels.nextActions
          : labels.remediationActions}
        values={analysis.remediationActions ?? []}
        wide
      />
    </div>
  );
}

function AnalysisDetails({
  analysis,
  labels,
  anchor,
}: {
  analysis: NonNullable<InquiryAssistRun["analysis"]>;
  labels: (typeof copy)[LocaleKey];
  anchor?: InquiryAssistAnchor;
}) {
  const mode = analysis.mode;
  const draftReadiness = analysis.draftReadiness;
  const fullTicket = mode === "FULL_TICKET";
  const questionAnalysis = anchor === "QUESTION" || mode === "QUESTION";
  const replyAnalysis = mode === "REPLIED" && !questionAnalysis;
  const visibleDraftReadiness =
    questionAnalysis && draftReadiness === "NO_FURTHER_REPLY_NEEDED"
      ? undefined
      : draftReadiness;
  const reviewStageLabel =
    analysis.reviewStage === "PRE_RESPONSE"
      ? labels.preResponseStage
      : analysis.reviewStage === "IN_PROGRESS"
        ? labels.inProgressStage
        : analysis.reviewStage === "RESPONSE_REVIEW"
          ? labels.responseReviewStage
          : analysis.reviewStage === "CLOSED_REVIEW"
            ? labels.closedReviewStage
            : null;
  return (
    <>
      {(mode || visibleDraftReadiness) && (
        <div className="inquiry-analysis-summary">
          {mode && (
            <Tag
              color={
                mode === "FULL_TICKET"
                  ? "geekblue"
                  : replyAnalysis
                    ? "blue"
                    : "cyan"
              }
            >
              {mode === "FULL_TICKET"
                ? labels.ticketAnalysis
                : questionAnalysis
                  ? labels.questionAnalysis
                  : replyAnalysis
                    ? labels.repliedAnalysis
                    : labels.unansweredAnalysis}
            </Tag>
          )}
          {reviewStageLabel && <Tag color="processing">{reviewStageLabel}</Tag>}
          {visibleDraftReadiness && (
            <Tag
              color={
                visibleDraftReadiness === "READY_TO_DRAFT"
                  ? "success"
                  : visibleDraftReadiness === "NO_FURTHER_REPLY_NEEDED"
                    ? "blue"
                    : "warning"
              }
            >
              {visibleDraftReadiness === "READY_TO_DRAFT"
                ? labels.readyToDraft
                : visibleDraftReadiness === "NO_FURTHER_REPLY_NEEDED"
                  ? labels.noFurtherReplyNeeded
                  : labels.needsInvestigation}
            </Tag>
          )}
        </div>
      )}
      {fullTicket ? (
        <FullTicketAnalysisDetails analysis={analysis} labels={labels} />
      ) : (
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
          {replyAnalysis && analysis.replyAssessment?.length ? (
            <AnalysisList
              title={labels.replyAssessment}
              values={analysis.replyAssessment}
              wide
            />
          ) : null}
          {!questionAnalysis && analysis.focusedReplyAssessment?.length ? (
            <AnalysisList
              title={labels.focusedReplyAssessment}
              values={analysis.focusedReplyAssessment}
              wide
            />
          ) : null}
          {replyAnalysis && analysis.missingViewpoints?.length ? (
            <AnalysisList
              title={labels.missingViewpoints}
              values={analysis.missingViewpoints}
              wide
            />
          ) : null}
        </div>
      )}
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
                      <AiMarkdown compact>{item.reason}</AiMarkdown>
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
  currentUserId,
  onDelete,
  deleting,
}: {
  run: InquiryAssistRun;
  questionSequence: number | null;
  labels: (typeof copy)[LocaleKey];
  currentUserId: string;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const status = assistRunStatus(run, labels);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const draftReply = normalizeInquiryDraftText(run.draftReply);
  const questionAnalysis =
    run.anchor === "QUESTION" || run.analysis?.mode === "QUESTION";
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
        <Descriptions.Item label={labels.generatedBy}>
          <Space size={4}>
            <UserOutlined aria-hidden />
            <Text>{run.generatedBy?.displayName || labels.generatorUnknown}</Text>
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
        {!run.deletedAt && run.generatedBy?.id === currentUserId && (
          deleteConfirmOpen ? (
            <div className="inquiry-assist-history-delete-confirm">
              <div>
                <Text strong>{labels.deleteHistoryConfirm}</Text>
                <Text type="secondary">{labels.deleteHistoryDescription}</Text>
              </div>
              <Space size={6}>
                <Button
                  size="small"
                  disabled={deleting}
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  {labels.cancel}
                </Button>
                <Button
                  size="small"
                  danger
                  type="primary"
                  loading={deleting}
                  onClick={() => onDelete(run.id)}
                >
                  {labels.deleteHistoryOk}
                </Button>
              </Space>
            </div>
          ) : (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              {labels.deleteHistory}
            </Button>
          )
        )}
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
              <AnalysisDetails
                analysis={run.analysis}
                labels={labels}
                anchor={run.anchor}
              />
              {!run.deletedAt && (
                <InquiryAssistEvaluationControl run={run} labels={labels} />
              )}
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
              <AiMarkdown className="inquiry-assist-history-draft-content">
                {draftReply}
              </AiMarkdown>
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
            !questionAnalysis &&
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

function InquiryAssistEvaluationControl({
  run,
  labels,
  onSaved,
}: {
  run: InquiryAssistRun;
  labels: (typeof copy)[LocaleKey];
  onSaved?: (run: InquiryAssistRun) => void;
}) {
  const [rating, setRating] = useState<"POSITIVE" | "NEGATIVE" | null>(
    run.evaluation?.rating ?? null,
  );
  const [comment, setComment] = useState(run.evaluation?.comment ?? "");
  const [saved, setSaved] = useState(Boolean(run.evaluation));
  const mutation = useMutation({
    mutationFn: (input: {
      rating: "POSITIVE" | "NEGATIVE";
      comment?: string;
    }) => saveInquiryAssistEvaluation(run.id, input),
    onSuccess: (evaluation) => {
      setRating(evaluation.rating);
      setComment(evaluation.comment);
      setSaved(true);
      onSaved?.({ ...run, evaluation });
    },
  });

  function choosePositive() {
    setRating("POSITIVE");
    setComment("");
    setSaved(false);
    mutation.mutate({ rating: "POSITIVE", comment: "" });
  }

  function chooseNegative() {
    setRating("NEGATIVE");
    setSaved(false);
  }

  return (
    <section className="inquiry-assist-evaluation" aria-label={labels.evaluationPrompt}>
      <div className="inquiry-assist-evaluation-heading">
        <Text strong>{labels.evaluationPrompt}</Text>
        <Space wrap size={8}>
          <Button
            type={rating === "POSITIVE" ? "primary" : "default"}
            icon={<LikeOutlined />}
            loading={mutation.isPending && mutation.variables?.rating === "POSITIVE"}
            onClick={choosePositive}
          >
            {labels.positiveEvaluation}
          </Button>
          <Button
            danger={rating === "NEGATIVE"}
            type={rating === "NEGATIVE" ? "primary" : "default"}
            icon={<DislikeOutlined />}
            onClick={chooseNegative}
          >
            {labels.negativeEvaluation}
          </Button>
        </Space>
      </div>
      {rating === "NEGATIVE" && (
        <div className="inquiry-assist-evaluation-comment">
          <Text>{labels.evaluationComment}</Text>
          <Input.TextArea
            value={comment}
            maxLength={2000}
            showCount
            autoSize={{ minRows: 3, maxRows: 7 }}
            placeholder={labels.evaluationCommentPlaceholder}
            onChange={(event) => {
              setComment(event.target.value);
              setSaved(false);
            }}
          />
          <Button
            type="primary"
            loading={mutation.isPending}
            onClick={() => mutation.mutate({ rating: "NEGATIVE", comment })}
          >
            {labels.evaluationSave}
          </Button>
        </div>
      )}
      <Text type="secondary" className="inquiry-assist-evaluation-notice">
        {labels.evaluationLearningNotice}
      </Text>
      {mutation.isError ? (
        <Alert type="error" showIcon message={labels.evaluationSaveFailed} />
      ) : saved ? (
        <Text type="success" role="status">{labels.evaluationSaved}</Text>
      ) : null}
    </section>
  );
}

function AssistHistoryAtAnchor({
  runs,
  questionSequence,
  labels,
  title,
  currentUserId,
  onDelete,
  deletingRunId,
}: {
  runs: InquiryAssistRun[];
  questionSequence: number | null;
  labels: (typeof copy)[LocaleKey];
  title?: string;
  currentUserId: string;
  onDelete: (id: string) => void;
  deletingRunId: string | null;
}) {
  const [selectedDeletedRun, setSelectedDeletedRun] =
    useState<InquiryAssistRun | null>(null);
  const activeRuns = runs.filter((run) => !run.deletedAt);
  const deletedRuns = runs.filter((run) => Boolean(run.deletedAt));
  if (!runs.length) return null;

  return (
    <>
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
              <div className="inquiry-assist-history-content">
                {deletedRuns.length > 0 && (
                  <div className="inquiry-assist-history-deleted-icons">
                    <Text type="secondary">{labels.deletedHistory}</Text>
                    <Space wrap size={4}>
                      {deletedRuns.map((run, index) => (
                        <Tooltip
                          key={run.id}
                          title={`${labels.openDeletedHistory} · ${
                            run.generatedBy?.displayName ||
                            labels.generatorUnknown
                          } · ${dateTime(run.deletedAt)}`}
                        >
                          <Button
                            className="inquiry-assist-history-deleted-button"
                            type="text"
                            size="small"
                            shape="circle"
                            icon={<DeleteOutlined />}
                            aria-label={`${labels.openDeletedHistory} ${index + 1}`}
                            onClick={() => setSelectedDeletedRun(run)}
                          />
                        </Tooltip>
                      ))}
                    </Space>
                  </div>
                )}
                {activeRuns.length > 0 && (
                  <Collapse
                    className="inquiry-assist-history-runs"
                    items={activeRuns.map((run) => {
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
                              <Tag icon={<UserOutlined />}>
                                {run.generatedBy?.displayName ||
                                  labels.generatorUnknown}
                              </Tag>
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
                            currentUserId={currentUserId}
                            onDelete={onDelete}
                            deleting={deletingRunId === run.id}
                          />
                        ),
                      };
                    })}
                  />
                )}
              </div>
            ),
          },
        ]}
      />
      <Modal
        className="inquiry-assist-history-deleted-modal"
        open={Boolean(selectedDeletedRun)}
        title={labels.deletedHistoryDetail}
        footer={null}
        width={960}
        destroyOnHidden
        onCancel={() => setSelectedDeletedRun(null)}
      >
        {selectedDeletedRun && (
          <div className="inquiry-assist-history-deleted-detail">
            <Alert
              type="warning"
              showIcon
              message={labels.deletedHistory}
              description={`${labels.deletedAt}: ${dateTime(
                selectedDeletedRun.deletedAt,
              )}`}
            />
            <AssistHistoryRun
              run={selectedDeletedRun}
              questionSequence={questionSequence}
              labels={labels}
              currentUserId={currentUserId}
              onDelete={onDelete}
              deleting={false}
            />
          </div>
        )}
      </Modal>
    </>
  );
}

export function formatInquiryAssistElapsed(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  return [
    ...(hours > 0 ? [String(hours)] : []),
    String(minutes).padStart(hours > 0 ? 2 : 1, "0"),
    String(remainingSeconds).padStart(2, "0"),
  ].join(":");
}

export function resolveInquiryAssistTimerStartedAt(
  requestedAt: string | null | undefined,
  now = Date.now(),
) {
  const parsedRequestedAt = requestedAt
    ? Date.parse(requestedAt)
    : Number.NaN;
  return Number.isFinite(parsedRequestedAt)
    ? Math.min(parsedRequestedAt, now)
    : now;
}

function AssistWaitingState({
  labels,
  fullTicket,
  requestedAt,
}: {
  labels: (typeof copy)[LocaleKey];
  fullTicket: boolean;
  requestedAt?: string | null;
}) {
  const [timerStartedAt] = useState(() =>
    resolveInquiryAssistTimerStartedAt(requestedAt),
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = formatInquiryAssistElapsed(
    Math.floor((now - timerStartedAt) / 1_000),
  );

  return (
    <div className="inquiry-assist-waiting">
      <span className="inquiry-assist-waiting-orb">
        <ProgressOrb
          label={labels.running}
          motion="always"
          size={64}
          speed={1.08}
          state="solving"
          theme="light"
        />
      </span>
      <div className="inquiry-assist-waiting-copy">
        <Text strong role="status">{labels.running}</Text>
        <Text type="secondary">
          {fullTicket ? labels.waitingFullTicket : labels.waitingSelection}
        </Text>
      </div>
      <Tag className="inquiry-assist-elapsed" aria-label={`${labels.elapsed} ${elapsed}`}>
        {labels.elapsed} {elapsed}
      </Tag>
    </div>
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
  const [requestStartedAt, setRequestStartedAt] = useState<string | null>(null);
  const requestedContextRef = useRef("");
  const createMutation = useMutation({
    mutationFn: () =>
      createInquiryAssistRun(
        ticketNo,
        thread.questionKey,
        anchor,
        focusMessageKey,
      ),
    onMutate: () => {
      setRequestStartedAt(new Date().toISOString());
    },
    onSuccess: (createdRun) => {
      onRun(createdRun);
    },
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
    run?.analysis?.mode ??
      (anchor === "TICKET"
        ? "FULL_TICKET"
        : anchor === "QUESTION"
          ? "QUESTION"
          : inquiryThreadAnalysisMode(thread));
  const fullTicket = analysisMode === "FULL_TICKET";
  const questionAnalysis = anchor === "QUESTION" || analysisMode === "QUESTION";
  const draftDeferred =
    run?.analysis?.draftReadiness === "NEEDS_INVESTIGATION";
  const noFurtherReplyNeeded =
    run?.analysis?.draftReadiness === "NO_FURTHER_REPLY_NEEDED";
  const attachmentCoverage = run?.analysis?.attachmentCoverage;

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
    <Card
      className={`inquiry-assist-panel${running ? " inquiry-assist-panel-running" : ""}`}
      size="small"
    >
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
        <span>
          {anchor === "TICKET"
            ? labels.wholeTicket
            : labels.wholeThread}
        </span>
        {anchor === "TICKET" && (
          <Tag color="geekblue">{labels.ticketAnalysis}</Tag>
        )}
        {attachmentCoverage && attachmentCoverage.total > 0 && (
          <Tag
            color={
              attachmentCoverage.failed > 0 ||
                attachmentCoverage.unsupported > 0 ||
                attachmentCoverage.skippedVisualCount > 0
                ? "warning"
                : "purple"
            }
            icon={<FileOutlined />}
          >
            {labels.attachmentAnalysis}: {attachmentCoverage.parsed}/
            {attachmentCoverage.total} · {labels.attachmentVisuals} {" "}
            {attachmentCoverage.visualCount}
            {(attachmentCoverage.failed > 0 ||
              attachmentCoverage.unsupported > 0 ||
              attachmentCoverage.skippedVisualCount > 0) &&
              ` · ${labels.attachmentIncomplete}`}
          </Tag>
        )}
        {!fullTicket && (
          <Tag
            color={analysisMode === "REPLIED" && !questionAnalysis
              ? "blue"
              : "cyan"}
          >
            {questionAnalysis
              ? labels.questionAnalysis
              : analysisMode === "REPLIED"
                ? labels.repliedAnalysis
                : labels.unansweredAnalysis}
          </Tag>
        )}
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
        <div className="inquiry-assist-error">
          <Alert
            type="error"
            showIcon
            message={inquiryAssistErrorMessage(
              run?.error ?? createMutation.error,
              labels.analysisResponseInvalid,
              {
                INQUIRY_ANALYSIS_GATEWAY_VISUAL_ATTACHMENT_UNSUPPORTED:
                  labels.gatewayVisualUnsupported,
              },
            )}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
          >
            {labels.regenerate}
          </Button>
        </div>
      ) : running ? (
        <AssistWaitingState
          labels={labels}
          fullTicket={fullTicket}
          requestedAt={requestStartedAt ?? run?.createdAt}
        />
      ) : run?.analysis ? (
        fullTicket ? (
          <>
            <AnalysisDetails
              analysis={run.analysis}
              labels={labels}
              anchor={anchor}
            />
            <InquiryAssistEvaluationControl
              run={run}
              labels={labels}
              onSaved={onRun}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
            >
              {labels.regenerate}
            </Button>
          </>
        ) : (
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
              <>
                <AnalysisDetails
                  analysis={run.analysis}
                  labels={labels}
                  anchor={anchor}
                />
                <InquiryAssistEvaluationControl
                  run={run}
                  labels={labels}
                  onSaved={onRun}
                />
              </>
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
        )
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

export interface InquirySupportOpenRequest {
  id: number;
  ticketNo: string;
  questionKey: string;
}

export function InquirySupportPage({
  locale,
  currentUserId,
  permissions,
  onAssistantContextChange,
  openRequest,
  onOpenRequestHandled,
}: {
  locale: LocaleKey;
  currentUserId: string;
  permissions: string[];
  onAssistantContextChange?: (
    context: AiAssistantInquiryContext | null,
  ) => void;
  openRequest?: InquirySupportOpenRequest | null;
  onOpenRequestHandled?: (requestId: number) => void;
}) {
  const labels = copy[locale];
  const queryClient = useQueryClient();
  const canViewDeletedHistory = permissions.includes("inquiries.deleted.read");
  const [form] = Form.useForm<InquirySearchInput>();
  const storageKey = `oneops:inquiry-search:${currentUserId}`;
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
  const requestedQuestionKeyRef = useRef("");
  const initializedSearchRef = useRef(false);
  const [policySource, setPolicySource] = useState("");
  const [policyModified, setPolicyModified] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const searchMutation = useMutation({
    mutationFn: searchInquiryTickets,
  });
  const deleteHistoryMutation = useMutation({
    mutationFn: deleteInquiryAssistRun,
    onSuccess: (deletedRun) => {
      setRuns((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([, run]) => run.id !== deletedRun.id),
        ),
      );
      queryClient.setQueryData<InquiryAssistRun[]>(
        [
          "inquiry-ticket-assist-runs",
          selectedTicketNo,
          canViewDeletedHistory,
        ],
        (current) =>
          canViewDeletedHistory
            ? current?.map((run) =>
                run.id === deletedRun.id ? deletedRun : run,
              )
            : current?.filter((run) => run.id !== deletedRun.id),
      );
    },
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
    queryKey: [
      "inquiry-ticket-assist-runs",
      selectedTicketNo,
      canViewDeletedHistory,
    ],
    queryFn: ({ signal }) =>
      fetchInquiryTicketAssistRuns(
        selectedTicketNo!,
        canViewDeletedHistory,
        signal,
      ),
    enabled: Boolean(selectedTicketNo),
    staleTime: 0,
    refetchInterval: (query) =>
      (query.state.data ?? []).some(
        (run) => run.status === "QUEUED" || run.status === "RUNNING",
      )
        ? 2_000
        : false,
  });
  const policyQuery = useQuery({
    queryKey: ["effective-inquiry-search-policy", currentUserId],
    queryFn: ({ signal }) => fetchEffectiveInquirySearchPolicy(signal),
  });

  const applyEffectivePolicy = (
    execute: boolean,
    policy = policyQuery.data,
  ) => {
    setPolicyError("");
    setPolicyModified(false);
    if (!policy || policy.status === "NONE") {
      setPolicySource("");
      form.resetFields();
      form.setFieldsValue({
        status: "open",
        assignee: "",
        keywordOperator: "AND",
        includeRelatedRecords: true,
        createdTo: formatInquiryLocalDate(),
        unassignedOnly: false,
        aiProcessedOnly: false,
      });
      return;
    }
    if (policy.status === "CONFIGURATION_ERROR") {
      setPolicySource("");
      setPolicyError(labels.templateConfigurationError);
      return;
    }
    const filters = { ...policy.template.filters } as Record<string, unknown>;
    const assignee = filters.assignee;
    if (assignee && typeof assignee === "object") {
      const sourceValue = String((assignee as { sourceValue?: unknown }).sourceValue ?? "");
      const available = optionsQuery.data?.assignees.some(
        (option) => option.value === sourceValue,
      );
      if (!sourceValue || !available) {
        setPolicySource(`${policy.source.name} / ${policy.template.name}`);
        setPolicyError(labels.templateAssigneeInvalid);
        return;
      }
      filters.assignee = sourceValue;
    }
    const values = {
      status: "open",
      assignee: "",
      keywordOperator: "AND",
      includeRelatedRecords: true,
      createdTo: formatInquiryLocalDate(),
      unassignedOnly: false,
      aiProcessedOnly: false,
      ...filters,
    } as InquirySearchInput;
    form.resetFields();
    form.setFieldsValue(values);
    setPolicySource(`${policy.source.name} / ${policy.template.name}`);
    if (execute && policy.template.autoExecute) {
      searchMutation.mutate(values);
    }
  };

  useEffect(() => {
    if (
      initializedSearchRef.current ||
      policyQuery.isLoading ||
      optionsQuery.isLoading
    ) return;
    initializedSearchRef.current = true;
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        const values = JSON.parse(saved) as InquirySearchInput;
        form.setFieldsValue(values);
        setPolicySource(labels.restoredState);
        setPolicyModified(true);
        searchMutation.mutate(values);
        return;
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    }
    applyEffectivePolicy(true);
  }, [optionsQuery.isLoading, policyQuery.isLoading, storageKey]);

  useEffect(
    () => () => onAssistantContextChange?.(null),
    [onAssistantContextChange],
  );

  useEffect(() => {
    if (!openRequest) return;
    setActiveAssist(null);
    setPreviewAttachment(null);
    setRuns({});
    requestedQuestionKeyRef.current = openRequest.questionKey;
    const existingThread =
      detailQuery.data?.ticketNo === openRequest.ticketNo
        ? detailQuery.data.questionThreads.find(
            (thread) => thread.questionKey === openRequest.questionKey,
          )
        : null;
    setActiveQuestionKey(existingThread?.questionKey ?? "");
    if (existingThread) {
      requestedQuestionKeyRef.current = "";
    }
    setSelectedTicketNo(openRequest.ticketNo);
    setDetailDrawerOpen(true);
    onOpenRequestHandled?.(openRequest.id);
  }, [detailQuery.data, onOpenRequestHandled, openRequest]);

  useEffect(() => {
    const threads = detailQuery.data?.questionThreads ?? [];
    const requestedQuestionKey = requestedQuestionKeyRef.current;
    const requestedThread = threads.find(
      (thread) => thread.questionKey === requestedQuestionKey,
    );
    setActiveQuestionKey(
      requestedThread?.questionKey ??
        threads.at(-1)?.questionKey ??
        "",
    );
    requestedQuestionKeyRef.current = "";
  }, [detailQuery.data?.ticketNo]);

  useEffect(() => {
    const activeThread = detailQuery.data?.questionThreads.find(
      (thread) => thread.questionKey === activeQuestionKey,
    );
    if (!activeThread) {
      if (openRequest?.ticketNo === selectedTicketNo) return;
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
    openRequest?.ticketNo,
    selectedTicketNo,
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
  const ticketAssistThread = detail?.questionThreads.at(-1) ?? null;
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
        currentUserId={currentUserId}
        onDelete={(id) => deleteHistoryMutation.mutate(id)}
        deletingRunId={
          deleteHistoryMutation.isPending
            ? deleteHistoryMutation.variables
            : null
        }
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

  function ticketAssistHistoryRuns() {
    const activeCacheKey =
      activeAssist?.anchor === "TICKET"
        ? inquiryAssistCacheKey(
            activeAssist.questionKey,
            activeAssist.anchor,
            activeAssist.focusMessageKey,
          )
        : null;
    const activeRunId = activeCacheKey ? runs[activeCacheKey]?.id : null;
    return assistHistoryRuns.filter((run) => {
      if (run.id === activeRunId) return false;
      return inquiryAssistHistoryPlacement(
        run,
        detail?.questionThreads ?? [],
      )?.anchor === "TICKET";
    });
  }

  return (
    <div className="module-page inquiry-support-page">
      <section className="portal-page-hero module-hero inquiry-support-hero">
        <span className="module-icon"><MessageOutlined /></span>
        <div>
          <span className="eyebrow">UPDS</span>
          <Title level={1}>{labels.title}</Title>
          <p>{labels.description}</p>
        </div>
      </section>
      <Card className="inquiry-search-card">
        {policyError && (
          <Alert
            className="inquiry-policy-alert"
            type="error"
            showIcon
            title={policyError}
          />
        )}
        {policySource && !policyError && (
          <Alert
            className="inquiry-policy-alert"
            type="info"
            showIcon
            title={`${labels.defaultSource}: ${policySource}${policyModified ? ` / ${labels.modifiedState}` : ""}`}
          />
        )}
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
          onValuesChange={() => {
            if (initializedSearchRef.current) setPolicyModified(true);
          }}
          onFinish={(values) => {
            sessionStorage.setItem(storageKey, JSON.stringify(values));
            setPolicyModified(true);
            searchMutation.mutate(values);
          }}
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
              <Space orientation="vertical" size={6}>
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
                      <InquiryHierarchySelect
                        placeholder={labels.allOptions}
                        options={optionsQuery.data?.categories ?? []}
                        ariaLabel={labels.searchCategory}
                        loading={optionsQuery.isLoading}
                      />
                    </Form.Item>
                    <Form.Item
                      name="classificationResult"
                      label={labels.classificationResult}
                      className="inquiry-search-classification"
                    >
                      <InquiryHierarchySelect
                        placeholder={labels.allOptions}
                        options={
                          optionsQuery.data?.classificationResults ?? []
                        }
                        ariaLabel={labels.classificationResult}
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
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={async () => {
                    sessionStorage.removeItem(storageKey);
                    const refreshed = await policyQuery.refetch();
                    applyEffectivePolicy(true, refreshed.data);
                  }}
                >
                  {labels.restoreDefault}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  loading={searchMutation.isPending}
                >
                  {labels.search}
                </Button>
              </Space>
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
        size="min(88vw, 1600px)"
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
                      {renderAssistHistory(thread, "NEXT_REPLY", null)}
                    </section>
                  ),
                }))}
              />
              {ticketAssistThread && (
                <section
                  className="inquiry-ticket-assist-section"
                  aria-label={labels.ticketAnalysis}
                >
                  <div className="inquiry-ticket-assist-intro">
                    <div>
                      <Space wrap>
                        <RobotOutlined aria-hidden />
                        <Text strong>{labels.ticketAnalysis}</Text>
                      </Space>
                      <Paragraph type="secondary">
                        {labels.ticketAnalysisDescription}
                      </Paragraph>
                    </div>
                    <Button
                      icon={<RobotOutlined />}
                      aria-label={labels.ticketAnalysis}
                      onClick={() =>
                        setActiveAssist({
                          questionKey: ticketAssistThread.questionKey,
                          anchor: "TICKET",
                          focusMessageKey: null,
                        })
                      }
                    >
                      {labels.ticketAnalysis}
                    </Button>
                  </div>
                  {renderAssistPanel(ticketAssistThread, "TICKET", null)}
                  <AssistHistoryAtAnchor
                    runs={ticketAssistHistoryRuns()}
                    questionSequence={null}
                    labels={labels}
                    currentUserId={currentUserId}
                    onDelete={(id) => deleteHistoryMutation.mutate(id)}
                    deletingRunId={
                      deleteHistoryMutation.isPending
                        ? deleteHistoryMutation.variables
                        : null
                    }
                  />
                </section>
              )}
              <AssistHistoryAtAnchor
                runs={unlocatedAssistHistoryRuns}
                questionSequence={null}
                labels={labels}
                title={labels.assistHistoryUnlocated}
                currentUserId={currentUserId}
                onDelete={(id) => deleteHistoryMutation.mutate(id)}
                deletingRunId={
                  deleteHistoryMutation.isPending
                    ? deleteHistoryMutation.variables
                    : null
                }
              />
              {detail.evaluation && (
                <Card
                  size="small"
                  className={`inquiry-evaluation-card${
                    isNegativeInquirySatisfaction(
                      detail.evaluation.satisfaction,
                    )
                      ? " inquiry-evaluation-card--negative"
                      : ""
                  }`}
                  aria-label={labels.customerEvaluation}
                >
                  <div className="inquiry-evaluation-heading">
                    <Space wrap>
                      <StarOutlined aria-hidden />
                      <Text strong>{labels.customerEvaluation}</Text>
                      <Tag
                        color={
                          isNegativeInquirySatisfaction(
                            detail.evaluation.satisfaction,
                          )
                            ? "error"
                            : "gold"
                        }
                      >
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
            </main>
          </>
        )}
      </Drawer>
      <Drawer
        rootClassName="inquiry-attachment-preview-drawer-root"
        className="inquiry-attachment-preview-drawer"
        placement="right"
        size="min(82vw, 1280px)"
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
