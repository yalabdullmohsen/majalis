-- =====================================================================
--  سجل محاولات الأسئلة التعليمية — لتحليل نقاط الضعف الشخصية للمستخدم
--  التاريخ: 2026-07-17
--  آمن للتشغيل مرات متعددة (IF NOT EXISTS)
--
--  لا تُخزَّن هنا أي نسبة/تقييم جاهز — فقط الوقائع الخام (محاولة واحدة =
--  صف واحد: صحيحة أم خاطئة، وفي أي تصنيف). أي "أنت ضعيف في كذا" يُحسَب
--  عند الطلب من هذه الوقائع، لا يُخزَّن كحكم جاهز قد يتقادم.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  text NOT NULL,
  question_id  text NOT NULL,
  is_correct   boolean NOT NULL,
  source       text NOT NULL DEFAULT 'section_quiz' CHECK (source IN ('section_quiz', 'team_game')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_cat ON public.quiz_attempts(user_id, category_id);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_attempts_own" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_own" ON public.quiz_attempts
  FOR ALL USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());
