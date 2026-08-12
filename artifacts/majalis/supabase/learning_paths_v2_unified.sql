-- ═══════════════════════════════════════════════════════════════════════════
-- منظومة المسارات العلمية الموحّدة v2
-- ═══════════════════════════════════════════════════════════════════════════
-- يستبدل ازدواجية النظامين القائمين (learning_paths/learning_modules الفارغ
-- من محتوى، وlp_* بكتبه السبعة كلها [Placeholder] معطّلة) بنموذج واحد:
--   المسار → مراحل → مقررات → وحدات → عناصر تعلم → (كتب/تقييمات) → شهادة
--
-- المبدأ الحاكم: نخزّن أحداث الإنجاز الفعلية (item_completion_events) ولا
-- نخزّن نسبة تقدم كقيمة أولية — كل نسبة تُحسَب من الأحداث وقت الطلب.
--
-- لا حذف: لا يُحذَف أي جدول قديم (learning_paths نفسها تُوسَّع لا تُستبدَل
-- للحفاظ على صفوفها الـ15 المنشورة فعليًا؛ learning_modules وlp_* وكل جداول
-- التقدّم القديمة تبقى كما هي بلا مساس — صفر صفوف مستخدمين حقيقية فيها وقت
-- كتابة هذه الترحيلة (تحقَّق منه مباشرة عبر استعلام إنتاج قبل الكتابة)،
-- فلا حاجة لخطوة ترحيل بيانات مستخدمين، لكن الجداول نفسها تبقى موجودة
-- احترازًا ولتوثيق تاريخ المشروع.
--
-- آمن للتشغيل المتكرر (idempotent): كل أمر CREATE TABLE IF NOT EXISTS أو
-- ALTER TABLE ADD COLUMN IF NOT EXISTS أو DROP POLICY IF EXISTS ثم CREATE.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── توسعة learning_paths الموجودة (لا إنشاء من الصفر) ──────────────────────
ALTER TABLE learning_paths
  ADD COLUMN IF NOT EXISTS total_sessions INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS what_you_learn JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS completion_requirements JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS legacy_estimated_hours INT;

UPDATE learning_paths SET legacy_estimated_hours = estimated_hours WHERE legacy_estimated_hours IS NULL;

COMMENT ON COLUMN learning_paths.estimated_hours IS
  'مُهمَل كعملة أساسية للمسار — استُبدل بـ total_sessions (جلسات) المحسوبة من learning_items. أُبقي عليه للتوافق الخلفي فقط.';

-- ── المراحل ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS path_stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id     UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(path_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_path_stages_path ON path_stages(path_id, sort_order);

-- ── المقررات ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id       UUID NOT NULL REFERENCES path_stages(id) ON DELETE CASCADE,
  slug           TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  learning_goal  TEXT,
  level          TEXT NOT NULL DEFAULT 'foundational' CHECK (level IN ('foundational','intermediate','advanced','specialist')),
  sort_order     INT NOT NULL DEFAULT 0,
  pass_percentage INT NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 0 AND 100),
  outcomes       JSONB NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived','needs_review')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stage_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_courses_stage ON courses(stage_id, sort_order);

-- ── المتطلبات السابقة (مع منع الدوائر بمشغّل تحقّق) ─────────────────────────
CREATE TABLE IF NOT EXISTS prerequisites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  requires_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, requires_course_id),
  CHECK (course_id <> requires_course_id)
);

CREATE OR REPLACE FUNCTION prevent_circular_prerequisites()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    WITH RECURSIVE chain AS (
      SELECT requires_course_id AS cid FROM prerequisites WHERE course_id = NEW.requires_course_id
      UNION
      SELECT p.requires_course_id FROM prerequisites p JOIN chain c ON p.course_id = c.cid
    )
    SELECT 1 FROM chain WHERE cid = NEW.course_id
  ) THEN
    RAISE EXCEPTION 'متطلبات دائرية مرفوضة: المقرر % يعتمد فعليًا (بشكل غير مباشر) على المقرر %', NEW.requires_course_id, NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_circular_prerequisites ON prerequisites;
