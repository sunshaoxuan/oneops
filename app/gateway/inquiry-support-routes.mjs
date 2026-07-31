import { Readable } from "node:stream";
import {
  createInquiryAnalysisService,
} from "./inquiry-analysis.mjs";
import {
  inquiryDetailContains,
  validateInquirySourceSettings,
} from "./inquiry-support-source.mjs";

const validStatuses = new Set([
  "all",
  "open",
  "close",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
]);

function routeError(response, sendJson, error) {
  const statusByCode = {
    INQUIRY_SETTINGS_NOT_CONFIGURED: 409,
    INQUIRY_SOURCE_DISABLED: 409,
    INQUIRY_TICKET_NOT_FOUND: 404,
    INQUIRY_THREAD_NOT_FOUND: 404,
    INQUIRY_ATTACHMENT_NOT_FOUND: 404,
    INQUIRY_ASSIST_RUN_NOT_FOUND: 404,
    INQUIRY_SOURCE_AUTHENTICATION_FAILED: 502,
    INQUIRY_SOURCE_REQUEST_FAILED: 502,
  };
  sendJson(response, statusByCode[error?.code] ?? 500, {
    error: {
      code: error?.code ?? "INQUIRY_SUPPORT_OPERATION_FAILED",
      message: error?.message ?? "Inquiry support operation failed.",
      details: {},
    },
  });
}

function validateSearch(input) {
  const status = String(input?.status ?? "");
  const keywordOperator = input?.keywordOperator === "OR" ? "OR" : "AND";
  const includeRelatedRecords = input?.includeRelatedRecords !== false;
  const createdFrom = String(input?.createdFrom ?? "");
  const createdTo = String(input?.createdTo ?? "");
  const requestedReplyFrom = String(input?.requestedReplyFrom ?? "");
  const requestedReplyTo = String(input?.requestedReplyTo ?? "");
  const updatedFrom = String(input?.updatedFrom ?? "");
  const updatedTo = String(input?.updatedTo ?? "");
  const ticketNo = String(input?.ticketNo ?? "").trim();
  const content = String(input?.content ?? "").trim();
  const assignee = String(input?.assignee ?? "").trim();
  const customer = String(input?.customer ?? "").trim();
  const customerName = String(input?.customerName ?? "").trim();
  const customerCode = String(input?.customerCode ?? "").trim();
  const unassignedOnly = input?.unassignedOnly === true;
  const assigneeName = String(input?.assigneeName ?? "").trim();
  const subStatus = String(input?.subStatus ?? "").trim();
  const category = String(input?.category ?? "").trim();
  const classificationResult = String(
    input?.classificationResult ?? "",
  ).trim();
  const questionerName = String(input?.questionerName ?? "").trim();
  const aiProcessedOnly = input?.aiProcessedOnly === true;
  const hasOtherCondition = Boolean(
    ticketNo ||
    content ||
    createdFrom ||
    createdTo ||
    requestedReplyFrom ||
    requestedReplyTo ||
    updatedFrom ||
    updatedTo ||
    customer ||
    customerName ||
    customerCode ||
    assignee ||
    unassignedOnly ||
    assigneeName ||
    subStatus ||
    category ||
    classificationResult ||
    questionerName ||
    aiProcessedOnly
  );
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const errors = {};
  if (!validStatuses.has(status)) errors.status = "Ticket status is required.";
  if (
    input?.keywordOperator !== undefined &&
    !["AND", "OR"].includes(input.keywordOperator)
  ) {
    errors.keywordOperator = "Keyword operator is invalid.";
  }
  if (status === "all" && !hasOtherCondition) {
    errors.status =
      "Select a specific ticket status when no other search condition is set.";
  }
  for (const [fromKey, toKey, from, to] of [
    ["createdFrom", "createdTo", createdFrom, createdTo],
    [
      "requestedReplyFrom",
      "requestedReplyTo",
      requestedReplyFrom,
      requestedReplyTo,
    ],
    ["updatedFrom", "updatedTo", updatedFrom, updatedTo],
  ]) {
    if (from && !datePattern.test(from)) {
      errors[fromKey] = "Start date is invalid.";
    }
    if (to && !datePattern.test(to)) {
      errors[toKey] = "End date is invalid.";
    }
    if (from && to && from > to) {
      errors[toKey] = "End date must not precede start date.";
    }
  }
  if (ticketNo && !validateTicketNo(ticketNo)) {
    errors.ticketNo = "Ticket number is invalid.";
  }
  if (content.length > 200) {
    errors.content = "Content search must not exceed 200 characters.";
  }
  for (const [key, value, maximum] of [
    ["assignee", assignee, 100],
    ["customer", customer, 100],
    ["customerName", customerName, 200],
    ["customerCode", customerCode, 100],
    ["assigneeName", assigneeName, 200],
    ["subStatus", subStatus, 100],
    ["category", category, 100],
    ["classificationResult", classificationResult, 100],
    ["questionerName", questionerName, 200],
  ]) {
    if (
      value.length > maximum ||
      /[\u0000-\u001f\u007f]/.test(value)
    ) {
      errors[key] = "Search condition is invalid.";
    }
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    filters: {
      status,
      createdFrom: createdFrom || null,
      createdTo: createdTo || null,
      requestedReplyFrom: requestedReplyFrom || null,
      requestedReplyTo: requestedReplyTo || null,
      updatedFrom: updatedFrom || null,
      updatedTo: updatedTo || null,
      keywordOperator,
      includeRelatedRecords,
      customer: customer || null,
      customerName: customerName || null,
      customerCode: customerCode || null,
      assignee: assignee || null,
      unassignedOnly,
      assigneeName: assigneeName || null,
      ticketNo: ticketNo || null,
      content: content || null,
      subStatus: subStatus || null,
      category: category || null,
      classificationResult: classificationResult || null,
      questionerName: questionerName || null,
      aiProcessedOnly,
    },
  };
}

