const POSITIVE_ID_PATTERN = /^[1-9]\d*$/;
const PRODUCT_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export const ENVIRONMENT_SCOPES = new Set(["CUSTOMER", "INTERNAL"]);
export const ENVIRONMENT_PURPOSES = new Set([
  "PRODUCTION",
  "VERIFICATION",
  "DEVELOPMENT",
  "TRAINING",
  "OTHER",
]);
export const ENVIRONMENT_STATUSES = new Set([
  "ACTIVE",
  "PREPARING",
  "SUSPENDED",
  "RETIRED",
]);
export const PRODUCT_USAGE_STATUSES = new Set([
  "ACTIVE",
  "PLANNED",
  "SUSPENDED",
  "RETIRED",
]);

function text(value) {
  return String(value ?? "").trim();
}

function integer(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : fallback;
}

function validPositiveId(value) {
  return POSITIVE_ID_PATTERN.test(text(value));
}

export function normalizeEnvironmentGroup(value) {
  return {
    organizationId: text(value?.organizationId),
    name: text(value?.name),
    sortOrder: integer(value?.sortOrder),
  };
}

export function validateEnvironmentGroup(value) {
  const group = normalizeEnvironmentGroup(value);
  const errors = {};
  if (!validPositiveId(group.organizationId)) {
    errors.organizationId = "Organization ID must be a positive physical ID.";
  }
  if (!group.name || group.name.length > 120) {
    errors.name = "Group name must be 1-120 characters.";
  }
  if (group.sortOrder < 0) {
    errors.sortOrder = "Sort order must be zero or greater.";
  }
  return { group, errors, valid: Object.keys(errors).length === 0 };
}

function normalizeProductLinks(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.map((value) => ({
    productVersionId: text(value?.productVersionId),
    usageStatus: text(value?.usageStatus) || "ACTIVE",
    notes: text(value?.notes),
    moduleIds: Array.isArray(value?.moduleIds)
      ? value.moduleIds.map((moduleId) => text(moduleId))
      : [],
  }));
}

export function normalizeEnvironmentInput(value) {
  return {
    organizationId: text(value?.organizationId),
    groupId: text(value?.groupId),
    name: text(value?.name),
    scope: text(value?.scope) || "CUSTOMER",
    purpose: text(value?.purpose) || "PRODUCTION",
    status: text(value?.status) || "ACTIVE",
    url: text(value?.url),
    ownerName: text(value?.ownerName),
    notes: text(value?.notes),
    sortOrder: integer(value?.sortOrder),
    revision: integer(value?.revision, 0),
    lastVerifiedAt: text(value?.lastVerifiedAt),
    products: normalizeProductLinks(value?.products),
  };
}

