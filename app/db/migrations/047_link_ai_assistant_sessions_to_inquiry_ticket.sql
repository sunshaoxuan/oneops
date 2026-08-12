ALTER TABLE ai_assistant_sessions
  ADD COLUMN IF NOT EXISTS inquiry_ticket_no TEXT;

WITH latest_ticket AS (
  SELECT DISTINCT ON (task.conversation_id)
    task.conversation_id,
    btrim(task.inquiry_context ->> 'ticketNo') AS ticket_no
  FROM ai_assistant_tasks AS task
  WHERE task.inquiry_context IS NOT NULL
    AND length(btrim(task.inquiry_context ->> 'ticketNo')) BETWEEN 1 AND 80
  ORDER BY task.conversation_id, task.created_at DESC, task.id DESC
)
UPDATE ai_assistant_sessions AS session
SET inquiry_ticket_no = latest_ticket.ticket_no
FROM latest_ticket
WHERE session.conversation_id = latest_ticket.conversation_id
  AND session.inquiry_ticket_no IS NULL;

ALTER TABLE ai_assistant_sessions
  DROP CONSTRAINT IF EXISTS ai_assistant_sessions_inquiry_ticket_no_check;

ALTER TABLE ai_assistant_sessions
  ADD CONSTRAINT ai_assistant_sessions_inquiry_ticket_no_check
  CHECK (
    inquiry_ticket_no IS NULL
    OR length(btrim(inquiry_ticket_no)) BETWEEN 1 AND 80
  );

CREATE INDEX IF NOT EXISTS ai_assistant_sessions_owner_ticket_updated_idx
  ON ai_assistant_sessions (
    owner_user_id,
    inquiry_ticket_no,
    updated_at DESC,
    conversation_id
  )
  WHERE inquiry_ticket_no IS NOT NULL;
