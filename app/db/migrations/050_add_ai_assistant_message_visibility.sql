ALTER TABLE ai_assistant_tasks
  ADD COLUMN IF NOT EXISTS message_state TEXT NOT NULL DEFAULT 'VISIBLE',
  ADD COLUMN IF NOT EXISTS message_position BIGINT;

UPDATE ai_assistant_tasks AS task
SET message_position = ordered.position
FROM (
  SELECT id,
         row_number() OVER (
           PARTITION BY conversation_id ORDER BY created_at, id
         ) AS position
  FROM ai_assistant_tasks
) AS ordered
WHERE task.id = ordered.id
  AND task.message_position IS NULL;

ALTER TABLE ai_assistant_tasks
  ALTER COLUMN message_position SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'ai_assistant_tasks'::regclass
      AND conname = 'ai_assistant_tasks_message_state_check'
  ) THEN
    ALTER TABLE ai_assistant_tasks
      ADD CONSTRAINT ai_assistant_tasks_message_state_check
      CHECK (message_state IN ('VISIBLE', 'REPLACED', 'TRUNCATED'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ai_assistant_tasks_visible_position_idx
  ON ai_assistant_tasks (conversation_id, message_position, created_at)
  WHERE message_state = 'VISIBLE';
