import type {
  CustomerBacklogProject,
  CustomerContract,
} from "@one-ops/api-client";

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
