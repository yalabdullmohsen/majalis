-- Production hardening — نفّذ في Supabase SQL Editor بعد المخطط الأساسي
-- آمن للتكرار (IF NOT EXISTS)

-- ── أرشفة الدروس المنتهية ──
ALTER TABLE IF EXISTS lessons
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN lessons.archived_at IS 'وقت أرشفة الدرس تلقائيًا عند انتهاء end_date';

-- ── فهارس الأداء ──
CREATE INDEX IF NOT EXISTS lessons_status_idx ON lessons (status);
CREATE INDEX IF NOT EXISTS lessons_status_created_idx ON lessons (status, created_at DESC);
CREATE INDEX IF NOT EXISTS lessons_external_key_idx ON lessons (external_key) WHERE external_key IS NOT NULL AND external_key <> '';
CREATE INDEX IF NOT EXISTS lessons_archived_at_idx ON lessons (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS lessons_category_idx ON lessons (category);
CREATE INDEX IF NOT EXISTS lessons_speaker_name_idx ON lessons (speaker_name);

CREATE INDEX IF NOT EXISTS content_views_content_idx ON content_views (content_type, content_id);
CREATE INDEX IF NOT EXISTS error_reports_status_idx ON error_reports (status);

-- ── تحديث updated_at تلقائيًا ──
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lessons_touch_updated_at ON lessons;
CREATE TRIGGER lessons_touch_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS sheikhs_touch_updated_at ON sheikhs;
CREATE TRIGGER sheikhs_touch_updated_at
  BEFORE UPDATE ON sheikhs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── سجل البحث ──
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_queries_at_idx ON search_queries (searched_at DESC);
CREATE INDEX IF NOT EXISTS search_queries_query_idx ON search_queries (query);

ALTER TABLE IF EXISTS search_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert_search_queries" ON search_queries;
CREATE POLICY "anyone_insert_search_queries" ON search_queries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_search_queries" ON search_queries;
CREATE POLICY "admin_read_search_queries" ON search_queries FOR SELECT USING (is_admin());

-- ── تقييد INSERT على content_views (مستخدم مسجل أو anon مع rate limit على التطبيق) ──
-- RLS موجود مسبقًا — هذا تعليق توثيقي فقط
