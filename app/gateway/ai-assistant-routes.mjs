import { randomUUID } from "node:crypto";
import { resolveAssistantTaskRouting } from "./ai-assistant-routing.mjs";

const conversationIdPattern = /^[0-9a-fA-F-]{36}$/;
const maxJsonBytes = 4 * 1024 * 1024;
const terminalTaskStatuses = new Set(["completed", "failed", "cancelled"]);
const taskEventBatchSize = 200;

function assistantError(response, sendJson, error) {
  const statusByCode = {
    AI_ASSISTANT_CONFIGURATION_REQUIRED: 409,
    AI_ASSISTANT_RESPONSE_IN_PROGRESS: 409,
    AI_ASSISTANT_SESSION_ARCHIVED: 409,
    AI_ASSISTANT_SESSION_NOT_FOUND: 404,
    AI_ASSISTANT_TASK_NOT_FOUND: 404,
    AI_ASSISTANT_SHORTCUT_NOT_FOUND: 404,
    AI_ASSISTANT_INPUT_INVALID: 400,
  };
  sendJson(
    response,
    error?.statusCode ?? statusByCode[error?.code] ?? 502,
    {
    error: {
      code: error?.code ?? "AI_ASSISTANT_OPERATION_FAILED",
      message: error?.message ?? "AI assistant operation failed.",
      details: {},
    },
    },
  );
}

function sessionTitle(input) {
  const value = String(input ?? "").trim();
  if (!value) return "新しいチャット";
  if (value.length > 255) {
    throw Object.assign(new Error("Session title is too long."), {
      code: "AI_ASSISTANT_INPUT_INVALID",
    });
  }
  return value;
}

function publicSession(session) {
  if (!session) return session;
  const { shortcutPromptSnapshot: _privatePrompt, ...value } = session;
  if (!value.shortcut) return value;
  const { systemPrompt: _privateShortcutPrompt, ...shortcut } = value.shortcut;
  return { ...value, shortcut };
}

function publicRoutingState(input) {
  if (!input || typeof input !== "object") return {};
  const taskClass = limitedText(input.taskClass, 80);
  const targetLanguage = limitedText(input.targetLanguage, 20);
  const replacesTaskId = limitedText(input.replacesTaskId, 36);
  return {
    ...(taskClass ? { taskClass } : {}),
    ...(targetLanguage ? { targetLanguage } : {}),
    ...(replacesTaskId ? { replacesTaskId } : {}),
  };
}

export function publicAiAssistantTask(task) {
  if (!task) return task;
  const summary = task.final_report?.summary;
  return {
    id: String(task.id ?? ""),
    conversation_id: task.conversation_id
      ? String(task.conversation_id)
      : null,
    status: String(task.status ?? ""),
    prompt: String(task.prompt ?? ""),
    inquiryContext: task.inquiryContext ?? null,
    attachments: publicPromptAttachments(task.attachments),
    routing: publicRoutingState(task.routing),
    errorCode: task.errorCode == null ? null : String(task.errorCode),
    error: task.error == null ? null : String(task.error),
    final_report: typeof summary === "string" ? { summary } : null,
    created_at: String(task.created_at ?? ""),
    completed_at: task.completed_at == null
      ? null
      : String(task.completed_at),
  };
}

function promptValue(input) {
  const value = String(input ?? "").trim();
  if (!value || value.length > 100_000) {
    throw Object.assign(new Error("Message is empty or too long."), {
      code: "AI_ASSISTANT_INPUT_INVALID",
    });
  }
  return value;
}

function limitedText(input, maxLength) {
  return String(input ?? "").trim().slice(0, maxLength);
}

function requiredLocalizedText(input, field, maxLength) {
  const value = {
    ja: limitedText(input?.ja, maxLength),
    zh: limitedText(input?.zh, maxLength),
    en: limitedText(input?.en, maxLength),
  };
  if (!value.ja || !value.zh || !value.en) {
    throw Object.assign(new Error(`${field} requires all locales.`), {
      code: "AI_ASSISTANT_INPUT_INVALID",
    });
  }
  return value;
}

