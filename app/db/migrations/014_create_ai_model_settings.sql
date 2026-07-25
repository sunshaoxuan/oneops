CREATE TABLE IF NOT EXISTS ai_model_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  endpoint_url TEXT NOT NULL,
  model TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_model_settings_provider_check
    CHECK (provider IN ('OPENAI')),
  CONSTRAINT ai_model_settings_endpoint_not_blank
    CHECK (length(btrim(endpoint_url)) > 0),
  CONSTRAINT ai_model_settings_model_not_blank
    CHECK (length(btrim(model)) > 0),
  CONSTRAINT ai_model_settings_api_key_not_blank
    CHECK (length(btrim(encrypted_api_key)) > 0)
);

INSERT INTO permissions (code, resource, action, name, description)
VALUES
  (
    'models.settings.read',
    'models.settings',
    'read',
    '查看模型设计',
    '查看模型服务的非敏感配置和连接状态'
  ),
  (
    'models.settings.write',
    'models.settings',
    'write',
    '维护模型设计',
    '维护模型服务配置并执行连接测试'
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
  ON permission_record.code IN (
    'models.settings.read',
    'models.settings.write'
  )
WHERE role_record.code = 'SYSTEM_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;
