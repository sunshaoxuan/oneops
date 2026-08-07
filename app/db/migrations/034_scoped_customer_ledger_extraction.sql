CREATE TABLE IF NOT EXISTS customer_knowledge_source_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose_code VARCHAR(64) NOT NULL,
  gateway_setting_id UUID NOT NULL
    REFERENCES agent_gateway_settings(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  cag_project_id UUID NOT NULL,
  cag_source_id UUID NOT NULL,
  analysis_template_code VARCHAR(128) NOT NULL,
  analysis_template_version INTEGER NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customer_knowledge_source_settings_purpose_valid
    CHECK (purpose_code = 'CUSTOMER_LEDGER_EXTRACTION'),
  CONSTRAINT customer_knowledge_source_settings_template_valid
    CHECK (
      analysis_template_code = 'ORGANIZATION_PROFILE_ENRICHMENT'
      AND analysis_template_version = 2
    ),
  CONSTRAINT customer_knowledge_source_settings_priority_positive
    CHECK (priority > 0),
  UNIQUE (purpose_code, priority)
);

ALTER TABLE organization_classifications
  ADD COLUMN IF NOT EXISTS physical_id UUID DEFAULT gen_random_uuid();

UPDATE organization_classifications
SET physical_id = gen_random_uuid()
WHERE physical_id IS NULL;

ALTER TABLE organization_classifications
  ALTER COLUMN physical_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS organization_classifications_physical_id_key
  ON organization_classifications (physical_id);

CREATE TABLE IF NOT EXISTS customer_knowledge_field_options (
  id UUID PRIMARY KEY,
  field_code VARCHAR(128) NOT NULL,
  code VARCHAR(64) NOT NULL,
  label VARCHAR(255) NOT NULL,
  mapped_value VARCHAR(255),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (field_code, code)
);

INSERT INTO customer_knowledge_field_options (
  id, field_code, code, label, mapped_value
)
VALUES
  (
    '61414bb9-5cdd-47b7-a0db-86d630508ebe',
    'maintenance_status', 'YES', '〇', '〇'
  ),
  (
    '4d947b66-1f69-4c3c-a58f-e6fe441c6fea',
    'maintenance_status', 'NO', '✕', '✕'
  ),
  (
    '36604146-a5de-4976-bf90-c0494eb40f1b',
    'maintenance_status', 'UNKNOWN', '空欄', NULL
  )
ON CONFLICT (id) DO UPDATE
SET code = EXCLUDED.code,
    label = EXCLUDED.label,
    mapped_value = EXCLUDED.mapped_value,
    enabled = TRUE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'customer_knowledge_scans'
      AND column_name = 'gateway_setting_id'
  ) THEN
    DROP TABLE IF EXISTS customer_knowledge_scan_candidates;
    DROP TABLE IF EXISTS customer_knowledge_scans;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS customer_knowledge_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  subject_external_id UUID NOT NULL DEFAULT gen_random_uuid(),
  source_setting_id UUID NOT NULL
    REFERENCES customer_knowledge_source_settings(id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
  cag_task_id UUID,
  cag_scope_id UUID,
  cag_ingestion_id UUID,
  parent_scan_id UUID
    REFERENCES customer_knowledge_scans(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
  query_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  coverage JSONB NOT NULL DEFAULT '{}'::JSONB,
  conflicts JSONB NOT NULL DEFAULT '[]'::JSONB,
  unresolved_fields JSONB NOT NULL DEFAULT '[]'::JSONB,
  document_failures JSONB NOT NULL DEFAULT '[]'::JSONB,
  versions JSONB NOT NULL DEFAULT '{}'::JSONB,
  error_code VARCHAR(100),
  error_message VARCHAR(1000),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  CONSTRAINT customer_knowledge_scans_status_valid CHECK (status IN (
    'QUEUED',
    'RESOLVING_SCOPE',
    'PREPARING_DOCUMENTS',
    'INGESTING',
    'EXTRACTING',
    'AGGREGATING',
    'REVIEW_REQUIRED',
    'COMPLETED',
    'FAILED'
  )),
  CONSTRAINT customer_knowledge_scans_task_unique UNIQUE (cag_task_id)
);

CREATE INDEX IF NOT EXISTS customer_knowledge_scans_organization_idx
  ON customer_knowledge_scans (organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS customer_knowledge_scan_candidates (
  id UUID PRIMARY KEY,
  scan_id UUID NOT NULL
    REFERENCES customer_knowledge_scans(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  field_code VARCHAR(128) NOT NULL,
  value_json JSONB NOT NULL,
  option_external_id UUID,
  confidence NUMERIC(5, 4) NOT NULL DEFAULT 0,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  status VARCHAR(32) NOT NULL DEFAULT 'PROPOSED',
  applied_record_refs JSONB NOT NULL DEFAULT '[]'::JSONB,
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customer_knowledge_scan_candidates_status_valid CHECK (status IN (
    'PROPOSED', 'APPLIED', 'DISMISSED', 'CONFLICT', 'REVIEW_REQUIRED'
  )),
  CONSTRAINT customer_knowledge_scan_candidates_confidence_valid
    CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX IF NOT EXISTS customer_knowledge_scan_candidates_scan_idx
  ON customer_knowledge_scan_candidates (scan_id, status, created_at);

INSERT INTO permissions (code, resource, action, name, description)
VALUES
  (
    'customer.knowledge.scan',
    'CUSTOMER_KNOWLEDGE',
    'USE',
    '顧客ナレッジスキャン',
    '顧客の学習済み資料から台帳候補を抽出する'
  ),
  (
    'customer.knowledge.review',
    'CUSTOMER_KNOWLEDGE',
    'REVIEW',
    '顧客ナレッジ候補確認',
    '抽出候補を確認して台帳へ反映する'
  ),
  (
    'customer.knowledge.manage',
    'CUSTOMER_KNOWLEDGE',
    'MANAGE',
    '顧客ナレッジ管理',
    '知識源設定、資料再取込及び再分析を管理する'
  )
ON CONFLICT (code) DO UPDATE
SET resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles AS role
CROSS JOIN permissions AS permission
WHERE role.code = 'SYSTEM_ADMIN'
  AND permission.code IN (
    'customer.knowledge.scan',
    'customer.knowledge.review',
    'customer.knowledge.manage'
  )
ON CONFLICT DO NOTHING;
