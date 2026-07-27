ALTER TABLE auth_audit_events
  ADD COLUMN IF NOT EXISTS session_id UUID
    REFERENCES auth_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS request_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS capability TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS outcome TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status_code INTEGER,
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

CREATE INDEX IF NOT EXISTS auth_audit_events_capability_created_idx
  ON auth_audit_events (capability, created_at DESC);

CREATE INDEX IF NOT EXISTS auth_audit_events_actor_created_idx
  ON auth_audit_events (actor_user_id, created_at DESC);

ALTER TABLE inquiry_assist_runs
  ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS token_usage JSONB,
  ADD COLUMN IF NOT EXISTS requested_session_id UUID
    REFERENCES auth_sessions(id) ON DELETE SET NULL;
