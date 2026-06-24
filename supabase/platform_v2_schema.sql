-- =====================================================================
--  المجلس العلمي — مخطط المنصة v2
--  نفّذ يدويًا في Supabase SQL Editor
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper: admin check (reuse if exists)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── 1. mosques ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mosques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  governorate TEXT NOT NULL,
  area TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_maps_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. sheikhs extensions ─────────────────────────────────────────────
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS official_website TEXT;
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE sheikhs ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- ── 3. lessons extensions ───────────────────────────────────────────────
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS mosque_id UUID REFERENCES mosques(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS day TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT true;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS recurrence_text TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS has_women_place BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS live_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS transcript TEXT;

-- ── 4. books ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  category TEXT,
  pdf_url TEXT,
  cover_url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. lesson_series ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sheikh_id UUID REFERENCES sheikhs(id) ON DELETE SET NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  total_lessons INT NOT NULL DEFAULT 0,
  completed_lessons INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6. user_favorites ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('lesson', 'book', 'sheikh', 'series', 'mosque')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- ── 7. daily_content ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('hadith', 'ayah', 'lesson')),
  title TEXT,
  content TEXT NOT NULL,
  source TEXT,
  explanation TEXT,
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 8. prayer_times ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL DEFAULT 'الكويت',
  governorate TEXT NOT NULL DEFAULT 'العاصمة',
  date DATE NOT NULL,
  fajr TEXT NOT NULL,
  sunrise TEXT NOT NULL,
  dhuhr TEXT NOT NULL,
  asr TEXT NOT NULL,
  maghrib TEXT NOT NULL,
  isha TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city, governorate, date)
);

-- ── 9. notifications extensions ───────────────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- ── 10. admin_audit_logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mosques_governorate ON mosques(governorate);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_lesson_series_category ON lesson_series(category);
CREATE INDEX IF NOT EXISTS idx_daily_content_date ON daily_content(publish_date, type);
CREATE INDEX IF NOT EXISTS idx_prayer_times_date ON prayer_times(date);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id, item_type);

-- ── RLS ───────────────────────────────────────────────────────────────
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read: published content
DROP POLICY IF EXISTS "public_read_mosques" ON mosques;
CREATE POLICY "public_read_mosques" ON mosques FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_books" ON books;
CREATE POLICY "public_read_books" ON books FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "public_read_series" ON lesson_series;
CREATE POLICY "public_read_series" ON lesson_series FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "public_read_daily" ON daily_content;
CREATE POLICY "public_read_daily" ON daily_content FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "public_read_prayer" ON prayer_times;
CREATE POLICY "public_read_prayer" ON prayer_times FOR SELECT USING (true);

-- Admin write
DROP POLICY IF EXISTS "admin_manage_mosques" ON mosques;
CREATE POLICY "admin_manage_mosques" ON mosques FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_manage_books" ON books;
CREATE POLICY "admin_manage_books" ON books FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_manage_series" ON lesson_series;
CREATE POLICY "admin_manage_series" ON lesson_series FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_manage_daily" ON daily_content;
CREATE POLICY "admin_manage_daily" ON daily_content FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_manage_prayer" ON prayer_times;
CREATE POLICY "admin_manage_prayer" ON prayer_times FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_read_audit" ON admin_audit_logs;
CREATE POLICY "admin_read_audit" ON admin_audit_logs FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "admin_insert_audit" ON admin_audit_logs;
CREATE POLICY "admin_insert_audit" ON admin_audit_logs FOR INSERT WITH CHECK (is_admin());

-- User favorites
DROP POLICY IF EXISTS "users_own_favorites" ON user_favorites;
CREATE POLICY "users_own_favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