function shortcutInput(input) {
  const categoryId = limitedText(input?.categoryId, 36);
  const startingModelSettingId = limitedText(
    input?.startingModelSettingId,
    36,
  );
  const startingReasoningEffort = limitedText(
    input?.startingReasoningEffort,
    10,
  ).toUpperCase();
  const systemPrompt = limitedText(input?.systemPrompt, 20_000);
  const sortOrder = Number(input?.sortOrder);
  if (
    !conversationIdPattern.test(categoryId) ||
    !conversationIdPattern.test(startingModelSettingId) ||
    !["XHIGH", "HIGH", "MEDIUM"].includes(startingReasoningEffort) ||
    !systemPrompt ||
    !Number.isInteger(sortOrder) ||
    sortOrder < 0 ||
    sortOrder > 9999 ||
    typeof input?.enabled !== "boolean"
  ) {
    throw Object.assign(new Error("Quick assistant input is invalid."), {
      code: "AI_ASSISTANT_INPUT_INVALID",
    });
  }
  return {
    categoryId,
    startingModelSettingId,
    startingReasoningEffort,
    name: requiredLocalizedText(input.name, "name", 100),
    description: requiredLocalizedText(
      input.description,
      "description",
      500,
    ),
    starterPrompt: requiredLocalizedText(
      input.starterPrompt,
      "starterPrompt",
      500,
    ),
    systemPrompt,
    sortOrder,
    enabled: input.enabled,
  };
}

function redactInquiryText(input) {
  return String(input ?? "").trim()
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[メールアドレス除外]",
    )
    .replace(
      /(?:\+?\d[\d\s().-]{7,}\d)/g,
      "[電話番号除外]",
    )
    .replace(
      /\b(password|passwd|cookie|csrf(?:_token)?|access[_ -]?token)\b\s*[:=]\s*\S+/gi,
      "$1=[機密情報除外]",
    );
}

function normalizeInquiryContextMessage(message) {
  return {
    messageKey: limitedText(message?.messageKey, 200),
    kind: limitedText(message?.kind, 80),
    author: redactInquiryText(message?.author).slice(0, 120),
    visibility: limitedText(message?.visibility, 80),
    createdAt: limitedText(message?.createdAt, 100),
    body: redactInquiryText(message?.body),
    attachmentNames: Array.isArray(message?.attachmentNames)
      ? message.attachmentNames.map((value) =>
          redactInquiryText(value).slice(0, 255)
        )
      : [],
  };
}

function normalizeInquiryContextThread(thread) {
  const questionBody = redactInquiryText(thread?.questionBody);
  const questionKey = limitedText(thread?.questionKey, 200);
  if (!questionKey || !questionBody) return null;
  return {
    questionKey,
    sequence: Math.max(1, Number(thread?.sequence) || 1),
    questionLabel: limitedText(thread?.questionLabel, 100),
    questionCreatedAt: limitedText(thread?.questionCreatedAt, 100),
    requestedReplyAt: limitedText(thread?.requestedReplyAt, 100) || null,
    questionBody,
    attachmentNames: Array.isArray(thread?.attachmentNames)
      ? thread.attachmentNames.map((value) =>
          redactInquiryText(value).slice(0, 255)
        )
      : [],
    messages: Array.isArray(thread?.messages)
      ? thread.messages.map(normalizeInquiryContextMessage)
      : [],
  };
}

