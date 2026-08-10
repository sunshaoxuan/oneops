export type NavigationKey =
  | "workbench"
  | "personalTasks"
  | "masterData"
  | "environments"
  | "builder"
  | "codeInsight"
  | "consulting"
  | "aiAssistant"
  | "knowledge"
  | "reports"
  | "admin";

export const navigationPermissionCodes: Record<NavigationKey, string | null> = {
  workbench: "dashboard.read",
  personalTasks: "personal.tasks.use",
  environments: "environments.read",
  consulting: "inquiries.use",
  builder: "builder.use",
  aiAssistant: "ai.assistant.use",
  knowledge: "knowledge.use",
  codeInsight: "code.insight.use",
  reports: "reports.read",
  masterData: "catalog.read",
  admin: null,
};

const dashboardDataNavigation = new Set<NavigationKey>([
  "workbench",
  "environments",
  "builder",
  "codeInsight",
  "consulting",
  "knowledge",
  "reports",
  "admin",
]);

export function navigationUsesDashboardData(
  navigation: NavigationKey,
): boolean {
  return dashboardDataNavigation.has(navigation);
}

export function navigationUsesDashboardLive(
  navigation: NavigationKey,
): boolean {
  return navigation === "workbench";
}

export type MasterDataManagementSection =
  | "organizations"
  | "organization-classifications"
  | "product-versions";

export type SystemManagementSection =
  | "model-api"
  | "agent-gateways"
  | "quick-assistants"
  | "customer-knowledge"
  | "inquiry-settings"
  | "workforce"
  | "inquiry-search-templates"
  | "users"
  | "roles"
  | "audit";

export interface PortalRoute {
  navigation: NavigationKey;
  masterDataSection?: MasterDataManagementSection;
  systemManagementSection?: SystemManagementSection;
}

const navigationPaths: Record<NavigationKey, string> = {
  workbench: "/",
  personalTasks: "/tasks",
  environments: "/customers",
  consulting: "/inquiry-support",
  builder: "/product-builder",
  aiAssistant: "/ai-assistant",
  knowledge: "/knowledge",
  codeInsight: "/code-insight",
  reports: "/reports",
  masterData: "/master-data",
  admin: "/system-management",
};

const masterDataSectionPaths: Record<MasterDataManagementSection, string> = {
  organizations: "organizations",
  "organization-classifications": "organization-classifications",
  "product-versions": "product-versions",
};

const systemManagementSectionPaths: Record<SystemManagementSection, string> = {
  "model-api": "model-api",
  "agent-gateways": "agent-gateways",
  "quick-assistants": "quick-assistants",
  "customer-knowledge": "customer-knowledge",
  "inquiry-settings": "inquiry-support",
  workforce: "workforce",
  "inquiry-search-templates": "inquiry-search-templates",
  users: "users",
  roles: "roles",
  audit: "audit-logs",
};

export function normalizePortalPathname(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  const withLeadingSlash = withoutQuery.startsWith("/")
    ? withoutQuery
    : `/${withoutQuery}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
}

function sectionFromPath<T extends string>(
  segment: string | undefined,
  sectionPaths: Record<T, string>,
): T | undefined {
  return (Object.entries(sectionPaths) as Array<[T, string]>).find(
    ([, path]) => path === segment,
  )?.[0];
}

export function portalRouteFromPathname(pathname: string): PortalRoute {
  const normalized = normalizePortalPathname(pathname);

  if (normalized === "/environments") {
    return { navigation: "environments" };
  }

  if (normalized === navigationPaths.masterData) {
    return { navigation: "masterData" };
  }
  if (normalized.startsWith(`${navigationPaths.masterData}/`)) {
    const section = sectionFromPath(
      normalized.slice(navigationPaths.masterData.length + 1),
      masterDataSectionPaths,
    );
    return section
      ? { navigation: "masterData", masterDataSection: section }
      : { navigation: "workbench" };
  }
  if (normalized === navigationPaths.admin) {
    return { navigation: "admin" };
  }
  if (normalized.startsWith(`${navigationPaths.admin}/`)) {
    const section = sectionFromPath(
      normalized.slice(navigationPaths.admin.length + 1),
      systemManagementSectionPaths,
    );
    return section
      ? { navigation: "admin", systemManagementSection: section }
      : { navigation: "workbench" };
  }

  const navigation = (
    Object.entries(navigationPaths) as Array<[NavigationKey, string]>
  ).find(([, path]) => path === normalized)?.[0];
  return { navigation: navigation ?? "workbench" };
}

export function portalPathForRoute(route: PortalRoute): string {
  if (route.navigation === "masterData" && route.masterDataSection) {
    return `${navigationPaths.masterData}/${
      masterDataSectionPaths[route.masterDataSection]
    }`;
  }
  if (route.navigation === "admin" && route.systemManagementSection) {
    return `${navigationPaths.admin}/${
      systemManagementSectionPaths[route.systemManagementSection]
    }`;
  }
  return navigationPaths[route.navigation];
}

export function samePortalRoute(
  left: PortalRoute,
  right: PortalRoute,
): boolean {
  return (
    left.navigation === right.navigation &&
    left.masterDataSection === right.masterDataSection &&
    left.systemManagementSection === right.systemManagementSection
  );
}
