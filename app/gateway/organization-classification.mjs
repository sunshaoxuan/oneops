const CLASSIFICATION_CODE_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function normalizeOrganizationClassification(value) {
  return {
    ...(value?.id == null ? {} : { id: String(value.id) }),
    code: String(value?.code ?? "").trim(),
    name: String(value?.name ?? "").trim(),
  };
}

export function validateOrganizationClassification(value) {
  const classification = normalizeOrganizationClassification(value);
  const errors = {};

  if (!CLASSIFICATION_CODE_PATTERN.test(classification.code)) {
    errors.code =
      "Code must be 1-64 characters using letters, numbers, dot, underscore or hyphen.";
  }
  if (!classification.name || classification.name.length > 100) {
    errors.name = "Name must be 1-100 characters.";
  }

  return {
    classification,
    errors,
    valid: Object.keys(errors).length === 0,
  };
}
