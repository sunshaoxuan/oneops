ALTER TABLE ai_assistant_shortcuts
  ADD COLUMN IF NOT EXISTS starting_reasoning_effort TEXT,
  ADD COLUMN IF NOT EXISTS starting_speed_level TEXT;

UPDATE ai_assistant_shortcuts AS shortcut
SET starting_reasoning_effort = model.reasoning_effort,
    starting_speed_level = model.speed_level
FROM ai_model_settings AS model
WHERE model.id = shortcut.starting_model_setting_id
  AND (
    shortcut.starting_reasoning_effort IS NULL
    OR shortcut.starting_speed_level IS NULL
  );

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
        AND starting_speed_level IN ('FAST', 'MEDIUM', 'SLOW')
      )
    );
