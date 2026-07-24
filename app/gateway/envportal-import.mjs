import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourceSystem = "ENVPORTAL";
const optionalSourceFiles = [
  "rdp.csv",
  "tags.json",
  "production.csv",
  "env_groups.json",
];
const dataSecretFields = new Set([
  "ログインID",
  "ログインパスワード",
  "DBユーザー名",
  "DBパスワード",
]);
const rdpSecretFields = new Set([
  "RDPユーザー名",
  "RDPパスワード",
]);

function text(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return text(value).normalize("NFKC").toLocaleLowerCase();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

export function parseCsv(csvText) {
  const input = String(csvText ?? "").replace(/^\uFEFF/, "");
  const table = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
      continue;
    }
    if (character === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (character === "\r" || character === "\n") {
      if (character === "\r" && input[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      field = "";
      if (row.some((value) => value !== "")) {
        table.push(row);
      }
      row = [];
      continue;
    }
    field += character;
  }

  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((value) => value !== "")) {
      table.push(row);
    }
  }
  if (!table.length) {
    return { headers: [], rows: [] };
  }

  const headers = table[0].map(text);
  return {
    headers,
    rows: table.slice(1).map((values, index) => ({
      rowNumber: index + 2,
      values: Object.fromEntries(
        headers.map((header, column) => [header, values[column] ?? ""]),
      ),
    })),
  };
}

export function sanitizeSourceRow(row, secretFields) {
  const sanitizedPayload = {};
  let credentialFieldCount = 0;
  for (const [field, value] of Object.entries(row)) {
    if (secretFields.has(field)) {
      if (text(value)) {
        credentialFieldCount += 1;
      }
      continue;
    }
    sanitizedPayload[field] = String(value ?? "");
  }
  return { sanitizedPayload, credentialFieldCount };
}

export function fingerprintImportRow(rowKind, sanitizedPayload) {
  return sha256(
    `${sourceSystem}\n${rowKind}\n${stableJson(sanitizedPayload)}`,
  );
}

