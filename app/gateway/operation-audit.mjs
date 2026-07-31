const ignoredPaths = new Set([
  "/api/work-center/v1/health",
  "/api/work-center/v1/events",
  "/api/work-center/v1/auth/session",
]);

function methodAction(method) {
  switch (String(method).toUpperCase()) {
    case "GET":
    case "HEAD":
      return "READ";
    case "POST":
      return "CREATE";
    case "PUT":
    case "PATCH":
      return "UPDATE";
    case "DELETE":
      return "DELETE";
    default:
      return "EXECUTE";
  }
}

function outcome(statusCode) {
  if (statusCode >= 200 && statusCode < 400) return "SUCCESS";
  if (statusCode === 401 || statusCode === 403) return "DENIED";
  return "FAILED";
}

export function operationAuditDescription(method, pathname, statusCode) {
  if (ignoredPaths.has(pathname)) return null;
  const base = {
    eventType: "FUNCTION_USED",
    capability: "WORK_CENTER_API",
    action: methodAction(method),
    targetType: "API",
    outcome: outcome(statusCode),
    resourceRef: "",
  };

  const inquiryPrefix = "/api/work-center/v1/inquiry-support";
  if (pathname.includes("/personal-task")) {
    const credentialAction = pathname.endsWith("/credential");
    const syncAction = pathname.endsWith("/sync");
    const promptAction = pathname.endsWith("/prompt-runs");
    return {
      ...base,
      eventType: credentialAction
        ? "PERSONAL_TASK_CREDENTIAL_READ"
        : syncAction
          ? "PERSONAL_TASK_SYNC_EXECUTED"
          : promptAction
            ? "PERSONAL_TASK_PROMPT_USED"
            : "PERSONAL_TASK_USED",
      capability: credentialAction
        ? "PERSONAL_TASK_CREDENTIAL"
        : syncAction
          ? "PERSONAL_TASK_SYNC"
          : promptAction
            ? "PERSONAL_TASK_AI"
            : "PERSONAL_TASK",
      action: credentialAction
        ? "REVEAL"
        : syncAction
          ? "SYNC"
          : methodAction(method),
      targetType: pathname.includes("/connections")
        ? "PERSONAL_TASK_EXTERNAL_ACCOUNT"
        : pathname.includes("/candidates")
          ? "PERSONAL_TASK_CANDIDATE"
          : "PERSONAL_TASK",
    };
  }
  const assistantAttachment = pathname.match(
    /\/ai-assistant\/sessions\/([^/]+)\/attachments(?:\/([^/]+))?$/,
  );
  if (assistantAttachment) {
    return {
      ...base,
      eventType:
        method === "POST"
          ? "AI_ASSISTANT_ATTACHMENT_UPLOADED"
          : method === "DELETE"
            ? "AI_ASSISTANT_ATTACHMENT_DELETED"
            : "AI_ASSISTANT_ATTACHMENT_READ",
      capability: "AI_ASSISTANT",
      action:
        method === "POST"
          ? "UPLOAD_ATTACHMENT"
          : method === "DELETE"
            ? "DELETE_ATTACHMENT"
            : "READ_ATTACHMENT",
      targetType: "AI_ASSISTANT_ATTACHMENT",
      resourceRef: decodeURIComponent(
        assistantAttachment[2] ?? assistantAttachment[1],
      ),
    };
  }
  const assistantSession = pathname.match(
    /\/ai-assistant\/sessions\/([^/]+)(?:\/(messages|events|archive))?$/,
  );
  if (assistantSession) {
    const actionName = assistantSession[2] ?? "";
    return {
      ...base,
      eventType:
        actionName === "messages"
          ? "AI_ASSISTANT_MESSAGE_SENT"
          : actionName === "events"
            ? "AI_ASSISTANT_EVENTS_READ"
            : actionName === "archive"
              ? "AI_ASSISTANT_SESSION_ARCHIVED"
              : method === "DELETE"
                ? "AI_ASSISTANT_SESSION_DELETED"
              : "AI_ASSISTANT_SESSION_USED",
      capability: "AI_ASSISTANT",
      action:
        actionName === "messages"
          ? "SEND_MESSAGE"
          : actionName === "events"
            ? "READ_EVENTS"
            : actionName === "archive"
              ? "ARCHIVE"
              : method === "DELETE"
                ? "DELETE_SESSION"
              : methodAction(method),
      targetType: "AI_ASSISTANT_SESSION",
      resourceRef: decodeURIComponent(assistantSession[1]),
    };
  }
  if (pathname === "/api/work-center/v1/ai-assistant/sessions") {
    return {
      ...base,
      eventType:
        method === "POST"
          ? "AI_ASSISTANT_SESSION_CREATED"
          : "AI_ASSISTANT_SESSIONS_READ",
      capability: "AI_ASSISTANT",
      action: method === "POST" ? "CREATE_SESSION" : "READ_SESSIONS",
      targetType: "AI_ASSISTANT_SESSION",
    };
  }
  if (pathname === `${inquiryPrefix}/search`) {
    return {
      ...base,
      eventType: "INQUIRY_SEARCHED",
      capability: "INQUIRY_SEARCH",
      action: "SEARCH",
      targetType: "INQUIRY",
    };
  }
  if (pathname === `${inquiryPrefix}/options`) {
    return {
      ...base,
      capability: "INQUIRY_SEARCH",
      action: "READ_OPTIONS",
      targetType: "INQUIRY",
    };
  }
  if (pathname.includes(`${inquiryPrefix}/settings`)) {
    return {
      ...base,
      eventType: "INQUIRY_SOURCE_SETTINGS_USED",
      capability: "INQUIRY_SOURCE_SETTINGS",
      targetType: "INQUIRY_SOURCE",
    };
  }
  const assistRun = pathname.match(
    /\/inquiry-support\/assist-runs\/([^/]+)(?:\/events)?$/,
  );
  if (assistRun) {
    return {
      ...base,
      eventType: "INQUIRY_AI_RUN_READ",
      capability: "INQUIRY_AI_ASSIST",
      action: pathname.endsWith("/events") ? "READ_EVENTS" : "READ_RESULT",
      targetType: "INQUIRY_ASSIST_RUN",
      resourceRef: decodeURIComponent(assistRun[1]),
    };
  }
  const createAssist = pathname.match(
    /\/inquiry-support\/tickets\/([^/]+)\/threads\/([^/]+)\/assist-runs$/,
  );
  if (createAssist) {
    return {
      ...base,
      eventType: "INQUIRY_AI_RUN_CREATED",
      capability: "INQUIRY_AI_ASSIST",
      action: "CREATE_RUN",
      targetType: "INQUIRY_TICKET",
      resourceRef: decodeURIComponent(createAssist[1]),
    };
  }
  const attachment = pathname.match(
    /\/inquiry-support\/tickets\/([^/]+)\/attachments\/([^/]+)$/,
  );
  if (attachment) {
    return {
      ...base,
      eventType: "INQUIRY_ATTACHMENT_READ",
      capability: "INQUIRY_ATTACHMENT",
      action: "DOWNLOAD",
      targetType: "INQUIRY_TICKET",
      resourceRef: decodeURIComponent(attachment[1]),
    };
  }
  const ticketAssistHistory = pathname.match(
    /\/inquiry-support\/tickets\/([^/]+)\/assist-runs$/,
  );
  if (ticketAssistHistory) {
    return {
      ...base,
      eventType: "INQUIRY_AI_RUN_HISTORY_READ",
      capability: "INQUIRY_AI_ASSIST",
      action: "READ_HISTORY",
      targetType: "INQUIRY_TICKET",
      resourceRef: decodeURIComponent(ticketAssistHistory[1]),
    };
  }
  const ticket = pathname.match(
    /\/inquiry-support\/tickets\/([^/]+)(?:\/assist-runs)?$/,
  );
  if (ticket) {
    return {
      ...base,
      eventType: "INQUIRY_TICKET_OPENED",
      capability: "INQUIRY_DETAIL",
      action: "READ",
      targetType: "INQUIRY_TICKET",
      resourceRef: decodeURIComponent(ticket[1]),
    };
  }
  if (
    pathname.includes("/ai-settings") ||
    pathname.includes("/model-settings")
  ) {
    return {
      ...base,
      capability: "AI_MODEL_SETTINGS",
      targetType: "AI_MODEL_SETTING",
    };
  }
  if (pathname.includes("/agent-gateways")) {
    return {
      ...base,
      capability: "AGENT_GATEWAY",
      targetType: "AGENT_GATEWAY",
    };
  }
  if (pathname.includes("/builder/")) {
    return {
      ...base,
      capability: "STANDALONE_BUILDER",
      targetType: "BUILD_JOB",
    };
  }
  if (
    pathname.includes("/environments") ||
    pathname.includes("/environment-")
  ) {
    return {
      ...base,
      capability: "ENVIRONMENT_MANAGEMENT",
      targetType: "ENVIRONMENT",
    };
  }
  if (
    pathname.includes("/products") ||
    pathname.includes("/product-") ||
    pathname.includes("/organization-classifications")
  ) {
    return {
      ...base,
      capability: "MASTER_DATA_MANAGEMENT",
      targetType: "MASTER_DATA",
    };
  }
  if (pathname.includes("/organizations")) {
    return {
      ...base,
      capability: "ORGANIZATION_MANAGEMENT",
      targetType: "ORGANIZATION",
    };
  }
  if (pathname.endsWith("/dashboard")) {
    return {
      ...base,
      capability: "DASHBOARD",
      targetType: "DASHBOARD",
    };
  }
  return base;
}
