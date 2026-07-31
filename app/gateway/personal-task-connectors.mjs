const backlogHostPattern =
  /(^|\.)backlog\.(com|jp)$|(^|\.)backlogtool\.com$/i;

function text(value) {
  return String(value ?? "").trim();
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
      filters:
        input?.filters && typeof input.filters === "object"
          ? input.filters
          : {},
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
      const error = new Error(
        `Backlog returned status ${response.status}.`,
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
    const me = await this.request(account, "/api/v2/users/myself");
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
        "assigneeId[]": [me.id],
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
          externalAssignee: String(issue.assignee?.name ?? ""),
          externalUrl: new URL(
            `/view/${encodeURIComponent(issue.issueKey)}`,
            account.baseUrl,
          ).href,
          externalCreatedAt: issue.created ?? null,
          externalUpdatedAt: issue.updated ?? null,
          sourceData: {
            projectId: issue.projectId,
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
      username: account.externalUsername,
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
      assignees: options.assignees,
      statuses: [
        { value: "all", label: "すべて" },
        { value: "open", label: "未完了" },
        { value: "closed", label: "完了" },
      ],
    };
  }

  async options(account) {
    return this.testConnection(account);
  }

  async fetchItems(account) {
    const filters = {
      status: String(account.filters?.status ?? "open"),
      assignee: String(account.filters?.assignee ?? ""),
      assigneeName: String(
        account.filters?.assigneeName ?? account.externalUsername,
      ),
      unassignedOnly: false,
      customer: "",
      customerName: "",
      customerCode: "",
      subStatus: "",
      category: "",
      classificationResult: "",
      keyword: String(account.filters?.keyword ?? ""),
      createdFrom: "",
      createdTo: "",
      requestedFrom: "",
      requestedTo: "",
      modifiedFrom: account.lastCursor
        ? String(account.lastCursor).slice(0, 10)
        : "",
      modifiedTo: "",
    };
    const result = await this.sourceClient.search(
      this.settings(account),
      filters,
    );
    const items = result.tickets.map((ticket) => ({
      externalObjectId: ticket.ticketNo,
      externalKey: ticket.ticketNo,
      title: ticket.title || `No. ${ticket.ticketNo}`,
      description: "",
      externalStatus: ticket.status,
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
  async function sync(ownerUserId, accountId, triggerType = "MANUAL") {
    const handle = await repository.beginSync(
      ownerUserId,
      accountId,
      triggerType,
    );
    if (!handle) {
      const error = new Error("External account sync is already running.");
      error.code = "PERSONAL_TASK_SYNC_ALREADY_RUNNING";
      error.statusCode = 409;
      throw error;
    }
    handle.run.ownerUserId = ownerUserId;
    handle.run.externalAccountId = accountId;
    try {
      const account = await repository.getAccount(
        ownerUserId,
        accountId,
        true,
      );
      if (!account) {
        const error = new Error("External account was not found.");
        error.code = "PERSONAL_TASK_ACCOUNT_NOT_FOUND";
        error.statusCode = 404;
        throw error;
      }
      const connector = connectorRegistry.get(account.providerCode);
      const fetched = await connector.fetchItems({
        ...account,
        lastCursor: account.lastCursor,
      });
      const counts = await repository.upsertCandidates(
        ownerUserId,
        accountId,
        fetched.items,
      );
      return repository.finishSync(handle, {
        status: "SUCCESS",
        fetchedCount: fetched.items.length,
        ...counts,
        cursor: fetched.cursor,
      });
    } catch (error) {
      const safe = connectorRegistry.safeError(
        error,
        "PERSONAL_TASK_SYNC_FAILED",
      );
      await logger?.("warn", "personal task sync failed", {
        accountId,
        code: safe.code,
      });
      const run = await repository.finishSync(handle, {
        status: "FAILED",
        errorCode: safe.code,
        errorMessage: safe.message,
      });
      error.code = safe.code;
      error.message = safe.message;
      error.syncRun = run;
      throw error;
    }
  }

  return {
    sync,
    async syncDueAccounts() {
      const accounts = await repository.listDueAccounts();
      for (const account of accounts) {
        try {
          await sync(
            account.ownerUserId,
            account.accountId,
            "SCHEDULED",
          );
        } catch {
          // 失敗内容は同期履歴と Gateway ログへ記録済みです。
        }
      }
    },
  };
}
