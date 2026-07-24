CREATE TABLE IF NOT EXISTS environment_groups (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  name VARCHAR(120) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT environment_groups_name_not_blank
    CHECK (length(btrim(name)) > 0),
  CONSTRAINT environment_groups_sort_order_non_negative
    CHECK (sort_order >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS environment_groups_active_name_key
  ON environment_groups (organization_id, lower(btrim(name)))
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS environment_groups_organization_idx
  ON environment_groups (organization_id, sort_order, id);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL UNIQUE,
  short_name VARCHAR(120),
  lifecycle_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT products_code_not_blank CHECK (length(btrim(code)) > 0),
  CONSTRAINT products_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT products_lifecycle_status_valid
    CHECK (lifecycle_status IN ('ACTIVE', 'RETIRED')),
  CONSTRAINT products_sort_order_non_negative CHECK (sort_order >= 0)
);

CREATE TABLE IF NOT EXISTS product_versions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL
    REFERENCES products(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  version VARCHAR(100) NOT NULL,
  display_version VARCHAR(120),
  lifecycle_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_versions_version_not_blank
    CHECK (length(btrim(version)) > 0),
  CONSTRAINT product_versions_lifecycle_status_valid
    CHECK (lifecycle_status IN ('ACTIVE', 'RETIRED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS product_versions_product_version_key
  ON product_versions (product_id, lower(btrim(version)));

CREATE INDEX IF NOT EXISTS product_versions_product_idx
  ON product_versions (product_id, lifecycle_status, id);

CREATE TABLE IF NOT EXISTS environments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  group_id BIGINT NOT NULL
    REFERENCES environment_groups(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  scope VARCHAR(20) NOT NULL,
  purpose VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  url TEXT,
  owner_name VARCHAR(255),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  last_verified_at DATE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT environments_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT environments_scope_valid
    CHECK (scope IN ('CUSTOMER', 'INTERNAL')),
  CONSTRAINT environments_purpose_valid
    CHECK (
      purpose IN (
        'PRODUCTION',
        'VERIFICATION',
        'DEVELOPMENT',
        'TRAINING',
        'OTHER'
      )
    ),
  CONSTRAINT environments_status_valid
    CHECK (status IN ('ACTIVE', 'PREPARING', 'SUSPENDED', 'RETIRED')),
  CONSTRAINT environments_sort_order_non_negative CHECK (sort_order >= 0),
  CONSTRAINT environments_revision_positive CHECK (revision > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS environments_active_name_key
  ON environments (organization_id, lower(btrim(name)))
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS environments_organization_idx
  ON environments (
    organization_id,
    archived_at,
    group_id,
    sort_order,
    id
  );

CREATE TABLE IF NOT EXISTS environment_product_versions (
  environment_id BIGINT NOT NULL
    REFERENCES environments(id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  product_version_id BIGINT NOT NULL
    REFERENCES product_versions(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  usage_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  notes VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (environment_id, product_version_id),
  CONSTRAINT environment_product_versions_usage_status_valid
    CHECK (usage_status IN ('ACTIVE', 'PLANNED', 'SUSPENDED', 'RETIRED'))
);

CREATE INDEX IF NOT EXISTS environment_product_versions_version_idx
  ON environment_product_versions (product_version_id, environment_id);

INSERT INTO environment_groups (organization_id, name, sort_order)
SELECT organization.id, '基本環境', 0
FROM organizations AS organization
WHERE NOT EXISTS (
  SELECT 1
  FROM environment_groups AS environment_group
  WHERE environment_group.organization_id = organization.id
    AND environment_group.archived_at IS NULL
);
