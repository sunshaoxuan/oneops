const backlogHostPattern =
  /(^|\.)backlog\.(com|jp)$|(^|\.)backlogtool\.com$/i;

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
      issues: (Array.isArray(issues) ? issues : []).map((issue) => ({
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
          settings.baseUrl,
        ).href,
      })),
    };
  }
}
