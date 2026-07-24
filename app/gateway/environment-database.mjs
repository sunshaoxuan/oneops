import pg from "pg";

const { Pool } = pg;

function mapGroup(row) {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    name: String(row.name ?? "").trim(),
    sortOrder: Number(row.sort_order ?? 0),
    archivedAt: row.archived_at?.toISOString?.() ?? row.archived_at ?? null,
  };
}

function mapProductVersionModule(row) {
  return {
    id: String(row.id ?? row.product_version_module_id),
    productVersionId: String(row.product_version_id),
    code: String(row.code ?? row.module_code ?? "").trim(),
    name: String(row.name ?? row.module_name ?? "").trim(),
    shortName: String(row.short_name ?? row.module_short_name ?? "").trim(),
    lifecycleStatus: String(row.lifecycle_status ?? "ACTIVE"),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapProductVersion(row, modules = []) {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    version: String(row.version ?? "").trim(),
    displayVersion: String(row.display_version ?? "").trim(),
    lifecycleStatus: String(row.lifecycle_status ?? "ACTIVE"),
    modules,
  };
}

function mapProduct(row, versions = []) {
  return {
    id: String(row.id),
    code: String(row.code ?? "").trim(),
    name: String(row.name ?? "").trim(),
    shortName: String(row.short_name ?? "").trim(),
    lifecycleStatus: String(row.lifecycle_status ?? "ACTIVE"),
    sortOrder: Number(row.sort_order ?? 0),
    versions,
  };
}

function mapEnvironmentProduct(row, modules = []) {
  return {
    productVersionId: String(row.product_version_id),
    productId: String(row.product_id),
    productCode: String(row.product_code ?? "").trim(),
    productName: String(row.product_name ?? "").trim(),
    version: String(row.version ?? "").trim(),
    displayVersion: String(row.display_version ?? "").trim(),
    usageStatus: String(row.usage_status ?? "ACTIVE"),
    notes: String(row.notes ?? "").trim(),
    modules,
  };
}

export function formatDatabaseDate(value) {
  if (!value) {
    return "";
  }
  if (value instanceof Date) {
    const year = String(value.getFullYear()).padStart(4, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const text = String(value);
  const isoDate = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return isoDate ?? "";
}

function mapEnvironment(row, products = []) {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    groupId: String(row.group_id),
    groupName: String(row.group_name ?? "").trim(),
    name: String(row.name ?? "").trim(),
    scope: String(row.scope ?? "CUSTOMER"),
    purpose: String(row.purpose ?? "PRODUCTION"),
    status: String(row.status ?? "ACTIVE"),
    url: String(row.url ?? "").trim(),
    ownerName: String(row.owner_name ?? "").trim(),
    notes: String(row.notes ?? "").trim(),
    sortOrder: Number(row.sort_order ?? 0),
    revision: Number(row.revision ?? 1),
    lastVerifiedAt: formatDatabaseDate(row.last_verified_at),
    archivedAt: row.archived_at?.toISOString?.() ?? row.archived_at ?? null,
    products,
  };
}

async function withTransaction(pool, action) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function businessError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function assertGroup(executor, groupId, organizationId) {
  const result = await executor.query(
    `SELECT id
     FROM environment_groups
     WHERE id = $1
       AND organization_id = $2
       AND archived_at IS NULL`,
    [groupId, organizationId],
  );
  if (!result.rowCount) {
    throw businessError(
      "ENVIRONMENT_GROUP_NOT_FOUND",
      "Environment group does not belong to the selected organization.",
    );
  }
}

async function replaceEnvironmentProducts(executor, environmentId, products) {
  await executor.query(
    `DELETE FROM environment_product_versions
     WHERE environment_id = $1`,
    [environmentId],
  );
  for (const product of products) {
    const result = await executor.query(
      `INSERT INTO environment_product_versions (
         environment_id, product_version_id, usage_status, notes
       )
       SELECT $1, version.id, $3, NULLIF($4, '')
       FROM product_versions AS version
       JOIN products AS product ON product.id = version.product_id
       WHERE version.id = $2
         AND version.lifecycle_status = 'ACTIVE'
         AND product.lifecycle_status = 'ACTIVE'
       RETURNING product_version_id`,
      [
        environmentId,
        product.productVersionId,
        product.usageStatus,
        product.notes,
      ],
    );
    if (!result.rowCount) {
      throw businessError(
        "PRODUCT_VERSION_NOT_FOUND",
        "An active product version could not be found.",
      );
    }
    for (const moduleId of product.moduleIds) {
      const moduleResult = await executor.query(
        `INSERT INTO environment_product_version_modules (
           environment_id,
           product_version_id,
           product_version_module_id
         )
         SELECT $1, module.product_version_id, module.id
         FROM product_version_modules AS module
         WHERE module.id = $2
           AND module.product_version_id = $3
           AND module.lifecycle_status = 'ACTIVE'
         RETURNING product_version_module_id`,
        [environmentId, moduleId, product.productVersionId],
      );
      if (!moduleResult.rowCount) {
        throw businessError(
          "PRODUCT_VERSION_MODULE_NOT_FOUND",
          "An active module belonging to the selected version could not be found.",
        );
      }
    }
  }
}

export function createEnvironmentRepository(connectionString, onPoolError) {
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => onPoolError?.(error));

  return {
    async listInventory(organizationId, { includeArchived = false } = {}) {
      const [
        groupResult,
        environmentResult,
        productResult,
        moduleResult,
      ] = await Promise.all([
        pool.query(
          `SELECT id, organization_id, name, sort_order, archived_at
           FROM environment_groups
           WHERE organization_id = $1
             AND archived_at IS NULL
           ORDER BY sort_order, name, id`,
          [organizationId],
        ),
        pool.query(
          `SELECT
             environment.id,
             environment.organization_id,
             environment.group_id,
             environment_group.name AS group_name,
             environment.name,
             environment.scope,
             environment.purpose,
             environment.status,
             environment.url,
             environment.owner_name,
             environment.notes,
             environment.sort_order,
             environment.revision,
             environment.last_verified_at,
             environment.archived_at
           FROM environments AS environment
           JOIN environment_groups AS environment_group
             ON environment_group.id = environment.group_id
           WHERE environment.organization_id = $1
             AND ($2::boolean OR environment.archived_at IS NULL)
           ORDER BY
             environment_group.sort_order,
             environment.sort_order,
             environment.name,
             environment.id`,
          [organizationId, includeArchived],
        ),
        pool.query(
          `SELECT
             link.environment_id,
             link.product_version_id,
             link.usage_status,
             link.notes,
             version.product_id,
             version.version,
             version.display_version,
             product.code AS product_code,
             product.name AS product_name
           FROM environment_product_versions AS link
           JOIN product_versions AS version
             ON version.id = link.product_version_id
           JOIN products AS product
             ON product.id = version.product_id
           JOIN environments AS environment
             ON environment.id = link.environment_id
           WHERE environment.organization_id = $1
           ORDER BY product.sort_order, product.name, version.version`,
          [organizationId],
        ),
        pool.query(
          `SELECT
             link.environment_id,
             link.product_version_id,
             module.id AS product_version_module_id,
             module.code AS module_code,
             module.name AS module_name,
             module.short_name AS module_short_name,
             module.lifecycle_status,
             module.sort_order
           FROM environment_product_version_modules AS link
           JOIN product_version_modules AS module
             ON module.id = link.product_version_module_id
           JOIN environments AS environment
             ON environment.id = link.environment_id
           WHERE environment.organization_id = $1
           ORDER BY module.sort_order, module.name, module.id`,
          [organizationId],
        ),
      ]);

      const modulesByEnvironmentVersion = new Map();
      for (const row of moduleResult.rows) {
        const key = `${row.environment_id}:${row.product_version_id}`;
        const values = modulesByEnvironmentVersion.get(key) ?? [];
        values.push(mapProductVersionModule(row));
        modulesByEnvironmentVersion.set(key, values);
      }
      const productsByEnvironment = new Map();
      for (const row of productResult.rows) {
        const key = String(row.environment_id);
        const values = productsByEnvironment.get(key) ?? [];
        values.push(
          mapEnvironmentProduct(
            row,
            modulesByEnvironmentVersion.get(
              `${row.environment_id}:${row.product_version_id}`,
            ) ?? [],
          ),
        );
        productsByEnvironment.set(key, values);
      }
      const environments = environmentResult.rows.map((row) =>
        mapEnvironment(row, productsByEnvironment.get(String(row.id)) ?? []),
      );

      return {
        organizationId: String(organizationId),
        groups: groupResult.rows.map(mapGroup),
        environments,
        summary: {
          total: environments.filter((environment) => !environment.archivedAt)
            .length,
          production: environments.filter(
            (environment) =>
              !environment.archivedAt &&
              environment.purpose === "PRODUCTION",
          ).length,
          verification: environments.filter(
            (environment) =>
              !environment.archivedAt &&
              environment.purpose === "VERIFICATION",
          ).length,
          internal: environments.filter(
            (environment) =>
              !environment.archivedAt &&
              environment.scope === "INTERNAL",
          ).length,
          retired: environments.filter(
            (environment) => Boolean(environment.archivedAt),
          ).length,
        },
      };
    },

    async listProducts() {
      const [productResult, versionResult, moduleResult] = await Promise.all([
        pool.query(
          `SELECT id, code, name, short_name, lifecycle_status, sort_order
           FROM products
           WHERE lifecycle_status = 'ACTIVE'
           ORDER BY sort_order, name, code`,
        ),
        pool.query(
          `SELECT id, product_id, version, display_version, lifecycle_status
           FROM product_versions
           WHERE lifecycle_status = 'ACTIVE'
           ORDER BY product_id, version, id`,
        ),
        pool.query(
          `SELECT
             id,
             product_version_id,
             code,
             name,
             short_name,
             lifecycle_status,
             sort_order
           FROM product_version_modules
           WHERE lifecycle_status = 'ACTIVE'
           ORDER BY product_version_id, sort_order, name, id`,
        ),
      ]);
      const modulesByVersion = new Map();
      for (const row of moduleResult.rows) {
        const key = String(row.product_version_id);
        const values = modulesByVersion.get(key) ?? [];
        values.push(mapProductVersionModule(row));
        modulesByVersion.set(key, values);
      }
      const versionsByProduct = new Map();
      for (const row of versionResult.rows) {
        const key = String(row.product_id);
        const values = versionsByProduct.get(key) ?? [];
        values.push(
          mapProductVersion(
            row,
            modulesByVersion.get(String(row.id)) ?? [],
          ),
        );
        versionsByProduct.set(key, values);
      }
      return productResult.rows.map((row) =>
        mapProduct(row, versionsByProduct.get(String(row.id)) ?? []),
      );
    },

    async createProduct(product) {
      const result = await pool.query(
        `INSERT INTO products (code, name, short_name, sort_order)
         VALUES ($1, $2, NULLIF($3, ''), $4)
         RETURNING id, code, name, short_name, lifecycle_status, sort_order`,
        [product.code, product.name, product.shortName, product.sortOrder],
      );
      return mapProduct(result.rows[0], []);
    },

    async createProductVersion(productVersion) {
      const result = await pool.query(
        `INSERT INTO product_versions (
           product_id, version, display_version
         )
         SELECT product.id, $2, NULLIF($3, '')
         FROM products AS product
         WHERE product.id = $1
           AND product.lifecycle_status = 'ACTIVE'
         RETURNING
           id, product_id, version, display_version, lifecycle_status`,
        [
          productVersion.productId,
          productVersion.version,
          productVersion.displayVersion,
        ],
      );
      return result.rows[0] ? mapProductVersion(result.rows[0]) : null;
    },

    async createProductVersionModule(productVersionModule) {
      const result = await pool.query(
        `INSERT INTO product_version_modules (
           product_version_id,
           code,
           name,
           short_name,
           sort_order
         )
         SELECT
           version.id,
           $2,
           $3,
           NULLIF($4, ''),
           $5
         FROM product_versions AS version
         JOIN products AS product ON product.id = version.product_id
         WHERE version.id = $1
           AND version.lifecycle_status = 'ACTIVE'
           AND product.lifecycle_status = 'ACTIVE'
         RETURNING
           id,
           product_version_id,
           code,
           name,
           short_name,
           lifecycle_status,
           sort_order`,
        [
          productVersionModule.productVersionId,
          productVersionModule.code,
          productVersionModule.name,
          productVersionModule.shortName,
          productVersionModule.sortOrder,
        ],
      );
      return result.rows[0]
        ? mapProductVersionModule(result.rows[0])
        : null;
    },

    async createGroup(group) {
      const result = await pool.query(
        `INSERT INTO environment_groups (
           organization_id, name, sort_order
         )
         SELECT organization.id, $2, $3
         FROM organizations AS organization
         WHERE organization.id = $1
         RETURNING id, organization_id, name, sort_order, archived_at`,
        [group.organizationId, group.name, group.sortOrder],
      );
      return result.rows[0] ? mapGroup(result.rows[0]) : null;
    },

    async updateGroup(id, group) {
      const result = await pool.query(
        `UPDATE environment_groups
         SET name = $1,
             sort_order = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
           AND organization_id = $4
           AND archived_at IS NULL
         RETURNING id, organization_id, name, sort_order, archived_at`,
        [group.name, group.sortOrder, id, group.organizationId],
      );
      return result.rows[0] ? mapGroup(result.rows[0]) : null;
    },

    async archiveGroup(id, organizationId) {
      const result = await pool.query(
        `UPDATE environment_groups AS environment_group
         SET archived_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE environment_group.id = $1
           AND environment_group.organization_id = $2
           AND environment_group.archived_at IS NULL
           AND NOT EXISTS (
             SELECT 1
             FROM environments AS environment
             WHERE environment.group_id = environment_group.id
           )
         RETURNING
           id, organization_id, name, sort_order, archived_at`,
        [id, organizationId],
      );
      if (result.rows[0]) {
        return mapGroup(result.rows[0]);
      }
      const existing = await pool.query(
        `SELECT
           environment_group.id,
           EXISTS (
             SELECT 1
             FROM environments AS environment
             WHERE environment.group_id = environment_group.id
           ) AS has_environments
         FROM environment_groups AS environment_group
         WHERE environment_group.id = $1
           AND environment_group.organization_id = $2
           AND environment_group.archived_at IS NULL`,
        [id, organizationId],
      );
      if (existing.rows[0]?.has_environments) {
        throw businessError(
          "ENVIRONMENT_GROUP_NOT_EMPTY",
          "Only an empty environment group can be archived.",
        );
      }
      return null;
    },

    async createEnvironment(environment) {
      return withTransaction(pool, async (client) => {
        await assertGroup(
          client,
          environment.groupId,
          environment.organizationId,
        );
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
           RETURNING
             id, organization_id, group_id, name, scope, purpose, status,
             url, owner_name, notes, sort_order, revision, last_verified_at,
             archived_at`,
          [
            environment.organizationId,
            environment.groupId,
            environment.name,
            environment.scope,
            environment.purpose,
            environment.status,
            environment.url,
            environment.ownerName,
            environment.notes,
            environment.sortOrder,
            environment.lastVerifiedAt,
          ],
        );
        const saved = result.rows[0];
        await replaceEnvironmentProducts(
          client,
          saved.id,
          environment.products,
        );
        const group = await client.query(
          `SELECT name FROM environment_groups WHERE id = $1`,
          [saved.group_id],
        );
        saved.group_name = group.rows[0]?.name;
        const products = await this.getEnvironmentProducts(
          saved.id,
          client,
        );
        return mapEnvironment(saved, products);
      });
    },

    async updateEnvironment(id, environment) {
      return withTransaction(pool, async (client) => {
        await assertGroup(
          client,
          environment.groupId,
          environment.organizationId,
        );
        const result = await client.query(
          `UPDATE environments
           SET group_id = $1,
               name = $2,
               scope = $3,
               purpose = $4,
               status = $5,
               url = NULLIF($6, ''),
               owner_name = NULLIF($7, ''),
               notes = NULLIF($8, ''),
               sort_order = $9,
               last_verified_at = NULLIF($10, '')::date,
               revision = revision + 1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $11
             AND organization_id = $12
             AND revision = $13
             AND archived_at IS NULL
           RETURNING
             id, organization_id, group_id, name, scope, purpose, status,
             url, owner_name, notes, sort_order, revision, last_verified_at,
             archived_at`,
          [
            environment.groupId,
            environment.name,
            environment.scope,
            environment.purpose,
            environment.status,
            environment.url,
            environment.ownerName,
            environment.notes,
            environment.sortOrder,
            environment.lastVerifiedAt,
            id,
            environment.organizationId,
            environment.revision,
          ],
        );
        if (!result.rowCount) {
          const existing = await client.query(
            `SELECT revision
             FROM environments
             WHERE id = $1
               AND organization_id = $2
               AND archived_at IS NULL`,
            [id, environment.organizationId],
          );
          if (existing.rowCount) {
            throw businessError(
              "ENVIRONMENT_REVISION_CONFLICT",
              "The environment was changed by another request.",
            );
          }
          return null;
        }
        const saved = result.rows[0];
        await replaceEnvironmentProducts(
          client,
          saved.id,
          environment.products,
        );
        const group = await client.query(
          `SELECT name FROM environment_groups WHERE id = $1`,
          [saved.group_id],
        );
        saved.group_name = group.rows[0]?.name;
        const products = await this.getEnvironmentProducts(
          saved.id,
          client,
        );
        return mapEnvironment(saved, products);
      });
    },

    async archiveEnvironment(id, organizationId) {
      const result = await pool.query(
        `UPDATE environments
         SET status = 'RETIRED',
             archived_at = CURRENT_TIMESTAMP,
             revision = revision + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
           AND organization_id = $2
           AND archived_at IS NULL
         RETURNING
           id, organization_id, group_id, name, scope, purpose, status,
           url, owner_name, notes, sort_order, revision, last_verified_at,
           archived_at`,
        [id, organizationId],
      );
      if (!result.rows[0]) {
        return null;
      }
      const group = await pool.query(
        `SELECT name FROM environment_groups WHERE id = $1`,
        [result.rows[0].group_id],
      );
      result.rows[0].group_name = group.rows[0]?.name;
      return mapEnvironment(
        result.rows[0],
        await this.getEnvironmentProducts(result.rows[0].id),
      );
    },

    async restoreEnvironment(id, organizationId) {
      const result = await pool.query(
        `UPDATE environments
         SET status = 'ACTIVE',
             archived_at = NULL,
             revision = revision + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
           AND organization_id = $2
           AND archived_at IS NOT NULL
         RETURNING
           id, organization_id, group_id, name, scope, purpose, status,
           url, owner_name, notes, sort_order, revision, last_verified_at,
           archived_at`,
        [id, organizationId],
      );
      if (!result.rows[0]) {
        return null;
      }
      const group = await pool.query(
        `SELECT name FROM environment_groups WHERE id = $1`,
        [result.rows[0].group_id],
      );
      result.rows[0].group_name = group.rows[0]?.name;
      return mapEnvironment(
        result.rows[0],
        await this.getEnvironmentProducts(result.rows[0].id),
      );
    },

    async getEnvironmentProducts(environmentId, executor = pool) {
      const [productResult, moduleResult] = await Promise.all([
        executor.query(
          `SELECT
             link.product_version_id,
             link.usage_status,
             link.notes,
             version.product_id,
             version.version,
             version.display_version,
             product.code AS product_code,
             product.name AS product_name
           FROM environment_product_versions AS link
           JOIN product_versions AS version
             ON version.id = link.product_version_id
           JOIN products AS product
             ON product.id = version.product_id
           WHERE link.environment_id = $1
           ORDER BY product.sort_order, product.name, version.version`,
          [environmentId],
        ),
        executor.query(
          `SELECT
             link.product_version_id,
             module.id AS product_version_module_id,
             module.code AS module_code,
             module.name AS module_name,
             module.short_name AS module_short_name,
             module.lifecycle_status,
             module.sort_order
           FROM environment_product_version_modules AS link
           JOIN product_version_modules AS module
             ON module.id = link.product_version_module_id
           WHERE link.environment_id = $1
           ORDER BY module.sort_order, module.name, module.id`,
          [environmentId],
        ),
      ]);
      const modulesByVersion = new Map();
      for (const row of moduleResult.rows) {
        const key = String(row.product_version_id);
        const values = modulesByVersion.get(key) ?? [];
        values.push(mapProductVersionModule(row));
        modulesByVersion.set(key, values);
      }
      return productResult.rows.map((row) =>
        mapEnvironmentProduct(
          row,
          modulesByVersion.get(String(row.product_version_id)) ?? [],
        ),
      );
    },

    async ensureDefaultGroup(organizationId) {
      const result = await pool.query(
        `INSERT INTO environment_groups (
           organization_id, name, sort_order
         )
         SELECT organization.id, '基本環境', 0
         FROM organizations AS organization
         WHERE organization.id = $1
           AND NOT EXISTS (
             SELECT 1
             FROM environment_groups AS environment_group
             WHERE environment_group.organization_id = organization.id
               AND environment_group.archived_at IS NULL
           )
         RETURNING id, organization_id, name, sort_order, archived_at`,
        [organizationId],
      );
      return result.rows[0] ? mapGroup(result.rows[0]) : null;
    },

    async close() {
      await pool.end();
    },
  };
}
