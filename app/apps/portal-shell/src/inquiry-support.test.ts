import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  displayInquiryUrgency,
  formatInquiryLocalDate,
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
    expect(app).toContain("<InquirySupportPage locale={locale} />");
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

  it("promotes urgent titles and normalizes missing urgency", () => {
    expect(displayInquiryUrgency("【至急】Payroll failure", null, "一般")).toBe(
      "至急",
    );
    expect(displayInquiryUrgency("Payroll question", null, "一般")).toBe(
      "一般",
    );
    expect(displayInquiryUrgency("Payroll question", "低", "一般")).toBe(
      "低",
    );
    expect(page).toContain("<FlagFilled aria-hidden />");
    expect(page).toContain("displayInquiryUrgency(");
    expect(page).toContain('rootClassName="inquiry-detail-drawer-root"');
    expect(page).toContain('displayedUrgency === "至急"');
    expect(page).toContain(
      "aria-label={`${labels.urgency}: ${displayedUrgency}`}",
    );
    expect(page).not.toContain("detail.inquiryLevel || labels.levelUnset");
    expect(styles).toMatch(
      /\.inquiry-urgency-badge\s*\{[\s\S]*?border:\s*2px\s+solid\s+#ff6a2b[\s\S]*?box-shadow:/,
    );
    expect(styles).toMatch(
      /\.inquiry-urgency-badge\.urgent\s*\{[\s\S]*?border-color:\s*#d92d20/,
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

  it("parses attachments, shows folded content, and supports manual retry", () => {
    expect(page).toContain('attachmentParsed: "解析済み"');
    expect(page).toContain("<details");
    expect(page).toContain("{attachment.parsedText}");
    expect(page).toContain("reparseInquiryAttachment");
    expect(page).toContain("reparseAttachmentMutation.mutate");
    expect(page).toContain('message.kind === "ATTACHMENT_EVENT"');
    expect(page).toContain("ungroupedAttachments.length > 0");
    expect(page).not.toContain("NOT_PARSED");
    expect(styles).toMatch(
      /\.inquiry-attachment-preview pre\s*\{[\s\S]*?white-space:\s*pre-wrap/,
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
    expect(page).toContain("activeAssist?.questionKey === thread.questionKey");
    expect(page).toContain("onClick={() =>");
    expect(page).toContain("setActiveAssist({");
    expect(page).toContain("requestedContextRef.current !== contextKey");
    expect(page).not.toContain("submitInquiryReply");
  });

  it("supports focus context, editable drafts and evidence navigation", () => {
    expect(page).toContain("focusMessageKey");
    expect(page).toContain("<Input.TextArea");
    expect(page).toContain("navigator.clipboard.writeText");
    expect(page).toContain(".scrollIntoView({");
    expect(page).toContain("createMutation.mutate()");
    expect(page).toContain("normalizeInquiryDraftText(run?.draftReply");
    expect(page).toContain(".replace(/\\\\+r\\\\+n|\\\\+n|\\\\+r/g");
    expect(page).toContain("run.tokenUsage?.totalTokens");
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
