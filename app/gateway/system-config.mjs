import { readFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const gatewayDirectory = dirname(fileURLToPath(import.meta.url));
const defaultConfigFile = resolve(
  gatewayDirectory,
  "../config/system.config.json",
);

export async function loadSystemConfig(configFile = defaultConfigFile) {
  const config = JSON.parse(await readFile(configFile, "utf8"));
  const directory = config?.organizationDirectory;

  if (!directory || !Array.isArray(directory.dataSources)) {
    throw new Error(
      "organizationDirectory.dataSources must be an array in system config",
    );
  }
  if (
    directory.synchronization?.insertMissing !== true ||
    directory.synchronization?.supplementEmptyFields !== true ||
    directory.synchronization?.updateExisting !== false ||
    directory.synchronization?.deleteMissing !== false
  ) {
    throw new Error(
      "organization synchronization must insert missing records and preserve existing records",
    );
  }
  for (const source of directory.dataSources) {
    if (
      source?.id &&
      source.type === "inquiry-site" &&
      source.sourceCode === "ONEHR_UPDS" &&
      Number.isInteger(source.syncIntervalMinutes) &&
      source.syncIntervalMinutes >= 10
    ) {
      continue;
    }
    if (
      !source?.id ||
      source.type !== "xlsx" ||
      !source.pathPattern ||
      !source.columns?.code ||
      !source.columns?.name
    ) {
      throw new Error("organization xlsx data source configuration is invalid");
    }
    const projectRoot = resolve(dirname(configFile), "..", "..");
    const resolvedSourcePattern = resolve(
      dirname(configFile),
      source.pathPattern,
    );
    if (
      !resolvedSourcePattern
        .toLocaleLowerCase()
        .startsWith(`${projectRoot}${sep}`.toLocaleLowerCase())
    ) {
      throw new Error("organization data source must stay within the project root");
    }
    source.pathPattern = resolvedSourcePattern;
  }

  return config;
}
