import { describe, expect, it } from "vitest";
import type { Permission } from "@one-ops/api-client";
import { buildPermissionMatrix } from "./permission-matrix";

function permission(
  code: string,
  resource: string,
  action: string,
): Permission {
  return {
    id: code,
    code,
    resource,
    action,
    name: code,
    description: code,
  };
}

describe("ロール権限マトリクス", () => {
  it("機能ノードを行、操作を列として権限を配置する", () => {
    const matrix = buildPermissionMatrix([
      permission("inquiries.use", "inquiries", "use"),
      permission("organizations.write", "organizations", "write"),
      permission("organizations.read", "organizations", "read"),
      permission("dashboard.read", "dashboard", "read"),
    ]);

    expect(matrix.actions).toEqual(["read", "write", "use"]);
    expect(matrix.rows).toHaveLength(3);
    expect(matrix.rows.map((row) => row.resource)).toEqual([
      "dashboard",
      "organizations",
      "inquiries",
    ]);
    expect(matrix.rows[1].permissionsByAction.read.code).toBe(
      "organizations.read",
    );
    expect(matrix.rows[1].permissionsByAction.write.code).toBe(
      "organizations.write",
    );
    expect(matrix.rows[2].permissionsByAction.use.code).toBe("inquiries.use");
  });

  it("未知の操作も安定した順序で列へ追加する", () => {
    const matrix = buildPermissionMatrix([
      permission("tools.execute", "tools", "execute"),
      permission("tools.approve", "tools", "approve"),
      permission("tools.read", "tools", "read"),
    ]);

    expect(matrix.actions).toEqual(["read", "approve", "execute"]);
  });

  it("AI助手権限を問合支援の直後へ配置する", () => {
    const matrix = buildPermissionMatrix([
      permission("models.settings.read", "models.settings", "read"),
      permission("ai.assistant.use", "ai.assistant", "use"),
      permission("inquiries.use", "inquiries", "use"),
    ]);

    expect(matrix.rows.map((row) => row.resource)).toEqual([
      "inquiries",
      "ai.assistant",
      "models.settings",
    ]);
    expect(matrix.rows[1].permissionsByAction.use.code).toBe(
      "ai.assistant.use",
    );
  });
});
