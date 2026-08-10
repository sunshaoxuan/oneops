ALTER TABLE agent_gateway_settings
  ADD COLUMN IF NOT EXISTS fallback_endpoint_urls JSONB NOT NULL
    DEFAULT '[]'::jsonb;

ALTER TABLE agent_gateway_settings
  DROP CONSTRAINT IF EXISTS agent_gateway_settings_fallback_endpoints_check;

ALTER TABLE agent_gateway_settings
  ADD CONSTRAINT agent_gateway_settings_fallback_endpoints_check
    CHECK (
      jsonb_typeof(fallback_endpoint_urls) = 'array'
      AND jsonb_array_length(fallback_endpoint_urls) <= 4
    );
