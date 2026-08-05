const backlogHostPattern =
  /(^|\.)backlog\.(com|jp)$|(^|\.)backlogtool\.com$/i;

const supportedCustomerFieldTypes = new Set([1, 2, 5, 6]);

function normalizeIssue(issue, baseUrl) {
  return {
    id: String(issue.id),
    issueKey: String(issue.issueKey ?? ""),
    summary: String(issue.summary ?? ""),
    projectId: String(issue.projectId ?? ""),
    status: String(issue.status?.name ?? ""),
    assignee: String(issue.assignee?.name ?? ""),
    priority: String(issue.priority?.name ?? ""),
    dueDate: issue.dueDate ?? null,
    updatedAt: issue.updated ?? null,
    url: new URL(
      `/view/${encodeURIComponent(String(issue.issueKey ?? ""))}`,
      baseUrl,
    ).href,
  };
}

function normalizedValue(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/\s+/g, "")
    .trim();
}

function customerValues(customer, valueSource) {
  const values = [];
  const add = (value) => {
    const normalized = String(value ?? "").trim();
    if (normalized && !values.includes(normalized)) values.push(normalized);
  };
  if (valueSource === "CODE") add(customer?.code);
  if (valueSource === "NAME") add(customer?.name);
  if (valueSource === "SHORT_NAME") add(customer?.shortName);
  if (valueSource === "AUTO") {
    add(customer?.code);
    add(customer?.name);
    add(customer?.shortName);
    if (customer?.code && customer?.name) {
      add(`【${customer.code}】${customer.name}`);
    }
  }
  return values;
}

function matchesOption(option, values, customer) {
  const optionName = normalizedValue(option?.name);
  if (!optionName) return false;
  if (values.some((value) => normalizedValue(value) === optionName)) {
    return true;
  }
  const code = normalizedValue(customer?.code);
  return Boolean(code && optionName.startsWith(`【${code}】`));
}

function compareIssueText(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function compareIssueDate(left, right) {
  const leftTime = Date.parse(String(left ?? ""));
  const rightTime = Date.parse(String(right ?? ""));
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime;
  }
  if (Number.isFinite(leftTime)) return 1;
  if (Number.isFinite(rightTime)) return -1;
  return compareIssueText(left, right);
}

const backlogIssueSortFields = new Set([
  "issueKey",
  "summary",
  "projectId",
  "status",
  "assignee",
  "priority",
  "dueDate",
  "updatedAt",
]);

function normalizeBacklogIssueSortField(value) {
  return backlogIssueSortFields.has(value) ? value : "summary";
}

function compareIssueField(left, right, sortField, projectNames) {
  if (sortField === "dueDate" || sortField === "updatedAt") {
    return compareIssueDate(left[sortField], right[sortField]);
  }
  const leftValue = sortField === "projectId"
    ? projectNames.get(left.projectId) ?? left.projectId
    : left[sortField];
  const rightValue = sortField === "projectId"
    ? projectNames.get(right.projectId) ?? right.projectId
    : right[sortField];
  return compareIssueText(leftValue, rightValue);
}

function text(value) {
  return String(value ?? "").trim();
}

function backlogUrl(value, required) {
  const candidate = text(value);
  if (!candidate && !required) return null;
  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !backlogHostPattern.test(url.hostname)
    ) {
      throw new Error("invalid Backlog URL");
    }
    return url;
  } catch {
    return null;
  }
}

export function validateBacklogSourceSettings(input) {
  const errors = {};
  const baseUrl = backlogUrl(input?.baseUrl, true);
  const apiUrl = backlogUrl(input?.apiUrl, false);
  const username = text(input?.username);
  const password = String(input?.password ?? "");
  const apiKey = String(input?.apiKey ?? "").trim();

  if (!baseUrl) {
    errors.baseUrl = "Backlog login URL must be an allowed HTTPS URL.";
  }
  if (text(input?.apiUrl) && !apiUrl) {
    errors.apiUrl = "Backlog API URL must be an allowed HTTPS URL.";
  }
  if (baseUrl && apiUrl && baseUrl.origin !== apiUrl.origin) {
    errors.apiUrl = "Backlog API URL must use the login URL origin.";
  }
  if (!username || username.length > 255) {
    errors.username = "Backlog username is required.";
  }
  if (!password || password.length > 8192) {
    errors.password = "Backlog password is required.";
  }
  if (apiKey.length > 8192) {
    errors.apiKey = "Backlog API Key is too long.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      baseUrl: baseUrl ? `${baseUrl.origin}/` : "",
      apiUrl: apiUrl
        ? apiUrl.toString().replace(/\/+$/, "")
        : "",
      username,
      password,
      apiKey,
      enabled: input?.enabled === true,
    },
  };
}

