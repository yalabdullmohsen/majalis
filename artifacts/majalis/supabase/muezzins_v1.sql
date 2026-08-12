-- ═══════════════════════════════════════════════════════════════════
-- مكتبة المؤذنين العالمية — Supabase Schema v1
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. جدول المؤذنين الرئيسي ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS muezzins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,                -- e.g. "alafasy"
  name          TEXT NOT NULL,
  title         TEXT,                               -- "إمام الحرم المكي"
  origin        TEXT,                               -- المدينة
  country       TEXT,
  category      TEXT,                               -- "حرم مكي" | "مصري كلاسيكي"
  style         TEXT CHECK (style IN ('تقليدي','خاشع','رسمي','كلاسيكي')),
  tags          TEXT[]  DEFAULT '{}',
  biography     TEXT,
  photo_url     TEXT,
  audio_url     TEXT NOT NULL,                      -- الأذان العام
  fajr_url      TEXT,                               -- أذان الفجر (اختياري)
  duration_sec  INTEGER,
  rating        NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  followers     INTEGER DEFAULT 0,
  is_verified   BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. جدول المفضلة ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS muezzin_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  muezzin_id  UUID REFERENCES muezzins(id) ON DELETE CASCADE,
  prayer_type TEXT CHECK (prayer_type IN ('fajr','dhuhr','asr','maghrib','isha','all')) DEFAULT 'all',
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, muezzin_id, prayer_type)
);

-- ── 3. جدول التقييمات ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS muezzin_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muezzin_id  UUID REFERENCES muezzins(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (muezzin_id, user_id)
);

-- ── 4. جدول الإحصائيات اليومية ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS muezzin_statistics (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muezzin_id     UUID REFERENCES muezzins(id) ON DELETE CASCADE,
  stat_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  listen_count   INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  share_count    INTEGER DEFAULT 0,
  UNIQUE (muezzin_id, stat_date)
);

-- ── 5. الفهارس ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_muezzins_country    ON muezzins (country);
CREATE INDEX IF NOT EXISTS idx_muezzins_style      ON muezzins (style);
CREATE INDEX IF NOT EXISTS idx_muezzins_rating     ON muezzins (rating DESC);
CREATE INDEX IF NOT EXISTS idx_muezzin_favorites_user ON muezzin_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_muezzin_ratings_muezzin ON muezzin_ratings (muezzin_id);

-- ── 6. RLS ──────────────────────────────────────────────────────────
ALTER TABLE muezzins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE muezzin_favorites   ENABLE ROW LEVEL SECURITY;
ALTER TABLE muezzin_ratings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE muezzin_statistics  ENABLE ROW LEVEL SECURITY;

-- muezzins: قراءة عامة للموثقين، كتابة للأدمن فقط
CREATE POLICY "muezzins_public_read"
  ON muezzins FOR SELECT USING (is_verified = true);

-- favorites: كل مستخدم يرى ويعدّل مفضلته فقط
CREATE POLICY "favorites_own"
  ON muezzin_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ratings: قراءة عامة، كتابة للمستخدم على تقييمه
CREATE POLICY "ratings_public_read"
  ON muezzin_ratings FOR SELECT USING (true);

CREATE POLICY "ratings_own_write"
  ON muezzin_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ratings_own_update"
  ON muezzin_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- statistics: قراءة عامة
CREATE POLICY "statistics_public_read"
  ON muezzin_statistics FOR SELECT USING (true);

-- ── 7. دالة تحديث التقييم المتوسط تلقائياً ──────────────────────────
CREATE OR REPLACE FUNCTION update_muezzin_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE muezzins
  SET
    rating        = (SELECT ROUND(AVG(stars)::NUMERIC, 2) FROM muezzin_ratings WHERE muezzin_id = NEW.muezzin_id),
    total_ratings = (SELECT COUNT(*) FROM muezzin_ratings WHERE muezzin_id = NEW.muezzin_id)
  WHERE id = NEW.muezzin_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_muezzin_rating ON muezzin_ratings;
