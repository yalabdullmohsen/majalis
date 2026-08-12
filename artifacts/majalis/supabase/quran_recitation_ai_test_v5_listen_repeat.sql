-- ═══════════════════════════════════════════════════════════════════════════
--  اختبار التسميع بالذكاء الاصطناعي — v5: إضافة وضع listen_repeat لقيد mode
--
--  الوضع "استماع ثم تكرار" موجود في RecitationMode وواجهة RecitationTestPage
--  منذ جولة إعادة البناء، وكان يُحفَظ كـword_follow لتفادي رفض CHECK.
--  هذه الهجرة توسّع القيد ليشمل listen_repeat صراحةً.
--
--  آمنة للتشغيل أكثر من مرة (Drop dynamic + ADD CONSTRAINT).
--  ⚠️ تحتاج تشغيلًا يدويًا في Supabase SQL Editor إن لم تُطبَّق بعد.
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
  CHECK (mode IN (
    'full_hide',
    'assisted',
    'word_follow',
    'interactive_mushaf',
    'teacher_test',
    'freeform',
    'listen_repeat'
  ));
