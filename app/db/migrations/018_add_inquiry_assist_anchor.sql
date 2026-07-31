ALTER TABLE inquiry_assist_runs
  ADD COLUMN IF NOT EXISTS assist_anchor TEXT;

UPDATE inquiry_assist_runs
SET assist_anchor = CASE
  WHEN focus_message_key IS NOT NULL THEN 'MESSAGE'
  ELSE 'NEXT_REPLY'
END
WHERE assist_anchor IS NULL;

ALTER TABLE inquiry_assist_runs
  ALTER COLUMN assist_anchor SET DEFAULT 'NEXT_REPLY',
  ALTER COLUMN assist_anchor SET NOT NULL;

ALTER TABLE inquiry_assist_runs
  DROP CONSTRAINT IF EXISTS inquiry_assist_runs_anchor_check;

ALTER TABLE inquiry_assist_runs
  ADD CONSTRAINT inquiry_assist_runs_anchor_check
  CHECK (
    assist_anchor IN (
      'TICKET',
      'QUESTION',
      'MESSAGE',
      'NEXT_REPLY'
    )
  );
