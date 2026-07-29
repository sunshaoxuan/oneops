import type {
  InquiryMessage,
  InquiryQuestionThread,
  InquiryTicketDetail,
} from "@one-ops/api-client";

export interface AiAssistantInquiryContextMessage {
  messageKey: string;
  kind: InquiryMessage["kind"];
  author: string;
  createdAt: string;
  body: string;
}

export interface AiAssistantInquiryContext {
  ticketNo: string;
  ticketTitle: string;
  status: string;
  category: string[];
  questionKey: string;
  questionSequence: number;
  questionLabel: string;
  questionCreatedAt: string;
  questionBody: string;
  attachmentNames: string[];
  messages: AiAssistantInquiryContextMessage[];
}

export function buildAiAssistantInquiryContext(
  detail: InquiryTicketDetail,
  thread: InquiryQuestionThread,
): AiAssistantInquiryContext {
  return {
    ticketNo: detail.ticketNo,
    ticketTitle: detail.title,
    status: detail.status,
    category: detail.category,
    questionKey: thread.questionKey,
    questionSequence: thread.sequence,
    questionLabel: thread.sequence === 1 ? "お客様からの質問" : "追加質問",
    questionCreatedAt: thread.customerQuestion.createdAt,
    questionBody: thread.customerQuestion.body,
    attachmentNames: thread.customerQuestion.attachments.map(
      (attachment) => attachment.name,
    ),
    messages: thread.messages.map((message) => ({
      messageKey: message.messageKey,
      kind: message.kind,
      author: message.author?.displayName ?? "システム",
      createdAt: message.createdAt,
      body: message.body,
    })),
  };
}
