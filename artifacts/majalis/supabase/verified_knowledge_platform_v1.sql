-- Verified Knowledge Platform v1
-- Adhkar/Hadith libraries, import audit, quality reports, soft-delete support

-- ── Adhkar categories ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verified_adhkar_categories (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  source_slug text,
  verification_status text NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN ('verified','needs_review','rejected','archived')),
  trust_level smallint NOT NULL DEFAULT 90 CHECK (trust_level BETWEEN 0 AND 100),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  version_number int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verified_adhkar_cat_slug ON verified_adhkar_categories(slug);
CREATE INDEX IF NOT EXISTS idx_verified_adhkar_cat_status ON verified_adhkar_categories(verification_status);

-- ── Adhkar items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verified_adhkar_items (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES verified_adhkar_categories(id) ON DELETE CASCADE,
  text text NOT NULL,
  repeat_count int NOT NULL DEFAULT 1,
  narrator text,
  source_name text,
  source_url text,
  grade text,
  reference text,
  explanation text,
  keywords text[] DEFAULT '{}',
  global_ref_id text,
  provenance_id uuid,
  verification_status text NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN ('verified','needs_review','rejected','duplicate','archived')),
  quality_score smallint NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  trust_level smallint NOT NULL DEFAULT 90 CHECK (trust_level BETWEEN 0 AND 100),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  version_number int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verified_adhkar_items_cat ON verified_adhkar_items(category_id);
CREATE INDEX IF NOT EXISTS idx_verified_adhkar_items_status ON verified_adhkar_items(verification_status);
CREATE INDEX IF NOT EXISTS idx_verified_adhkar_items_keywords ON verified_adhkar_items USING gin(keywords);

-- ── Hadith library ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verified_hadith_items (
  id text PRIMARY KEY,
  collection text,
  hadith_number text,
  title text,
  text text NOT NULL,
  narrator text,
  scholar text,
  source_name text NOT NULL,
  source_url text,
  grade text,
  chapter text,
  keywords text[] DEFAULT '{}',
  explanation text,
  global_ref_id text,
  provenance_id uuid,
  verification_status text NOT NULL DEFAULT 'needs_review'
    CHECK (verification_status IN ('verified','needs_review','rejected','duplicate','archived')),
  quality_score smallint NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  trust_level smallint NOT NULL DEFAULT 90 CHECK (trust_level BETWEEN 0 AND 100),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  version_number int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verified_hadith_status ON verified_hadith_items(verification_status);
CREATE INDEX IF NOT EXISTS idx_verified_hadith_collection ON verified_hadith_items(collection, hadith_number);
CREATE INDEX IF NOT EXISTS idx_verified_hadith_keywords ON verified_hadith_items USING gin(keywords);

-- ── Unified import operations audit ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS import_operations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  source_slug text,
  content_type text,
  content_id text,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','completed','failed','skipped')),
  items_discovered int NOT NULL DEFAULT 0,
  items_imported int NOT NULL DEFAULT 0,
  items_updated int NOT NULL DEFAULT 0,
  items_rejected int NOT NULL DEFAULT 0,
  items_needs_review int NOT NULL DEFAULT 0,
  confidence_score smallint,
  error_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id text DEFAULT 'system',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_import_ops_started ON import_operations_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_ops_source ON import_operations_log(source_slug);
CREATE INDEX IF NOT EXISTS idx_import_ops_status ON import_operations_log(status);

-- ── Daily quality reports ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_quality_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  report_type text NOT NULL DEFAULT 'daily'
    CHECK (report_type IN ('daily','weekly','manual')),
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_date, report_type)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_quality_date ON knowledge_quality_reports(report_date DESC);

-- ── Extend scholarly_sources with licensing/import metadata ──────────────────
ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS licensing text;
ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS import_method text;
ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS source_language text DEFAULT 'ar';
ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS last_import_at timestamptz;
ALTER TABLE scholarly_sources ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
