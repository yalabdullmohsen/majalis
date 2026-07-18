-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_relationships_teacher_student_v5.sql
--
-- دفعة خامسة من علاقات شيخ_تلميذ (7 علاقات) اكتُشفت أثناء الدفعة الحادية
-- عشرة لإثراء العلماء (ibn-daqiq، al-qarafi، ibn-al-mundhir، khattabi،
-- ibn-faris، zarkashi، al-mundhiri، ibn-al-wazir) — كل زوج تحقَّق منه عبر
-- WebFetch من ويكيبيديا العربية، وتحقَّق أن كلا المعرِّفين موجودان فعلاً
-- في scholars-data.ts وأن الزوج غير موجود مسبقاً في الجدول (بحث SQL
-- مباشر قبل الإدراج).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM knowledge_relationships
    WHERE source_id = 'al-mundhiri' AND target_id = 'ibn-daqiq' AND relationship_type = 'شيخ_تلميذ'
  ) THEN
    RAISE NOTICE 'الدفعة الخامسة من شيخ_تلميذ موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO knowledge_relationships (id, source_type, source_id, target_type, target_id, relationship_type, label, is_verified, source_reference)
  VALUES
    (gen_random_uuid(), 'scholar', 'al-mundhiri', 'scholar', 'ibn-daqiq', 'شيخ_تلميذ', 'ابن دقيق العيد', true, 'scholars-data.ts bio — ابن دقيق العيد: تتلمذ على الحافظ المنذري'),
    (gen_random_uuid(), 'scholar', 'ibn-daqiq', 'scholar', 'dhahabi', 'شيخ_تلميذ', 'الحافظ الذهبي', true, 'scholars-data.ts bio — ابن دقيق العيد: من أبرز تلاميذه الحافظ الذهبي'),
    (gen_random_uuid(), 'scholar', 'izz-ibn-abd-al-salam', 'scholar', 'al-qarafi', 'شيخ_تلميذ', 'الإمام القرافي', true, 'scholars-data.ts bio — القرافي: تتلمذ على العز بن عبد السلام'),
    (gen_random_uuid(), 'scholar', 'al-mundhiri', 'scholar', 'al-qarafi', 'شيخ_تلميذ', 'الإمام القرافي', true, 'scholars-data.ts bio — القرافي: تتلمذ على الحافظ المنذري'),
    (gen_random_uuid(), 'scholar', 'bukhari', 'scholar', 'ibn-al-mundhir', 'شيخ_تلميذ', 'ابن المنذر', true, 'scholars-data.ts bio — ابن المنذر: أخذ العلم عن الإمام البخاري'),
    (gen_random_uuid(), 'scholar', 'tirmidhi', 'scholar', 'ibn-al-mundhir', 'شيخ_تلميذ', 'ابن المنذر', true, 'scholars-data.ts bio — ابن المنذر: أخذ العلم عن أبي عيسى الترمذي'),
    (gen_random_uuid(), 'scholar', 'khattabi', 'scholar', 'hakim', 'شيخ_تلميذ', 'الحاكم النيسابوري', true, 'scholars-data.ts bio — الخطابي: روى عنه الحاكم النيسابوري');

  RAISE NOTICE 'أُدخلت % علاقة شيخ_تلميذ إجمالاً', (SELECT count(*) FROM knowledge_relationships WHERE relationship_type = 'شيخ_تلميذ');
END $$;
