-- =====================================================================
--  المجلس العلمي — مخطط قاعدة البيانات الكامل v2 (مُصلَّح)
--  قابل للتنفيذ من البداية إلى النهاية على Supabase SQL Editor
--  آمن لإعادة التشغيل: IF NOT EXISTS / IF EXISTS / DROP POLICY IF EXISTS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Enums ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'sheikh', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Helper functions ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_lesson_speaker_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sheikh_id IS NOT NULL THEN
    SELECT name INTO NEW.speaker_name FROM sheikhs WHERE id = NEW.sheikh_id;
  ELSE
    NEW.speaker_name := COALESCE(NEW.speaker_name, '');
  END IF;
  RETURN NEW;
END;
$$;

-- ── 1. profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  role        user_role NOT NULL DEFAULT 'user',
  city        TEXT,
  points      INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. sheikhs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sheikhs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  title            TEXT,
  bio              TEXT,
  biography        TEXT,
  qualifications   TEXT[],
  specialties      TEXT[],
  ijazah           TEXT,
  city             TEXT,
  photo_url        TEXT,
  image_url        TEXT,
  official_website TEXT,
  twitter_url      TEXT,
  instagram_url    TEXT,
  youtube_url      TEXT,
  years_experience INTEGER,
  is_verified      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS official_website TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- ── 3. mosques ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mosques (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  governorate     TEXT NOT NULL,
  area            TEXT,
  address         TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  google_maps_url TEXT,
  image_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. lessons ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  sheikh_id   UUID REFERENCES sheikhs(id) ON DELETE SET NULL,
  mosque      TEXT,
  mosque_id   UUID REFERENCES mosques(id) ON DELETE SET NULL,
  city        TEXT,
  category    TEXT,
  audience    TEXT DEFAULT 'الكل',
  delivery    TEXT DEFAULT 'حضور فقط',
  schedule    TEXT,
  lesson_time TEXT,
  description TEXT,
  status      content_status NOT NULL DEFAULT 'approved',
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS mosque_id UUID REFERENCES mosques(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS day TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS day_of_week TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS recurrence_text TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS has_women_place BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS live_url TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS book_url TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS speaker_name TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS sheikh_image_url TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS external_key TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

-- ── 5. lesson relations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_registrations (
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id     UUID REFERENCES lessons(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS lesson_favorites (
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS lesson_ratings (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id  UUID REFERENCES lessons(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- ── 6. library_items ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  type         TEXT NOT NULL,
  category     TEXT,
  sheikh_id    UUID REFERENCES sheikhs(id) ON DELETE SET NULL,
  description  TEXT,
  file_url     TEXT,
  external_url TEXT,
  status       content_status NOT NULL DEFAULT 'approved',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 7. books ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  author      TEXT,
  category    TEXT,
  pdf_url     TEXT,
  cover_url   TEXT,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 8. lesson_series ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_series (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT,
  sheikh_id         UUID REFERENCES sheikhs(id) ON DELETE SET NULL,
  book_id           UUID REFERENCES books(id) ON DELETE SET NULL,
  total_lessons     INT NOT NULL DEFAULT 0,
  completed_lessons INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 9. fawaid ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fawaid (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text         TEXT NOT NULL,
  author_name  TEXT,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status       content_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 10. scientific_miracles ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scientific_miracles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  category         TEXT,
  source_type      TEXT,
  reference        TEXT,
  body             TEXT,
  media_url        TEXT,
  scholarly_source TEXT,
  status           content_status NOT NULL DEFAULT 'approved',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 11. tasmee_requests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasmee_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sheikh_id      UUID REFERENCES sheikhs(id) ON DELETE CASCADE,
  portion        TEXT,
  method         TEXT,
  preferred_day  TEXT,
  preferred_time TEXT,
  phone          TEXT,
  status         TEXT NOT NULL DEFAULT 'بانتظار تأكيد الشيخ',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 12. achievements ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge     TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 13. user_favorites ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type  TEXT NOT NULL CHECK (item_type IN ('lesson', 'book', 'sheikh', 'series', 'mosque')),
  item_id    UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

-- ── 14. bookmarks (legacy fallback) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'book', 'benefit', 'qa', 'scholar', 'series', 'mosque')),
  content_id   UUID NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);

-- ── 15. content_ratings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_ratings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id   UUID NOT NULL,
  rating       INT CHECK (rating BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);

-- ── 16. error_reports ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS error_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL,
  content_id   UUID,
  report_type  TEXT CHECK (report_type IN ('خطأ_علمي', 'خطأ_إملائي', 'محتوى_غير_لائق', 'رابط_مكسور', 'أخرى')),
  description  TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── 17. notifications ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT,
  type         TEXT DEFAULT 'info' CHECK (type IN ('info', 'lesson', 'qa', 'system', 'alert')),
  related_id   UUID,
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  is_read      BOOLEAN DEFAULT false,
  link         TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- ── 18. content_views ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_views (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id   UUID NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at    TIMESTAMPTZ DEFAULT now()
);

-- ── 19. daily_content ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL CHECK (type IN ('hadith', 'ayah', 'lesson')),
  title        TEXT,
  content      TEXT NOT NULL,
  source       TEXT,
  explanation  TEXT,
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 20. prayer_times ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prayer_times (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city         TEXT NOT NULL DEFAULT 'الكويت',
  governorate  TEXT NOT NULL DEFAULT 'العاصمة',
  date         DATE NOT NULL,
  fajr         TEXT NOT NULL,
  sunrise      TEXT NOT NULL,
  dhuhr        TEXT NOT NULL,
  asr          TEXT NOT NULL,
  maghrib      TEXT NOT NULL,
  isha         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city, governorate, date)
);

-- ── 21. admin_audit_logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id  UUID,
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 22. transcriptions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transcriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  file_url         TEXT,
  file_type        TEXT CHECK (file_type IN ('audio', 'video', 'youtube')),
  source_url       TEXT,
  transcript_text  TEXT,
  summary          TEXT,
  benefits         JSONB DEFAULT '[]'::jsonb,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  duration_seconds INT,
  language         TEXT DEFAULT 'ar',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── 23. qa_categories ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 24. qa_questions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  category_id   UUID REFERENCES qa_categories(id) ON DELETE SET NULL,
  ruling_type   TEXT CHECK (
    ruling_type IN ('حلال', 'حرام', 'مكروه', 'مباح', 'سنة', 'مندوب')
    OR ruling_type IS NULL
  ),
  evidence      TEXT,
  reference     TEXT,
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  review_status TEXT DEFAULT 'needs_review' CHECK (review_status IN ('approved', 'needs_review')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── 25. quiz_questions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section    TEXT NOT NULL,
  category   TEXT NOT NULL,
  level      TEXT NOT NULL DEFAULT 'متوسط' CHECK (level IN ('سهل', 'متوسط', 'صعب')),
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  status     TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mosques_governorate ON mosques(governorate);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_lesson_series_category ON lesson_series(category);
CREATE INDEX IF NOT EXISTS idx_daily_content_date ON daily_content(publish_date, type);
CREATE INDEX IF NOT EXISTS idx_prayer_times_date ON prayer_times(date);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id, item_type);
CREATE UNIQUE INDEX IF NOT EXISTS lessons_external_key_uidx ON lessons(external_key) WHERE external_key IS NOT NULL AND external_key <> '';
CREATE INDEX IF NOT EXISTS lessons_kuwait_city_idx ON lessons(city);
CREATE INDEX IF NOT EXISTS lessons_kuwait_end_date_idx ON lessons(end_date);
CREATE INDEX IF NOT EXISTS qa_questions_category_idx ON qa_questions(category_id);
CREATE INDEX IF NOT EXISTS qa_questions_status_idx ON qa_questions(status);
CREATE INDEX IF NOT EXISTS quiz_questions_section_idx ON quiz_questions(section);
CREATE INDEX IF NOT EXISTS quiz_questions_status_idx ON quiz_questions(status);

-- ── Triggers ──────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_role_escalation();

DROP TRIGGER IF EXISTS trg_lessons_speaker_name ON lessons;
CREATE TRIGGER trg_lessons_speaker_name
  BEFORE INSERT OR UPDATE OF sheikh_id ON lessons
  FOR EACH ROW EXECUTE FUNCTION sync_lesson_speaker_name();

-- ── Enable RLS on all tables ──────────────────────────────────────────
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sheikhs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS books ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fawaid ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scientific_miracles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasmee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prayer_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS qa_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quiz_questions ENABLE ROW LEVEL SECURITY;

-- ── RLS: profiles ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "الجميع يقرأ الملفات العامة" ON profiles;
CREATE POLICY "الجميع يقرأ الملفات العامة" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "المشرف يدير الملفات" ON profiles;
CREATE POLICY "المشرف يدير الملفات" ON profiles
  FOR UPDATE USING (is_admin() OR auth.uid() = id)
  WITH CHECK (is_admin() OR auth.uid() = id);

-- ── RLS: sheikhs ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "قراءة المشايخ" ON sheikhs;
CREATE POLICY "قراءة المشايخ" ON sheikhs FOR SELECT USING (true);

DROP POLICY IF EXISTS "المشرف يدير المشايخ" ON sheikhs;
CREATE POLICY "المشرف يدير المشايخ" ON sheikhs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── RLS: lessons ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "قراءة الدروس المعتمدة" ON lessons;
CREATE POLICY "قراءة الدروس المعتمدة" ON lessons FOR SELECT USING (status = 'approved' OR is_admin());

DROP POLICY IF EXISTS "المشرف يدير الدروس" ON lessons;
CREATE POLICY "المشرف يدير الدروس" ON lessons FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── RLS: lesson_registrations / favorites / ratings ───────────────────
DROP POLICY IF EXISTS "إدارة تسجيلاتي" ON lesson_registrations;
CREATE POLICY "إدارة تسجيلاتي" ON lesson_registrations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "إدارة مفضلتي" ON lesson_favorites;
CREATE POLICY "إدارة مفضلتي" ON lesson_favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "إدارة تقييماتي" ON lesson_ratings;
CREATE POLICY "إدارة تقييماتي" ON lesson_ratings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "قراءة كل التقييمات" ON lesson_ratings;
CREATE POLICY "قراءة كل التقييمات" ON lesson_ratings FOR SELECT USING (true);

-- ── RLS: library_items ────────────────────────────────────────────────
DROP POLICY IF EXISTS "قراءة المكتبة المعتمدة" ON library_items;
CREATE POLICY "قراءة المكتبة المعتمدة" ON library_items FOR SELECT USING (status = 'approved' OR is_admin());

DROP POLICY IF EXISTS "المشرف يدير المكتبة" ON library_items;
CREATE POLICY "المشرف يدير المكتبة" ON library_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── RLS: fawaid ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "قراءة الفوائد المعتمدة" ON fawaid;
CREATE POLICY "قراءة الفوائد المعتمدة" ON fawaid FOR SELECT USING (status = 'approved' OR is_admin());

DROP POLICY IF EXISTS "أي مستخدم مسجّل يرسل فائدة" ON fawaid;
CREATE POLICY "أي مستخدم مسجّل يرسل فائدة" ON fawaid FOR INSERT WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "المشرف يراجع الفوائد" ON fawaid;
CREATE POLICY "المشرف يراجع الفوائد" ON fawaid FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "المشرف يدير الفوائد" ON fawaid;
CREATE POLICY "المشرف يدير الفوائد" ON fawaid FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── RLS: scientific_miracles ──────────────────────────────────────────
DROP POLICY IF EXISTS "قراءة الإعجاز المعتمد" ON scientific_miracles;
CREATE POLICY "قراءة الإعجاز المعتمد" ON scientific_miracles FOR SELECT USING (status = 'approved' OR is_admin());

DROP POLICY IF EXISTS "المشرف يدير الإعجاز" ON scientific_miracles;
CREATE POLICY "المشرف يدير الإعجاز" ON scientific_miracles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── RLS: tasmee_requests ──────────────────────────────────────────────
DROP POLICY IF EXISTS "إدارة طلبات التسميع الخاصة بي" ON tasmee_requests;
CREATE POLICY "إدارة طلبات التسميع الخاصة بي" ON tasmee_requests FOR ALL
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id);

-- ── RLS: achievements ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "قراءة إنجازاتي" ON achievements;
CREATE POLICY "قراءة إنجازاتي" ON achievements FOR SELECT USING (auth.uid() = user_id);

-- ── RLS: platform v2 tables ───────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_mosques" ON mosques;
CREATE POLICY "public_read_mosques" ON mosques FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_mosques" ON mosques;
CREATE POLICY "admin_manage_mosques" ON mosques FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_read_books" ON books;
CREATE POLICY "public_read_books" ON books FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "admin_manage_books" ON books;
CREATE POLICY "admin_manage_books" ON books FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_read_series" ON lesson_series;
CREATE POLICY "public_read_series" ON lesson_series FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "admin_manage_series" ON lesson_series;
CREATE POLICY "admin_manage_series" ON lesson_series FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_read_daily" ON daily_content;
CREATE POLICY "public_read_daily" ON daily_content FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "admin_manage_daily" ON daily_content;
CREATE POLICY "admin_manage_daily" ON daily_content FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public_read_prayer" ON prayer_times;
CREATE POLICY "public_read_prayer" ON prayer_times FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_prayer" ON prayer_times;
CREATE POLICY "admin_manage_prayer" ON prayer_times FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_read_audit" ON admin_audit_logs;
CREATE POLICY "admin_read_audit" ON admin_audit_logs FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "admin_insert_audit" ON admin_audit_logs;
CREATE POLICY "admin_insert_audit" ON admin_audit_logs FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "users_own_favorites" ON user_favorites;
CREATE POLICY "users_own_favorites" ON user_favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── RLS: bookmarks / ratings / reports / notifications / views ──────────
DROP POLICY IF EXISTS "users_own_bookmarks" ON bookmarks;
CREATE POLICY "users_own_bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_ratings" ON content_ratings;
CREATE POLICY "users_own_ratings" ON content_ratings FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_submit_reports" ON error_reports;
CREATE POLICY "users_submit_reports" ON error_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_view_reports" ON error_reports;
CREATE POLICY "admin_view_reports" ON error_reports FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "admin_manage_reports" ON error_reports;
CREATE POLICY "admin_manage_reports" ON error_reports FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "users_own_notifications" ON notifications;
CREATE POLICY "users_own_notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_manage_notifications" ON notifications;
CREATE POLICY "admin_manage_notifications" ON notifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "anyone_insert_views" ON content_views;
CREATE POLICY "anyone_insert_views" ON content_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_views" ON content_views;
CREATE POLICY "admin_read_views" ON content_views FOR SELECT USING (is_admin());

-- ── RLS: transcriptions ─────────────────────────────────────────────
DROP POLICY IF EXISTS "users_own_transcriptions" ON transcriptions;
CREATE POLICY "users_own_transcriptions" ON transcriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_transcriptions" ON transcriptions;
CREATE POLICY "admin_all_transcriptions" ON transcriptions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── RLS: qa ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "قراءة التصنيفات" ON qa_categories;
CREATE POLICY "قراءة التصنيفات" ON qa_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "المشرف يدير التصنيفات" ON qa_categories;
CREATE POLICY "المشرف يدير التصنيفات" ON qa_categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "قراءة الأسئلة المنشورة" ON qa_questions;
CREATE POLICY "قراءة الأسئلة المنشورة" ON qa_questions FOR SELECT USING (status = 'published' OR is_admin());

DROP POLICY IF EXISTS "المشرف يدير الأسئلة" ON qa_questions;
CREATE POLICY "المشرف يدير الأسئلة" ON qa_questions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── RLS: quiz ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "قراءة أسئلة المسابقة المنشورة" ON quiz_questions;
CREATE POLICY "قراءة أسئلة المسابقة المنشورة" ON quiz_questions FOR SELECT
  USING (status = 'published' OR is_admin());

DROP POLICY IF EXISTS "المشرف يدير أسئلة المسابقة" ON quiz_questions;
CREATE POLICY "المشرف يدير أسئلة المسابقة" ON quiz_questions FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- ── Storage buckets ───────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('sheikhs', 'sheikhs', true, 5242880)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('transcriptions', 'transcriptions', false, 524288000)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "public_read_sheikh_images" ON storage.objects;
CREATE POLICY "public_read_sheikh_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'sheikhs');

DROP POLICY IF EXISTS "admin_upload_sheikh_images" ON storage.objects;
CREATE POLICY "admin_upload_sheikh_images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'sheikhs'
    AND is_admin()
    AND (storage.extension(name) IN ('png', 'jpg', 'jpeg', 'webp'))
  );

DROP POLICY IF EXISTS "admin_update_sheikh_images" ON storage.objects;
CREATE POLICY "admin_update_sheikh_images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'sheikhs' AND is_admin());

DROP POLICY IF EXISTS "admin_delete_sheikh_images" ON storage.objects;
CREATE POLICY "admin_delete_sheikh_images" ON storage.objects
  FOR DELETE USING (bucket_id = 'sheikhs' AND is_admin());

DROP POLICY IF EXISTS "users_upload_own_transcriptions" ON storage.objects;
CREATE POLICY "users_upload_own_transcriptions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'transcriptions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_read_own_transcriptions" ON storage.objects;
CREATE POLICY "users_read_own_transcriptions" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'transcriptions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "users_delete_own_transcriptions" ON storage.objects;
CREATE POLICY "users_delete_own_transcriptions" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'transcriptions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Default QA categories (idempotent) ────────────────────────────────
INSERT INTO qa_categories (name, slug, description) VALUES
  ('أحكام شرعية', 'rulings', 'أسئلة وأجوبة في الأحكام الشرعية'),
  ('قصص الأنبياء', 'prophets-stories', 'أسئلة عن قصص الأنبياء عليهم السلام'),
  ('سير الصالحين', 'righteous-biographies', 'فوائد وسير من حياة الصالحين'),
  ('السيرة النبوية', 'seerah', 'أسئلة في سيرة النبي محمد صلى الله عليه وسلم'),
  ('الصحابة', 'companions', 'أسئلة عن الصحابة رضي الله عنهم'),
  ('ألغاز فقهية', 'fiqh-puzzles', 'ألغاز ومسائل فقهية تعليمية'),
  ('العقيدة', 'aqeedah', 'أسئلة في العقيدة'),
  ('الصلاة', 'salah', 'أسئلة في الصلاة'),
  ('الزكاة', 'zakat', 'أسئلة في الزكاة'),
  ('الصيام', 'sawm', 'أسئلة في الصيام'),
  ('الحج', 'hajj', 'أسئلة في الحج'),
  ('الأسرة', 'family', 'أسئلة في أحكام الأسرة'),
  ('المعاملات', 'muamalat', 'أسئلة في المعاملات')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
--  انتهى — المخطط جاهز للتنفيذ على Supabase
-- =====================================================================
