CREATE TABLE IF NOT EXISTS organization_classifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS classification_id BIGINT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'organizations'
      AND column_name = 'classification'
  ) THEN
    INSERT INTO organization_classifications (code, name)
    SELECT
      'CLASS-' || UPPER(SUBSTRING(md5(BTRIM(classification)) FROM 1 FOR 12)),
      BTRIM(classification)
    FROM organizations
    WHERE NULLIF(BTRIM(classification), '') IS NOT NULL
    ON CONFLICT (name) DO NOTHING;

    UPDATE organizations AS organization
    SET classification_id = classification.id
    FROM organization_classifications AS classification
    WHERE classification.name = BTRIM(organization.classification)
      AND organization.classification_id IS NULL;

    ALTER TABLE organizations DROP COLUMN classification;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'organizations'::regclass
      AND conname = 'organizations_classification_id_fkey'
  ) THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_classification_id_fkey
      FOREIGN KEY (classification_id)
      REFERENCES organization_classifications(id)
      ON UPDATE RESTRICT
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS organizations_classification_id_idx
  ON organizations(classification_id);
