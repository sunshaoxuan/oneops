import { describe, expect, it } from "vitest";
import type { Permission } from "@one-ops/api-client";
import {
  buildPermissionMatrix,
  filterActivePermissionCodes,
} from "./permission-matrix";

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

  it("削除済み問合支援履歴を問合支援の直後へ配置する", () => {
    const matrix = buildPermissionMatrix([
      permission("inquiries.templates.read", "inquiries.templates", "read"),
      permission("inquiries.deleted.read", "inquiries.deleted", "read"),
      permission("inquiries.use", "inquiries", "use"),
    ]);

    expect(matrix.rows.map((row) => row.resource)).toEqual([
      "inquiries",
      "inquiries.deleted",
      "inquiries.templates",
    ]);
    expect(matrix.rows[1].permissionsByAction.read.code).toBe(
      "inquiries.deleted.read",
    );
  });

  it("第1階層の独立権限を機能ノードへ配置する", () => {
    const matrix = buildPermissionMatrix([
      permission("reports.read", "reports", "read"),
      permission("code.insight.use", "code.insight", "use"),
      permission("knowledge.use", "knowledge", "use"),
      permission("builder.use", "builder", "use"),
    ]);

    expect(matrix.rows.map((row) => row.resource)).toEqual([
      "builder",
      "knowledge",
      "code.insight",
      "reports",
    ]);
    expect(matrix.rows[0].permissionsByAction.use.code).toBe("builder.use");
    expect(matrix.rows[3].permissionsByAction.read.code).toBe("reports.read");
  });

  it("大文字の資源及び操作を正規化して同じ行と列へ統合する", () => {
    const matrix = buildPermissionMatrix([
      permission("customer.knowledge.scan", "CUSTOMER_KNOWLEDGE", "USE"),
      permission("customer.knowledge.review", "CUSTOMER_KNOWLEDGE", "REVIEW"),
      permission("customer.knowledge.manage", "CUSTOMER_KNOWLEDGE", "MANAGE"),
      permission("customer.knowledge.read", "customer.knowledge", "read"),
    ]);

    expect(matrix.actions).toEqual(["read", "manage"]);
    expect(matrix.rows.map((row) => row.resource)).toContain("customer.knowledge");
    const knowledgeRow = matrix.rows.find(
      (row) => row.resource === "customer.knowledge",
    );
    expect(knowledgeRow?.permissionsByAction.manage.code).toBe(
      "customer.knowledge.manage",
    );
  });

  it("廃止済みの顧客ナレッジ権限を保存対象から除外する", () => {
    expect(filterActivePermissionCodes([
      "dashboard.read",
      "customer.knowledge.scan",
      "customer.knowledge.review",
      "customer.knowledge.manage",
    ])).toEqual(["dashboard.read", "customer.knowledge.manage"]);
  });
});
