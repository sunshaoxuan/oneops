ALTER TABLE customer_information_settings
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

UPDATE customer_information_settings
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE customer_information_settings
  ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint AS constraint_record
    JOIN pg_attribute AS attribute_record
      ON attribute_record.attrelid = constraint_record.conrelid
     AND attribute_record.attnum = ANY (constraint_record.conkey)
    WHERE constraint_record.conrelid =
      'customer_information_settings'::regclass
      AND constraint_record.contype = 'p'
      AND array_length(constraint_record.conkey, 1) = 1
      AND attribute_record.attname = 'id'
  ) THEN
    ALTER TABLE customer_information_settings
      DROP CONSTRAINT IF EXISTS customer_information_settings_pkey;
    ALTER TABLE customer_information_settings
      ADD CONSTRAINT customer_information_settings_pkey PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customer_information_settings_organization_key'
  ) THEN
    ALTER TABLE customer_information_settings
      ADD CONSTRAINT customer_information_settings_organization_key
      UNIQUE (organization_id);
  END IF;
END
$$;
