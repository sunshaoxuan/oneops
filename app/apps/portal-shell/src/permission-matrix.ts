import type { Permission } from "@one-ops/api-client";

export interface PermissionMatrixRow {
  key: string;
  resource: string;
  permissionsByAction: Record<string, Permission>;
}

const ACTION_ORDER = ["read", "write", "use"];
const RESOURCE_ORDER = [
  "dashboard",
  "personal.tasks",
  "organizations",
  "environments",
  "environments.credentials",
  "catalog",
  "inquiries",
  "ai.assistant",
  "models.settings",
  "identity.users",
  "identity.roles",
  "audit",
];

export function buildPermissionMatrix(permissions: Permission[]): {
  actions: string[];
  rows: PermissionMatrixRow[];
} {
  const actions = Array.from(
    new Set(permissions.map((permission) => permission.action)),
  ).sort((left, right) => {
    const leftIndex = ACTION_ORDER.indexOf(left);
    const rightIndex = ACTION_ORDER.indexOf(right);
    const leftOrder = leftIndex === -1 ? ACTION_ORDER.length : leftIndex;
    const rightOrder = rightIndex === -1 ? ACTION_ORDER.length : rightIndex;
    return leftOrder - rightOrder || left.localeCompare(right);
  });
  const rows = new Map<string, PermissionMatrixRow>();

  for (const permission of permissions) {
    const row = rows.get(permission.resource) ?? {
      key: permission.resource,
      resource: permission.resource,
      permissionsByAction: {},
    };
    row.permissionsByAction[permission.action] = permission;
    rows.set(permission.resource, row);
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
