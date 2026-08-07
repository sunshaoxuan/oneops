import type {
  CustomerBacklogProject,
  CustomerContract,
} from "@one-ops/api-client";

export const customerTabKeys = [
  "basic",
  "customization",
  "contracts",
  "services",
  "network",
  "inquiries",
  "tasks",
] as const;

export type CustomerTabKey = (typeof customerTabKeys)[number];

export interface CustomerTabPreference {
  order: CustomerTabKey[];
  hidden: CustomerTabKey[];
}

export const defaultCustomerTabPreference: CustomerTabPreference = {
  order: [...customerTabKeys],
  hidden: [],
};

function isCustomerTabKey(value: unknown): value is CustomerTabKey {
  return typeof value === "string" && customerTabKeys.includes(value as CustomerTabKey);
}

export function normalizeCustomerTabPreference(
  value: unknown,
): CustomerTabPreference {
  const record = value && typeof value === "object"
    ? value as { order?: unknown; hidden?: unknown }
    : {};
  const savedOrder = Array.isArray(record.order)
    ? record.order.filter(isCustomerTabKey)
    : [];
  const order = [...new Set(savedOrder)];
  for (const key of customerTabKeys) {
    if (!order.includes(key)) order.push(key);
  }
  const hidden = [...new Set(
    (Array.isArray(record.hidden) ? record.hidden : []).filter(isCustomerTabKey),
  )];
  if (hidden.length >= customerTabKeys.length) {
    hidden.splice(hidden.indexOf(order[0]), 1);
  }
  return { order, hidden };
}

export function moveCustomerTab(
  preference: CustomerTabPreference,
  key: CustomerTabKey,
  direction: -1 | 1,
): CustomerTabPreference {
  const normalized = normalizeCustomerTabPreference(preference);
  const from = normalized.order.indexOf(key);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= normalized.order.length) return normalized;
  const order = [...normalized.order];
  [order[from], order[to]] = [order[to], order[from]];
  return { ...normalized, order };
}

export function setCustomerTabVisibility(
  preference: CustomerTabPreference,
  key: CustomerTabKey,
  visible: boolean,
): CustomerTabPreference {
  const normalized = normalizeCustomerTabPreference(preference);
  if (visible) {
    return {
      ...normalized,
      hidden: normalized.hidden.filter((item) => item !== key),
    };
  }
  const visibleCount = normalized.order.filter(
    (item) => !normalized.hidden.includes(item),
  ).length;
  if (visibleCount <= 1 || normalized.hidden.includes(key)) return normalized;
  return { ...normalized, hidden: [...normalized.hidden, key] };
}

export function customerContractLabel(contract: CustomerContract): string {
  return contract.itemType === "PRODUCT"
    ? contract.productName || contract.productCode || ""
    : contract.serviceName || "";
}

export function selectedBacklogProjects(
  values: string[],
  options: CustomerBacklogProject[],
): CustomerBacklogProject[] {
  const byId = new Map(
    options.map((project) => [project.externalProjectId, project]),
  );
  return values
    .map((value) => byId.get(value))
    .filter((project): project is CustomerBacklogProject => Boolean(project));
}

export function safeExternalHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
