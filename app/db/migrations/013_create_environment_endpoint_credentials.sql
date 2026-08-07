CREATE TABLE IF NOT EXISTS environment_endpoint_credentials (
  endpoint_id BIGINT PRIMARY KEY
    REFERENCES environment_endpoints(id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  encrypted_payload TEXT NOT NULL,
  has_username BOOLEAN NOT NULL DEFAULT false,
  has_password BOOLEAN NOT NULL DEFAULT false,
  source_system VARCHAR(40),
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT environment_endpoint_credentials_payload_not_blank
    CHECK (length(btrim(encrypted_payload)) > 0),
  CONSTRAINT environment_endpoint_credentials_revision_positive
    CHECK (revision > 0)
);

INSERT INTO permissions (code, resource, action, name, description)
VALUES
  (
    'environments.credentials.read',
    'environments.credentials',
    'read',
    '查看环境凭据',
    '显式查看应用、数据库和远程连接凭据'
  ),
  (
    'environments.credentials.write',
    'environments.credentials',
    'write',
    '维护环境凭据',
    '新增和修改应用、数据库和远程连接凭据'
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
  ON permission_record.code IN (
    'environments.credentials.read',
    'environments.credentials.write'
  )
WHERE role_record.code IN ('SYSTEM_ADMIN', 'OPERATOR')
  AND role_record.permission_seed_enabled
ON CONFLICT (role_id, permission_id) DO NOTHING;
