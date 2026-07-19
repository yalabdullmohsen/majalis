-- ═══════════════════════════════════════════════════════════════
-- قسم «التعريف بالإسلام» — نماذج البيانات الكاملة
-- يتبع نفس اصطلاحات المشروع القائمة: SQL خام (لا Drizzle — غير
-- مستخدَم في هذا المشروع إطلاقًا)، RLS مع is_admin()، حوكمة محتوى
-- عبر lib/governance (status + is_approved/verified_by صراحةً كما
-- طلب التكليف). لا نشر تلقائي لأي محتوى ديني — status='published'
-- AND is_approved=true كلاهما شرط للظهور العام.
-- ═══════════════════════════════════════════════════════════════

-- 1) التصنيفات
CREATE TABLE IF NOT EXISTS dawah_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- حالة الحوكمة المشتركة لكل جداول المحتوى الدعوي (نفس مفردات
-- lib/governance/config.mjs's LIFECYCLE_STAGES بالضبط)
-- draft → editorial_review → scientific_review → translation_review
-- → approved → published → archived

-- 2) المقالات
CREATE TABLE IF NOT EXISTS dawah_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES dawah_categories(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  summary_ar TEXT,
  summary_en TEXT,
  body_ar TEXT NOT NULL,
  body_en TEXT,
  cover_image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','editorial_review','scientific_review','translation_review','approved','published','archived')),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) الأسئلة والأجوبة
CREATE TABLE IF NOT EXISTS dawah_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES dawah_categories(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_answer TEXT NOT NULL,
  detailed_answer TEXT NOT NULL,
  -- كل دليل: {type: "quran"|"hadith", ref: "البقرة:٢٥٥" أو "رواه البخاري، كتاب...، رقم...",
  --            grading: "صحيح" (إلزامي لكل حديث), text: "نص الدليل"}
  evidences JSONB NOT NULL DEFAULT '[]',
  glossary_terms JSONB NOT NULL DEFAULT '[]', -- [{term, definition}]
  sources JSONB NOT NULL DEFAULT '[]', -- [{title, author, url?}]
  related_question_ids UUID[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','editorial_review','scientific_review','translation_review','approved','published','archived')),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  search_count INTEGER NOT NULL DEFAULT 0,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) الشبهات والتفنيدات (بنية الشبهة الكاملة — 11 عنصرًا كما في التكليف)
CREATE TABLE IF NOT EXISTS dawah_shubuhat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES dawah_categories(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  complexity_level TEXT NOT NULL DEFAULT 'intermediate' CHECK (complexity_level IN ('basic','intermediate','advanced')),
  shubha_text TEXT NOT NULL,               -- 1) نص الشبهة بصياغتها الحقيقية
  why_spread TEXT,                          -- 2) سبب انتشارها
  short_answer TEXT NOT NULL,               -- 3) الجواب المختصر
  detailed_refutation TEXT NOT NULL,        -- 4) التفنيد المفصل
  assumption_correction TEXT,               -- 5) تصحيح الافتراضات
  historical_linguistic_context TEXT,       -- 6) السياق التاريخي/اللغوي
  evidences JSONB NOT NULL DEFAULT '[]',    -- 7) الأدلة (نفس بنية evidences في الأسئلة)
  sources JSONB NOT NULL DEFAULT '[]',      -- 7) المصادر
  objections_and_responses JSONB NOT NULL DEFAULT '[]', -- 8) [{objection, response}]
  conclusion TEXT,                          -- 9) الخلاصة
  related_ids JSONB NOT NULL DEFAULT '[]',  -- 10) مواد ذات صلة {type, id}
  -- complexity_level = 11) مستوى التعقيد
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','editorial_review','scientific_review','translation_review','approved','published','archived')),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) الترجمات (لكل مادة/لغة) — لا نشر ترجمة آلية قبل مراجعة بشرية
CREATE TABLE IF NOT EXISTS dawah_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('article','question','shubha')),
  entity_id UUID NOT NULL,
  lang TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','approved')),
  is_machine_generated BOOLEAN NOT NULL DEFAULT false,
  translator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, lang)
);
CREATE INDEX IF NOT EXISTS dawah_translations_entity_idx ON dawah_translations(entity_type, entity_id);

-- 6) طلبات التواصل مع داعية — خصوصية صارمة، لا SELECT عام إطلاقًا
CREATE TABLE IF NOT EXISTS dawah_contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  lang TEXT NOT NULL DEFAULT 'ar',
  preferred_daee_gender TEXT CHECK (preferred_daee_gender IN ('male','female','no_preference')),
  country TEXT,
  timezone TEXT,
  topic TEXT NOT NULL,
  contact_method TEXT NOT NULL, -- email/whatsapp/phone — نص القيمة نفسها لا تُعرَض علنًا لأحد
  contact_value TEXT NOT NULL,
  privacy_consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','in_progress','responded','closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- 7) مسار المسلم الجديد (قابل للتمديد لـ90 يومًا بمجرد إضافة صفوف —
-- لا تعديل بنية) + تقدّم المستخدم
CREATE TABLE IF NOT EXISTS new_muslim_path (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all','men','women')),
  title TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','editorial_review','scientific_review','translation_review','approved','published','archived')),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (day_number, audience)
);

