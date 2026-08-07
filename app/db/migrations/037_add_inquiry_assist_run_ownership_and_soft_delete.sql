ALTER TABLE inquiry_assist_runs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by_user_id UUID
    REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS inquiry_assist_runs_active_ticket_idx
  ON inquiry_assist_runs (ticket_no, created_at DESC)
  WHERE deleted_at IS NULL;

INSERT INTO permissions (code, resource, action, name, description)
VALUES (
  'inquiries.deleted.read',
  'inquiries.deleted',
  'read',
  '削除済み AI 補助履歴の参照',
  '論理削除された AI 補助履歴を管理者として参照する'
)
ON CONFLICT (code) DO UPDATE
SET resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_record.id, permission_record.id
FROM roles AS role_record
JOIN permissions AS permission_record
  ON permission_record.code = 'inquiries.deleted.read'
WHERE role_record.code = 'SYSTEM_ADMIN'
  AND role_record.permission_seed_enabled
ON CONFLICT (role_id, permission_id) DO NOTHING;
