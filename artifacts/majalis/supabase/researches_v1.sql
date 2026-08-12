-- =============================================================================
-- مكتبة الأبحاث الشرعية — مخطط قابل للتوسّع + RLS
-- يُطبَّق يدويًا في Supabase SQL Editor. آمن للإعادة (IF NOT EXISTS).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- أدوار المنصة للأبحاث (تُربَط بجدول profiles/governance الموجود إن وُجد)
DO $$ BEGIN
  CREATE TYPE research_review_status AS ENUM (
    'draft','submitted','auto_screening','awaiting_review','needs_revision',
    'rejected','accepted','published','withdrawn','rights_hold'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE research_access_type AS ENUM (
    'metadata_only','abstract_only','fulltext_view','fulltext_download'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS research_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  parent_id TEXT REFERENCES research_categories(id) ON DELETE SET NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS researchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  email_private TEXT,
  orcid TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  country TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE (university_id, name)
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE (college_id, name)
);

CREATE TABLE IF NOT EXISTS journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  publisher TEXT,
  issn TEXT,
  website TEXT
);

CREATE TABLE IF NOT EXISTS publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website TEXT
);

CREATE TABLE IF NOT EXISTS researches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_en TEXT,
  kind TEXT NOT NULL,
  academic_level TEXT,
  university_id UUID REFERENCES universities(id),
  college_id UUID REFERENCES colleges(id),
  department_id UUID REFERENCES departments(id),
  journal_id UUID REFERENCES journals(id),
  publisher_id UUID REFERENCES publishers(id),
  country TEXT,
  year INT,
  language TEXT NOT NULL DEFAULT 'ar',
  page_count INT,
  abstract TEXT NOT NULL DEFAULT '',
  problem_statement TEXT,
  methodology TEXT,
  table_of_contents TEXT,
  references_note TEXT,
  source_url TEXT,
  doi TEXT,
  volume_issue TEXT,
  review_status research_review_status NOT NULL DEFAULT 'draft',
  license TEXT NOT NULL DEFAULT 'unknown',
  access_type research_access_type NOT NULL DEFAULT 'metadata_only',
  copyright_note TEXT,
  peer_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_personal BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INT NOT NULL DEFAULT 0,
  download_count INT NOT NULL DEFAULT 0,
  citation_count INT NOT NULL DEFAULT 0,
  source_reliability NUMERIC(4,2) DEFAULT 0,
  imported_from TEXT,
  owner_user_id UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT researches_doi_unique UNIQUE (doi)
);

CREATE TABLE IF NOT EXISTS research_authors (
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  researcher_id UUID REFERENCES researchers(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'author',
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (research_id, display_name, role)
);

CREATE TABLE IF NOT EXISTS research_category_map (
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES research_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (research_id, category_id)
);

CREATE TABLE IF NOT EXISTS research_keywords (
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  PRIMARY KEY (research_id, keyword)
);

CREATE TABLE IF NOT EXISTS research_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INT,
  sha256 TEXT,
  watermarked BOOLEAN NOT NULL DEFAULT FALSE,
  download_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  proof_storage_path TEXT,
  proof_note TEXT,
  license TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID REFERENCES researches(id) ON DELETE SET NULL,
  owner_user_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  status research_review_status NOT NULL DEFAULT 'submitted',
  status_note TEXT,
  is_personal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES research_submissions(id) ON DELETE CASCADE,
  research_id UUID REFERENCES researches(id) ON DELETE CASCADE,
  reviewer_id UUID,
  reviewer_role TEXT,
  scores JSONB NOT NULL DEFAULT '{}',
  decision research_review_status,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID REFERENCES researches(id) ON DELETE CASCADE,
  reporter_user_id UUID,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_views (
  id BIGSERIAL PRIMARY KEY,
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  viewer_user_id UUID,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_downloads (
  id BIGSERIAL PRIMARY KEY,
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  user_id UUID,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_researches (
  user_id UUID NOT NULL,
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, research_id)
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT,
  query JSONB NOT NULL DEFAULT '{}',
  alert_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS import_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT,
  kind TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  metadata_only BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  last_result TEXT
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT REFERENCES import_sources(id),
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  report JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS import_logs (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID REFERENCES import_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_a UUID REFERENCES researches(id) ON DELETE CASCADE,
  research_b UUID REFERENCES researches(id) ON DELETE CASCADE,
  score INT NOT NULL,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_researches_status ON researches(review_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_researches_year ON researches(year);
CREATE INDEX IF NOT EXISTS idx_researches_kind ON researches(kind);
CREATE INDEX IF NOT EXISTS idx_researches_published ON researches(published_at DESC) WHERE review_status = 'published';
CREATE INDEX IF NOT EXISTS idx_research_keywords_kw ON research_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_research_authors_name ON research_authors(display_name);

ALTER TABLE researches ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_researches ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- قراءة عامة للأبحاث المنشورة غير التجريبية وغير المحذوفة
DROP POLICY IF EXISTS researches_public_read ON researches;
CREATE POLICY researches_public_read ON researches
  FOR SELECT USING (
    review_status = 'published'
    AND deleted_at IS NULL
    AND COALESCE(is_demo, FALSE) = FALSE
  );

-- المالك يرى طلباته
DROP POLICY IF EXISTS submissions_owner_rw ON research_submissions;
CREATE POLICY submissions_owner_rw ON research_submissions
  FOR ALL USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- منع المستخدم من تعديل أبحاث غيره (التعديل عبر service role / أدمن فقط)
DROP POLICY IF EXISTS researches_no_client_update ON researches;
CREATE POLICY researches_no_client_update ON researches
  FOR UPDATE USING (FALSE);

DROP POLICY IF EXISTS researches_no_client_delete ON researches;
CREATE POLICY researches_no_client_delete ON researches
  FOR DELETE USING (FALSE);

-- الملفات: لا وصول عام مباشر؛ التحميل عبر مسار خادم موقَّع لاحقًا
DROP POLICY IF EXISTS research_files_no_anon ON research_files;
CREATE POLICY research_files_no_anon ON research_files
  FOR SELECT USING (FALSE);

DROP POLICY IF EXISTS research_permissions_admin_only ON research_permissions;
CREATE POLICY research_permissions_admin_only ON research_permissions
  FOR SELECT USING (FALSE);

DROP POLICY IF EXISTS saved_researches_owner ON saved_researches;
CREATE POLICY saved_researches_owner ON saved_researches
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS saved_searches_owner ON saved_searches;
CREATE POLICY saved_searches_owner ON saved_searches
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS research_reports_insert ON research_reports;
CREATE POLICY research_reports_insert ON research_reports
  FOR INSERT WITH CHECK (TRUE);

COMMENT ON TABLE researches IS 'فهرس الأبحاث الشرعية — المنصة لا تملك الحقوق الأدبية للأبحاث.';
COMMENT ON COLUMN research_permissions.proof_storage_path IS 'إثبات إذن النشر — للإدارة فقط.';
