-- 長期タスクを条件発動型へ整理し、日付条件と意味条件を同時に保持しないようにします。
UPDATE personal_tasks
SET review_cycle = NULL,
    custom_review_days = NULL
WHERE task_type = 'LONG_TERM'
  AND (review_cycle IS NOT NULL OR custom_review_days IS NOT NULL);

DO $$
DECLARE
  constraint_definition TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid)
    INTO constraint_definition
    FROM pg_constraint
   WHERE conrelid = 'personal_tasks'::regclass
     AND conname = 'personal_tasks_schedule_check';
  IF constraint_definition IS NULL THEN
    ALTER TABLE personal_tasks
      ADD CONSTRAINT personal_tasks_schedule_check CHECK (
        (task_type = 'DEADLINE' AND due_at IS NOT NULL
          AND next_review_at IS NULL AND review_cycle IS NULL
          AND custom_review_days IS NULL)
        OR
        (task_type = 'LONG_TERM' AND due_at IS NULL
          AND review_cycle IS NULL AND custom_review_days IS NULL
          AND NOT (next_review_at IS NOT NULL
            AND btrim(automation_prompt) <> ''))
      );
  ELSIF position('btrim(automation_prompt)' IN constraint_definition) = 0 THEN
    ALTER TABLE personal_tasks
      DROP CONSTRAINT personal_tasks_schedule_check;
    ALTER TABLE personal_tasks
      ADD CONSTRAINT personal_tasks_schedule_check CHECK (
        (task_type = 'DEADLINE' AND due_at IS NOT NULL
          AND next_review_at IS NULL AND review_cycle IS NULL
          AND custom_review_days IS NULL)
        OR
        (task_type = 'LONG_TERM' AND due_at IS NULL
          AND review_cycle IS NULL AND custom_review_days IS NULL
          AND NOT (next_review_at IS NOT NULL
            AND btrim(automation_prompt) <> ''))
      );
  END IF;
END $$;
