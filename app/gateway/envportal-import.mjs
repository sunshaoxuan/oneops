import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourceSystem = "ENVPORTAL";
const importProfileVersion = 3;
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
    `${sourceSystem}\n${importProfileVersion}\n${rowKind}\n${stableJson(sanitizedPayload)}`,
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
    importProfileVersion,
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

export function attachOneOpsProductSource(source, productSource) {
  const sourceManifest = {
    ...source.sourceManifest,
    supportingSources: [
      {
        sourceSystem: productSource.sourceSystem,
        fileName: productSource.fileName,
        sha256: productSource.fileSha256,
        sheetName: productSource.sheetName,
        rowCount: productSource.records.length,
      },
    ],
  };
  return {
    ...source,
    manifestSha256: sha256(stableJson(sourceManifest)),
    sourceManifest,
    oneOpsProductSource: productSource,
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

function mapEnvironmentPurpose(payload) {
  const normalized = normalizeKey(
    [
      payload["用途"],
      payload["環境種別"],
      payload["環境グループ"],
      payload["構築環境名"],
    ]
      .filter(Boolean)
      .join(" "),
  );
  if (
    normalized.includes(normalizeKey("本番")) ||
    normalized.includes(normalizeKey("生産")) ||
    /\bprod(?:uction)?\b/i.test(normalized)
  ) {
    return "PRODUCTION";
  }
  if (
    normalized.includes(normalizeKey("開発")) ||
    /\bdev(?:elopment)?\b/i.test(normalized)
  ) {
    return "DEVELOPMENT";
  }
  if (
    normalized.includes(normalizeKey("検証")) ||
    normalized.includes(normalizeKey("テスト")) ||
    normalized.includes(normalizeKey("受入")) ||
    /\btest\b/i.test(normalized)
  ) {
    return "VERIFICATION";
  }
  if (
    normalized.includes(normalizeKey("研修")) ||
    normalized.includes(normalizeKey("デモ")) ||
    normalizeKey(payload.URL).includes("demo")
  ) {
    return "TRAINING";
  }
  return "OTHER";
}

function mapEnvironmentScope(value) {
  return normalizeKey(value) === normalizeKey("社内")
    ? "INTERNAL"
    : "CUSTOMER";
}

function groupNameForScope(scope) {
  return scope === "INTERNAL" ? "社内環境" : "お客様環境";
}

function importedEnvironmentNote(payload, productCandidates = []) {
  const purpose = mapEnvironmentPurpose(payload);
  return [
    "EnvPortal data.csv から移行しました。",
    "OneOps の環境範囲に基づく環境グループへ配置しました。",
    purpose === "OTHER"
      ? "元データに用途の根拠がないため「その他」のまま確認待ちです。"
      : "元データの環境表現から用途を分類しました。",
    productCandidates.length
      ? "EnvPortal環境名から製品候補を識別しました。モジュールごとの版数は確認待ちです。"
      : "製品は確定できていないため関連付けていません。",
    "URL、DB、認証情報はサーバー・接続へ分離して移行しました。",
  ]
    .filter(Boolean)
    .join(" ");
}

function isIpv4(value) {
  const parts = text(value).split(".");
  return (
    parts.length === 4 &&
    parts.every(
      (part) =>
        /^\d{1,3}$/.test(part) &&
        Number(part) >= 0 &&
        Number(part) <= 255,
    )
  );
}

function endpointAddress(host) {
  return isIpv4(host)
    ? { hostname: "", ipAddress: host }
    : { hostname: host, ipAddress: "" };
}

function credentialInput(username, password) {
  const normalized = {
    username: String(username ?? ""),
    password: String(password ?? ""),
  };
  return normalized.username || normalized.password ? normalized : null;
}

function applicationEndpoint(urlValue, credential = null) {
  try {
    const url = new URL(text(urlValue));
    const protocol = url.protocol.replace(":", "").toUpperCase();
    const port = Number(
      url.port || (url.protocol === "https:" ? 443 : 80),
    );
    return {
      name: "アプリケーション",
      role: "AP",
      ...endpointAddress(url.hostname),
      port,
      protocol,
      databaseType: "",
      databaseVersion: "",
      databaseName: "",
      notes: "EnvPortal URL から移行した接続情報です。",
      credential,
    };
  } catch {
    return null;
  }
}

function databaseEndpoint(payload, credential = null) {
  const databaseType = text(payload["DBタイプ"]);
  const databaseVersion = text(payload["DBバージョン"]);
  const connection = text(payload["DB名"]);
  if (!databaseType && !databaseVersion && !connection) {
    return null;
  }
  const parts = connection.split(":");
  const host = parts[0] ?? "";
  const parsedPort = Number(parts[1]);
  const databaseName = parts.slice(2).join(":") || (
    parts.length === 1 ? connection : ""
  );
  return {
    name: databaseName
      ? `${databaseType || "DB"} ${databaseName}`
      : databaseType || "データベース",
    role: "DB",
    ...endpointAddress(host),
    port:
      Number.isInteger(parsedPort) &&
      parsedPort >= 1 &&
      parsedPort <= 65535
        ? parsedPort
        : null,
    protocol: databaseType.toUpperCase(),
    databaseType,
    databaseVersion,
    databaseName,
    notes: "EnvPortal DB 項目から移行した接続情報です。",
    credential,
  };
}

function rdpEndpoint(payload, credential = null) {
  const target = text(payload["接続先(IP:Port)"]);
  const host = hostFromTarget(target);
  if (!host) {
    return null;
  }
  const portText = target.startsWith("[")
    ? target.split("]:")[1]
    : target.split(":")[1];
  const parsedPort = Number(portText || 3389);
  return {
    name: text(payload["サーバ名"]) || "リモート接続",
    role: "BASTION",
    ...endpointAddress(host),
    port:
      Number.isInteger(parsedPort) &&
      parsedPort >= 1 &&
      parsedPort <= 65535
        ? parsedPort
        : 3389,
    protocol: text(payload["接続タイプ"]) || "RDP",
    databaseType: "",
    databaseVersion: "",
    databaseName: "",
    notes: "EnvPortal RDP 項目から移行した接続情報です。",
    credential,
  };
}

function productAliases(product, aliasKind) {
  return (product.aliases ?? [])
    .filter((alias) => alias.kind === aliasKind)
    .map((alias) => alias.value);
}

function environmentAliasMatches(environmentName, alias) {
  const normalizedName = normalizeKey(environmentName);
  const normalizedAlias = normalizeKey(alias);
  return (
    normalizedName === normalizedAlias ||
    normalizedName.startsWith(`${normalizedAlias}-`)
  );
}

function productCandidatesForEnvironment({
  payload,
  organization,
  productSourceRecords,
  products,
}) {
  const environmentName = text(payload["構築環境名"]);
  const matchedProducts = products.filter((product) =>
    productAliases(product, "ENVIRONMENT").some((alias) =>
      environmentAliasMatches(environmentName, alias),
    ),
  );
  if (matchedProducts.length !== 1) return [];

  const sourceRecord = productSourceRecords.find(
    (record) =>
      normalizeKey(record.organizationCode) ===
      normalizeKey(organization.code),
  );
  if (!sourceRecord) return [];

  const product = matchedProducts[0];
  const sourceAliases = new Set(
    productAliases(product, "SOURCE_COLUMN").map(normalizeKey),
  );
  const evidence = sourceRecord.productCandidates.filter(
    (candidate) =>
      candidate.classification === "AFFIRMATIVE" &&
      sourceAliases.has(normalizeKey(candidate.name)),
  );
  if (!evidence.length) return [];

  return [
    {
      productId: String(product.id),
      productCode: product.code,
      productName: product.name,
      productShortName: product.shortName,
      usageStatus: "PLANNED",
      confirmationStatus: "PENDING",
      sourceSystem: "ENVPORTAL",
      sourceEvidence: evidence.map((candidate) => candidate.name),
      notes:
        `EnvPortal環境名${environmentName}から` +
        `${product.shortName || product.name}を識別しました。` +
        "モジュールごとに導入版数の確認が必要です。",
    },
  ];
}

function existingEnvironmentKey(organizationId, environmentName) {
  return `${organizationId}\n${normalizeKey(environmentName)}`;
}

function sourceRowKey(fileName, rowNumber) {
  return `${fileName}:${rowNumber}`;
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
  priorSourceLinks,
  productSourceRecords,
  products,
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
    const credentialEndpointInputs = [
      applicationEndpoint(
        sanitizedPayload.URL,
        credentialInput(
          values["ログインID"],
          values["ログインパスワード"],
        ),
      ),
      databaseEndpoint(
        sanitizedPayload,
        credentialInput(
          values["DBユーザー名"],
          values["DBパスワード"],
        ),
      ),
    ].filter(Boolean);
    const priorSourceLink =
      priorSourceLinks[sourceRowKey("data.csv", rowNumber)];

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
    const previouslyImported = priorSourceLink
      ? existingEnvironments.find(
          (environment) =>
            String(environment.id) ===
              String(priorSourceLink.environmentId) &&
            String(environment.organizationId) ===
              String(resolution.organization.id),
        )
      : undefined;
    if (priorFingerprints.has(rowFingerprint)) {
      return {
        ...common,
        action: "UNCHANGED",
        resolutionStatus: "UNCHANGED",
        organization: resolution.organization,
        existingEnvironment: previouslyImported,
        credentialEndpointInputs,
        message: "This sanitized source row was imported previously.",
      };
    }
    if (existing && !previouslyImported) {
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

    const scope = mapEnvironmentScope(sanitizedPayload["環境種別"]);
    const productCandidates = productCandidatesForEnvironment({
      payload: sanitizedPayload,
      organization: resolution.organization,
      productSourceRecords,
      products,
    });
    const endpointInputs = credentialEndpointInputs;
    return {
      ...common,
      action: previouslyImported ? "ENRICH" : "IMPORT",
      resolutionStatus: previouslyImported ? "ENRICHED" : "IMPORTED",
      organization: resolution.organization,
      existingEnvironment: previouslyImported,
      message: resolution.message,
      environmentInput: {
        name: environmentName,
        groupName: groupNameForScope(scope),
        scope,
        purpose: mapEnvironmentPurpose(sanitizedPayload),
        status: "ACTIVE",
        url: text(sanitizedPayload.URL),
        ownerName: "",
        notes: importedEnvironmentNote(
          sanitizedPayload,
          productCandidates,
        ),
        lastVerifiedAt: "",
        endpointInputs,
        productLinks: [],
        productCandidates,
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
    const endpointInputs = [
      rdpEndpoint(
        sanitizedPayload,
        credentialInput(
          values["RDPユーザー名"],
          values["RDPパスワード"],
        ),
      ),
    ].filter(Boolean);
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
        ["IMPORT", "ENRICH", "UNCHANGED"].includes(row.action) &&
        String(row.organization.id) === String(resolution.organization.id) &&
        hostFromUrl(
          row.environmentInput?.url ?? row.sanitizedPayload.URL,
        ) === targetHost,
    );
    return {
      ...common,
      action: priorFingerprints.has(rowFingerprint)
        ? "UNCHANGED"
        : "STAGE",
      resolutionStatus: priorFingerprints.has(rowFingerprint)
        ? "UNCHANGED"
        : "STAGED",
      organization: resolution.organization,
      linkedEnvironmentFingerprint: environmentMatch?.rowFingerprint ?? "",
      endpointInputs,
      message: environmentMatch
        ? "Organization and host matched an environment; the RDP endpoint and credential are ready for OneOps."
        : "Organization matched; environment assignment requires confirmation.",
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
          ["IMPORT", "ENRICH", "UNCHANGED"].includes(row.action) &&
          String(row.organization.id) === String(resolution.organization.id) &&
          normalizeKey(
            row.environmentInput?.name ?? row.environmentName,
          ) ===
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

function planProductCandidateRows({
  source,
  organizations,
  environmentRows,
  priorFingerprints,
}) {
  const productSource = source.oneOpsProductSource;
  if (!productSource) {
    return [];
  }
  return productSource.records.flatMap((record) => {
    const resolution = resolveOrganization(
      {
        "組織コード": record.organizationCode,
        "組織名": record.organizationName,
      },
      organizations,
    );
    if (resolution.status !== "MATCHED") {
      return [];
    }
    const environmentMatch = environmentRows.find(
      (row) =>
        ["IMPORT", "ENRICH", "UNCHANGED"].includes(row.action) &&
        String(row.organization?.id) ===
          String(resolution.organization.id) &&
        (row.environmentInput?.productCandidates?.length ?? 0) > 0,
    );
    if (!environmentMatch) {
      return [];
    }
    const sanitizedPayload = {
      "組織コード": record.organizationCode,
      "組織名": record.organizationName,
      "版数候補": record.versionCandidate,
      "製品候補": record.productCandidates,
    };
    const rowFingerprint = fingerprintImportRow(
      "PRODUCT_CANDIDATE",
      sanitizedPayload,
    );
    return [
      {
        sourceFileName: productSource.fileName,
        sourceRowNumber: record.sourceRowNumber,
        rowKind: "PRODUCT_CANDIDATE",
        rowFingerprint,
        sanitizedPayload,
        credentialFieldCount: 0,
        organizationCode: record.organizationCode,
        organizationName: record.organizationName,
        environmentName: environmentMatch.environmentName,
        organization: resolution.organization,
        linkedEnvironmentFingerprint: environmentMatch.rowFingerprint,
        action: priorFingerprints.has(rowFingerprint)
          ? "UNCHANGED"
          : "STAGE",
        resolutionStatus: priorFingerprints.has(rowFingerprint)
          ? "UNCHANGED"
          : "STAGED",
        message:
          "Organization-level product and version evidence is staged for environment-level confirmation.",
      },
    ];
  });
}

export function summarizeImportRows(rows) {
  const summary = {
    total: rows.length,
    imported: 0,
    enriched: 0,
    staged: 0,
    unmatched: 0,
    conflicts: 0,
    unchanged: 0,
    credentialFieldsDetected: 0,
    credentialFieldsPlanned: 0,
    endpointsPlanned: 0,
    productVersionLinksPlanned: 0,
    moduleLinksPlanned: 0,
    productCandidatesStaged: 0,
    environmentProductCandidatesPlanned: 0,
  };
  for (const row of rows) {
    summary.credentialFieldsDetected += row.credentialFieldCount;
    if (row.resolutionStatus === "IMPORTED") summary.imported += 1;
    if (row.resolutionStatus === "ENRICHED") summary.enriched += 1;
    if (row.resolutionStatus === "STAGED") summary.staged += 1;
    if (row.resolutionStatus === "UNMATCHED") summary.unmatched += 1;
    if (row.resolutionStatus === "CONFLICT") summary.conflicts += 1;
    if (row.resolutionStatus === "UNCHANGED") summary.unchanged += 1;
    const endpointInputs =
      row.environmentInput?.endpointInputs ??
      row.credentialEndpointInputs ??
      row.endpointInputs ??
      [];
    summary.endpointsPlanned += endpointInputs.length;
    summary.credentialFieldsPlanned += endpointInputs.reduce(
      (count, endpoint) =>
        count +
        (endpoint.credential?.username ? 1 : 0) +
        (endpoint.credential?.password ? 1 : 0),
      0,
    );
    for (const product of row.environmentInput?.productLinks ?? []) {
      summary.productVersionLinksPlanned += 1;
      summary.moduleLinksPlanned += product.moduleIds.length;
    }
    summary.environmentProductCandidatesPlanned +=
      row.environmentInput?.productCandidates?.length ?? 0;
    if (
      row.rowKind === "PRODUCT_CANDIDATE" &&
      row.resolutionStatus === "STAGED"
    ) {
      summary.productCandidatesStaged += 1;
    }
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
  priorSourceLinks = {},
  products = [],
}) {
  const fingerprintSet = new Set(priorFingerprints);
  const productSourceRecords =
    source.oneOpsProductSource?.records ?? [];
  const environmentRows = planEnvironmentRows({
    source,
    organizations,
    existingEnvironments,
    priorFingerprints: fingerprintSet,
    priorSourceLinks,
    productSourceRecords,
    products,
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
  const productCandidateRows = planProductCandidateRows({
    source,
    organizations,
    environmentRows,
    priorFingerprints: fingerprintSet,
  });
  const rows = markDuplicateRows([
    ...environmentRows,
    ...rdpRows,
    ...tagRows,
    ...productCandidateRows,
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
        row.existingEnvironment?.id ??
        null,
      targetGroupName: row.environmentInput?.groupName ?? null,
      targetScope: row.environmentInput?.scope ?? null,
      targetPurpose: row.environmentInput?.purpose ?? null,
      endpointCount:
        row.environmentInput?.endpointInputs?.length ??
        row.endpointInputs?.length ??
        0,
      productVersions:
        row.environmentInput?.productLinks?.map((product) => ({
          productCode: product.productCode,
          productName: product.productName,
          version: product.displayVersion || product.version,
          confirmationStatus: product.confirmationStatus,
          matchedModuleCount: product.moduleIds.length,
        })) ?? [],
      productCandidates:
        row.environmentInput?.productCandidates?.map((product) => ({
          productCode: product.productCode,
          productName: product.productName,
          productShortName: product.productShortName,
          confirmationStatus: product.confirmationStatus,
          sourceEvidence: product.sourceEvidence,
        })) ?? [],
      credentialFieldCount: row.credentialFieldCount,
      message: row.message,
    })),
  };
}
