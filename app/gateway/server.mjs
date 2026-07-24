import { appendFile, mkdir } from "node:fs/promises";
import http from "node:http";
import { Readable } from "node:stream";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAuthController } from "./auth-controller.mjs";
import { hasPermission, requiredPermission } from "./auth.mjs";
import { createOrganizationRepository } from "./database.mjs";
import { createEnvironmentRepository } from "./environment-database.mjs";
import { createIdentityRepository } from "./identity-database.mjs";
import {
  validateEnvironmentGroup,
  validateEnvironmentCredentialInput,
  validateEnvironmentEndpointInput,
  validateEnvironmentInput,
  validateProductInput,
  validateProductVersionInput,
  validateProductVersionModuleInput,
} from "./environment.mjs";
import { buildSnapshot, publicJson } from "./lib.mjs";
import { validateOrganization } from "./organization.mjs";
import { validateOrganizationClassification } from "./organization-classification.mjs";
import { loadXlsxOrganizationSource } from "./organization-source.mjs";
import { loadSystemConfig } from "./system-config.mjs";
import {
  builderRoutePrefix,
  builderWorkerPath,
  createBuilderWorker,
  rewriteBuilderText,
  sendBuilderWorkerResponse,
} from "./builder-worker.mjs";

const gatewayDirectory = dirname(fileURLToPath(import.meta.url));
const portalDirectory = resolve(gatewayDirectory, "..");
const logDirectory = resolve(portalDirectory, "logs");
const logFile = resolve(logDirectory, "gateway.log");
const host = process.env.OPS_GATEWAY_HOST ?? "127.0.0.1";
const port = Number(process.env.OPS_GATEWAY_PORT ?? "8092");
const builderTerminalBaseUrl = (
  process.env.OPS_BUILDER_TERMINAL_URL ?? "http://192.168.250.50:8090"
).replace(/\/$/, "");
const builderDirectory = resolve(portalDirectory, "builder");
const builderDataDirectory = resolve(portalDirectory, "builder-data");
const builderRuntimeDirectory = resolve(
  builderDirectory,
  ".standalone-template",
);
const builderPythonExecutable =
  process.env.OPS_BUILDER_PYTHON ??
  resolve(portalDirectory, "..", "runtime", "python", "python.exe");
const refreshIntervalMs = Number(
  process.env.OPS_REFRESH_INTERVAL_MS ?? "2000",
);
const organizationSourceSyncIntervalMs = Number(
  process.env.OPS_ORGANIZATION_SOURCE_SYNC_INTERVAL_MS ?? "600000",
);
const sessionTtlSeconds = Number(
  process.env.OPS_SESSION_TTL_SECONDS ?? "28800",
);
const allowedSsoDomains = String(
  process.env.OPS_SSO_ALLOWED_DOMAINS ?? "tokyo.scientia.co.jp",
)
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);
const allowedSsoEmailDomains = String(
  process.env.OPS_SSO_ALLOWED_EMAIL_DOMAINS ?? "onehr.jp",
)
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);
const allowedSsoWindowsDomains = String(
  process.env.OPS_SSO_ALLOWED_WINDOWS_DOMAINS ?? "tokyo",
)
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);
function normalizedJsonMap(value, fallback = {}) {
  const parsed = JSON.parse(String(value ?? JSON.stringify(fallback)));
  return Object.fromEntries(
    Object.entries(parsed).map(([key, item]) => [
      String(key).trim().toLowerCase(),
      String(item).trim().toLowerCase(),
    ]),
  );
}
const ssoWindowsUpnSuffixes = normalizedJsonMap(
  process.env.OPS_SSO_WINDOWS_UPN_SUFFIXES,
  { tokyo: "tokyo.scientia.co.jp" },
);
const ssoAccountLinks = normalizedJsonMap(
  process.env.OPS_SSO_ACCOUNT_LINKS,
);
const autoWindowsSso = !["0", "false", "no", "off"].includes(
  String(process.env.OPS_SSO_AUTO_LOGIN ?? "true").trim().toLowerCase(),
);
const databaseUrl = process.env.OPS_DATABASE_URL;
const systemConfig = await loadSystemConfig();

if (!databaseUrl) {
  throw new Error("OPS_DATABASE_URL is required");
}

