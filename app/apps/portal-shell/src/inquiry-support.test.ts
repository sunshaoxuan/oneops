import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareInquiryDate,
  compareInquiryText,
  displayInquiryUrgency,
  formatInquiryLocalDate,
  hasInquirySearchConstraint,
  inquiryAttachmentPresentation,
  inquiryAssistHistoryPlacement,
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

  it("restores saved AI history to its question, message, or next-reply anchor", () => {
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

  it("loads real assignee option values instead of sending display text", () => {
    expect(page).toContain("fetchInquirySupportOptions");
    expect(page).toContain('queryKey: ["inquiry-support-options"]');
    expect(page).toContain("options={optionsQuery.data?.assignees ?? []}");
    expect(page).toContain('optionFilterProp="label"');
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

  it("allows all statuses only when another search condition exists", () => {
    expect(hasInquirySearchConstraint({})).toBe(false);
    expect(hasInquirySearchConstraint({ createdTo: "2026-07-27" })).toBe(
      true,
    );
    expect(hasInquirySearchConstraint({ ticketNo: "38950" })).toBe(true);
    expect(hasInquirySearchConstraint({ aiProcessedOnly: true })).toBe(true);
    expect(page).toContain('{ value: "all", label: labels.allStatuses }');
    expect(page).toContain('value !== "all"');
    expect(page).toContain("hasInquirySearchConstraint({");
    expect(page).toContain("statusAllRequiresFilter");
  });

  it("keeps requester details in the ticket and labels the list as customer", () => {
    expect(page).toContain('customerList: "顧客"');
    expect(page).toContain("title: labels.customerList");
  });

  it("uses the requested wide drawer with mobile full-screen layout", () => {
    expect(page).toContain('width="min(88vw, 1600px)"');
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
    expect(styles).toMatch(
      /\.inquiry-evaluation-comment\s*\{[\s\S]*?white-space:\s*pre-wrap/,
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
    expect(page).toContain('anchor: "NEXT_REPLY"');
    expect(page).toContain(
      'renderAssistPanel(thread, "QUESTION", null)',
    );
    expect(page).toContain(
      'renderAssistPanel(thread, "NEXT_REPLY", null)',
    );
    expect(page).toContain("inquiryAssistCacheKey(");
    expect(page).toContain("cachedRun={runs[cacheKey]}");
    expect(page).toContain("onClick={() =>");
    expect(page).toContain("setActiveAssist({");
    expect(page).toContain("requestedContextRef.current !== contextKey");
    expect(page).not.toContain("submitInquiryReply");
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
    expect(page).toContain('"MESSAGE",');
    expect(page).toContain("message.messageKey,");
    expect(page).toContain("<AssistHistoryAtAnchor");
    expect(page).toContain("unlocatedAssistHistoryRuns");
    expect(page).toContain("<AssistHistoryRun");
    expect(page).toContain("run.providerLabel");
    expect(page).toContain("run.tokenUsage?.inputTokens");
    expect(page).toContain("run.tokenUsage?.outputTokens");
    expect(page).toContain("normalizeInquiryDraftText(run.draftReply)");
    expect(styles).toMatch(
      /\.inquiry-assist-history-draft > \.ant-typography\s*\{[\s\S]*?white-space:\s*pre-wrap/,
    );
    expect(styles).toMatch(
      /\.inquiry-inline-assist-history\s*\{[\s\S]*?width:\s*100%/,
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

  it("refills, reveals and copies the complete source password", () => {
    expect(app).toContain('key: "inquiry-settings-group"');
    expect(app).toContain("<InquirySupportSettingsPage");
    expect(settings).toContain("fetchInquirySupportSettings");
    expect(settings).toContain("analysisProvider");
    expect(settings).toContain("password: settings.password ??");
    expect(settings).toContain("<SecretInput");
    expect(settings).not.toContain('form.setFieldValue("password", "")');
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
