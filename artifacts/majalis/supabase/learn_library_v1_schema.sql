-- ═══════════════════════════════════════════════════════════════════════════
-- منظومة "تعلّم" — مكتبة علمية منظمة (شجرة تصنيفات + دروس مُهيكَلة + سلاسل)
-- ═══════════════════════════════════════════════════════════════════════════
-- يبني فوق ما هو قائم فعلاً ولا يكرره:
--  - لا يُنشأ نظام تقدم جديد: يُوسَّع item_completion_events بعمود lesson_id
--    اختياري بدل learning_item_id (نفس آلية الأحداث والاحتساب من الأحداث).
--  - لا تُنشأ جداول tags/versions/reviews موازية: يُعاد استخدام
--    content_tags/content_tag_relations (موجودة، 24 وسمًا و685 علاقة فعلية)،
--    content_version_snapshots (موجود، فارغ، عام بالفعل)، وgovernance_reviews
--    (موجود، فارغ، عام بالفعل) لدورة المراجعة العلمية/اللغوية والاعتماد.
--  - bookmarks (موجود) يُستخدم للحفظ ومتابعة آخر موضع (reading_position jsonb).
--  - lesson_ratings (موجود، فارغ) يُستخدم لتقييم وضوح الدرس كما هو دون تعديل.
--  - lessons.category TEXT الحر يبقى كما هو (لا حذف) — يُضاف category_id FK
--    جديد بجانبه فقط.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1) categories — شجرة تصنيف العلوم الشرعية (self-referencing، بحالة نشر)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  -- التصنيف لا يظهر للمستخدم إلا published؛ draft = جاهز للتفعيل عند توفر محتوى.
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

CREATE OR REPLACE FUNCTION prevent_circular_categories()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'لا يمكن أن يكون التصنيف أبًا لنفسه';
  END IF;
  IF EXISTS (
    WITH RECURSIVE chain AS (
      SELECT parent_id AS pid FROM categories WHERE id = NEW.parent_id
      UNION
      SELECT c.parent_id FROM categories c JOIN chain ON c.id = chain.pid
    )
    SELECT 1 FROM chain WHERE pid = NEW.id
  ) THEN
    RAISE EXCEPTION 'تسلسل تصنيفات دائري مرفوض';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_circular_categories ON categories;
CREATE TRIGGER trg_prevent_circular_categories
  BEFORE INSERT OR UPDATE OF parent_id ON categories
  FOR EACH ROW EXECUTE FUNCTION prevent_circular_categories();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_public_read ON categories;
CREATE POLICY categories_public_read ON categories FOR SELECT USING (status = 'published' OR is_admin());
DROP POLICY IF EXISTS categories_admin_write ON categories;
CREATE POLICY categories_admin_write ON categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 2) ربط lessons بالشجرة الجديدة (إضافة لا استبدال)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_category_id ON lessons(category_id) WHERE category_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) lesson_series + series_lessons — سلاسل دروس مترابطة الترتيب
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  -- مسار ترقية اختياري: سلسلة بسيطة يمكن أن "تترقى" لاحقًا لمقرر كامل في
  -- منظومة المسارات العلمية القائمة (courses) دون إنشاء نظام مواز.
  related_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lesson_series_category ON lesson_series(category_id);

CREATE TABLE IF NOT EXISTS series_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES lesson_series(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (series_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_series_lessons_series ON series_lessons(series_id);
CREATE INDEX IF NOT EXISTS idx_series_lessons_lesson ON series_lessons(lesson_id);

ALTER TABLE lesson_series ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_series_public_read ON lesson_series;
CREATE POLICY lesson_series_public_read ON lesson_series FOR SELECT USING (status = 'published' OR is_admin());
DROP POLICY IF EXISTS lesson_series_admin_write ON lesson_series;
CREATE POLICY lesson_series_admin_write ON lesson_series FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE series_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS series_lessons_public_read ON series_lessons;
CREATE POLICY series_lessons_public_read ON series_lessons FOR SELECT USING (
  is_admin() OR EXISTS (SELECT 1 FROM lesson_series s WHERE s.id = series_lessons.series_id AND s.status = 'published')
);
DROP POLICY IF EXISTS series_lessons_admin_write ON series_lessons;
CREATE POLICY series_lessons_admin_write ON series_lessons FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 4) lesson_sections — متن الدرس المُهيكَل (أهداف/أدلة/مصطلحات/أمثلة/خلاصة...)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'objectives', 'prerequisites', 'body', 'evidence', 'terms',
    'examples', 'common_mistakes', 'summary', 'review_questions', 'timeline_events'
  )),
  title TEXT,
  content TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lesson_sections_lesson ON lesson_sections(lesson_id);

