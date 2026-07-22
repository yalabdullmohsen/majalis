-- ═══════════════════════════════════════════════════════════════════════════
--  اختبار التسميع بالذكاء الاصطناعي — v2: توسعة قيود CHECK لأوضاع أُضيفت لاحقًا
--
--  ثلاث فجوات من نفس الفئة، اكتُشفت جميعًا بمراجعة مباشرة لـ
--  quran_recitation_ai_test_v1.sql (لا افتراضًا):
--
--  1. recitation_sessions.mode CHECK لا يشمل 'freeform' — رغم أن الوضع
--     مبني ومُستخدَم فعليًا في RecitationTestPage.tsx (موثَّق بتعليق تحذيري
--     في recitation-session-service.ts حول هذه الفجوة تحديدًا).
--  2. recitation_sessions.alert_level CHECK لا يشمل 'teacher' — الوضع
--     الجديد "المعلّم الحقيقي" (يوقف الجلسة فعليًا عند خطأ مؤكَّد حتى
--     إعادة صحيحة من نفس الموضع).
--  3. recitation_settings.reveal_granularity CHECK لا يشمل 'page' — وضع
--     "إخفاء الصفحة" (لا كشف كلمات إطلاقًا، تظليل الآية المُسمَّعة الدائم
--     وحده مؤشر التقدّم).
--
--  الأثر بدون هذه الهجرة (موثَّق فعليًا في recitation-session-service.ts):
--  فشل صامت لحفظ الجلسة في قاعدة البيانات فقط (saveRecitationSession
--  تُعيد null وتُسجِّل console.error) — الجلسة الحيّة نفسها (الاستماع
--  والمحاذاة والتقرير على الشاشة) تعمل بصدق دون أي اعتماد على نجاح الحفظ.
--
--  هجرة إضافية بحتة، آمنة للتشغيل أكثر من مرة (تبحث عن كل قيد ديناميكيًا
--  بمحتوى تعريفه لا باسمه المفترَض).
--  ⚠️ لا تُشغَّل تلقائيًا من هذه الجلسة — تحتاج تشغيلًا يدويًا من المالك.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT pgc.conname
    FROM pg_constraint pgc
    JOIN pg_class rel ON rel.oid = pgc.conrelid
    WHERE rel.relname = 'recitation_sessions'
      AND pgc.contype = 'c'
      AND pg_get_constraintdef(pgc.oid) LIKE '%mode%IN%'
      AND pg_get_constraintdef(pgc.oid) LIKE '%full_hide%'
  LOOP
    EXECUTE format('ALTER TABLE recitation_sessions DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE recitation_sessions
  ADD CONSTRAINT recitation_sessions_mode_check
  CHECK (mode IN ('full_hide','assisted','word_follow','interactive_mushaf','teacher_test','freeform'));

DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT pgc.conname
    FROM pg_constraint pgc
    JOIN pg_class rel ON rel.oid = pgc.conrelid
    WHERE rel.relname = 'recitation_sessions'
      AND pgc.contype = 'c'
      AND pg_get_constraintdef(pgc.oid) LIKE '%alert_level%'
  LOOP
    EXECUTE format('ALTER TABLE recitation_sessions DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE recitation_sessions
  ADD CONSTRAINT recitation_sessions_alert_level_check
  CHECK (alert_level IN ('gentle','medium','immediate','teacher'));

DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT pgc.conname
    FROM pg_constraint pgc
    JOIN pg_class rel ON rel.oid = pgc.conrelid
    WHERE rel.relname = 'recitation_settings'
      AND pgc.contype = 'c'
      AND pg_get_constraintdef(pgc.oid) LIKE '%reveal_granularity%'
  LOOP
    EXECUTE format('ALTER TABLE recitation_settings DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE recitation_settings
  ADD CONSTRAINT recitation_settings_reveal_granularity_check
  CHECK (reveal_granularity IN ('word','ayah','page'));
