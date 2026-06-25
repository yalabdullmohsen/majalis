-- =====================================================================
--  المجلس العلمي — Auto Content Pipeline
--  استيراد تلقائي من مصادر RSS موثوقة — needs_review حتى الاعتماد
--  نفّذ في Supabase SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS trusted_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'rss',
  url TEXT NOT NULL,
  category TEXT,
  trust_level INTEGER DEFAULT 80,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auto_imported_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_type TEXT NOT NULL,
  category TEXT,
  summary TEXT,
  content TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  original_url TEXT,
  tags TEXT[] DEFAULT '{}',
  verification_status TEXT DEFAULT 'needs_review',
  status TEXT DEFAULT 'needs_review',
  quality_score INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auto_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES trusted_sources(id),
  status TEXT NOT NULL,
  message TEXT,
  imported_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_content_status ON auto_imported_content(status);
CREATE INDEX IF NOT EXISTS idx_auto_content_type ON auto_imported_content(content_type);
CREATE INDEX IF NOT EXISTS idx_auto_content_category ON auto_imported_content(category);
CREATE INDEX IF NOT EXISTS idx_auto_content_external_key ON auto_imported_content(external_key);
CREATE INDEX IF NOT EXISTS idx_auto_content_verification ON auto_imported_content(verification_status);

CREATE UNIQUE INDEX IF NOT EXISTS trusted_sources_url_uidx ON trusted_sources(url);

-- ── Seed official RSS sources (replace URLs if needed) ────────────────────
INSERT INTO trusted_sources (name, source_type, url, category, trust_level)
VALUES
  ('الأكاديمية الإسلامية للفقه (OIC-IIFA)', 'rss', 'https://www.iifa-aifi.org/ar/rss', 'قرارات', 95),
  ('IslamWeb — الأخبار', 'rss', 'https://www.islamweb.net/ar/rss/news', 'أخبار', 90)
ON CONFLICT (url) DO NOTHING;

-- ── RLS: لا عرض عام إلا published + verified ─────────────────────────────
ALTER TABLE trusted_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_imported_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_import_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trusted_sources_admin ON trusted_sources;
CREATE POLICY trusted_sources_admin ON trusted_sources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS trusted_sources_public_read ON trusted_sources;
CREATE POLICY trusted_sources_public_read ON trusted_sources
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS auto_content_public ON auto_imported_content;
CREATE POLICY auto_content_public ON auto_imported_content
  FOR SELECT USING (status = 'published' AND verification_status = 'verified');

DROP POLICY IF EXISTS auto_content_admin ON auto_imported_content;
CREATE POLICY auto_content_admin ON auto_imported_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS auto_import_logs_admin ON auto_import_logs;
CREATE POLICY auto_import_logs_admin ON auto_import_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ── Public feed RPC (published only) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION get_published_auto_content(
  p_limit int DEFAULT 20,
  p_content_type text DEFAULT NULL
)
RETURNS SETOF auto_imported_content
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM auto_imported_content
  WHERE status = 'published'
    AND verification_status = 'verified'
    AND (p_content_type IS NULL OR content_type = p_content_type)
  ORDER BY published_at DESC NULLS LAST, created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_published_auto_content(int, text) TO authenticated, anon;
