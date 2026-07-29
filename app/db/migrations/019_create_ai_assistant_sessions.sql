INSERT INTO permissions (code, resource, action, name, description)
VALUES (
  'ai.assistant.use',
  'ai.assistant',
  'use',
  'AI アシスタント利用',
  'CAG の Conversation を使用した AI アシスタントを利用する'
)
ON CONFLICT (code) DO UPDATE
SET resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_record.id, permission_record.id
FROM roles AS role_record
CROSS JOIN permissions AS permission_record
WHERE role_record.code IN ('SYSTEM_ADMIN', 'OPERATOR', 'VIEWER')
  AND permission_record.code = 'ai.assistant.use'
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS ai_assistant_sessions (
  conversation_id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_gateway_setting_id UUID NOT NULL
    REFERENCES agent_gateway_settings(id) ON DELETE RESTRICT,
  project_ref TEXT NOT NULL,
  project_code TEXT NOT NULL DEFAULT '',
  runtime_profile TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMPTZ,
  CONSTRAINT ai_assistant_sessions_title_not_blank
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT ai_assistant_sessions_project_ref_not_blank
    CHECK (length(btrim(project_ref)) > 0),
  CONSTRAINT ai_assistant_sessions_runtime_profile_not_blank
    CHECK (length(btrim(runtime_profile)) > 0),
  CONSTRAINT ai_assistant_sessions_status_check
    CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS ai_assistant_sessions_owner_updated_idx
  ON ai_assistant_sessions (owner_user_id, updated_at DESC);
