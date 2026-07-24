CREATE TABLE IF NOT EXISTS environment_import_batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_system VARCHAR(64) NOT NULL,
  manifest_sha256 CHAR(64) NOT NULL,
  source_manifest JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  CONSTRAINT environment_import_batches_source_not_blank
    CHECK (length(btrim(source_system)) > 0),
  CONSTRAINT environment_import_batches_manifest_sha256_valid
    CHECK (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT environment_import_batches_status_valid
    CHECK (status IN ('PLANNED', 'COMPLETED', 'PARTIAL', 'FAILED')),
  CONSTRAINT environment_import_batches_source_manifest_key
    UNIQUE (source_system, manifest_sha256)
);

CREATE TABLE IF NOT EXISTS environment_import_rows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_id BIGINT NOT NULL
    REFERENCES environment_import_batches(id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE,
  source_system VARCHAR(64) NOT NULL,
  source_file_name VARCHAR(255) NOT NULL,
  source_row_number INTEGER NOT NULL,
  row_kind VARCHAR(30) NOT NULL,
  row_fingerprint CHAR(64) NOT NULL,
  sanitized_payload JSONB NOT NULL,
  credential_field_count INTEGER NOT NULL DEFAULT 0,
  resolution_status VARCHAR(20) NOT NULL,
  organization_id BIGINT
    REFERENCES organizations(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  environment_id BIGINT
    REFERENCES environments(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT environment_import_rows_source_not_blank
    CHECK (length(btrim(source_system)) > 0),
  CONSTRAINT environment_import_rows_file_not_blank
    CHECK (length(btrim(source_file_name)) > 0),
  CONSTRAINT environment_import_rows_row_number_positive
    CHECK (source_row_number > 0),
  CONSTRAINT environment_import_rows_row_kind_valid
    CHECK (row_kind IN ('ENVIRONMENT', 'RDP', 'TAG_ASSOCIATION')),
  CONSTRAINT environment_import_rows_fingerprint_valid
    CHECK (row_fingerprint ~ '^[0-9a-f]{64}$'),
  CONSTRAINT environment_import_rows_credential_count_non_negative
    CHECK (credential_field_count >= 0),
  CONSTRAINT environment_import_rows_resolution_status_valid
    CHECK (
      resolution_status IN (
        'IMPORTED',
        'STAGED',
        'UNMATCHED',
        'CONFLICT',
        'UNCHANGED'
      )
    ),
  CONSTRAINT environment_import_rows_batch_row_key
    UNIQUE (batch_id, source_file_name, source_row_number)
);

CREATE INDEX IF NOT EXISTS environment_import_rows_batch_idx
  ON environment_import_rows (batch_id, row_kind, resolution_status, id);

CREATE INDEX IF NOT EXISTS environment_import_rows_organization_idx
  ON environment_import_rows (organization_id, environment_id, id);

CREATE INDEX IF NOT EXISTS environment_import_rows_source_fingerprint_idx
  ON environment_import_rows (
    source_system,
    row_fingerprint,
    resolution_status,
    id
  );
