import { randomUUID } from "node:crypto";

const KNOWN_STATUSES = new Set([
  "queued",
  "running",
  "success",
  "failed",
  "cancelled",
]);

export function normalizeStatus(value) {
  const normalized = String(value ?? "").toLowerCase();
  return KNOWN_STATUSES.has(normalized) ? normalized : "unknown";
}

function toIsoTimestamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }
  return new Date(number * 1000).toISOString();
}

export function sanitizeJob(job) {
  const request = job?.request ?? {};
  return {
    id: String(job?.id ?? job?.job_id ?? ""),
    status: normalizeStatus(job?.status),
    organization: String(
      request.organisation_name ??
        job?.organisation_name ??
        job?.organization ??
        "共通",
    ),
    productVariant: String(
      request.product_variant ??
        job?.product_variant ??
        job?.productVariant ??
        "standard",
    ),
    materialNumber: String(
      request.material_number ??
        job?.material_number ??
        job?.materialNumber ??
        "",
    ),
    createdAt: toIsoTimestamp(job?.created_at),
    updatedAt: toIsoTimestamp(job?.updated_at),
  };
}

export function buildSnapshot({
  jobsPayload,
  resourcesPayload,
  organizationsPayload = [],
  latencyMs,
  upstreamError,
  now = new Date(),
}) {
  const jobs = Array.isArray(jobsPayload?.jobs)
    ? jobsPayload.jobs
        .map(sanitizeJob)
        .filter((job) => job.id)
        .sort((left, right) =>
          String(right.updatedAt ?? "").localeCompare(
            String(left.updatedAt ?? ""),
          ),
        )
        .slice(0, 50)
    : [];

  const organizations = Array.isArray(organizationsPayload)
    ? organizationsPayload.map((organization) => ({
        ...(organization?.id == null
          ? {}
          : { id: String(organization.id) }),
        classificationId: String(
          organization?.classificationId ??
            organization?.classification_id ??
            "",
        ).trim(),
        classificationCode: String(
          organization?.classificationCode ??
            organization?.classification_code ??
            "",
        ).trim(),
        classificationName: String(
          organization?.classificationName ??
            organization?.classification_name ??
            "",
        ).trim(),
        code: String(organization?.code ?? "").trim(),
        name: String(organization?.name ?? "").trim(),
        shortName: String(
          organization?.shortName ?? organization?.short_name ?? "",
        ).trim(),
        maintenanceStatus: String(
          organization?.maintenanceStatus ??
            organization?.maintenance_status ??
            "",
        ).trim(),
        remarks: String(organization?.remarks ?? "").trim(),
      }))
    : [];

  return {
    generatedAt: now.toISOString(),
    correlationId: randomUUID(),
    upstream: {
      online: !upstreamError,
      latencyMs: Number.isFinite(latencyMs) ? latencyMs : null,
      message: upstreamError ? String(upstreamError) : "8091 connected",
    },
    summary: {
      total: jobs.length,
      running: jobs.filter((job) =>
        ["queued", "running"].includes(job.status),
      ).length,
      failed: jobs.filter((job) => job.status === "failed").length,
      completed: jobs.filter((job) => job.status === "success").length,
      organizations: organizations.length,
    },
    resources: {
      cpuCount: numberOrNull(resourcesPayload?.cpu_count),
      memoryAvailableBytes: numberOrNull(
        resourcesPayload?.memory_available_bytes,
      ),
      diskFreeBytes: numberOrNull(resourcesPayload?.disk_free_bytes),
    },
    tasks: jobs.slice(0, 16),
    organizations,
  };
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function publicJson(value) {
  return JSON.stringify(value);
}
