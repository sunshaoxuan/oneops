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
    candidateType: row.candidate_type,
    payload: row.payload ?? {},
    confidence: Number(row.confidence ?? 0),
    evidenceRefs: Array.isArray(row.evidence_refs) ? row.evidence_refs : [],
    status: row.status,
    appliedContractId: row.applied_contract_id
      ? String(row.applied_contract_id)
      : null,
    appliedVpnId: row.applied_vpn_id ? String(row.applied_vpn_id) : null,
    appliedEnvironmentId: row.applied_environment_id
      ? String(row.applied_environment_id)
      : null,
    reviewedAt: iso(row.reviewed_at),
    createdAt: iso(row.created_at),
  };
}

function mapScan(row, candidates = []) {
  if (!row) return null;
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    gatewaySettingId: String(row.gateway_setting_id),
    cagTaskId: row.cag_task_id ? String(row.cag_task_id) : null,
    status: row.status,
    querySnapshot: row.query_snapshot ?? {},
    learningGaps: Array.isArray(row.learning_gaps) ? row.learning_gaps : [],
    knowledgeCitations: Array.isArray(row.knowledge_citations)
      ? row.knowledge_citations
      : [],
    errorCode: row.error_code ?? null,
    errorMessage: row.error_message ?? null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    completedAt: iso(row.completed_at),
    candidates,
  };
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
    async getOrganization(organizationId) {
      const result = await pool.query(
        `SELECT id, code, name, short_name
         FROM organizations WHERE id = $1`,
        [organizationId],
      );
      const row = result.rows[0];
      return row
        ? {
          id: String(row.id),
          code: String(row.code ?? ""),
          name: String(row.name ?? ""),
          shortName: String(row.short_name ?? ""),
        }
        : null;
    },

    async createScan({
      organizationId,
      gatewaySettingId,
      actorUserId,
      querySnapshot,
    }) {
      const result = await pool.query(
        `INSERT INTO customer_knowledge_scans (
           organization_id, gateway_setting_id, query_snapshot,
           created_by_user_id
         ) VALUES ($1, $2, $3::JSONB, $4)
         RETURNING *`,
        [organizationId, gatewaySettingId, JSON.stringify(querySnapshot), actorUserId],
      );
      return mapScan(result.rows[0]);
    },

    async attachTask(scanId, taskId, taskStatus) {
      await pool.query(
        `UPDATE customer_knowledge_scans
         SET cag_task_id = $2,
             status = CASE WHEN $3 = 'queued' THEN 'QUEUED' ELSE 'RUNNING' END,
             error_code = NULL, error_message = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [scanId, taskId, taskStatus],
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

    async markRunning(scanId) {
      await pool.query(
        `UPDATE customer_knowledge_scans
         SET status = 'RUNNING', error_code = NULL, error_message = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [scanId],
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
        await client.query(
          "DELETE FROM customer_knowledge_scan_candidates WHERE scan_id = $1",
          [scanId],
        );
        const scanResult = await client.query(
          `SELECT organization_id FROM customer_knowledge_scans
           WHERE id = $1 FOR UPDATE`,
          [scanId],
        );
        const organizationId = scanResult.rows[0]?.organization_id;
        if (!organizationId) throw new Error("Customer scan was not found.");
        for (const candidate of normalized.candidates) {
          const payload = { ...candidate.payload };
          let status = candidate.status ?? "PROPOSED";
          if (
            candidate.candidateType === "CONTRACT" &&
            payload.itemType === "PRODUCT"
          ) {
            const product = await client.query(
              `SELECT id, name FROM products
               WHERE upper(code) = upper($1) AND lifecycle_status = 'ACTIVE'`,
              [payload.productCode],
            );
            if (product.rowCount === 1) {
              payload.productId = String(product.rows[0].id);
              payload.productName = product.rows[0].name;
            } else {
              status = "REVIEW_REQUIRED";
            }
          }
          await client.query(
            `INSERT INTO customer_knowledge_scan_candidates (
               scan_id, organization_id, candidate_type, payload,
               confidence, evidence_refs, status
             ) VALUES ($1, $2, $3, $4::JSONB, $5, $6::JSONB, $7)`,
            [
              scanId,
              organizationId,
              candidate.candidateType,
              JSON.stringify(payload),
              candidate.confidence,
              JSON.stringify(candidate.evidence),
              status,
            ],
          );
        }
        await client.query(
          `UPDATE customer_knowledge_scans
           SET status = $2, learning_gaps = $3::JSONB,
               knowledge_citations = $4::JSONB,
               error_code = $5, error_message = NULL,
               completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [
            scanId,
            normalized.valid ? "COMPLETED" : "FAILED",
            JSON.stringify(normalized.learningGaps),
            JSON.stringify(normalized.citations),
            normalized.valid ? null : normalized.errorCode,
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
             AND candidate.organization_id = $3
             AND scan.organization_id = $3
           FOR UPDATE`,
          [candidateId, scanId, organizationId],
        );
        const candidate = result.rows[0];
        if (!candidate || candidate.status !== "PROPOSED") {
          throw Object.assign(new Error("Scan candidate is not applicable."), {
            code: "CUSTOMER_SCAN_CANDIDATE_NOT_APPLICABLE",
          });
        }
        const payload = candidate.payload ?? {};
        let appliedContractId = null;
        let appliedVpnId = null;
        if (candidate.candidate_type === "CONTRACT") {
          if (payload.itemType === "PRODUCT" && !payload.productId) {
            throw Object.assign(new Error("Product Code could not be resolved."), {
              code: "CUSTOMER_SCAN_PRODUCT_UNRESOLVED",
            });
          }
          const inserted = await client.query(
            `INSERT INTO customer_contracts (
               organization_id, item_type, product_id, service_name,
               introduction_status, introduction_start_date, introduction_end_date,
               maintenance_status, maintenance_start_date, maintenance_end_date,
               notes, created_by_user_id, updated_by_user_id
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
             RETURNING id`,
            [
              organizationId,
              payload.itemType,
              payload.productId,
              payload.serviceName,
              payload.introductionStatus,
              payload.introductionStartDate,
              payload.introductionEndDate,
              payload.maintenanceStatus,
              payload.maintenanceStartDate,
              payload.maintenanceEndDate,
              payload.notes,
              actorUserId,
            ],
          );
          appliedContractId = inserted.rows[0].id;
        } else if (candidate.candidate_type === "VPN") {
          const inserted = await client.query(
            `INSERT INTO customer_vpn_connections (
               organization_id, name, vpn_type, provider_name, endpoint, status,
               notes, created_by_user_id, updated_by_user_id
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
             RETURNING id`,
            [
              organizationId,
              payload.name,
              payload.vpnType,
              payload.providerName,
              payload.endpoint,
              payload.status,
              payload.notes,
              actorUserId,
            ],
          );
          appliedVpnId = inserted.rows[0].id;
        } else {
          throw Object.assign(new Error("Environment candidate requires review."), {
            code: "CUSTOMER_SCAN_ENVIRONMENT_REVIEW_REQUIRED",
          });
        }
        await client.query(
          `UPDATE customer_knowledge_scan_candidates
           SET status = 'APPLIED', applied_contract_id = $2,
               applied_vpn_id = $3, reviewed_by_user_id = $4,
               reviewed_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [candidateId, appliedContractId, appliedVpnId, actorUserId],
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
           AND status IN ('PROPOSED', 'REVIEW_REQUIRED')`,
        [candidateId, scanId, organizationId, actorUserId],
      );
      return scanById(scanId, organizationId);
    },

    async close() {
      await pool.end();
    },
  };
}