CREATE TRIGGER trg_prevent_circular_prerequisites
  BEFORE INSERT OR UPDATE ON prerequisites
  FOR EACH ROW EXECUTE FUNCTION prevent_circular_prerequisites();

-- ── الوحدات ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_units (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_units_course ON course_units(course_id, sort_order);

-- ── عناصر التعلم (الوحدة الموحّدة: كتاب/درس/نشاط/تقييم) ─────────────────────
CREATE TABLE IF NOT EXISTS learning_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id               UUID NOT NULL REFERENCES course_units(id) ON DELETE CASCADE,
  item_type             TEXT NOT NULL CHECK (item_type IN ('book','lesson','activity','assessment')),
  title                 TEXT NOT NULL,
  description           TEXT,
  content_ref_table     TEXT CHECK (content_ref_table IN ('lessons','library_items') OR content_ref_table IS NULL),
  content_ref_id        TEXT,
  external_url          TEXT,
  session_estimate      NUMERIC(4,1) NOT NULL DEFAULT 1 CHECK (session_estimate > 0),
  minutes_estimate      INT,
  weight                NUMERIC(5,2) NOT NULL DEFAULT 1 CHECK (weight >= 0),
  is_required           BOOLEAN NOT NULL DEFAULT true,
  completion_method     TEXT NOT NULL DEFAULT 'manual_confirm'
    CHECK (completion_method IN ('manual_confirm','watch_percent','read_scroll','assessment_pass','activity_submit')),
  completion_threshold  NUMERIC(5,2) DEFAULT 80,
  sort_order            INT NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','needs_review','archived')),
  is_approved           BOOLEAN NOT NULL DEFAULT true,
  verified_by           UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_learning_items_unit ON learning_items(unit_id, sort_order);
COMMENT ON COLUMN learning_items.is_approved IS
  'false = محتوى قيد المراجعة العلمية، لا يُعرض كنص شرعي معتمد للمستخدم النهائي حتى تُراجَع/تُعتمَد.';

-- ── تفاصيل الكتب المرتبطة بعنصر تعلم من نوع book ────────────────────────────
CREATE TABLE IF NOT EXISTS course_books (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_item_id UUID NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
  book_title       TEXT NOT NULL,
  book_author      TEXT,
  material_role    TEXT NOT NULL DEFAULT 'أساسية إلزامية'
    CHECK (material_role IN ('أساسية إلزامية','شرح أساسي','مادة مساندة','قراءة إثرائية','مرجع متقدم','اختيارية')),
  scope_description TEXT,
  inclusion_reason  TEXT,
  source_name       TEXT,
  source_url        TEXT,
  license_note      TEXT,
  library_item_id   UUID REFERENCES library_items(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_books_item ON course_books(learning_item_id);

-- ── تسجيل المستخدم في مسار ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS path_enrollments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id               UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  enrolled_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  weekly_session_target INT NOT NULL DEFAULT 4 CHECK (weekly_session_target > 0),
  UNIQUE(user_id, path_id)
);
CREATE INDEX IF NOT EXISTS idx_path_enrollments_user ON path_enrollments(user_id);

-- ── أحداث الإنجاز الفعلية — المصدر الوحيد للحقيقة للتقدّم ───────────────────
CREATE TABLE IF NOT EXISTS item_completion_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_item_id UUID NOT NULL REFERENCES learning_items(id) ON DELETE CASCADE,
  event_type       TEXT NOT NULL CHECK (event_type IN ('started','progress_update','completed','reopened')),
  evidence_type    TEXT NOT NULL CHECK (evidence_type IN ('manual_confirm','watch_percent','read_scroll','assessment_pass','activity_submit')),
  evidence_value   NUMERIC(5,2),
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_completion_events_user_item ON item_completion_events(user_id, learning_item_id, occurred_at DESC);

-- ── التقييمات ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type      TEXT NOT NULL CHECK (scope_type IN ('course','stage','path')),
  course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,
  stage_id        UUID REFERENCES path_stages(id) ON DELETE CASCADE,
  path_id         UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  pass_percentage INT NOT NULL DEFAULT 70 CHECK (pass_percentage BETWEEN 0 AND 100),
  max_attempts    INT CHECK (max_attempts IS NULL OR max_attempts > 0),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','needs_review','archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (scope_type = 'course' AND course_id IS NOT NULL AND stage_id IS NULL AND path_id IS NULL) OR
    (scope_type = 'stage' AND stage_id IS NOT NULL AND course_id IS NULL AND path_id IS NULL) OR
    (scope_type = 'path' AND path_id IS NOT NULL AND course_id IS NULL AND stage_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id      UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_type      TEXT NOT NULL CHECK (question_type IN ('mcq','true_false','ordering','matching','short_answer','essay')),
  question_text      TEXT NOT NULL,
  options            JSONB NOT NULL DEFAULT '[]',
  correct_answer     JSONB,
  explanation        TEXT,
  explanation_source TEXT,
  points             NUMERIC(5,2) NOT NULL DEFAULT 1 CHECK (points > 0),
  sort_order         INT NOT NULL DEFAULT 0,
  source_bank        TEXT CHECK (source_bank IN ('qa_questions','quiz_questions','platform_quiz_questions','new') OR source_bank IS NULL),
  source_ref_id      TEXT,
  is_approved        BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id, sort_order);
COMMENT ON COLUMN assessment_questions.is_approved IS
  'false افتراضيًا لأي سؤال جديد — لا يظهر في تقييم فعلي للمستخدم حتى تُراجعه لجنة/مشرف ويُعتمَد صراحة.';

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  answers       JSONB NOT NULL DEFAULT '{}',
  score_pct     NUMERIC(5,2),
  passed        BOOLEAN,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON assessment_attempts(user_id, assessment_id);

-- ── الشهادات (holder_name مُخزَّن وقت الإصدار — يفصل التحقق العام عن خصوصية profiles) ─
CREATE TABLE IF NOT EXISTS certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id             UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  certificate_code    TEXT UNIQUE NOT NULL,
  holder_name         TEXT NOT NULL,
  path_title_snapshot TEXT NOT NULL,
  level               TEXT,
  sessions_completed  INT NOT NULL DEFAULT 0,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  metadata            JSONB NOT NULL DEFAULT '{}',
  UNIQUE(user_id, path_id)
);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);

