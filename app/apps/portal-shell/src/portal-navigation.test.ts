import { describe, expect, it } from "vitest";
import {
  portalPathForRoute,
  portalRouteFromPathname,
  samePortalRoute,
  type NavigationKey,
} from "./portal-navigation";

describe("portal navigation route", () => {
  it("第1階層画面を安定した URL と相互変換する", () => {
    const expected: Array<[NavigationKey, string]> = [
      ["workbench", "/"],
      ["environments", "/environments"],
      ["consulting", "/inquiry-support"],
      ["builder", "/product-builder"],
      ["tasks", "/ai-assistant"],
      ["knowledge", "/knowledge"],
      ["codeInsight", "/code-insight"],
      ["reports", "/reports"],
    ];

    for (const [navigation, path] of expected) {
      expect(portalPathForRoute({ navigation })).toBe(path);
      expect(portalRouteFromPathname(path)).toEqual({ navigation });
    }
  });

  it("旧タスクセンター URL を AI アシスタントへ移行する", () => {
    expect(portalRouteFromPathname("/tasks")).toEqual({
      navigation: "tasks",
    });
    expect(portalPathForRoute({ navigation: "tasks" })).toBe(
      "/ai-assistant",
    );
  });

  it("基本台帳の選択機能を URL から復元する", () => {
    const route = {
      navigation: "masterData" as const,
      masterDataSection: "product-versions" as const,
    };

    expect(portalPathForRoute(route)).toBe("/master-data/product-versions");
    expect(portalRouteFromPathname("/master-data/product-versions/")).toEqual(
      route,
    );
  });

  it("システム管理の選択機能を URL から復元する", () => {
    const route = {
      navigation: "admin" as const,
      systemManagementSection: "audit" as const,
    };

    expect(portalPathForRoute(route)).toBe("/system-management/audit-logs");
    expect(
      portalRouteFromPathname("/system-management/audit-logs?from=today"),
    ).toEqual(route);
  });

  it("未知の URL をワークベンチへ正規化する", () => {
    expect(portalRouteFromPathname("/unknown")).toEqual({
      navigation: "workbench",
    });
    expect(portalRouteFromPathname("/system-management/unknown")).toEqual({
      navigation: "workbench",
    });
  });

  it("表示状態の一致を第2階層まで比較する", () => {
    expect(
      samePortalRoute(
        { navigation: "admin", systemManagementSection: "users" },
        { navigation: "admin", systemManagementSection: "users" },
      ),
    ).toBe(true);
    expect(
      samePortalRoute(
        { navigation: "admin", systemManagementSection: "users" },
        { navigation: "admin", systemManagementSection: "roles" },
      ),
    ).toBe(false);
  });
});