function validateTicketNo(value) {
  return /^\d{1,20}$/.test(String(value));
}

export function validateInquiryAssistAnchor(input) {
  const focusMessageKey = input?.focusMessageKey
    ? String(input.focusMessageKey)
    : null;
  const requestedAnchor = input?.anchor
    ? String(input.anchor)
    : focusMessageKey
      ? "MESSAGE"
      : "NEXT_REPLY";
  const anchor = ["TICKET", "QUESTION", "MESSAGE", "NEXT_REPLY"].includes(
    requestedAnchor,
  )
    ? requestedAnchor
    : null;
  return {
    valid: Boolean(
      anchor &&
        ((anchor === "MESSAGE" && focusMessageKey) ||
          (anchor !== "MESSAGE" && !focusMessageKey)),
    ),
    anchor,
    focusMessageKey,
  };
}

async function activeSettings(repository) {
  const settings = await repository.getSettings({
    includeCredentials: true,
  });
  if (!settings.id || !settings.passwordConfigured) {
    throw Object.assign(new Error("Inquiry source is not configured."), {
      code: "INQUIRY_SETTINGS_NOT_CONFIGURED",
    });
  }
  if (!settings.enabled) {
    throw Object.assign(new Error("Inquiry source is disabled."), {
      code: "INQUIRY_SOURCE_DISABLED",
    });
  }
  return settings;
}

