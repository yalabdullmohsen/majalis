-- الحلقات القرآنية والعلمية — v1

CREATE TABLE IF NOT EXISTS quran_scientific_circle_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  parent_slug text,
  tab_group text NOT NULL CHECK (tab_group IN ('quran', 'mutoon', 'sharia', 'opportunities')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quran_scientific_circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key text UNIQUE,
  title text NOT NULL,
  summary text,
  description text,
  requirements text,
  registration_method text,
  category_slug text,
  subcategory_slug text,
  tab_group text NOT NULL DEFAULT 'quran',
  circle_type text,
  country text NOT NULL DEFAULT 'الكويت',
  governorate text,
  region text,
  venue_name text,
  organizer text,
  sheikh_name text,
  supervisor_name text,
  target_audience text DEFAULT 'عام',
  gender_access text DEFAULT 'عام',
  level text,
  days text[] DEFAULT '{}',
  start_date date,
  end_date date,
  lesson_time text,
  start_time text,
  end_time text,
  duration_text text,
  has_live boolean NOT NULL DEFAULT false,
  has_attendance boolean NOT NULL DEFAULT true,
  is_online boolean NOT NULL DEFAULT false,
  registration_url text,
  contact_phone text,
  whatsapp_url text,
  map_url text,
  announcement_url text,
  poster_image_url text,
  notes text,
  has_certificate boolean NOT NULL DEFAULT false,
  has_ijazah boolean NOT NULL DEFAULT false,
  has_exam boolean NOT NULL DEFAULT false,
  is_free boolean NOT NULL DEFAULT true,
  is_pinned boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'review'
    CHECK (status IN ('draft','review','published','registration_open','registration_closed','ongoing','completed','archived')),
  registration_status text DEFAULT 'open'
    CHECK (registration_status IN ('open','closed','soon','full')),
  view_count int NOT NULL DEFAULT 0,
  keywords text[] DEFAULT '{}',
  data_incomplete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quran_scientific_circle_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES quran_scientific_circles(id) ON DELETE CASCADE,
  day_of_week text,
  lesson_time text,
  start_time text,
  end_time text,
  topic text,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quran_scientific_circle_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES quran_scientific_circles(id) ON DELETE CASCADE,
  venue_name text,
  address text,
  region text,
  governorate text,
  country text DEFAULT 'الكويت',
  map_url text,
  latitude numeric,
  longitude numeric
);

CREATE TABLE IF NOT EXISTS quran_scientific_circle_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES quran_scientific_circles(id) ON DELETE CASCADE,
  contact_type text NOT NULL DEFAULT 'phone',
  label text,
  value text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS quran_scientific_circle_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  filename text,
  status text NOT NULL DEFAULT 'pending',
  total_rows int NOT NULL DEFAULT 0,
  imported_rows int NOT NULL DEFAULT 0,
  error_rows int NOT NULL DEFAULT 0,
  report jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS quran_scientific_circle_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES quran_scientific_circles(id) ON DELETE CASCADE,
  reviewer_id uuid,
  decision text NOT NULL CHECK (decision IN ('approve','reject','needs_data')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quran_scientific_circle_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid REFERENCES quran_scientific_circles(id) ON DELETE SET NULL,
  action text NOT NULL,
  actor_id uuid,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS qsc_country_idx ON quran_scientific_circles(country);
CREATE INDEX IF NOT EXISTS qsc_governorate_idx ON quran_scientific_circles(governorate);
CREATE INDEX IF NOT EXISTS qsc_region_idx ON quran_scientific_circles(region);
CREATE INDEX IF NOT EXISTS qsc_tab_group_idx ON quran_scientific_circles(tab_group);
CREATE INDEX IF NOT EXISTS qsc_status_idx ON quran_scientific_circles(status);
CREATE INDEX IF NOT EXISTS qsc_start_date_idx ON quran_scientific_circles(start_date);
CREATE INDEX IF NOT EXISTS qsc_category_idx ON quran_scientific_circles(category_slug);
CREATE INDEX IF NOT EXISTS qsc_sheikh_idx ON quran_scientific_circles(sheikh_name);
CREATE INDEX IF NOT EXISTS qsc_pinned_idx ON quran_scientific_circles(is_pinned DESC, created_at DESC);

INSERT INTO quran_scientific_circle_categories (slug, name_ar, parent_slug, tab_group, sort_order) VALUES
  ('hifz-new', 'حفظ جديد', NULL, 'quran', 1),
  ('hifz-review', 'مراجعة', NULL, 'quran', 2),
  ('tajweed', 'تجويد', NULL, 'quran', 3),
  ('qiraat', 'مقرأة', NULL, 'quran', 4),
  ('ijazah', 'إجازة', NULL, 'quran', 5),
  ('correction', 'تصحيح تلاوة', NULL, 'quran', 6),
  ('children', 'حلقات أطفال', NULL, 'quran', 7),
  ('women', 'حلقات نساء', NULL, 'quran', 8),
  ('nawawi40', 'الأربعون النووية', NULL, 'mutoon', 10),
  ('usool-thalatha', 'الأصول الثلاثة', NULL, 'mutoon', 11),
  ('qawaed-arba', 'القواعد الأربع', NULL, 'mutoon', 12),
  ('umdat-ahkam', 'عمدة الأحكام', NULL, 'mutoon', 13),
  ('bulugh-maram', 'بلوغ المرام', NULL, 'mutoon', 14),
  ('ajrummiya', 'الآجرومية', NULL, 'mutoon', 15),
  ('warqaat', 'الورقات', NULL, 'mutoon', 16),
  ('bayquniya', 'البيقونية', NULL, 'mutoon', 17),
  ('rahbiya', 'الرحبية', NULL, 'mutoon', 18),
  ('nukhbat-fikar', 'نخبة الفكر', NULL, 'mutoon', 19),
  ('tuhfat-atfal', 'تحفة الأطفال', NULL, 'mutoon', 20),
  ('jazariya', 'الجزرية', NULL, 'mutoon', 21),
  ('taseel', 'برامج تأصيلية', NULL, 'sharia', 30),
  ('fiqh-course', 'دورات فقه', NULL, 'sharia', 31),
  ('aqeeda-course', 'دورات عقيدة', NULL, 'sharia', 32),
  ('hadith-course', 'دورات حديث', NULL, 'sharia', 33),
  ('tafsir-course', 'دورات تفسير', NULL, 'sharia', 34),
  ('usool-fiqh', 'أصول فقه', NULL, 'sharia', 35),
  ('arabic', 'لغة عربية', NULL, 'sharia', 36),
  ('online-program', 'برامج عن بعد', NULL, 'sharia', 37),
  ('university', 'جامعات', NULL, 'opportunities', 40),
  ('institute', 'معاهد', NULL, 'opportunities', 41),
  ('scholarship', 'منح', NULL, 'opportunities', 42),
  ('diploma', 'دبلومات', NULL, 'opportunities', 43)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE quran_scientific_circles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "qsc_public_read" ON quran_scientific_circles
  FOR SELECT USING (status IN ('published','registration_open','registration_closed','ongoing'));
