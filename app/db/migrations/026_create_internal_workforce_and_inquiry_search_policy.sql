CREATE TABLE IF NOT EXISTS internal_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_department_id UUID REFERENCES internal_departments(id) ON DELETE RESTRICT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT internal_departments_code_format
    CHECK (code = upper(code) AND code ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  CONSTRAINT internal_departments_parent_not_self
    CHECK (parent_department_id IS NULL OR parent_department_id <> id)
);

CREATE TABLE IF NOT EXISTS user_department_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES internal_departments(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_department_memberships_period_valid
    CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from <= valid_to),
  UNIQUE (user_id, department_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_department_primary_current_unique
  ON user_department_memberships (user_id)
  WHERE is_primary = TRUE AND valid_to IS NULL;

CREATE TABLE IF NOT EXISTS business_responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT business_responsibilities_code_format
    CHECK (code = upper(code) AND code ~ '^[A-Z][A-Z0-9_]{2,63}$')
);

CREATE TABLE IF NOT EXISTS user_responsibility_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES internal_departments(id) ON DELETE RESTRICT,
  responsibility_id UUID NOT NULL REFERENCES business_responsibilities(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, department_id, responsibility_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_responsibility_primary_per_department_unique
  ON user_responsibility_assignments (user_id, department_id)
  WHERE is_primary = TRUE;

CREATE TABLE IF NOT EXISTS inquiry_search_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  auto_execute BOOLEAN NOT NULL DEFAULT TRUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  revision INTEGER NOT NULL DEFAULT 1,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inquiry_search_templates_code_format
    CHECK (code = upper(code) AND code ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  CONSTRAINT inquiry_search_templates_filters_object
    CHECK (jsonb_typeof(filters) = 'object'),
  CONSTRAINT inquiry_search_templates_revision_positive
    CHECK (revision > 0)
);

CREATE TABLE IF NOT EXISTS inquiry_search_template_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES inquiry_search_templates(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  department_id UUID REFERENCES internal_departments(id) ON DELETE CASCADE,
  responsibility_id UUID REFERENCES business_responsibilities(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inquiry_search_template_bindings_target_type
    CHECK (target_type IN ('SYSTEM', 'DEPARTMENT', 'RESPONSIBILITY', 'ROLE', 'USER')),
  CONSTRAINT inquiry_search_template_bindings_target_shape
    CHECK (
      (target_type = 'SYSTEM' AND department_id IS NULL AND responsibility_id IS NULL AND role_id IS NULL AND user_id IS NULL)
      OR (target_type = 'DEPARTMENT' AND department_id IS NOT NULL AND responsibility_id IS NULL AND role_id IS NULL AND user_id IS NULL)
      OR (target_type = 'RESPONSIBILITY' AND department_id IS NULL AND responsibility_id IS NOT NULL AND role_id IS NULL AND user_id IS NULL)
      OR (target_type = 'ROLE' AND department_id IS NULL AND responsibility_id IS NULL AND role_id IS NOT NULL AND user_id IS NULL)
      OR (target_type = 'USER' AND department_id IS NULL AND responsibility_id IS NULL AND role_id IS NULL AND user_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS inquiry_search_template_bindings_resolution_idx
  ON inquiry_search_template_bindings (target_type, priority DESC)
  WHERE enabled = TRUE;

INSERT INTO internal_departments (code, name, sort_order)
VALUES ('TECHNICAL_SERVICES', '技術サービス部', 100)
ON CONFLICT (code) DO NOTHING;

INSERT INTO internal_departments (code, name, parent_department_id, sort_order)
SELECT 'TS2', 'TS2課', parent.id, 110
  FROM internal_departments parent
 WHERE parent.code = 'TECHNICAL_SERVICES'
ON CONFLICT (code) DO NOTHING;

INSERT INTO business_responsibilities (code, name, description)
VALUES
  ('INTRODUCTION', '導入', '導入計画、移行及び初期設定を担当する'),
  ('TECHNICAL', '技術', '技術調査、設計及び障害解析を担当する'),
  ('SUPPORT', '支援', '問合対応及び運用支援を担当する'),
  ('MANAGEMENT', '管理', '業務管理、承認及び調整を担当する')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, resource, action, name, description)
VALUES
  ('identity.workforce.read', 'identity.workforce', 'read', '社内部門・職責参照', '社内部門、業務職責及び利用者の所属を参照する'),
  ('identity.workforce.write', 'identity.workforce', 'write', '社内部門・職責更新', '社内部門、業務職責及び利用者の所属を更新する'),
  ('inquiries.templates.read', 'inquiries.templates', 'read', '問合検索テンプレート参照', '問合検索テンプレート及び既定割当を参照する'),
  ('inquiries.templates.write', 'inquiries.templates', 'write', '問合検索テンプレート更新', '問合検索テンプレート及び既定割当を更新する')
ON CONFLICT (code) DO UPDATE
SET resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_record.id, permission_record.id
  FROM roles role_record
  JOIN permissions permission_record
    ON permission_record.code IN (
      'identity.workforce.read',
      'identity.workforce.write',
      'inquiries.templates.read',
      'inquiries.templates.write'
    )
 WHERE role_record.code = 'SYSTEM_ADMIN'
   AND role_record.permission_seed_enabled
ON CONFLICT (role_id, permission_id) DO NOTHING;
