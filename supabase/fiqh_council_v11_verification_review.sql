-- =====================================================================
--  المجلس العلمي — المجمع الفقهي v11 (التحقق الآلي والمراجعة العلمية)
--  آمن — لا يحذف البيانات الحالية
--  نفّذ بعد: fiqh_council_v10_sessions_live.sql
-- =====================================================================

-- ── 1. درجة الاكتمال وحالة الرابط ─────────────────────────────────────
ALTER TABLE fiqh_council_items
  ADD COLUMN IF NOT EXISTS completion_score INT NOT NULL DEFAULT 0
    CHECK (completion_score >= 0 AND completion_score <= 100),
  ADD COLUMN IF NOT EXISTS link_status TEXT NOT NULL DEFAULT 'unchecked'
    CHECK (link_status IN ('ok', 'redirect', 'broken', 'timeout', 'unchecked')),
  ADD COLUMN IF NOT EXISTS link_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS redirect_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_issues JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS fiqh_items_completion_idx
  ON fiqh_council_items (completion_score DESC, status);

CREATE INDEX IF NOT EXISTS fiqh_items_link_status_idx
  ON fiqh_council_items (link_status)
  WHERE link_status IN ('broken', 'timeout');

-- ── 2. سجل المراجعة العلمية ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_review_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id             UUID REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  session_id          UUID REFERENCES fiqh_council_sessions(id) ON DELETE SET NULL,
  action              TEXT NOT NULL
    CHECK (action IN (
      'approve', 'reject', 'return_for_edit', 'archive', 'publish',
      'verify_pass', 'verify_fail', 'link_check', 'duplicate_flag'
    )),
  actor_id            UUID,
  actor_email         TEXT,
  notes               TEXT,
  from_status         TEXT,
  to_status           TEXT,
  completion_score    INT,
  verification_issues JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_review_logs_item_idx
  ON fiqh_review_logs (item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS fiqh_review_logs_created_idx
  ON fiqh_review_logs (created_at DESC);

-- ── 3. سجل فحص الروابط ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_link_checks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       UUID REFERENCES fiqh_council_items(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  status        TEXT NOT NULL
    CHECK (status IN ('ok', 'redirect', 'broken', 'timeout', 'unknown')),
  redirect_url  TEXT,
  http_status   INT,
  checked_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_link_checks_item_idx
  ON fiqh_link_checks (item_id, checked_at DESC);

-- ── 4. RLS — سجل المراجعة وفحص الروابط (إدارة فقط) ─────────────────────
ALTER TABLE fiqh_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_link_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiqh_review_logs_admin ON fiqh_review_logs;
CREATE POLICY fiqh_review_logs_admin ON fiqh_review_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS fiqh_link_checks_admin ON fiqh_link_checks;
CREATE POLICY fiqh_link_checks_admin ON fiqh_link_checks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 5. RPC: إحصائيات جودة البيانات ───────────────────────────────────────
CREATE OR REPLACE FUNCTION fiqh_council_quality_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'published_count', (SELECT COUNT(*) FROM fiqh_council_items WHERE status = 'published'),
    'needs_review_count', (SELECT COUNT(*) FROM fiqh_council_items WHERE status IN ('imported', 'needs_review', 'review', 'approved')),
    'missing_source_count', (SELECT COUNT(*) FROM fiqh_council_items WHERE status NOT IN ('archived', 'rejected') AND (source_name IS NULL OR source_url IS NULL OR source_name = '' OR source_url = '')),
    'missing_category_count', (SELECT COUNT(*) FROM fiqh_council_items WHERE status NOT IN ('archived', 'rejected') AND (category IS NULL OR category = '')),
    'broken_links_count', (SELECT COUNT(*) FROM fiqh_council_items WHERE link_status IN ('broken', 'timeout')),
    'duplicate_pending_count', (SELECT COUNT(*) FROM fiqh_council_duplicates WHERE status = 'pending'),
    'avg_completion_score', COALESCE((SELECT ROUND(AVG(completion_score)) FROM fiqh_council_items WHERE status NOT IN ('archived', 'rejected')), 0),
    'last_sync_at', (SELECT MAX(finished_at) FROM fiqh_council_sync_jobs WHERE status IN ('completed', 'partial')),
    'last_review_at', (SELECT MAX(created_at) FROM fiqh_review_logs)
  ) INTO result;

  RETURN result;
END;
$$;

-- ── 6. تحديث درجة الاكتمال للبيانات الحالية ─────────────────────────────
UPDATE fiqh_council_items SET completion_score = CASE
  WHEN title IS NOT NULL AND title <> '' THEN 10 ELSE 0 END
  + CASE WHEN COALESCE(content, ruling_text, summary, '') <> '' THEN 20 ELSE 0 END
  + CASE WHEN summary IS NOT NULL AND summary <> '' THEN 10 ELSE 0 END
  + CASE WHEN source_name IS NOT NULL AND source_name <> '' THEN 10 ELSE 0 END
  + CASE WHEN source_url IS NOT NULL AND source_url <> '' THEN 15 ELSE 0 END
  + CASE WHEN type IS NOT NULL THEN 5 ELSE 0 END
  + CASE WHEN category IS NOT NULL AND category <> '' THEN 10 ELSE 0 END
  + CASE WHEN session_date IS NOT NULL THEN 5 ELSE 0 END
  + CASE WHEN session_number IS NOT NULL OR session_id IS NOT NULL THEN 5 ELSE 0 END
  + CASE WHEN tags IS NOT NULL AND jsonb_array_length(to_jsonb(tags)) > 0 THEN 5 ELSE 0 END
  + CASE WHEN evidence IS NOT NULL AND jsonb_array_length(evidence::jsonb) > 0 THEN 5 ELSE 0 END
WHERE completion_score = 0;

UPDATE fiqh_council_items SET
  documentation_level = 'official_verified',
  confidence_level = 'source_verified'
WHERE status = 'published'
  AND source_name IS NOT NULL AND source_url IS NOT NULL
  AND completion_score >= 80
  AND (documentation_level IS NULL OR documentation_level = 'imported_needs_review');
