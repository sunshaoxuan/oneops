ALTER TABLE ai_assistant_shortcuts
  ADD COLUMN IF NOT EXISTS starting_reasoning_effort TEXT;

ALTER TABLE ai_assistant_shortcuts
  DROP COLUMN IF EXISTS starting_speed_level;

UPDATE ai_assistant_shortcuts AS shortcut
SET starting_reasoning_effort = model.reasoning_effort
FROM ai_model_settings AS model
WHERE model.id = shortcut.starting_model_setting_id
  AND shortcut.starting_reasoning_effort IS NULL;

ALTER TABLE ai_assistant_shortcuts
  DROP CONSTRAINT IF EXISTS ai_assistant_shortcuts_enabled_model_check,
  DROP CONSTRAINT IF EXISTS ai_assistant_shortcuts_enabled_model_config_check;

ALTER TABLE ai_assistant_shortcuts
  ADD CONSTRAINT ai_assistant_shortcuts_enabled_model_config_check
    CHECK (
      NOT enabled
      OR (
        starting_model_setting_id IS NOT NULL
        AND starting_reasoning_effort IN ('XHIGH', 'HIGH', 'MEDIUM')
      )
    );