ALTER TABLE lesson_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_sections_public_read ON lesson_sections;
CREATE POLICY lesson_sections_public_read ON lesson_sections FOR SELECT USING (
  is_admin() OR EXISTS (SELECT 1 FROM lessons l WHERE l.id = lesson_sections.lesson_id AND l.status = 'approved')
);
DROP POLICY IF EXISTS lesson_sections_admin_write ON lesson_sections;
CREATE POLICY lesson_sections_admin_write ON lesson_sections FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 5) lesson_citations — مصادر ومراجع الدرس (استشهاد، لا "مصادر استيراد" وهو
--    اسم مختلف عمدًا عن جدول lesson_sources القائم فعلاً والمخصص لمصادر
--    الزحف الآلي auto-import — تسمية مختلفة تمنع تصادمًا دلاليًا).
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'book' CHECK (source_type IN ('book', 'scholar_verbal', 'fatwa_body', 'website', 'manuscript')),
  citation TEXT NOT NULL,
  url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lesson_citations_lesson ON lesson_citations(lesson_id);

ALTER TABLE lesson_citations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_citations_public_read ON lesson_citations;
CREATE POLICY lesson_citations_public_read ON lesson_citations FOR SELECT USING (
  is_admin() OR EXISTS (SELECT 1 FROM lessons l WHERE l.id = lesson_citations.lesson_id AND l.status = 'approved')
);
DROP POLICY IF EXISTS lesson_citations_admin_write ON lesson_citations;
CREATE POLICY lesson_citations_admin_write ON lesson_citations FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 6) lesson_scholars — علماء إضافيون مرتبطون بالدرس (مراجع علمي/لغوي...) —
--    بجانب lessons.sheikh_id الموجود أصلاً للمعلّم الأساسي، لا بديلًا عنه.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_scholars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  scholar_id UUID NOT NULL REFERENCES sheikhs(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'scientific_reviewer', 'language_reviewer', 'narrator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, scholar_id, role)
);
CREATE INDEX IF NOT EXISTS idx_lesson_scholars_lesson ON lesson_scholars(lesson_id);

ALTER TABLE lesson_scholars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_scholars_public_read ON lesson_scholars;
CREATE POLICY lesson_scholars_public_read ON lesson_scholars FOR SELECT USING (true);
DROP POLICY IF EXISTS lesson_scholars_admin_write ON lesson_scholars;
CREATE POLICY lesson_scholars_admin_write ON lesson_scholars FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 7) lesson_books — ربط الدرس بكتاب حقيقي من المكتبة القائمة (library_items)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  library_item_id UUID REFERENCES library_items(id) ON DELETE SET NULL,
  book_title TEXT NOT NULL,
  chapter_reference TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lesson_books_lesson ON lesson_books(lesson_id);

ALTER TABLE lesson_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lesson_books_public_read ON lesson_books;
CREATE POLICY lesson_books_public_read ON lesson_books FOR SELECT USING (true);
DROP POLICY IF EXISTS lesson_books_admin_write ON lesson_books;
CREATE POLICY lesson_books_admin_write ON lesson_books FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 8) translations — بنية فقط (لا ترجمة آلية غير مراجعة لأي نص ديني)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_table TEXT NOT NULL,
  content_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  locale TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_table, content_id, field_name, locale)
);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS translations_public_read ON translations;
CREATE POLICY translations_public_read ON translations FOR SELECT USING (status = 'published' OR is_admin());
DROP POLICY IF EXISTS translations_admin_write ON translations;
CREATE POLICY translations_admin_write ON translations FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 9) error_reports — يُصلح مرجعًا معطلاً موجودًا فعلاً في src/lib/supabase.ts
--    (adminGetDashboardStats يستعلم عنه، والجدول لم يكن موجودًا في الإنتاج)،
--    ويُوسَّع ليكون عامًا (content_table/content_id) بدل مخصص لنوع واحد —
--    يخدم زر "الإبلاغ عن خطأ" على الدروس والتصنيفات والسلاسل معًا.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_table TEXT NOT NULL DEFAULT 'lessons',
  content_id UUID,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'other' CHECK (report_type IN ('scientific_error', 'technical_error', 'broken_link', 'other')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_content ON error_reports(content_table, content_id);

ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS error_reports_insert_own ON error_reports;
CREATE POLICY error_reports_insert_own ON error_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id OR reporter_id IS NULL);
DROP POLICY IF EXISTS error_reports_admin_all ON error_reports;
CREATE POLICY error_reports_admin_all ON error_reports FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS error_reports_select_own ON error_reports;
CREATE POLICY error_reports_select_own ON error_reports FOR SELECT USING (auth.uid() = reporter_id OR is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 10) item_completion_events — توسعة لدعم دروس المكتبة المستقلة (lessons)
--     بجانب عناصر التعلّم المهيكَلة (learning_items) القائمة، بلا نظام موازٍ.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE item_completion_events ALTER COLUMN learning_item_id DROP NOT NULL;
ALTER TABLE item_completion_events ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_completion_events_lesson ON item_completion_events(lesson_id) WHERE lesson_id IS NOT NULL;

ALTER TABLE item_completion_events DROP CONSTRAINT IF EXISTS completion_events_exactly_one_target;
ALTER TABLE item_completion_events ADD CONSTRAINT completion_events_exactly_one_target CHECK (
  (learning_item_id IS NOT NULL AND lesson_id IS NULL) OR
  (learning_item_id IS NULL AND lesson_id IS NOT NULL)
);
