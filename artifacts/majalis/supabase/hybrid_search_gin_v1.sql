-- hybrid_search_gin_v1.sql
-- فهارس GIN للنصوص الثقيلة (قرآن / حديث / كتب) — آمن للتطبيق المتكرر.
-- يعتمد في Supabase SQL Editor بعد unified_search_index_v1.sql عند الحاجة.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- قرآن (إن وُجدت جداول النصوص)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quran_ayahs'
  ) THEN
    ALTER TABLE quran_ayahs ADD COLUMN IF NOT EXISTS search_text text;
    UPDATE quran_ayahs
      SET search_text = coalesce(search_text, text_uthmani, text, '')
      WHERE search_text IS NULL OR search_text = '';
    CREATE INDEX IF NOT EXISTS idx_quran_ayahs_search_trgm
      ON quran_ayahs USING GIN (search_text gin_trgm_ops);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'verified_hadith_items'
  ) THEN
    ALTER TABLE verified_hadith_items ADD COLUMN IF NOT EXISTS search_text text;
    CREATE INDEX IF NOT EXISTS idx_hadith_search_trgm
      ON verified_hadith_items USING GIN (search_text gin_trgm_ops);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'library_items'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_library_items_search_trgm
      ON library_items USING GIN (search_text gin_trgm_ops);
  END IF;
END $$;

-- جدول أحداث تحليلات مجهولة (بدون معرّفات شخصية)
CREATE TABLE IF NOT EXISTS anonymous_telemetry_events (
  id bigserial PRIMARY KEY,
  event_name text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_at timestamptz,
  event_id text,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anon_telemetry_name_received
  ON anonymous_telemetry_events (event_name, received_at DESC);

ALTER TABLE anonymous_telemetry_events ENABLE ROW LEVEL SECURITY;

-- إدراج عبر service role فقط؛ لا سياسات عامة للقراءة
DROP POLICY IF EXISTS anon_telemetry_no_public ON anonymous_telemetry_events;
CREATE POLICY anon_telemetry_no_public ON anonymous_telemetry_events
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

COMMENT ON TABLE anonymous_telemetry_events IS
  'Anonymous engagement metrics only — no user_id / location / PII.';