async function readOptionalSourceFile(sourceRoot, fileName) {
  try {
    return await readFile(resolve(sourceRoot, fileName));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function parseTagRows(buffer) {
  if (!buffer) {
    return [];
  }
  const document = JSON.parse(buffer.toString("utf8").replace(/^\uFEFF/, ""));
  return Object.entries(document).map(([identity, tags], index) => {
    const [
      organizationCode = "",
      organizationName = "",
      environmentName = "",
      url = "",
      loginId = "",
    ] = identity.split("||");
    return {
      rowNumber: index + 1,
      values: {
        "組織コード": organizationCode,
        "組織名": organizationName,
        "構築環境名": environmentName,
        URL: url,
        タグ: Array.isArray(tags) ? tags.map(text).filter(Boolean) : [],
      },
      credentialFieldCount: text(loginId) ? 1 : 0,
    };
  });
}

export async function readEnvPortalSource(sourceRoot) {
  const dataBuffer = await readOptionalSourceFile(sourceRoot, "data.csv");
  if (!dataBuffer) {
    const error = new Error("EnvPortal data.csv was not found.");
    error.code = "ENVPORTAL_DATA_NOT_FOUND";
    throw error;
  }

  const buffers = {
    "data.csv": dataBuffer,
  };
  for (const fileName of optionalSourceFiles) {
    const buffer = await readOptionalSourceFile(sourceRoot, fileName);
    if (buffer) {
      buffers[fileName] = buffer;
    }
  }

  const data = parseCsv(dataBuffer.toString("utf8"));
  const rdp = buffers["rdp.csv"]
    ? parseCsv(buffers["rdp.csv"].toString("utf8"))
    : { headers: [], rows: [] };
  const tags = parseTagRows(buffers["tags.json"]);
  const rowCounts = {
    "data.csv": data.rows.length,
    ...(buffers["rdp.csv"] ? { "rdp.csv": rdp.rows.length } : {}),
    ...(buffers["tags.json"] ? { "tags.json": tags.length } : {}),
    ...(buffers["production.csv"]
      ? {
          "production.csv": parseCsv(
            buffers["production.csv"].toString("utf8"),
          ).rows.length,
        }
      : {}),
  };
  const files = Object.keys(buffers)
    .sort()
    .map((fileName) => ({
      fileName,
      sha256: sha256(buffers[fileName]),
      rowCount: rowCounts[fileName] ?? null,
    }));
  const missingOptionalFiles = optionalSourceFiles.filter(
    (fileName) => !buffers[fileName],
  );
  const sourceManifest = {
    files,
    missingOptionalFiles,
  };

  return {
    sourceSystem,
    sourceRoot,
    manifestSha256: sha256(stableJson(sourceManifest)),
    sourceManifest,
    dataRows: data.rows,
    rdpRows: rdp.rows,
    tagRows: tags,
  };
}

function resolveOrganization(row, organizations) {
  const sourceCode = text(row["組織コード"]);
  const sourceName = text(row["組織名"]);
  const codeMatches = sourceCode
    ? organizations.filter(
        (organization) =>
          normalizeKey(organization.code) === normalizeKey(sourceCode),
      )
    : [];
  if (codeMatches.length === 1) {
    const organization = codeMatches[0];
    return {
      status: "MATCHED",
      organization,
      message:
        normalizeKey(organization.name) === normalizeKey(sourceName)
          ? ""
          : `Code matched; source name "${sourceName}" differs from target name "${organization.name}".`,
    };
  }
  if (codeMatches.length > 1) {
    return {
      status: "CONFLICT",
      message: `Organization code "${sourceCode}" matched multiple targets.`,
    };
  }

  const nameMatches = sourceName
    ? organizations.filter(
        (organization) =>
          normalizeKey(organization.name) === normalizeKey(sourceName),
      )
    : [];
  if (sourceCode) {
    return {
      status: "UNMATCHED",
      message: nameMatches.length
        ? `Organization code "${sourceCode}" did not match; normalized name has ${nameMatches.length} candidate and requires confirmation.`
        : `No organization matched code "${sourceCode}" and name "${sourceName}".`,
    };
  }
  if (nameMatches.length === 1) {
    return {
      status: "MATCHED",
      organization: nameMatches[0],
      message: "Matched by normalized organization name.",
    };
  }
  if (nameMatches.length > 1) {
    return {
      status: "CONFLICT",
      message: `Organization name "${sourceName}" matched multiple targets.`,
    };
  }
  return {
    status: "UNMATCHED",
    message: `No organization matched code "${sourceCode}" and name "${sourceName}".`,
  };
}

function mapEnvironmentPurpose(value) {
  const normalized = normalizeKey(value);
  if (normalized === normalizeKey("生産")) {
    return "PRODUCTION";
  }
  if (normalized === normalizeKey("開発")) {
    return "DEVELOPMENT";
  }
  if (
    normalized === normalizeKey("テスト") ||
    normalized === normalizeKey("受入")
  ) {
    return "VERIFICATION";
  }
  return "OTHER";
}

function mapEnvironmentScope(value) {
  return normalizeKey(value) === normalizeKey("社内")
    ? "INTERNAL"
    : "CUSTOMER";
}

function importedEnvironmentNote(sourcePurpose) {
  const purposeMissing = !text(sourcePurpose);
  return [
    "EnvPortal data.csv から移行しました。",
    purposeMissing
      ? "元データに用途がないため「その他」として登録し、確認待ちです。"
      : "",
    "DB の非秘密項目は移行ステージに保存しました。",
    "ログイン情報と DB 認証情報は移行していません。",
  ]
    .filter(Boolean)
    .join(" ");
}

function existingEnvironmentKey(organizationId, environmentName) {
  return `${organizationId}\n${normalizeKey(environmentName)}`;
}

function sourceIdentity(payload) {
  return {
    organizationCode: text(payload["組織コード"]),
    organizationName: text(payload["組織名"]),
    environmentName: text(payload["構築環境名"]),
  };
}

function planEnvironmentRows({
  source,
  organizations,
  existingEnvironments,
  priorFingerprints,
}) {
  const existingByOrganizationAndName = new Map(
    existingEnvironments.map((environment) => [
      existingEnvironmentKey(
        String(environment.organizationId),
        environment.name,
      ),
      environment,
    ]),
  );

  return source.dataRows.map(({ rowNumber, values }) => {
    const { sanitizedPayload, credentialFieldCount } = sanitizeSourceRow(
      values,
      dataSecretFields,
    );
    const rowFingerprint = fingerprintImportRow(
      "ENVIRONMENT",
      sanitizedPayload,
    );
    const common = {
      sourceFileName: "data.csv",
      sourceRowNumber: rowNumber,
      rowKind: "ENVIRONMENT",
      rowFingerprint,
      sanitizedPayload,
      credentialFieldCount,
      ...sourceIdentity(sanitizedPayload),
    };
    if (priorFingerprints.has(rowFingerprint)) {
      return {
        ...common,
        action: "UNCHANGED",
        resolutionStatus: "UNCHANGED",
        message: "This sanitized source row was imported previously.",
      };
    }

    const resolution = resolveOrganization(
      sanitizedPayload,
      organizations,
    );
    if (resolution.status !== "MATCHED") {
      return {
        ...common,
        action: resolution.status,
        resolutionStatus: resolution.status,
        message: resolution.message,
      };
    }

    const environmentName = text(sanitizedPayload["構築環境名"]);
    if (!environmentName) {
      return {
        ...common,
        action: "CONFLICT",
        resolutionStatus: "CONFLICT",
        organization: resolution.organization,
        message: "Environment name is blank.",
      };
    }
    const existing = existingByOrganizationAndName.get(
      existingEnvironmentKey(
        String(resolution.organization.id),
        environmentName,
      ),
    );
    if (existing) {
      return {
        ...common,
        action: "CONFLICT",
        resolutionStatus: "CONFLICT",
        organization: resolution.organization,
        existingEnvironment: existing,
        message:
          "An active environment with the same name already exists and is not linked to this source row.",
      };
    }

    return {
      ...common,
      action: "IMPORT",
      resolutionStatus: "IMPORTED",
      organization: resolution.organization,
      message: resolution.message,
      environmentInput: {
        name: environmentName,
        scope: mapEnvironmentScope(sanitizedPayload["環境種別"]),
        purpose: mapEnvironmentPurpose(sanitizedPayload["用途"]),
        status: "ACTIVE",
        url: text(sanitizedPayload.URL),
        ownerName: "",
        notes: importedEnvironmentNote(sanitizedPayload["用途"]),
        lastVerifiedAt: "",
      },
    };
  });
}

function hostFromUrl(value) {
  try {
    return new URL(text(value)).hostname.toLocaleLowerCase();
  } catch {
    return "";
  }
}

function hostFromTarget(value) {
  const target = text(value);
  if (!target) {
    return "";
  }
  if (target.startsWith("[")) {
    return target.slice(1).split("]")[0].toLocaleLowerCase();
  }
  return target.split(":")[0].toLocaleLowerCase();
}

function planRdpRows({
  source,
  organizations,
  environmentRows,
  priorFingerprints,
}) {
  return source.rdpRows.map(({ rowNumber, values }) => {
    const { sanitizedPayload, credentialFieldCount } = sanitizeSourceRow(
      values,
      rdpSecretFields,
    );
    const rowFingerprint = fingerprintImportRow("RDP", sanitizedPayload);
    const common = {
      sourceFileName: "rdp.csv",
      sourceRowNumber: rowNumber,
      rowKind: "RDP",
      rowFingerprint,
      sanitizedPayload,
      credentialFieldCount,
      ...sourceIdentity(sanitizedPayload),
    };
    if (priorFingerprints.has(rowFingerprint)) {
      return {
        ...common,
        action: "UNCHANGED",
        resolutionStatus: "UNCHANGED",
        message: "This sanitized source row was staged previously.",
      };
    }
    const resolution = resolveOrganization(
      sanitizedPayload,
      organizations,
    );
    if (resolution.status !== "MATCHED") {
      return {
        ...common,
        action: resolution.status,
        resolutionStatus: resolution.status,
        message: resolution.message,
      };
    }

    const targetHost = hostFromTarget(sanitizedPayload["接続先(IP:Port)"]);
    const environmentMatch = environmentRows.find(
      (row) =>
        row.action === "IMPORT" &&
        String(row.organization.id) === String(resolution.organization.id) &&
        hostFromUrl(row.environmentInput.url) === targetHost,
    );
    return {
      ...common,
      action: "STAGE",
      resolutionStatus: "STAGED",
      organization: resolution.organization,
      linkedEnvironmentFingerprint: environmentMatch?.rowFingerprint ?? "",
      message: environmentMatch
        ? "Organization and host matched an imported environment; endpoint model is pending."
        : "Organization matched; endpoint model and environment assignment are pending.",
    };
  });
}

function planTagRows({
  source,
  organizations,
  environmentRows,
  priorFingerprints,
}) {
  return source.tagRows.map(
    ({ rowNumber, values, credentialFieldCount }) => {
      const sanitizedPayload = values;
      const rowFingerprint = fingerprintImportRow(
        "TAG_ASSOCIATION",
        sanitizedPayload,
      );
      const common = {
        sourceFileName: "tags.json",
        sourceRowNumber: rowNumber,
        rowKind: "TAG_ASSOCIATION",
        rowFingerprint,
        sanitizedPayload,
        credentialFieldCount,
        ...sourceIdentity(sanitizedPayload),
      };
      if (priorFingerprints.has(rowFingerprint)) {
        return {
          ...common,
          action: "UNCHANGED",
          resolutionStatus: "UNCHANGED",
          message: "This sanitized tag association was staged previously.",
        };
      }
      const resolution = resolveOrganization(
        sanitizedPayload,
        organizations,
      );
      if (resolution.status !== "MATCHED") {
        return {
          ...common,
          action: resolution.status,
          resolutionStatus: resolution.status,
          message: resolution.message,
        };
      }
      const environmentMatch = environmentRows.find(
        (row) =>
          row.action === "IMPORT" &&
          String(row.organization.id) === String(resolution.organization.id) &&
          normalizeKey(row.environmentInput.name) ===
            normalizeKey(sanitizedPayload["構築環境名"]),
      );
      return {
        ...common,
        action: "STAGE",
        resolutionStatus: "STAGED",
        organization: resolution.organization,
        linkedEnvironmentFingerprint: environmentMatch?.rowFingerprint ?? "",
        message: environmentMatch
          ? "Environment matched; tag master is pending."
          : "Organization matched; environment and tag master are pending.",
      };
    },
  );
}

export function summarizeImportRows(rows) {
  const summary = {
    total: rows.length,
    imported: 0,
    staged: 0,
    unmatched: 0,
    conflicts: 0,
    unchanged: 0,
    credentialFieldsExcluded: 0,
  };
  for (const row of rows) {
    summary.credentialFieldsExcluded += row.credentialFieldCount;
    if (row.resolutionStatus === "IMPORTED") summary.imported += 1;
    if (row.resolutionStatus === "STAGED") summary.staged += 1;
    if (row.resolutionStatus === "UNMATCHED") summary.unmatched += 1;
    if (row.resolutionStatus === "CONFLICT") summary.conflicts += 1;
    if (row.resolutionStatus === "UNCHANGED") summary.unchanged += 1;
  }
  return summary;
}

function markDuplicateRows(rows) {
  const seen = new Set();
  return rows.map((row) => {
    if (row.resolutionStatus === "UNCHANGED") {
      return row;
    }
    if (seen.has(row.rowFingerprint)) {
      return {
        ...row,
        action: "UNCHANGED",
        resolutionStatus: "UNCHANGED",
        message: "A duplicate sanitized row already exists in this batch.",
      };
    }
    seen.add(row.rowFingerprint);
    return row;
  });
}

export function planEnvPortalImport({
  source,
  organizations,
  existingEnvironments = [],
  priorFingerprints = [],
}) {
  const fingerprintSet = new Set(priorFingerprints);
  const environmentRows = planEnvironmentRows({
    source,
    organizations,
    existingEnvironments,
    priorFingerprints: fingerprintSet,
  });
  const rdpRows = planRdpRows({
    source,
    organizations,
    environmentRows,
    priorFingerprints: fingerprintSet,
  });
  const tagRows = planTagRows({
    source,
    organizations,
    environmentRows,
    priorFingerprints: fingerprintSet,
  });
  const rows = markDuplicateRows([
    ...environmentRows,
    ...rdpRows,
    ...tagRows,
  ]);
  return {
    sourceSystem,
    manifestSha256: source.manifestSha256,
    sourceManifest: source.sourceManifest,
    rows,
    summary: summarizeImportRows(rows),
  };
}

export function publicImportReport(plan, applied = {}) {
  return {
    sourceSystem: plan.sourceSystem,
    manifestSha256: plan.manifestSha256,
    sourceManifest: plan.sourceManifest,
    mode: applied.mode ?? "dry-run",
    batchId: applied.batchId ?? null,
    duplicateBatch: applied.duplicateBatch ?? false,
    summary: applied.summary ?? plan.summary,
    rows: plan.rows.map((row) => ({
      sourceFileName: row.sourceFileName,
      sourceRowNumber: row.sourceRowNumber,
      rowKind: row.rowKind,
      rowFingerprint: row.rowFingerprint,
      resolutionStatus: row.resolutionStatus,
      organizationCode: row.organizationCode,
      organizationName: row.organizationName,
      environmentName: row.environmentName,
      targetOrganizationId: row.organization
        ? String(row.organization.id)
        : null,
      targetOrganizationCode: row.organization?.code ?? null,
      targetEnvironmentId:
        applied.environmentIds?.[row.rowFingerprint] ??
        applied.environmentIds?.[row.linkedEnvironmentFingerprint] ??
        null,
      credentialFieldCount: row.credentialFieldCount,
      message: row.message,
    })),
  };
}
