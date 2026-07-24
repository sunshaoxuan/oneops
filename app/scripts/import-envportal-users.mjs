import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  buildEnvPortalUserImportPlan,
  envPortalIdentityMetadata,
  publicEnvPortalUserImportPlan,
} from "../gateway/envportal-user-import.mjs";

const { Pool } = pg;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDirectory, "..");

function parseArguments(argv) {
  const options = {
    apply: false,
    sourceRoot: "",
    outputDirectory: "",
    actor: "sun.shaoxuan@onehr.jp",
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
    if (argument === "--output-dir") {
      options.outputDirectory = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (argument === "--actor") {
      options.actor = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.sourceRoot) throw new Error("--source-root is required.");
  if (!options.outputDirectory) {
    throw new Error("--output-dir is required.");
  }
  return options;
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function loadSource(sourceRoot) {
  const usersPath = resolve(sourceRoot, "users.json");
  const rolesPath = resolve(sourceRoot, "roles.json");
  const [usersText, rolesText] = await Promise.all([
    readFile(usersPath, "utf8"),
    readFile(rolesPath, "utf8"),
  ]);
  return {
    usersPath,
    rolesPath,
    usersText,
    rolesText,
    users: JSON.parse(usersText.replace(/^\uFEFF/, "")),
    roles: JSON.parse(rolesText.replace(/^\uFEFF/, "")),
    hashes: {
      users: sha256(usersText),
      roles: sha256(rolesText),
    },
  };
}

async function loadTargetUsers(pool) {
  const result = await pool.query(
    `SELECT
       user_record.id,
       user_record.username,
       user_record.email,
       user_record.display_name,
       user_record.status,
       COALESCE(
         jsonb_agg(
           DISTINCT jsonb_build_object(
             'provider', identity.provider,
             'subject', identity.subject,
             'subjectNormalized', identity.subject_normalized,
             'metadata', identity.metadata
           )
         ) FILTER (WHERE identity.id IS NOT NULL),
         '[]'::jsonb
       ) AS identities,
       COALESCE(
         array_agg(DISTINCT role_record.code)
           FILTER (WHERE role_record.code IS NOT NULL),
         ARRAY[]::text[]
       ) AS roles
     FROM users AS user_record
     LEFT JOIN auth_identities AS identity
       ON identity.user_id = user_record.id
     LEFT JOIN user_role_assignments AS assignment
       ON assignment.user_id = user_record.id
     LEFT JOIN roles AS role_record
       ON role_record.id = assignment.role_id
     GROUP BY user_record.id
     ORDER BY user_record.username`,
  );
  return result.rows;
}

async function applyPlan(pool, plan, actorUsername, sourceHashes) {
  if (plan.conflicts.length) {
    throw new Error(
      `Migration has ${plan.conflicts.length} unresolved conflict(s).`,
    );
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE users IN EXCLUSIVE MODE");
    const actorResult = await client.query(
      "SELECT id FROM users WHERE lower(username) = lower($1)",
      [actorUsername],
    );
    if (!actorResult.rows[0]) {
      throw new Error("Migration actor was not found in OneOps.");
    }
    const actorUserId = actorResult.rows[0].id;
    const applied = [];
    for (const action of plan.actions) {
      const source = action.source;
      let targetUserId = action.targetUserId ?? "";
      if (action.type === "CREATE_USER") {
        const saved = await client.query(
          `INSERT INTO users (
             username,
             email,
             display_name,
             status,
             created_at,
             updated_at,
             last_login_at
           )
           VALUES (
             $1,
             NULLIF($2, ''),
             $3,
             'ACTIVE',
             COALESCE($4::timestamptz, CURRENT_TIMESTAMP),
             CURRENT_TIMESTAMP,
             $5::timestamptz
           )
           RETURNING id`,
          [
            source.username,
            source.email,
            source.displayName,
            source.firstSeen,
            source.lastSeen,
          ],
        );
        targetUserId = String(saved.rows[0].id);
        await client.query(
          `INSERT INTO auth_identities (
             user_id,
             provider,
             subject,
             subject_normalized,
             metadata,
             created_at,
             updated_at,
             last_login_at
           )
           VALUES (
             $1,
             'WINDOWS',
             $2,
             $3,
             $4::jsonb,
             COALESCE($5::timestamptz, CURRENT_TIMESTAMP),
             CURRENT_TIMESTAMP,
             $6::timestamptz
           )`,
          [
            targetUserId,
            source.windowsSubject,
            source.windowsSubjectNormalized,
            JSON.stringify(envPortalIdentityMetadata(source)),
            source.firstSeen,
            source.lastSeen,
          ],
        );
        const assignment = await client.query(
          `INSERT INTO user_role_assignments (
             user_id,
             role_id,
             organization_id,
             created_by_user_id
           )
           SELECT $1, role_record.id, NULL, $3
           FROM roles AS role_record
           WHERE role_record.code = $2
             AND role_record.assignable = true
           RETURNING id`,
          [targetUserId, action.targetRole, actorUserId],
        );
        if (!assignment.rowCount) {
          throw new Error(`OneOps role was not found: ${action.targetRole}`);
        }
      } else if (action.type === "LINK_IDENTITY") {
        await client.query(
          `INSERT INTO auth_identities (
             user_id,
             provider,
             subject,
             subject_normalized,
             metadata,
             created_at,
             updated_at,
             last_login_at
           )
           VALUES (
             $1,
             'WINDOWS',
             $2,
             $3,
             $4::jsonb,
             COALESCE($5::timestamptz, CURRENT_TIMESTAMP),
             CURRENT_TIMESTAMP,
             $6::timestamptz
           )`,
          [
            targetUserId,
            source.windowsSubject,
            source.windowsSubjectNormalized,
            JSON.stringify(envPortalIdentityMetadata(source)),
            source.firstSeen,
            source.lastSeen,
          ],
        );
      } else if (action.type === "MERGE_IDENTITY") {
        await client.query(
          `UPDATE auth_identities
              SET metadata = metadata || $3::jsonb,
                  updated_at = CURRENT_TIMESTAMP,
                  last_login_at = GREATEST(
                    last_login_at,
                    $4::timestamptz
                  )
            WHERE user_id = $1
              AND provider = 'WINDOWS'
              AND subject_normalized = $2`,
          [
            targetUserId,
            source.windowsSubjectNormalized,
            JSON.stringify(envPortalIdentityMetadata(source)),
            source.lastSeen,
          ],
        );
      }
      await client.query(
        `INSERT INTO auth_audit_events (
           actor_user_id,
           event_type,
           target_type,
           target_id,
           details
         )
         VALUES ($1, 'ENVPORTAL_USER_MIGRATED', 'USER', $2, $3::jsonb)`,
        [
          actorUserId,
          targetUserId,
          JSON.stringify({
            sourceSystem: "ENVPORTAL",
            sourceUser: source.sourceUser,
            sourceRole: source.sourceRole,
            targetRole:
              action.type === "CREATE_USER"
                ? action.targetRole
                : "PRESERVE_EXISTING",
            action: action.type,
            sourceHashes,
          }),
        ],
      );
      applied.push({
        sourceUser: source.sourceUser,
        targetUserId,
        action: action.type,
      });
    }
    await client.query("COMMIT");
    return {
      mode: "applied",
      appliedCount: applied.length,
      rows: applied,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function writeArtifacts({
  outputDirectory,
  source,
  targetBefore,
  report,
}) {
  const absoluteOutput = resolve(outputDirectory);
  await mkdir(absoluteOutput, { recursive: true });
  await Promise.all([
    copyFile(
      source.usersPath,
      resolve(absoluteOutput, `source-${basename(source.usersPath)}`),
    ),
    copyFile(
      source.rolesPath,
      resolve(absoluteOutput, `source-${basename(source.rolesPath)}`),
    ),
    writeFile(
      resolve(absoluteOutput, "target-users-before.json"),
      `${JSON.stringify(targetBefore, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      resolve(absoluteOutput, "migration-report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    ),
  ]);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!process.env.OPS_DATABASE_URL) {
    throw new Error("OPS_DATABASE_URL is required.");
  }
  const source = await loadSource(options.sourceRoot);
  const pool = new Pool({
    connectionString: process.env.OPS_DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });
  try {
    const targetBefore = await loadTargetUsers(pool);
    const plan = buildEnvPortalUserImportPlan({
      sourceUsers: source.users,
      targetUsers: targetBefore,
    });
    const applied = options.apply
      ? await applyPlan(pool, plan, options.actor, source.hashes)
      : { mode: "dry-run", appliedCount: 0, rows: [] };
    const report = {
      generatedAt: new Date().toISOString(),
      sourceRoot: resolve(options.sourceRoot),
      sourceHashes: source.hashes,
      sourceRoleCount: Object.keys(source.roles ?? {}).length,
      ...publicEnvPortalUserImportPlan(plan, applied),
    };
    await writeArtifacts({
      outputDirectory: options.outputDirectory,
      source,
      targetBefore,
      report,
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await pool.end();
  }
}

await main();
