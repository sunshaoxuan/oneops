import { createHash } from "node:crypto";

const ORGANIZATION_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const MAINTENANCE_STATUS_VALUES = new Set(["", "〇", "✕"]);

export function normalizeSourceMaintenanceStatus(value) {
  return normalizeSourceMaintenance(value).maintenanceStatus;
}

export function normalizeSourceMaintenance(value) {
  const normalized = String(value ?? "").trim();
  if (
    ["〇", "○", "有", "あり", "有り"].includes(normalized)
  ) {
    return { maintenanceStatus: "〇", remarks: "" };
  }
  if (normalized === "文部科学本省と一緒") {
    return {
      maintenanceStatus: "〇",
      remarks: `保守有無原文：${normalized}`,
    };
  }
  if (["✕", "×", "✗", "無", "なし", "無し"].includes(normalized)) {
    return { maintenanceStatus: "✕", remarks: "" };
  }
  return {
    maintenanceStatus: "",
    remarks: normalized ? `保守有無原文：${normalized}` : "",
  };
}

export function normalizeOrganization(value) {
  const classificationId = String(
    value?.classificationId ?? value?.classification_id ?? "",
  ).trim();
  return {
    ...(value?.id == null ? {} : { id: String(value.id) }),
    classificationId,
    classificationCode: String(
      value?.classificationCode ?? value?.classification_code ?? "",
    ).trim(),
    classificationName: String(
      value?.classificationName ?? value?.classification_name ?? "",
    ).trim(),
    code: String(value?.code ?? "").trim(),
    name: String(value?.name ?? "").trim(),
    shortName: String(value?.shortName ?? value?.short_name ?? "").trim(),
    maintenanceStatus: String(
      value?.maintenanceStatus ?? value?.maintenance_status ?? "",
    ).trim(),
    remarks: String(value?.remarks ?? "").trim(),
  };
}

export function validateOrganization(value) {
  const organization = normalizeOrganization(value);
  const errors = {};

  if (!ORGANIZATION_CODE_PATTERN.test(organization.code)) {
    errors.code =
      "Code must be 1-64 characters using letters, numbers, dot, underscore or hyphen.";
  }
  if (!organization.name || organization.name.length > 255) {
    errors.name = "Name must be 1-255 characters.";
  }
  if (
    organization.classificationId &&
    !/^[1-9]\d*$/.test(organization.classificationId)
  ) {
    errors.classificationId =
      "Classification ID must be a positive physical ID.";
  }
  if (organization.shortName.length > 255) {
    errors.shortName = "Short name must be 0-255 characters.";
  }
  if (!MAINTENANCE_STATUS_VALUES.has(organization.maintenanceStatus)) {
    errors.maintenanceStatus =
      "Maintenance status must be circle, cross or empty.";
  }
  if (organization.remarks.length > 1000) {
    errors.remarks = "Remarks must be 0-1000 characters.";
  }

  return {
    organization,
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function legacyOrganizationCode(name) {
  const digest = createHash("sha256")
    .update(String(name).trim(), "utf8")
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  return `LEGACY-${digest}`;
}

export function classificationBusinessCode(name) {
  const digest = createHash("md5")
    .update(String(name).trim(), "utf8")
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  return `CLASS-${digest}`;
}

export function planOrganizationSourceMerge(existing, incoming) {
  if (!existing) {
    return { action: "insert" };
  }
  if (String(existing.name ?? "").trim() !== incoming.name) {
    return {
      action: "conflict",
      type: "same-code-different-name",
      existingName: String(existing.name ?? "").trim(),
      incomingName: incoming.name,
    };
  }
  const supplements = {};
  if (!existing.classification_id && incoming.classification) {
    supplements.classificationName = incoming.classification;
  }
  for (const [databaseField, incomingField] of [
    ["short_name", "shortName"],
    ["maintenance_status", "maintenanceStatus"],
    ["remarks", "remarks"],
  ]) {
    if (!String(existing[databaseField] ?? "").trim() && incoming[incomingField]) {
      supplements[incomingField] = incoming[incomingField];
    }
  }
  return Object.keys(supplements).length
    ? { action: "supplement", supplements }
    : { action: "unchanged" };
}

export function planLegacyOrganizationReconciliation(existing, incoming) {
  if (!existing) {
    return { action: "insert" };
  }
  if (String(existing.code ?? "").startsWith("LEGACY-")) {
    return {
      action: "reconcile-legacy-code",
      id: String(existing.id),
      existingCode: existing.code,
      incomingCode: incoming.code,
    };
  }
  return {
    action: "conflict",
    type: "same-name-different-code",
    existingCode: String(existing.code ?? "").trim(),
    incomingCode: incoming.code,
  };
}