function apiRoot(settings) {
  const configured = text(settings.apiUrl);
  if (configured) {
    return configured.endsWith("/api/v2")
      ? `${configured}/`
      : `${configured.replace(/\/+$/, "")}/`;
  }
  return new URL("/api/v2/", settings.baseUrl).toString();
}

function connectionError(code, message, statusCode = null) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export class BacklogSystemSourceClient {
  constructor({ fetchImpl = fetch, timeoutMs = 20_000 } = {}) {
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async apiRequest(settings, pathname, query = {}) {
    if (!settings.apiKey) {
      throw connectionError(
        "BACKLOG_API_KEY_REQUIRED",
        "Backlog API Key is required.",
      );
    }
    const url = new URL(pathname, apiRoot(settings));
    for (const [key, value] of Object.entries(query)) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item !== null && item !== undefined && item !== "") {
          url.searchParams.append(key, String(item));
        }
      }
    }
    url.searchParams.set("apiKey", settings.apiKey);
    const response = await this.fetchImpl(url, {
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      throw connectionError(
        response.status === 401
          ? "BACKLOG_AUTHENTICATION_FAILED"
          : response.status === 403
            ? "BACKLOG_ACCESS_DENIED"
            : response.status === 429
              ? "BACKLOG_RATE_LIMITED"
              : "BACKLOG_REQUEST_FAILED",
        `Backlog API returned status ${response.status}.`,
        response.status,
      );
    }
    return { data: await response.json(), statusCode: response.status };
  }

  async testConnection(settings) {
    const startedAt = performance.now();
    if (settings.apiKey) {
      const { data: user, statusCode } = await this.apiRequest(
        settings,
        "users/myself",
      );
      return {
        success: true,
        mode: "API",
        authenticated: true,
        identityName: text(user?.name || user?.userId),
        statusCode,
        latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
        testedAt: new Date().toISOString(),
      };
    }

    const response = await this.fetchImpl(settings.baseUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        Authorization: `Basic ${Buffer.from(
          `${settings.username}:${settings.password}`,
          "utf8",
        ).toString("base64")}`,
      },
      redirect: "manual",
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (response.status === 401 || response.status === 403) {
      throw connectionError(
        response.status === 401
          ? "BACKLOG_AUTHENTICATION_FAILED"
          : "BACKLOG_ACCESS_DENIED",
        `Backlog login URL returned status ${response.status}.`,
        response.status,
      );
    }
    if (response.status < 200 || response.status >= 400) {
      throw connectionError(
        "BACKLOG_REQUEST_FAILED",
        `Backlog login URL returned status ${response.status}.`,
        response.status,
      );
    }
    return {
      success: true,
      mode: "LOGIN_PAGE",
      authenticated: false,
      identityName: "",
      statusCode: response.status,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      testedAt: new Date().toISOString(),
    };
  }

  async listProjects(settings) {
    const { data } = await this.apiRequest(settings, "projects");
    return (Array.isArray(data) ? data : []).map((project) => ({
      externalProjectId: String(project.id),
      projectKey: String(project.projectKey ?? ""),
      projectName: String(project.name ?? project.projectKey ?? ""),
    }));
  }

  async listCustomFields(settings, projectId) {
    const { data } = await this.apiRequest(
      settings,
      `projects/${encodeURIComponent(String(projectId))}/customFields`,
    );
    return (Array.isArray(data) ? data : []).map((field) => ({
      id: String(field.id),
      name: String(field.name ?? ""),
      typeId: Number(field.typeId),
      items: (Array.isArray(field.items) ? field.items : []).map((item) => ({
        id: String(item.id),
        name: String(item.name ?? ""),
        displayOrder: Number(item.displayOrder ?? 0),
      })),
    }));
  }

  async listIssues(settings, { projectIds, offset, count }) {
    const query = {
      "projectId[]": projectIds,
      sort: "updated",
      order: "desc",
      offset,
      count,
    };
    const [{ data: issues }, { data: countPayload }] = await Promise.all([
      this.apiRequest(settings, "issues", query),
      this.apiRequest(settings, "issues/count", {
        "projectId[]": projectIds,
      }),
    ]);
    return {
      total: Number(countPayload?.count ?? 0),
      issues: (Array.isArray(issues) ? issues : []).map((issue) =>
        normalizeIssue(issue, settings.baseUrl)),
    };
  }

  async listIssuesByTemplates(
    settings,
    {
      templates,
      customer,
      offset,
      count,
      sortField = "summary",
      sortOrder = "asc",
    },
  ) {
    const uniqueIssues = new Map();
    const projects = new Map();
    const enabledTemplates = (Array.isArray(templates) ? templates : [])
      .filter((template) => template?.enabled !== false);

    for (const template of enabledTemplates) {
      const projectId = String(template.projectId ?? "");
      if (!projectId) continue;
      projects.set(projectId, {
        externalProjectId: projectId,
        projectKey: String(template.projectKey ?? ""),
        projectName: String(template.projectName ?? ""),
      });

      const baseQuery = {
        "projectId[]": [projectId],
        sort: "updated",
        order: "desc",
      };
      let rawIssues = [];
      if (template.matchMode === "TITLE_CONTAINS") {
        rawIssues = await this.fetchAllIssues(settings, baseQuery);
        const values = customerValues(customer, template.valueSource);
        const normalizedValues = values.map(normalizedValue).filter(Boolean);
        rawIssues = rawIssues.filter((issue) => {
          const summary = normalizedValue(issue.summary);
          return normalizedValues.some((value) => summary.includes(value));
        });
      } else {
        const fields = await this.listCustomFields(settings, projectId);
        const field = fields.find(
          (candidate) => String(candidate.id) === String(template.fieldId),
        );
        if (!field) {
          throw connectionError(
            "BACKLOG_TEMPLATE_FIELD_NOT_FOUND",
            `Backlog template field ${template.fieldId} was not found.`,
          );
        }
        if (!supportedCustomerFieldTypes.has(field.typeId)) {
          throw connectionError(
            "BACKLOG_TEMPLATE_FIELD_UNSUPPORTED",
            `Backlog template field ${field.name} does not support customer matching.`,
          );
        }
        const values = customerValues(customer, template.valueSource);
        const queries = [];
        if ([5, 6].includes(field.typeId)) {
          const optionIds = field.items
            .filter((item) => matchesOption(item, values, customer))
            .map((item) => item.id);
          for (const optionId of optionIds) {
            queries.push({
              ...baseQuery,
              [`customField_${field.id}[]`]: [optionId],
            });
          }
        } else {
          for (const value of values) {
            queries.push({
              ...baseQuery,
              [`customField_${field.id}`]: value,
            });
          }
        }
        const matchingIssues = [];
        for (const query of queries) {
          matchingIssues.push(...await this.fetchAllIssues(settings, query));
        }
        rawIssues = matchingIssues;
      }

      for (const issue of rawIssues) {
        const normalized = normalizeIssue(issue, settings.baseUrl);
        uniqueIssues.set(normalized.id, normalized);
      }
    }

    const normalizedSortField = normalizeBacklogIssueSortField(sortField);
    const direction = sortOrder === "desc" ? -1 : 1;
    const projectNames = new Map(
      [...projects.values()].map((project) => [
        project.externalProjectId,
        project.projectName,
      ]),
    );
    const allIssues = [...uniqueIssues.values()].sort((left, right) =>
      direction * compareIssueField(
        left,
        right,
        normalizedSortField,
        projectNames,
      ) ||
      compareIssueText(left.issueKey, right.issueKey),
    );
    return {
      total: allIssues.length,
      projects: [...projects.values()],
      issues: allIssues.slice(offset, offset + count),
    };
  }

  async fetchAllIssues(settings, query) {
    const issues = [];
    let offset = 0;
    const pageSize = 100;
    while (true) {
      const { data } = await this.apiRequest(settings, "issues", {
        ...query,
        offset,
        count: pageSize,
      });
      const page = Array.isArray(data) ? data : [];
      issues.push(...page);
      if (page.length < pageSize) break;
      offset += page.length;
      if (issues.length >= 10_000) {
        throw connectionError(
          "BACKLOG_TEMPLATE_RESULT_LIMIT_EXCEEDED",
          "Backlog template result limit exceeded.",
        );
      }
    }
    return issues;
  }
}
