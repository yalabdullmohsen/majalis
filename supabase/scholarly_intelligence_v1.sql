-- Scholarly Intelligence Engine v1
-- Topics, analytics, user preferences, content-topic links

-- ── Topics registry ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  title_en text,
  category text,
  keywords text[] DEFAULT '{}',
  synonyms text[] DEFAULT '{}',
  visit_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_topics_slug ON search_topics(slug);
CREATE INDEX IF NOT EXISTS idx_search_topics_category ON search_topics(category);

-- ── Content ↔ topic links ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_topic_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_slug text NOT NULL REFERENCES search_topics(slug) ON DELETE CASCADE,
  content_kind text NOT NULL,
  content_id text NOT NULL,
  relevance_score float DEFAULT 0,
  auto_linked boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(topic_slug, content_kind, content_id)
);

CREATE INDEX IF NOT EXISTS idx_content_topic_links_topic ON content_topic_links(topic_slug);
CREATE INDEX IF NOT EXISTS idx_content_topic_links_content ON content_topic_links(content_kind, content_id);

-- ── Search analytics events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'search',
  query text,
  result_count int,
  clicked_result_id text,
  clicked_kind text,
  response_ms int,
  filters jsonb,
  user_id uuid,
  session_id text,
  zero_results boolean DEFAULT false,
  topic_slugs text[],
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON search_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics_events(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_event_type ON search_analytics_events(event_type);

-- ── User search preferences (recommendation engine) ────────────────────────
CREATE TABLE IF NOT EXISTS user_search_preferences (
  user_id uuid PRIMARY KEY,
  preferred_kinds text[] DEFAULT '{}',
  preferred_topics text[] DEFAULT '{}',
  interaction_count int DEFAULT 0,
  last_interaction_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- ── Seed topics ────────────────────────────────────────────────────────────
INSERT INTO search_topics (slug, title, title_en, category, keywords, synonyms) VALUES
  ('tahara', 'الطهارة', 'Purification', 'fiqh', ARRAY['طهارة','وضوء','غسل','تيمم'], ARRAY['الطهارة','الوضوء']),
  ('salah', 'الصلاة', 'Prayer', 'fiqh', ARRAY['صلاة','صلوات','الجماعة','الفريضة'], ARRAY['الصلاة','فضل صلاة الجماعة']),
  ('zakat', 'الزكاة', 'Zakat', 'fiqh', ARRAY['زكاة','زكوات','صدقة','نصاب'], ARRAY['الزكاة']),
  ('siyam', 'الصيام', 'Fasting', 'fiqh', ARRAY['صيام','صوم','رمضان'], ARRAY['الصيام']),
  ('hajj', 'الحج', 'Hajj', 'fiqh', ARRAY['حج','عمرة','مناسك'], ARRAY['الحج','العمرة']),
  ('aqeedah', 'العقيدة', 'Aqeedah', 'aqeedah', ARRAY['عقيدة','عقائد','إيمان'], ARRAY['العقيدة']),
  ('tawheed', 'التوحيد', 'Tawheed', 'aqeedah', ARRAY['توحيد','الإلهية','الربوبية'], ARRAY['التوحيد']),
  ('bay', 'البيع', 'Trade', 'fiqh', ARRAY['بيع','تجارة','معاملات'], ARRAY['البيع']),
  ('riba', 'الربا', 'Riba', 'fiqh', ARRAY['ربا','فائدة'], ARRAY['الربا']),
  ('nikah', 'النكاح', 'Marriage', 'fiqh', ARRAY['نكاح','زواج','طلاق'], ARRAY['النكاح']),
  ('birr-walidayn', 'بر الوالدين', 'Kindness to Parents', 'akhlaq', ARRAY['بر','والدين'], ARRAY['بر الوالدين']),
  ('akhlaq', 'الأخلاق', 'Ethics', 'akhlaq', ARRAY['أخلاق','آداب','خلق'], ARRAY['الأخلاق']),
  ('quran', 'القرآن', 'Quran', 'quran', ARRAY['قرآن','آيات','سور','تفسير'], ARRAY['القرآن']),
  ('hadith', 'الحديث', 'Hadith', 'hadith', ARRAY['حديث','سنة','أحاديث'], ARRAY['الحديث']),
  ('fatwa', 'الفتاوى', 'Fatwas', 'fiqh', ARRAY['فتوى','فتاوى','استفتاء'], ARRAY['الفتاوى'])
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  keywords = EXCLUDED.keywords,
  synonyms = EXCLUDED.synonyms,
  updated_at = now();

-- ── Analytics summary RPC ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_analytics_summary(days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  result jsonb;
  since timestamptz := now() - (days || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'total_searches', (SELECT count(*) FROM search_analytics_events WHERE event_type = 'search' AND created_at >= since),
    'zero_results', (SELECT count(*) FROM search_analytics_events WHERE event_type = 'search' AND zero_results = true AND created_at >= since),
    'avg_response_ms', (SELECT coalesce(round(avg(response_ms)), 0) FROM search_analytics_events WHERE response_ms IS NOT NULL AND created_at >= since),
    'total_clicks', (SELECT count(*) FROM search_analytics_events WHERE event_type = 'click' AND created_at >= since)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION search_analytics_summary(int) TO authenticated, anon;

GRANT SELECT, INSERT ON search_analytics_events TO authenticated, anon;
GRANT SELECT ON search_topics TO authenticated, anon;
GRANT SELECT ON content_topic_links TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON user_search_preferences TO authenticated;
