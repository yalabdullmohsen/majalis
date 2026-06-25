-- =====================================================================
--  المجلس العلمي — المجمع الفقهي v10 (الجلسات والبيانات الحية)
--  آمن — لا يحذف البيانات الحالية
--  نفّذ بعد: fiqh_council_v9_scientific_expansion.sql
-- =====================================================================

-- ── 1. جلسات المجمع الفقهي ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    TEXT NOT NULL UNIQUE,
  council_source_id       UUID REFERENCES fiqh_council_sources(id) ON DELETE SET NULL,
  session_title           TEXT NOT NULL,
  session_number          TEXT,
  session_type            TEXT DEFAULT 'regular',
  status                  TEXT NOT NULL DEFAULT 'unknown'
    CHECK (status IN ('upcoming', 'active', 'completed', 'archived', 'unknown')),
  start_date              DATE,
  end_date                DATE,
  location                TEXT,
  country                 TEXT,
  city                    TEXT,
  agenda                  TEXT,
  topics                  JSONB NOT NULL DEFAULT '[]',
  resolutions_count       INT NOT NULL DEFAULT 0,
  recommendations_count   INT NOT NULL DEFAULT 0,
  fatwas_count            INT NOT NULL DEFAULT 0,
  official_source_url     TEXT,
  official_document_url   TEXT,
  verification_status     TEXT NOT NULL DEFAULT 'unavailable'
    CHECK (verification_status IN ('verified', 'pending', 'unavailable')),
  publish_status          TEXT NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft', 'needs_review', 'verified_pending_publish', 'published', 'archived')),
  published_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_sessions_status_idx ON fiqh_council_sessions (status, start_date DESC);
CREATE INDEX IF NOT EXISTS fiqh_sessions_publish_idx ON fiqh_council_sessions (publish_status, verification_status);
CREATE INDEX IF NOT EXISTS fiqh_sessions_slug_idx ON fiqh_council_sessions (slug);

-- ── 2. ربط العناصر بالجلسات ─────────────────────────────────────────────
ALTER TABLE fiqh_council_items
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES fiqh_council_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS fiqh_items_session_id_idx ON fiqh_council_items (session_id);

-- ── 3. إشعارات الإدارة ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiqh_council_admin_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type  TEXT NOT NULL
    CHECK (alert_type IN (
      'new_session', 'new_decision', 'new_recommendation',
      'sync_failed', 'broken_link', 'duplicate_found', 'needs_review'
    )),
  title       TEXT NOT NULL,
  message     TEXT,
  entity_type TEXT,
  entity_id   UUID,
  severity    TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'error')),
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiqh_admin_alerts_unread_idx
  ON fiqh_council_admin_alerts (is_read, created_at DESC);

-- ── 4. RPC: بيانات حية ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fiqh_council_live_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'last_session', (
      SELECT row_to_json(s)
      FROM fiqh_council_sessions s
      WHERE s.publish_status = 'published'
        AND s.verification_status = 'verified'
        AND s.status = 'completed'
      ORDER BY s.start_date DESC NULLS LAST
      LIMIT 1
    ),
    'upcoming_session', (
      SELECT row_to_json(s)
      FROM fiqh_council_sessions s
      WHERE s.publish_status = 'published'
        AND s.verification_status = 'verified'
        AND s.status = 'upcoming'
      ORDER BY s.start_date ASC NULLS LAST
      LIMIT 1
    ),
    'latest_resolutions', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT slug, title, session_date, published_at, category
        FROM fiqh_council_items
        WHERE status = 'published' AND type = 'resolution'
          AND documentation_level = 'official_verified'
        ORDER BY published_at DESC NULLS LAST
        LIMIT 5
      ) t
    ),
    'latest_recommendations', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT slug, title, session_date, published_at, category
        FROM fiqh_council_items
        WHERE status = 'published' AND type = 'recommendation'
          AND documentation_level = 'official_verified'
        ORDER BY published_at DESC NULLS LAST
        LIMIT 5
      ) t
    ),
    'latest_fatwas', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT slug, title, session_date, published_at, category
        FROM fiqh_council_items
        WHERE status = 'published' AND type = 'fatwa'
          AND documentation_level = 'official_verified'
        ORDER BY published_at DESC NULLS LAST
        LIMIT 5
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ── 5. RLS ───────────────────────────────────────────────────────────────
ALTER TABLE fiqh_council_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiqh_council_admin_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiqh_sessions_public_read ON fiqh_council_sessions;
CREATE POLICY fiqh_sessions_public_read ON fiqh_council_sessions
  FOR SELECT USING (
    publish_status = 'published'
    AND verification_status = 'verified'
  );

DROP POLICY IF EXISTS fiqh_sessions_admin_all ON fiqh_council_sessions;
CREATE POLICY fiqh_sessions_admin_all ON fiqh_council_sessions
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fiqh_alerts_admin ON fiqh_council_admin_alerts;
CREATE POLICY fiqh_alerts_admin ON fiqh_council_admin_alerts
  FOR ALL USING (auth.role() = 'authenticated');

GRANT EXECUTE ON FUNCTION fiqh_council_live_data() TO anon, authenticated;
