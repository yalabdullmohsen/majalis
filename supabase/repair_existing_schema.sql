-- =====================================================================
--  المجلس العلمي — إصلاح الجداول الموجودة (بدون حذف بيانات)
--  شغّله مرة واحدة في Supabase SQL Editor قبل platform_v2_schema_fixed.sql
--  آمن لإعادة التشغيل: ALTER TABLE IF EXISTS + ADD COLUMN IF NOT EXISTS
-- =====================================================================

-- ── sheikhs ───────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS biography TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS official_website TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS sheikhs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── mosques ───────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS mosques ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE IF EXISTS mosques ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE IF EXISTS mosques ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS mosques ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE IF EXISTS mosques ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE IF EXISTS mosques ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE IF EXISTS mosques ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE IF EXISTS mosques ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── lessons ───────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS mosque_id UUID;
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
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS lesson_time TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS mosque TEXT;
ALTER TABLE IF EXISTS lessons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── library_items ─────────────────────────────────────────────────────
ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS sheikh_id UUID;
ALTER TABLE IF EXISTS library_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── books ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS books ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE IF EXISTS books ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE IF EXISTS books ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS books ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE IF EXISTS books ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE IF EXISTS books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS books ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── lesson_series ─────────────────────────────────────────────────────
ALTER TABLE IF EXISTS lesson_series ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE IF EXISTS lesson_series ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS lesson_series ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS lesson_series ADD COLUMN IF NOT EXISTS sheikh_id UUID;
ALTER TABLE IF EXISTS lesson_series ADD COLUMN IF NOT EXISTS book_id UUID;
ALTER TABLE IF EXISTS lesson_series ADD COLUMN IF NOT EXISTS total_lessons INT DEFAULT 0;
ALTER TABLE IF EXISTS lesson_series ADD COLUMN IF NOT EXISTS completed_lessons INT DEFAULT 0;
ALTER TABLE IF EXISTS lesson_series ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── fawaid ────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS fawaid ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE IF EXISTS fawaid ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE IF EXISTS fawaid ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE IF EXISTS fawaid ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── scientific_miracles ───────────────────────────────────────────────
ALTER TABLE IF EXISTS scientific_miracles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE IF EXISTS scientific_miracles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS scientific_miracles ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE IF EXISTS scientific_miracles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── qa_questions ──────────────────────────────────────────────────────
ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'needs_review';
ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS ruling_type TEXT;
ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS evidence TEXT;
ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS qa_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── quiz_questions ────────────────────────────────────────────────────
ALTER TABLE IF EXISTS quiz_questions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE IF EXISTS quiz_questions ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE IF EXISTS quiz_questions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE IF EXISTS quiz_questions ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'متوسط';
ALTER TABLE IF EXISTS quiz_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS quiz_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── notifications ─────────────────────────────────────────────────────
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── error_reports ─────────────────────────────────────────────────────
ALTER TABLE IF EXISTS error_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE IF EXISTS error_reports ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS error_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── transcriptions ────────────────────────────────────────────────────
ALTER TABLE IF EXISTS transcriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE IF EXISTS transcriptions ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE IF EXISTS transcriptions ADD COLUMN IF NOT EXISTS transcript_text TEXT;
ALTER TABLE IF EXISTS transcriptions ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS transcriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS transcriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── daily_content ─────────────────────────────────────────────────────
ALTER TABLE IF EXISTS daily_content ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE IF EXISTS daily_content ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE IF EXISTS daily_content ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE IF EXISTS daily_content ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE IF EXISTS daily_content ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE IF EXISTS daily_content ADD COLUMN IF NOT EXISTS publish_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE IF EXISTS daily_content ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS daily_content ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── prayer_times ──────────────────────────────────────────────────────
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'الكويت';
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT 'العاصمة';
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS fajr TEXT;
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS sunrise TEXT;
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS dhuhr TEXT;
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS asr TEXT;
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS maghrib TEXT;
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS isha TEXT;
ALTER TABLE IF EXISTS prayer_times ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── user_favorites ────────────────────────────────────────────────────
ALTER TABLE IF EXISTS user_favorites ADD COLUMN IF NOT EXISTS item_type TEXT;
ALTER TABLE IF EXISTS user_favorites ADD COLUMN IF NOT EXISTS item_id UUID;
ALTER TABLE IF EXISTS user_favorites ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- =====================================================================
--  انتهى — بعد التشغيل نفّذ platform_v2_schema_fixed.sql لإكمال RLS والسياسات
-- =====================================================================