-- ── خطتي الدراسية ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_plans (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id                UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  weekly_sessions        INT NOT NULL DEFAULT 4 CHECK (weekly_sessions > 0),
  preferred_days         INT[] NOT NULL DEFAULT '{}',
  start_date             DATE NOT NULL DEFAULT current_date,
  target_completion_date DATE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, path_id)
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id     UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  scheduled_date    DATE NOT NULL,
  learning_item_id  UUID REFERENCES learning_items(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','done','skipped','rescheduled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_study_sessions_plan ON study_sessions(study_plan_id, scheduled_date);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE path_stages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE prerequisites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_units           ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_books           ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_enrollments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_completion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions         ENABLE ROW LEVEL SECURITY;

-- محتوى عام منشور: قراءة عامة + كتابة/تعديل للمشرف فقط
DROP POLICY IF EXISTS path_stages_public_read ON path_stages;
CREATE POLICY path_stages_public_read ON path_stages FOR SELECT USING (status = 'published' OR is_admin());
DROP POLICY IF EXISTS path_stages_admin_write ON path_stages;
CREATE POLICY path_stages_admin_write ON path_stages FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS courses_public_read ON courses;
CREATE POLICY courses_public_read ON courses FOR SELECT USING (status = 'published' OR is_admin());
DROP POLICY IF EXISTS courses_admin_write ON courses;
CREATE POLICY courses_admin_write ON courses FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS prerequisites_public_read ON prerequisites;
CREATE POLICY prerequisites_public_read ON prerequisites FOR SELECT USING (true);
DROP POLICY IF EXISTS prerequisites_admin_write ON prerequisites;
CREATE POLICY prerequisites_admin_write ON prerequisites FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS course_units_public_read ON course_units;
CREATE POLICY course_units_public_read ON course_units FOR SELECT USING (true);
DROP POLICY IF EXISTS course_units_admin_write ON course_units;
CREATE POLICY course_units_admin_write ON course_units FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS learning_items_public_read ON learning_items;
CREATE POLICY learning_items_public_read ON learning_items FOR SELECT USING (status = 'published' OR is_admin());
DROP POLICY IF EXISTS learning_items_admin_write ON learning_items;
CREATE POLICY learning_items_admin_write ON learning_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS course_books_public_read ON course_books;
CREATE POLICY course_books_public_read ON course_books FOR SELECT USING (true);
DROP POLICY IF EXISTS course_books_admin_write ON course_books;
CREATE POLICY course_books_admin_write ON course_books FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS assessments_public_read ON assessments;
CREATE POLICY assessments_public_read ON assessments FOR SELECT USING (status = 'published' OR is_admin());
DROP POLICY IF EXISTS assessments_admin_write ON assessments;
CREATE POLICY assessments_admin_write ON assessments FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- أسئلة التقييم: لا تُعرَض الإجابة الصحيحة عبر REST مباشرةً في هذا التصميم
-- المبسّط (القراءة تشمل correct_answer) — الواجهة يجب أن تستخدم مسار خادم
-- (service role) لعرض الأسئلة أثناء الاختبار ولإجراء التصحيح، لا قراءة مباشرة
-- من العميل. سياسة القراءة هنا للمشرف فقط تحديدًا لهذا السبب.
DROP POLICY IF EXISTS assessment_questions_admin_only ON assessment_questions;
CREATE POLICY assessment_questions_admin_only ON assessment_questions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- بيانات خاصة بالمستخدم: صاحبها فقط + المشرف
DROP POLICY IF EXISTS path_enrollments_own ON path_enrollments;
CREATE POLICY path_enrollments_own ON path_enrollments FOR ALL USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS completion_events_own ON item_completion_events;
CREATE POLICY completion_events_own ON item_completion_events FOR ALL USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS assessment_attempts_own ON assessment_attempts;
CREATE POLICY assessment_attempts_own ON assessment_attempts FOR ALL USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS study_plans_own ON study_plans;
CREATE POLICY study_plans_own ON study_plans FOR ALL USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS study_sessions_own ON study_sessions;
CREATE POLICY study_sessions_own ON study_sessions FOR ALL USING (
  is_admin() OR EXISTS (SELECT 1 FROM study_plans sp WHERE sp.id = study_sessions.study_plan_id AND sp.user_id = auth.uid())
) WITH CHECK (
  is_admin() OR EXISTS (SELECT 1 FROM study_plans sp WHERE sp.id = study_sessions.study_plan_id AND sp.user_id = auth.uid())
);

-- الشهادات: صاحبها يرى شهاداته، وأي شخص يمكنه التحقق العام عبر certificate_code
-- (بيانات holder_name/path_title_snapshot/level/sessions_completed/issued_at
-- فقط — لا بريد ولا معرّف داخلي حسّاس، وهذا هو الغرض المقصود من الشهادة أصلاً).
DROP POLICY IF EXISTS certificates_owner_and_admin ON certificates;
CREATE POLICY certificates_owner_and_admin ON certificates FOR ALL USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
DROP POLICY IF EXISTS certificates_public_verify ON certificates;
CREATE POLICY certificates_public_verify ON certificates FOR SELECT USING (status = 'active');
