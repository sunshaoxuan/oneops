import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  classificationBusinessCode,
  legacyOrganizationCode,
  normalizeOrganization,
  planLegacyOrganizationReconciliation,
  planOrganizationSourceMerge,
} from "./organization.mjs";
import { normalizeOrganizationClassification } from "./organization-classification.mjs";

const { Pool } = pg;
const gatewayDirectory = dirname(fileURLToPath(import.meta.url));
const migrationDirectory = resolve(
  gatewayDirectory,
  "../db/migrations",
);
const migrationLockSql =
  "SELECT pg_advisory_lock(hashtextextended('oneops.schema.migrate', 0))";
const migrationUnlockSql =
  "SELECT pg_advisory_unlock(hashtextextended('oneops.schema.migrate', 0))";

export async function runMigrations(executor) {
  const migrationFiles = (await readdir(migrationDirectory))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();
  await executor.query(migrationLockSql);
  try {
    await executor.query("BEGIN");
    for (const migrationFile of migrationFiles) {
      const migration = await readFile(
        resolve(migrationDirectory, migrationFile),
        "utf8",
      );
      await executor.query(migration);
    }
    await executor.query("COMMIT");
  } catch (error) {
    await executor.query("ROLLBACK");
    throw error;
  } finally {
    await executor.query(migrationUnlockSql);
  }
}

async function resolveClassificationId(executor, name) {
  const normalizedName = String(name ?? "").trim();
  if (!normalizedName) {
    return null;
  }
  const result = await executor.query(
    `INSERT INTO organization_classifications (code, name)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE
       SET updated_at = organization_classifications.updated_at
     RETURNING id`,
    [classificationBusinessCode(normalizedName), normalizedName],
  );
  return String(result.rows[0].id);
}

