CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL UNIQUE,
  CONSTRAINT organizations_code_not_blank CHECK (length(btrim(code)) > 0),
  CONSTRAINT organizations_name_not_blank CHECK (length(btrim(name)) > 0)
);
