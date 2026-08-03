ALTER TABLE auth_sessions
  ADD COLUMN IF NOT EXISTS impersonator_user_id uuid
    REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS auth_sessions_impersonator_idx
  ON auth_sessions (impersonator_user_id, created_at DESC)
  WHERE impersonator_user_id IS NOT NULL AND revoked_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'auth_sessions'::regclass
       AND conname = 'auth_sessions_impersonator_not_self'
  ) THEN
    ALTER TABLE auth_sessions
      ADD CONSTRAINT auth_sessions_impersonator_not_self
      CHECK (impersonator_user_id IS NULL OR impersonator_user_id <> user_id);
  END IF;
END $$;

INSERT INTO permissions (code, resource, action, name, description)
VALUES (
  'identity.users.impersonate',
  'identity.users',
  'impersonate',
  '代理ログイン',
  '対象ユーザーの権限と画面を検証するため代理ログインを開始・終了する'
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
 WHERE role_record.code = 'SYSTEM_ADMIN'
   AND permission_record.code = 'identity.users.impersonate'
ON CONFLICT (role_id, permission_id) DO NOTHING;