await mkdir(logDirectory, { recursive: true });
const organizationRepository = createOrganizationRepository(
  databaseUrl,
  (error) => {
    void log("error", "database pool connection interrupted", {
      error: error?.message ?? "Unknown database pool error",
    });
  },
);
const environmentRepository = createEnvironmentRepository(
  databaseUrl,
  (error) => {
    void log("error", "environment database pool connection interrupted", {
      error: error?.message ?? "Unknown database pool error",
    });
  },
);
const identityRepository = createIdentityRepository(
  databaseUrl,
  (error) => {
    void log("error", "identity database pool connection interrupted", {
      error: error?.message ?? "Unknown identity database pool error",
    });
  },
);
const authController = createAuthController({
  repository: identityRepository,
  ssoSharedSecret: process.env.OPS_SSO_SHARED_SECRET ?? "",
  windowsSsoProxyUrl: process.env.OPS_WINDOWS_SSO_PROXY_URL ?? "",
  envPortalSsoUrl: process.env.OPS_ENVPORTAL_SSO_URL ?? "",
  envPortalProfileUrl: process.env.OPS_ENVPORTAL_PROFILE_URL ?? "",
  publicBaseUrl: process.env.OPS_PUBLIC_BASE_URL ?? "",
  sessionTtlSeconds,
  allowedSsoDomains,
  allowedSsoEmailDomains,
  allowedSsoWindowsDomains,
  ssoWindowsUpnSuffixes,
  ssoAccountLinks,
  autoWindowsSso,
});
const builderWorker = createBuilderWorker({
  pythonExecutable: builderPythonExecutable,
  workerPath: resolve(builderDirectory, "oneops_worker.py"),
  cwd: builderDirectory,
  env: {
    HOST_STANDALONE_DATA_DIR: resolve(
      builderDataDirectory,
      "standalone-builds",
    ),
    REMOTE_BUILD_CONSOLE_URL: builderTerminalBaseUrl,
    STANDALONE_OUTPUT_DIR: resolve(builderDataDirectory, "deliveries"),
    STANDALONE_TEMPLATE_ZIP: resolve(
      builderRuntimeDirectory,
      "OneHrStandalone.zip",
    ),
    STANDALONE_MIDDLEWARE_CACHE_DIR: resolve(
      builderRuntimeDirectory,
      "middleware-cache",
    ),
    MIDDLEWARE_ADDONS_DIR: resolve(builderDirectory, "addons"),
    STANDALONE_SQL_TEMPLATE_DIR: resolve(builderRuntimeDirectory, "sql"),
    DATA_SYNC_DIR: resolve(builderRuntimeDirectory, "data-synchronization"),
  },
  log: (message) => {
    void log("error", "integrated builder worker output", {
      message: message.trim().slice(0, 4000),
    });
  },
});
let databaseInitialized = false;
let lastOrganizationSourceSyncAt = 0;
let organizationSourceSyncing = null;

await log("info", "system configuration loaded", {
  organizationDataSources:
    systemConfig.organizationDirectory.dataSources.length,
  organizationDeleteMissing:
    systemConfig.organizationDirectory.synchronization.deleteMissing,
});

async function ensureDatabase() {
  if (!databaseInitialized) {
    await organizationRepository.migrate();
    databaseInitialized = true;
  }
}

async function synchronizeOrganizationSources() {
  const now = Date.now();
  if (
    organizationSourceSyncing ||
    now - lastOrganizationSourceSyncAt < organizationSourceSyncIntervalMs
  ) {
    return organizationSourceSyncing;
  }
  lastOrganizationSourceSyncAt = now;
  organizationSourceSyncing = (async () => {
    for (const source of systemConfig.organizationDirectory.dataSources) {
      if (!source.enabled) {
        continue;
      }
      try {
        const batches = await loadXlsxOrganizationSource(source);
        for (const batch of batches) {
          const summary = await organizationRepository.importSourceRecords(
            source.id,
            batch.records,
          );
          await log("info", "organization data source synchronized", {
            sourceId: source.id,
            file: batch.file,
            sheetName: batch.sheetName,
            records: batch.records.length,
            inserted: summary.inserted,
            reconciled: summary.reconciled,
            supplemented: summary.supplemented,
            unchanged: summary.unchanged,
            conflicts: summary.conflicts.length,
          });
          for (const conflict of summary.conflicts) {
            await log("warn", "organization source conflict requires system message", {
              todo: "SYSTEM_MESSAGE",
              ...conflict,
            });
          }
        }
      } catch (error) {
        await log("warn", "organization data source synchronization skipped", {
          sourceId: source.id,
          error: error?.message ?? "Unknown organization source error",
        });
      }
    }
  })().finally(() => {
    organizationSourceSyncing = null;
  });
  return organizationSourceSyncing;
}

let latestSnapshot = buildSnapshot({
  jobsPayload: { jobs: [] },
  resourcesPayload: {},
  organizationsPayload: [],
  latencyMs: null,
  upstreamError: "Waiting for first refresh",
});
let refreshing = null;
const clients = new Set();

