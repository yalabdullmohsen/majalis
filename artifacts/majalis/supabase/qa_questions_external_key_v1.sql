-- QA questions — external_key for deduplication + recovery
-- Run via: apply-migrations?scope=qa-external-key

ALTER TABLE IF EXISTS qa_questions
  ADD COLUMN IF NOT EXISTS external_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS qa_questions_external_key_uidx
  ON qa_questions (external_key)
  WHERE external_key IS NOT NULL AND external_key <> '';

CREATE INDEX IF NOT EXISTS qa_questions_external_key_idx
  ON qa_questions (external_key)
  WHERE external_key IS NOT NULL;

COMMENT ON COLUMN qa_questions.external_key IS 'Stable dedup key — qa:{slug}:{hash} or import source id';
