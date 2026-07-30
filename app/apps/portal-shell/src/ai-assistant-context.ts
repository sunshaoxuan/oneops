import type {
  InquiryMessage,
  InquiryQuestionThread,
  InquiryTicketDetail,
} from "@one-ops/api-client";

export interface AiAssistantInquiryContextMessage {
  messageKey: string;
  kind: InquiryMessage["kind"];
  author: string;
  visibility?: InquiryMessage["visibility"];
  createdAt: string;
  body: string;
  attachmentNames?: string[];
}

export interface AiAssistantInquiryContextThread {
  questionKey: string;
  sequence: number;
  questionLabel: string;
  questionCreatedAt: string;
  requestedReplyAt: string | null;
  questionBody: string;
  attachmentNames: string[];
  messages: AiAssistantInquiryContextMessage[];
}

export interface AiAssistantInquiryContext {
  ticketNo: string;
  ticketTitle: string;
  status: string;
  subStatus?: string;
  assigneeName?: string | null;
  customerName?: string;
  category: string[];
  urgency?: string | null;
  inquiryLevel?: string | null;
  createdAt?: string;
  updatedAt?: string;
  requestedReplyAt?: string | null;
  questionKey: string;
  questionSequence: number;
  questionLabel: string;
  questionCreatedAt: string;
  questionBody: string;
  attachmentNames: string[];
  messages: AiAssistantInquiryContextMessage[];
  ticketAttachmentNames?: string[];
  questionThreads?: AiAssistantInquiryContextThread[];
  customerEvaluation?: {
    satisfaction: string;
    comment: string;
    submittedAt: string | null;
  } | null;
}

function buildContextThread(thread: InquiryQuestionThread) {
  return {
    questionKey: thread.questionKey,
    sequence: thread.sequence,
    questionLabel:
      thread.sequence === 1 ? "お客様からの質問" : "追加質問",
    questionCreatedAt: thread.customerQuestion.createdAt,
    requestedReplyAt: thread.customerQuestion.requestedReplyAt,
    questionBody: thread.customerQuestion.body,
    attachmentNames: thread.customerQuestion.attachments.map(
      (attachment) => attachment.name,
    ),
    messages: thread.messages.map((message) => ({
      messageKey: message.messageKey,
      kind: message.kind,
      author: message.author?.displayName ?? "システム",
      visibility: message.visibility,
      createdAt: message.createdAt,
      body: message.body,
      attachmentNames: message.attachments.map(
        (attachment) => attachment.name,
      ),
    })),
  } satisfies AiAssistantInquiryContextThread;
}

export function buildAiAssistantInquiryContext(
  detail: InquiryTicketDetail,
  thread: InquiryQuestionThread,
): AiAssistantInquiryContext {
  const questionThreads = detail.questionThreads.map(buildContextThread);
  const focusedThread =
    questionThreads.find(
      (candidate) => candidate.questionKey === thread.questionKey,
    ) ?? buildContextThread(thread);
  return {
    ticketNo: detail.ticketNo,
    ticketTitle: detail.title,
    status: detail.status,
    subStatus: detail.subStatus,
    assigneeName: detail.assignee?.displayName ?? null,
    customerName: detail.customer.name,
    category: detail.category,
    urgency: detail.urgency,
    inquiryLevel: detail.inquiryLevel,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    requestedReplyAt: detail.requestedReplyAt,
    questionKey: focusedThread.questionKey,
    questionSequence: focusedThread.sequence,
    questionLabel: focusedThread.questionLabel,
    questionCreatedAt: focusedThread.questionCreatedAt,
    questionBody: focusedThread.questionBody,
    attachmentNames: focusedThread.attachmentNames,
    messages: focusedThread.messages,
    ticketAttachmentNames: detail.attachments.map(
      (attachment) => attachment.name,
    ),
    questionThreads,
    customerEvaluation: detail.evaluation
      ? {
          satisfaction: detail.evaluation.satisfaction,
          comment: detail.evaluation.comment,
          submittedAt: detail.evaluation.submittedAt,
        }
      : null,
  };
}