export function normalizeInquiryAssistantContext(input) {
  if (!input || typeof input !== "object") return null;
  const questionBody = redactInquiryText(input.questionBody);
  const ticketNo = limitedText(input.ticketNo, 80);
  if (!ticketNo || !questionBody) return null;
  const legacyThread = normalizeInquiryContextThread({
    questionKey: input.questionKey,
    sequence: input.questionSequence,
    questionLabel: input.questionLabel,
    questionCreatedAt: input.questionCreatedAt,
    requestedReplyAt: null,
    questionBody,
    attachmentNames: input.attachmentNames,
    messages: input.messages,
  });
  const questionThreads = Array.isArray(input.questionThreads)
    ? input.questionThreads
        .map(normalizeInquiryContextThread)
        .filter(Boolean)
    : legacyThread
      ? [legacyThread]
      : [];
  const customerEvaluation =
    input.customerEvaluation &&
      typeof input.customerEvaluation === "object"
      ? {
          satisfaction: redactInquiryText(
            input.customerEvaluation.satisfaction,
          ).slice(0, 120),
          comment: redactInquiryText(input.customerEvaluation.comment),
          submittedAt:
            limitedText(input.customerEvaluation.submittedAt, 100) || null,
        }
      : null;
  return {
    ticketNo,
    ticketTitle: redactInquiryText(input.ticketTitle),
    status: limitedText(input.status, 100),
    subStatus: limitedText(input.subStatus, 100),
    assigneeName: redactInquiryText(input.assigneeName).slice(0, 120) || null,
    customerName: redactInquiryText(input.customerName).slice(0, 255),
    category: Array.isArray(input.category)
      ? input.category.map((value) => limitedText(value, 100))
      : [],
    urgency: limitedText(input.urgency, 100) || null,
    inquiryLevel: limitedText(input.inquiryLevel, 100) || null,
    createdAt: limitedText(input.createdAt, 100),
    updatedAt: limitedText(input.updatedAt, 100),
    requestedReplyAt: limitedText(input.requestedReplyAt, 100) || null,
    questionKey: limitedText(input.questionKey, 200),
    questionSequence: Math.max(1, Number(input.questionSequence) || 1),
    questionLabel: limitedText(input.questionLabel, 100),
    questionCreatedAt: limitedText(input.questionCreatedAt, 100),
    questionBody,
    attachmentNames: Array.isArray(input.attachmentNames)
      ? input.attachmentNames.map((value) =>
          redactInquiryText(value).slice(0, 255)
        )
      : [],
    messages: Array.isArray(input.messages)
      ? input.messages.map(normalizeInquiryContextMessage)
      : [],
    ticketAttachmentNames: Array.isArray(input.ticketAttachmentNames)
      ? input.ticketAttachmentNames.map((value) =>
          redactInquiryText(value).slice(0, 255)
        )
      : [],
    questionThreads,
    customerEvaluation,
  };
}

function publicPromptAttachments(input) {
  return (Array.isArray(input) ? input : []).map((attachment) => ({
    id: limitedText(attachment?.id, 80),
    name: limitedText(attachment?.name, 255),
    contentType: limitedText(attachment?.contentType, 120),
    size: Math.max(0, Number(attachment?.size) || 0),
    sha256: limitedText(attachment?.sha256, 64),
  })).filter((attachment) => attachment.id);
}

function taskEventResumeSequence(url, lastEventId) {
  const requestedValue = url.searchParams.get("after_sequence") ?? "0";
  if (!/^\d+$/.test(requestedValue)) {
    throw Object.assign(new Error("AI assistant event sequence is invalid."), {
      code: "AI_ASSISTANT_INPUT_INVALID",
    });
  }
  const requested = Number(requestedValue);
  if (!Number.isSafeInteger(requested)) {
    throw Object.assign(new Error("AI assistant event sequence is invalid."), {
      code: "AI_ASSISTANT_INPUT_INVALID",
    });
  }
  const headerValue = Array.isArray(lastEventId)
    ? lastEventId[0]
    : lastEventId;
  if (headerValue == null || headerValue === "") return requested;
  if (!/^\d+$/.test(headerValue)) {
    throw Object.assign(new Error("AI assistant event cursor is invalid."), {
      code: "AI_ASSISTANT_INPUT_INVALID",
    });
  }
  const resumed = Number(headerValue);
  if (!Number.isSafeInteger(resumed)) {
    throw Object.assign(new Error("AI assistant event cursor is invalid."), {
      code: "AI_ASSISTANT_INPUT_INVALID",
    });
  }
  return Math.max(requested, resumed);
}

