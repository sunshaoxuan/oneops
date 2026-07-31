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
