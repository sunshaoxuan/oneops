ALTER TABLE ai_assistant_sessions
  DROP CONSTRAINT IF EXISTS ai_assistant_sessions_last_task_id_fkey;

ALTER TABLE ai_assistant_sessions
  ADD CONSTRAINT ai_assistant_sessions_last_task_id_fkey
    FOREIGN KEY (last_task_id)
    REFERENCES ai_assistant_tasks(id)
    ON DELETE SET NULL;

ALTER TABLE ai_assistant_sessions
  DROP CONSTRAINT IF EXISTS ai_assistant_sessions_agent_gateway_setting_id_fkey,
  DROP CONSTRAINT IF EXISTS ai_assistant_sessions_project_ref_not_blank,
  DROP CONSTRAINT IF EXISTS ai_assistant_sessions_runtime_profile_not_blank,
  DROP COLUMN IF EXISTS agent_gateway_setting_id,
  DROP COLUMN IF EXISTS project_ref,
  DROP COLUMN IF EXISTS project_code,
  DROP COLUMN IF EXISTS runtime_profile;