export function createOrganizationRepository(connectionString, onPoolError) {
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => {
    onPoolError?.(error);
  });

  return {
    async migrate() {
      const client = await pool.connect();
      try {
        await runMigrations(client);
      } finally {
        client.release();
      }
    },

    async ping() {
      await pool.query("SELECT 1");
    },

    async list() {
      const result = await pool.query(
        `SELECT
           organization.id,
           organization.classification_id,
           classification.code AS classification_code,
           classification.name AS classification_name,
           organization.code,
           organization.name,
           organization.short_name,
           organization.maintenance_status,
           organization.remarks,
           setting.inquiry_customer_code,
           setting.inquiry_customer_name,
           setting.inquiry_last_synced_at
         FROM organizations AS organization
         LEFT JOIN organization_classifications AS classification
           ON classification.id = organization.classification_id
         LEFT JOIN customer_information_settings AS setting
           ON setting.organization_id = organization.id
         ORDER BY organization.name, organization.code`,
      );
      return result.rows.map(normalizeOrganization);
    },

    async listClassifications() {
      const result = await pool.query(
        `SELECT id, code, name
         FROM organization_classifications
         ORDER BY name, code`,
      );
      return result.rows.map(normalizeOrganizationClassification);
    },

    async createClassification(classification) {
      const result = await pool.query(
        `INSERT INTO organization_classifications (code, name)
         VALUES ($1, $2)
         RETURNING id, code, name`,
        [classification.code, classification.name],
      );
      return normalizeOrganizationClassification(result.rows[0]);
    },

    async updateClassification(id, classification) {
      const result = await pool.query(
        `UPDATE organization_classifications
         SET code = $1,
             name = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, code, name`,
        [classification.code, classification.name, id],
      );
      return result.rows[0]
        ? normalizeOrganizationClassification(result.rows[0])
        : null;
    },

    async importLegacyNames(names) {
      const uniqueNames = [
        ...new Set(
          names.map((name) => String(name ?? "").trim()).filter(Boolean),
        ),
      ];
      for (const name of uniqueNames) {
        await pool.query(
          `INSERT INTO organizations (code, name)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [legacyOrganizationCode(name), name],
        );
      }
    },

    async create(organization, actorUserId) {
      const inquiryCustomerCode =
        organization.inquiryCustomerCode || null;
      const result = await pool.query(
        `WITH saved AS (
           INSERT INTO organizations (
             classification_id, code, name, short_name, maintenance_status,
             remarks
           )
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, classification_id, code, name, short_name,
             maintenance_status, remarks
         ), mapping AS (
           INSERT INTO customer_information_settings (
             organization_id, inquiry_customer_code, updated_by_user_id
           )
           SELECT id, $7, $8 FROM saved
           ON CONFLICT (organization_id) DO UPDATE
             SET inquiry_customer_code = EXCLUDED.inquiry_customer_code,
                 updated_by_user_id = EXCLUDED.updated_by_user_id,
                 revision = customer_information_settings.revision + 1,
                 updated_at = CURRENT_TIMESTAMP
           RETURNING organization_id
         )
         SELECT saved.*,
           $7 AS inquiry_customer_code
         FROM saved`,
        [
          organization.classificationId || null,
          organization.code,
          organization.name,
          organization.shortName || null,
          organization.maintenanceStatus || null,
          organization.remarks || null,
          inquiryCustomerCode,
          actorUserId || null,
        ],
      );
      const saved = result.rows[0];
      if (saved.classification_id) {
        const classification = await pool.query(
          `SELECT code, name
           FROM organization_classifications
           WHERE id = $1`,
          [saved.classification_id],
        );
        saved.classification_code = classification.rows[0]?.code;
        saved.classification_name = classification.rows[0]?.name;
      }
      return normalizeOrganization(saved);
    },

    async update(id, organization, actorUserId) {
      const inquiryCustomerCode =
        organization.inquiryCustomerCode || null;
      const result = await pool.query(
        `WITH saved AS (
           UPDATE organizations
           SET classification_id = $1,
               code = $2,
               name = $3,
               short_name = $4,
               maintenance_status = $5,
               remarks = $6
           WHERE id = $7
           RETURNING id, classification_id, code, name, short_name,
             maintenance_status, remarks
         ), mapping AS (
           INSERT INTO customer_information_settings (
             organization_id, inquiry_customer_code, updated_by_user_id
           )
           SELECT id, $8, $9 FROM saved
           ON CONFLICT (organization_id) DO UPDATE
             SET inquiry_customer_code = EXCLUDED.inquiry_customer_code,
                 updated_by_user_id = EXCLUDED.updated_by_user_id,
                 revision = customer_information_settings.revision + 1,
                 updated_at = CURRENT_TIMESTAMP
           RETURNING organization_id
         )
         SELECT saved.*,
           $8 AS inquiry_customer_code
         FROM saved`,
        [
          organization.classificationId || null,
          organization.code,
          organization.name,
          organization.shortName || null,
          organization.maintenanceStatus || null,
          organization.remarks || null,
          id,
          inquiryCustomerCode,
          actorUserId || null,
        ],
      );
      const saved = result.rows[0];
      if (!saved) {
        return null;
      }
      if (saved.classification_id) {
        const classification = await pool.query(
          `SELECT code, name
           FROM organization_classifications
           WHERE id = $1`,
          [saved.classification_id],
        );
        saved.classification_code = classification.rows[0]?.code;
        saved.classification_name = classification.rows[0]?.name;
      }
      return normalizeOrganization(saved);
    },

    async listInquirySyncCandidates() {
      const result = await pool.query(
        `SELECT
           organization.id,
           organization.code,
           organization.name,
           organization.short_name,
           setting.inquiry_customer_code AS explicit_inquiry_customer_code,
           setting.inquiry_external_customer_id,
           setting.inquiry_customer_name,
           setting.inquiry_source_setting_id,
           setting.inquiry_last_synced_at
         FROM organizations AS organization
         LEFT JOIN customer_information_settings AS setting
           ON setting.organization_id = organization.id
         ORDER BY organization.code, organization.id`,
      );
      return result.rows.map((row) => ({
        id: String(row.id),
        code: String(row.code),
        name: String(row.name),
        shortName: String(row.short_name ?? ""),
        explicitInquiryCustomerCode: String(
          row.explicit_inquiry_customer_code ?? "",
        ),
        inquiryExternalCustomerId: String(
          row.inquiry_external_customer_id ?? "",
        ),
        inquiryCustomerName: String(row.inquiry_customer_name ?? ""),
        inquirySourceSettingId: row.inquiry_source_setting_id
          ? String(row.inquiry_source_setting_id)
          : null,
        inquiryLastSyncedAt:
          row.inquiry_last_synced_at?.toISOString?.() ??
          row.inquiry_last_synced_at ??
          null,
      }));
    },

    async applyInquiryMappings({ sourceSettingId, mappings }) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        let applied = 0;
        for (const mapping of mappings) {
          const result = await client.query(
            `INSERT INTO customer_information_settings (
               organization_id,
               inquiry_customer_code,
               inquiry_source_setting_id,
               inquiry_external_customer_id,
               inquiry_customer_name,
               inquiry_last_synced_at
             )
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             ON CONFLICT (organization_id) DO UPDATE
               SET inquiry_customer_code = EXCLUDED.inquiry_customer_code,
                   inquiry_source_setting_id = EXCLUDED.inquiry_source_setting_id,
                   inquiry_external_customer_id = COALESCE(
                     EXCLUDED.inquiry_external_customer_id,
                     customer_information_settings.inquiry_external_customer_id
                   ),
                   inquiry_customer_name = EXCLUDED.inquiry_customer_name,
                   inquiry_last_synced_at = CURRENT_TIMESTAMP,
                   revision = customer_information_settings.revision + 1,
                   updated_at = CURRENT_TIMESTAMP
             WHERE customer_information_settings.inquiry_customer_code IS NULL
                OR customer_information_settings.inquiry_customer_code =
                     EXCLUDED.inquiry_customer_code
             RETURNING id`,
            [
              mapping.organizationId,
              mapping.inquiryCustomerCode,
              sourceSettingId,
              mapping.inquiryExternalCustomerId,
              mapping.inquiryCustomerName,
            ],
          );
          applied += result.rowCount;
        }
        await client.query("COMMIT");
        return applied;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async importSourceRecords(sourceId, records) {
      const summary = {
        sourceId,
        inserted: 0,
        reconciled: 0,
        supplemented: 0,
        unchanged: 0,
        conflicts: [],
      };
      for (const record of records) {
        const existingResult = await pool.query(
          `SELECT id, classification_id, code, name, short_name,
             maintenance_status, remarks
           FROM organizations
           WHERE code = $1`,
          [record.code],
        );
        const existing = existingResult.rows[0];
        let mergePlan = planOrganizationSourceMerge(existing, record);
        if (mergePlan.action === "insert") {
          const existingNameResult = await pool.query(
            `SELECT id, classification_id, code, name, short_name,
               maintenance_status, remarks
             FROM organizations
             WHERE name = $1`,
            [record.name],
          );
          const namePlan = planLegacyOrganizationReconciliation(
            existingNameResult.rows[0],
            record,
          );
          if (namePlan.action === "reconcile-legacy-code") {
            const classificationId = await resolveClassificationId(
              pool,
              record.classification,
            );
            await pool.query(
              `UPDATE organizations
               SET code = $1,
                   classification_id = COALESCE(classification_id, $2),
                   short_name = COALESCE(short_name, NULLIF($3, '')),
                   maintenance_status = COALESCE(
                     maintenance_status,
                     NULLIF($4, '')
                   ),
                   remarks = COALESCE(remarks, NULLIF($5, ''))
               WHERE id = $6`,
              [
                record.code,
                classificationId,
                record.shortName,
                record.maintenanceStatus,
                record.remarks,
                namePlan.id,
              ],
            );
            summary.reconciled += 1;
            continue;
          }
          if (namePlan.action === "conflict") {
            summary.conflicts.push({
              type: namePlan.type,
              sourceId,
              sourceRow: record.sourceRow,
              name: record.name,
              existingCode: namePlan.existingCode,
              incomingCode: namePlan.incomingCode,
            });
            continue;
          }
        }
        if (mergePlan.action === "insert") {
          try {
            const classificationId = await resolveClassificationId(
              pool,
              record.classification,
            );
            await pool.query(
              `INSERT INTO organizations (
                 classification_id, code, name, short_name,
                 maintenance_status, remarks
               )
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                classificationId,
                record.code,
                record.name,
                record.shortName || null,
                record.maintenanceStatus || null,
                record.remarks || null,
              ],
            );
            summary.inserted += 1;
          } catch (error) {
            if (error?.code !== "23505") {
              throw error;
            }
            summary.conflicts.push({
              type: "unique-constraint",
              sourceId,
              sourceRow: record.sourceRow,
              code: record.code,
              incomingName: record.name,
            });
          }
          continue;
        }
        if (mergePlan.action === "conflict") {
          summary.conflicts.push({
            type: mergePlan.type,
            sourceId,
            sourceRow: record.sourceRow,
            code: record.code,
            existingName: mergePlan.existingName,
            incomingName: mergePlan.incomingName,
          });
          continue;
        }
        if (mergePlan.action === "unchanged") {
          summary.unchanged += 1;
          continue;
        }
        const classificationId = await resolveClassificationId(
          pool,
          mergePlan.supplements.classificationName,
        );
        const supplemented = await pool.query(
          `UPDATE organizations
           SET classification_id = COALESCE(classification_id, $1),
               short_name = COALESCE(short_name, NULLIF($2, '')),
               maintenance_status = COALESCE(
                 maintenance_status,
                 NULLIF($3, '')
               ),
               remarks = COALESCE(remarks, NULLIF($4, ''))
           WHERE id = $5
             AND (
               (classification_id IS NULL AND $1 IS NOT NULL)
               OR (short_name IS NULL AND NULLIF($2, '') IS NOT NULL)
               OR (
                 maintenance_status IS NULL
                 AND NULLIF($3, '') IS NOT NULL
               )
               OR (remarks IS NULL AND NULLIF($4, '') IS NOT NULL)
             )`,
          [
            classificationId,
            mergePlan.supplements.shortName ?? "",
            mergePlan.supplements.maintenanceStatus ?? "",
            mergePlan.supplements.remarks ?? "",
            existing.id,
          ],
        );
        if (supplemented.rowCount) {
          summary.supplemented += 1;
        }
      }
      return summary;
    },

    async close() {
      await pool.end();
    },
  };
}
