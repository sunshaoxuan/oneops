UPDATE organizations
SET maintenance_status = CASE
  WHEN BTRIM(maintenance_status) IN (
    '〇', '○', '有', 'あり', '有り', '文部科学本省と一緒'
  ) THEN '〇'
  WHEN BTRIM(maintenance_status) IN (
    '✕', '×', '✗', '無', 'なし', '無し'
  ) THEN '✕'
  ELSE NULL
END
WHERE maintenance_status IS NOT NULL
  AND maintenance_status NOT IN ('〇', '✕');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'organizations'::regclass
      AND conname = 'organizations_maintenance_status_check'
  ) THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_maintenance_status_check
      CHECK (
        maintenance_status IS NULL
        OR maintenance_status IN ('〇', '✕')
      );
  END IF;
END
$$;
