import { Readable } from "node:stream";
import {
  createInquiryAnalysisService,
} from "./inquiry-analysis.mjs";
import {
  validateInquirySourceSettings,
} from "./inquiry-support-source.mjs";

const validStatuses = new Set([
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
  const createdFrom = String(input?.createdFrom ?? "");
  const createdTo = String(input?.createdTo ?? "");
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const errors = {};
  if (!validStatuses.has(status)) errors.status = "Ticket status is required.";
  if (createdFrom && !datePattern.test(createdFrom)) {
    errors.createdFrom = "Start date is invalid.";
  }
  if (createdTo && !datePattern.test(createdTo)) {
    errors.createdTo = "End date is invalid.";
  }
  if (createdFrom && createdTo && createdFrom > createdTo) {
    errors.createdTo = "End date must not precede start date.";
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    filters: {
      status,
      createdFrom: createdFrom || null,
      createdTo: createdTo || null,
      assignee: String(input?.assignee ?? "").trim() || null,
    },
  };
}

function validateTicketNo(value) {
  return /^\d{1,20}$/.test(String(value));
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

function safeDownloadHeaders(upstream) {
  const headers = {
    "Content-Type":
      upstream.headers.get("content-type") ??
      "application/octet-stream",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers["Content-Disposition"] = disposition;
  const length = upstream.headers.get("content-length");
  if (length) headers["Content-Length"] = length;
  return headers;
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
          settings: await repository.getSettings(),
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
        sendJson(
          response,
          200,
          await sourceClient.search(
            await activeSettings(repository),
            validation.filters,
          ),
        );
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
        sendJson(
          response,
          200,
          await sourceClient.detail(
            await activeSettings(repository),
            ticketNo,
          ),
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
        request.auditContext = { ticketNo, attachmentId };
        if (
          !validateTicketNo(ticketNo) ||
          !/^[A-Za-z0-9_-]{1,128}$/.test(attachmentId)
        ) {
          throw Object.assign(new Error("Attachment was not found."), {
            code: "INQUIRY_TICKET_NOT_FOUND",
          });
        }
        const upstream = await sourceClient.attachment(
          await activeSettings(repository),
          ticketNo,
          attachmentId,
        );
        if (!upstream.ok || !upstream.body) {
          throw Object.assign(new Error("Attachment was not found."), {
            code: "INQUIRY_TICKET_NOT_FOUND",
          });
        }
        response.writeHead(upstream.status, safeDownloadHeaders(upstream));
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
        const focusMessageKey = input?.focusMessageKey
          ? String(input.focusMessageKey)
          : null;
        request.auditContext = {
          ticketNo,
          questionKey,
          focusMessageKey,
        };
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
