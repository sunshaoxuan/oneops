import type { TaskStatus } from "@one-ops/api-client";
import type { MessageKey } from "./i18n";

export function formatBytes(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return "—";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let current = value;
  let unitIndex = 0;
  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }
  const digits = unitIndex >= 3 ? 1 : 0;
  return `${current.toFixed(digits)} ${units[unitIndex]}`;
}

export function statusMeta(status: TaskStatus): {
  color: string;
  labelKey: MessageKey;
} {
  const values: Record<
    TaskStatus,
    { color: string; labelKey: MessageKey }
  > = {
    queued: { color: "gold", labelKey: "statusQueued" },
    running: { color: "processing", labelKey: "statusRunning" },
    success: { color: "success", labelKey: "statusSuccess" },
    failed: { color: "error", labelKey: "statusFailed" },
    cancelled: { color: "default", labelKey: "statusCancelled" },
    unknown: { color: "default", labelKey: "statusUnknown" },
  };
  return values[status];
}

export function formatTimestamp(value: string | null, locale: string): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function clampColumnWidth(
  value: number,
  minimum: number,
  maximum = 720,
): number {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export function compareLocalizedText(
  left: unknown,
  right: unknown,
  locale: string,
): number {
  return String(left ?? "").localeCompare(String(right ?? ""), locale, {
    numeric: true,
    sensitivity: "base",
  });
}

function normalizeSearchText(value: unknown): string {
  return String(value ?? "").normalize("NFKC").toLocaleLowerCase();
}

export function matchesSearchFields(
  query: string,
  ...fields: unknown[]
): boolean {
  const normalizedQuery = normalizeSearchText(query).trim();
  if (!normalizedQuery) {
    return true;
  }

  return fields.some((field) =>
    normalizeSearchText(field).includes(normalizedQuery),
  );
}
