CREATE TABLE IF NOT EXISTS customer_information_settings (
  organization_id BIGINT PRIMARY KEY
    REFERENCES organizations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  inquiry_customer_code VARCHAR(100),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customer_information_settings_revision_positive
    CHECK (revision > 0),
  CONSTRAINT customer_information_settings_inquiry_code_valid
    CHECK (
      inquiry_customer_code IS NULL
      OR (
        length(btrim(inquiry_customer_code)) BETWEEN 1 AND 100
        AND inquiry_customer_code !~ '[[:cntrl:]]'
      )
    )
);

CREATE TABLE IF NOT EXISTS customer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,
  product_id BIGINT REFERENCES products(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  service_name VARCHAR(255),
  introduction_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
  introduction_start_date DATE,
  introduction_end_date DATE,
  maintenance_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
  maintenance_start_date DATE,
  maintenance_end_date DATE,
  notes VARCHAR(2000),
  revision INTEGER NOT NULL DEFAULT 1,
  archived_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customer_contracts_item_type_valid
    CHECK (item_type IN ('PRODUCT', 'SERVICE')),
  CONSTRAINT customer_contracts_item_reference_valid
    CHECK (
      (item_type = 'PRODUCT' AND product_id IS NOT NULL AND service_name IS NULL)
      OR
      (
        item_type = 'SERVICE'
        AND product_id IS NULL
        AND length(btrim(service_name)) BETWEEN 1 AND 255
      )
    ),
  CONSTRAINT customer_contracts_introduction_status_valid
    CHECK (introduction_status IN ('NONE', 'PLANNED', 'ACTIVE', 'EXPIRED', 'TERMINATED')),
  CONSTRAINT customer_contracts_maintenance_status_valid
    CHECK (maintenance_status IN ('NONE', 'PLANNED', 'ACTIVE', 'EXPIRED', 'TERMINATED')),
  CONSTRAINT customer_contracts_introduction_dates_valid
    CHECK (
      introduction_start_date IS NULL
      OR introduction_end_date IS NULL
      OR introduction_start_date <= introduction_end_date
    ),
  CONSTRAINT customer_contracts_maintenance_dates_valid
    CHECK (
      maintenance_start_date IS NULL
      OR maintenance_end_date IS NULL
      OR maintenance_start_date <= maintenance_end_date
    ),
  CONSTRAINT customer_contracts_revision_positive CHECK (revision > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_contracts_active_product_key
  ON customer_contracts (organization_id, product_id)
  WHERE archived_at IS NULL AND item_type = 'PRODUCT';

CREATE UNIQUE INDEX IF NOT EXISTS customer_contracts_active_service_key
  ON customer_contracts (organization_id, lower(btrim(service_name)))
  WHERE archived_at IS NULL AND item_type = 'SERVICE';

CREATE INDEX IF NOT EXISTS customer_contracts_organization_idx
  ON customer_contracts (organization_id, archived_at, updated_at DESC);

CREATE TABLE IF NOT EXISTS customer_vpn_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  vpn_type VARCHAR(20) NOT NULL,
  provider_name VARCHAR(255),
  endpoint VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  notes VARCHAR(2000),
  revision INTEGER NOT NULL DEFAULT 1,
  archived_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customer_vpn_connections_name_not_blank
    CHECK (length(btrim(name)) BETWEEN 1 AND 255),
  CONSTRAINT customer_vpn_connections_type_valid
    CHECK (vpn_type IN ('IPSEC', 'SSL', 'MPLS', 'OTHER')),
  CONSTRAINT customer_vpn_connections_status_valid
    CHECK (status IN ('ACTIVE', 'PREPARING', 'SUSPENDED', 'RETIRED')),
  CONSTRAINT customer_vpn_connections_revision_positive CHECK (revision > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_vpn_connections_active_name_key
  ON customer_vpn_connections (organization_id, lower(btrim(name)))
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS customer_vpn_connections_organization_idx
  ON customer_vpn_connections (organization_id, archived_at, updated_at DESC);

CREATE TABLE IF NOT EXISTS customer_backlog_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id BIGINT NOT NULL
    REFERENCES organizations(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  external_project_id VARCHAR(100) NOT NULL,
  project_key VARCHAR(100) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT customer_backlog_projects_external_id_not_blank
    CHECK (length(btrim(external_project_id)) BETWEEN 1 AND 100),
  CONSTRAINT customer_backlog_projects_key_not_blank
    CHECK (length(btrim(project_key)) BETWEEN 1 AND 100),
  CONSTRAINT customer_backlog_projects_name_not_blank
    CHECK (length(btrim(project_name)) BETWEEN 1 AND 255),
  UNIQUE (organization_id, external_project_id)
);

CREATE INDEX IF NOT EXISTS customer_backlog_projects_organization_idx
  ON customer_backlog_projects (organization_id, project_name, external_project_id);
