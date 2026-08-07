import pg from "pg";

const { Pool } = pg;

function iso(value) {
  return value?.toISOString?.() ?? value ?? null;
}

function mapCandidate(row) {
  return {
    id: String(row.id),
    scanId: String(row.scan_id),
    organizationId: String(row.organization_id),
    fieldCode: String(row.field_code),
    value: row.value_json,
    optionExternalId: row.option_external_id
      ? String(row.option_external_id)
      : null,
    confidence: Number(row.confidence ?? 0),
    evidenceRefs: Array.isArray(row.evidence_refs) ? row.evidence_refs : [],
    status: row.status,
    appliedRecordRefs: Array.isArray(row.applied_record_refs)
      ? row.applied_record_refs
      : [],
    reviewedAt: iso(row.reviewed_at),
    createdAt: iso(row.created_at),
  };
}

function mapSourceSetting(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    purposeCode: row.purpose_code,
    gatewaySettingId: String(row.gateway_setting_id),
    cagProjectId: String(row.cag_project_id),
    cagSourceId: String(row.cag_source_id),
    analysisTemplateCode: row.analysis_template_code,
    analysisTemplateVersion: Number(row.analysis_template_version),
    priority: Number(row.priority),
    enabled: Boolean(row.enabled),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function publicCustomerKnowledgeScanErrorMessage(errorCode) {
  if (!errorCode) return null;
  const messages = {
    REQUEST_SCHEMA_INVALID: "顧客ナレッジスキャン設定を確認してください。",
    KNOWLEDGE_SOURCE_NOT_FOUND: "設定されたナレッジ知識源が見つかりません。",
    KNOWLEDGE_SOURCE_UNAVAILABLE: "ナレッジ知識源を現在利用できません。",
    SCOPE_NOT_FOUND: "対象組織機関に対応する資料範囲が見つかりません。",
    SCOPE_AMBIGUOUS: "対象組織機関の資料範囲を一意に特定できません。",
    INGESTION_FAILED: "対象資料の再取込に失敗しました。",
    EXTRACTION_FAILED: "顧客台帳候補の抽出に失敗しました。",
    EXTRACTION_PARTIAL: "一部資料を処理できませんでした。",
    RETRIEVAL_FAILED: "対象資料内の検索に失敗しました。",
    IDEMPOTENCY_CONFLICT: "同じスキャン識別子に異なる要求が送信されました。",
  };
  return messages[errorCode] ?? "顧客ナレッジスキャンを完了できませんでした。";
}

function mapScan(row, candidates = []) {
  if (!row) return null;
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    subjectExternalId: String(row.subject_external_id),
    sourceSettingId: String(row.source_setting_id),
    cagTaskId: row.cag_task_id ? String(row.cag_task_id) : null,
    cagScopeId: row.cag_scope_id ? String(row.cag_scope_id) : null,
    cagIngestionId: row.cag_ingestion_id ? String(row.cag_ingestion_id) : null,
    parentScanId: row.parent_scan_id ? String(row.parent_scan_id) : null,
    status: row.status,
    querySnapshot: row.query_snapshot ?? {},
    coverage: row.coverage ?? {},
    conflicts: Array.isArray(row.conflicts) ? row.conflicts : [],
    unresolvedFields: Array.isArray(row.unresolved_fields)
      ? row.unresolved_fields
      : [],
    documentFailures: Array.isArray(row.document_failures)
      ? row.document_failures
      : [],
    versions: row.versions ?? {},
    errorCode: row.error_code ?? null,
    errorMessage: publicCustomerKnowledgeScanErrorMessage(row.error_code),
    createdByUserId: row.created_by_user_id
      ? String(row.created_by_user_id)
      : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    completedAt: iso(row.completed_at),
    candidates,
  };
}

function listValue(value) {
  if (Array.isArray(value)) return value;
  return value && typeof value === "object" ? [value] : [];
}

function camel(value, key) {
  const snake = key.replace(/[A-Z]/g, (part) => `_${part.toLowerCase()}`);
  return value?.[key] ?? value?.[snake] ?? null;
}

