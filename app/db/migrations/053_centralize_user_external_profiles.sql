DO $migration$
DECLARE constraint_name TEXT;
BEGIN
IF to_regclass('external_systems') IS NOT NULL THEN
  DROP TABLE IF EXISTS personal_task_sync_runs;
  DROP TABLE IF EXISTS personal_task_external_accounts;
  RETURN;
END IF;
IF to_regclass('personal_task_external_accounts') IS NULL THEN
  RETURN;
END IF;

CREATE TABLE external_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  system_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT external_systems_code_format
    CHECK (code = upper(code) AND code ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  CONSTRAINT external_systems_type_check
    CHECK (system_type IN ('AUTHENTICATION', 'TASK_SOURCE', 'OTHER'))
);

INSERT INTO external_systems (id, code, name, system_type)
VALUES
  ('d3c28173-90ae-4c38-9856-d8394f393001', 'WINDOWS_DOMAIN', 'Windows ドメイン', 'AUTHENTICATION'),
  ('d3c28173-90ae-4c38-9856-d8394f393002', 'BACKLOG', 'Backlog', 'TASK_SOURCE'),
  ('d3c28173-90ae-4c38-9856-d8394f393003', 'INQUIRY', '問合せサイト', 'TASK_SOURCE');

CREATE TABLE user_external_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_system_id UUID NOT NULL REFERENCES external_systems(id) ON DELETE RESTRICT,
  external_user_id TEXT NOT NULL,
  external_user_code TEXT NOT NULL DEFAULT '',
  external_display_name TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_cursor TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_error_code TEXT,
  last_error_message TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_external_profiles_user_id_not_blank CHECK (btrim(external_user_id) <> ''),
  CONSTRAINT user_external_profiles_sync_status_check
    CHECK (last_sync_status IS NULL OR last_sync_status IN ('RUNNING', 'SUCCESS', 'FAILED')),
  CONSTRAINT user_external_profiles_revision_positive CHECK (revision > 0),
  UNIQUE (user_id, external_system_id),
  UNIQUE (external_system_id, external_user_id)
);

CREATE INDEX user_external_profiles_user_idx
  ON user_external_profiles (user_id, enabled, external_system_id);

INSERT INTO user_external_profiles (
  user_id, external_system_id, external_user_id, external_user_code,
  external_display_name, metadata
)
SELECT identity.user_id, system.id, identity.subject_normalized,
       COALESCE(identity.metadata->>'domainUsername', ''),
       COALESCE(identity.metadata->>'displayName', users.display_name, ''),
       jsonb_build_object(
         'subject', identity.subject,
         'upn', COALESCE(identity.metadata->>'upn', ''),
         'windowsDomain', COALESCE(identity.metadata->>'windowsDomain', '')
       )
FROM auth_identities identity
JOIN users ON users.id = identity.user_id
JOIN external_systems system ON system.code = 'WINDOWS_DOMAIN'
WHERE identity.provider = 'WINDOWS';

INSERT INTO user_external_profiles (
  user_id, external_system_id, external_user_id, external_user_code,
  external_display_name
)
SELECT account.owner_user_id, system.id,
       COALESCE(NULLIF(account.external_username, ''), account.owner_user_id::text),
       account.external_username,
       users.display_name
FROM personal_task_external_accounts account
JOIN users ON users.id = account.owner_user_id
JOIN external_systems system
  ON system.code = CASE account.provider_code WHEN 'INQUIRY' THEN 'INQUIRY' ELSE 'BACKLOG' END
ON CONFLICT (user_id, external_system_id) DO NOTHING;

ALTER TABLE inquiry_source_settings
  ADD COLUMN external_system_id UUID REFERENCES external_systems(id) ON DELETE RESTRICT,
  ADD COLUMN filter_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN sync_interval_minutes INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN last_sync_at TIMESTAMPTZ,
  ADD COLUMN last_sync_status TEXT,
  ADD COLUMN last_error_code TEXT,
  ADD COLUMN last_error_message TEXT;

UPDATE inquiry_source_settings source
SET external_system_id = system.id
FROM external_systems system
WHERE system.code = CASE source.code WHEN 'ONEHR_UPDS' THEN 'INQUIRY' ELSE 'BACKLOG' END;

ALTER TABLE inquiry_source_settings
  ALTER COLUMN external_system_id SET NOT NULL,
  ADD CONSTRAINT inquiry_source_settings_interval_check
    CHECK (sync_interval_minutes BETWEEN 5 AND 1440),
  ADD CONSTRAINT inquiry_source_settings_sync_status_check
    CHECK (last_sync_status IS NULL OR last_sync_status IN ('RUNNING', 'SUCCESS', 'FAILED')),
  ADD CONSTRAINT inquiry_source_settings_external_system_unique UNIQUE (external_system_id);

CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  action_path TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, notification_type, resource_type, resource_id)
);

CREATE INDEX user_notifications_inbox_idx
  ON user_notifications (user_id, read_at, created_at DESC);

ALTER TABLE personal_task_candidates
  ADD COLUMN external_system_id UUID REFERENCES external_systems(id) ON DELETE RESTRICT,
  ADD COLUMN user_external_profile_id UUID REFERENCES user_external_profiles(id) ON DELETE RESTRICT;

UPDATE personal_task_candidates candidate
SET external_system_id = profile.external_system_id,
    user_external_profile_id = profile.id
FROM personal_task_external_accounts account
JOIN external_systems system
  ON system.code = CASE account.provider_code WHEN 'INQUIRY' THEN 'INQUIRY' ELSE 'BACKLOG' END
JOIN user_external_profiles profile
  ON profile.user_id = account.owner_user_id
 AND profile.external_system_id = system.id
WHERE account.id = candidate.external_account_id;

ALTER TABLE personal_task_candidates
  ALTER COLUMN external_system_id SET NOT NULL,
  ALTER COLUMN user_external_profile_id SET NOT NULL;

  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'personal_task_candidates'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) = 'UNIQUE (external_account_id, external_object_id)';
IF constraint_name IS NOT NULL THEN
  EXECUTE format('ALTER TABLE personal_task_candidates DROP CONSTRAINT %I', constraint_name);
END IF;

ALTER TABLE personal_task_candidates
  DROP COLUMN external_account_id,
  ADD CONSTRAINT personal_task_candidates_source_object_unique
    UNIQUE (user_external_profile_id, external_object_id);

ALTER TABLE personal_task_external_links
  ADD COLUMN external_system_id UUID REFERENCES external_systems(id) ON DELETE RESTRICT,
  ADD COLUMN user_external_profile_id UUID REFERENCES user_external_profiles(id) ON DELETE RESTRICT;

UPDATE personal_task_external_links link
SET external_system_id = profile.external_system_id,
    user_external_profile_id = profile.id
FROM personal_task_external_accounts account
JOIN external_systems system
  ON system.code = CASE account.provider_code WHEN 'INQUIRY' THEN 'INQUIRY' ELSE 'BACKLOG' END
JOIN user_external_profiles profile
  ON profile.user_id = account.owner_user_id
 AND profile.external_system_id = system.id
WHERE account.id = link.external_account_id;

ALTER TABLE personal_task_external_links
  ALTER COLUMN external_system_id SET NOT NULL,
  ALTER COLUMN user_external_profile_id SET NOT NULL,
  DROP COLUMN external_account_id;

DROP TABLE personal_task_sync_runs;
DROP TABLE personal_task_external_accounts;

END
$migration$;
