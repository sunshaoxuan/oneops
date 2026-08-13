const backlogHostPattern =
  /(^|\.)backlog\.(com|jp)$|(^|\.)backlogtool\.com$/i;

function text(value) {
  return String(value ?? "").trim();
}

const inquiryStatusOptions = [
  { value: "all", label: "すべて" }, { value: "open", label: "OPEN" }, { value: "close", label: "CLOSED" },
  { value: "1", label: "OPEN:未回答" }, { value: "2", label: "OPEN:回答中" }, { value: "3", label: "OPEN:チェック依頼中" },
  { value: "4", label: "OPEN:チェック済（OK）" }, { value: "5", label: "OPEN:チェック済（NG）" }, { value: "6", label: "OPEN:一次回答済" },
  { value: "7", label: "OPEN:保留中" }, { value: "8", label: "CLOSED:回答済" }, { value: "9", label: "CLOSED:処理済" }, { value: "10", label: "CLOSED:評価受信" },
];
function normalizedPersonName(value) { return text(value).normalize("NFKC").replace(/^社内\//, "").replace(/\s+/g, "").toLocaleLowerCase("ja-JP"); }
function normalizedInquiryStatus(value) { return text(value).replace(/[\s:：]/g, "").toUpperCase(); }

const backlogTerminalStatuses = new Set([
  "完了",
  "処理済",
  "処理済み",
  "終了",
  "解決済",
  "解決済み",
  "CLOSED",
  "COMPLETED",
  "DONE",
  "RESOLVED",
]);

export function isExternalTaskTerminalStatus(providerCode, status) {
  const normalized = text(status).replace(/[\s:：]/g, "").toUpperCase();
  if (String(providerCode).toUpperCase() === "INQUIRY") {
    return normalized.startsWith("CLOSED");
  }
  return backlogTerminalStatuses.has(normalized);
}
function conditionError(code, message, details = {}) { const error = new Error(message); error.code = code; error.statusCode = 422; error.details = details; return error; }
export function normalizeInquiryCandidateFilters(input) {
  const status = text(input?.status || "open"); const assigneeMode = text(input?.assigneeMode || "ME").toUpperCase(); const assignee = text(input?.assignee); const errors = {};
  if (!inquiryStatusOptions.some((item) => item.value === status)) errors.status = "Inquiry status is invalid.";
  if (!["ME", "SPECIFIC_ASSIGNEE", "UNASSIGNED"].includes(assigneeMode)) errors.assigneeMode = "Inquiry assignee mode is invalid.";
  if (assigneeMode === "SPECIFIC_ASSIGNEE" && !assignee) errors.assignee = "Inquiry assignee is required.";
  const value = { status, assigneeMode, assignee: assigneeMode === "SPECIFIC_ASSIGNEE" ? assignee : "" };
  for (const [key, max] of [["keyword", 200], ["customer", 200], ["subStatus", 200], ["category", 500], ["classificationResult", 500]]) { const item = text(input?.[key]); if (item.length > max) errors[key] = `${key} is too long.`; value[key] = item; }
  for (const key of ["createdFrom", "createdTo", "requestedReplyFrom", "requestedReplyTo", "updatedFrom", "updatedTo"]) { const item = text(input?.[key]); if (item && !/^\d{4}-\d{2}-\d{2}$/.test(item)) errors[key] = `${key} must use YYYY-MM-DD.`; value[key] = item; }
  return { valid: Object.keys(errors).length === 0, errors, value };
}

function requiredUrl(value, providerCode) {
  let url;
  try {
    url = new URL(text(value));
  } catch {
    const error = new Error("External account URL is invalid.");
    error.code = "PERSONAL_TASK_ACCOUNT_URL_INVALID";
    error.statusCode = 400;
    throw error;
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    const error = new Error("External account URL must be a plain HTTPS URL.");
    error.code = "PERSONAL_TASK_ACCOUNT_URL_INVALID";
    error.statusCode = 400;
    throw error;
  }
  if (
    providerCode === "INQUIRY" &&
    url.hostname.toLowerCase() !== "ss.onehr.jp"
  ) {
    const error = new Error("Inquiry account URL must use ss.onehr.jp.");
    error.code = "PERSONAL_TASK_ACCOUNT_URL_NOT_ALLOWED";
    error.statusCode = 400;
    throw error;
  }
  if (
    providerCode === "BACKLOG" &&
    !backlogHostPattern.test(url.hostname)
  ) {
    const error = new Error("Backlog account URL is not allowed.");
    error.code = "PERSONAL_TASK_ACCOUNT_URL_NOT_ALLOWED";
    error.statusCode = 400;
    throw error;
  }
  return `${url.origin}/`;
}

export function normalizePersonalTaskInput(input) {
  const errors = {};
  const taskType = text(input?.taskType).toUpperCase();
  const status = text(input?.status || "TODO").toUpperCase();
  const priority = text(input?.priority || "NORMAL").toUpperCase();
  const title = text(input?.title);
  const description = String(input?.description ?? "").trim();
  const automationPrompt = String(input?.automationPrompt ?? "").trim();
  const reviewCycle = null;
  const dueAt =
    taskType === "DEADLINE" && input?.dueAt
      ? new Date(input.dueAt)
      : null;
  const nextReviewAt =
    taskType === "LONG_TERM" && input?.nextReviewAt
      ? new Date(input.nextReviewAt)
      : null;

  if (!title || title.length > 200) {
    errors.title = "Title must contain between 1 and 200 characters.";
  }
  if (!["DEADLINE", "LONG_TERM"].includes(taskType)) {
    errors.taskType = "Task type is invalid.";
  }
  if (!["TODO", "IN_PROGRESS", "WAITING", "COMPLETED"].includes(status)) {
    errors.status = "Task status is invalid.";
  }
  if (!["LOW", "NORMAL", "HIGH", "URGENT"].includes(priority)) {
    errors.priority = "Task priority is invalid.";
  }
  if (description.length > 10_000) {
    errors.description = "Description must not exceed 10000 characters.";
  }
  if (automationPrompt.length > 10_000) {
    errors.automationPrompt = "Prompt must not exceed 10000 characters.";
  }
  if (
    taskType === "DEADLINE" &&
    (!dueAt || Number.isNaN(dueAt.getTime()))
  ) {
    errors.dueAt = "Due date is required for a deadline task.";
  }
  if (
    taskType === "LONG_TERM" &&
    input?.nextReviewAt &&
    (!nextReviewAt || Number.isNaN(nextReviewAt.getTime()))
  ) {
    errors.nextReviewAt = "Next review date is invalid.";
  }
  if (
    taskType === "LONG_TERM" &&
    nextReviewAt &&
    automationPrompt
  ) {
    errors.triggerCondition =
      "Choose either a date condition or a semantic AI Prompt condition for a long-term task.";
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      title,
      taskType,
      status,
      priority,
      description,
      automationPrompt,
      promptScheduleEnabled:
        taskType === "DEADLINE" && Boolean(input?.promptScheduleEnabled),
      dueAt: dueAt?.toISOString() ?? null,
      nextReviewAt: nextReviewAt?.toISOString() ?? null,
      reviewCycle: taskType === "LONG_TERM" ? reviewCycle : null,
      customReviewDays: null,
      revision: Number(input?.revision ?? 0),
    },
  };
}

export function normalizeExternalAccountInput(input) {
  const errors = {};
  const providerCode = text(input?.providerCode).toUpperCase();
  const displayName = text(input?.displayName);
  const externalUsername = text(input?.externalUsername);
  let baseUrl = "";
  if (!["INQUIRY", "BACKLOG"].includes(providerCode)) {
    errors.providerCode = "Provider is invalid.";
  } else {
    try {
      baseUrl = requiredUrl(input?.baseUrl, providerCode);
    } catch (error) {
      errors.baseUrl = error.message;
    }
  }
  if (!displayName || displayName.length > 120) {
    errors.displayName =
      "Display name must contain between 1 and 120 characters.";
  }
  if (providerCode === "INQUIRY" && !externalUsername) {
    errors.externalUsername = "Inquiry username is required.";
  }
  const syncIntervalMinutes = Number(input?.syncIntervalMinutes ?? 15);
  if (
    !Number.isInteger(syncIntervalMinutes) ||
    syncIntervalMinutes < 5 ||
    syncIntervalMinutes > 1440
  ) {
    errors.syncIntervalMinutes =
      "Sync interval must contain a value between 5 and 1440.";
  }
  let filters = input?.filters && typeof input.filters === "object" ? input.filters : {};
  if (providerCode === "INQUIRY") { const normalized = normalizeInquiryCandidateFilters(filters); Object.assign(errors, normalized.errors); filters = normalized.value; }
  if (providerCode === "BACKLOG") {
    const projectIds = Array.isArray(filters.projectIds)
      ? filters.projectIds.map((value) => text(value)).filter(Boolean)
      : [];
    const statusIds = Array.isArray(filters.statusIds)
      ? filters.statusIds.map((value) => text(value)).filter(Boolean)
      : [];
    if (projectIds.some((value) => !/^\d+$/.test(value))) {
      errors.projectIds = "Backlog project IDs must be numeric IDs selected from the project list.";
    }
    if (statusIds.some((value) => !/^\d+$/.test(value))) {
      errors.statusIds = "Backlog status IDs must be numeric IDs selected from the status list.";
    }
    filters = {
      projectIds: [...new Set(projectIds)].slice(0, 50),
      statusIds: [...new Set(statusIds)].slice(0, 50),
    };
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      id: input?.id ? String(input.id) : null,
      revision: Number(input?.revision ?? 0),
      providerCode,
      displayName,
      baseUrl,
      externalUsername,
      credential: String(input?.credential ?? ""),
      filters,
      enabled: input?.enabled !== false,
      syncIntervalMinutes,
    },
  };
}

