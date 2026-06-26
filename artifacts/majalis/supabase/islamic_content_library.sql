-- Islamic content library schema (rotation state + catalog metadata)
CREATE TABLE IF NOT EXISTS content_rotation_state (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  pool_hash TEXT NOT NULL,
  order_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  cursor INT NOT NULL DEFAULT 0,
  cycle_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_day_key TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_rotation_kind ON content_rotation_state(kind);

CREATE TABLE IF NOT EXISTS hadith_catalog (
  id TEXT PRIMARY KEY,
  collection_key TEXT NOT NULL,
  hadith_number INT,
  title TEXT,
  matn TEXT,
  narrator TEXT,
  source TEXT,
  grade TEXT,
  chapter TEXT,
  url TEXT,
  language TEXT DEFAULT 'ar',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hadith_catalog_collection ON hadith_catalog(collection_key);

CREATE TABLE IF NOT EXISTS adhkar_catalog (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  category_name TEXT,
  text TEXT NOT NULL,
  repeat_count INT DEFAULT 1,
  source TEXT,
  grade TEXT,
  reference TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adhkar_catalog_category ON adhkar_catalog(category_id);

CREATE TABLE IF NOT EXISTS daily_content_log (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  item_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  served_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(kind, day_key)
);

ALTER TABLE content_rotation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadith_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE adhkar_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_content_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_rotation_public_read ON content_rotation_state;
CREATE POLICY content_rotation_public_read ON content_rotation_state FOR SELECT USING (true);

DROP POLICY IF EXISTS hadith_catalog_public_read ON hadith_catalog;
CREATE POLICY hadith_catalog_public_read ON hadith_catalog FOR SELECT USING (true);

DROP POLICY IF EXISTS adhkar_catalog_public_read ON adhkar_catalog;
CREATE POLICY adhkar_catalog_public_read ON adhkar_catalog FOR SELECT USING (true);

DROP POLICY IF EXISTS daily_content_log_public_read ON daily_content_log;
CREATE POLICY daily_content_log_public_read ON daily_content_log FOR SELECT USING (true);
