ALTER TABLE customer_knowledge_scans
  ADD COLUMN IF NOT EXISTS cag_ingestion_id UUID;

ALTER TABLE customer_knowledge_source_settings
  DROP CONSTRAINT IF EXISTS customer_knowledge_source_settings_template_valid;

UPDATE customer_knowledge_source_settings
SET analysis_template_version = 2,
    updated_at = CURRENT_TIMESTAMP
WHERE analysis_template_code = 'ORGANIZATION_PROFILE_ENRICHMENT'
  AND analysis_template_version <> 2;

ALTER TABLE customer_knowledge_source_settings
  ADD CONSTRAINT customer_knowledge_source_settings_template_valid
  CHECK (
    analysis_template_code = 'ORGANIZATION_PROFILE_ENRICHMENT'
    AND analysis_template_version = 2
  );

CREATE TABLE IF NOT EXISTS customer_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(120),
  summary TEXT NOT NULL,
  business_purpose TEXT,
  affected_components TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
  notes TEXT,
  source_scan_id UUID NOT NULL
    REFERENCES customer_knowledge_scans(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  source_candidate_id UUID NOT NULL
    REFERENCES customer_knowledge_scan_candidates(id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
  revision INTEGER NOT NULL DEFAULT 1,
  archived_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customer_customizations_name_not_blank
    CHECK (length(btrim(name)) BETWEEN 1 AND 255),
  CONSTRAINT customer_customizations_summary_not_blank
    CHECK (length(btrim(summary)) > 0),
  CONSTRAINT customer_customizations_status_valid
    CHECK (status IN ('PLANNED', 'ACTIVE', 'RETIRED', 'UNKNOWN')),
  CONSTRAINT customer_customizations_revision_positive CHECK (revision > 0)
);

CREATE INDEX IF NOT EXISTS customer_customizations_organization_idx
  ON customer_customizations (organization_id, archived_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS customer_customizations_candidate_idx
  ON customer_customizations (source_candidate_id);
