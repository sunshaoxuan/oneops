DELETE FROM ai_model_settings
WHERE purpose = 'SIMPLE';

DROP INDEX IF EXISTS ai_model_settings_purpose_unique;

ALTER TABLE ai_model_settings
  DROP CONSTRAINT IF EXISTS ai_model_settings_purpose_check;

ALTER TABLE ai_model_settings
  ADD CONSTRAINT ai_model_settings_purpose_check
    CHECK (purpose IN ('GENERAL', 'INQUIRY'));

ALTER TABLE ai_model_settings
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS reasoning_effort TEXT NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS speed_level TEXT NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE ai_model_settings
SET display_name = model
WHERE display_name IS NULL OR length(btrim(display_name)) = 0;

ALTER TABLE ai_model_settings
  ALTER COLUMN display_name SET NOT NULL,
  DROP CONSTRAINT IF EXISTS ai_model_settings_display_name_not_blank,
  DROP CONSTRAINT IF EXISTS ai_model_settings_reasoning_effort_check,
  DROP CONSTRAINT IF EXISTS ai_model_settings_speed_level_check,
  DROP CONSTRAINT IF EXISTS ai_model_settings_sort_order_check;

ALTER TABLE ai_model_settings
  ADD CONSTRAINT ai_model_settings_display_name_not_blank
    CHECK (length(btrim(display_name)) > 0),
  ADD CONSTRAINT ai_model_settings_reasoning_effort_check
    CHECK (reasoning_effort IN ('XHIGH', 'HIGH', 'MEDIUM')),
  ADD CONSTRAINT ai_model_settings_speed_level_check
    CHECK (speed_level IN ('FAST', 'MEDIUM', 'SLOW')),
  ADD CONSTRAINT ai_model_settings_sort_order_check
    CHECK (sort_order BETWEEN 0 AND 9999);

UPDATE ai_model_settings
SET is_default = TRUE
WHERE purpose = 'INQUIRY';

UPDATE ai_model_settings
SET is_default = TRUE
WHERE id = (
  SELECT id
  FROM ai_model_settings
  WHERE purpose = 'GENERAL'
  ORDER BY updated_at DESC, id
  LIMIT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_model_settings_inquiry_unique
  ON ai_model_settings (purpose)
  WHERE purpose = 'INQUIRY';

CREATE UNIQUE INDEX IF NOT EXISTS ai_model_settings_general_default_unique
  ON ai_model_settings (purpose)
  WHERE purpose = 'GENERAL' AND is_default;

CREATE UNIQUE INDEX IF NOT EXISTS ai_model_settings_general_identity_unique
  ON ai_model_settings (purpose, endpoint_url, model, reasoning_effort)
  WHERE purpose = 'GENERAL';

ALTER TABLE ai_assistant_shortcuts
  ADD COLUMN IF NOT EXISTS starting_model_setting_id UUID
    REFERENCES ai_model_settings(id) ON DELETE RESTRICT;

UPDATE ai_assistant_shortcuts
SET starting_model_setting_id = (
  SELECT id
  FROM ai_model_settings
  WHERE purpose = 'GENERAL' AND enabled
  ORDER BY is_default DESC, sort_order, id
  LIMIT 1
)
WHERE starting_model_setting_id IS NULL;

UPDATE ai_assistant_shortcuts
SET enabled = FALSE
WHERE starting_model_setting_id IS NULL;

UPDATE ai_assistant_shortcuts
SET enabled = TRUE
WHERE code IN (
  'JA_ZH_TRANSLATION',
  'TEXT_POLISHING',
  'AUDIENCE_REWRITE',
  'SUMMARY_KEY_POINTS',
  'MEETING_ACTIONS',
  'BUSINESS_EMAIL',
  'ISSUE_DECOMPOSITION',
  'CHECKLIST_CREATION',
  'COMPARISON_DECISION',
  'OMISSION_REVIEW',
  'CONSISTENCY_REVIEW',
  'FINAL_REVIEW'
)
  AND starting_model_setting_id IS NOT NULL;

ALTER TABLE ai_assistant_shortcuts
  ALTER COLUMN enabled SET DEFAULT TRUE;

ALTER TABLE ai_assistant_shortcuts
  DROP CONSTRAINT IF EXISTS ai_assistant_shortcuts_enabled_model_check;

ALTER TABLE ai_assistant_shortcuts
  ADD CONSTRAINT ai_assistant_shortcuts_enabled_model_check
    CHECK (NOT enabled OR starting_model_setting_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS ai_assistant_shortcuts_starting_model_idx
  ON ai_assistant_shortcuts (starting_model_setting_id);

ALTER TABLE ai_assistant_sessions
  ADD COLUMN IF NOT EXISTS model_setting_id UUID
    REFERENCES ai_model_settings(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS model_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS reasoning_effort_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS speed_level_snapshot TEXT;

ALTER TABLE ai_assistant_sessions
  DROP CONSTRAINT IF EXISTS ai_assistant_sessions_model_snapshot_check;

ALTER TABLE ai_assistant_sessions
  ADD CONSTRAINT ai_assistant_sessions_model_snapshot_check
    CHECK (
      (model_setting_id IS NULL
        AND model_snapshot IS NULL
        AND reasoning_effort_snapshot IS NULL
        AND speed_level_snapshot IS NULL)
      OR
      (model_setting_id IS NOT NULL
        AND length(btrim(model_snapshot)) > 0
        AND reasoning_effort_snapshot IN ('XHIGH', 'HIGH', 'MEDIUM')
        AND speed_level_snapshot IN ('FAST', 'MEDIUM', 'SLOW'))
    );

CREATE INDEX IF NOT EXISTS ai_assistant_sessions_model_setting_idx
  ON ai_assistant_sessions (model_setting_id);
