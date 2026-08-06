CREATE TABLE IF NOT EXISTS customer_knowledge_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  gateway_setting_id UUID NOT NULL
    REFERENCES agent_gateway_settings(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  cag_task_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
  query_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  learning_gaps JSONB NOT NULL DEFAULT '[]'::JSONB,
  knowledge_citations JSONB NOT NULL DEFAULT '[]'::JSONB,
  error_code VARCHAR(100),
  error_message VARCHAR(1000),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  CONSTRAINT customer_knowledge_scans_status_valid
    CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
  CONSTRAINT customer_knowledge_scans_task_unique UNIQUE (cag_task_id)
);

CREATE INDEX IF NOT EXISTS customer_knowledge_scans_organization_idx
  ON customer_knowledge_scans (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS customer_knowledge_scan_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL
    REFERENCES customer_knowledge_scans(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  candidate_type VARCHAR(20) NOT NULL,
  payload JSONB NOT NULL,
  confidence NUMERIC(5, 4) NOT NULL DEFAULT 0,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'PROPOSED',
  applied_contract_id UUID
    REFERENCES customer_contracts(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  applied_vpn_id UUID
    REFERENCES customer_vpn_connections(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  applied_environment_id BIGINT
    REFERENCES environments(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customer_knowledge_scan_candidates_type_valid
    CHECK (candidate_type IN ('CONTRACT', 'VPN', 'ENVIRONMENT')),
  CONSTRAINT customer_knowledge_scan_candidates_status_valid
    CHECK (status IN ('PROPOSED', 'APPLIED', 'DISMISSED', 'REVIEW_REQUIRED')),
  CONSTRAINT customer_knowledge_scan_candidates_confidence_valid
    CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX IF NOT EXISTS customer_knowledge_scan_candidates_scan_idx
  ON customer_knowledge_scan_candidates (scan_id, status, created_at);
