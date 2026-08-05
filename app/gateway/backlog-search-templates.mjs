export const BACKLOG_SUMMARY_FIELD_ID = "__SUMMARY__";
export const BACKLOG_SUMMARY_FIELD_NAME = "件名";

const valueSources = new Set(["AUTO", "CODE", "NAME", "SHORT_NAME"]);

function text(value, maxLength = 255) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function integer(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function validateBacklogSearchTemplate(input) {
  const errors = {};
  const projectId = text(input?.projectId, 100);
  const projectKey = text(input?.projectKey, 100);
  const projectName = text(input?.projectName, 255);
  const matchMode = input?.matchMode === "TITLE_CONTAINS"
    ? "TITLE_CONTAINS"
    : "CUSTOM_FIELD";
  const fieldId = matchMode === "TITLE_CONTAINS"
    ? BACKLOG_SUMMARY_FIELD_ID
    : text(input?.fieldId, 100);
  const fieldName = matchMode === "TITLE_CONTAINS"
    ? BACKLOG_SUMMARY_FIELD_NAME
    : text(input?.fieldName, 255);
  const templateName = text(
    input?.templateName,
    255,
  ) || `${projectKey || projectId} / ${fieldName || "field"}`;
  const valueSource = valueSources.has(input?.valueSource)
    ? input.valueSource
    : "AUTO";

  if (!projectId) errors.projectId = "BACKLOG_TEMPLATE_PROJECT_REQUIRED";
  if (!fieldId) errors.fieldId = "BACKLOG_TEMPLATE_FIELD_REQUIRED";
  if (templateName.length > 255) {
    errors.templateName = "BACKLOG_TEMPLATE_NAME_TOO_LONG";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    template: {
      templateName,
      projectId,
      projectKey,
      projectName,
      fieldId,
      fieldName,
      matchMode,
      valueSource,
      enabled: input?.enabled !== false,
      sortOrder: Math.min(100000, integer(input?.sortOrder)),
      revision: integer(input?.revision),
    },
  };
}
