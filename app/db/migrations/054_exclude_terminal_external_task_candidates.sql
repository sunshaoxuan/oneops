WITH terminal_candidates AS (
  SELECT candidate.id
  FROM personal_task_candidates AS candidate
  JOIN external_systems AS system
    ON system.id = candidate.external_system_id
  WHERE candidate.disposition = 'PENDING'
    AND (
      (
        system.code = 'BACKLOG'
        AND upper(regexp_replace(candidate.external_status, '[[:space:]:：]', '', 'g'))
          IN ('完了', '処理済', '処理済み', '終了', '解決済', '解決済み', 'CLOSED', 'COMPLETED', 'DONE', 'RESOLVED')
      )
      OR (
        system.code = 'INQUIRY'
        AND upper(regexp_replace(candidate.external_status, '[[:space:]:：]', '', 'g')) LIKE 'CLOSED%'
      )
    )
), deleted_notifications AS (
  DELETE FROM user_notifications
  WHERE resource_type = 'PERSONAL_TASK_CANDIDATE'
    AND resource_id IN (SELECT id FROM terminal_candidates)
)
UPDATE personal_task_candidates
SET disposition = 'STALE',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT id FROM terminal_candidates);
