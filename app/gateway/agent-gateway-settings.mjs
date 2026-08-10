const maximumResponseBytes = 1024 * 1024;

function normalizeEndpoint(value) {
  const text = String(value ?? "").trim().replace(/\/+$/, "");
  try {
    const endpoint = new URL(text);
    if (
      !["http:", "https:"].includes(endpoint.protocol) ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    ) {
      return "";
    }
    return endpoint.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

export function validateAgentGatewaySettings(input) {
  const id = input?.id ? String(input.id).trim() : null;
  const name = String(input?.name ?? "").trim();
  const endpoint = normalizeEndpoint(input?.endpoint);
  const fallbackEndpoints = Array.isArray(input?.fallbackEndpoints)
    ? input.fallbackEndpoints.map(normalizeEndpoint)
    : [];
  const accessToken = String(input?.accessToken ?? "").trim();
  const enabled = input?.enabled !== false;
  const errors = {};

  if (!name || name.length > 255) {
    errors.name = "AGENT_GATEWAY_NAME_INVALID";
  }
  if (!endpoint || endpoint.length > 2048) {
    errors.endpoint = "AGENT_GATEWAY_ENDPOINT_INVALID";
  }
  if (
    fallbackEndpoints.some((value) => !value || value.length > 2048) ||
    new Set([endpoint, ...fallbackEndpoints]).size !==
      1 + fallbackEndpoints.length ||
    fallbackEndpoints.length > 4
  ) {
    errors.fallbackEndpoints = "AGENT_GATEWAY_FALLBACK_ENDPOINTS_INVALID";
  }
  if (accessToken.length > 8192) {
    errors.accessToken = "AGENT_GATEWAY_TOKEN_INVALID";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    settings: { id, name, endpoint, fallbackEndpoints, accessToken, enabled },
  };
}

async function readLimitedJson(response) {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > maximumResponseBytes) {
    throw Object.assign(new Error("Agent Gateway response is too large."), {
      code: "AGENT_GATEWAY_RESPONSE_TOO_LARGE",
    });
  }
  if (!response.body) {
    throw Object.assign(new Error("Agent Gateway response is empty."), {
      code: "AGENT_GATEWAY_RESPONSE_INVALID",
    });
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    const buffer = Buffer.from(chunk);
    length += buffer.length;
    if (length > maximumResponseBytes) {
      throw Object.assign(new Error("Agent Gateway response is too large."), {
        code: "AGENT_GATEWAY_RESPONSE_TOO_LARGE",
      });
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Agent Gateway response is invalid."), {
      code: "AGENT_GATEWAY_RESPONSE_INVALID",
    });
  }
}

export function agentGatewayHeaders(accessToken, accept = "application/json") {
  return {
    Accept: accept,
    ...(accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {}),
  };
}

export function buildAgentGatewaySseRequest(
  settings,
  upstreamPath,
  {
    afterSequence = "0",
    follow = "true",
    lastEventId = "",
  } = {},
) {
  const query = new URLSearchParams({
    after_sequence: String(afterSequence),
    follow: String(follow),
  });
  return {
    url: `${settings.endpoint}${upstreamPath}?${query}`,
    headers: {
      ...agentGatewayHeaders(settings.accessToken, "text/event-stream"),
      ...(lastEventId ? { "Last-Event-ID": String(lastEventId) } : {}),
    },
  };
}

export function agentGatewayEndpoints(settings) {
  return [settings.endpoint, ...(settings.fallbackEndpoints ?? [])];
}

export async function testAgentGatewayConnection(
  settings,
  { fetchImpl = fetch, timeoutMs = 10_000 } = {},
) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${settings.endpoint}/projects`, {
      method: "GET",
      headers: agentGatewayHeaders(settings.accessToken),
      redirect: "error",
      signal: controller.signal,
    });
    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));
    if (!response.ok) {
      const codes = {
        401: "AGENT_GATEWAY_AUTHENTICATION_FAILED",
        403: "AGENT_GATEWAY_ACCESS_DENIED",
        404: "AGENT_GATEWAY_ENDPOINT_NOT_FOUND",
        429: "AGENT_GATEWAY_RATE_LIMITED",
      };
      return {
        success: false,
        code: codes[response.status] ?? "AGENT_GATEWAY_HTTP_ERROR",
        statusCode: response.status,
        latencyMs,
        projectsCount: 0,
        testedAt: new Date().toISOString(),
      };
    }
    const payload = await readLimitedJson(response);
    const projects = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.projects)
        ? payload.projects
        : null;
    return {
      success: Boolean(projects),
      code: projects
        ? "AGENT_GATEWAY_CONNECTION_SUCCEEDED"
        : "AGENT_GATEWAY_RESPONSE_INVALID",
      statusCode: response.status,
      latencyMs,
      projectsCount: projects?.length ?? 0,
      testedAt: new Date().toISOString(),
    };
  } catch (error) {
    const timedOut =
      controller.signal.aborted ||
      error?.name === "AbortError" ||
      error?.name === "TimeoutError";
    return {
      success: false,
      code: timedOut
        ? "AGENT_GATEWAY_CONNECTION_TIMEOUT"
        : error?.code ?? "AGENT_GATEWAY_CONNECTION_FAILED",
      statusCode: null,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      projectsCount: 0,
      testedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}
