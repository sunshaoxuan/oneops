import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  attachOneOpsProductSource,
  planEnvPortalImport,
  publicImportReport,
  readEnvPortalSource,
} from "../gateway/envportal-import.mjs";
import { readOneOpsProductCandidates } from "../gateway/oneops-product-source.mjs";
import { loadSystemConfig } from "../gateway/system-config.mjs";
import { resolveSourceFiles } from "../gateway/organization-source.mjs";
import { encryptEndpointCredential } from "../gateway/credential-crypto.mjs";

const { Pool } = pg;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDirectory, "..");
const migrationPaths = [
  "009_create_environment_import_staging.sql",
  "010_allow_envportal_row_reassessment.sql",
  "011_enrich_environment_import_model.sql",
  "012_correct_product_catalog_and_module_versions.sql",
  "013_create_environment_endpoint_credentials.sql",
].map((fileName) => resolve(appRoot, "db/migrations", fileName));

function parseArguments(argv) {
  const options = {
    apply: false,
    sourceRoot: "",
    reportPath: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") {
      options.apply = true;
      continue;
    }
    if (argument === "--dry-run") {
      options.apply = false;
      continue;
    }
    if (argument === "--source-root") {
      options.sourceRoot = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (argument === "--report") {
      options.reportPath = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.sourceRoot) {
    throw new Error("--source-root is required.");
  }
  return options;
}

async function loadTargetState(pool) {
  const [
    organizationResult,
    environmentResult,
    productResult,
    versionResult,
    moduleResult,
    aliasResult,
    stagingTableResult,
  ] =
    await Promise.all([
      pool.query(
        `SELECT id, code, name
         FROM organizations
         ORDER BY code, id`,
      ),
      pool.query(
        `SELECT id, organization_id, name
         FROM environments
         WHERE archived_at IS NULL
         ORDER BY organization_id, name, id`,
      ),
      pool.query(
        `SELECT
           id,
           code,
           name,
           short_name,
           version_selection_mode
         FROM products
         WHERE lifecycle_status = 'ACTIVE'
         ORDER BY sort_order, id`,
      ),
      pool.query(
        `SELECT id, product_id, version, display_version
         FROM product_versions
         WHERE lifecycle_status = 'ACTIVE'
         ORDER BY product_id, id`,
      ),
      pool.query(
        `SELECT id, product_version_id, code, name, short_name
         FROM product_version_modules
         WHERE lifecycle_status = 'ACTIVE'
         ORDER BY product_version_id, sort_order, id`,
      ),
      pool.query(
        `SELECT product_id, alias, alias_kind
         FROM product_aliases
         ORDER BY product_id, alias_kind, id`,
      ),
      pool.query(
        `SELECT to_regclass(
           'public.environment_import_rows'
         ) AS staging_table`,
      ),
    ]);
  let priorFingerprints = [];
  let priorSourceLinks = {};
  if (stagingTableResult.rows[0]?.staging_table) {
    const fingerprintResult = await pool.query(
      `SELECT
         row_fingerprint,
         source_file_name,
         source_row_number,
         environment_id
       FROM environment_import_rows
       WHERE source_system = 'ENVPORTAL'
         AND resolution_status IN (
           'IMPORTED', 'ENRICHED', 'STAGED', 'UNCHANGED'
         )
       ORDER BY id`,
    );
    priorFingerprints = fingerprintResult.rows.map(
      (row) => row.row_fingerprint,
    );
    priorSourceLinks = Object.fromEntries(
      fingerprintResult.rows
        .filter(
          (row) =>
            row.source_file_name === "data.csv" &&
            row.environment_id,
        )
        .map((row) => [
          `${row.source_file_name}:${row.source_row_number}`,
          {
            environmentId: String(row.environment_id),
            rowFingerprint: row.row_fingerprint,
          },
        ]),
    );
  }
  const modulesByVersion = new Map();
  for (const row of moduleResult.rows) {
    const key = String(row.product_version_id);
    const values = modulesByVersion.get(key) ?? [];
    values.push({
      id: String(row.id),
      productVersionId: key,
      code: row.code,
      name: row.name,
      shortName: row.short_name ?? "",
    });
    modulesByVersion.set(key, values);
  }
  const versionsByProduct = new Map();
  for (const row of versionResult.rows) {
    const key = String(row.product_id);
    const values = versionsByProduct.get(key) ?? [];
    values.push({
      id: String(row.id),
      productId: key,
      version: row.version,
      displayVersion: row.display_version ?? "",
      modules: modulesByVersion.get(String(row.id)) ?? [],
    });
    versionsByProduct.set(key, values);
  }
  const aliasesByProduct = new Map();
  for (const row of aliasResult.rows) {
    const key = String(row.product_id);
    const values = aliasesByProduct.get(key) ?? [];
    values.push({
      value: row.alias,
      kind: row.alias_kind,
    });
    aliasesByProduct.set(key, values);
  }
  return {
    organizations: organizationResult.rows.map((row) => ({
      id: String(row.id),
      code: row.code,
      name: row.name,
    })),
    existingEnvironments: environmentResult.rows.map((row) => ({
      id: String(row.id),
      organizationId: String(row.organization_id),
      name: row.name,
    })),
    priorFingerprints,
    priorSourceLinks,
    products: productResult.rows.map((row) => ({
      id: String(row.id),
      code: row.code,
      name: row.name,
      shortName: row.short_name ?? "",
      versionSelectionMode: row.version_selection_mode,
      aliases: aliasesByProduct.get(String(row.id)) ?? [],
      versions: versionsByProduct.get(String(row.id)) ?? [],
    })),
  };
}

async function resolveEnvironmentGroup(
  client,
  organizationId,
  groupName,
) {
  const existing = await client.query(
    `SELECT id
     FROM environment_groups
     WHERE organization_id = $1
       AND archived_at IS NULL
       AND lower(btrim(name)) = lower(btrim($2))
     ORDER BY id
     LIMIT 1`,
    [organizationId, groupName],
  );
  if (existing.rows[0]) {
    return String(existing.rows[0].id);
  }
  const created = await client.query(
    `INSERT INTO environment_groups (
       organization_id, name, sort_order
     )
     SELECT $1, $2, COALESCE(MAX(sort_order), -1) + 1
     FROM environment_groups
     WHERE organization_id = $1
     RETURNING id`,
    [organizationId, groupName],
  );
  return String(created.rows[0].id);
}

async function insertEnvironment(client, row) {
  const organizationId = String(row.organization.id);
  const groupId = await resolveEnvironmentGroup(
    client,
    organizationId,
    row.environmentInput.groupName,
  );
  const sortResult = await client.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
     FROM environments
     WHERE organization_id = $1`,
    [organizationId],
  );
  const environment = row.environmentInput;
  const result = await client.query(
    `INSERT INTO environments (
       organization_id,
       group_id,
       name,
       scope,
       purpose,
       status,
       url,
       owner_name,
       notes,
       sort_order,
       last_verified_at
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, NULLIF($7, ''),
       NULLIF($8, ''), NULLIF($9, ''), $10, NULLIF($11, '')::date
     )
     RETURNING id`,
    [
      organizationId,
      groupId,
      environment.name,
      environment.scope,
      environment.purpose,
      environment.status,
      environment.url,
      environment.ownerName,
      environment.notes,
      Number(sortResult.rows[0]?.next_sort_order ?? 0),
      environment.lastVerifiedAt,
    ],
  );
  return String(result.rows[0].id);
}

async function enrichEnvironment(client, row) {
  const environmentId = String(row.existingEnvironment.id);
  const organizationId = String(row.organization.id);
  const environment = row.environmentInput;
  const groupId = await resolveEnvironmentGroup(
    client,
    organizationId,
    environment.groupName,
  );
  const result = await client.query(
    `UPDATE environments
     SET group_id = $1,
         scope = $2,
         purpose = $3,
         url = NULLIF($4, ''),
         notes = NULLIF($5, ''),
         revision = revision + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
       AND organization_id = $7
     RETURNING id`,
    [
      groupId,
      environment.scope,
      environment.purpose,
      environment.url,
      environment.notes,
      environmentId,
      organizationId,
    ],
  );
  if (!result.rowCount) {
    throw new Error(
      `Previously imported environment ${environmentId} was not found.`,
    );
  }
  return String(result.rows[0].id);
}

async function insertEndpoint(client, environmentId, endpoint, sortOrder) {
  const inserted = await client.query(
    `INSERT INTO environment_endpoints (
       environment_id,
       name,
       role,
       hostname,
       ip_address,
       port,
       protocol,
       database_type,
       database_version,
       database_name,
       notes,
       sort_order
     )
     VALUES (
       $1, $2, $3, NULLIF($4, ''), NULLIF($5, '')::inet,
       $6, NULLIF($7, ''), NULLIF($8, ''), NULLIF($9, ''),
       NULLIF($10, ''), NULLIF($11, ''), $12
     )
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      environmentId,
      endpoint.name,
      endpoint.role,
      endpoint.hostname,
      endpoint.ipAddress,
      endpoint.port,
      endpoint.protocol,
      endpoint.databaseType,
      endpoint.databaseVersion,
      endpoint.databaseName,
      endpoint.notes,
      sortOrder,
    ],
  );
  let endpointId = inserted.rows[0]?.id;
  if (!endpointId) {
    const existing = await client.query(
      `SELECT id
       FROM environment_endpoints
       WHERE environment_id = $1
         AND role = $2
         AND lower(btrim(name)) = lower(btrim($3))
         AND lower(COALESCE(hostname, '')) =
           lower(COALESCE(NULLIF($4, ''), ''))
         AND COALESCE(host(ip_address), '') = COALESCE($5, '')
         AND COALESCE(port, 0) = COALESCE($6, 0)
       ORDER BY id
       LIMIT 1`,
      [
        environmentId,
        endpoint.role,
        endpoint.name,
        endpoint.hostname,
        endpoint.ipAddress,
        endpoint.port,
      ],
    );
    endpointId = existing.rows[0]?.id;
  }
  if (endpointId && endpoint.credential) {
    const encryptedPayload = encryptEndpointCredential(
      endpointId,
      endpoint.credential,
    );
    await client.query(
      `INSERT INTO environment_endpoint_credentials (
         endpoint_id,
         encrypted_payload,
         has_username,
         has_password,
         source_system
       )
       VALUES ($1, $2, $3, $4, 'ENVPORTAL')
       ON CONFLICT (endpoint_id)
       DO UPDATE SET
         encrypted_payload = EXCLUDED.encrypted_payload,
         has_username = EXCLUDED.has_username,
         has_password = EXCLUDED.has_password,
         source_system = EXCLUDED.source_system,
         revision = environment_endpoint_credentials.revision + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [
        endpointId,
        encryptedPayload,
        Boolean(endpoint.credential.username),
        Boolean(endpoint.credential.password),
      ],
    );
  }
  return endpointId ? String(endpointId) : null;
}

async function insertProductLinks(client, environmentId, productLinks) {
  for (const product of productLinks) {
    const linkResult = await client.query(
      `INSERT INTO environment_product_versions (
         environment_id,
         product_version_id,
         usage_status,
         notes,
         confirmation_status
       )
       SELECT $1, version.id, $3, NULLIF($4, ''), $5
       FROM product_versions AS version
       JOIN products AS product ON product.id = version.product_id
       WHERE version.id = $2
         AND version.lifecycle_status = 'ACTIVE'
         AND product.lifecycle_status = 'ACTIVE'
       ON CONFLICT (environment_id, product_version_id)
       DO UPDATE SET
         usage_status = CASE
           WHEN environment_product_versions.confirmation_status =
             'CONFIRMED'
           THEN environment_product_versions.usage_status
           ELSE EXCLUDED.usage_status
         END,
         notes = CASE
           WHEN environment_product_versions.confirmation_status =
             'CONFIRMED'
           THEN environment_product_versions.notes
           ELSE EXCLUDED.notes
         END,
         confirmation_status = CASE
           WHEN environment_product_versions.confirmation_status =
             'CONFIRMED'
           THEN 'CONFIRMED'
           ELSE EXCLUDED.confirmation_status
         END,
         updated_at = CURRENT_TIMESTAMP
       RETURNING product_version_id`,
      [
        environmentId,
        product.productVersionId,
        product.usageStatus,
        product.notes,
        product.confirmationStatus,
      ],
    );
    if (!linkResult.rowCount) {
      throw new Error(
        `Product version ${product.productVersionId} was not found.`,
      );
    }
    for (const moduleId of product.moduleIds) {
      await client.query(
        `INSERT INTO environment_product_version_modules (
           environment_id,
           product_version_id,
           product_version_module_id,
           product_module_id
         )
         SELECT
           $1,
           module.product_version_id,
           module.id,
           module.product_module_id
         FROM product_version_modules AS module
         WHERE module.id = $2
           AND module.product_version_id = $3
           AND module.lifecycle_status = 'ACTIVE'
         ON CONFLICT DO NOTHING`,
        [environmentId, moduleId, product.productVersionId],
      );
    }
  }
}

async function insertProductCandidates(
  client,
  environmentId,
  productCandidates,
) {
  for (const product of productCandidates) {
    const result = await client.query(
      `INSERT INTO environment_product_candidates (
         environment_id,
         product_id,
         source_system,
         confirmation_status,
         notes
       )
       SELECT $1, product.id, $3, $4, NULLIF($5, '')
       FROM products AS product
       WHERE product.id = $2
         AND product.lifecycle_status = 'ACTIVE'
       ON CONFLICT (environment_id, product_id, source_system)
       DO UPDATE SET
         confirmation_status = EXCLUDED.confirmation_status,
         notes = EXCLUDED.notes,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        environmentId,
        product.productId,
        product.sourceSystem,
        product.confirmationStatus,
        product.notes,
      ],
    );
    if (!result.rowCount) {
      throw new Error(
        `Product candidate ${product.productId} was not found.`,
      );
    }
  }
}

