CREATE TABLE IF NOT EXISTS ai_model_usage_calls (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  session_id uuid,
  task_id uuid,
  feature varchar(64) NOT NULL,
  phase varchar(64) NOT NULL,
  model_setting_id uuid,
  model varchar(255) NOT NULL,
  provider varchar(32) NOT NULL,
  status varchar(32) NOT NULL,
  usage_reported boolean NOT NULL DEFAULT false,
  input_tokens bigint,
  output_tokens bigint,
  cached_input_tokens bigint,
  reasoning_tokens bigint,
  total_tokens bigint,
  provider_usage jsonb,
  error_code varchar(120),
  started_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamptz,
  CONSTRAINT ai_model_usage_calls_status_check
    CHECK (status IN ('STARTED', 'COMPLETED', 'FAILED', 'CANCELLED')),
  CONSTRAINT ai_model_usage_calls_token_check
    CHECK (
      (input_tokens IS NULL OR input_tokens >= 0)
      AND (output_tokens IS NULL OR output_tokens >= 0)
      AND (cached_input_tokens IS NULL OR cached_input_tokens >= 0)
      AND (reasoning_tokens IS NULL OR reasoning_tokens >= 0)
      AND (total_tokens IS NULL OR total_tokens >= 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_ai_model_usage_calls_user_started
  ON ai_model_usage_calls (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_model_usage_calls_started
  ON ai_model_usage_calls (started_at DESC);

INSERT INTO permissions (code, resource, action, name, description)
VALUES (
  'reports.ai-token-usage.read',
  'reports.ai-token-usage',
  'read',
  'AI Token使用量参照',
  'ユーザー別のAI Token使用量、呼出回数及び順位を参照する'
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
  ON permission_record.code = 'reports.ai-token-usage.read'
WHERE role_record.code = 'SYSTEM_ADMIN'
  AND role_record.permission_seed_enabled
ON CONFLICT (role_id, permission_id) DO NOTHING;