function taskNotFound() {
  return Object.assign(new Error("AI assistant task was not found."), {
    code: "AI_ASSISTANT_TASK_NOT_FOUND",
  });
}

function followTaskEvents(url) {
  const value = url.searchParams.get("follow") ?? "true";
  if (value !== "true" && value !== "false") {
    throw Object.assign(new Error("AI assistant event follow value is invalid."), {
      code: "AI_ASSISTANT_INPUT_INVALID",
    });
  }
  return value === "true";
}

function waitForTaskEventPoll(signal, intervalMs) {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolvePromise) => {
    const finish = (ready) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      resolvePromise(ready);
    };
    const abort = () => finish(false);
    const timer = setTimeout(() => finish(true), intervalMs);
    timer.unref?.();
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function writeTaskEvent(response, event, signal) {
  if (signal.aborted || response.destroyed || response.writableEnded) {
    return false;
  }
  const body = [
    `id: ${event.sequence}`,
    `event: ${event.type}`,
    `data: ${JSON.stringify(event)}`,
    "",
    "",
  ].join("\n");
  if (response.write(body)) return true;
  return new Promise((resolvePromise) => {
    const finish = (writable) => {
      response.off?.("drain", drain);
      response.off?.("close", close);
      signal.removeEventListener("abort", abort);
      resolvePromise(writable);
    };
    const drain = () => finish(true);
    const close = () => finish(false);
    const abort = () => finish(false);
    response.once("drain", drain);
    response.once("close", close);
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function pipeTaskEvents({
  response,
  repository,
  conversationId,
  ownerUserId,
  taskId,
  url,
  lastEventId,
  signal,
  pollIntervalMs,
}) {
  let afterSequence = taskEventResumeSequence(url, lastEventId);
  const follow = followTaskEvents(url);
  let batch = await repository.listTaskEventsOwned(
    conversationId,
    ownerUserId,
    taskId,
    afterSequence,
    taskEventBatchSize,
  );
  if (signal.aborted) return;
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  while (!signal.aborted) {
    for (const event of batch.events) {
      if (!await writeTaskEvent(response, event, signal)) return;
      afterSequence = Math.max(afterSequence, Number(event.sequence));
    }
    const terminal = terminalTaskStatuses.has(
      String(batch.taskStatus).toLowerCase(),
    );
    if (!follow || (terminal && batch.events.length < taskEventBatchSize)) {
      break;
    }
    if (batch.events.length < taskEventBatchSize) {
      if (!await waitForTaskEventPoll(signal, pollIntervalMs)) return;
    }
    batch = await repository.listTaskEventsOwned(
      conversationId,
      ownerUserId,
      taskId,
      afterSequence,
      taskEventBatchSize,
    );
  }
  if (!signal.aborted && !response.destroyed && !response.writableEnded) {
    response.end();
  }
}

function requestLifecycle(request, response) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.once?.("aborted", abort);
  response.once?.("close", abort);
  return {
    signal: controller.signal,
    dispose() {
      request.off?.("aborted", abort);
      response.off?.("close", abort);
    },
  };
}

export function createAiAssistantRouteHandler({
  repository,
  shortcutRepository = null,
  modelSettingsRepository,
  taskRunner = null,
  sendJson,
  readJsonBody,
  attachmentStore = null,
  eventPollIntervalMs = 250,
}) {
  function requireTaskRunner() {
    if (
      !taskRunner ||
      typeof taskRunner.start !== "function" ||
      typeof taskRunner.cancel !== "function"
    ) {
      throw Object.assign(
        new Error("AI assistant GPT runner is unavailable."),
        { code: "AI_ASSISTANT_CONFIGURATION_REQUIRED" },
      );
    }
    return taskRunner;
  }

  async function startingModelFor(shortcut) {
    const shortcutModel = shortcut?.startingModel ?? null;
    const setting = shortcutModel?.id
      ? await modelSettingsRepository?.getById(shortcutModel.id)
      : await modelSettingsRepository?.getDefaultAssistantModel();
    const reasoningEffort = String(
      shortcutModel?.reasoningEffort ?? setting?.reasoningEffort ?? "",
    ).toUpperCase();
    if (
      !setting?.id ||
      setting.purpose !== "GENERAL" ||
      setting.provider !== "OPENAI" ||
      !setting.enabled ||
      !setting.model ||
      !["XHIGH", "HIGH", "MEDIUM"].includes(reasoningEffort)
    ) {
      throw Object.assign(
        new Error("An enabled GPT starting model is required."),
        { code: "AI_ASSISTANT_CONFIGURATION_REQUIRED" },
      );
    }
    return {
      ...setting,
      reasoningEffort,
      speedLevel: String(
        shortcutModel?.speedLevel ?? setting.speedLevel ?? "",
      ),
    };
  }

  async function ownedSession(conversationId, currentProfile) {
    const session = await repository.getOwned(
      conversationId,
      currentProfile.id,
    );
    if (!session) {
      throw Object.assign(new Error("AI assistant session was not found."), {
        code: "AI_ASSISTANT_SESSION_NOT_FOUND",
      });
    }
    return session;
  }

  return async function handleAiAssistant(
    request,
    response,
    url,
    currentProfile,
  ) {
    const prefix = "/api/work-center/v1/ai-assistant";
    if (!url.pathname.startsWith(prefix)) return false;
    const lifecycle = requestLifecycle(request, response);

    try {
      const shortcutAdminPrefix = `${prefix}/shortcuts/admin`;
      if (
        request.method === "GET" &&
        url.pathname === `${prefix}/shortcuts`
      ) {
        sendJson(response, 200, {
          categories: shortcutRepository
            ? await shortcutRepository.listPublic()
            : [],
        });
        return true;
      }

      if (
        request.method === "GET" &&
        url.pathname === shortcutAdminPrefix
      ) {
        sendJson(response, 200, {
          categories: shortcutRepository
            ? await shortcutRepository.listAdmin()
            : [],
        });
        return true;
      }

      if (
        request.method === "POST" &&
        url.pathname === shortcutAdminPrefix
      ) {
        if (!shortcutRepository) {
          throw new Error("Quick assistant repository is unavailable.");
        }
        const input = shortcutInput(await readJsonBody(request));
        const startingModel = await modelSettingsRepository?.getById(
          input.startingModelSettingId,
        );
        if (
          startingModel?.purpose !== "GENERAL" ||
          startingModel.provider !== "OPENAI" ||
          !startingModel.enabled
        ) {
          throw Object.assign(new Error("Starting model is unavailable."), {
            code: "AI_ASSISTANT_INPUT_INVALID",
          });
        }
        const id = randomUUID();
        await shortcutRepository.create(
          id,
          `CUSTOM_${id.replaceAll("-", "").toUpperCase()}`,
          input,
          currentProfile.id,
        );
        request.auditContext = { shortcutId: id };
        sendJson(response, 201, { shortcutId: id });
        return true;
      }

      const shortcutAdminMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/ai-assistant\/shortcuts\/admin\/([0-9a-fA-F-]{36})$/,
      );
      if (request.method === "PUT" && shortcutAdminMatch) {
        if (!shortcutRepository) {
          throw new Error("Quick assistant repository is unavailable.");
        }
        const input = shortcutInput(await readJsonBody(request));
        const startingModel = await modelSettingsRepository?.getById(
          input.startingModelSettingId,
        );
        if (
          startingModel?.purpose !== "GENERAL" ||
          startingModel.provider !== "OPENAI" ||
          !startingModel.enabled
        ) {
          throw Object.assign(new Error("Starting model is unavailable."), {
            code: "AI_ASSISTANT_INPUT_INVALID",
          });
        }
        const shortcutId = shortcutAdminMatch[1];
        const updated = await shortcutRepository.update(
          shortcutId,
          input,
          currentProfile.id,
        );
        if (!updated) {
          throw Object.assign(new Error("Quick assistant was not found."), {
            code: "AI_ASSISTANT_SHORTCUT_NOT_FOUND",
          });
        }
        request.auditContext = { shortcutId };
        sendJson(response, 200, { shortcutId });
        return true;
      }

      if (request.method === "GET" && url.pathname === `${prefix}/sessions`) {
        sendJson(response, 200, {
          sessions: (
            await repository.listByOwner(currentProfile.id, {
              includeArchived:
                url.searchParams.get("include_archived") === "true",
            })
          ).map(publicSession),
        });
        return true;
      }

      if (request.method === "POST" && url.pathname === `${prefix}/sessions`) {
        const input = await readJsonBody(request);
        const shortcutId = limitedText(input.shortcutId, 36);
        const shortcut = shortcutId
          ? await shortcutRepository?.getEnabled(shortcutId)
          : null;
        if (shortcutId && !shortcut) {
          throw Object.assign(
            new Error("Quick assistant is unavailable."),
            { code: "AI_ASSISTANT_SHORTCUT_NOT_FOUND" },
          );
        }
        const title = sessionTitle(input.title || shortcut?.name?.ja);
        const inquiryTicketNo = limitedText(input.inquiryTicketNo, 80) || null;
        const startingModel = await startingModelFor(shortcut);
        const conversationId = randomUUID();
        const session = await repository.create({
          conversationId,
          ownerUserId: currentProfile.id,
          title,
          shortcutId: shortcut?.id ?? null,
          shortcutPromptSnapshot: shortcut?.systemPrompt ?? null,
          inquiryTicketNo,
          modelSettingId: startingModel.id,
          modelSnapshot: startingModel.model,
          reasoningEffortSnapshot: startingModel.reasoningEffort,
          speedLevelSnapshot: startingModel.speedLevel,
        });
        request.auditContext = {
          conversationId: session.id,
          modelSettingId: startingModel.id,
          shortcutId: shortcut?.id ?? null,
        };
        sendJson(response, 201, { session: publicSession(session) });
        return true;
      }

      const attachmentMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/ai-assistant\/sessions\/([0-9a-fA-F-]{36})\/attachments(?:\/([0-9a-fA-F-]{36}))?$/,
      );
      if (attachmentMatch) {
        if (!attachmentStore) {
          throw new Error("AI assistant attachment store is unavailable.");
        }
        const conversationId = attachmentMatch[1];
        const attachmentId = attachmentMatch[2] ?? "";
        const session = await ownedSession(conversationId, currentProfile);
        request.auditContext = {
          conversationId,
          ...(attachmentId ? { attachmentId } : {}),
        };
        if (request.method === "POST" && !attachmentId) {
          const attachment = await attachmentStore.upload({
            request,
            conversationId,
            ownerUserId: currentProfile.id,
            filename: url.searchParams.get("filename"),
            contentType: request.headers["content-type"],
          });
          request.auditContext = {
            ...request.auditContext,
            attachmentId: attachment.id,
            attachmentBytes: attachment.size,
          };
          sendJson(response, 201, { attachment });
          return true;
        }
        if (request.method === "GET" && attachmentId) {
          await attachmentStore.serveOwned(
            response,
            attachmentId,
            conversationId,
            currentProfile.id,
          );
          return true;
        }
        if (request.method === "DELETE" && attachmentId) {
          await attachmentStore.removeOwned(
            attachmentId,
            conversationId,
            currentProfile.id,
          );
          sendJson(response, 200, { deleted: true });
          return true;
        }
        throw Object.assign(new Error("Attachment method is invalid."), {
          code: "AI_ASSISTANT_INPUT_INVALID",
        });
      }

      const taskCancelMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/ai-assistant\/sessions\/([0-9a-fA-F-]{36})\/tasks\/([0-9a-fA-F-]{36})\/cancel$/,
      );
      if (taskCancelMatch) {
        if (request.method !== "POST") {
          throw Object.assign(new Error("AI assistant method is invalid."), {
            code: "AI_ASSISTANT_INPUT_INVALID",
          });
        }
        const conversationId = taskCancelMatch[1];
        const taskId = taskCancelMatch[2];
        const runner = requireTaskRunner();
        await ownedSession(conversationId, currentProfile);
        request.auditContext = {
          conversationId,
          taskId,
        };
        const cancellation = await repository.requestCancelOwned(
          conversationId,
          currentProfile.id,
          taskId,
        );
        if (cancellation.status !== "already_terminal") {
          runner.cancel(taskId);
        }
        sendJson(response, 202, {
          accepted: cancellation.status !== "already_terminal",
          taskId,
        });
        return true;
      }

      const sessionMatch = url.pathname.match(
        /^\/api\/work-center\/v1\/ai-assistant\/sessions\/([0-9a-fA-F-]{36})(?:\/(messages|events|archive))?$/,
      );
      if (!sessionMatch) {
        throw Object.assign(new Error("AI assistant route is invalid."), {
          code: "AI_ASSISTANT_INPUT_INVALID",
        });
      }
      const conversationId = sessionMatch[1];
      const action = sessionMatch[2] ?? "";

      if (request.method === "DELETE" && !action) {
        await ownedSession(conversationId, currentProfile);
        const removed = await repository.remove(
          conversationId,
          currentProfile.id,
        );
        if (!removed) {
          throw Object.assign(
            new Error("An AI assistant response is already in progress."),
            { code: "AI_ASSISTANT_RESPONSE_IN_PROGRESS" },
          );
        }
        request.auditContext = { conversationId };
        sendJson(response, 200, { deleted: true });
        return true;
      }

      const session = await ownedSession(conversationId, currentProfile);
      request.auditContext = { conversationId };

      if (request.method === "PATCH" && !action) {
        const input = await readJsonBody(request);
        const updated = await repository.rename(
          conversationId,
          currentProfile.id,
          sessionTitle(input.title),
        );
        sendJson(response, 200, { session: publicSession(updated) });
        return true;
      }

      if (request.method === "POST" && action === "archive") {
        const archived = await repository.archive(
          conversationId,
          currentProfile.id,
        );
        if (!archived && session.status === "ACTIVE") {
          throw Object.assign(
            new Error("An AI assistant response is already in progress."),
            { code: "AI_ASSISTANT_RESPONSE_IN_PROGRESS" },
          );
        }
        sendJson(response, 200, { archived: true });
        return true;
      }

      if (request.method === "GET" && !action) {
        const tasks = await repository.listTasksOwned(
          conversationId,
          currentProfile.id,
        );
        sendJson(response, 200, {
          session: publicSession(session),
          tasks: tasks.map(publicAiAssistantTask),
        });
        return true;
      }

      if (request.method === "POST" && action === "messages") {
        const runner = requireTaskRunner();
        if (session.status !== "ACTIVE") {
          throw Object.assign(new Error("AI assistant session is archived."), {
            code: "AI_ASSISTANT_SESSION_ARCHIVED",
          });
        }
        const input = await readJsonBody(request, maxJsonBytes);
        const replacesTaskId = String(input.replacesTaskId ?? "");
        const replacementRequested = Boolean(replacesTaskId);
        if (replacementRequested && !conversationIdPattern.test(replacesTaskId)) {
          throw taskNotFound();
        }
        const sourceTask = replacementRequested
          ? await repository.getTaskOwned(
              conversationId,
              currentProfile.id,
              replacesTaskId,
            )
          : null;
        if (replacementRequested && (!sourceTask || sourceTask.messageState !== "VISIBLE")) {
          throw taskNotFound();
        }
        const requestedAttachmentIds = Array.isArray(input.attachmentIds)
          ? input.attachmentIds.map((value) => String(value))
          : [];
        const attachmentIds = sourceTask
          ? sourceTask.attachments.map((attachment) => String(attachment.id))
          : requestedAttachmentIds;
        const displayPrompt = String(input.prompt ?? "").trim() ||
          (attachmentIds.length ? "添付ファイルを解析してください。" : "");
        promptValue(displayPrompt);
        const inquiryContext = sourceTask
          ? sourceTask.inquiryContext ?? null
          : normalizeInquiryAssistantContext(input.inquiryContext);
        if (attachmentIds.length && !attachmentStore) {
          throw Object.assign(
            new Error("AI assistant attachment store is unavailable."),
            { code: "AI_ASSISTANT_CONFIGURATION_REQUIRED" },
          );
        }
        const preparedAttachments = attachmentStore
          ? sourceTask
            ? await attachmentStore.reuseForTask(
                attachmentIds,
                conversationId,
                currentProfile.id,
                sourceTask.id,
              )
            : await attachmentStore.resolveForTask(
                attachmentIds,
                conversationId,
                currentProfile.id,
              )
          : [];
        const requestId = String(
          response.getHeader("X-Request-ID") ?? "",
        ).slice(0, 100);
        const priorTasks = await repository.listTasksOwned(
          conversationId,
          currentProfile.id,
        );
        const routingPriorTasks = sourceTask
          ? priorTasks.filter((task) =>
              task.messageState === "VISIBLE" &&
              task.messagePosition < sourceTask.messagePosition
            )
          : priorTasks;
        const routing = resolveAssistantTaskRouting({
          prompt: displayPrompt,
          inquiryContext,
          priorTasks: routingPriorTasks,
          attachments: preparedAttachments,
          modelSettings: session.startingModel,
        });
        if (replacementRequested) {
          routing.replacesTaskId = replacesTaskId;
        }
        const task = await repository.createTask({
          id: randomUUID(),
          conversationId,
          ownerUserId: currentProfile.id,
          prompt: displayPrompt,
          inquiryContext,
          attachments: publicPromptAttachments(preparedAttachments),
          routing,
          requestId: requestId || null,
          replacesTaskId: replacementRequested ? replacesTaskId : null,
        });
        try {
          if (preparedAttachments.length) {
            await attachmentStore.bindToTask(
              preparedAttachments.map((attachment) => attachment.id),
              conversationId,
              currentProfile.id,
              task.id,
            );
          }
          runner.start(task.id);
        } catch (error) {
          await repository.failTask(
            task.id,
            error?.code ?? "AI_ASSISTANT_START_FAILED",
            error?.message ?? "AI assistant GPT execution could not start.",
          ).catch(() => {});
          throw error;
        }
        request.auditContext = {
          ...request.auditContext,
          taskId: task.id,
          taskClass: routing.taskClass,
          modelSettingId: routing.modelSettingId,
          routePolicyVersion: routing.routePolicyVersion,
          selectionReason: routing.selectionReason,
          attemptNumber: routing.attemptNumber,
          shortcutId: session.shortcut?.id ?? null,
        };
        sendJson(response, 202, {
          task: publicAiAssistantTask(task),
        });
        return true;
      }

      if (request.method === "GET" && action === "events") {
        const taskId = String(url.searchParams.get("task_id") ?? "");
        if (!conversationIdPattern.test(taskId)) throw taskNotFound();
        request.auditContext = { ...request.auditContext, taskId };
        await pipeTaskEvents({
          response,
          repository,
          conversationId,
          ownerUserId: currentProfile.id,
          taskId,
          url,
          lastEventId: request.headers["last-event-id"],
          signal: lifecycle.signal,
          pollIntervalMs: Math.max(10, Number(eventPollIntervalMs) || 250),
        });
        return true;
      }

      throw Object.assign(new Error("AI assistant method is invalid."), {
        code: "AI_ASSISTANT_INPUT_INVALID",
      });
    } catch (error) {
      if (lifecycle.signal.aborted) {
        return true;
      }
      if (!response.headersSent) {
        assistantError(response, sendJson, error);
      } else {
        response.end();
      }
      return true;
    } finally {
      lifecycle.dispose();
    }
  };
}
