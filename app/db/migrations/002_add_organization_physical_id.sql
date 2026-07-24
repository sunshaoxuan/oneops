ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS id BIGINT GENERATED ALWAYS AS IDENTITY;

DO $$
DECLARE
  primary_key_columns TEXT[];
BEGIN
  SELECT array_agg(attribute.attname ORDER BY key_column.ordinality)
    INTO primary_key_columns
  FROM pg_constraint AS constraint_record
  CROSS JOIN LATERAL unnest(constraint_record.conkey)
    WITH ORDINALITY AS key_column(attribute_number, ordinality)
  JOIN pg_attribute AS attribute
    ON attribute.attrelid = constraint_record.conrelid
   AND attribute.attnum = key_column.attribute_number
  WHERE constraint_record.conrelid = 'organizations'::regclass
    AND constraint_record.contype = 'p';

  IF primary_key_columns = ARRAY['code'] THEN
    ALTER TABLE organizations DROP CONSTRAINT organizations_pkey;
  END IF;
END
$$;

ALTER TABLE organizations
  ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'organizations'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'organizations'::regclass
      AND contype = 'u'
      AND conname = 'organizations_code_key'
  ) THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_code_key UNIQUE (code);
  END IF;
END
$$;