async function applyEnvironmentStructure(
  client,
  environmentId,
  row,
) {
  const endpoints = row.environmentInput?.endpointInputs ?? [];
  for (let index = 0; index < endpoints.length; index += 1) {
    await insertEndpoint(client, environmentId, endpoints[index], index);
  }
  await insertProductLinks(
    client,
    environmentId,
    row.environmentInput?.productLinks ?? [],
  );
  await insertProductCandidates(
    client,
    environmentId,
    row.environmentInput?.productCandidates ?? [],
  );
}

async function insertStagingRow(
  client,
  batchId,
  row,
  environmentIds,
) {
  const linkedEnvironmentId =
    environmentIds[row.rowFingerprint] ??
    environmentIds[row.linkedEnvironmentFingerprint] ??
    null;
  await client.query(
    `INSERT INTO environment_import_rows (
       batch_id,
       source_system,
       source_file_name,
       source_row_number,
       row_kind,
       row_fingerprint,
       sanitized_payload,
       credential_field_count,
       resolution_status,
       organization_id,
       environment_id,
       message
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9,
       $10, $11, NULLIF($12, '')
     )
     ON CONFLICT (
       batch_id,
       source_file_name,
       source_row_number
     ) DO NOTHING`,
    [
      batchId,
      "ENVPORTAL",
      row.sourceFileName,
      row.sourceRowNumber,
      row.rowKind,
      row.rowFingerprint,
      JSON.stringify(row.sanitizedPayload),
      row.credentialFieldCount,
      row.resolutionStatus,
      row.organization ? String(row.organization.id) : null,
      linkedEnvironmentId,
      row.message,
    ],
  );
}

