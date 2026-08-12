-- ═══════════════════════════════════════════════════════════════════
--  fixes_data_pipeline_complete.sql  (v2 — safe for any existing schema)
--  الصق هذا الملف كاملاً في Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. إصلاح جدول quiz_questions: إضافة الأعمدة المفقودة ─────────────────

ALTER TABLE quiz_questions
  ADD COLUMN IF NOT EXISTS section    TEXT,
  ADD COLUMN IF NOT EXISTS level      TEXT,
  ADD COLUMN IF NOT EXISTS answer     TEXT,
  ADD COLUMN IF NOT EXISTS hint       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_used    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status     TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS category   TEXT;

-- تهيئة answer من correct_answer (فقط إن كان العمود موجوداً)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'correct_answer'
  ) THEN
    UPDATE quiz_questions
       SET answer = correct_answer
     WHERE answer IS NULL AND correct_answer IS NOT NULL;
  END IF;
END;
$$;

-- تهيئة level من difficulty (فقط إن كان العمود موجوداً)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_questions' AND column_name = 'difficulty'
  ) THEN
    UPDATE quiz_questions
       SET level = CASE
         WHEN difficulty = 'easy'   THEN 'beginner'
         WHEN difficulty = 'medium' THEN 'intermediate'
         WHEN difficulty = 'hard'   THEN 'advanced'
         ELSE difficulty
       END
     WHERE level IS NULL;
  END IF;
END;
$$;

-- فهارس
CREATE INDEX IF NOT EXISTS idx_quiz_questions_section ON quiz_questions(section);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_level   ON quiz_questions(level);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_used ON quiz_questions(is_used);

-- ─── 2. مزامنة دروس LESSONS_SEED إلى جدول lessons ──────────────────────────

-- أضف جميع الأعمدة المستخدمة بالـ INSERT إن لم تكن موجودة
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS region       TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS audience     TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS delivery     TEXT DEFAULT 'in-person';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'درس';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_recurring  BOOLEAN DEFAULT true;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'approved';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS schedule     TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS mosque       TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS day_of_week  TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS lesson_time  TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS city         TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS category     TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS speaker_name TEXT;
-- ─── حُذفت كتلة INSERT للدروس (25 صفًّا) في تدقيق ٢٠٢٦-٠٧-٢٦ ───────────────
-- كانت هذه الكتلة تُدرج خمسة وعشرين درسًا حضوريًّا أسبوعيًّا بأسماء مشايخ
-- ومساجد ومواعيد ثابتة، بلا مصدر واحد: لا provider ولا mapUrl ولا liveUrl
-- ولا source_url — وليس منها في `src/lib/lesson-ads.ts` (كتالوج الدروس
-- الموثَّق الذي يحمل لكل درس جهةً ورابطَ موقع/خريطة) إلا درسان، وأحدهما
-- (`othman-sahih-muslim`) يناقض الموثَّق في المسجد واليوم والوقت.
-- ودليل الاصطناع داخليّ: «الشيخ فضل الجماعة» ليس اسم شخص أصلًا (هو عنوان
-- موضوع: فضل صلاة الجماعة)، و«نخبة من المشايخ»/«نخبة من الحفّاظ» نائبٌ عن
-- اسم غائب. وستة من الخمسة والعشرين لم تكن في الجدول الحيّ أصلًا (تنظيف
-- سابق جزئي). حُذفت الصفوف العشرون الباقية من `lessons` مع إشاراتها.
-- المصدر الموثَّق للدروس الحضورية هو `src/lib/lesson-ads.ts` وحده،
-- ويُدمج مع الجدول الحيّ في `src/lib/lessons-service.ts`.

SELECT count(*) AS total_lessons FROM lessons WHERE status = 'approved';

-- ─── 3. أسئلة المسابقة — seed data ──────────────────────────────────────────

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','intermediate','من أول الرسل إلى أهل الأرض بعد آدم؟','نوح عليه السلام','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من أول الرسل إلى أهل الأرض بعد آدم؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','intermediate','من النبي الذي اتخذه الله خليلاً؟','إبراهيم عليه السلام','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من النبي الذي اتخذه الله خليلاً؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','intermediate','كم سنة دعا نوح قومه؟','ألف سنة إلا خمسين عاماً','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم سنة دعا نوح قومه؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','beginner','ما اسم أبي البشر؟','آدم عليه السلام','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'ما اسم أبي البشر؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأنبياء','advanced','من النبي الذي أُوتي ملكاً لا ينبغي لأحد من بعده؟','سليمان عليه السلام','الأنبياء','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من النبي الذي أُوتي ملكاً لا ينبغي لأحد من بعده؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'السيرة','intermediate','في أي عام وُلد النبي ﷺ؟','عام الفيل — 571م','السيرة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'في أي عام وُلد النبي ﷺ؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'السيرة','intermediate','ما اسم أم النبي ﷺ؟','آمنة بنت وهب','السيرة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'ما اسم أم النبي ﷺ؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'السيرة','advanced','كم غزوة شارك فيها النبي ﷺ بنفسه؟','سبع وعشرون غزوة','السيرة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم غزوة شارك فيها النبي ﷺ بنفسه؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'السيرة','beginner','ما اسم أول زوجات النبي ﷺ؟','خديجة بنت خويلد رضي الله عنها','السيرة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'ما اسم أول زوجات النبي ﷺ؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الصحابة','intermediate','من أول من أسلم من الرجال؟','أبو بكر الصديق رضي الله عنه','الصحابة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من أول من أسلم من الرجال؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الصحابة','intermediate','من الصحابي الملقّب بـ"سيف الله المسلول"؟','خالد بن الوليد رضي الله عنه','الصحابة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'من الصحابي الملقّب بـ"سيف الله المسلول"؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الصحابة','advanced','كم عدد العشرة المبشرين بالجنة؟','عشرة صحابة','الصحابة','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم عدد العشرة المبشرين بالجنة؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأحكام','intermediate','كم عدد أركان الإسلام؟','خمسة أركان','الأحكام','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم عدد أركان الإسلام؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأحكام','beginner','كم عدد الصلوات المفروضة يومياً؟','خمس صلوات','الأحكام','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'كم عدد الصلوات المفروضة يومياً؟');

INSERT INTO quiz_questions (section, level, question, answer, category, status, is_used)
SELECT 'الأحكام','advanced','ما نصاب زكاة الذهب بالغرام؟','خمسة وثمانون غراماً تقريباً','الأحكام','published',false
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions WHERE question = 'ما نصاب زكاة الذهب بالغرام؟');

SELECT count(*) AS total_quiz_questions FROM quiz_questions WHERE status = 'published';
