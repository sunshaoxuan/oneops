INSERT INTO permissions (code, resource, action, name, description)
VALUES (
  'inquiries.use',
  'inquiries',
  'use',
  '使用问询支援',
  '查询真实工单、读取详情和附件，并手动使用AI辅助'
)
ON CONFLICT (code) DO UPDATE
SET resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_record.id, permission_record.id
FROM roles AS role_record
JOIN permissions AS permission_record
  ON permission_record.code = 'inquiries.use'
WHERE role_record.code IN ('SYSTEM_ADMIN', 'OPERATOR', 'VIEWER')
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS inquiry_source_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT 'ONEHR_UPDS',
  base_url TEXT NOT NULL DEFAULT 'https://ss.onehr.jp/',
  product_code TEXT NOT NULL DEFAULT 'UPDS',
  encrypted_credentials TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  analysis_provider TEXT NOT NULL DEFAULT 'MODEL',
  model_setting_id UUID REFERENCES ai_model_settings(id) ON DELETE SET NULL,
  agent_gateway_setting_id UUID
    REFERENCES agent_gateway_settings(id) ON DELETE SET NULL,
  agent_gateway_project_ref TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inquiry_source_settings_code_check
    CHECK (code = 'ONEHR_UPDS'),
  CONSTRAINT inquiry_source_settings_product_check
    CHECK (product_code = 'UPDS'),
  CONSTRAINT inquiry_source_settings_provider_check
    CHECK (analysis_provider IN ('MODEL', 'AGENT_GATEWAY')),
  CONSTRAINT inquiry_source_settings_revision_positive
    CHECK (revision > 0)
);

CREATE TABLE IF NOT EXISTS inquiry_assist_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no TEXT NOT NULL,
  question_key TEXT NOT NULL,
  focus_message_key TEXT,
  provider TEXT NOT NULL,
  provider_label TEXT NOT NULL,
  model_setting_id UUID REFERENCES ai_model_settings(id) ON DELETE SET NULL,
  agent_gateway_setting_id UUID
    REFERENCES agent_gateway_settings(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  analysis_json JSONB,
  draft_reply TEXT,
  error_code TEXT,
  error_message TEXT,
  requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT inquiry_assist_runs_provider_check
    CHECK (provider IN ('MODEL', 'AGENT_GATEWAY')),
  CONSTRAINT inquiry_assist_runs_status_check
    CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS inquiry_assist_runs_ticket_idx
  ON inquiry_assist_runs (ticket_no, created_at DESC);

CREATE TABLE IF NOT EXISTS inquiry_assist_run_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assist_run_id UUID NOT NULL
    REFERENCES inquiry_assist_runs(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inquiry_assist_run_events_sequence_positive
    CHECK (sequence > 0),
  UNIQUE (assist_run_id, sequence)
);

CREATE INDEX IF NOT EXISTS inquiry_assist_run_events_run_idx
  ON inquiry_assist_run_events (assist_run_id, sequence);
