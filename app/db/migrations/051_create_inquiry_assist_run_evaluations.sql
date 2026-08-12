CREATE TABLE IF NOT EXISTS inquiry_assist_run_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assist_run_id UUID NOT NULL
    REFERENCES inquiry_assist_runs(id) ON DELETE CASCADE,
  evaluator_user_id UUID NOT NULL
    REFERENCES users(id) ON DELETE RESTRICT,
  rating TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inquiry_assist_run_evaluations_rating_check
    CHECK (rating IN ('POSITIVE', 'NEGATIVE')),
  CONSTRAINT inquiry_assist_run_evaluations_comment_length_check
    CHECK (char_length(comment) <= 2000),
  CONSTRAINT inquiry_assist_run_evaluations_run_evaluator_unique
    UNIQUE (assist_run_id, evaluator_user_id)
);

CREATE INDEX IF NOT EXISTS inquiry_assist_run_evaluations_rating_idx
  ON inquiry_assist_run_evaluations (rating, updated_at DESC);
