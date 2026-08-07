INSERT INTO permissions (code, resource, action, name, description)
VALUES (
  'personal.tasks.use',
  'personal.tasks',
  'use',
  '個人タスクを利用',
  '本人のタスク、候補、外部接続および同期を管理します'
)
ON CONFLICT (code) DO UPDATE
SET resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_record.id, permission_record.id
FROM roles AS role_record
CROSS JOIN permissions AS permission_record
WHERE role_record.code IN ('SYSTEM_ADMIN', 'OPERATOR', 'VIEWER')
  AND role_record.permission_seed_enabled
  AND permission_record.code = 'personal.tasks.use'
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS personal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TODO',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  description TEXT NOT NULL DEFAULT '',
  automation_prompt TEXT NOT NULL DEFAULT '',
  prompt_schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  due_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  review_cycle TEXT,
  custom_review_days INTEGER,
  revision INTEGER NOT NULL DEFAULT 1,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT personal_tasks_title_not_blank CHECK (btrim(title) <> ''),
  CONSTRAINT personal_tasks_type_check
    CHECK (task_type IN ('DEADLINE', 'LONG_TERM')),
  CONSTRAINT personal_tasks_status_check
    CHECK (status IN ('TODO', 'IN_PROGRESS', 'WAITING', 'COMPLETED')),
  CONSTRAINT personal_tasks_priority_check
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  CONSTRAINT personal_tasks_review_cycle_check
    CHECK (review_cycle IS NULL OR review_cycle IN ('WEEKLY', 'MONTHLY', 'CUSTOM')),
  CONSTRAINT personal_tasks_custom_review_days_check
    CHECK (custom_review_days IS NULL OR custom_review_days BETWEEN 1 AND 3650),
  CONSTRAINT personal_tasks_revision_positive CHECK (revision > 0),
  CONSTRAINT personal_tasks_schedule_check CHECK (
    (task_type = 'DEADLINE' AND due_at IS NOT NULL
      AND next_review_at IS NULL AND review_cycle IS NULL
      AND custom_review_days IS NULL)
    OR
    (task_type = 'LONG_TERM' AND due_at IS NULL
      AND review_cycle IS NULL AND custom_review_days IS NULL
      AND NOT (next_review_at IS NOT NULL AND btrim(automation_prompt) <> ''))
  )
);

CREATE INDEX IF NOT EXISTS personal_tasks_owner_status_idx
  ON personal_tasks (owner_user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS personal_tasks_owner_due_idx
  ON personal_tasks (owner_user_id, due_at)
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS personal_tasks_owner_review_idx
  ON personal_tasks (owner_user_id, next_review_at)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS personal_task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES personal_tasks(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS personal_task_events_task_idx
  ON personal_task_events (owner_user_id, task_id, created_at DESC);

CREATE TABLE IF NOT EXISTS personal_task_external_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  external_username TEXT NOT NULL DEFAULT '',
  encrypted_credentials TEXT NOT NULL,
  filter_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 15,
  last_cursor TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_error_code TEXT,
  last_error_message TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT personal_task_external_accounts_provider_check
    CHECK (provider_code IN ('INQUIRY', 'BACKLOG')),
  CONSTRAINT personal_task_external_accounts_display_name_not_blank
    CHECK (btrim(display_name) <> ''),
  CONSTRAINT personal_task_external_accounts_url_not_blank
    CHECK (btrim(base_url) <> ''),
  CONSTRAINT personal_task_external_accounts_interval_check
    CHECK (sync_interval_minutes BETWEEN 5 AND 1440),
  CONSTRAINT personal_task_external_accounts_sync_status_check
    CHECK (
      last_sync_status IS NULL
      OR last_sync_status IN ('RUNNING', 'SUCCESS', 'FAILED')
    ),
  CONSTRAINT personal_task_external_accounts_revision_positive
    CHECK (revision > 0),
  UNIQUE (owner_user_id, provider_code, base_url)
);

CREATE INDEX IF NOT EXISTS personal_task_external_accounts_due_idx
  ON personal_task_external_accounts (enabled, last_sync_at);

CREATE TABLE IF NOT EXISTS personal_task_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_account_id UUID NOT NULL
    REFERENCES personal_task_external_accounts(id) ON DELETE CASCADE,
  external_object_id TEXT NOT NULL,
  external_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  external_status TEXT NOT NULL DEFAULT '',
  external_assignee TEXT NOT NULL DEFAULT '',
  external_url TEXT NOT NULL,
  external_created_at TIMESTAMPTZ,
  external_updated_at TIMESTAMPTZ,
  disposition TEXT NOT NULL DEFAULT 'PENDING',
  source_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT personal_task_candidates_disposition_check
    CHECK (disposition IN ('PENDING', 'ADOPTED', 'DISMISSED')),
  UNIQUE (external_account_id, external_object_id)
);

CREATE INDEX IF NOT EXISTS personal_task_candidates_owner_idx
  ON personal_task_candidates (owner_user_id, disposition, external_updated_at DESC);

CREATE TABLE IF NOT EXISTS personal_task_external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES personal_tasks(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_account_id UUID NOT NULL
    REFERENCES personal_task_external_accounts(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES personal_task_candidates(id) ON DELETE SET NULL,
  external_object_id TEXT NOT NULL,
  external_key TEXT NOT NULL,
  external_url TEXT NOT NULL,
  external_status TEXT NOT NULL DEFAULT '',
  external_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (external_account_id, external_object_id)
);

CREATE INDEX IF NOT EXISTS personal_task_external_links_task_idx
  ON personal_task_external_links (owner_user_id, task_id);

CREATE TABLE IF NOT EXISTS personal_task_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_account_id UUID NOT NULL
    REFERENCES personal_task_external_accounts(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RUNNING',
  fetched_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  CONSTRAINT personal_task_sync_runs_trigger_check
    CHECK (trigger_type IN ('MANUAL', 'SCHEDULED')),
  CONSTRAINT personal_task_sync_runs_status_check
    CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED')),
  CONSTRAINT personal_task_sync_runs_counts_check
    CHECK (fetched_count >= 0 AND created_count >= 0 AND updated_count >= 0)
);

CREATE INDEX IF NOT EXISTS personal_task_sync_runs_owner_idx
  ON personal_task_sync_runs (owner_user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS personal_task_prompt_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES personal_tasks(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT personal_task_prompt_runs_trigger_check
    CHECK (trigger_type IN ('MANUAL', 'SCHEDULED')),
  CONSTRAINT personal_task_prompt_runs_status_check
    CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS personal_task_prompt_runs_task_idx
  ON personal_task_prompt_runs (owner_user_id, task_id, created_at DESC);
