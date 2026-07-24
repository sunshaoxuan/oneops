ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS remarks VARCHAR(1000);

UPDATE organizations
SET remarks = '保守有無原文：文部科学本省と一緒'
WHERE code = '0076'
  AND NULLIF(BTRIM(remarks), '') IS NULL;
