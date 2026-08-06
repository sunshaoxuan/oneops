ALTER TABLE personal_task_external_accounts
  ADD COLUMN IF NOT EXISTS filter_revision INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_generated_filter_revision INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_generation_at TIMESTAMPTZ;
ALTER TABLE personal_task_candidates
  ADD COLUMN IF NOT EXISTS seen_filter_revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE personal_task_candidates DROP CONSTRAINT IF EXISTS personal_task_candidates_disposition_check;
ALTER TABLE personal_task_candidates ADD CONSTRAINT personal_task_candidates_disposition_check
  CHECK (disposition IN ('PENDING', 'ADOPTED', 'DISMISSED', 'STALE'));
ALTER TABLE personal_task_sync_runs
  ADD COLUMN IF NOT EXISTS filter_revision INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS stale_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE personal_task_sync_runs DROP CONSTRAINT IF EXISTS personal_task_sync_runs_trigger_check;
ALTER TABLE personal_task_sync_runs ADD CONSTRAINT personal_task_sync_runs_trigger_check
  CHECK (trigger_type IN ('MANUAL', 'SCHEDULED', 'REGENERATE'));
ALTER TABLE personal_task_sync_runs DROP CONSTRAINT IF EXISTS personal_task_sync_runs_counts_check;
ALTER TABLE personal_task_sync_runs ADD CONSTRAINT personal_task_sync_runs_counts_check
  CHECK (fetched_count >= 0 AND created_count >= 0 AND updated_count >= 0 AND stale_count >= 0);
UPDATE personal_task_external_accounts
SET filter_json = jsonb_set(filter_json - 'assignee' - 'assigneeName', '{assigneeMode}', '"ME"'::jsonb, TRUE),
    filter_revision = filter_revision + 1,
    last_cursor = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE provider_code = 'INQUIRY' AND filter_json ->> 'assigneeMode' IS NULL;
