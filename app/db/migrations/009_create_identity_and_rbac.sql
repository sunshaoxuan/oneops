CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL,
    email text,
    display_name text NOT NULL,
    status text NOT NULL DEFAULT 'PENDING',
    locale text NOT NULL DEFAULT 'ja-JP',
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at timestamptz,
    CONSTRAINT users_username_format
      CHECK (username = lower(username) AND username ~ '^[a-z0-9][a-z0-9._:@\\-]{2,127}$'),
    CONSTRAINT users_status_check
      CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED')),
    CONSTRAINT users_locale_check
      CHECK (locale IN ('ja-JP', 'zh-CN', 'en-US'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique
  ON users (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
  ON users (lower(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS auth_identities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider text NOT NULL,
    subject text NOT NULL,
    subject_normalized text NOT NULL,
    password_hash text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at timestamptz,
    CONSTRAINT auth_identities_provider_check
      CHECK (provider IN ('LOCAL', 'WINDOWS')),
    CONSTRAINT auth_identities_local_password_check
      CHECK (
        (provider = 'LOCAL' AND password_hash IS NOT NULL)
        OR (provider = 'WINDOWS' AND password_hash IS NULL)
      ),
    UNIQUE (provider, subject_normalized)
);

CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    resource text NOT NULL,
    action text NOT NULL,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT permissions_code_format
      CHECK (code = lower(code) AND code ~ '^[a-z][a-z0-9._-]{2,127}$')
);

CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    system_role boolean NOT NULL DEFAULT false,
    assignable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_code_format
      CHECK (code = upper(code) AND code ~ '^[A-Z][A-Z0-9_]{2,63}$')
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id bigint REFERENCES organizations(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE NULLS NOT DISTINCT (user_id, role_id, organization_id)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash char(64) NOT NULL UNIQUE,
    csrf_hash char(64) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at timestamptz,
    client_ip text NOT NULL DEFAULT '',
    user_agent text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS auth_sessions_active_user_idx
  ON auth_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS sso_login_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash char(64) NOT NULL UNIQUE,
    return_path text NOT NULL DEFAULT '/',
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz
);

CREATE TABLE IF NOT EXISTS auth_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    target_type text NOT NULL DEFAULT '',
    target_id uuid,
    request_ip text NOT NULL DEFAULT '',
    user_agent text NOT NULL DEFAULT '',
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS auth_audit_events_created_idx
  ON auth_audit_events (created_at DESC);

INSERT INTO permissions (code, resource, action, name, description)
VALUES
  ('dashboard.read', 'dashboard', 'read', '查看工作台', '查看工作台、任务摘要和实时事件'),
  ('organizations.read', 'organizations', 'read', '查看组织机构', '查看组织机构档案'),
  ('organizations.write', 'organizations', 'write', '维护组织机构', '新增和修改组织机构档案'),
  ('environments.read', 'environments', 'read', '查看环境', '查看环境台账与产品档案'),
  ('environments.write', 'environments', 'write', '维护环境', '维护环境台账与产品关系'),
  ('catalog.read', 'catalog', 'read', '查看基础档案', '查看系统共通基础档案'),
  ('catalog.write', 'catalog', 'write', '维护基础档案', '维护系统共通基础档案'),
  ('identity.users.read', 'identity.users', 'read', '查看用户', '查看用户和身份来源'),
  ('identity.users.write', 'identity.users', 'write', '维护用户', '审核、启停和分配用户角色'),
  ('identity.roles.read', 'identity.roles', 'read', '查看角色', '查看角色与权限'),
  ('identity.roles.write', 'identity.roles', 'write', '维护角色', '新增和维护角色授权'),
  ('audit.read', 'audit', 'read', '查看审计', '查看认证与授权审计')
ON CONFLICT (code) DO UPDATE
SET resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO roles (code, name, description, system_role, assignable)
VALUES
  ('SYSTEM_ADMIN', '系统管理员', '管理用户、角色、审计和全部业务功能', true, true),
  ('OPERATOR', '运维人员', '查看并维护业务档案', true, true),
  ('VIEWER', '只读用户', '查看工作台和业务档案', true, true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_role = EXCLUDED.system_role,
    assignable = EXCLUDED.assignable;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_record.id, permission_record.id
FROM roles role_record
CROSS JOIN permissions permission_record
WHERE role_record.code = 'SYSTEM_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_record.id, permission_record.id
FROM roles role_record
JOIN permissions permission_record
  ON permission_record.code IN (
    'dashboard.read',
    'organizations.read',
    'organizations.write',
    'environments.read',
    'environments.write',
    'catalog.read',
    'catalog.write'
  )
WHERE role_record.code = 'OPERATOR'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_record.id, permission_record.id
FROM roles role_record
JOIN permissions permission_record
  ON permission_record.code IN (
    'dashboard.read',
    'organizations.read',
    'environments.read',
    'catalog.read'
  )
WHERE role_record.code = 'VIEWER'
ON CONFLICT (role_id, permission_id) DO NOTHING;
