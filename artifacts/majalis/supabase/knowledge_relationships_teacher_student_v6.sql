-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_relationships_teacher_student_v6.sql
--
-- دفعة سادسة (وأخيرة لهذه الحملة) من علاقات شيخ_تلميذ (2 علاقة) اكتُشفت
-- أثناء الدفعة الثانية عشرة لإثراء العلماء — الدفعة التي أكملت إثراء
-- جميع الـ96 عالماً (sources لم تعد فارغة لأي عالم). كل زوج تحقَّق منه
-- عبر WebFetch من ويكيبيديا العربية، وتحقَّق أن كلا المعرِّفين موجودان
-- فعلاً وأن الزوج غير موجود مسبقاً في الجدول.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM knowledge_relationships
    WHERE source_id = 'khatib-baghdadi' AND target_id = 'ibn-aqil' AND relationship_type = 'شيخ_تلميذ'
  ) THEN
    RAISE NOTICE 'الدفعة السادسة من شيخ_تلميذ موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO knowledge_relationships (id, source_type, source_id, target_type, target_id, relationship_type, label, is_verified, source_reference)
  VALUES
    (gen_random_uuid(), 'scholar', 'khatib-baghdadi', 'scholar', 'ibn-aqil', 'شيخ_تلميذ', 'ابن عقيل الحنبلي', true, 'scholars-data.ts bio — ابن عقيل: تلقى العلم عن الخطيب البغدادي'),
    (gen_random_uuid(), 'scholar', 'ibn-hajar', 'scholar', 'al-sakhawi', 'شيخ_تلميذ', 'السخاوي', true, 'scholars-data.ts bio — السخاوي: تلميذ الحافظ ابن حجر العسقلاني المباشر لازمه أشد الملازمة');

  RAISE NOTICE 'أُدخلت % علاقة شيخ_تلميذ إجمالاً', (SELECT count(*) FROM knowledge_relationships WHERE relationship_type = 'شيخ_تلميذ');
END $$;
