import {
  agentGatewayEndpoints,
  agentGatewayHeaders,
} from "./agent-gateway-settings.mjs";

const maximumResponseBytes = 4 * 1024 * 1024;
const transientStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
const terminalErrorCodes = new Set([
  "AGENT_GATEWAY_CONTRACT_INVALID",
  "AGENT_GATEWAY_RESPONSE_TOO_LARGE",
]);
const circuits = new Map();

function requestSignal(callerSignal, timeoutMilliseconds = 30_000) {
  const timeoutSignal = AbortSignal.timeout(timeoutMilliseconds);
  return callerSignal
    ? AbortSignal.any([callerSignal, timeoutSignal])
    : timeoutSignal;
}

function callerAborted(options) {
  return Boolean(options.signal?.aborted);
}

function circuit(endpoint, now) {
  const current = circuits.get(endpoint) ?? { failures: 0, openUntil: 0 };
  if (current.openUntil && current.openUntil <= now) {
    return { failures: 0, openUntil: 0 };
  }
  return current;
}

function recordSuccess(endpoint) {
  circuits.delete(endpoint);
}

function recordFailure(endpoint, now, threshold, openMilliseconds) {
  const current = circuit(endpoint, now);
  const failures = current.failures + 1;
  circuits.set(endpoint, {
    failures,
    openUntil: failures >= threshold ? now + openMilliseconds : 0,
  });
}

async function responseBytes(response) {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > maximumResponseBytes) {
    throw Object.assign(new Error("Agent Gateway response is too large."), {
      code: "AGENT_GATEWAY_RESPONSE_TOO_LARGE",
    });
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > maximumResponseBytes) {
    throw Object.assign(new Error("Agent Gateway response is too large."), {
      code: "AGENT_GATEWAY_RESPONSE_TOO_LARGE",
    });
  }
  return bytes;
}

function upstreamError(status, bytes) {
  const contractInvalid = status === 400 || status === 422;
  return Object.assign(
    new Error(
      `Agent Gateway returned ${status}: ${bytes.toString("utf8").slice(0, 500)}`,
    ),
    {
      code: contractInvalid
        ? "AGENT_GATEWAY_CONTRACT_INVALID"
        : "AGENT_GATEWAY_REQUEST_FAILED",
      statusCode: contractInvalid ? 502 : status,
      upstreamStatusCode: status,
    },
  );
}

export async function requestAgentGatewayJson(
  gateway,
  path,
  options = {},
  {
    fetchImpl = fetch,
    sleep = (milliseconds) => new Promise((resolve) =>
      setTimeout(resolve, milliseconds)
    ),
    now = () => Date.now(),
    random = Math.random,
    attemptsPerEndpoint = 2,
    circuitFailureThreshold = 3,
    circuitOpenMilliseconds = 30_000,
  } = {},
) {
  const method = String(options.method ?? "GET").toUpperCase();
  const idempotencyKey = options.headers?.["Idempotency-Key"];
  const retryable = ["GET", "HEAD"].includes(method) || Boolean(idempotencyKey);
  let lastError = null;
  let attempted = false;

  for (const endpoint of agentGatewayEndpoints(gateway)) {
    const state = circuit(endpoint, now());
    if (state.openUntil > now()) continue;
    const attempts = retryable ? attemptsPerEndpoint : 1;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      attempted = true;
      try {
        const response = await fetchImpl(`${endpoint}${path}`, {
          ...options,
          headers: {
            ...agentGatewayHeaders(gateway.accessToken),
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers ?? {}),
          },
          redirect: "error",
          signal: requestSignal(options.signal),
        });
        const bytes = await responseBytes(response);
        if (response.ok) {
          recordSuccess(endpoint);
          return bytes.length ? JSON.parse(bytes.toString("utf8")) : {};
        }
        const error = upstreamError(response.status, bytes);
        if (!retryable || !transientStatuses.has(response.status)) throw error;
        lastError = error;
        recordFailure(
          endpoint,
          now(),
          circuitFailureThreshold,
          circuitOpenMilliseconds,
        );
      } catch (error) {
        if (
          !retryable ||
          callerAborted(options) ||
          terminalErrorCodes.has(error?.code) ||
          (error?.upstreamStatusCode &&
            !transientStatuses.has(error.upstreamStatusCode))
        ) {
          throw error;
        }
        lastError = error;
        recordFailure(
          endpoint,
          now(),
          circuitFailureThreshold,
          circuitOpenMilliseconds,
        );
      }
      if (attempt < attempts) {
        await sleep(Math.round(100 * (2 ** (attempt - 1)) + random() * 50));
      }
    }
  }

  if (!attempted) {
    throw Object.assign(new Error("All Agent Gateway circuits are open."), {
      code: "AGENT_GATEWAY_CIRCUIT_OPEN",
      statusCode: 503,
    });
  }
  throw Object.assign(
    new Error(lastError?.message ?? "Agent Gateway is unavailable."),
    {
      code: lastError?.code ?? "AGENT_GATEWAY_UNAVAILABLE",
      statusCode: lastError?.statusCode ?? 503,
    },
  );
}

export async function requestAgentGatewayStream(
  gateway,
  path,
  options = {},
  { fetchImpl = fetch, now = () => Date.now() } = {},
) {
  let lastError = null;
  for (const endpoint of agentGatewayEndpoints(gateway)) {
    if (circuit(endpoint, now()).openUntil > now()) continue;
    try {
      const response = await fetchImpl(`${endpoint}${path}`, {
        ...options,
        headers: {
          ...agentGatewayHeaders(gateway.accessToken, "text/event-stream"),
          ...(options.headers ?? {}),
        },
        redirect: "error",
        signal: requestSignal(options.signal),
      });
      if (response.ok) {
        recordSuccess(endpoint);
        return response;
      }
      const bytes = await responseBytes(response);
      const error = upstreamError(response.status, bytes);
      if (!transientStatuses.has(response.status)) throw error;
      lastError = error;
      recordFailure(endpoint, now(), 3, 30_000);
    } catch (error) {
      if (
        callerAborted(options) ||
        terminalErrorCodes.has(error?.code) ||
        (error?.upstreamStatusCode &&
          !transientStatuses.has(error.upstreamStatusCode))
      ) {
        throw error;
      }
      lastError = error;
      recordFailure(endpoint, now(), 3, 30_000);
    }
  }
  if (!lastError) {
    throw Object.assign(new Error("All Agent Gateway circuits are open."), {
      code: "AGENT_GATEWAY_CIRCUIT_OPEN",
      statusCode: 503,
    });
  }
  throw Object.assign(
    new Error(lastError?.message ?? "Agent Gateway stream is unavailable."),
    {
      code: lastError?.code ?? "AGENT_GATEWAY_UNAVAILABLE",
      statusCode: lastError?.statusCode ?? 503,
    },
  );
}

export function resetAgentGatewayCircuits() {
  circuits.clear();
}