async function applyPlan(pool, plan) {
  const migrations = await Promise.all(
    migrationPaths.map((migrationPath) => readFile(migrationPath, "utf8")),
  );
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const migration of migrations) {
      await client.query(migration);
    }
    const duplicate = await client.query(
      `SELECT id, summary
       FROM environment_import_batches
       WHERE source_system = $1
         AND manifest_sha256 = $2`,
      [plan.sourceSystem, plan.manifestSha256],
    );
    if (duplicate.rows[0]) {
      const linkedRows = await client.query(
        `SELECT row_fingerprint, environment_id
         FROM environment_import_rows
         WHERE batch_id = $1
           AND environment_id IS NOT NULL`,
        [duplicate.rows[0].id],
      );
      await client.query("COMMIT");
      return {
        mode: "apply",
        batchId: String(duplicate.rows[0].id),
        duplicateBatch: true,
        summary: duplicate.rows[0].summary,
        environmentIds: Object.fromEntries(
          linkedRows.rows.map((row) => [
            row.row_fingerprint,
            String(row.environment_id),
          ]),
        ),
      };
    }

    const batch = await client.query(
      `INSERT INTO environment_import_batches (
         source_system,
         manifest_sha256,
         source_manifest,
         status
       )
       VALUES ($1, $2, $3::jsonb, 'PLANNED')
       RETURNING id`,
      [
        plan.sourceSystem,
        plan.manifestSha256,
        JSON.stringify(plan.sourceManifest),
      ],
    );
    const batchId = String(batch.rows[0].id);
    const environmentIds = {};

    for (const row of plan.rows) {
      if (row.action === "IMPORT") {
        environmentIds[row.rowFingerprint] = await insertEnvironment(
          client,
          row,
        );
        await applyEnvironmentStructure(
          client,
          environmentIds[row.rowFingerprint],
          row,
        );
      }
      if (row.action === "ENRICH") {
        environmentIds[row.rowFingerprint] = await enrichEnvironment(
          client,
          row,
        );
        await applyEnvironmentStructure(
          client,
          environmentIds[row.rowFingerprint],
          row,
        );
      }
      if (
        row.action === "UNCHANGED" &&
        row.existingEnvironment?.id
      ) {
        environmentIds[row.rowFingerprint] = String(
          row.existingEnvironment.id,
        );
        const credentialEndpoints = row.credentialEndpointInputs ?? [];
        for (
          let index = 0;
          index < credentialEndpoints.length;
          index += 1
        ) {
          await insertEndpoint(
            client,
            environmentIds[row.rowFingerprint],
            credentialEndpoints[index],
            index,
          );
        }
      }
      const linkedEnvironmentId =
        environmentIds[row.linkedEnvironmentFingerprint];
      if (
        linkedEnvironmentId &&
        row.endpointInputs?.length
      ) {
        for (
          let index = 0;
          index < row.endpointInputs.length;
          index += 1
        ) {
          await insertEndpoint(
            client,
            linkedEnvironmentId,
            row.endpointInputs[index],
            100 + index,
          );
        }
      }
      await insertStagingRow(client, batchId, row, environmentIds);
    }

    const status =
      plan.summary.unmatched || plan.summary.conflicts
        ? "PARTIAL"
        : "COMPLETED";
    await client.query(
      `UPDATE environment_import_batches
       SET status = $1,
           summary = $2::jsonb,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, JSON.stringify(plan.summary), batchId],
    );
    await client.query("COMMIT");
    return {
      mode: "apply",
      batchId,
      duplicateBatch: false,
      summary: plan.summary,
      environmentIds,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function writeReport(reportPath, report) {
  if (!reportPath) {
    return;
  }
  const absolutePath = resolve(reportPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(
    absolutePath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!process.env.OPS_DATABASE_URL) {
    throw new Error("OPS_DATABASE_URL is required.");
  }
  const envPortalSource = await readEnvPortalSource(
    resolve(options.sourceRoot),
  );
  const config = await loadSystemConfig();
  const configuredProductSource =
    config.organizationDirectory.dataSources.find(
      (candidate) =>
        candidate.enabled !== false &&
        candidate.type === "xlsx" &&
        candidate.sheetName,
    );
  if (!configuredProductSource) {
    throw new Error(
      "An enabled OneOps organization product source is required.",
    );
  }
  const productSourceFiles = await resolveSourceFiles(
    configuredProductSource.pathPattern,
  );
  if (productSourceFiles.length !== 1) {
    throw new Error(
      "Exactly one OneOps organization product source must match.",
    );
  }
  const productSource = await readOneOpsProductCandidates(
    productSourceFiles[0],
    configuredProductSource.sheetName,
  );
  const source = attachOneOpsProductSource(
    envPortalSource,
    productSource,
  );
  const pool = new Pool({
    connectionString: process.env.OPS_DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });
  try {
    const target = await loadTargetState(pool);
    const plan = planEnvPortalImport({
      source,
      ...target,
    });
    const applied = options.apply
      ? await applyPlan(pool, plan)
      : { mode: "dry-run" };
    const report = publicImportReport(plan, applied);
    await writeReport(options.reportPath, report);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await pool.end();
  }
}

await main();
