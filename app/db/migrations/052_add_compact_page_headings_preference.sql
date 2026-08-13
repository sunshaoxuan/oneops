ALTER TABLE users
  ADD COLUMN IF NOT EXISTS compact_page_headings boolean NOT NULL DEFAULT false;
