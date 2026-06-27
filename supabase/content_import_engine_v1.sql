-- Content Import Engine v1 — job tracking, rollback, staged content in DB (no local files)
-- Safe to re-run (IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS content_import_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID,
  admin_role      TEXT,
  content_type    TEXT NOT NULL,
  filename        TEXT,
  file_size_bytes BIGINT DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','validating','preview','importing','completed','failed','rolled_back')),
  total_rows      INT NOT NULL DEFAULT 0,
  imported_count  INT NOT NULL DEFAULT 0,
  skipped_count   INT NOT NULL DEFAULT 0,
  failed_count    INT NOT NULL DEFAULT 0,
  progress_pct    INT NOT NULL DEFAULT 0,
  progress_stage  TEXT,
  error_summary   TEXT,
  errors          JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_headers  JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_ms     INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_import_jobs_created_idx ON content_import_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS content_import_jobs_status_idx ON content_import_jobs (status);

CREATE TABLE IF NOT EXISTS content_import_job_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES content_import_jobs(id) ON DELETE CASCADE,
  row_index   INT NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  dedupe_key  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_import_job_records_job_idx ON content_import_job_records (job_id);

-- Replace local staged files for adhkar / quran metadata
CREATE TABLE IF NOT EXISTS platform_adhkar_items (
  id            TEXT PRIMARY KEY,
  category_id   TEXT NOT NULL,
  text          TEXT NOT NULL,
  count         INT NOT NULL DEFAULT 1,
  source        TEXT,
  narrator      TEXT,
  grade         TEXT,
  reference     TEXT,
  keywords      JSONB NOT NULL DEFAULT '[]'::jsonb,
  external_key  TEXT,
  status        TEXT NOT NULL DEFAULT 'approved',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_adhkar_external_key_idx
  ON platform_adhkar_items (external_key) WHERE external_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS platform_quran_surahs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number        INT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  english_name  TEXT,
  ayahs         INT NOT NULL,
  revelation    TEXT DEFAULT 'مكية',
  summary       TEXT,
  themes        JSONB NOT NULL DEFAULT '[]'::jsonb,
  external_key  TEXT,
  status        TEXT NOT NULL DEFAULT 'approved',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_quran_topics (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  summary       TEXT,
  category      TEXT NOT NULL,
  surah_refs    JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords      JSONB NOT NULL DEFAULT '[]'::jsonb,
  external_key  TEXT,
  status        TEXT NOT NULL DEFAULT 'approved',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_quran_topics_external_key_idx
  ON platform_quran_topics (external_key) WHERE external_key IS NOT NULL;
