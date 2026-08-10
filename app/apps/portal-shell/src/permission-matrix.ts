import type { Permission } from "@one-ops/api-client";

export interface PermissionMatrixRow {
  key: string;
  resource: string;
  permissionsByAction: Record<string, Permission>;
}

const ACTION_ORDER = [
  "read",
  "write",
  "use",
  "review",
  "manage",
  "impersonate",
];
const RESOURCE_ORDER = [
  "dashboard",
  "personal.tasks",
  "organizations",
  "customer.knowledge",
  "environments",
  "environments.credentials",
  "catalog",
  "inquiries",
  "inquiries.deleted",
  "inquiries.templates",
  "ai.assistant",
  "builder",
  "knowledge",
  "code.insight",
  "reports",
  "models.settings",
  "identity.users",
  "identity.workforce",
  "identity.roles",
  "audit",
];

const ACTION_ALIASES: Record<string, string> = {
  READ: "read",
  WRITE: "write",
  USE: "use",
  REVIEW: "review",
  MANAGE: "manage",
  IMPERSONATE: "impersonate",
};

export const RETIRED_PERMISSION_CODES = new Set([
  "customer.knowledge.scan",
  "customer.knowledge.review",
]);

export function filterActivePermissionCodes(permissionCodes: string[]) {
  return permissionCodes.filter(
    (code) => !RETIRED_PERMISSION_CODES.has(code.trim().toLowerCase()),
  );
}

function normalizeResource(resource: string) {
  const value = resource.trim();
  const upperValue = value.toUpperCase();
  if (/^[A-Z0-9_]+$/.test(value)) {
    return upperValue.toLowerCase().replaceAll("_", ".");
  }
  return value;
}

function normalizeAction(action: string) {
  const value = action.trim();
  return ACTION_ALIASES[value.toUpperCase()] ?? value.toLowerCase();
}

export function buildPermissionMatrix(permissions: Permission[]): {
  actions: string[];
  rows: PermissionMatrixRow[];
} {
  const activePermissions = permissions.filter(
    (permission) => !RETIRED_PERMISSION_CODES.has(permission.code.trim().toLowerCase()),
  );
  const actions = Array.from(
    new Set(activePermissions.map((permission) => normalizeAction(permission.action))),
  ).sort((left, right) => {
    const leftIndex = ACTION_ORDER.indexOf(left);
    const rightIndex = ACTION_ORDER.indexOf(right);
    const leftOrder = leftIndex === -1 ? ACTION_ORDER.length : leftIndex;
    const rightOrder = rightIndex === -1 ? ACTION_ORDER.length : rightIndex;
    return leftOrder - rightOrder || left.localeCompare(right);
  });
  const rows = new Map<string, PermissionMatrixRow>();

  for (const permission of activePermissions) {
    const resource = normalizeResource(permission.resource);
    const action = normalizeAction(permission.action);
    const row = rows.get(resource) ?? {
      key: resource,
      resource,
      permissionsByAction: {},
    };
    row.permissionsByAction[action] = permission;
    rows.set(resource, row);
  }

  return {
    actions,
    rows: Array.from(rows.values()).sort((left, right) => {
      const leftIndex = RESOURCE_ORDER.indexOf(left.resource);
      const rightIndex = RESOURCE_ORDER.indexOf(right.resource);
      const leftOrder =
        leftIndex === -1 ? RESOURCE_ORDER.length : leftIndex;
      const rightOrder =
        rightIndex === -1 ? RESOURCE_ORDER.length : rightIndex;
      return (
        leftOrder - rightOrder ||
        left.resource.localeCompare(right.resource)
      );
    }),
  };
}
