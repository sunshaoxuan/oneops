ALTER TABLE ai_assistant_tasks
  ADD COLUMN IF NOT EXISTS intent_analysis JSONB;

ALTER TABLE ai_assistant_tasks
  DROP CONSTRAINT IF EXISTS ai_assistant_tasks_intent_analysis_object;

ALTER TABLE ai_assistant_tasks
  ADD CONSTRAINT ai_assistant_tasks_intent_analysis_object
  CHECK (intent_analysis IS NULL OR jsonb_typeof(intent_analysis) = 'object');
