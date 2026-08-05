ALTER TABLE customer_information_settings
  ADD COLUMN IF NOT EXISTS inquiry_source_setting_id UUID,
  ADD COLUMN IF NOT EXISTS inquiry_external_customer_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS inquiry_customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS inquiry_last_synced_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customer_information_settings_source_fkey'
  ) THEN
    ALTER TABLE customer_information_settings
      ADD CONSTRAINT customer_information_settings_source_fkey
      FOREIGN KEY (inquiry_source_setting_id)
      REFERENCES inquiry_source_settings(id)
      ON UPDATE RESTRICT
      ON DELETE RESTRICT;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customer_information_settings_external_id_valid'
  ) THEN
    ALTER TABLE customer_information_settings
      ADD CONSTRAINT customer_information_settings_external_id_valid
      CHECK (
        inquiry_external_customer_id IS NULL
        OR (
          length(btrim(inquiry_external_customer_id)) BETWEEN 1 AND 100
          AND inquiry_external_customer_id !~ '[[:cntrl:]]'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customer_information_settings_customer_name_valid'
  ) THEN
    ALTER TABLE customer_information_settings
      ADD CONSTRAINT customer_information_settings_customer_name_valid
      CHECK (
        inquiry_customer_name IS NULL
        OR length(btrim(inquiry_customer_name)) BETWEEN 1 AND 255
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS customer_information_settings_source_idx
  ON customer_information_settings (
    inquiry_source_setting_id,
    inquiry_external_customer_id
  );
