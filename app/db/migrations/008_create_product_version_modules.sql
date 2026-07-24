CREATE TABLE IF NOT EXISTS product_version_modules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_version_id BIGINT NOT NULL
    REFERENCES product_versions(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(120),
  lifecycle_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_version_modules_code_not_blank
    CHECK (length(btrim(code)) > 0),
  CONSTRAINT product_version_modules_name_not_blank
    CHECK (length(btrim(name)) > 0),
  CONSTRAINT product_version_modules_lifecycle_status_valid
    CHECK (lifecycle_status IN ('ACTIVE', 'RETIRED')),
  CONSTRAINT product_version_modules_sort_order_non_negative
    CHECK (sort_order >= 0),
  CONSTRAINT product_version_modules_id_version_unique
    UNIQUE (id, product_version_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_version_modules_version_code_key
  ON product_version_modules (
    product_version_id,
    lower(btrim(code))
  );

CREATE UNIQUE INDEX IF NOT EXISTS product_version_modules_version_name_key
  ON product_version_modules (
    product_version_id,
    lower(btrim(name))
  );

CREATE INDEX IF NOT EXISTS product_version_modules_version_idx
  ON product_version_modules (
    product_version_id,
    lifecycle_status,
    sort_order,
    id
  );

CREATE TABLE IF NOT EXISTS environment_product_version_modules (
  environment_id BIGINT NOT NULL,
  product_version_id BIGINT NOT NULL,
  product_version_module_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (environment_id, product_version_module_id),
  CONSTRAINT environment_product_version_modules_parent_fk
    FOREIGN KEY (environment_id, product_version_id)
    REFERENCES environment_product_versions (
      environment_id,
      product_version_id
    )
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  CONSTRAINT environment_product_version_modules_module_fk
    FOREIGN KEY (
      product_version_module_id,
      product_version_id
    )
    REFERENCES product_version_modules (
      id,
      product_version_id
    )
    ON UPDATE RESTRICT
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS environment_product_version_modules_module_idx
  ON environment_product_version_modules (
    product_version_module_id,
    environment_id
  );