function safeError(error, fallbackCode) {
  return {
    code: String(error?.code ?? fallbackCode),
    message: String(error?.message ?? "External service request failed.")
      .replace(/apiKey=[^&\s]+/gi, "apiKey=[REDACTED]")
      .slice(0, 1000),
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class BacklogTaskConnector {
  constructor({ fetchImpl = fetch } = {}) {
    this.fetchImpl = fetchImpl;
  }

  async request(account, pathname, query = {}, retry = true) {
    const url = new URL(pathname, requiredUrl(account.baseUrl, "BACKLOG"));
    for (const [key, value] of Object.entries(query)) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item !== null && item !== undefined && item !== "") {
          url.searchParams.append(key, String(item));
        }
      }
    }
    url.searchParams.set("apiKey", account.credential);
    let response;
    try {
      response = await this.fetchImpl(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      if (
        error?.name === "TimeoutError" ||
        error?.name === "AbortError"
      ) {
        const timeoutError = new Error("Backlog request timed out.");
        timeoutError.code = "BACKLOG_TIMEOUT";
        throw timeoutError;
      }
      throw error;
    }
    if (response.status === 429 && retry) {
      const reset = Number(response.headers.get("x-ratelimit-reset") ?? 0);
      const waitMs = reset
        ? Math.min(60_000, Math.max(1_000, reset * 1000 - Date.now()))
        : 60_000;
      await wait(waitMs);
      return this.request(account, pathname, query, false);
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const providerMessage = Array.isArray(payload?.errors)
        ? payload.errors
            .map((item) => text(item?.message))
            .filter(Boolean)
            .join(" ")
        : "";
      const error = new Error(
        providerMessage
          ? `Backlog returned status ${response.status}: ${providerMessage}`
          : `Backlog returned status ${response.status}.`,
      );
      error.code =
        response.status === 401
          ? "BACKLOG_AUTHENTICATION_FAILED"
          : response.status === 403
            ? "BACKLOG_ACCESS_DENIED"
            : response.status === 429
              ? "BACKLOG_RATE_LIMITED"
              : "BACKLOG_REQUEST_FAILED";
      throw error;
    }
    return response.json();
  }

  async testConnection(account) {
    const user = await this.request(account, "/api/v2/users/myself");
    const projects = await this.request(account, "/api/v2/projects");
    return {
      identity: {
        id: String(user.id),
        name: String(user.name ?? user.userId ?? ""),
      },
      projects: projects.map((project) => ({
        value: String(project.id),
        label: String(project.name ?? project.projectKey),
        key: String(project.projectKey ?? ""),
      })),
    };
  }

  async options(account) {
    const connection = await this.testConnection(account);
    const projectIds = (
      Array.isArray(account.filters?.projectIds)
        ? account.filters.projectIds
        : connection.projects.map((project) => project.value)
    ).slice(0, 50);
    const statusGroups = await Promise.all(
      projectIds.map(async (projectId) => ({
        projectId,
        statuses: (
          await this.request(
            account,
            `/api/v2/projects/${encodeURIComponent(projectId)}/statuses`,
          )
        ).map((status) => ({
          value: String(status.id),
          label: String(status.name),
        })),
      })),
    );
    return { ...connection, statusGroups };
  }

  async fetchItems(account) {
    const projectIds = Array.isArray(account.filters?.projectIds)
      ? account.filters.projectIds.map(String)
      : [];
    const statusIds = Array.isArray(account.filters?.statusIds)
      ? account.filters.statusIds.map(String)
      : [];
    const items = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const page = await this.request(account, "/api/v2/issues", {
        "projectId[]": projectIds,
        "statusId[]": statusIds,
        "assigneeId[]": [account.externalUserId],
        updatedSince: account.lastCursor
          ? String(account.lastCursor).slice(0, 10)
          : undefined,
        sort: "updated",
        order: "desc",
        offset,
        count: 100,
      });
      for (const issue of page) {
        items.push({
          externalObjectId: String(issue.id),
          externalKey: String(issue.issueKey),
          title: String(issue.summary ?? issue.issueKey),
          description: String(issue.description ?? ""),
          externalStatus: String(issue.status?.name ?? ""),
          terminal: isExternalTaskTerminalStatus(
            "BACKLOG",
            issue.status?.name,
          ),
          externalAssignee: String(issue.assignee?.name ?? ""),
          externalUrl: new URL(
            `/view/${encodeURIComponent(issue.issueKey)}`,
            account.baseUrl,
          ).href,
          externalCreatedAt: issue.created ?? null,
          externalUpdatedAt: issue.updated ?? null,
          sourceData: {
            projectId: issue.projectId,
            statusId: issue.status?.id ?? null,
            priority: issue.priority?.name ?? "",
            dueDate: issue.dueDate ?? null,
          },
        });
      }
      if (page.length < 100) break;
      await wait(1_000);
    }
    const cursor = items
      .map((item) => item.externalUpdatedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    return { items, cursor: cursor ?? account.lastCursor ?? null };
  }
}

