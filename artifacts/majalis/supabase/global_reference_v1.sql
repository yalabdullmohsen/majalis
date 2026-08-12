-- Global Scholarly Reference System v1
-- Global IDs, relations graph, sources registry, quality scores, review cycles

-- ── Global content references ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS global_content_refs (
  ref_id text PRIMARY KEY,
  content_kind text NOT NULL,
  record_id text,
  external_key text,
  provenance_id uuid,
  title text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'rejected')),
  verification_status text DEFAULT 'needs_review',
  documentation_level text DEFAULT 'partial',
  version_number int DEFAULT 1,
  publisher text,
  author text,
  verifier text,
  "references" jsonb DEFAULT '[]',
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_global_refs_kind ON global_content_refs(content_kind);
CREATE INDEX IF NOT EXISTS idx_global_refs_external ON global_content_refs(external_key);
CREATE INDEX IF NOT EXISTS idx_global_refs_status ON global_content_refs(verification_status);

-- ── Generalized content relations (knowledge graph edges) ──────────────────
CREATE TABLE IF NOT EXISTS content_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_ref_id text NOT NULL REFERENCES global_content_refs(ref_id) ON DELETE CASCADE,
  to_ref_id text NOT NULL,
  relation_type text NOT NULL CHECK (relation_type IN (
    'cites', 'related', 'same_topic', 'same_source', 'duplicate',
    'explains', 'supports', 'contradicts', 'derived_from',
    'quran', 'hadith', 'tafseer', 'scholar', 'book', 'lesson',
    'fatwa', 'decision', 'topic', 'keyword'
  )),
  relevance_score float DEFAULT 0.5,
  auto_linked boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_ref_id, to_ref_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_content_relations_from ON content_relations(from_ref_id);
CREATE INDEX IF NOT EXISTS idx_content_relations_to ON content_relations(to_ref_id);
CREATE INDEX IF NOT EXISTS idx_content_relations_type ON content_relations(relation_type);

-- ── Unified scholarly sources registry ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS scholarly_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  name_ar text,
  source_type text NOT NULL CHECK (source_type IN (
    'book', 'website', 'rss', 'official', 'scholar', 'institution',
    'manuscript', 'audio', 'video', 'database', 'other'
  )),
  url text,
  entity_name text,
  trust_level int DEFAULT 50 CHECK (trust_level BETWEEN 0 AND 100),
  connection_status text DEFAULT 'unknown' CHECK (connection_status IN (
    'healthy', 'degraded', 'broken', 'unknown'
  )),
  last_checked_at timestamptz,
  items_imported int DEFAULT 0,
  items_rejected int DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scholarly_sources_slug ON scholarly_sources(slug);
CREATE INDEX IF NOT EXISTS idx_scholarly_sources_trust ON scholarly_sources(trust_level DESC);

-- ── Source slug mapping (unify 3 registries) ───────────────────────────────
CREATE TABLE IF NOT EXISTS source_slug_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarly_source_id uuid REFERENCES scholarly_sources(id) ON DELETE CASCADE,
  trusted_source_id uuid,
  knowledge_source_slug text,
  ake_connector_slug text,
  created_at timestamptz DEFAULT now()
);

-- ── Quality scores per reference ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reference_quality_scores (
  ref_id text PRIMARY KEY REFERENCES global_content_refs(ref_id) ON DELETE CASCADE,
  completeness_score int DEFAULT 0,
  source_quality_score int DEFAULT 0,
  review_count int DEFAULT 0,
  freshness_score int DEFAULT 0,
  linking_score int DEFAULT 0,
  classification_score int DEFAULT 0,
  overall_score int DEFAULT 0,
  scored_at timestamptz DEFAULT now()
);

-- ── Review cycles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reference_review_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_type text NOT NULL DEFAULT 'periodic',
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  items_checked int DEFAULT 0,
  issues_found int DEFAULT 0,
  fixes_suggested int DEFAULT 0,
  report jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE IF NOT EXISTS reference_review_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES reference_review_cycles(id) ON DELETE CASCADE,
  ref_id text,
  issue_type text NOT NULL CHECK (issue_type IN (
    'broken_link', 'missing_source', 'duplicate', 'incomplete_data',
    'stale_content', 'language_error', 'missing_image', 'classification_error'
  )),
  severity text DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  description text,
  suggested_fix text,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── Graph audit snapshots ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS graph_audit_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot jsonb NOT NULL DEFAULT '{}',
  metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ── Seed scholarly sources ─────────────────────────────────────────────────
INSERT INTO scholarly_sources (slug, name, name_ar, source_type, url, entity_name, trust_level) VALUES
  ('iifa', 'International Islamic Fiqh Academy', 'مجمع الفقه الإسلامي', 'official', 'https://iifa-aifi.org', 'IIFA', 95),
  ('alifta', 'General Presidency of Scholarly Research and Ifta', 'الإفتاء السعودية', 'official', 'https://alifta.gov.sa', 'الرئاسة العامة للبحوث العلمية والإفتاء', 95),
  ('islamweb', 'IslamWeb', 'إسلام ويب', 'website', 'https://islamweb.net', 'IslamWeb', 80),
  ('sunnah-com', 'Sunnah.com', 'سنّة', 'database', 'https://sunnah.com', 'Sunnah.com', 90),
  ('quran-com', 'Quran.com', 'قرآن', 'database', 'https://quran.com', 'Quran.com', 95),
  ('majalis-local', 'Majalis Scientific Council', 'المجلس العلمي', 'official', 'https://majalis.app', 'المجلس العلمي', 90)
ON CONFLICT (slug) DO UPDATE SET
  trust_level = EXCLUDED.trust_level,
  updated_at = now();

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE global_content_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarly_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_quality_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS global_refs_public_read ON global_content_refs;
CREATE POLICY global_refs_public_read ON global_content_refs FOR SELECT USING (true);
DROP POLICY IF EXISTS content_relations_public_read ON content_relations;
CREATE POLICY content_relations_public_read ON content_relations FOR SELECT USING (true);
DROP POLICY IF EXISTS scholarly_sources_public_read ON scholarly_sources;
CREATE POLICY scholarly_sources_public_read ON scholarly_sources FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS quality_scores_public_read ON reference_quality_scores;
CREATE POLICY quality_scores_public_read ON reference_quality_scores FOR SELECT USING (true);

GRANT SELECT ON global_content_refs TO authenticated, anon;
GRANT SELECT ON content_relations TO authenticated, anon;
GRANT SELECT ON scholarly_sources TO authenticated, anon;
GRANT SELECT ON reference_quality_scores TO authenticated, anon;

-- ── Stats RPC ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION global_reference_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'refs_count', (SELECT count(*) FROM global_content_refs),
    'relations_count', (SELECT count(*) FROM content_relations),
    'sources_count', (SELECT count(*) FROM scholarly_sources WHERE is_active = true),
    'verified_count', (SELECT count(*) FROM global_content_refs WHERE verification_status = 'verified'),
    'needs_review_count', (SELECT count(*) FROM global_content_refs WHERE verification_status = 'needs_review'),
    'avg_quality_score', (SELECT coalesce(round(avg(overall_score)), 0) FROM reference_quality_scores),
    'incomplete_count', (SELECT count(*) FROM reference_quality_scores WHERE completeness_score < 70)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION global_reference_stats() TO authenticated, anon;
