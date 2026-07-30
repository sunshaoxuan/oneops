import type {
  InquiryAssistAnchor,
  InquiryAssistRun,
  InquiryQuestionThread,
} from "@one-ops/api-client";

export function formatInquiryLocalDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function displayInquiryUrgency(
  title: string,
  urgency: string | null | undefined,
  normalLabel: string,
) {
  if (String(title).includes("至急")) return "至急";
  const value = String(urgency ?? "").trim();
  if (
    !value ||
    /^(?:未設定|未设定|未设置|not set|none|-|—)$/i.test(value)
  ) {
    return normalLabel;
  }
  return value;
}

export function compareInquiryText(left: unknown, right: unknown) {
  return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function compareInquiryDate(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  const leftTime = left ? new Date(left).getTime() : Number.NaN;
  const rightTime = right ? new Date(right).getTime() : Number.NaN;
  if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
  if (Number.isNaN(leftTime)) return -1;
  if (Number.isNaN(rightTime)) return 1;
  return leftTime - rightTime;
}

export function hasInquirySearchConstraint(values: {
  ticketNo?: string;
  content?: string;
  createdFrom?: string;
  createdTo?: string;
  assignee?: string;
  aiProcessedOnly?: boolean;
}) {
  return Boolean(
    String(values.ticketNo ?? "").trim() ||
    String(values.content ?? "").trim() ||
    String(values.createdFrom ?? "").trim() ||
    String(values.createdTo ?? "").trim() ||
    String(values.assignee ?? "").trim() ||
    values.aiProcessedOnly === true
  );
}

export type InquiryAttachmentPresentation =
  | "IMAGE"
  | "PDF"
  | "WORD"
  | "EXCEL";

const attachmentPresentationByExtension: Record<
  string,
  InquiryAttachmentPresentation
> = {
  bmp: "IMAGE",
  gif: "IMAGE",
  jpeg: "IMAGE",
  jpg: "IMAGE",
  png: "IMAGE",
  webp: "IMAGE",
  pdf: "PDF",
  doc: "WORD",
  docx: "WORD",
  docm: "WORD",
  xls: "EXCEL",
  xlsx: "EXCEL",
  xlsm: "EXCEL",
  xlsb: "EXCEL",
};

export function inquiryAttachmentPresentation(
  name: string,
): InquiryAttachmentPresentation | null {
  const extension = name.trim().toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return extension
    ? attachmentPresentationByExtension[extension] ?? null
    : null;
}

export interface InquiryAssistHistoryPlacement {
  questionKey: string;
  anchor: InquiryAssistAnchor;
  focusMessageKey: string | null;
}

export function inquiryAssistHistoryPlacement(
  run: InquiryAssistRun,
  threads: InquiryQuestionThread[],
): InquiryAssistHistoryPlacement | null {
  if (run.focusMessageKey) {
    const messageThread = threads.find((thread) =>
      thread.messages.some(
        (message) => message.messageKey === run.focusMessageKey,
      ),
    );
    return messageThread
      ? {
          questionKey: messageThread.questionKey,
          anchor: "MESSAGE",
          focusMessageKey: run.focusMessageKey,
        }
      : null;
  }

  const questionThread = threads.find(
    (thread) => thread.questionKey === run.questionKey,
  );
  const compatibleThread =
    questionThread ??
    (run.anchor !== "QUESTION" && threads.length === 1
      ? threads[0]
      : null);
  if (!compatibleThread) return null;

  return {
    questionKey: compatibleThread.questionKey,
    anchor: run.anchor === "QUESTION" ? "QUESTION" : "NEXT_REPLY",
    focusMessageKey: null,
  };
}
