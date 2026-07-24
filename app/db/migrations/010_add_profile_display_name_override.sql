ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name_overridden boolean
  NOT NULL DEFAULT false;
