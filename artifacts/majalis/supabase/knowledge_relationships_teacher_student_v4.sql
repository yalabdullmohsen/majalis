-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_relationships_teacher_student_v4.sql
--
-- دفعة رابعة من علاقات شيخ_تلميذ (4 علاقات) اكتُشفت أثناء الدفعة العاشرة
-- لإثراء العلماء (ibn-juzayy، bint-al-shati، abu-zayd، ibn-hajar-haytami،
-- ali-tantawi، ibn-muflih، ibn-nujaym، al-amir-al-sanani) — كل زوج
-- تحقَّق منه عبر WebFetch مباشرة من ويكيبيديا العربية، وتحقَّق أن كلا
-- المعرِّفين موجودان فعلاً في scholars-data.ts وأن الزوج غير موجود
-- مسبقاً في الجدول (بحث SQL مباشر قبل الإدراج).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM knowledge_relationships
    WHERE source_id = 'ibn-taymiyya' AND target_id = 'ibn-muflih' AND relationship_type = 'شيخ_تلميذ'
  ) THEN
    RAISE NOTICE 'الدفعة الرابعة من شيخ_تلميذ موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO knowledge_relationships (id, source_type, source_id, target_type, target_id, relationship_type, label, is_verified, source_reference)
  VALUES
    (gen_random_uuid(), 'scholar', 'ibn-taymiyya', 'scholar', 'ibn-muflih', 'شيخ_تلميذ', 'ابن مفلح', true, 'scholars-data.ts bio — ابن مفلح: من أبرز أصحاب ابن تيمية، تعلَّم عليه'),
    (gen_random_uuid(), 'scholar', 'al-mizzi', 'scholar', 'ibn-muflih', 'شيخ_تلميذ', 'ابن مفلح', true, 'scholars-data.ts bio — ابن مفلح: تعلَّم على جمال الدين المزي'),
    (gen_random_uuid(), 'scholar', 'dhahabi', 'scholar', 'ibn-muflih', 'شيخ_تلميذ', 'ابن مفلح', true, 'scholars-data.ts bio — ابن مفلح: تعلَّم على شمس الدين الذهبي'),
    (gen_random_uuid(), 'scholar', 'ibn-baz', 'scholar', 'abu-zayd', 'شيخ_تلميذ', 'بكر أبو زيد', true, 'scholars-data.ts bio — بكر أبو زيد: لازم الشيخ ابن باز وقرأ عليه عدداً من الرسائل');
  -- ملاحظة: shanqiti→abu-zayd كانت موجودة مسبقاً في الجدول (اكتُشف من رسالة خطأ duplicate key)، لم تُعَد إضافتها

  RAISE NOTICE 'أُدخلت % علاقة شيخ_تلميذ إجمالاً', (SELECT count(*) FROM knowledge_relationships WHERE relationship_type = 'شيخ_تلميذ');
END $$;