export function createCustomerKnowledgeScanRepository(
  connectionString,
  onPoolError,
) {
  const pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on("error", (error) => onPoolError?.(error));

  async function candidates(scanId, client = pool) {
    const result = await client.query(
      `SELECT * FROM customer_knowledge_scan_candidates
       WHERE scan_id = $1
       ORDER BY created_at, id`,
      [scanId],
    );
    return result.rows.map(mapCandidate);
  }

  async function scanById(scanId, organizationId = null, client = pool) {
    const result = await client.query(
      `SELECT * FROM customer_knowledge_scans
       WHERE id = $1
         AND ($2::BIGINT IS NULL OR organization_id = $2)`,
      [scanId, organizationId],
    );
    return result.rows[0]
      ? mapScan(result.rows[0], await candidates(scanId, client))
      : null;
  }

  async function updateFailure(scanId, code, message, terminal) {
    await pool.query(
      `UPDATE customer_knowledge_scans
       SET status = CASE WHEN $4 THEN 'FAILED' ELSE status END,
           error_code = $2, error_message = $3,
           completed_at = CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE completed_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [scanId, String(code).slice(0, 100), String(message).slice(0, 1000), terminal],
    );
    return scanById(scanId);
  }

  return {
    async getActiveSourceSetting() {
      const result = await pool.query(
        `SELECT * FROM customer_knowledge_source_settings
         WHERE purpose_code = 'CUSTOMER_LEDGER_EXTRACTION' AND enabled = TRUE
         ORDER BY priority, id
         LIMIT 1`,
      );
      return mapSourceSetting(result.rows[0]);
    },

    async getSourceSetting(settingId) {
      const result = await pool.query(
        "SELECT * FROM customer_knowledge_source_settings WHERE id = $1",
        [settingId],
      );
      return mapSourceSetting(result.rows[0]);
    },

    async listSourceSettings() {
      const result = await pool.query(
        `SELECT * FROM customer_knowledge_source_settings
         ORDER BY purpose_code, priority, id`,
      );
      return result.rows.map(mapSourceSetting);
    },

    async saveSourceSetting(input, actorUserId) {
      const result = await pool.query(
        `INSERT INTO customer_knowledge_source_settings (
           id, purpose_code, gateway_setting_id, cag_project_id, cag_source_id,
           analysis_template_code, analysis_template_version, priority, enabled,
           created_by_user_id, updated_by_user_id
         ) VALUES (
           COALESCE($1::UUID, gen_random_uuid()), 'CUSTOMER_LEDGER_EXTRACTION',
           $2, $3, $4, 'ORGANIZATION_PROFILE_ENRICHMENT', 2, $5, $6, $7, $7
         )
         ON CONFLICT (id) DO UPDATE SET
           gateway_setting_id = EXCLUDED.gateway_setting_id,
           cag_project_id = EXCLUDED.cag_project_id,
           cag_source_id = EXCLUDED.cag_source_id,
           analysis_template_code = EXCLUDED.analysis_template_code,
           analysis_template_version = EXCLUDED.analysis_template_version,
           priority = EXCLUDED.priority,
           enabled = EXCLUDED.enabled,
           updated_by_user_id = EXCLUDED.updated_by_user_id,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          input.id || null,
          input.gatewaySettingId,
          input.cagProjectId,
          input.cagSourceId,
          input.priority,
          input.enabled,
          actorUserId,
        ],
      );
      return mapSourceSetting(result.rows[0]);
    },

    async getExtractionFieldContract() {
      const [classifications, maintenance] = await Promise.all([
        pool.query(
          `SELECT physical_id AS id, code, name AS label
           FROM organization_classifications ORDER BY code`,
        ),
        pool.query(
          `SELECT id, code, label FROM customer_knowledge_field_options
           WHERE field_code = 'maintenance_status' AND enabled = TRUE
           ORDER BY code`,
        ),
      ]);
      return [
        {
          code: "organization_category",
          type: "master_reference",
          required: true,
          options: classifications.rows.map((item) => ({
            id: String(item.id),
            code: item.code,
            label: item.label,
          })),
        },
        { code: "organization_code", type: "string", required: true },
        { code: "organization_name", type: "string", required: true },
        { code: "short_name", type: "string", required: false },
        {
          code: "maintenance_status",
          type: "enum",
          required: false,
          options: maintenance.rows.map((item) => ({
            id: String(item.id),
            code: item.code,
            label: item.label,
          })),
        },
        { code: "remarks", type: "text", required: false },
        {
          code: "contracts",
          type: "object_list",
          required: false,
          schema_ref: "CUSTOMER_CONTRACT_V1",
        },
        {
          code: "services",
          type: "object_list",
          required: false,
          schema_ref: "CUSTOMER_SERVICE_V1",
        },
        {
          code: "vpns",
          type: "object_list",
          required: false,
          schema_ref: "CUSTOMER_VPN_V1",
        },
        {
          code: "environments",
          type: "object_list",
          required: false,
          schema_ref: "CUSTOMER_ENVIRONMENT_V1",
        },
        {
          code: "customizations",
          type: "object_list",
          required: false,
          schema_ref: "CUSTOMER_CUSTOMIZATION_V1",
        },
      ];
    },

    async getOrganization(organizationId) {
      await pool.query(
        `INSERT INTO customer_information_settings (organization_id)
         VALUES ($1) ON CONFLICT (organization_id) DO NOTHING`,
        [organizationId],
      );
      const result = await pool.query(
        `SELECT organization.id, organization.code, organization.name,
                organization.short_name, setting.id AS subject_external_id
         FROM organizations AS organization
         JOIN customer_information_settings AS setting
           ON setting.organization_id = organization.id
         WHERE organization.id = $1`,
        [organizationId],
      );
      const row = result.rows[0];
      return row
        ? {
          id: String(row.id),
          subjectExternalId: String(row.subject_external_id),
          code: String(row.code ?? ""),
          name: String(row.name ?? ""),
          shortName: String(row.short_name ?? ""),
        }
        : null;
    },

    async createScan({
      organizationId,
      subjectExternalId,
      sourceSettingId,
      parentScanId,
      actorUserId,
      querySnapshot,
    }) {
      const result = await pool.query(
        `INSERT INTO customer_knowledge_scans (
           organization_id, subject_external_id, source_setting_id,
           parent_scan_id, query_snapshot, created_by_user_id
         ) VALUES ($1, $2, $3, $4, $5::JSONB, $6)
         RETURNING *`,
        [
          organizationId,
          subjectExternalId,
          sourceSettingId,
          parentScanId,
          JSON.stringify(querySnapshot),
          actorUserId,
        ],
      );
      return mapScan(result.rows[0]);
    },

    async attachTask(scanId, taskId, taskStatus) {
      await pool.query(
        `UPDATE customer_knowledge_scans
         SET cag_task_id = $2,
             status = $3,
             error_code = NULL, error_message = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [scanId, taskId, statusMap(taskStatus)],
      );
      return scanById(scanId);
    },

    async attachIngestion(scanId, ingestionId) {
      await pool.query(
        `UPDATE customer_knowledge_scans
         SET cag_ingestion_id = $2, status = 'INGESTING',
             error_code = NULL, error_message = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [scanId, ingestionId],
      );
      return scanById(scanId);
    },

    getScan(organizationId, scanId) {
      return scanById(scanId, organizationId);
    },

    async getLatestScan(organizationId) {
      const result = await pool.query(
        `SELECT id FROM customer_knowledge_scans
         WHERE organization_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [organizationId],
      );
      return result.rows[0]
        ? scanById(result.rows[0].id, organizationId)
        : null;
    },

    async markStage(scanId, stage, scopeId = null) {
      await pool.query(
        `UPDATE customer_knowledge_scans
         SET status = $2, cag_scope_id = COALESCE($3, cag_scope_id),
             error_code = NULL, error_message = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [scanId, stage, scopeId],
      );
      return scanById(scanId);
    },

    failScan(scanId, code, message) {
      return updateFailure(scanId, code, message, true);
    },

    recordRefreshError(scanId, code, message) {
      return updateFailure(scanId, code, message, false);
    },

    async completeScan(scanId, normalized) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const scanResult = await client.query(
          `SELECT organization_id FROM customer_knowledge_scans
           WHERE id = $1 FOR UPDATE`,
          [scanId],
        );
        const organizationId = scanResult.rows[0]?.organization_id;
        if (!organizationId) throw new Error("Customer scan was not found.");
        for (const candidate of normalized.candidates) {
          await client.query(
            `INSERT INTO customer_knowledge_scan_candidates (
               id, scan_id, organization_id, field_code, value_json,
               option_external_id, confidence, evidence_refs, status
             ) VALUES ($1,$2,$3,$4,$5::JSONB,$6,$7,$8::JSONB,$9)
             ON CONFLICT (id) DO UPDATE SET
               confidence = EXCLUDED.confidence,
               evidence_refs = EXCLUDED.evidence_refs`,
            [
              candidate.id,
              scanId,
              organizationId,
              candidate.fieldCode,
              JSON.stringify(candidate.value),
              candidate.optionExternalId,
              candidate.confidence,
              JSON.stringify(candidate.evidence),
              candidate.status,
            ],
          );
        }
        await client.query(
          `UPDATE customer_knowledge_scans
           SET status = $2, cag_scope_id = $3, coverage = $4::JSONB,
               conflicts = $5::JSONB, unresolved_fields = $6::JSONB,
               document_failures = $7::JSONB, versions = $8::JSONB,
               error_code = $9, error_message = NULL,
               completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [
            scanId,
            normalized.valid ? normalized.status : "FAILED",
            normalized.scopeId,
            JSON.stringify(normalized.coverage),
            JSON.stringify(normalized.conflicts),
            JSON.stringify(normalized.unresolvedFields),
            JSON.stringify(normalized.documentFailures),
            JSON.stringify(normalized.versions),
            normalized.valid ? normalized.errorCode : normalized.errorCode,
          ],
        );
        await client.query("COMMIT");
        return scanById(scanId);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async applyCandidate(organizationId, scanId, candidateId, actorUserId) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query(
          `SELECT candidate.*
           FROM customer_knowledge_scan_candidates AS candidate
           JOIN customer_knowledge_scans AS scan ON scan.id = candidate.scan_id
           WHERE candidate.id = $1 AND candidate.scan_id = $2
             AND candidate.organization_id = $3 AND scan.organization_id = $3
           FOR UPDATE`,
          [candidateId, scanId, organizationId],
        );
        const candidate = result.rows[0];
        if (!candidate || candidate.status !== "PROPOSED") {
          throw Object.assign(new Error("Scan candidate is not applicable."), {
            code: "CUSTOMER_SCAN_CANDIDATE_NOT_APPLICABLE",
          });
        }
        const applied = await applyFieldCandidate(client, candidate, actorUserId);
        await client.query(
          `UPDATE customer_knowledge_scan_candidates
           SET status = 'APPLIED', applied_record_refs = $2::JSONB,
               reviewed_by_user_id = $3, reviewed_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [candidateId, JSON.stringify(applied), actorUserId],
        );
        await client.query("COMMIT");
        return scanById(scanId, organizationId);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },

    async dismissCandidate(organizationId, scanId, candidateId, actorUserId) {
      await pool.query(
        `UPDATE customer_knowledge_scan_candidates
         SET status = 'DISMISSED', reviewed_by_user_id = $4,
             reviewed_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND scan_id = $2 AND organization_id = $3
           AND status IN ('PROPOSED', 'REVIEW_REQUIRED', 'CONFLICT')`,
        [candidateId, scanId, organizationId, actorUserId],
      );
      return scanById(scanId, organizationId);
    },

    async close() {
      await pool.end();
    },
  };
}

