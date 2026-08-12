-- =====================================================================
--  المجلس العلمي — CMS Platform v4
--  نظام إدارة محتوى + Content Aggregator + منع التكرار + Audit
--  آمن لإعادة التشغيل — لا يحذف جداول أو بيانات
--  نفّذ بعد: platform_v2_schema_fixed.sql + platform_expansion_v3.sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── 1. Enums ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE cms_content_kind AS ENUM (
    'lesson', 'lecture', 'course', 'sheikh', 'book', 'fatwa', 'article',
    'news', 'announcement', 'fawaid', 'qa', 'miracle',
    'fiqh_decision', 'sharia_ruling', 'annual_course'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cms_workflow_status AS ENUM (
    'draft', 'pending', 'approved', 'published', 'archived', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE import_job_status AS ENUM (
    'pending', 'running', 'completed', 'failed', 'partial'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Content sources registry ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  source_type     TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'json', 'api', 'rss', 'csv', 'cron')),
  base_url        TEXT,
  config          JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_sync_at    TIMESTAMPTZ,
  last_sync_status TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO content_sources (slug, name, source_type, config)
VALUES
  ('manual-admin', 'لوحة التحكم', 'manual', '{}'),
  ('json-bulk', 'استيراد JSON', 'json', '{}'),
  ('lessons-seed', 'بذور الدروس', 'json', '{"path":"lessons-seed"}'),
  ('platform-seed', 'بذور المنصة', 'json', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ── 3. Import jobs (aggregator audit trail) ─────────────────────────────
CREATE TABLE IF NOT EXISTS import_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID REFERENCES content_sources(id) ON DELETE SET NULL,
  content_kind    cms_content_kind,
  status          import_job_status NOT NULL DEFAULT 'pending',
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  total_rows      INT NOT NULL DEFAULT 0,
  inserted_count  INT NOT NULL DEFAULT 0,
  updated_count   INT NOT NULL DEFAULT 0,
  skipped_count   INT NOT NULL DEFAULT 0,
  duplicate_count INT NOT NULL DEFAULT 0,
  error_count     INT NOT NULL DEFAULT 0,
  initiated_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  summary         JSONB NOT NULL DEFAULT '{}',
  error_log       JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS import_jobs_status_idx ON import_jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS import_jobs_source_idx ON import_jobs (source_id);

CREATE TABLE IF NOT EXISTS import_job_rows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_index       INT NOT NULL,
  external_key    TEXT,
  action          TEXT NOT NULL CHECK (action IN ('insert', 'update', 'skip', 'duplicate', 'error')),
  record_id       UUID,
  duplicate_of    UUID,
  message         TEXT,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS import_job_rows_job_idx ON import_job_rows (job_id);

-- ── 4. Dedup registry ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_dedup_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_kind    cms_content_kind NOT NULL,
  external_key    TEXT,
  slug            TEXT,
  content_hash    TEXT NOT NULL,
  title_norm      TEXT,
  speaker_norm    TEXT,
  record_table    TEXT NOT NULL,
  record_id       UUID NOT NULL,
  source_id       UUID REFERENCES content_sources(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_kind, content_hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS content_dedup_external_key_uidx
  ON content_dedup_keys (content_kind, external_key)
  WHERE external_key IS NOT NULL AND external_key <> '';

CREATE INDEX IF NOT EXISTS content_dedup_slug_idx ON content_dedup_keys (content_kind, slug);
CREATE INDEX IF NOT EXISTS content_dedup_title_trgm_idx
  ON content_dedup_keys USING gin (title_norm gin_trgm_ops);

-- ── 5. CMS content index (polymorphic lookup for search/dashboard) ──────
CREATE TABLE IF NOT EXISTS cms_content_index (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_kind    cms_content_kind NOT NULL,
  record_table    TEXT NOT NULL,
  record_id       UUID NOT NULL,
  external_key    TEXT,
  slug            TEXT,
  title           TEXT NOT NULL,
  summary         TEXT,
  speaker_name    TEXT,
  category        TEXT,
  workflow_status TEXT NOT NULL DEFAULT 'approved',
  published_at    TIMESTAMPTZ,
  scheduled_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ,
  source_id       UUID REFERENCES content_sources(id) ON DELETE SET NULL,
  search_vector   tsvector,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (record_table, record_id)
);

CREATE INDEX IF NOT EXISTS cms_index_kind_status_idx ON cms_content_index (content_kind, workflow_status);
CREATE INDEX IF NOT EXISTS cms_index_published_idx ON cms_content_index (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS cms_index_external_key_idx ON cms_content_index (external_key) WHERE external_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS cms_index_search_vector_idx ON cms_content_index USING gin (search_vector);

CREATE OR REPLACE FUNCTION cms_index_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', normalize_ar(NEW.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.speaker_name, ''))), 'A') ||
    setweight(to_tsvector('simple', normalize_ar(coalesce(NEW.category, ''))), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cms_index_search_vector ON cms_content_index;
CREATE TRIGGER trg_cms_index_search_vector
  BEFORE INSERT OR UPDATE ON cms_content_index
  FOR EACH ROW EXECUTE FUNCTION cms_index_search_vector_update();

-- ── 6. Extend existing tables (safe ALTER) ────────────────────────────────

-- Sheikhs enrichment
ALTER TABLE sheikhs
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS external_key TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS telegram_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS sheikhs_external_key_uidx
  ON sheikhs (external_key) WHERE external_key IS NOT NULL AND external_key <> '';
CREATE UNIQUE INDEX IF NOT EXISTS sheikhs_slug_uidx
  ON sheikhs (slug) WHERE slug IS NOT NULL AND slug <> '';
CREATE INDEX IF NOT EXISTS sheikhs_archived_idx ON sheikhs (archived_at) WHERE archived_at IS NULL;

-- Library items
ALTER TABLE library_items
  ADD COLUMN IF NOT EXISTS external_key TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS library_external_key_uidx
  ON library_items (external_key) WHERE external_key IS NOT NULL AND external_key <> '';

-- Fawaid
ALTER TABLE fawaid
  ADD COLUMN IF NOT EXISTS external_key TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS fawaid_external_key_uidx
  ON fawaid (external_key) WHERE external_key IS NOT NULL AND external_key <> '';

-- QA
ALTER TABLE qa_questions
  ADD COLUMN IF NOT EXISTS external_key TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS qa_external_key_uidx
  ON qa_questions (external_key) WHERE external_key IS NOT NULL AND external_key <> '';

-- Miracles
ALTER TABLE scientific_miracles
  ADD COLUMN IF NOT EXISTS external_key TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Lessons enrichment
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS lessons_archived_idx ON lessons (archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS lessons_scheduled_idx ON lessons (scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS lessons_status_created_idx ON lessons (status, created_at DESC);

-- Platform tables (if exist from v3)
DO $$ BEGIN
  ALTER TABLE fiqh_council_decisions ADD COLUMN IF NOT EXISTS slug TEXT;
  ALTER TABLE fiqh_council_decisions ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
  ALTER TABLE fiqh_council_decisions ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
  ALTER TABLE fatwas ADD COLUMN IF NOT EXISTS slug TEXT;
  ALTER TABLE fatwas ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
  ALTER TABLE fatwas ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
  ALTER TABLE sharia_rulings ADD COLUMN IF NOT EXISTS slug TEXT;
  ALTER TABLE sharia_rulings ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
  ALTER TABLE annual_courses ADD COLUMN IF NOT EXISTS slug TEXT;
  ALTER TABLE annual_courses ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── 7. Audit log enhancements ───────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_audit_logs'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'table_name'
    ) THEN
      ALTER TABLE admin_audit_logs ADD COLUMN table_name TEXT NOT NULL DEFAULT 'unknown';
    END IF;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS content_kind cms_content_kind;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
    ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS admin_audit_logs_table_idx ON admin_audit_logs (table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_user_idx ON admin_audit_logs (user_id, created_at DESC);

-- ── 8. Unified CMS search RPC ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION cms_search(query text, kinds text[] DEFAULT NULL, limit_per_kind int DEFAULT 15)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  q_norm text := normalize_ar(trim(coalesce(query, '')));
  q_like text := '%' || q_norm || '%';
BEGIN
  IF length(q_norm) < 1 THEN
    RETURN '[]'::json;
  END IF;

  RETURN coalesce((
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT
        content_kind,
        record_table,
        record_id,
        external_key,
        title,
        summary,
        speaker_name,
        category,
        workflow_status,
        ts_rank(search_vector, plainto_tsquery('simple', q_norm)) AS rank
      FROM cms_content_index
      WHERE archived_at IS NULL
        AND workflow_status IN ('approved', 'published')
        AND (
          normalize_ar(title) LIKE q_like
          OR normalize_ar(coalesce(summary, '')) LIKE q_like
          OR normalize_ar(coalesce(speaker_name, '')) LIKE q_like
          OR search_vector @@ plainto_tsquery('simple', q_norm)
        )
        AND (kinds IS NULL OR content_kind::text = ANY(kinds))
      ORDER BY rank DESC NULLS LAST, published_at DESC NULLS LAST
      LIMIT greatest(limit_per_kind * coalesce(array_length(kinds, 1), 10), 30)
    ) t
  ), '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION cms_search(text, text[], int) TO anon, authenticated;

-- ── 9. RLS for new tables ───────────────────────────────────────────────
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_job_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_dedup_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content_index ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_sources_admin ON content_sources;
CREATE POLICY content_sources_admin ON content_sources FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS import_jobs_admin ON import_jobs;
CREATE POLICY import_jobs_admin ON import_jobs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS import_job_rows_admin ON import_job_rows;
CREATE POLICY import_job_rows_admin ON import_job_rows FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS content_dedup_admin ON content_dedup_keys;
CREATE POLICY content_dedup_admin ON content_dedup_keys FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS cms_index_public_read ON cms_content_index;
CREATE POLICY cms_index_public_read ON cms_content_index
  FOR SELECT USING (archived_at IS NULL AND workflow_status IN ('approved', 'published'));

DROP POLICY IF EXISTS cms_index_admin ON cms_content_index;
CREATE POLICY cms_index_admin ON cms_content_index FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================================
--  انتهى cms_platform_v4.sql
-- =====================================================================
