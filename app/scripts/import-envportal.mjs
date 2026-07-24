import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  planEnvPortalImport,
  publicImportReport,
  readEnvPortalSource,
} from "../gateway/envportal-import.mjs";

const { Pool } = pg;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDirectory, "..");
const migrationPaths = [
  "009_create_environment_import_staging.sql",
  "010_allow_envportal_row_reassessment.sql",
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
  const [organizationResult, environmentResult, stagingTableResult] =
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
        `SELECT to_regclass(
           'public.environment_import_rows'
         ) AS staging_table`,
      ),
    ]);
  let priorFingerprints = [];
  if (stagingTableResult.rows[0]?.staging_table) {
    const fingerprintResult = await pool.query(
      `SELECT row_fingerprint
       FROM environment_import_rows
       WHERE source_system = 'ENVPORTAL'
         AND resolution_status IN ('IMPORTED', 'STAGED')`,
    );
    priorFingerprints = fingerprintResult.rows.map(
      (row) => row.row_fingerprint,
    );
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
  };
}

async function resolveDefaultGroup(client, organizationId) {
  const existing = await client.query(
    `SELECT id
     FROM environment_groups
     WHERE organization_id = $1
       AND archived_at IS NULL
     ORDER BY
       CASE WHEN name = '基本環境' THEN 0 ELSE 1 END,
       sort_order,
       id
     LIMIT 1`,
    [organizationId],
  );
  if (existing.rows[0]) {
    return String(existing.rows[0].id);
  }
  const created = await client.query(
    `INSERT INTO environment_groups (
       organization_id, name, sort_order
     )
     VALUES ($1, '基本環境', 0)
     RETURNING id`,
    [organizationId],
  );
  return String(created.rows[0].id);
}

async function insertEnvironment(client, row) {
  const organizationId = String(row.organization.id);
  const groupId = await resolveDefaultGroup(client, organizationId);
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
  const source = await readEnvPortalSource(resolve(options.sourceRoot));
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
