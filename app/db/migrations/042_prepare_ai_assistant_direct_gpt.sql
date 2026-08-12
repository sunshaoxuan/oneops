UPDATE permissions
SET description = 'OpenAI Model API を直接使用する AIアシスタントを利用する'
WHERE code = 'ai.assistant.use';

WITH default_model AS (
  SELECT id, model, reasoning_effort, speed_level
  FROM ai_model_settings
  WHERE purpose = 'GENERAL'
    AND enabled
  ORDER BY is_default DESC, sort_order, id
  LIMIT 1
)
UPDATE ai_assistant_sessions AS session
SET model_setting_id = default_model.id,
    model_snapshot = default_model.model,
    reasoning_effort_snapshot = default_model.reasoning_effort,
    speed_level_snapshot = default_model.speed_level
FROM default_model
WHERE session.model_setting_id IS NULL;

ALTER TABLE ai_assistant_sessions
  ALTER COLUMN model_setting_id SET NOT NULL,
  ALTER COLUMN model_snapshot SET NOT NULL,
  ALTER COLUMN reasoning_effort_snapshot SET NOT NULL,
  ALTER COLUMN speed_level_snapshot SET NOT NULL;

CREATE TABLE IF NOT EXISTS ai_assistant_tasks (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL
    REFERENCES ai_assistant_sessions(conversation_id) ON DELETE CASCADE,
  model_setting_id UUID NOT NULL
    REFERENCES ai_model_settings(id) ON DELETE RESTRICT,
  model_snapshot TEXT NOT NULL,
  reasoning_effort_snapshot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  prompt TEXT NOT NULL,
  inquiry_context JSONB,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  routing JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_text TEXT,
  provider_response_id TEXT,
  provider_output JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_usage JSONB,
  error_code TEXT,
  error_message TEXT,
  request_id TEXT,
  cancel_requested_at TIMESTAMPTZ,
  last_event_sequence BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT ai_assistant_tasks_model_not_blank
    CHECK (length(btrim(model_snapshot)) > 0),
  CONSTRAINT ai_assistant_tasks_reasoning_effort_check
    CHECK (reasoning_effort_snapshot IN ('XHIGH', 'HIGH', 'MEDIUM')),
  CONSTRAINT ai_assistant_tasks_status_check
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  CONSTRAINT ai_assistant_tasks_prompt_not_blank
    CHECK (length(btrim(prompt)) > 0),
  CONSTRAINT ai_assistant_tasks_attachments_array
    CHECK (jsonb_typeof(attachments) = 'array'),
  CONSTRAINT ai_assistant_tasks_routing_object
    CHECK (jsonb_typeof(routing) = 'object'),
  CONSTRAINT ai_assistant_tasks_provider_output_array
    CHECK (jsonb_typeof(provider_output) = 'array'),
  CONSTRAINT ai_assistant_tasks_sequence_non_negative
    CHECK (last_event_sequence >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_assistant_tasks_one_active_idx
  ON ai_assistant_tasks (conversation_id)
  WHERE status IN ('queued', 'running');

CREATE INDEX IF NOT EXISTS ai_assistant_tasks_conversation_created_idx
  ON ai_assistant_tasks (conversation_id, created_at, id);

CREATE UNIQUE INDEX IF NOT EXISTS ai_assistant_tasks_provider_response_idx
  ON ai_assistant_tasks (provider_response_id)
  WHERE provider_response_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS ai_assistant_task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL
    REFERENCES ai_assistant_tasks(id) ON DELETE CASCADE,
  sequence BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_assistant_task_events_sequence_positive
    CHECK (sequence > 0),
  CONSTRAINT ai_assistant_task_events_type_not_blank
    CHECK (length(btrim(event_type)) > 0),
  CONSTRAINT ai_assistant_task_events_data_object
    CHECK (jsonb_typeof(event_data) = 'object'),
  CONSTRAINT ai_assistant_task_events_task_sequence_unique
    UNIQUE (task_id, sequence)
);

CREATE INDEX IF NOT EXISTS ai_assistant_task_events_task_created_idx
  ON ai_assistant_task_events (task_id, sequence);
