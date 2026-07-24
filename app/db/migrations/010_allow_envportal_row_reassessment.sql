ALTER TABLE environment_import_rows
  DROP CONSTRAINT IF EXISTS
    environment_import_rows_source_fingerprint_key;

CREATE INDEX IF NOT EXISTS environment_import_rows_source_fingerprint_idx
  ON environment_import_rows (
    source_system,
    row_fingerprint,
    resolution_status,
    id
  );
