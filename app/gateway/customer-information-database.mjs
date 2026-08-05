import pg from "pg";
import { isEffectiveContract } from "./customer-information.mjs";

const { Pool } = pg;

function dateValue(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapContract(row) {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    itemType: row.item_type,
    productId: row.product_id ? String(row.product_id) : null,
    productCode: row.product_code ?? null,
    productName: row.product_name ?? null,
    serviceName: row.service_name ?? null,
    introductionStatus: row.introduction_status,
    introductionStartDate: dateValue(row.introduction_start_date),
    introductionEndDate: dateValue(row.introduction_end_date),
    maintenanceStatus: row.maintenance_status,
    maintenanceStartDate: dateValue(row.maintenance_start_date),
    maintenanceEndDate: dateValue(row.maintenance_end_date),
    notes: row.notes ?? "",
    revision: Number(row.revision),
    archivedAt: row.archived_at?.toISOString?.() ?? row.archived_at ?? null,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
  };
}

function mapVpn(row) {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    name: row.name,
    vpnType: row.vpn_type,
    providerName: row.provider_name ?? "",
    endpoint: row.endpoint ?? "",
    status: row.status,
    notes: row.notes ?? "",
    revision: Number(row.revision),
    archivedAt: row.archived_at?.toISOString?.() ?? row.archived_at ?? null,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
  };
}

function mapProject(row) {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    externalProjectId: row.external_project_id,
    projectKey: row.project_key,
    projectName: row.project_name,
  };
}

const contractSelect = `SELECT
  contract.*,
  product.code AS product_code,
  product.name AS product_name
FROM customer_contracts AS contract
LEFT JOIN products AS product ON product.id = contract.product_id`;

