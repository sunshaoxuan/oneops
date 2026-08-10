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

export function emptyModelSettings(purpose = "GENERAL") {
  return {
    id: null,
    purpose,
    displayName: "",
    provider: supportedProvider,
    endpoint: defaultEndpoint,
    model: "",
    apiKey: "",
    apiKeyConfigured: false,
    reasoningEffort: "MEDIUM",
    speedLevel: "MEDIUM",
    enabled: true,
    sortOrder: 100,
    isDefault: purpose === "INQUIRY",
    updatedAt: null,
    updatedBy: "",
  };
}

export function validateModelSettings(input, { requireApiKey = false } = {}) {
  const provider = String(input?.provider ?? "").trim().toUpperCase();
  const purpose = String(input?.purpose ?? "GENERAL").trim().toUpperCase();
  const displayName = String(input?.displayName ?? "").trim();
  const endpoint = normalizeEndpoint(input?.endpoint);
  const model = String(input?.model ?? "").trim();
  const apiKey = String(input?.apiKey ?? "").trim();
  const reasoningEffort = String(input?.reasoningEffort ?? "").trim().toUpperCase();
  const speedLevel = String(input?.speedLevel ?? "").trim().toUpperCase();
  const enabled = input?.enabled;
  const sortOrder = Number(input?.sortOrder);
  const isDefault = input?.isDefault;
  const errors = {};

  if (!["GENERAL", "INQUIRY"].includes(purpose)) {
    errors.purpose = "MODEL_PURPOSE_INVALID";
  }
  if (!displayName || displayName.length > 100) {
    errors.displayName = "MODEL_DISPLAY_NAME_INVALID";
  }
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
  if (!["XHIGH", "HIGH", "MEDIUM"].includes(reasoningEffort)) {
    errors.reasoningEffort = "MODEL_REASONING_EFFORT_INVALID";
  }
  if (!["FAST", "MEDIUM", "SLOW"].includes(speedLevel)) {
    errors.speedLevel = "MODEL_SPEED_LEVEL_INVALID";
  }
  if (typeof enabled !== "boolean") {
    errors.enabled = "MODEL_ENABLED_INVALID";
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    errors.sortOrder = "MODEL_SORT_ORDER_INVALID";
  }
  if (typeof isDefault !== "boolean") {
    errors.isDefault = "MODEL_DEFAULT_INVALID";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    settings: {
      purpose,
      displayName,
      provider,
      endpoint,
      model,
      apiKey,
      reasoningEffort,
      speedLevel,
      enabled,
      sortOrder,
      isDefault: purpose === "INQUIRY" ? true : isDefault,
    },
  };
}

export function validateModelDiscoveryInput(input) {
  const endpoint = normalizeEndpoint(input?.endpoint);
  const apiKey = String(input?.apiKey ?? "").trim();
  const errors = {};
  if (!endpoint || endpoint.length > 2048) {
    errors.endpoint = "MODEL_ENDPOINT_INVALID";
  }
  if (apiKey.length > 8192) {
    errors.apiKey = "MODEL_API_KEY_INVALID";
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    settings: { endpoint, apiKey },
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
    models: [],
    testedAt: new Date().toISOString(),
  };
}

export async function discoverOpenAIModels(
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
        models: [],
        testedAt: new Date().toISOString(),
      };
    }
    return {
      success: true,
      code: "MODEL_DISCOVERY_SUCCEEDED",
      statusCode: response.status,
      latencyMs,
      modelAvailable: false,
      modelsCount: modelIds.length,
      models: [...new Set(modelIds)].sort((left, right) =>
        left.localeCompare(right)),
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
      models: [],
      testedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function testOpenAIConnection(settings, options = {}) {
  const discovery = await discoverOpenAIModels(settings, options);
  if (!discovery.success) {
    return discovery;
  }
  const modelAvailable = discovery.models.includes(settings.model);
  return {
    ...discovery,
    success: modelAvailable,
    code: modelAvailable
      ? "MODEL_CONNECTION_SUCCEEDED"
      : "MODEL_NOT_AVAILABLE",
    modelAvailable,
  };
}
