import { agentGatewayHeaders } from "./agent-gateway-settings.mjs";

const taskIdPattern = /^[0-9a-f-]{36}$/i;
const terminalStatuses = new Set(["review_required", "completed", "failed"]);
const statusMap = new Map([
  ["queued", "QUEUED"],
  ["resolving_scope", "RESOLVING_SCOPE"],
  ["preparing_documents", "PREPARING_DOCUMENTS"],
  ["preparing_versions", "INGESTING"],
  ["ingesting", "INGESTING"],
  ["extracting", "EXTRACTING"],
  ["aggregating", "AGGREGATING"],
  ["review_required", "REVIEW_REQUIRED"],
  ["completed", "COMPLETED"],
  ["failed", "FAILED"],
]);

function text(value, maximum = 2000) {
  return String(value ?? "").trim().slice(0, maximum);
}

function confidenceValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
}

function evidenceRef(value) {
  return {
    documentId: text(value?.document_id, 100),
    documentVersionId: text(value?.document_version_id, 100),
    chunkId: text(value?.chunk_id, 100),
    resourceUri: text(value?.resource_uri, 4000),
    path: text(value?.canonical_path, 2000),
    sheet: text(value?.sheet, 255) || null,
    cellRange: text(value?.cell_range, 255) || null,
    page: Number.isInteger(value?.page) ? value.page : null,
    section: text(value?.section, 500) || null,
    excerpt: text(value?.excerpt, 1000),
  };
}

function documentOutcome(value, outcomeType) {
  return {
    document_id: text(value?.document_id, 100) || null,
    canonical_path: text(value?.canonical_path, 2000),
    outcome_type: outcomeType,
    reason_code: text(value?.reason_code ?? value?.status, 100),
    retryable: Boolean(value?.retryable),
    target_path: text(value?.target_path, 4000) || null,
    target_kind: text(value?.target_kind, 32) || null,
  };
}