CREATE TRIGGER trg_update_muezzin_rating
  AFTER INSERT OR UPDATE OR DELETE ON muezzin_ratings
  FOR EACH ROW EXECUTE FUNCTION update_muezzin_rating();

-- ── 8. بيانات المؤذنين الأولية (9 مؤذنين) ───────────────────────────
INSERT INTO muezzins (slug, name, origin, country, category, style, tags, biography, audio_url, fajr_url, duration_sec, rating, total_ratings, followers)
VALUES
  ('alafasy',    'مشاري راشد العفاسي',        'الكويت',          'الكويت',   'كويتي معاصر',      'خاشع',    ARRAY['خاشع','رقيق','روحاني'],         'قارئ كويتي بارز يتميز صوته بالخشوع والحنين.',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/mishary-alafasy-01.mp3',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/fajr/mishary-alafasy-fajr-01.mp3',
    195, 4.90, 218000, 450000),

  ('makkah',     'الحرم المكي',               'مكة المكرمة',     'السعودية', 'حرم مكي',          'رسمي',    ARRAY['رسمي','مهيب','تقليدي'],         'أذان الحرم المكي الشريف من أم القرى.',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/makkah-haram-01.mp3',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/fajr/makkah-fajr-01.mp3',
    130, 4.95, 380000, 720000),

  ('madinah',    'الحرم النبوي',              'المدينة المنورة', 'السعودية', 'حرم نبوي',         'رسمي',    ARRAY['رسمي','هادئ','روحاني'],         'أذان المسجد النبوي الشريف من مدينة الرسول ﷺ.',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/madinah-01.mp3',
    NULL, 110, 4.92, 295000, 580000),

  ('alharam',    'أذان الحرمين الكلاسيكي',   'مكة المكرمة',     'السعودية', 'حرم مكي',          'كلاسيكي', ARRAY['كلاسيكي','أصيل','عميق'],        'تسجيل كلاسيكي من الحرم المكي.',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/al-haram-01.mp3',
    NULL, 160, 4.85, 142000, 310000),

  ('egypt',      'الأذان المصري التقليدي',    'القاهرة',         'مصر',      'مصري كلاسيكي',     'كلاسيكي', ARRAY['كلاسيكي','حنين','أزهري'],       'أذان بالطابع المصري الأصيل.',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/egypt-traditional-01.mp3',
    NULL, 145, 4.80, 165000, 270000),

  ('abdulbasit', 'عبد الباسط عبد الصمد',      'القاهرة',         'مصر',      'مصري معاصر',       'خاشع',    ARRAY['خاشع','عميق الصوت','مؤثر'],     'من أبرز قراء القرآن في التاريخ.',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/abdul-basit-abdul-samad-01.mp3',
    NULL, 170, 4.88, 198000, 390000),

  ('qatami',     'ناصر القطامي',              'الكويت',          'الكويت',   'كويتي خاشع',       'خاشع',    ARRAY['خاشع','هادئ','رقيق'],           'صوت كويتي رقيق يتميز بالهدوء والخشوع.',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/nasser-al-qatami-01.mp3',
    NULL, 150, 4.82, 134000, 245000),

  ('nafees',     'أحمد النفيس',               'الرياض',          'السعودية', 'سعودي تقليدي',     'تقليدي',  ARRAY['تقليدي','أصيل','قوي'],          'مؤذن سعودي بأسلوب تقليدي أصيل.',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/ahmad-al-nafees-01.mp3',
    NULL, 140, 4.75, 89000, 165000),

  ('mansour',    'منصور الزهراني',            'جدة',             'السعودية', 'سعودي رسمي',       'رسمي',    ARRAY['رسمي','واضح','قوي'],            'أذان سعودي بصوت واضح وقوي.',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/general/mansour-al-zahrani-01.mp3',
    'https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main/fajr/mansour-al-zahrani-fajr-01.mp3',
    135, 4.78, 102000, 188000)

ON CONFLICT (slug) DO NOTHING;
