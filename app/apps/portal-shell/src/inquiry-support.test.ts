import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildInquiryHierarchyOptions,
  compareInquiryDate,
  compareInquiryText,
  displayInquiryUrgency,
  formatInquiryLocalDate,
  hasInquirySearchConstraint,
  inquiryAttachmentPresentation,
  inquiryAssistErrorMessage,
  inquiryAssistHistoryPlacement,
  isNegativeInquirySatisfaction,
} from "./inquiry-support-utils";

const page = readFileSync(
  resolve(process.cwd(), "src/InquirySupportPage.tsx"),
  "utf8",
);
const settings = readFileSync(
  resolve(process.cwd(), "src/InquirySupportSettingsPage.tsx"),
  "utf8",
);
const secretInput = readFileSync(
  resolve(process.cwd(), "src/SecretInput.tsx"),
  "utf8",
);
const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("inquiry support", () => {
  it("opens a referenced ticket and restores the requested question block", () => {
    expect(page).toContain("export interface InquirySupportOpenRequest");
    expect(page).toContain("requestedQuestionKeyRef.current = openRequest.questionKey");
    expect(page).toContain("setSelectedTicketNo(openRequest.ticketNo)");
    expect(page).toContain("setDetailDrawerOpen(true)");
    expect(page).toContain("existingThread?.questionKey");
    expect(page).toContain(
      "thread.questionKey === requestedQuestionKey",
    );
    expect(page).toContain("requestedThread?.questionKey");
  });

  it("sorts every result column and defaults to newest updated time", () => {
    expect(compareInquiryText("No. 9", "No. 10")).toBeLessThan(0);
    expect(compareInquiryText("阿部", "孫")).not.toBe(0);
    expect(
      compareInquiryDate(
        "2026-07-29T09:00:00+09:00",
        "2026-07-30T09:00:00+09:00",
      ),
    ).toBeLessThan(0);
    expect(compareInquiryDate(null, "2026-07-30T09:00:00+09:00")).toBeLessThan(
      0,
    );
    expect(page.match(/sorter: \(left, right\) =>/g)).toHaveLength(7);
    expect(page).toContain('defaultSortOrder: "descend"');
    expect(page).toContain('sortDirections={["ascend", "descend"]}');
  });

  it("restores saved AI history to its ticket, question, message, or next-reply anchor", () => {
    const threads = [
      {
        questionKey: "question-1",
        messages: [{ messageKey: "message-1" }],
      },
    ] as never;
    const run = {
      questionKey: "question-1",
      focusMessageKey: null,
    };

    expect(
      inquiryAssistHistoryPlacement(
        { ...run, anchor: "TICKET" } as never,
        threads,
      ),
    ).toEqual({
      questionKey: null,
      anchor: "TICKET",
      focusMessageKey: null,
    });
    expect(
      inquiryAssistHistoryPlacement(
        { ...run, anchor: "QUESTION" } as never,
        threads,
      ),
    ).toEqual({
      questionKey: "question-1",
      anchor: "QUESTION",
      focusMessageKey: null,
    });
    expect(
      inquiryAssistHistoryPlacement(
        {
          ...run,
          anchor: "MESSAGE",
          focusMessageKey: "message-1",
        } as never,
        threads,
      ),
    ).toEqual({
      questionKey: "question-1",
      anchor: "MESSAGE",
      focusMessageKey: "message-1",
    });
    expect(
      inquiryAssistHistoryPlacement(
        { ...run, anchor: "NEXT_REPLY" } as never,
        threads,
      ),
    ).toEqual({
      questionKey: "question-1",
      anchor: "NEXT_REPLY",
      focusMessageKey: null,
    });
  });

  it("places legacy unfocused runs at next reply and isolates ambiguous runs", () => {
    const threads = [
      {
        questionKey: "question-1",
        messages: [{ messageKey: "message-1" }],
      },
    ] as never;
    expect(
      inquiryAssistHistoryPlacement(
        {
          questionKey: "question-1",
          anchor: undefined,
          focusMessageKey: null,
        } as never,
        threads,
      )?.anchor,
    ).toBe("NEXT_REPLY");
    expect(
      inquiryAssistHistoryPlacement(
        {
          questionKey: "stale",
          anchor: "NEXT_REPLY",
          focusMessageKey: null,
        } as never,
        threads,
      ),
    ).toEqual({
      questionKey: "question-1",
      anchor: "NEXT_REPLY",
      focusMessageKey: null,
    });
    expect(
      inquiryAssistHistoryPlacement(
        {
          questionKey: "stale",
          anchor: "NEXT_REPLY",
          focusMessageKey: null,
        } as never,
        [
          ...threads,
          { questionKey: "question-2", messages: [] },
        ] as never,
      ),
    ).toBeNull();
  });

  it("leaves the start date empty and defaults the end date locally", () => {
    expect(formatInquiryLocalDate(new Date(2026, 6, 27, 12, 0, 0))).toBe(
      "2026-07-27",
    );
    expect(page).toContain("createdTo: formatInquiryLocalDate()");
    expect(page).not.toContain("createdFrom: formatInquiryLocalDate()");
  });

  it("routes the permissioned navigation to the real inquiry page", () => {
    expect(app).toContain(
      'if (item.key === "consulting") return can("inquiries.use")',
    );
    expect(app).toContain('activeNavigation === "consulting"');
    expect(app).toContain("<InquirySupportPage");
    expect(app).toContain("locale={locale}");
    expect(app).toContain(
      "onAssistantContextChange={setAiAssistantInquiryContext}",
    );
  });

  it("loads real multidimensional option values instead of display text", () => {
    expect(page).toContain("fetchInquirySupportOptions");
    expect(page).toContain('queryKey: ["inquiry-support-options"]');
    expect(page).toContain("options={optionsQuery.data?.assignees ?? []}");
    expect(page).toContain("options={optionsQuery.data?.customers ?? []}");
    expect(page).toContain("options={optionsQuery.data?.subStatuses ?? []}");
    expect(page).toContain("options={optionsQuery.data?.categories ?? []}");
    expect(page).toContain(
      "optionsQuery.data?.classificationResults ?? []",
    );
    expect(page).toContain('optionFilterProp="label"');
  });

  it("restores source category paths as a browsable hierarchy", () => {
    const hierarchy = buildInquiryHierarchyOptions([
      { value: "1", label: "サポートサイト" },
      { value: "2", label: "U-PDS" },
      { value: "2:106", label: "U-PDS > 人事" },
      {
        value: "2:501",
        label: "U-PDS > 人事 > 人事情報検索",
      },
    ]);

    expect(hierarchy.options).toEqual([
      { value: "1", label: "サポートサイト" },
      {
        value: "2",
        label: "U-PDS",
        children: [
          {
            value: "2:106",
            label: "人事",
            children: [
              {
                value: "2:501",
                label: "人事情報検索",
              },
            ],
          },
        ],
      },
    ]);
    expect(hierarchy.pathByValue.get("2:501")).toEqual([
      "2",
      "2:106",
      "2:501",
    ]);
    expect(page).toContain("<Cascader");
    expect(page).toContain("changeOnSelect");
    expect(page).toContain('expandTrigger="hover"');
    expect(page).toContain('labels.join(" > ")');
    expect(styles).toContain(".inquiry-hierarchy-cascader-popup");
  });

  it("offers independent ticket, content, and manual AI-history filters", () => {
    expect(page).toContain('name="ticketNo"');
    expect(page).toContain('name="content"');
    expect(page).toContain('Form.useWatch("aiProcessedOnly", form)');
    expect(page).toContain('name="aiProcessedOnly"');
    expect(page).toContain('valuePropName="checked"');
    expect(page).toContain('form.setFieldValue("aiProcessedOnly"');
    expect(page).toContain("aria-pressed={aiProcessedOnly}");
    expect(page).toContain("<HistoryOutlined />");
  });

  it("offers every search dimension supported by the source form", () => {
    for (const name of [
      "keywordOperator",
      "includeRelatedRecords",
      "requestedReplyFrom",
      "requestedReplyTo",
      "updatedFrom",
      "updatedTo",
      "customer",
      "customerName",
      "customerCode",
      "unassignedOnly",
      "assigneeName",
      "subStatus",
      "category",
      "classificationResult",
      "questionerName",
    ]) {
      expect(page).toContain(`name="${name}"`);
    }
    expect(page).not.toContain('defaultActiveKey={["advanced"]}');
    expect(page).toContain("label: labels.advancedConditions");
    expect(page).toContain("form.setFieldValue(\"assignee\", undefined)");
    expect(styles).toMatch(
      /\.inquiry-search-advanced\s*\{[\s\S]*?border-radius:\s*12px/,
    );
  });

  it("allows all statuses only when another search condition exists", () => {
    expect(hasInquirySearchConstraint({})).toBe(false);
    expect(hasInquirySearchConstraint({ createdTo: "2026-07-27" })).toBe(
      true,
    );
    expect(hasInquirySearchConstraint({ ticketNo: "38950" })).toBe(true);
    expect(hasInquirySearchConstraint({ customer: "210" })).toBe(true);
    expect(hasInquirySearchConstraint({ unassignedOnly: true })).toBe(true);
    expect(hasInquirySearchConstraint({ category: "2:107" })).toBe(true);
    expect(hasInquirySearchConstraint({ aiProcessedOnly: true })).toBe(true);
    expect(page).toContain('{ value: "all", label: labels.allStatuses }');
    expect(page).toContain('value !== "all"');
    expect(page).toContain("hasInquirySearchConstraint(");
    expect(page).toContain("statusAllRequiresFilter");
  });

  it("keeps requester details in the ticket and labels the list as customer", () => {
    expect(page).toContain('customerList: "顧客"');
    expect(page).toContain("title: labels.customerList");
  });

  it("uses the requested wide drawer with mobile full-screen layout", () => {
    expect(page).toContain('size="min(88vw, 1600px)"');
    expect(styles).toMatch(
      /\.inquiry-detail-header\s*\{[\s\S]*?position:\s*sticky/,
    );
    expect(styles).toMatch(
      /\.inquiry-detail-drawer-root \.ant-drawer-content-wrapper\s*\{[\s\S]*?width:\s*100vw/,
    );
  });

  it("normalizes urgency and highlights urgent only in the detail field", () => {
    expect(displayInquiryUrgency("【至急】Payroll failure", null, "一般")).toBe(
      "至急",
    );
    expect(displayInquiryUrgency("Payroll question", null, "一般")).toBe(
      "一般",
    );
    expect(displayInquiryUrgency("Payroll question", "低", "一般")).toBe(
      "低",
    );
    expect(page).toContain("displayInquiryUrgency(");
    expect(page).toContain('rootClassName="inquiry-detail-drawer-root"');
    expect(page).toContain("open={detailDrawerOpen}");
    expect(page).toContain(
      "afterOpenChange={finishDetailDrawerTransition}",
    );
    expect(page).toContain(
      "focusable={{ trap: false, focusTriggerAfterClose: true }}",
    );
    expect(page).toMatch(
      /function closeTicket\(\)[\s\S]*?setDetailDrawerOpen\(false\)[\s\S]*?function finishDetailDrawerTransition\(open: boolean\)[\s\S]*?setSelectedTicketNo\(null\)/,
    );
    expect(page).toContain('<Descriptions.Item label={labels.urgency}>');
    expect(page).toContain('className={`inquiry-urgency-value${');
    expect(page).toContain('displayedUrgency === "至急"');
    expect(page).not.toContain("inquiry-urgency-badge");
    expect(page).not.toContain("<FlagFilled");
    expect(page).not.toContain("detail.inquiryLevel || labels.levelUnset");
    expect(styles).toMatch(
      /\.inquiry-urgency-value\.urgent\s*\{[\s\S]*?color:\s*#cf1322[\s\S]*?font-weight:\s*700/,
    );
    expect(styles).toMatch(
      /\.inquiry-detail-drawer-root \.ant-drawer-content-wrapper\s*\{[\s\S]*?width:\s*100vw\s*!important/,
    );
  });

  it("keeps responsive shrinking inside the viewport and table", () => {
    const baseGridRule = styles.indexOf(".inquiry-search-grid {\n  display: grid;");
    const mediumViewportRule = styles.lastIndexOf(
      "@media (max-width: 1180px)",
    );
    expect(styles).toMatch(
      /\.inquiry-support-page\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    );
    expect(styles).toMatch(
      /\.inquiry-results-card \.ant-table-container\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?width:\s*100%/,
    );
    expect(mediumViewportRule).toBeGreaterThan(baseGridRule);
    expect(styles.slice(mediumViewportRule)).toMatch(
      /@media \(max-width:\s*1180px\)\s*\{[\s\S]*?\.inquiry-search-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(page).toContain("scroll={{ x: 1_180 }}");
  });

  it("shows current-user messages on the right and support messages on the left", () => {
    expect(page).toContain('message.relation === "CURRENT_USER"');
    expect(styles).toMatch(
      /\.inquiry-message\.other\s*\{[\s\S]*?align-self:\s*flex-start/,
    );
    expect(styles).toMatch(
      /\.inquiry-message\.own\s*\{[\s\S]*?align-self:\s*flex-end/,
    );
  });

  it("marks visibility using both text and an accessible icon", () => {
    expect(page).toContain("<EyeOutlined />");
    expect(page).toContain("<LockOutlined />");
    expect(page).toContain("aria-label={labels.customerVisible}");
    expect(page).toContain("aria-label={labels.internal}");
  });

  it("preserves message formatting and displays CLOSED customer evaluation", () => {
    expect(isNegativeInquirySatisfaction("やや悪い")).toBe(true);
    expect(isNegativeInquirySatisfaction("満足")).toBe(false);
    expect(styles).toMatch(
      /\.inquiry-customer-question \.ant-typography\s*\{[\s\S]*?white-space:\s*pre-wrap/,
    );
    expect(styles).toMatch(
      /\.inquiry-message-body\s*\{[\s\S]*?white-space:\s*pre-wrap/,
    );
    expect(page).toContain("{detail.evaluation && (");
    expect(page).toContain("aria-label={labels.customerEvaluation}");
    expect(page).toContain("detail.evaluation.satisfaction");
    expect(page).toContain("detail.evaluation.comment");
    expect(page.indexOf("{detail.evaluation && (")).toBeGreaterThan(
      page.indexOf("title={labels.assistHistoryUnlocated}"),
    );
    expect(page).toContain('" inquiry-evaluation-card--negative"');
    expect(styles).toMatch(
      /\.inquiry-evaluation-comment\s*\{[\s\S]*?white-space:\s*pre-wrap/,
    );
    expect(styles).toMatch(
      /\.inquiry-evaluation-card--negative\s*\{[\s\S]*?background:\s*linear-gradient/,
    );
  });

  it("describes the AI assistance scope as the whole ticket", () => {
    expect(page).toContain(
      'wholeThread: "選択した分析対象と、問合せ全体の質問・対応記録・顧客評価"',
    );
    expect(page).toContain(
      'wholeThread: "当前分析目标，以及整张工单的全部问题、支持记录和客户评价"',
    );
    expect(page).toContain(
      '"Selected analysis target plus every question, support record, and customer evaluation in the ticket"',
    );
  });

  it("localizes known AI response format failures and preserves unknown messages", () => {
    expect(
      inquiryAssistErrorMessage(
        {
          code: "INQUIRY_ANALYSIS_RESPONSE_INVALID",
          message: "Analysis provider response has an invalid full-ticket shape.",
        },
        "AI 的分析结果格式无法转换为页面结构，请重新生成。",
      ),
    ).toBe("AI 的分析结果格式无法转换为页面结构，请重新生成。");
    expect(
      inquiryAssistErrorMessage(
        { code: "MODEL_TIMEOUT", message: "Provider timeout" },
        "Localized fallback",
      ),
    ).toBe("Provider timeout");
    expect(
      inquiryAssistErrorMessage(
        {
          code: "INQUIRY_ANALYSIS_GATEWAY_VISUAL_ATTACHMENT_UNSUPPORTED",
          message: "raw",
        },
        "Invalid response",
        {
          INQUIRY_ANALYSIS_GATEWAY_VISUAL_ATTACHMENT_UNSUPPORTED:
            "CAG attachment guidance",
        },
      ),
    ).toBe("CAG attachment guidance");
    expect(page).toContain("labels.analysisResponseInvalid");
    expect(page).toContain('className="inquiry-assist-error"');
    expect(styles).toMatch(
      /\.inquiry-assist-error\s*\{[\s\S]*?display:\s*grid[\s\S]*?gap:\s*12px/,
    );
  });

  it("previews supported attachments in a stacked drawer and downloads others", () => {
    expect(inquiryAttachmentPresentation("image.PNG")).toBe("IMAGE");
    expect(inquiryAttachmentPresentation("manual.pdf")).toBe("PDF");
    expect(inquiryAttachmentPresentation("form.docx")).toBe("WORD");
    expect(inquiryAttachmentPresentation("ledger.xlsx")).toBe("EXCEL");
    expect(inquiryAttachmentPresentation("archive.zip")).toBeNull();
    expect(inquiryAttachmentPresentation("page.html")).toBeNull();
    expect(page).toContain('rootClassName="inquiry-attachment-preview-drawer-root"');
    expect(page.match(/focusable=\{\{ trap: false/g)).toHaveLength(2);
    expect(page).toContain('zIndex={1200}');
    expect(page).toContain('mode: "preview"');
    expect(page).toContain('mode: "download"');
    expect(page).toContain("<iframe");
    expect(page).toContain("<img");
    expect(page).toContain('message.kind === "ATTACHMENT_EVENT"');
    expect(page).toContain("ungroupedAttachments.length > 0");
    expect(page).not.toContain("parsedText");
    expect(page).not.toContain("reparseInquiryAttachment");
    expect(styles).toMatch(
      /\.inquiry-attachment-preview-shell\s*\{[\s\S]*?height:\s*100%/,
    );
    expect(styles).toMatch(
      /\.inquiry-attachment\s*\{[\s\S]*?border:\s*1px solid #dce6ee/,
    );
    expect(styles).toMatch(
      /\.inquiry-system-event\.attachment-event\s*\{[\s\S]*?flex-direction:\s*column/,
    );
  });

  it("creates AI work only inside the manually opened assist panel", () => {
    const createCalls = page.match(/createInquiryAssistRun\(/g) ?? [];
    expect(createCalls).toHaveLength(1);
    expect(page).toContain("activeAssist?.questionKey !== thread.questionKey");
    expect(page).toContain('anchor: "QUESTION"');
    expect(page).toContain('anchor: "MESSAGE"');
    expect(page).toContain('anchor: "TICKET"');
    expect(page).toContain(
      'renderAssistPanel(thread, "QUESTION", null)',
    );
    expect(page).toContain(
      'renderAssistPanel(ticketAssistThread, "TICKET", null)',
    );
    expect(page).not.toContain('anchor: "NEXT_REPLY",');
    expect(page).toContain('className="inquiry-ticket-assist-section"');
    expect(page).toContain("inquiryAssistCacheKey(");
    expect(page).toContain("cachedRun={runs[cacheKey]}");
    expect(page).toContain("onClick={() =>");
    expect(page).toContain("setActiveAssist({");
    expect(page).toContain("requestedContextRef.current !== contextKey");
    expect(page).not.toContain("submitInquiryReply");
  });

  it("renders the ticket anchor as a dedicated full-ticket analysis", () => {
    expect(page).toContain('ticketAnalysis: "問合せ全体分析"');
    expect(page).toContain('ticketAnalysis: "整票分析"');
    expect(page).toContain('ticketAnalysis: "Full-ticket analysis"');
    expect(page).toContain('mode === "FULL_TICKET"');
    expect(page).toContain("function FullTicketAnalysisDetails(");
    expect(page).toContain("analysis.roundAssessments ?? []");
    expect(page).toContain("analysis.processFindings ?? []");
    expect(page).toContain("analysis.customerEvaluationAssessment ?? []");
    expect(page).toContain("analysis.overallAssessment");
    expect(page).toContain("analysis.remediationActions ?? []");
    expect(page).toContain('analysis.reviewStage ?? ""');
    expect(page).toContain("analysis.stageAssessment");
    expect(page).toContain("customerEvaluationAssessment.length > 0");
    expect(page).toContain("!handlingInProgress && overall.serviceQuality");
    expect(page).toContain("labels.currentHandlingRisks");
    expect(page).toContain("labels.nextActions");
    expect(page).toContain("item.firstPublicReplyWaitMinutes");
    expect(page).toContain("overall.finalConclusion &&");
    expect(page).toMatch(
      /anchor === "TICKET"\r?\n\s*\? "FULL_TICKET"/,
    );
    expect(page).toMatch(
      /\{labels\.ticketAnalysis\}\r?\n\s*<\/Button>/,
    );
    expect(styles).toMatch(
      /\.inquiry-full-ticket-analysis\s*\{[\s\S]*?display:\s*grid/,
    );
    expect(styles).toMatch(
      /\.inquiry-full-ticket-process-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/,
    );
  });

  it("shows attachment parsing coverage for AI analysis", () => {
    expect(page).toContain("run?.analysis?.attachmentCoverage");
    expect(page).toContain("attachmentCoverage.parsed");
    expect(page).toContain("attachmentCoverage.visualCount");
    expect(page).toContain("attachmentCoverage.skippedVisualCount");
    expect(page).toContain("labels.attachmentIncomplete");
    expect(styles).toMatch(
      /\.inquiry-full-ticket-stage\s*\{[\s\S]*?background:\s*linear-gradient/,
    );
  });

  it("loads saved AI runs and restores each run at its original anchor", () => {
    expect(page).toContain("fetchInquiryTicketAssistRuns");
    expect(page).toContain(
      'queryKey: ["inquiry-ticket-assist-runs", selectedTicketNo]',
    );
    expect(page).toContain("enabled: Boolean(selectedTicketNo)");
    expect(page).not.toContain("assistHistoryExpanded");
    expect(page).not.toContain('key: "assist-history"');
    expect(page).not.toContain('className="inquiry-assist-history"');
    expect(page).toContain("inquiryAssistHistoryPlacement(");
    expect(page).toContain('renderAssistHistory(thread, "QUESTION", null)');
    expect(page).toContain(
      'renderAssistHistory(thread, "NEXT_REPLY", null)',
    );
    expect(page).toContain("ticketAssistHistoryRuns()");
    expect(page).toContain('?.anchor === "TICKET"');
    expect(page).toContain('"MESSAGE",');
    expect(page).toContain("message.messageKey,");
    expect(page).toContain("<AssistHistoryAtAnchor");
    expect(page).toContain("unlocatedAssistHistoryRuns");
    expect(page).toContain("<AssistHistoryRun");
    expect(page).toContain("run.providerLabel");
    expect(page).toContain("run.tokenUsage?.inputTokens");
    expect(page).toContain("run.tokenUsage?.outputTokens");
    expect(page).toContain("normalizeInquiryDraftText(run.draftReply)");
    expect(page).toContain(
      '<AiMarkdown className="inquiry-assist-history-draft-content">',
    );
    expect(page).toContain("<AiMarkdown compact>{valueText(value)}</AiMarkdown>");
    expect(page).toContain("<AiMarkdown compact>{item.reason}</AiMarkdown>");
    expect(styles).toMatch(
      /\.inquiry-inline-assist-history\s*\{[\s\S]*?width:\s*100%/,
    );
    expect(styles).toMatch(
      /\.inquiry-ticket-assist-section\s*\{[\s\S]*?border:\s*1px solid #d8cff7/,
    );
  });

  it("supports focus context, editable drafts and evidence navigation", () => {
    expect(page).toContain("focusMessageKey");
    expect(page).toContain('useQuestionContext: "お客様の質問を分析する"');
    expect(page).toContain('useContext: "この返信の品質を分析する"');
    expect(page).toContain('useQuestionContext: "分析客户的提问"');
    expect(page).toContain('useContext: "分析该回复的质量"');
    expect(page).toContain("<Input.TextArea");
    expect(page).toContain("navigator.clipboard.writeText");
    expect(page).toContain(".scrollIntoView({");
    expect(page).toContain("createMutation.mutate()");
    expect(page).toContain("normalizeInquiryDraftText(run?.draftReply");
    expect(page).toContain(".replace(/\\\\+r\\\\+n|\\\\+n|\\\\+r/g");
    expect(page).toContain("run.tokenUsage?.totalTokens");
  });

  it("separates unanswered analysis from reply review without forcing a draft", () => {
    expect(page).toContain("function inquiryThreadAnalysisMode(");
    expect(page).toContain(
      'message.kind === "INTERNAL_DISCUSSION"',
    );
    expect(page).toContain(
      'message.kind === "CUSTOMER_VISIBLE_REPLY"',
    );
    expect(page).toContain("labels.unansweredAnalysis");
    expect(page).toContain("labels.repliedAnalysis");
    expect(page).toContain("analysis.keyPoints");
    expect(page).toContain("analysis.investigationDirections");
    expect(page).toContain("analysis.keyPoints?.length");
    expect(page).toContain("analysis.investigationDirections?.length");
    expect(page).toContain("analysis.replyAssessment");
    expect(page).toContain("analysis.focusedReplyAssessment");
    expect(page).toContain("analysis.missingViewpoints");
    expect(page).not.toContain("analysis.replyStructure");
    expect(page).not.toContain("analysis.draftDecisionReasons");
    expect(page).toContain(
      'run?.analysis?.draftReadiness === "NEEDS_INVESTIGATION"',
    );
    expect(page).toContain(
      'run?.analysis?.draftReadiness === "NO_FURTHER_REPLY_NEEDED"',
    );
    expect(page).toContain("description={labels.draftDeferred}");
    expect(page).toContain("labels.replyAlreadySufficient");
    expect(page).toContain("labels.focusedReplyReview");
    expect(styles).toMatch(
      /\.inquiry-analysis-grid section\.wide\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1/,
    );
    expect(styles).toMatch(
      /\.inquiry-analysis-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    );
  });

  it("shows shared UPDS and Backlog settings without an analysis provider", () => {
    expect(app).toContain('key: "inquiry-settings-group"');
    expect(app).toContain('label: t("externalTasks")');
    expect(app).toContain("<InquirySupportSettingsPage");
    expect(settings).toContain("fetchInquirySupportSettings");
    expect(settings).toContain('updsTitle: "UPDSサポートサイト"');
    expect(settings).toContain('backlogTitle: "Backlog"');
    expect(settings).toContain("saveBacklogSystemSettings");
    expect(settings).not.toContain("analysisProvider");
    expect(settings).toContain("password: payload.settings.password ??");
    expect(settings).toContain("<SecretInput");
    expect(settings).not.toContain('updsForm.setFieldValue("password", "")');
    expect(secretInput).toContain("<Input.Password");
    expect(secretInput).toContain("navigator.clipboard.writeText(secret)");
    expect(secretInput).not.toContain("visibilityToggle={false}");
    expect(secretInput).toContain("aria-label={tooltip}");
    expect(settings).toContain(
      'className="management-card-footer inquiry-settings-actions"',
    );
    expect(settings).toContain(
      'className="management-card-actions"',
    );
  });
});
