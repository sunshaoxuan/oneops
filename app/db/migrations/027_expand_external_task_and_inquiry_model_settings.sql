ALTER TABLE ai_model_settings
  DROP CONSTRAINT IF EXISTS ai_model_settings_purpose_check;

ALTER TABLE ai_model_settings
  ADD CONSTRAINT ai_model_settings_purpose_check
    CHECK (purpose IN ('GENERAL', 'SIMPLE', 'INQUIRY'));

ALTER TABLE inquiry_source_settings
  ADD COLUMN IF NOT EXISTS api_url TEXT;

ALTER TABLE inquiry_source_settings
  DROP CONSTRAINT IF EXISTS inquiry_source_settings_code_check;

ALTER TABLE inquiry_source_settings
  DROP CONSTRAINT IF EXISTS inquiry_source_settings_product_check;

ALTER TABLE inquiry_source_settings
  ADD CONSTRAINT inquiry_source_settings_code_check
    CHECK (code IN ('ONEHR_UPDS', 'BACKLOG_SYSTEM'));

ALTER TABLE inquiry_source_settings
  ADD CONSTRAINT inquiry_source_settings_product_check
    CHECK (
      (code = 'ONEHR_UPDS' AND product_code = 'UPDS') OR
      (code = 'BACKLOG_SYSTEM' AND product_code = 'BACKLOG')
    );
