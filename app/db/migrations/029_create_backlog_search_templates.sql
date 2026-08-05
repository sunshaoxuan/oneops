CREATE TABLE IF NOT EXISTS backlog_search_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  project_id VARCHAR(100) NOT NULL,
  project_key VARCHAR(100) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  field_id VARCHAR(100) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  match_mode VARCHAR(30) NOT NULL DEFAULT 'CUSTOM_FIELD',
  value_source VARCHAR(20) NOT NULL DEFAULT 'AUTO',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT backlog_search_templates_name_not_blank
    CHECK (length(btrim(template_name)) BETWEEN 1 AND 255),
  CONSTRAINT backlog_search_templates_project_id_not_blank
    CHECK (length(btrim(project_id)) BETWEEN 1 AND 100),
  CONSTRAINT backlog_search_templates_project_key_not_blank
    CHECK (length(btrim(project_key)) BETWEEN 1 AND 100),
  CONSTRAINT backlog_search_templates_project_name_not_blank
    CHECK (length(btrim(project_name)) BETWEEN 1 AND 255),
  CONSTRAINT backlog_search_templates_field_id_not_blank
    CHECK (length(btrim(field_id)) BETWEEN 1 AND 100),
  CONSTRAINT backlog_search_templates_field_name_not_blank
    CHECK (length(btrim(field_name)) BETWEEN 1 AND 255),
  CONSTRAINT backlog_search_templates_match_mode_valid
    CHECK (match_mode IN ('CUSTOM_FIELD', 'TITLE_CONTAINS')),
  CONSTRAINT backlog_search_templates_title_field_valid
    CHECK (
      (match_mode = 'TITLE_CONTAINS' AND field_id = '__SUMMARY__' AND field_name = '件名') OR
      (match_mode = 'CUSTOM_FIELD' AND field_id <> '__SUMMARY__')
    ),
  CONSTRAINT backlog_search_templates_value_source_valid
    CHECK (value_source IN ('AUTO', 'CODE', 'NAME', 'SHORT_NAME')),
  CONSTRAINT backlog_search_templates_sort_order_valid
    CHECK (sort_order >= 0),
  CONSTRAINT backlog_search_templates_revision_positive
    CHECK (revision > 0)
);

CREATE INDEX IF NOT EXISTS backlog_search_templates_enabled_order_idx
  ON backlog_search_templates (enabled, sort_order, project_name, template_name);
