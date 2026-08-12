-- Cache for upcoming Islamic occasion dates (computed daily by cron).
-- Content (summary, deeds, evidence) remains in reviewed app seed only.

CREATE TABLE IF NOT EXISTS islamic_occasions_cache (
  occasion_id          TEXT PRIMARY KEY,
  next_gregorian_date  DATE,
  days_remaining       INT,
  hijri_label          TEXT,
  synced_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_islamic_occasions_cache_days
  ON islamic_occasions_cache(days_remaining);

ALTER TABLE IF EXISTS islamic_occasions_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_occasions_cache" ON islamic_occasions_cache;
CREATE POLICY "public_read_occasions_cache"
  ON islamic_occasions_cache FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_occasions_cache" ON islamic_occasions_cache;
CREATE POLICY "admin_manage_occasions_cache"
  ON islamic_occasions_cache FOR ALL USING (is_admin()) WITH CHECK (is_admin());