export function createCustomerInformationRepository(connectionString, onPoolError) {
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => onPoolError?.(error));

  async function settings(organizationId) {
    const result = await pool.query(
      `SELECT
         organization.id AS organization_id,
         organization.code AS organization_code,
         organization.name AS organization_name,
         organization.short_name AS organization_short_name,
         COALESCE(setting.inquiry_customer_code, organization.code)
           AS inquiry_customer_code,
         COALESCE(setting.revision, 0) AS revision,
         setting.updated_at
       FROM organizations AS organization
       LEFT JOIN customer_information_settings AS setting
         ON setting.organization_id = organization.id
       WHERE organization.id = $1`,
      [organizationId],
    );
    const row = result.rows[0];
    return row
      ? {
        organizationId: String(row.organization_id),
        organizationCode: String(row.organization_code ?? ""),
        organizationName: String(row.organization_name ?? ""),
        organizationShortName: String(row.organization_short_name ?? ""),
        inquiryCustomerCode: row.inquiry_customer_code,
          revision: Number(row.revision),
          updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at ?? null,
        }
      : null;
  }

  async function listContracts(organizationId) {
    const result = await pool.query(
      `${contractSelect}
       WHERE contract.organization_id = $1
         AND contract.archived_at IS NULL
       ORDER BY product.name NULLS LAST, contract.service_name NULLS LAST,
         contract.created_at`,
      [organizationId],
    );
    return result.rows.map(mapContract);
  }

  async function listVpns(organizationId) {
    const result = await pool.query(
      `SELECT * FROM customer_vpn_connections
       WHERE organization_id = $1 AND archived_at IS NULL
       ORDER BY name, created_at`,
      [organizationId],
    );
    return result.rows.map(mapVpn);
  }

  async function listProjects(organizationId) {
    const result = await pool.query(
      `SELECT * FROM customer_backlog_projects
       WHERE organization_id = $1
       ORDER BY project_name, external_project_id`,
      [organizationId],
    );
    return result.rows.map(mapProject);
  }

  async function listEnvironmentProducts(organizationId) {
    const result = await pool.query(
      `SELECT
         product.id AS product_id,
         product.code AS product_code,
         product.name AS product_name,
         COUNT(DISTINCT environment.id)::INTEGER AS environment_count,
         ARRAY_AGG(
           DISTINCT COALESCE(NULLIF(version.display_version, ''), version.version)
         ) AS versions
       FROM environments AS environment
       JOIN environment_product_versions AS relation
         ON relation.environment_id = environment.id
       JOIN product_versions AS version
         ON version.id = relation.product_version_id
       JOIN products AS product ON product.id = version.product_id
       WHERE environment.organization_id = $1
         AND environment.archived_at IS NULL
         AND environment.status = 'ACTIVE'
         AND relation.usage_status = 'ACTIVE'
         AND relation.confirmation_status = 'CONFIRMED'
       GROUP BY product.id, product.code, product.name
       ORDER BY product.name`,
      [organizationId],
    );
    return result.rows.map((row) => ({
      source: "ENVIRONMENT",
      itemType: "PRODUCT",
      productId: String(row.product_id),
      code: row.product_code,
      name: row.product_name,
      environmentCount: Number(row.environment_count),
      versions: row.versions ?? [],
    }));
  }

  return {
    async getInformation(organizationId) {
      const [customerSettings, contracts, vpnConnections, backlogProjects, environmentProducts] =
        await Promise.all([
          settings(organizationId),
          listContracts(organizationId),
          listVpns(organizationId),
          listProjects(organizationId),
          listEnvironmentProducts(organizationId),
        ]);
      if (!customerSettings) return null;
      const activeContracts = contracts
        .filter((contract) => isEffectiveContract(contract))
        .map((contract) => ({
          source: "CONTRACT",
          itemType: contract.itemType,
          productId: contract.productId,
          code: contract.productCode,
          name: contract.productName ?? contract.serviceName,
          introductionStatus: contract.introductionStatus,
          introductionStartDate: contract.introductionStartDate,
          introductionEndDate: contract.introductionEndDate,
          maintenanceStatus: contract.maintenanceStatus,
          maintenanceStartDate: contract.maintenanceStartDate,
          maintenanceEndDate: contract.maintenanceEndDate,
          environmentCount: 0,
          versions: [],
        }));
      const byProductId = new Map(
        environmentProducts.map((item) => [item.productId, item]),
      );
      for (const item of activeContracts) {
        const environmentItem = item.productId
          ? byProductId.get(item.productId)
          : null;
        if (environmentItem) {
          item.environmentCount = environmentItem.environmentCount;
          item.versions = environmentItem.versions;
          byProductId.delete(item.productId);
        }
      }
      return {
        settings: customerSettings,
        contracts,
        activeServices: [...activeContracts, ...byProductId.values()],
        vpnConnections,
        backlogProjects,
      };
    },

    async createContract(organizationId, input, actorUserId) {
      const result = await pool.query(
        `INSERT INTO customer_contracts (
           organization_id, item_type, product_id, service_name,
           introduction_status, introduction_start_date, introduction_end_date,
           maintenance_status, maintenance_start_date, maintenance_end_date,
           notes, created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
         RETURNING id`,
        [
          organizationId,
          input.itemType,
          input.productId,
          input.serviceName,
          input.introductionStatus,
          input.introductionStartDate,
          input.introductionEndDate,
          input.maintenanceStatus,
          input.maintenanceStartDate,
          input.maintenanceEndDate,
          input.notes,
          actorUserId,
        ],
      );
      const saved = await pool.query(
        `${contractSelect} WHERE contract.id = $1 AND contract.organization_id = $2`,
        [result.rows[0].id, organizationId],
      );
      return mapContract(saved.rows[0]);
    },

    async updateContract(organizationId, id, input, actorUserId) {
      const result = await pool.query(
        `UPDATE customer_contracts SET
           item_type = $1, product_id = $2, service_name = $3,
           introduction_status = $4, introduction_start_date = $5,
           introduction_end_date = $6, maintenance_status = $7,
           maintenance_start_date = $8, maintenance_end_date = $9,
           notes = $10, revision = revision + 1,
           updated_by_user_id = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 AND organization_id = $13 AND archived_at IS NULL
           AND revision = $14
         RETURNING id`,
        [
          input.itemType,
          input.productId,
          input.serviceName,
          input.introductionStatus,
          input.introductionStartDate,
          input.introductionEndDate,
          input.maintenanceStatus,
          input.maintenanceStartDate,
          input.maintenanceEndDate,
          input.notes,
          actorUserId,
          id,
          organizationId,
          input.revision,
        ],
      );
      if (!result.rows[0]) return null;
      const saved = await pool.query(
        `${contractSelect} WHERE contract.id = $1 AND contract.organization_id = $2`,
        [id, organizationId],
      );
      return mapContract(saved.rows[0]);
    },

    async archiveContract(organizationId, id, revision, actorUserId) {
      const result = await pool.query(
        `UPDATE customer_contracts SET
           archived_at = CURRENT_TIMESTAMP, revision = revision + 1,
           updated_by_user_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND organization_id = $3 AND archived_at IS NULL
           AND revision = $4
         RETURNING id`,
        [actorUserId, id, organizationId, revision],
      );
      return Boolean(result.rowCount);
    },

    async createVpn(organizationId, input, actorUserId) {
      const result = await pool.query(
        `INSERT INTO customer_vpn_connections (
           organization_id, name, vpn_type, provider_name, endpoint, status,
           notes, created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
         RETURNING *`,
        [
          organizationId,
          input.name,
          input.vpnType,
          input.providerName,
          input.endpoint,
          input.status,
          input.notes,
          actorUserId,
        ],
      );
      return mapVpn(result.rows[0]);
    },

    async updateVpn(organizationId, id, input, actorUserId) {
      const result = await pool.query(
        `UPDATE customer_vpn_connections SET
           name = $1, vpn_type = $2, provider_name = $3, endpoint = $4,
           status = $5, notes = $6, revision = revision + 1,
           updated_by_user_id = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 AND organization_id = $9 AND archived_at IS NULL
           AND revision = $10
         RETURNING *`,
        [
          input.name,
          input.vpnType,
          input.providerName,
          input.endpoint,
          input.status,
          input.notes,
          actorUserId,
          id,
          organizationId,
          input.revision,
        ],
      );
      return result.rows[0] ? mapVpn(result.rows[0]) : null;
    },

    async archiveVpn(organizationId, id, revision, actorUserId) {
      const result = await pool.query(
        `UPDATE customer_vpn_connections SET
           archived_at = CURRENT_TIMESTAMP, revision = revision + 1,
           updated_by_user_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND organization_id = $3 AND archived_at IS NULL
           AND revision = $4
         RETURNING id`,
        [actorUserId, id, organizationId, revision],
      );
      return Boolean(result.rowCount);
    },

    async replaceBacklogProjects(organizationId, projects, actorUserId) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "DELETE FROM customer_backlog_projects WHERE organization_id = $1",
          [organizationId],
        );
        for (const project of projects) {
          await client.query(
            `INSERT INTO customer_backlog_projects (
               organization_id, external_project_id, project_key, project_name,
               created_by_user_id
             ) VALUES ($1, $2, $3, $4, $5)`,
            [
              organizationId,
              project.externalProjectId,
              project.projectKey,
              project.projectName,
              actorUserId,
            ],
          );
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      return listProjects(organizationId);
    },

    listBacklogProjects: listProjects,
    async close() {
      await pool.end();
    },
  };
}