const attachmentPreviewTypes = new Map([
  ["bmp", "image/bmp"],
  ["gif", "image/gif"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["pdf", "application/pdf"],
  ["doc", "application/msword"],
  [
    "docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ["docm", "application/vnd.ms-word.document.macroEnabled.12"],
  ["xls", "application/vnd.ms-excel"],
  [
    "xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ["xlsm", "application/vnd.ms-excel.sheet.macroEnabled.12"],
  ["xlsb", "application/vnd.ms-excel.sheet.binary.macroEnabled.12"],
]);

function attachmentExtension(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

export function inquiryAttachmentPreviewType(name) {
  return attachmentPreviewTypes.get(attachmentExtension(name)) ?? null;
}

function safeAttachmentFilename(name) {
  const value = String(name ?? "attachment")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();
  return value || "attachment";
}

function encodedAttachmentFilename(name) {
  return encodeURIComponent(name)
    .replace(/['()]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");
}

function asciiAttachmentFilename(name) {
  const extension = attachmentExtension(name);
  const suffix = extension ? `.${extension}` : "";
  const base = extension
    ? name.slice(0, -(extension.length + 1))
    : name;
  const asciiBase = base
    .normalize("NFKD")
    .replace(/[^\u0020-\u007e]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[ ._]+|[ ._]+$/g, "");
  return `${asciiBase || "attachment"}${suffix}`;
}

export function safeAttachmentHeaders(upstream, { mode, name }) {
  const previewType = inquiryAttachmentPreviewType(name);
  const inline = mode === "preview" && Boolean(previewType);
  const filename = safeAttachmentFilename(name);
  const fallbackFilename = asciiAttachmentFilename(filename);
  const headers = {
    "Content-Type": previewType ?? upstream.headers.get("content-type") ??
      "application/octet-stream",
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${fallbackFilename}"; filename*=UTF-8''${encodedAttachmentFilename(filename)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  for (const headerName of [
    "accept-ranges",
    "content-length",
    "content-range",
  ]) {
    const value = upstream.headers.get(headerName);
    if (value) headers[headerName] = value;
  }
  return headers;
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(
    Array.from(
      { length: Math.min(limit, values.length) },
      () => worker(),
    ),
  );
  return results;
}

async function filterTicketsByDetailContent(
  sourceClient,
  settings,
  tickets,
  content,
  keywordOperator,
  includeRelatedRecords,
) {
  if (!content) return tickets;
  const matches = await mapWithConcurrency(
    tickets,
    1,
    async (ticket) => ({
      ticket,
      matches: inquiryDetailContains(
        await sourceClient.detail(settings, ticket.ticketNo),
        content,
        keywordOperator,
        includeRelatedRecords,
      ),
    }),
  );
  return matches.filter((item) => item.matches).map((item) => item.ticket);
}

export async function searchInquiryTicketsWithHistory({
  repository,
  sourceClient,
  settings,
  filters,
}) {
  if (!filters.aiProcessedOnly) {
    const result = await sourceClient.search(settings, filters);
    if (!filters.ticketNo || !filters.content) return result;
    const tickets = await filterTicketsByDetailContent(
      sourceClient,
      settings,
      result.tickets,
      filters.content,
      filters.keywordOperator,
      filters.includeRelatedRecords,
    );
    return {
      actualCount: tickets.length,
      displayedCount: tickets.length,
      sourceTruncated: false,
      tickets,
    };
  }

  let ticketNos = await repository.listAssistedTicketNos();
  if (filters.ticketNo) {
    ticketNos = ticketNos.filter((ticketNo) => ticketNo === filters.ticketNo);
  }
  const searchResults = await mapWithConcurrency(
    ticketNos,
    1,
    (ticketNo) => sourceClient.search(settings, {
      ...filters,
      ticketNo,
      content: null,
      aiProcessedOnly: false,
    }),
  );
  const byTicketNo = new Map();
  for (const result of searchResults) {
    for (const ticket of result.tickets) {
      if (ticketNos.includes(ticket.ticketNo)) {
        byTicketNo.set(ticket.ticketNo, ticket);
      }
    }
  }
  const tickets = await filterTicketsByDetailContent(
    sourceClient,
    settings,
    Array.from(byTicketNo.values()),
    filters.content,
    filters.keywordOperator,
    filters.includeRelatedRecords,
  );
  return {
    actualCount: tickets.length,
    displayedCount: tickets.length,
    sourceTruncated: false,
    tickets,
  };
}

export function createInquirySupportRouteHandler({
  repository,
  auditRepository,
  sourceClient,
  modelSettingsRepository,
  agentGatewaySettingsRepository,
  sendJson,
  readJsonBody,
}) {
  const analysisService = createInquiryAnalysisService({
    repository,
    auditRepository,
    modelSettingsRepository,
    agentGatewaySettingsRepository,
  });

  return async function handleInquirySupport(
    request,
    response,
    url,
    currentProfile,
  ) {
    const prefix = "/api/work-center/v1/inquiry-support";
    if (!url.pathname.startsWith(prefix)) return false;

    try {
      if (request.method === "GET" && url.pathname === `${prefix}/settings`) {
        sendJson(response, 200, {
          settings: await repository.getSettings({
            includeCredentials: true,
          }),
          models: (await modelSettingsRepository.list())
            .filter((item) => item.id)
            .map(({ id, purpose, model }) => ({ id, purpose, model })),
          agentGateways: (await agentGatewaySettingsRepository.list()).map(
            ({ id, name, enabled }) => ({ id, name, enabled }),
          ),
        });
        return true;
      }

      if (request.method === "PUT" && url.pathname === `${prefix}/settings`) {
        const validation = validateInquirySourceSettings(
          await readJsonBody(request),
        );
        if (!validation.valid) {
          sendJson(response, 400, {
            error: {
              code: "INQUIRY_SETTINGS_INVALID",
              message: "Inquiry source settings are invalid.",
              details: validation.errors,
            },
          });
          return true;
        }
        const settings = await repository.saveSettings(
          validation.value,
          currentProfile.id,
        );
        sourceClient.clearSession(settings.id);
        sendJson(response, 200, { settings });
        return true;
      }

      if (
        request.method === "POST" &&
        url.pathname === `${prefix}/settings/test`
      ) {
        const saved = await repository.getSettings({
          includeCredentials: true,
        });
        const input = await readJsonBody(request);
        const validation = validateInquirySourceSettings({
          ...saved,
          ...input,
          password: input.password || saved.password,
        });
        if (!validation.valid) {
          sendJson(response, 400, {
            error: {
              code: "INQUIRY_SETTINGS_INVALID",
              message: "Inquiry source settings are invalid.",
              details: validation.errors,
            },
          });
          return true;
        }
        const probe = {
          ...saved,
          ...validation.value,
          id: saved.id ?? "probe",
          revision: Date.now(),
        };
        await sourceClient.ensureLogin(probe);
        sendJson(response, 200, {
          success: true,
          testedAt: new Date().toISOString(),
        });
        return true;
      }

      if (request.method === "POST" && url.pathname === `${prefix}/search`) {
        const validation = validateSearch(await readJsonBody(request));
        if (!validation.valid) {
          sendJson(response, 400, {
            error: {
              code: "INQUIRY_SEARCH_INVALID",
              message: "Inquiry search conditions are invalid.",
              details: validation.errors,
            },
          });
          return true;
        }
        request.auditContext = { filters: validation.filters };
        const settings = await activeSettings(repository);
        sendJson(response, 200, await searchInquiryTicketsWithHistory({
          repository,
          sourceClient,
          settings,
          filters: validation.filters,
        }));
        return true;
      }

      if (request.method === "GET" && url.pathname === `${prefix}/options`) {
        sendJson(
          response,
          200,
          await sourceClient.options(await activeSettings(repository)),
        );
        return true;
      }

      const detailMatch = url.pathname.match(
        new RegExp(`^${prefix}/tickets/([^/]+)$`),
      );
      if (request.method === "GET" && detailMatch) {
        const ticketNo = decodeURIComponent(detailMatch[1]);
        request.auditContext = { ticketNo };
        if (!validateTicketNo(ticketNo)) {
          throw Object.assign(new Error("Ticket number is invalid."), {
            code: "INQUIRY_TICKET_NOT_FOUND",
          });
        }
        const settings = await activeSettings(repository);
        sendJson(
          response,
          200,
          await sourceClient.detail(settings, ticketNo),
        );
        return true;
      }

      const attachmentMatch = url.pathname.match(
        new RegExp(
          `^${prefix}/tickets/([^/]+)/attachments/([^/]+)$`,
        ),
      );
      if (request.method === "GET" && attachmentMatch) {
        const ticketNo = decodeURIComponent(attachmentMatch[1]);
        const attachmentId = decodeURIComponent(attachmentMatch[2]);
        const mode = url.searchParams.get("mode") === "preview"
          ? "preview"
          : "download";
        const name = url.searchParams.get("name") || "attachment";
        request.auditContext = { ticketNo, attachmentId, mode };
        if (
          !validateTicketNo(ticketNo) ||
          !/^[A-Za-z0-9_-]{1,128}$/.test(attachmentId)
        ) {
          throw Object.assign(new Error("Attachment was not found."), {
            code: "INQUIRY_ATTACHMENT_NOT_FOUND",
          });
        }
        const upstream = await sourceClient.attachment(
          await activeSettings(repository),
          ticketNo,
          attachmentId,
          {
            headers: request.headers.range
              ? { range: request.headers.range }
              : undefined,
          },
        );
        if (!upstream.ok || !upstream.body) {
          throw Object.assign(new Error("Attachment was not found."), {
            code: "INQUIRY_ATTACHMENT_NOT_FOUND",
          });
        }
        response.writeHead(
          upstream.status,
          safeAttachmentHeaders(upstream, { mode, name }),
        );
        Readable.fromWeb(upstream.body).pipe(response);
        return true;
      }

      const createRunMatch = url.pathname.match(
        new RegExp(
          `^${prefix}/tickets/([^/]+)/threads/([^/]+)/assist-runs$`,
        ),
      );
      if (request.method === "POST" && createRunMatch) {
        const ticketNo = decodeURIComponent(createRunMatch[1]);
        const questionKey = decodeURIComponent(createRunMatch[2]);
        const input = await readJsonBody(request);
        const settings = await activeSettings(repository);
        const ticket = await sourceClient.detail(settings, ticketNo);
        const thread = ticket.questionThreads.find(
          (item) => item.questionKey === questionKey,
        );
        if (!thread) {
          throw Object.assign(new Error("Question thread was not found."), {
            code: "INQUIRY_THREAD_NOT_FOUND",
          });
        }
        const anchorValidation = validateInquiryAssistAnchor(input);
        const { anchor, focusMessageKey } = anchorValidation;
        request.auditContext = {
          ticketNo,
          questionKey,
          anchor,
          focusMessageKey,
        };
        if (!anchorValidation.valid) {
          sendJson(response, 400, {
            error: {
              code: "INQUIRY_ASSIST_ANCHOR_INVALID",
              message: "AI assistance anchor and focus message do not match.",
              details: {},
            },
          });
          return true;
        }
        if (
          focusMessageKey &&
          !thread.messages.some(
            (message) => message.messageKey === focusMessageKey,
          )
        ) {
          sendJson(response, 400, {
            error: {
              code: "INQUIRY_FOCUS_MESSAGE_INVALID",
              message: "Focus message does not belong to this question.",
              details: {},
            },
          });
          return true;
        }
        let providerLabel;
        if (settings.analysisProvider === "MODEL") {
          const model = (await modelSettingsRepository.list()).find(
            (item) => item.id === settings.modelSettingId,
          );
          providerLabel = model?.model ?? "Configured model";
        } else {
          const gateway = await agentGatewaySettingsRepository.get(
            settings.agentGatewaySettingId,
          );
          providerLabel = gateway?.name ?? "Configured Agent Gateway";
        }
        const run = await repository.createRun({
          ticketNo,
          questionKey,
          anchor,
          focusMessageKey,
          provider: settings.analysisProvider,
          providerLabel,
          modelSettingId: settings.modelSettingId,
          agentGatewaySettingId: settings.agentGatewaySettingId,
          requestedByUserId: currentProfile.id,
          requestedSessionId: currentProfile.sessionId,
        });
        queueMicrotask(() => {
          analysisService.start({ run, settings, ticket, thread });
        });
        sendJson(response, 202, { run });
        return true;
      }

      const ticketRunsMatch = url.pathname.match(
        new RegExp(`^${prefix}/tickets/([^/]+)/assist-runs$`),
      );
      if (request.method === "GET" && ticketRunsMatch) {
        sendJson(response, 200, {
          runs: await repository.listRuns(
            decodeURIComponent(ticketRunsMatch[1]),
          ),
        });
        return true;
      }

      const runMatch = url.pathname.match(
        new RegExp(`^${prefix}/assist-runs/([^/]+)$`),
      );
      if (request.method === "GET" && runMatch) {
        const run = await repository.getRun(decodeURIComponent(runMatch[1]));
        if (!run) {
          throw Object.assign(new Error("Assist run was not found."), {
            code: "INQUIRY_ASSIST_RUN_NOT_FOUND",
          });
        }
        sendJson(response, 200, { run });
        return true;
      }

      const eventsMatch = url.pathname.match(
        new RegExp(`^${prefix}/assist-runs/([^/]+)/events$`),
      );
      if (request.method === "GET" && eventsMatch) {
        const id = decodeURIComponent(eventsMatch[1]);
        const run = await repository.getRun(id);
        if (!run) {
          throw Object.assign(new Error("Assist run was not found."), {
            code: "INQUIRY_ASSIST_RUN_NOT_FOUND",
          });
        }
        const after = Number(
          url.searchParams.get("after_sequence") ??
            request.headers["last-event-id"] ??
            0,
        );
        response.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        });
        for (const event of await repository.listEvents(id, after)) {
          response.write(`id: ${event.sequence}\n`);
          response.write(`event: ${event.type}\n`);
          response.write(`data: ${JSON.stringify(event)}\n\n`);
        }
        response.end();
        return true;
      }

      sendJson(response, 404, {
        error: {
          code: "INQUIRY_SUPPORT_ROUTE_NOT_FOUND",
          message: "Inquiry support route was not found.",
          details: {},
        },
      });
      return true;
    } catch (error) {
      routeError(response, sendJson, error);
      return true;
    }
  };
}

export { validateSearch };
