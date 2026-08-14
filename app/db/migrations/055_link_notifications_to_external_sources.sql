DO $migration$
BEGIN
IF EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'user_notifications'
    AND column_name = 'source_system_id'
) THEN
  RETURN;
END IF;

ALTER TABLE user_notifications
  ADD COLUMN source_system_id UUID REFERENCES external_systems(id) ON DELETE RESTRICT,
  ADD COLUMN source_object_id TEXT;

UPDATE user_notifications AS notification
SET source_system_id = candidate.external_system_id,
    source_object_id = candidate.external_object_id,
    action_path = '/tasks?view=candidates&candidateId=' || candidate.id::text
FROM personal_task_candidates AS candidate
WHERE notification.notification_type = 'PERSONAL_TASK_CANDIDATE_CREATED'
  AND notification.resource_type = 'PERSONAL_TASK_CANDIDATE'
  AND notification.resource_id = candidate.id;

ALTER TABLE user_notifications
  ADD CONSTRAINT user_notifications_candidate_source_check CHECK (
    notification_type <> 'PERSONAL_TASK_CANDIDATE_CREATED'
    OR (
      resource_type = 'PERSONAL_TASK_CANDIDATE'
      AND source_system_id IS NOT NULL
      AND source_object_id IS NOT NULL
      AND btrim(source_object_id) <> ''
    )
  );

CREATE INDEX user_notifications_source_idx
  ON user_notifications (source_system_id, source_object_id);

END
$migration$;
