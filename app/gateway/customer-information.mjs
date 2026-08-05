const contractStatuses = new Set([
  "NONE",
  "PLANNED",
  "ACTIVE",
  "EXPIRED",
  "TERMINATED",
]);
const vpnTypes = new Set(["IPSEC", "SSL", "MPLS", "OTHER"]);
const vpnStatuses = new Set(["ACTIVE", "PREPARING", "SUSPENDED", "RETIRED"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function text(value, maximum = 2000) {
  return String(value ?? "").trim().slice(0, maximum);
}

function nullableText(value, maximum) {
  return text(value, maximum) || null;
}

function nullableDate(value, errors, key) {
  const normalized = text(value, 10);
  if (!normalized) return null;
  if (!datePattern.test(normalized)) {
    errors[key] = "DATE_INVALID";
    return null;
  }
  return normalized;
}

function validPeriod(start, end, errors, key) {
  if (start && end && start > end) errors[key] = "DATE_ORDER_INVALID";
}

export function validateCustomerContract(input) {
  const errors = {};
  const itemType = text(input?.itemType, 20).toUpperCase();
  const productId = text(input?.productId, 100) || null;
  const serviceName = nullableText(input?.serviceName, 255);
  const introductionStatus = text(input?.introductionStatus, 20).toUpperCase();
  const maintenanceStatus = text(input?.maintenanceStatus, 20).toUpperCase();
  const introductionStartDate = nullableDate(
    input?.introductionStartDate,
    errors,
    "introductionStartDate",
  );
  const introductionEndDate = nullableDate(
    input?.introductionEndDate,
    errors,
    "introductionEndDate",
  );
  const maintenanceStartDate = nullableDate(
    input?.maintenanceStartDate,
    errors,
    "maintenanceStartDate",
  );
  const maintenanceEndDate = nullableDate(
    input?.maintenanceEndDate,
    errors,
    "maintenanceEndDate",
  );
  if (!["PRODUCT", "SERVICE"].includes(itemType)) {
    errors.itemType = "CONTRACT_ITEM_TYPE_INVALID";
  }
  if (itemType === "PRODUCT" && !/^\d+$/.test(productId ?? "")) {
    errors.productId = "CONTRACT_PRODUCT_REQUIRED";
  }
  if (itemType === "SERVICE" && !serviceName) {
    errors.serviceName = "CONTRACT_SERVICE_NAME_REQUIRED";
  }
  if (!contractStatuses.has(introductionStatus)) {
    errors.introductionStatus = "CONTRACT_STATUS_INVALID";
  }
  if (!contractStatuses.has(maintenanceStatus)) {
    errors.maintenanceStatus = "CONTRACT_STATUS_INVALID";
  }
  validPeriod(
    introductionStartDate,
    introductionEndDate,
    errors,
    "introductionEndDate",
  );
  validPeriod(
    maintenanceStartDate,
    maintenanceEndDate,
    errors,
    "maintenanceEndDate",
  );
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    contract: {
      itemType,
      productId: itemType === "PRODUCT" ? productId : null,
      serviceName: itemType === "SERVICE" ? serviceName : null,
      introductionStatus,
      introductionStartDate,
      introductionEndDate,
      maintenanceStatus,
      maintenanceStartDate,
      maintenanceEndDate,
      notes: nullableText(input?.notes, 2000),
      revision: Number(input?.revision ?? 0),
    },
  };
}

export function validateCustomerVpn(input) {
  const errors = {};
  const name = text(input?.name, 255);
  const vpnType = text(input?.vpnType, 20).toUpperCase();
  const status = text(input?.status, 20).toUpperCase();
  if (!name) errors.name = "VPN_NAME_REQUIRED";
  if (!vpnTypes.has(vpnType)) errors.vpnType = "VPN_TYPE_INVALID";
  if (!vpnStatuses.has(status)) errors.status = "VPN_STATUS_INVALID";
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    vpn: {
      name,
      vpnType,
      providerName: nullableText(input?.providerName, 255),
      endpoint: nullableText(input?.endpoint, 500),
      status,
      notes: nullableText(input?.notes, 2000),
      revision: Number(input?.revision ?? 0),
    },
  };
}

export function validateBacklogProjects(input) {
  const projects = Array.isArray(input?.projects) ? input.projects : [];
  const normalized = [];
  const errors = {};
  const seen = new Set();
  if (projects.length > 100) errors.projects = "BACKLOG_PROJECT_LIMIT_EXCEEDED";
  for (const [index, project] of projects.entries()) {
    const externalProjectId = text(project?.externalProjectId, 100);
    const projectKey = text(project?.projectKey, 100);
    const projectName = text(project?.projectName, 255);
    if (!externalProjectId || !projectKey || !projectName) {
      errors[`projects.${index}`] = "BACKLOG_PROJECT_INVALID";
      continue;
    }
    if (seen.has(externalProjectId)) continue;
    seen.add(externalProjectId);
    normalized.push({ externalProjectId, projectKey, projectName });
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    projects: normalized,
  };
}

export function isEffectiveContract(contract, today = new Date()) {
  const date = today.toISOString().slice(0, 10);
  return ["introduction", "maintenance"].some((phase) => {
    if (contract[`${phase}Status`] !== "ACTIVE") return false;
    const start = contract[`${phase}StartDate`];
    const end = contract[`${phase}EndDate`];
    return (!start || start <= date) && (!end || end >= date);
  });
}

export function pagination(input) {
  const page = Math.max(1, Math.min(10000, Number(input?.page) || 1));
  const pageSize = Math.max(10, Math.min(100, Number(input?.pageSize) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}
