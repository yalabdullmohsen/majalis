-- =====================================================================
--  أيام الأسبوع ومعانيها وأحداثها — جدولان جديدان
--  التاريخ: 2026-07-17
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS)
--
--  قاعدة حاكمة صريحة من المالك: لا يُفترض أن لكل يوم فضيلة شرعية خاصة،
--  ولا يُنشر أي سطر إلا بعد المرور بحالة review_status='verified' ثم
--  'published' صراحة (لا نشر تلقائي عند الإدراج). التمييز إلزامي بين
--  أربعة أنواع معلومة (info_type) — لا يُخلَط بينها بصريًا ولا بيانيًا.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.week_day_facts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week   text NOT NULL CHECK (day_of_week IN ('sat','sun','mon','tue','wed','thu','fri')),
  info_type     text NOT NULL CHECK (info_type IN (
                  'recurring_virtue',        -- فضيلة شرعية متكررة (كل أسبوع)
                  'historical_event',        -- حادثة وقعت مرة واحدة في تاريخ يوافق هذا اليوم
                  'organizational_suggestion' -- اقتراح تربوي/تنظيمي من فريق المنصة، ليس نصًا شرعيًا
                )),
  title         text NOT NULL,
  body          text NOT NULL,
  source_text   text,   -- نص المصدر الأصلي (الحديث/الأثر) كما ورد
  reference     text,   -- الكتاب ورقم الحديث، مثل: "صحيح مسلم، رقم 854"
  grade         text CHECK (grade IN ('صحيح','حسن','ضعيف','لا ينطبق') OR grade IS NULL),
  verified_by   text,   -- اسم المراجع الشرعي أو الجهة
  review_status text NOT NULL DEFAULT 'draft' CHECK (review_status IN (
                  'draft','needs_source','in_review','verified',
                  'needs_completion','published','rejected','archived'
                )),
  editor_notes  text,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_week_day_facts_day ON public.week_day_facts(day_of_week, review_status);

ALTER TABLE public.week_day_facts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "week_day_facts_public_read" ON public.week_day_facts;
CREATE POLICY "week_day_facts_public_read" ON public.week_day_facts
  FOR SELECT USING (review_status = 'published');
DROP POLICY IF EXISTS "week_day_facts_admin_all" ON public.week_day_facts;
CREATE POLICY "week_day_facts_admin_all" ON public.week_day_facts
  FOR ALL USING (is_admin() OR auth.role() = 'service_role')
  WITH CHECK (is_admin() OR auth.role() = 'service_role');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_week_day_facts_updated_at ON public.week_day_facts;
    CREATE TRIGGER trg_week_day_facts_updated_at
      BEFORE UPDATE ON public.week_day_facts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── خطة المستخدم المتكرّرة لكل يوم أسبوع (مختلفة عن user_weekly_plans
--    الموجود مسبقًا، وهو مرتبط بأسبوع تقويمي محدَّد بـweek_start، لا بيوم
--    أسبوع متكرّر) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_weekday_plans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week  text NOT NULL CHECK (day_of_week IN ('sat','sun','mon','tue','wed','thu','fri')),
  tasks        jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_of_week)
);

ALTER TABLE public.user_weekday_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_weekday_plans_own" ON public.user_weekday_plans;
CREATE POLICY "user_weekday_plans_own" ON public.user_weekday_plans
  FOR ALL USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_user_weekday_plans_updated_at ON public.user_weekday_plans;
    CREATE TRIGGER trg_user_weekday_plans_updated_at
      BEFORE UPDATE ON public.user_weekday_plans
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