export function normalizeCustomerKnowledgeResult(report) {
  if (!report || Number(report.schema_version) !== 1) {
    return {
      valid: false,
      errorCode: "CAG_SCAN_RESULT_INVALID",
      status: "FAILED",
      scopeId: null,
      coverage: {},
      candidates: [],
      conflicts: [],
      unresolvedFields: [],
      documentFailures: [],
      versions: {},
    };
  }
  const conflictIds = new Set(
    (Array.isArray(report.conflicts) ? report.conflicts : [])
      .flatMap((item) => Array.isArray(item?.candidate_ids) ? item.candidate_ids : []),
  );
  const directlyApplicableFields = new Set([
    "organization_category",
    "organization_code",
    "organization_name",
    "short_name",
    "maintenance_status",
    "remarks",
    "contracts",
    "services",
    "vpns",
    "environments",
    "customizations",
  ]);
  const candidates = (Array.isArray(report.field_candidates)
    ? report.field_candidates
    : [])
    .map((candidate) => ({
      id: text(candidate?.id, 100),
      fieldCode: text(candidate?.field_code, 128),
      value: candidate?.value,
      optionExternalId: text(candidate?.option_id, 100) || null,
      confidence: confidenceValue(candidate?.confidence),
      evidence: (Array.isArray(candidate?.evidence) ? candidate.evidence : [])
        .map(evidenceRef)
        .filter((item) => item.documentId && item.documentVersionId && item.chunkId),
      status: conflictIds.has(candidate?.id)
        ? "CONFLICT"
        : directlyApplicableFields.has(text(candidate?.field_code, 128))
          ? "PROPOSED"
          : "REVIEW_REQUIRED",
    }))
    .filter((item) => item.id && item.fieldCode && item.evidence.length > 0);
  return {
    valid: true,
    errorCode: text(report.error_code, 100) || null,
    status: statusMap.get(report.status) ?? "FAILED",
    scopeId: text(report.scope?.id, 100) || null,
    coverage: report.coverage ?? {},
    candidates,
    conflicts: Array.isArray(report.conflicts) ? report.conflicts : [],
    unresolvedFields: Array.isArray(report.unresolved_fields)
      ? report.unresolved_fields
      : [],
    documentFailures: [
      ...(Array.isArray(report.document_failures)
        ? report.document_failures.map((item) => documentOutcome(item, "failure"))
        : []),
      ...(Array.isArray(report.document_exclusions)
        ? report.document_exclusions.map((item) => documentOutcome(item, "excluded"))
        : []),
      ...(Array.isArray(report.document_observations)
        ? report.document_observations.map((item) => documentOutcome(item, "observation"))
        : []),
    ],
    versions: report.versions ?? {},
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
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = text(payload?.detail?.code, 100) || "CAG_SCAN_HTTP_ERROR";
      throw Object.assign(new Error(`CAG returned ${response.status}.`), { code });
    }
    return payload;
  } catch (error) {
    if (controller.signal.aborted) {
      throw Object.assign(new Error("CAG did not respond within the request timeout."), {
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
  fetchTask = jsonRequest,
}) {
  async function contextForSetting(settingId = null) {
    const setting = settingId
      ? await repository.getSourceSetting(settingId)
      : await repository.getActiveSourceSetting();
    if (!setting) {
      throw Object.assign(new Error("Customer knowledge source is not configured."), {
        code: "CUSTOMER_SCAN_CONFIGURATION_REQUIRED",
      });
    }
    const gateway = await agentGatewaySettingsRepository.get(setting.gatewaySettingId);
    if (!gateway?.enabled) {
      throw Object.assign(new Error("Customer knowledge gateway is disabled."), {
        code: "CUSTOMER_SCAN_CONFIGURATION_REQUIRED",
      });
    }
    return { setting, gateway };
  }

  async function submit({
    organization,
    actorUserId,
    requestId,
    parentScanId = null,
  }) {
    const { setting, gateway } = await contextForSetting();
    const requestedFields = await repository.getExtractionFieldContract();
    const scan = await repository.createScan({
      organizationId: organization.id,
      subjectExternalId: organization.subjectExternalId,
      sourceSettingId: setting.id,
      parentScanId,
      actorUserId,
      querySnapshot: {
        organizationCode: organization.code,
        organizationName: organization.name,
        organizationShortName: organization.shortName,
      },
    });
    let task;
    try {
      task = await fetchTask(
        gateway,
        "/knowledge/extractions/customer-ledger",
        {
        method: "POST",
        headers: {
          "X-CAG-Source": "oneops-customer-scan",
          "X-CAG-Client-ID": "oneops-system",
          "X-Request-ID": requestId || scan.id,
          "Idempotency-Key": `oneops-customer-scan-${scan.id}`,
        },
        body: JSON.stringify({
          schema_version: 1,
          project_id: setting.cagProjectId,
          knowledge_source_id: setting.cagSourceId,
          analysis_template: {
            code: setting.analysisTemplateCode,
            version: setting.analysisTemplateVersion,
          },
          subject: {
            type: "organization",
            external_system: "ONEOPS",
            external_id: organization.subjectExternalId,
            code: organization.code,
            official_name: organization.name,
            short_name: organization.shortName || null,
            aliases: [],
          },
          scope_policy: { resolution: "catalog", coverage: "exhaustive" },
          analysis_context: {
            as_of: new Date().toISOString(),
            learning_processing_selection: "active",
            business_knowledge_selection: "applicable_at",
          },
          ingestion_policy: {
            mode: "prepare_required_versions",
            retry_failed_documents: true,
          },
          requested_fields: requestedFields,
          result_policy: {
            mode: "candidates_only",
            require_evidence: true,
            report_conflicts: true,
            minimum_confidence: 0.7,
            allow_automatic_overwrite: false,
            allow_delete: false,
          },
        }),
        },
      );
    } catch (error) {
      error.scanId = scan.id;
      throw error;
    }
    if (!taskIdPattern.test(String(task?.id ?? ""))) {
      throw Object.assign(new Error("CAG task ID is invalid."), {
        code: "CAG_SCAN_TASK_INVALID",
        scanId: scan.id,
      });
    }
    return repository.attachTask(scan.id, task.id, task.status);
  }

  return {
    async start(organizationId, actorUserId, requestId = "", parentScanId = null) {
      const organization = await repository.getOrganization(organizationId);
      if (!organization) {
        throw Object.assign(new Error("Customer was not found."), {
          code: "CUSTOMER_NOT_FOUND",
        });
      }
      try {
        return await submit({ organization, actorUserId, requestId, parentScanId });
      } catch (error) {
        if (error?.scanId) {
          return repository.failScan(
            error.scanId,
            error?.code ?? "CAG_SCAN_START_FAILED",
            "CAG scan could not start.",
          );
        }
        throw error;
      }
    },

    async refresh(organizationId, scanId) {
      const scan = await repository.getScan(organizationId, scanId);
      if (!scan || ["COMPLETED", "FAILED"].includes(scan.status)) return scan;
      const { gateway } = await contextForSetting(scan.sourceSettingId);
      if (scan.status === "INGESTING" && scan.cagIngestionId) {
        try {
          const ingestion = await fetchTask(
            gateway,
            `/knowledge/ingestions/${scan.cagIngestionId}`,
          );
          if (ingestion.status === "failed") {
            return repository.failScan(
              scan.id,
              "INGESTION_FAILED",
              "CAG document ingestion failed.",
            );
          }
          if (ingestion.status === "cancelled") {
            return repository.failScan(
              scan.id,
              "INGESTION_CANCELLED",
              "CAG document ingestion was cancelled.",
            );
          }
          if (ingestion.status !== "completed") return scan;
          return this.start(
            organizationId,
            scan.createdByUserId,
            "",
            scan.id,
          );
        } catch (error) {
          return repository.recordRefreshError(
            scan.id,
            error?.code ?? "CAG_SCAN_STATUS_UNAVAILABLE",
            "CAG ingestion status is temporarily unavailable.",
          );
        }
      }
      if (!scan.cagTaskId) return scan;
      let task;
      try {
        task = await fetchTask(
          gateway,
          `/knowledge/extractions/customer-ledger/${scan.cagTaskId}`,
        );
      } catch (error) {
        return repository.recordRefreshError(
          scan.id,
          error?.code ?? "CAG_SCAN_STATUS_UNAVAILABLE",
          "CAG scan status is temporarily unavailable.",
        );
      }
      if (task.status === "failed") {
        return repository.failScan(
          scan.id,
          text(task?.error?.code, 100) || "CAG_SCAN_FAILED",
          "CAG customer knowledge extraction failed.",
        );
      }
      if (!terminalStatuses.has(task.status)) {
        return repository.markStage(
          scan.id,
          statusMap.get(task.status) ?? "EXTRACTING",
          task.scope_id ?? null,
        );
      }
      return repository.completeScan(scan.id, normalizeCustomerKnowledgeResult(task));
    },

    async reanalyze(organizationId, scanId, actorUserId, requestId = "") {
      const parent = await repository.getScan(organizationId, scanId);
      if (!parent) return null;
      return this.start(organizationId, actorUserId, requestId, parent.id);
    },

    async reingest(organizationId, scanId) {
      const scan = await repository.getScan(organizationId, scanId);
      if (!scan?.cagScopeId) return null;
      const { gateway } = await contextForSetting(scan.sourceSettingId);
      const ingestion = await fetchTask(
        gateway,
        `/knowledge/scopes/${scan.cagScopeId}/ingestions`,
        {
          method: "POST",
          headers: {
            "X-CAG-Client-Role": "system-admin",
            "Idempotency-Key": (
              `oneops-customer-scan-repair-${scan.id}-`
              + (scan.cagIngestionId || "initial")
            ),
          },
          body: JSON.stringify({
            reason: "ORGANIZATION_PROFILE_ENRICHMENT",
            mode: "prepare_required_versions",
            retry_statuses: ["observed", "metadata_only", "empty_text", "failed"],
          }),
        },
      );
      return repository.attachIngestion(scan.id, ingestion.id);
    },
  };
}
