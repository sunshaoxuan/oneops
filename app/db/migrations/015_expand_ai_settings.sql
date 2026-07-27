ALTER TABLE ai_model_settings
  ADD COLUMN IF NOT EXISTS purpose TEXT;

UPDATE ai_model_settings
SET purpose = 'GENERAL'
WHERE purpose IS NULL;

ALTER TABLE ai_model_settings
  ALTER COLUMN purpose SET NOT NULL;

ALTER TABLE ai_model_settings
  DROP CONSTRAINT IF EXISTS ai_model_settings_provider_key;

ALTER TABLE ai_model_settings
  DROP CONSTRAINT IF EXISTS ai_model_settings_purpose_check;

ALTER TABLE ai_model_settings
  ADD CONSTRAINT ai_model_settings_purpose_check
    CHECK (purpose IN ('GENERAL', 'SIMPLE'));

CREATE UNIQUE INDEX IF NOT EXISTS ai_model_settings_purpose_unique
  ON ai_model_settings (purpose);

CREATE TABLE IF NOT EXISTS agent_gateway_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  encrypted_access_token TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT agent_gateway_settings_name_not_blank
    CHECK (length(btrim(name)) > 0),
  CONSTRAINT agent_gateway_settings_endpoint_not_blank
    CHECK (length(btrim(endpoint_url)) > 0)
);

UPDATE permissions
SET name = CASE
      WHEN code = 'models.settings.read' THEN '查看AI设置'
      ELSE '维护AI设置'
    END,
    description = CASE
      WHEN code = 'models.settings.read'
        THEN '查看模型接口和Agent Gateway设置'
      ELSE '维护模型接口和Agent Gateway设置并执行连接测试'
    END
WHERE code IN ('models.settings.read', 'models.settings.write');
