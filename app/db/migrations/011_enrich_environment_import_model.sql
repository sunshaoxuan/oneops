ALTER TABLE environment_product_versions
  ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20)
    NOT NULL DEFAULT 'CONFIRMED';

ALTER TABLE environment_product_versions
  DROP CONSTRAINT IF EXISTS
    environment_product_versions_confirmation_status_valid;

ALTER TABLE environment_product_versions
  ADD CONSTRAINT
    environment_product_versions_confirmation_status_valid
  CHECK (confirmation_status IN ('PENDING', 'CONFIRMED', 'REJECTED'));

CREATE TABLE IF NOT EXISTS environment_endpoints (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  environment_id BIGINT NOT NULL
    REFERENCES environments(id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  hostname VARCHAR(255),
  ip_address INET,
  port INTEGER,
  protocol VARCHAR(30),
  database_type VARCHAR(60),
  database_version VARCHAR(60),
  database_name VARCHAR(255),
  notes VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT environment_endpoints_name_not_blank
    CHECK (length(btrim(name)) > 0),
  CONSTRAINT environment_endpoints_role_valid
    CHECK (
      role IN (
        'AP',
        'DB',
        'BASTION',
        'LOAD_BALANCER',
        'FILE_SERVER',
        'OTHER'
      )
    ),
  CONSTRAINT environment_endpoints_port_valid
    CHECK (port IS NULL OR port BETWEEN 1 AND 65535),
  CONSTRAINT environment_endpoints_status_valid
    CHECK (status IN ('ACTIVE', 'PREPARING', 'SUSPENDED', 'RETIRED')),
  CONSTRAINT environment_endpoints_sort_order_non_negative
    CHECK (sort_order >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS
  environment_endpoints_environment_identity_key
  ON environment_endpoints (
    environment_id,
    role,
    lower(btrim(name)),
    lower(COALESCE(hostname, '')),
    COALESCE(host(ip_address), ''),
    COALESCE(port, 0)
  );

CREATE INDEX IF NOT EXISTS environment_endpoints_environment_idx
  ON environment_endpoints (
    environment_id,
    status,
    sort_order,
    id
  );

ALTER TABLE environment_import_rows
  DROP CONSTRAINT IF EXISTS environment_import_rows_row_kind_valid;

ALTER TABLE environment_import_rows
  ADD CONSTRAINT environment_import_rows_row_kind_valid
  CHECK (
    row_kind IN (
      'ENVIRONMENT',
      'RDP',
      'TAG_ASSOCIATION',
      'PRODUCT_CANDIDATE'
    )
  );

ALTER TABLE environment_import_rows
  DROP CONSTRAINT IF EXISTS
    environment_import_rows_resolution_status_valid;

ALTER TABLE environment_import_rows
  ADD CONSTRAINT environment_import_rows_resolution_status_valid
  CHECK (
    resolution_status IN (
      'IMPORTED',
      'ENRICHED',
      'STAGED',
      'UNMATCHED',
      'CONFLICT',
      'UNCHANGED'
    )
  );
