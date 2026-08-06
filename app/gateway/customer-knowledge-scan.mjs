import { agentGatewayHeaders } from "./agent-gateway-settings.mjs";

const taskIdPattern = /^[0-9a-f-]{36}$/i;
const allowedContractStatuses = new Set([
  "NONE", "PLANNED", "ACTIVE", "EXPIRED", "TERMINATED",
]);
const allowedVpnTypes = new Set(["IPSEC", "SSL", "MPLS", "OTHER"]);
const allowedEnvironmentStatuses = new Set([
  "ACTIVE", "PREPARING", "SUSPENDED", "RETIRED",
]);
const allowedEnvironmentPurposes = new Set([
  "PRODUCTION", "VERIFICATION", "DEVELOPMENT", "TRAINING", "OTHER",
]);

function text(value, maximum = 2000) {
  return String(value ?? "").trim().slice(0, maximum);
}

function nullableText(value, maximum) {
  return text(value, maximum) || null;
}

function enumValue(value, allowed, fallback) {
  const normalized = text(value, 30).toUpperCase();
  return allowed.has(normalized) ? normalized : fallback;
}

function dateValue(value) {
  const normalized = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function confidenceValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
}

function jsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  const source = text(value, 200_000)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(source.slice(start, end + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function evidenceRefs(values, citationByUri) {
  const unique = new Map();
  for (const value of Array.isArray(values) ? values : []) {
    const uri = text(value, 4000);
    const citation = citationByUri.get(uri);
    if (citation) unique.set(uri, citation);
  }
  return [...unique.values()];
}

function normalizeContract(value, citationByUri) {
  const itemType = text(value?.itemType, 20).toUpperCase();
  const evidence = evidenceRefs(value?.evidenceResourceUris, citationByUri);
  if (!["PRODUCT", "SERVICE"].includes(itemType) || evidence.length === 0) {
    return null;
  }
  const productCode = nullableText(value?.productCode, 64);
  const serviceName = nullableText(value?.serviceName, 255);
  if (itemType === "PRODUCT" && !productCode) return null;
  if (itemType === "SERVICE" && !serviceName) return null;
  return {
    candidateType: "CONTRACT",
    confidence: confidenceValue(value?.confidence),
    evidence,
    payload: {
      itemType,
      productCode: itemType === "PRODUCT" ? productCode : null,
      productName: itemType === "PRODUCT"
        ? nullableText(value?.productName, 255)
        : null,
      productId: null,
      serviceName: itemType === "SERVICE" ? serviceName : null,
      introductionStatus: enumValue(
        value?.introductionStatus,
        allowedContractStatuses,
        "NONE",
      ),
      introductionStartDate: dateValue(value?.introductionStartDate),
      introductionEndDate: dateValue(value?.introductionEndDate),
      maintenanceStatus: enumValue(
        value?.maintenanceStatus,
        allowedContractStatuses,
        "NONE",
      ),
      maintenanceStartDate: dateValue(value?.maintenanceStartDate),
      maintenanceEndDate: dateValue(value?.maintenanceEndDate),
      notes: nullableText(value?.notes, 2000),
    },
  };
}

function normalizeVpn(value, citationByUri) {
  const name = text(value?.name, 255);
  const evidence = evidenceRefs(value?.evidenceResourceUris, citationByUri);
  if (!name || evidence.length === 0) return null;
  return {
    candidateType: "VPN",
    confidence: confidenceValue(value?.confidence),
    evidence,
    payload: {
      name,
      vpnType: enumValue(value?.vpnType, allowedVpnTypes, "OTHER"),
      providerName: nullableText(value?.providerName, 255),
      endpoint: nullableText(value?.endpoint, 500),
      status: enumValue(value?.status, allowedEnvironmentStatuses, "ACTIVE"),
      notes: nullableText(value?.notes, 2000),
    },
  };
}

function normalizeEnvironment(value, citationByUri) {
  const name = text(value?.name, 255);
  const evidence = evidenceRefs(value?.evidenceResourceUris, citationByUri);
  if (!name || evidence.length === 0) return null;
  return {
    candidateType: "ENVIRONMENT",
    status: "REVIEW_REQUIRED",
    confidence: confidenceValue(value?.confidence),
    evidence,
    payload: {
      name,
      purpose: enumValue(value?.purpose, allowedEnvironmentPurposes, "OTHER"),
      status: enumValue(value?.status, allowedEnvironmentStatuses, "ACTIVE"),
      url: nullableText(value?.url, 2000),
      ownerName: nullableText(value?.ownerName, 255),
      notes: nullableText(value?.notes, 4000),
    },
  };
}

export function buildCustomerKnowledgeScanPrompt(organization) {
  return `顧客情報スキャンを実行してください。\n` +
    `対象組織機関 Code: ${text(organization.code, 100)}\n` +
    `正式名: ${text(organization.name, 255)}\n` +
    `略称: ${text(organization.shortName, 120)}\n` +
    "学習済みナレッジだけを使用し、契約、サービス、VPN、サーバー及びネットワーク環境を調査してください。" +
    "推測は禁止します。候補ごとに根拠の knowledge resource_uri を必ず付け、根拠がない項目は learningGaps に記録してください。" +
    "最終回答は Markdown を使わず、organizationCode, organizationName, contracts, vpnConnections, environments, learningGaps を持つ JSON オブジェクトだけにしてください。" +
    "contracts の項目は itemType, productCode, productName, serviceName, introductionStatus, introductionStartDate, introductionEndDate, maintenanceStatus, maintenanceStartDate, maintenanceEndDate, notes, confidence, evidenceResourceUris。" +
    "vpnConnections の項目は name, vpnType, providerName, endpoint, status, notes, confidence, evidenceResourceUris。" +
    "environments の項目は name, purpose, status, url, ownerName, notes, confidence, evidenceResourceUris。";
}

export function normalizeCustomerKnowledgeResult(finalReport) {
  const citations = Array.isArray(finalReport?.knowledge_citations)
    ? finalReport.knowledge_citations
    : [];
  const citationByUri = new Map(
    citations
      .filter((item) => text(item?.resource_uri, 4000))
      .map((item) => [text(item.resource_uri, 4000), {
        resourceUri: text(item.resource_uri, 4000),
        sourceId: text(item.source_id, 100),
        sourceName: text(item.source_name, 255),
        path: text(item.path, 2000),
        score: confidenceValue(item.score),
      }]),
  );
  const payload = jsonObject(finalReport?.summary);
  if (!payload) {
    return {
      valid: false,
      errorCode: "CAG_SCAN_RESULT_INVALID",
      candidates: [],
      learningGaps: ["CAG の最終回答を構造化 JSON として読取できませんでした。"],
      citations: [...citationByUri.values()],
    };
  }
  const candidates = [
    ...(Array.isArray(payload.contracts) ? payload.contracts : [])
      .map((item) => normalizeContract(item, citationByUri)),
    ...(Array.isArray(payload.vpnConnections) ? payload.vpnConnections : [])
      .map((item) => normalizeVpn(item, citationByUri)),
    ...(Array.isArray(payload.environments) ? payload.environments : [])
      .map((item) => normalizeEnvironment(item, citationByUri)),
  ].filter(Boolean);
  const learningGaps = (Array.isArray(payload.learningGaps)
    ? payload.learningGaps
    : [])
    .map((item) => text(item, 1000))
    .filter(Boolean)
    .slice(0, 100);
  if (citationByUri.size === 0) {
    learningGaps.unshift("対象組織機関に対応する学習済み資料の引用を取得できませんでした。");
  }
  return {
    valid: true,
    candidates,
    learningGaps,
    citations: [...citationByUri.values()],
  };
}

async function jsonRequest(gateway, path, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${gateway.endpoint}${path}`, {
      ...options,
      headers: {
        ...agentGatewayHeaders(gateway.accessToken),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers ?? {}),
      },
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw Object.assign(new Error(`CAG returned ${response.status}.`), {
        code: "CAG_SCAN_HTTP_ERROR",
      });
    }
    return response.json();
  } catch (error) {
    if (controller.signal.aborted) {
      throw Object.assign(new Error("CAG did not respond within the scan timeout."), {
        code: "CAG_SCAN_TIMEOUT",
      });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function createCustomerKnowledgeScanService({
  repository,
  agentGatewaySettingsRepository,
  configuredGatewayId = "",
  projectRef = "cag",
  runtimeProfile = "read-only-analysis",
  fetchTask = jsonRequest,
}) {
  async function resolveGateway() {
    if (configuredGatewayId) {
      const configured = await agentGatewaySettingsRepository.get(configuredGatewayId);
      if (configured?.enabled) return configured;
    }
    const enabled = (await agentGatewaySettingsRepository.list())
      .filter((item) => item.enabled);
    if (enabled.length !== 1) {
      throw Object.assign(new Error("Customer scan requires one enabled Agent Gateway."), {
        code: "CUSTOMER_SCAN_CONFIGURATION_REQUIRED",
      });
    }
    return enabled[0];
  }

  return {
    async start(organizationId, actorUserId, requestId = "") {
      const organization = await repository.getOrganization(organizationId);
      if (!organization) {
        throw Object.assign(new Error("Customer was not found."), {
          code: "CUSTOMER_NOT_FOUND",
        });
      }
      const gateway = await resolveGateway();
      const prompt = buildCustomerKnowledgeScanPrompt(organization);
      const scan = await repository.createScan({
        organizationId,
        gatewaySettingId: gateway.id,
        actorUserId,
        querySnapshot: {
          organizationCode: organization.code,
          organizationName: organization.name,
          organizationShortName: organization.shortName,
        },
      });
      try {
        const task = await fetchTask(gateway, "/tasks", {
          method: "POST",
          headers: {
            "X-CAG-Source": "oneops-customer-scan",
            "X-CAG-Client-ID": `oneops-${actorUserId}`,
            ...(requestId ? { "X-Request-ID": requestId } : {}),
            "Idempotency-Key": `oneops-customer-scan-${scan.id}`,
          },
          body: JSON.stringify({
            project_id: projectRef,
            prompt,
            runtime_profile: runtimeProfile,
            knowledge_mode: "required",
            harness_profile: "single",
            learning_mode: "off",
          }),
        });
        if (!taskIdPattern.test(String(task?.id ?? ""))) {
          throw Object.assign(new Error("CAG task ID is invalid."), {
            code: "CAG_SCAN_TASK_INVALID",
          });
        }
        return repository.attachTask(scan.id, task.id, task.status);
      } catch (error) {
        return repository.failScan(
          scan.id,
          error?.code ?? "CAG_SCAN_START_FAILED",
          error?.message ?? "CAG scan could not start.",
        );
      }
    },

    async refresh(organizationId, scanId) {
      const scan = await repository.getScan(organizationId, scanId);
      if (!scan || ["COMPLETED", "FAILED"].includes(scan.status)) return scan;
      const gateway = await agentGatewaySettingsRepository.get(scan.gatewaySettingId);
      if (!gateway?.enabled || !scan.cagTaskId) return scan;
      let task;
      try {
        task = await fetchTask(gateway, `/tasks/${scan.cagTaskId}`);
      } catch (error) {
        const startedAt = Date.parse(String(scan.createdAt ?? ""));
        if (
          Number.isFinite(startedAt) &&
          Date.now() - startedAt >= 15 * 60 * 1000
        ) {
          return repository.failScan(
            scan.id,
            "CAG_SCAN_EXECUTION_TIMEOUT",
            "CAG scan did not complete within 15 minutes.",
          );
        }
        return repository.recordRefreshError(
          scan.id,
          error?.code ?? "CAG_SCAN_STATUS_UNAVAILABLE",
          error?.message ?? "CAG scan status is unavailable.",
        );
      }
      if (["failed", "cancelled"].includes(task.status)) {
        return repository.failScan(
          scan.id,
          "CAG_SCAN_FAILED",
          task.error ?? "CAG scan failed.",
        );
      }
      if (task.status !== "completed") {
        return repository.markRunning(scan.id);
      }
      const normalized = normalizeCustomerKnowledgeResult(task.final_report);
      return repository.completeScan(scan.id, normalized);
    },
  };
}