export class InquiryTaskConnector {
  constructor({ sourceClient }) {
    this.sourceClient = sourceClient;
  }

  settings(account) {
    return {
      id: account.id,
      revision: account.revision,
      baseUrl: requiredUrl(account.baseUrl, "INQUIRY"),
      username: account.systemUsername,
      password: account.credential,
    };
  }

  async testConnection(account) {
    const options = await this.sourceClient.options(this.settings(account));
    return {
      identity: {
        id: account.externalUsername,
        name: account.externalUsername,
      },
      ...options,
      statuses: inquiryStatusOptions,
    };
  }

  async options(account) {
    return this.testConnection(account);
  }

  async fetchItems(account, { forceFull = false } = {}) {
    const options = await this.sourceClient.options(this.settings(account));
    const selected = options.assignees.find(
      (item) => String(item.value) === String(account.externalUserId),
    );
    if (!selected) throw conditionError("INQUIRY_ASSIGNEE_MAPPING_INVALID", "The mapped inquiry assignee is no longer available.");
    const filters = {
      status: String(account.filters?.status ?? "open"),
      assignee: selected.value, assigneeName: "", unassignedOnly: false,
      customer: String(account.filters?.customer ?? ""),
      customerName: "",
      customerCode: "",
      subStatus: String(account.filters?.subStatus ?? ""), category: String(account.filters?.category ?? ""), classificationResult: String(account.filters?.classificationResult ?? ""),
      content: String(account.filters?.keyword ?? ""), keywordOperator: "AND", includeRelatedRecords: true,
      createdFrom: String(account.filters?.createdFrom ?? ""), createdTo: String(account.filters?.createdTo ?? ""),
      requestedReplyFrom: String(account.filters?.requestedReplyFrom ?? ""), requestedReplyTo: String(account.filters?.requestedReplyTo ?? ""),
      updatedFrom: !forceFull && account.lastCursor ? String(account.lastCursor).slice(0, 10) : "", updatedTo: String(account.filters?.updatedTo ?? ""),
    };
    const result = await this.sourceClient.search(
      this.settings(account),
      filters,
    );
    if (result.sourceTruncated) throw conditionError("INQUIRY_CANDIDATE_RESULT_TRUNCATED", "The inquiry candidate result exceeded the external display limit.", { actualCount: result.actualCount, displayedCount: result.displayedCount });
    const requested = inquiryStatusOptions.find((item) => item.value === filters.status);
    const statusMismatch = result.tickets.find((ticket) => { if (!requested || requested.value === "all") return false; const actual = normalizedInquiryStatus(ticket.status); if (requested.value === "open") return !actual.startsWith("OPEN"); if (requested.value === "close") return !actual.startsWith("CLOSED"); return !actual.includes(normalizedInquiryStatus(requested.label)); });
    if (statusMismatch) throw conditionError("INQUIRY_CANDIDATE_STATUS_MISMATCH", "The inquiry candidate result did not match the requested status.", { ticketNo: statusMismatch.ticketNo });
    const assigneeMismatch = result.tickets.find((ticket) => normalizedPersonName(ticket.assignee) !== normalizedPersonName(selected.label));
    if (assigneeMismatch) throw conditionError("INQUIRY_CANDIDATE_ASSIGNEE_MISMATCH", "The inquiry candidate result did not match the requested assignee.", { ticketNo: assigneeMismatch.ticketNo });
    const items = result.tickets.map((ticket) => ({
      externalObjectId: ticket.ticketNo,
      externalKey: ticket.ticketNo,
      title: ticket.title || `No. ${ticket.ticketNo}`,
      description: "",
      externalStatus: ticket.status,
      terminal: isExternalTaskTerminalStatus("INQUIRY", ticket.status),
      externalAssignee: ticket.assignee ?? "",
      externalUrl: new URL(
        `/sssite/upds/helpdesk/${encodeURIComponent(ticket.ticketNo)}/`,
        account.baseUrl,
      ).href,
      externalCreatedAt: ticket.createdAt || null,
      externalUpdatedAt: ticket.updatedAt || null,
      sourceData: {
        customer: ticket.customer ?? "",
        requestedReplyAt: ticket.requestedReplyAt ?? null,
      },
    }));
    const cursor = items
      .map((item) => item.externalUpdatedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    return { items, cursor: cursor ?? account.lastCursor ?? null };
  }
}

export function createPersonalTaskConnectorRegistry({
  sourceClient,
  fetchImpl = fetch,
}) {
  const connectors = new Map([
    ["BACKLOG", new BacklogTaskConnector({ fetchImpl })],
    ["INQUIRY", new InquiryTaskConnector({ sourceClient })],
  ]);
  return {
    get(providerCode) {
      const connector = connectors.get(String(providerCode));
      if (!connector) {
        const error = new Error("Personal task provider is not supported.");
        error.code = "PERSONAL_TASK_PROVIDER_NOT_SUPPORTED";
        error.statusCode = 400;
        throw error;
      }
      return connector;
    },
    safeError,
  };
}

export function createPersonalTaskSyncService({
  repository,
  connectorRegistry,
  logger,
}) {
  async function sync(profile) {
    try {
      const connector = connectorRegistry.get(profile.providerCode);
      const fetched = await connector.fetchItems(profile);
      const counts = await repository.upsertCandidates(
        profile.ownerUserId,
        profile.id,
        profile.externalSystemId,
        fetched.items,
      );
      await repository.finishProfileSync(profile.id, {
        status: "SUCCESS",
        cursor: fetched.cursor,
      });
      return { fetchedCount: fetched.items.length, ...counts };
    } catch (error) {
      const safe = connectorRegistry.safeError(
        error,
        "PERSONAL_TASK_SYNC_FAILED",
      );
      await logger?.("warn", "personal task sync failed", {
        userExternalProfileId: profile.id,
        code: safe.code,
      });
      await repository.finishProfileSync(profile.id, {
        status: "FAILED",
        errorCode: safe.code,
        errorMessage: safe.message,
      });
      error.code = safe.code;
      error.message = safe.message;
      throw error;
    }
  }

  return {
    sync,
    async syncDueAccounts() {
      const profiles = await repository.listDueProfiles();
      for (const profile of profiles) {
        try {
          await sync(profile);
        } catch {
          // 失敗内容は同期履歴と Gateway ログへ記録済みです。
        }
      }
    },
  };
}