CREATE TABLE IF NOT EXISTS new_muslim_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE (user_id, day_number)
);

-- ── فهارس بحث ──
CREATE INDEX IF NOT EXISTS dawah_articles_status_idx ON dawah_articles(status, is_approved);
CREATE INDEX IF NOT EXISTS dawah_questions_status_idx ON dawah_questions(status, is_approved);
CREATE INDEX IF NOT EXISTS dawah_questions_keywords_idx ON dawah_questions USING GIN(keywords);
CREATE INDEX IF NOT EXISTS dawah_shubuhat_status_idx ON dawah_shubuhat(status, is_approved);
CREATE INDEX IF NOT EXISTS dawah_contact_requests_status_idx ON dawah_contact_requests(status, created_at DESC);

-- ── RLS: نفس اصطلاح is_admin() القائم فعليًا في المشروع ──
ALTER TABLE dawah_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dawah_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dawah_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dawah_shubuhat ENABLE ROW LEVEL SECURITY;
ALTER TABLE dawah_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dawah_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_muslim_path ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_muslim_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dawah_categories_public_read ON dawah_categories;
CREATE POLICY dawah_categories_public_read ON dawah_categories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS dawah_categories_admin_write ON dawah_categories;
CREATE POLICY dawah_categories_admin_write ON dawah_categories FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

DROP POLICY IF EXISTS dawah_articles_public_read ON dawah_articles;
CREATE POLICY dawah_articles_public_read ON dawah_articles FOR SELECT USING (status = 'published' AND is_approved = true);
DROP POLICY IF EXISTS dawah_articles_admin_all ON dawah_articles;
CREATE POLICY dawah_articles_admin_all ON dawah_articles FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

DROP POLICY IF EXISTS dawah_questions_public_read ON dawah_questions;
CREATE POLICY dawah_questions_public_read ON dawah_questions FOR SELECT USING (status = 'published' AND is_approved = true);
DROP POLICY IF EXISTS dawah_questions_admin_all ON dawah_questions;
CREATE POLICY dawah_questions_admin_all ON dawah_questions FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

DROP POLICY IF EXISTS dawah_shubuhat_public_read ON dawah_shubuhat;
CREATE POLICY dawah_shubuhat_public_read ON dawah_shubuhat FOR SELECT USING (status = 'published' AND is_approved = true);
DROP POLICY IF EXISTS dawah_shubuhat_admin_all ON dawah_shubuhat;
CREATE POLICY dawah_shubuhat_admin_all ON dawah_shubuhat FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

DROP POLICY IF EXISTS dawah_translations_public_read ON dawah_translations;
CREATE POLICY dawah_translations_public_read ON dawah_translations FOR SELECT USING (status = 'approved');
DROP POLICY IF EXISTS dawah_translations_admin_all ON dawah_translations;
CREATE POLICY dawah_translations_admin_all ON dawah_translations FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- طلبات التواصل: إدخال عام (نموذج الاتصال)، لا قراءة عامة إطلاقًا
DROP POLICY IF EXISTS dawah_contact_public_insert ON dawah_contact_requests;
CREATE POLICY dawah_contact_public_insert ON dawah_contact_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS dawah_contact_admin_all ON dawah_contact_requests;
CREATE POLICY dawah_contact_admin_all ON dawah_contact_requests FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

DROP POLICY IF EXISTS new_muslim_path_public_read ON new_muslim_path;
CREATE POLICY new_muslim_path_public_read ON new_muslim_path FOR SELECT USING (status = 'published' AND is_approved = true AND is_active = true);
DROP POLICY IF EXISTS new_muslim_path_admin_all ON new_muslim_path;
CREATE POLICY new_muslim_path_admin_all ON new_muslim_path FOR ALL USING (auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.role() = 'service_role' OR is_admin());

DROP POLICY IF EXISTS new_muslim_progress_own ON new_muslim_progress;
CREATE POLICY new_muslim_progress_own ON new_muslim_progress FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role' OR is_admin()) WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR is_admin());

-- ── التصنيفات الأولية (المرحلة 1 — القائمة الكاملة من التكليف) ──
INSERT INTO dawah_categories (slug, name_ar, sort_order) VALUES
  ('god-existence', 'الله والوجود', 1),
  ('purpose-of-life', 'الغاية من الحياة', 2),
  ('prophethood', 'النبوة', 3),
  ('quran', 'القرآن', 4),
  ('worship', 'العبادات', 5),
  ('ethics', 'الأخلاق', 6),
  ('women-family', 'المرأة والأسرة', 7),
  ('freedom-human-rights', 'الحرية وحقوق الإنسان', 8),
  ('science-religion', 'العلم والدين', 9),
  ('qadar', 'القضاء والقدر', 10),
  ('evil-suffering', 'الشر والألم', 11),
  ('sharia', 'الشريعة', 12),
  ('jihad', 'الجهاد', 13),
  ('relations-non-muslims', 'العلاقات مع غير المسلمين', 14),
  ('islamic-history', 'التاريخ الإسلامي', 15),
  ('entering-islam', 'الدخول في الإسلام', 16),
  ('new-muslim', 'المسلم الجديد', 17)
ON CONFLICT (slug) DO NOTHING;
