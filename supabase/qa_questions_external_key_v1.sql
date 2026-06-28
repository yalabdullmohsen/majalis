-- =====================================================================
-- QA questions — external_key + import provenance (idempotent)
-- Run in Supabase SQL Editor after qa_questions.sql / cms_platform_v4.sql
-- =====================================================================

ALTER TABLE qa_questions
  ADD COLUMN IF NOT EXISTS external_key TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_ref TEXT,
  ADD COLUMN IF NOT EXISTS import_batch_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS qa_questions_external_key_uidx
  ON qa_questions (external_key)
  WHERE external_key IS NOT NULL;

COMMENT ON COLUMN qa_questions.external_key IS 'Stable dedupe key for imports and fawaid recovery';
COMMENT ON COLUMN qa_questions.source_type IS 'Origin: quiz_csv, fawaid_recovery, manual, etc.';
COMMENT ON COLUMN qa_questions.source_ref IS 'Source row id or file reference';
COMMENT ON COLUMN qa_questions.import_batch_id IS 'Batch id for bulk recovery runs';
