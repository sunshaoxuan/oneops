const defaultEndpoint = "https://api.openai.com/v1";
const supportedProvider = "OPENAI";
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

export function emptyModelSettings() {
  return {
    id: null,
    provider: supportedProvider,
    endpoint: defaultEndpoint,
    model: "",
    apiKeyConfigured: false,
    updatedAt: null,
    updatedBy: "",
  };
}

export function validateModelSettings(input, { requireApiKey = false } = {}) {
  const provider = String(input?.provider ?? "").trim().toUpperCase();
  const endpoint = normalizeEndpoint(input?.endpoint);
  const model = String(input?.model ?? "").trim();
  const apiKey = String(input?.apiKey ?? "").trim();
  const errors = {};

  if (provider !== supportedProvider) {
    errors.provider = "MODEL_PROVIDER_UNSUPPORTED";
  }
  if (!endpoint || endpoint.length > 2048) {
    errors.endpoint = "MODEL_ENDPOINT_INVALID";
  }
  if (!model || model.length > 255) {
    errors.model = "MODEL_NAME_INVALID";
  }
  if ((requireApiKey && !apiKey) || apiKey.length > 8192) {
    errors.apiKey = "MODEL_API_KEY_INVALID";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    settings: {
      provider,
      endpoint,
      model,
      apiKey,
    },
  };
}

async function readLimitedJson(response) {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > maximumResponseBytes) {
    throw Object.assign(new Error("The model list response is too large."), {
      code: "MODEL_RESPONSE_TOO_LARGE",
    });
  }
  if (!response.body) {
    throw Object.assign(new Error("The model list response is empty."), {
      code: "MODEL_RESPONSE_INVALID",
    });
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    const buffer = Buffer.from(chunk);
    length += buffer.length;
    if (length > maximumResponseBytes) {
      throw Object.assign(new Error("The model list response is too large."), {
        code: "MODEL_RESPONSE_TOO_LARGE",
      });
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("The model list response is invalid."), {
      code: "MODEL_RESPONSE_INVALID",
    });
  }
}

function upstreamFailure(status, latencyMs) {
  const codes = {
    401: "MODEL_AUTHENTICATION_FAILED",
    403: "MODEL_ACCESS_DENIED",
    404: "MODEL_ENDPOINT_NOT_FOUND",
    429: "MODEL_RATE_LIMITED",
  };
  return {
    success: false,
    code: codes[status] ?? "MODEL_UPSTREAM_HTTP_ERROR",
    statusCode: status,
    latencyMs,
    modelAvailable: false,
    modelsCount: 0,
    testedAt: new Date().toISOString(),
  };
}

export async function testOpenAIConnection(
  settings,
  { fetchImpl = fetch, timeoutMs = 10_000 } = {},
) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${settings.endpoint}/models`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      redirect: "error",
      signal: controller.signal,
    });
    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));
    if (!response.ok) {
      return upstreamFailure(response.status, latencyMs);
    }
    const payload = await readLimitedJson(response);
    const modelIds = Array.isArray(payload?.data)
      ? payload.data
        .map((item) => String(item?.id ?? "").trim())
        .filter(Boolean)
      : [];
    if (!Array.isArray(payload?.data)) {
      return {
        success: false,
        code: "MODEL_RESPONSE_INVALID",
        statusCode: response.status,
        latencyMs,
        modelAvailable: false,
        modelsCount: 0,
        testedAt: new Date().toISOString(),
      };
    }
    const modelAvailable = modelIds.includes(settings.model);
    return {
      success: modelAvailable,
      code: modelAvailable
        ? "MODEL_CONNECTION_SUCCEEDED"
        : "MODEL_NOT_AVAILABLE",
      statusCode: response.status,
      latencyMs,
      modelAvailable,
      modelsCount: modelIds.length,
      testedAt: new Date().toISOString(),
    };
  } catch (error) {
    const timedOut =
      controller.signal.aborted ||
      error?.name === "AbortError" ||
      error?.name === "TimeoutError";
    return {
      success: false,
      code: timedOut ? "MODEL_CONNECTION_TIMEOUT" : error?.code ??
        "MODEL_CONNECTION_FAILED",
      statusCode: null,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      modelAvailable: false,
      modelsCount: 0,
      testedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}