async function log(level, message, details = {}) {
  const entry = `${JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...details,
  })}\n`;
  await appendFile(logFile, entry, "utf8").catch(() => {});
}

async function fetchBuilderJson(path) {
  const result = await builderWorker.request({
    method: "GET",
    path,
    headers: { Accept: "application/json" },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Builder response ${result.status} for ${path}`);
  }
  return JSON.parse(
    Buffer.from(result.bodyBase64 ?? "", "base64").toString("utf8"),
  );
}

async function refreshSnapshot() {
  if (refreshing) {
    return refreshing;
  }
  refreshing = (async () => {
    const startedAt = performance.now();
    const [jobsResult, resourcesResult] = await Promise.allSettled([
      fetchBuilderJson("/api/jobs"),
      fetchBuilderJson("/build-terminal/api/system-resources"),
    ]);
    const failures = [jobsResult, resourcesResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message ?? "Unknown upstream error");

    await ensureDatabase();
    await synchronizeOrganizationSources();
    if (jobsResult.status === "fulfilled") {
      const legacyNames = Array.isArray(jobsResult.value?.jobs)
        ? jobsResult.value.jobs.map(
            (job) =>
              job?.request?.organisation_name ??
              job?.organisation_name ??
              job?.organization,
          )
        : [];
      await organizationRepository.importLegacyNames(legacyNames);
    }
    const organizations = await organizationRepository.list();

    latestSnapshot = buildSnapshot({
      jobsPayload:
        jobsResult.status === "fulfilled"
          ? jobsResult.value
          : { jobs: latestSnapshot.tasks },
      resourcesPayload:
        resourcesResult.status === "fulfilled"
          ? resourcesResult.value
          : latestSnapshot.resources,
      organizationsPayload: organizations,
      latencyMs: Math.round(performance.now() - startedAt),
      upstreamError: failures.length ? failures.join("; ") : null,
    });
    broadcast(latestSnapshot);
    if (failures.length) {
      await log("warn", "compatibility upstream refresh degraded", {
        errors: failures,
      });
    }
    return latestSnapshot;
  })()
    .catch(async (error) => {
      latestSnapshot = {
        ...latestSnapshot,
        generatedAt: new Date().toISOString(),
        upstream: {
          online: false,
          latencyMs: null,
          message: "Dependency refresh failed",
        },
      };
      broadcast(latestSnapshot);
      await log("error", "compatibility dependency refresh failed", {
        error: error?.message ?? "Unknown dependency error",
      });
      return latestSnapshot;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function broadcast(snapshot) {
  const message = `event: snapshot\ndata: ${publicJson(snapshot)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

function sendJson(response, status, value) {
  const body = publicJson(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

const requestBodyCache = new WeakMap();

async function readJsonBody(request) {
  if (!requestBodyCache.has(request)) {
    requestBodyCache.set(
      request,
      (async () => {
        const chunks = [];
        let size = 0;
        for await (const chunk of request) {
          size += chunk.length;
          if (size > 16_384) {
            throw new Error("REQUEST_BODY_TOO_LARGE");
          }
          chunks.push(chunk);
        }
        if (!chunks.length) {
          return {};
        }
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
      })(),
    );
  }
  return requestBodyCache.get(request);
}

async function proxyBuilderTerminal(request, response, url) {
  const suffix = url.pathname.slice(
    `${builderRoutePrefix}/build-terminal`.length,
  ) || "/";
  const target = `${builderTerminalBaseUrl}${suffix}${url.search}`;
  let body;
  if (!["GET", "HEAD"].includes(request.method)) {
    body = Buffer.from(
      JSON.stringify(await readJsonBody(request)),
      "utf8",
    );
  }
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        Accept: request.headers.accept ?? "*/*",
        ...(body
          ? { "Content-Type": request.headers["content-type"] ?? "application/json" }
          : {}),
      },
      body,
      redirect: "manual",
    });
    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";
    const headers = {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    const disposition = upstream.headers.get("content-disposition");
    if (disposition) headers["Content-Disposition"] = disposition;
    if (
      contentType.includes("text/html") ||
      contentType.includes("javascript") ||
      contentType.includes("text/css")
    ) {
      const bodyText = rewriteBuilderText(await upstream.text());
      headers["Content-Length"] = String(Buffer.byteLength(bodyText));
      response.writeHead(upstream.status, headers);
      response.end(bodyText);
      return;
    }
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers["Content-Length"] = contentLength;
    response.writeHead(upstream.status, headers);
    if (upstream.body) {
      Readable.fromWeb(upstream.body).pipe(response);
    } else {
      response.end();
    }
  } catch (error) {
    sendJson(response, 502, {
      error: {
        code: "BUILDER_TERMINAL_UNAVAILABLE",
        message: error?.message ?? "Build terminal is unavailable.",
        details: {},
      },
    });
  }
}

async function handleIntegratedBuilder(request, response, url) {
  if (url.pathname.startsWith(`${builderRoutePrefix}/build-terminal`)) {
    await proxyBuilderTerminal(request, response, url);
    return;
  }
  let body = Buffer.alloc(0);
  if (!["GET", "HEAD", "DELETE"].includes(request.method)) {
    body = Buffer.from(JSON.stringify(await readJsonBody(request)), "utf8");
  }
  const result = await builderWorker.request({
    method: request.method,
    path: builderWorkerPath(url.pathname, url.search),
    headers: {
      Accept: request.headers.accept ?? "*/*",
      "Content-Type": request.headers["content-type"] ?? "application/json",
      "Content-Length": String(body.length),
    },
    body,
  });
  const contentType =
    result.headers?.["Content-Type"] ??
    result.headers?.["content-type"] ??
    "application/octet-stream";
  if (
    !result.filePath &&
    (contentType.includes("text/html") ||
      contentType.includes("javascript") ||
      contentType.includes("text/css"))
  ) {
    const bodyText = rewriteBuilderText(
      Buffer.from(result.bodyBase64 ?? "", "base64").toString("utf8"),
    );
    response.writeHead(result.status ?? 200, {
      ...result.headers,
      "Content-Length": String(Buffer.byteLength(bodyText)),
      "Cache-Control": "no-store",
    });
    response.end(bodyText);
    return;
  }
  sendBuilderWorkerResponse(response, result);
}

function sendOrganizationError(response, error) {
  if (error?.code === "23505") {
    sendJson(response, 409, {
      error: {
        code: "ORGANIZATION_ALREADY_EXISTS",
        message: "An organization with the same Code or Name already exists.",
        details: {},
      },
    });
    return;
  }
  sendJson(response, 500, {
    error: {
      code: "ORGANIZATION_OPERATION_FAILED",
      message: "The organization operation could not be completed.",
      details: {},
    },
  });
}

function sendClassificationError(response, error) {
  if (error?.code === "23505") {
    sendJson(response, 409, {
      error: {
        code: "CLASSIFICATION_ALREADY_EXISTS",
        message:
          "A classification with the same Code or Name already exists.",
        details: {},
      },
    });
    return;
  }
  sendJson(response, 500, {
    error: {
      code: "CLASSIFICATION_OPERATION_FAILED",
      message: "The classification operation could not be completed.",
      details: {},
    },
  });
}

function sendEnvironmentError(response, error) {
  const conflicts = {
    "23505": {
      code: "ENVIRONMENT_ALREADY_EXISTS",
      message: "An active record with the same business key already exists.",
    },
    ENVIRONMENT_GROUP_NOT_EMPTY: {
      code: "ENVIRONMENT_GROUP_NOT_EMPTY",
      message: "Only an empty environment group can be archived.",
    },
    ENVIRONMENT_REVISION_CONFLICT: {
      code: "ENVIRONMENT_REVISION_CONFLICT",
      message: "The environment has been updated. Reload before saving again.",
    },
  };
  if (conflicts[error?.code]) {
    sendJson(response, 409, {
      error: {
        ...conflicts[error.code],
        details: {},
      },
    });
    return;
  }
  const invalidRelations = {
    "23503": "A referenced record could not be found.",
    ENVIRONMENT_GROUP_NOT_FOUND:
      "The environment group does not belong to the selected organization.",
    PRODUCT_VERSION_NOT_FOUND:
      "An active product version could not be found.",
    PRODUCT_VERSION_MODULE_NOT_FOUND:
      "An active module belonging to the selected version could not be found.",
    PRODUCT_MODULE_REQUIRED:
      "At least one module is required for each selected module-scoped product version.",
    PRODUCT_VERSION_SELECTION_CONFLICT:
      "This product permits only one version per environment.",
    PRODUCT_MODULE_VERSION_CONFLICT:
      "The same module can use only one version in an environment.",
  };
  if (invalidRelations[error?.code]) {
    sendJson(response, 400, {
      error: {
        code: error.code === "23503"
          ? "ENVIRONMENT_RELATION_INVALID"
          : error.code,
        message: invalidRelations[error.code],
        details: {},
      },
    });
    return;
  }
  sendJson(response, 500, {
    error: {
      code: "ENVIRONMENT_OPERATION_FAILED",
      message: "The environment operation could not be completed.",
      details: {},
    },
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const requestStartedAt = performance.now();
  let currentProfile = null;

  if (request.method === "GET" && url.pathname === "/api/work-center/v1/health") {
    sendJson(response, latestSnapshot.upstream.online ? 200 : 503, {
      status: latestSnapshot.upstream.online ? "UP" : "DEGRADED",
      generatedAt: latestSnapshot.generatedAt,
      upstream: latestSnapshot.upstream,
    });
    return;
  }

  if (url.pathname.startsWith("/api/work-center/v1/auth")) {
    await ensureDatabase();
    if (await authController.handle(request, response, url)) {
      return;
    }
  }

  if (url.pathname.startsWith("/api/work-center/v1/")) {
    await ensureDatabase();
    currentProfile = await authController.profile(request);
    if (!currentProfile) {
      sendJson(response, 401, {
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required.",
          details: {},
        },
      });
      return;
    }
    const permission = requiredPermission(request.method, url.pathname);
    let organizationId =
      url.pathname.match(/\/organizations\/(\d+)/)?.[1] ?? null;
    if (
      !organizationId &&
      permission?.startsWith("environments.") &&
      ["GET", "HEAD"].includes(request.method)
    ) {
      organizationId = url.searchParams.get("organizationId");
    }
    if (
      !organizationId &&
      permission?.startsWith("environments.") &&
      !["GET", "HEAD"].includes(request.method)
    ) {
      try {
        organizationId = String(
          (await readJsonBody(request)).organizationId ?? "",
        ) || null;
      } catch {
        sendJson(response, 400, {
          error: {
            code: "REQUEST_BODY_INVALID",
            message: "Request body is invalid.",
            details: {},
          },
        });
        return;
      }
    }
    if (
      permission &&
      !hasPermission(currentProfile, permission, organizationId)
    ) {
      sendJson(response, 403, {
        error: {
          code: "PERMISSION_DENIED",
          message: "Permission denied.",
          details: {},
        },
      });
      return;
    }
    if (
      !["GET", "HEAD"].includes(request.method) &&
      !authController.validCsrf(request, currentProfile)
    ) {
      sendJson(response, 403, {
        error: {
          code: "CSRF_VALIDATION_FAILED",
          message: "CSRF validation failed.",
          details: {},
        },
      });
      return;
    }
  }

  if (
    request.method === "GET" &&
    url.pathname === "/api/work-center/v1/dashboard"
  ) {
    const snapshot = await refreshSnapshot();
    sendJson(response, 200, snapshot);
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname ===
      "/api/work-center/v1/organization-classifications"
  ) {
    try {
      await ensureDatabase();
      const validation = validateOrganizationClassification(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "CLASSIFICATION_VALIDATION_FAILED",
            message: "Code and Name are required.",
            details: validation.errors,
          },
        });
        return;
      }
      const classification =
        await organizationRepository.createClassification(
          validation.classification,
        );
      sendJson(response, 201, { classification });
    } catch (error) {
      sendClassificationError(response, error);
    }
    return;
  }

  const classificationMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/organization-classifications\/(\d+)$/,
  );
  if (request.method === "PUT" && classificationMatch) {
    try {
      await ensureDatabase();
      const validation = validateOrganizationClassification(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "CLASSIFICATION_VALIDATION_FAILED",
            message: "Code and Name are required.",
            details: validation.errors,
          },
        });
        return;
      }
      const classification =
        await organizationRepository.updateClassification(
          classificationMatch[1],
          validation.classification,
        );
      if (!classification) {
        sendJson(response, 404, {
          error: {
            code: "CLASSIFICATION_NOT_FOUND",
            message: "Classification not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { classification });
    } catch (error) {
      sendClassificationError(response, error);
    }
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname ===
      "/api/work-center/v1/organization-classifications"
  ) {
    try {
      await ensureDatabase();
      sendJson(response, 200, {
        classifications:
          await organizationRepository.listClassifications(),
      });
    } catch (error) {
      sendOrganizationError(response, error);
    }
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === "/api/work-center/v1/organizations"
  ) {
    try {
      await ensureDatabase();
      sendJson(response, 200, {
        organizations: await organizationRepository.list(),
      });
    } catch (error) {
      sendOrganizationError(response, error);
    }
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/work-center/v1/organizations"
  ) {
    try {
      await ensureDatabase();
      const validation = validateOrganization(await readJsonBody(request));
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "ORGANIZATION_VALIDATION_FAILED",
            message: "Code and Name are required.",
            details: validation.errors,
          },
        });
        return;
      }
      const organization = await organizationRepository.create(
        validation.organization,
      );
      await environmentRepository.ensureDefaultGroup(organization.id);
      sendJson(response, 201, { organization });
    } catch (error) {
      sendOrganizationError(response, error);
    }
    return;
  }

  const organizationMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/organizations\/(\d+)$/,
  );
  if (request.method === "PUT" && organizationMatch) {
    try {
      await ensureDatabase();
      const validation = validateOrganization(await readJsonBody(request));
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "ORGANIZATION_VALIDATION_FAILED",
            message: "Code and Name are required.",
            details: validation.errors,
          },
        });
        return;
      }
      const organization = await organizationRepository.update(
        organizationMatch[1],
        validation.organization,
      );
      if (!organization) {
        sendJson(response, 404, {
          error: {
            code: "ORGANIZATION_NOT_FOUND",
            message: "Organization not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { organization });
    } catch (error) {
      sendOrganizationError(response, error);
    }
    return;
  }

  const environmentInventoryMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/organizations\/(\d+)\/environment-inventory$/,
  );
  if (request.method === "GET" && environmentInventoryMatch) {
    try {
      await ensureDatabase();
      await environmentRepository.ensureDefaultGroup(
        environmentInventoryMatch[1],
      );
      const inventory = await environmentRepository.listInventory(
        environmentInventoryMatch[1],
        { includeArchived: url.searchParams.get("includeArchived") === "true" },
      );
      sendJson(response, 200, inventory);
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === "/api/work-center/v1/products"
  ) {
    try {
      await ensureDatabase();
      sendJson(response, 200, {
        products: await environmentRepository.listProducts(),
      });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/work-center/v1/products"
  ) {
    try {
      await ensureDatabase();
      const validation = validateProductInput(await readJsonBody(request));
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "PRODUCT_VALIDATION_FAILED",
            message: "Product input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const product = await environmentRepository.createProduct(
        validation.product,
      );
      sendJson(response, 201, { product });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  const productMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/products\/(\d+)$/,
  );
  if (request.method === "PUT" && productMatch) {
    try {
      await ensureDatabase();
      const validation = validateProductInput(await readJsonBody(request));
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "PRODUCT_VALIDATION_FAILED",
            message: "Product input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const product = await environmentRepository.updateProduct(
        productMatch[1],
        validation.product,
      );
      if (!product) {
        sendJson(response, 404, {
          error: {
            code: "PRODUCT_NOT_FOUND",
            message: "Product not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { product });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/work-center/v1/product-versions"
  ) {
    try {
      await ensureDatabase();
      const validation = validateProductVersionInput(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "PRODUCT_VERSION_VALIDATION_FAILED",
            message: "Product version input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const productVersion =
        await environmentRepository.createProductVersion(
          validation.productVersion,
        );
      if (!productVersion) {
        sendJson(response, 404, {
          error: {
            code: "PRODUCT_NOT_FOUND",
            message: "Product not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 201, { productVersion });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  const productVersionMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/product-versions\/(\d+)$/,
  );
  if (request.method === "PUT" && productVersionMatch) {
    try {
      await ensureDatabase();
      const validation = validateProductVersionInput(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "PRODUCT_VERSION_VALIDATION_FAILED",
            message: "Product version input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const productVersion =
        await environmentRepository.updateProductVersion(
          productVersionMatch[1],
          validation.productVersion,
        );
      if (!productVersion) {
        sendJson(response, 404, {
          error: {
            code: "PRODUCT_VERSION_NOT_FOUND",
            message: "Product version not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { productVersion });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/work-center/v1/product-version-modules"
  ) {
    try {
      await ensureDatabase();
      const validation = validateProductVersionModuleInput(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "PRODUCT_VERSION_MODULE_VALIDATION_FAILED",
            message: "Product version module input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const productVersionModule =
        await environmentRepository.createProductVersionModule(
          validation.productVersionModule,
        );
      if (!productVersionModule) {
        sendJson(response, 404, {
          error: {
            code: "PRODUCT_VERSION_NOT_FOUND",
            message: "Product version not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 201, { productVersionModule });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  const productVersionModuleMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/product-version-modules\/(\d+)$/,
  );
  if (request.method === "PUT" && productVersionModuleMatch) {
    try {
      await ensureDatabase();
      const validation = validateProductVersionModuleInput(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "PRODUCT_VERSION_MODULE_VALIDATION_FAILED",
            message: "Product version module input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const productVersionModule =
        await environmentRepository.updateProductVersionModule(
          productVersionModuleMatch[1],
          validation.productVersionModule,
        );
      if (!productVersionModule) {
        sendJson(response, 404, {
          error: {
            code: "PRODUCT_VERSION_MODULE_NOT_FOUND",
            message: "Product version module not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { productVersionModule });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/work-center/v1/environment-groups"
  ) {
    try {
      await ensureDatabase();
      const validation = validateEnvironmentGroup(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "ENVIRONMENT_GROUP_VALIDATION_FAILED",
            message: "Environment group input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const group = await environmentRepository.createGroup(validation.group);
      if (!group) {
        sendJson(response, 404, {
          error: {
            code: "ORGANIZATION_NOT_FOUND",
            message: "Organization not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 201, { group });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  const environmentGroupMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/environment-groups\/(\d+)$/,
  );
  if (request.method === "PUT" && environmentGroupMatch) {
    try {
      await ensureDatabase();
      const validation = validateEnvironmentGroup(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "ENVIRONMENT_GROUP_VALIDATION_FAILED",
            message: "Environment group input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const group = await environmentRepository.updateGroup(
        environmentGroupMatch[1],
        validation.group,
      );
      if (!group) {
        sendJson(response, 404, {
          error: {
            code: "ENVIRONMENT_GROUP_NOT_FOUND",
            message: "Environment group not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { group });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  const environmentGroupArchiveMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/environment-groups\/(\d+)\/archive$/,
  );
  if (request.method === "POST" && environmentGroupArchiveMatch) {
    try {
      await ensureDatabase();
      const body = await readJsonBody(request);
      const organizationId = String(body?.organizationId ?? "").trim();
      if (!/^[1-9]\d*$/.test(organizationId)) {
        sendJson(response, 400, {
          error: {
            code: "ORGANIZATION_ID_REQUIRED",
            message: "Organization ID is required.",
            details: {},
          },
        });
        return;
      }
      const group = await environmentRepository.archiveGroup(
        environmentGroupArchiveMatch[1],
        organizationId,
      );
      if (!group) {
        sendJson(response, 404, {
          error: {
            code: "ENVIRONMENT_GROUP_NOT_FOUND",
            message: "Environment group not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { group });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/work-center/v1/environments"
  ) {
    try {
      await ensureDatabase();
      const validation = validateEnvironmentInput(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "ENVIRONMENT_VALIDATION_FAILED",
            message: "Environment input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const environment = await environmentRepository.createEnvironment(
        validation.environment,
      );
      sendJson(response, 201, { environment });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  const environmentMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/environments\/(\d+)$/,
  );
  if (request.method === "PUT" && environmentMatch) {
    try {
      await ensureDatabase();
      const validation = validateEnvironmentInput(
        await readJsonBody(request),
        { requireRevision: true },
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "ENVIRONMENT_VALIDATION_FAILED",
            message: "Environment input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const environment = await environmentRepository.updateEnvironment(
        environmentMatch[1],
        validation.environment,
      );
      if (!environment) {
        sendJson(response, 404, {
          error: {
            code: "ENVIRONMENT_NOT_FOUND",
            message: "Environment not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { environment });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  const environmentStateMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/environments\/(\d+)\/(archive|restore)$/,
  );
  if (request.method === "POST" && environmentStateMatch) {
    try {
      await ensureDatabase();
      const body = await readJsonBody(request);
      const organizationId = String(body?.organizationId ?? "").trim();
      if (!/^[1-9]\d*$/.test(organizationId)) {
        sendJson(response, 400, {
          error: {
            code: "ORGANIZATION_ID_REQUIRED",
            message: "Organization ID is required.",
            details: {},
          },
        });
        return;
      }
      const environment = environmentStateMatch[2] === "archive"
        ? await environmentRepository.archiveEnvironment(
            environmentStateMatch[1],
            organizationId,
          )
        : await environmentRepository.restoreEnvironment(
            environmentStateMatch[1],
            organizationId,
          );
      if (!environment) {
        sendJson(response, 404, {
          error: {
            code: "ENVIRONMENT_NOT_FOUND",
            message: "Environment not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { environment });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/work-center/v1/environment-endpoints"
  ) {
    try {
      const validation = validateEnvironmentEndpointInput(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "ENVIRONMENT_ENDPOINT_VALIDATION_FAILED",
            message: "Environment endpoint input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const endpoint =
        await environmentRepository.createEnvironmentEndpoint(
          validation.endpoint,
        );
      if (!endpoint) {
        sendJson(response, 404, {
          error: {
            code: "ENVIRONMENT_NOT_FOUND",
            message: "Environment not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 201, { endpoint });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  const environmentEndpointMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/environment-endpoints\/(\d+)$/,
  );
  if (request.method === "PUT" && environmentEndpointMatch) {
    try {
      const validation = validateEnvironmentEndpointInput(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "ENVIRONMENT_ENDPOINT_VALIDATION_FAILED",
            message: "Environment endpoint input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const endpoint =
        await environmentRepository.updateEnvironmentEndpoint(
          environmentEndpointMatch[1],
          validation.endpoint,
        );
      if (!endpoint) {
        sendJson(response, 404, {
          error: {
            code: "ENVIRONMENT_ENDPOINT_NOT_FOUND",
            message: "Environment endpoint not found.",
            details: {},
          },
        });
        return;
      }
      sendJson(response, 200, { endpoint });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  const endpointCredentialMatch = url.pathname.match(
    /^\/api\/work-center\/v1\/environment-endpoint-credentials\/(\d+)$/,
  );
  if (request.method === "GET" && endpointCredentialMatch) {
    try {
      const organizationId = String(
        url.searchParams.get("organizationId") ?? "",
      );
      const credential = await environmentRepository.getEndpointCredential(
        endpointCredentialMatch[1],
        organizationId,
      );
      if (!credential) {
        sendJson(response, 404, {
          error: {
            code: "ENVIRONMENT_CREDENTIAL_NOT_FOUND",
            message: "Environment credential not found.",
            details: {},
          },
        });
        return;
      }
      await identityRepository.audit({
        actorUserId: currentProfile?.id ?? null,
        eventType: "ENVIRONMENT_CREDENTIAL_REVEALED",
        targetType: "ENVIRONMENT_ENDPOINT",
        requestIp: request.socket.remoteAddress ?? "",
        userAgent: request.headers["user-agent"] ?? "",
        details: {
          endpointId: endpointCredentialMatch[1],
          organizationId,
        },
      });
      sendJson(response, 200, { credential });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }
  if (request.method === "PUT" && endpointCredentialMatch) {
    try {
      const validation = validateEnvironmentCredentialInput(
        await readJsonBody(request),
      );
      if (!validation.valid) {
        sendJson(response, 400, {
          error: {
            code: "ENVIRONMENT_CREDENTIAL_VALIDATION_FAILED",
            message: "Environment credential input is invalid.",
            details: validation.errors,
          },
        });
        return;
      }
      const credential = await environmentRepository.saveEndpointCredential(
        endpointCredentialMatch[1],
        validation.credential.organizationId,
        validation.credential,
      );
      if (!credential) {
        sendJson(response, 404, {
          error: {
            code: "ENVIRONMENT_ENDPOINT_NOT_FOUND",
            message: "Environment endpoint not found.",
            details: {},
          },
        });
        return;
      }
      await identityRepository.audit({
        actorUserId: currentProfile?.id ?? null,
        eventType: "ENVIRONMENT_CREDENTIAL_UPDATED",
        targetType: "ENVIRONMENT_ENDPOINT",
        requestIp: request.socket.remoteAddress ?? "",
        userAgent: request.headers["user-agent"] ?? "",
        details: {
          endpointId: endpointCredentialMatch[1],
          organizationId: validation.credential.organizationId,
          hasUsername: Boolean(validation.credential.username),
          hasPassword: Boolean(validation.credential.password),
        },
      });
      sendJson(response, 200, { credential });
    } catch (error) {
      sendEnvironmentError(response, error);
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/work-center/v1/events") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    response.write(`event: snapshot\ndata: ${publicJson(latestSnapshot)}\n\n`);
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return;
  }

  if (url.pathname.startsWith(`${builderRoutePrefix}/`)) {
    try {
      await handleIntegratedBuilder(request, response, url);
    } catch (error) {
      sendJson(response, 502, {
        error: {
          code: "INTEGRATED_BUILDER_UNAVAILABLE",
          message: error?.message ?? "Integrated builder is unavailable.",
          details: {},
        },
      });
    }
    return;
  }

  sendJson(response, 404, {
    error: {
      code: "WORK_CENTER_ROUTE_NOT_FOUND",
      message: "Route not found",
      requestId: request.headers["x-request-id"] ?? null,
      details: {},
    },
  });
  await log("info", "request completed", {
    method: request.method,
    path: url.pathname,
    status: 404,
    durationMs: Math.round(performance.now() - requestStartedAt),
  });
});

server.listen(port, host, async () => {
  await log("info", "compatibility gateway started", {
    host,
    port,
    builderTerminalBaseUrl,
    refreshIntervalMs,
  });
  await refreshSnapshot();
});

const refreshTimer = setInterval(refreshSnapshot, refreshIntervalMs);
refreshTimer.unref();

function shutdown(signal) {
  clearInterval(refreshTimer);
  builderWorker.close();
  for (const client of clients) {
    client.end();
  }
  server.close(async () => {
    await Promise.all([
      organizationRepository.close(),
      environmentRepository.close(),
      identityRepository.close(),
    ]);
    await log("info", "compatibility gateway stopped", { signal });
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