export function validateEnvironmentInput(value, { requireRevision = false } = {}) {
  const environment = normalizeEnvironmentInput(value);
  const errors = {};
  if (!validPositiveId(environment.organizationId)) {
    errors.organizationId = "Organization ID must be a positive physical ID.";
  }
  if (!validPositiveId(environment.groupId)) {
    errors.groupId = "Group ID must be a positive physical ID.";
  }
  if (!environment.name || environment.name.length > 255) {
    errors.name = "Environment name must be 1-255 characters.";
  }
  if (!ENVIRONMENT_SCOPES.has(environment.scope)) {
    errors.scope = "Environment scope is invalid.";
  }
  if (!ENVIRONMENT_PURPOSES.has(environment.purpose)) {
    errors.purpose = "Environment purpose is invalid.";
  }
  if (!ENVIRONMENT_STATUSES.has(environment.status)) {
    errors.status = "Environment status is invalid.";
  }
  if (environment.url.length > 2000) {
    errors.url = "URL must be 0-2000 characters.";
  } else if (environment.url) {
    try {
      const url = new URL(environment.url);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.url = "URL must use HTTP or HTTPS.";
      }
    } catch {
      errors.url = "URL must be valid.";
    }
  }
  if (environment.ownerName.length > 255) {
    errors.ownerName = "Owner name must be 0-255 characters.";
  }
  if (environment.notes.length > 4000) {
    errors.notes = "Notes must be 0-4000 characters.";
  }
  if (environment.sortOrder < 0) {
    errors.sortOrder = "Sort order must be zero or greater.";
  }
  if (requireRevision && environment.revision < 1) {
    errors.revision = "Revision must be a positive integer.";
  }
  if (
    environment.lastVerifiedAt &&
    !/^\d{4}-\d{2}-\d{2}$/.test(environment.lastVerifiedAt)
  ) {
    errors.lastVerifiedAt = "Last verified date must use YYYY-MM-DD.";
  }

  const seenVersions = new Set();
  const seenModules = new Set();
  environment.products.forEach((product, index) => {
    if (!validPositiveId(product.productVersionId)) {
      errors[`products.${index}.productVersionId`] =
        "Product version ID must be a positive physical ID.";
    }
    if (seenVersions.has(product.productVersionId)) {
      errors[`products.${index}.productVersionId`] =
        "Product version must not be duplicated.";
    }
    seenVersions.add(product.productVersionId);
    if (!PRODUCT_USAGE_STATUSES.has(product.usageStatus)) {
      errors[`products.${index}.usageStatus`] =
        "Product usage status is invalid.";
    }
    if (product.notes.length > 1000) {
      errors[`products.${index}.notes`] =
        "Product notes must be 0-1000 characters.";
    }
    product.moduleIds.forEach((moduleId, moduleIndex) => {
      if (!validPositiveId(moduleId)) {
        errors[`products.${index}.moduleIds.${moduleIndex}`] =
          "Product version module ID must be a positive physical ID.";
      }
      if (seenModules.has(moduleId)) {
        errors[`products.${index}.moduleIds.${moduleIndex}`] =
          "Product version module must not be duplicated.";
      }
      seenModules.add(moduleId);
    });
  });

  return {
    environment,
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function normalizeProductInput(value) {
  return {
    code: text(value?.code).toUpperCase(),
    name: text(value?.name),
    shortName: text(value?.shortName),
    sortOrder: integer(value?.sortOrder),
  };
}

export function validateProductInput(value) {
  const product = normalizeProductInput(value);
  const errors = {};
  if (!PRODUCT_CODE_PATTERN.test(product.code)) {
    errors.code =
      "Product Code must use letters, numbers, dot, underscore or hyphen.";
  }
  if (!product.name || product.name.length > 255) {
    errors.name = "Product name must be 1-255 characters.";
  }
  if (product.shortName.length > 120) {
    errors.shortName = "Product short name must be 0-120 characters.";
  }
  if (product.sortOrder < 0) {
    errors.sortOrder = "Sort order must be zero or greater.";
  }
  return { product, errors, valid: Object.keys(errors).length === 0 };
}

export function normalizeProductVersionInput(value) {
  return {
    productId: text(value?.productId),
    version: text(value?.version),
    displayVersion: text(value?.displayVersion),
  };
}

export function validateProductVersionInput(value) {
  const productVersion = normalizeProductVersionInput(value);
  const errors = {};
  if (!validPositiveId(productVersion.productId)) {
    errors.productId = "Product ID must be a positive physical ID.";
  }
  if (!productVersion.version || productVersion.version.length > 100) {
    errors.version = "Version must be 1-100 characters.";
  }
  if (productVersion.displayVersion.length > 120) {
    errors.displayVersion = "Display version must be 0-120 characters.";
  }
  return {
    productVersion,
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function normalizeProductVersionModuleInput(value) {
  return {
    productVersionId: text(value?.productVersionId),
    code: text(value?.code).toUpperCase(),
    name: text(value?.name),
    shortName: text(value?.shortName),
    sortOrder: integer(value?.sortOrder),
  };
}

export function validateProductVersionModuleInput(value) {
  const productVersionModule =
    normalizeProductVersionModuleInput(value);
  const errors = {};
  if (!validPositiveId(productVersionModule.productVersionId)) {
    errors.productVersionId =
      "Product version ID must be a positive physical ID.";
  }
  if (!PRODUCT_CODE_PATTERN.test(productVersionModule.code)) {
    errors.code =
      "Module Code must use letters, numbers, dot, underscore or hyphen.";
  }
  if (
    !productVersionModule.name ||
    productVersionModule.name.length > 255
  ) {
    errors.name = "Module name must be 1-255 characters.";
  }
  if (productVersionModule.shortName.length > 120) {
    errors.shortName = "Module short name must be 0-120 characters.";
  }
  if (productVersionModule.sortOrder < 0) {
    errors.sortOrder = "Sort order must be zero or greater.";
  }
  return {
    productVersionModule,
    errors,
    valid: Object.keys(errors).length === 0,
  };
}