function statusMap(value) {
  return {
    queued: "QUEUED",
    resolving_scope: "RESOLVING_SCOPE",
    preparing_documents: "PREPARING_DOCUMENTS",
    ingesting: "INGESTING",
    extracting: "EXTRACTING",
    aggregating: "AGGREGATING",
    review_required: "REVIEW_REQUIRED",
    completed: "COMPLETED",
    failed: "FAILED",
  }[value] ?? "QUEUED";
}

function scalarCandidateValue(value) {
  if (value == null || ["string", "number", "boolean"].includes(typeof value)) {
    return value;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    for (const key of ["value", "text", "label"]) {
      const candidateValue = value[key];
      if (
        candidateValue == null
        || ["string", "number", "boolean"].includes(typeof candidateValue)
      ) {
        if (Object.hasOwn(value, key)) return candidateValue;
      }
    }
  }
  throw Object.assign(new Error("Candidate scalar value is invalid."), {
    code: "CUSTOMER_SCAN_CANDIDATE_VALUE_INVALID",
  });
}

export async function applyFieldCandidate(client, candidate, actorUserId) {
  const field = candidate.field_code;
  const value = candidate.value_json;
  if (["organization_code", "organization_name", "short_name", "remarks"].includes(field)) {
    const column = {
      organization_code: "code",
      organization_name: "name",
      short_name: "short_name",
      remarks: "remarks",
    }[field];
    const scalarValue = scalarCandidateValue(value);
    await client.query(
      `UPDATE organizations SET ${column} = $2 WHERE id = $1`,
      [candidate.organization_id, scalarValue == null ? null : String(scalarValue)],
    );
    return [{ recordType: "ORGANIZATION", recordId: String(candidate.organization_id) }];
  }
  if (field === "organization_category") {
    const updated = await client.query(
      `UPDATE organizations AS organization
       SET classification_id = classification.id
       FROM organization_classifications AS classification
       WHERE organization.id = $1 AND classification.physical_id = $2
       RETURNING classification.physical_id`,
      [candidate.organization_id, candidate.option_external_id],
    );
    if (updated.rowCount !== 1) throw new Error("Classification option is invalid.");
    return [{ recordType: "ORGANIZATION_CLASSIFICATION", recordId: candidate.option_external_id }];
  }
  if (field === "maintenance_status") {
    const option = await client.query(
      `SELECT mapped_value FROM customer_knowledge_field_options
       WHERE id = $1 AND field_code = 'maintenance_status' AND enabled = TRUE`,
      [candidate.option_external_id],
    );
    if (option.rowCount !== 1) throw new Error("Maintenance option is invalid.");
    await client.query(
      `UPDATE organizations SET maintenance_status = $2 WHERE id = $1`,
      [candidate.organization_id, option.rows[0].mapped_value],
    );
    return [{ recordType: "ORGANIZATION", recordId: String(candidate.organization_id) }];
  }
  if (["contracts", "services"].includes(field)) {
    const refs = [];
    for (const item of listValue(value)) {
      const itemType = field === "services" ? "SERVICE" : String(camel(item, "itemType") ?? "SERVICE").toUpperCase();
      const inserted = await client.query(
        `INSERT INTO customer_contracts (
           organization_id, item_type, product_id, service_name,
           introduction_status, introduction_start_date, introduction_end_date,
           maintenance_status, maintenance_start_date, maintenance_end_date,
           notes, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
         RETURNING id`,
        [
          candidate.organization_id,
          itemType,
          camel(item, "productId"),
          itemType === "SERVICE" ? camel(item, "serviceName") : null,
          camel(item, "introductionStatus") ?? "NONE",
          camel(item, "introductionStartDate"),
          camel(item, "introductionEndDate"),
          camel(item, "maintenanceStatus") ?? "NONE",
          camel(item, "maintenanceStartDate"),
          camel(item, "maintenanceEndDate"),
          camel(item, "notes"),
          actorUserId,
        ],
      );
      refs.push({ recordType: "CUSTOMER_CONTRACT", recordId: String(inserted.rows[0].id) });
    }
    return refs;
  }
  if (field === "vpns") {
    const refs = [];
    for (const item of listValue(value)) {
      const inserted = await client.query(
        `INSERT INTO customer_vpn_connections (
           organization_id, name, vpn_type, provider_name, endpoint, status,
           notes, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING id`,
        [
          candidate.organization_id,
          camel(item, "name"),
          camel(item, "vpnType") ?? "OTHER",
          camel(item, "providerName"),
          null,
          ({ PLANNED: "PREPARING", ACTIVE: "ACTIVE", RETIRED: "RETIRED" })[
            String(camel(item, "status") ?? "ACTIVE").toUpperCase()
          ] ?? "ACTIVE",
          camel(item, "notes"),
          actorUserId,
        ],
      );
      refs.push({ recordType: "CUSTOMER_VPN", recordId: String(inserted.rows[0].id) });
    }
    return refs;
  }
  if (field === "customizations") {
    const refs = [];
    for (const item of listValue(value)) {
      const inserted = await client.query(
        `INSERT INTO customer_customizations (
           organization_id, name, category, summary, business_purpose,
           affected_components, status, notes, source_scan_id,
           source_candidate_id, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6::TEXT[],$7,$8,$9,$10,$11,$11)
         RETURNING id`,
        [
          candidate.organization_id,
          camel(item, "name"),
          camel(item, "category"),
          camel(item, "summary"),
          camel(item, "businessPurpose"),
          Array.isArray(camel(item, "affectedComponents"))
            ? camel(item, "affectedComponents").map(String)
            : [],
          String(camel(item, "status") ?? "UNKNOWN").toUpperCase(),
          camel(item, "notes"),
          candidate.scan_id,
          candidate.id,
          actorUserId,
        ],
      );
      refs.push({ recordType: "CUSTOMER_CUSTOMIZATION", recordId: String(inserted.rows[0].id) });
    }
    return refs;
  }
  if (field === "environments") {
    const group = await client.query(
      `INSERT INTO environment_groups (organization_id, name, sort_order)
       VALUES ($1, 'お客様環境', 100)
       ON CONFLICT (organization_id, lower(btrim(name)))
         WHERE archived_at IS NULL
       DO UPDATE SET updated_at = environment_groups.updated_at
       RETURNING id`,
      [candidate.organization_id],
    );
    const refs = [];
    for (const item of listValue(value)) {
      const type = String(camel(item, "environmentType") ?? "OTHER").toUpperCase();
      const status = String(camel(item, "status") ?? "ACTIVE").toUpperCase();
      const inserted = await client.query(
        `INSERT INTO environments (
           organization_id, group_id, name, scope, purpose, status, notes
         ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [
          candidate.organization_id,
          group.rows[0].id,
          camel(item, "name"),
          type === "INTERNAL" ? "INTERNAL" : "CUSTOMER",
          ({ PRODUCTION: "PRODUCTION", VERIFICATION: "VERIFICATION", INTERNAL: "DEVELOPMENT", OTHER: "OTHER" })[type] ?? "OTHER",
          ({ PLANNED: "PREPARING", ACTIVE: "ACTIVE", RETIRED: "RETIRED" })[status] ?? "ACTIVE",
          camel(item, "notes"),
        ],
      );
      const productCode = camel(item, "productCode");
      const productVersion = camel(item, "productVersion");
      if (productCode || productVersion) {
        if (!productCode || !productVersion) {
          throw Object.assign(new Error("Environment product reference is incomplete."), {
            code: "CUSTOMER_SCAN_CANDIDATE_REVIEW_REQUIRED",
          });
        }
        const version = await client.query(
          `SELECT version.id
           FROM product_versions AS version
           JOIN products AS product ON product.id = version.product_id
           WHERE lower(btrim(product.code)) = lower(btrim($1))
             AND (
               lower(btrim(version.version)) = lower(btrim($2))
               OR lower(btrim(COALESCE(version.display_version, ''))) = lower(btrim($2))
             )`,
          [String(productCode), String(productVersion)],
        );
        if (version.rowCount !== 1) {
          throw Object.assign(new Error("Environment product version is unresolved."), {
            code: "CUSTOMER_SCAN_CANDIDATE_REVIEW_REQUIRED",
          });
        }
        await client.query(
          `INSERT INTO environment_product_versions (
             environment_id, product_version_id, usage_status, confirmation_status
           ) VALUES ($1,$2,'ACTIVE','CONFIRMED')`,
          [inserted.rows[0].id, version.rows[0].id],
        );
      }
      refs.push({ recordType: "ENVIRONMENT", recordId: String(inserted.rows[0].id) });
    }
    return refs;
  }
  throw Object.assign(new Error("Candidate requires manual review."), {
    code: "CUSTOMER_SCAN_CANDIDATE_REVIEW_REQUIRED",
  });
}
