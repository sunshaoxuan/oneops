interface EnvironmentProductVersionOption {
  id: string;
  modules: Array<{ id: string }>;
}

interface EnvironmentProductOption {
  versionSelectionMode: "SINGLE" | "MODULE_SCOPED";
  versions: EnvironmentProductVersionOption[];
}

export function findModuleScopedVersionsWithoutSelection(
  products: EnvironmentProductOption[],
  selectedVersionIds: string[] = [],
  selectedModuleIds: string[] = [],
) {
  const selectedVersions = new Set(selectedVersionIds);
  const selectedModules = new Set(selectedModuleIds);

  return products
    .filter((product) => product.versionSelectionMode === "MODULE_SCOPED")
    .flatMap((product) => product.versions)
    .filter(
      (version) =>
        selectedVersions.has(version.id) &&
        !version.modules.some((module) => selectedModules.has(module.id)),
    )
    .map((version) => version.id);
}
