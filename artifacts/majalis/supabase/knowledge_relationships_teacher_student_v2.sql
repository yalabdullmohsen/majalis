-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_relationships_teacher_student_v2.sql
--
-- استكمال دفعة شيخ_تلميذ الأولى (33 علاقة، الجلسة السابعة) — دفعة ثانية
-- من 6 علاقات إضافية اكتُشفت بفحص نصوص bio لكل الـ96 عالماً بحثاً عن
-- عبارات صريحة ("تتلمذ على"، "من شيوخه"، "أخذ عنه") لم تُستغَلّ في
-- الدفعة الأولى. كل زوج تحقَّق منه:
--   • مقروء حرفياً من نص bio الفعلي (لا استنتاج)
--   • غير موجود مسبقاً في الجدول (تحقَّق ببحث SQL مباشر قبل الكتابة)
--   • اتجاه العلاقة (شيخ←تلميذ) مطابق للسياق الزمني/السردي في النص
-- استُبعدت عمداً حالات ذات اتجاه غامض أو "تأثر بفكره" دون لقاء مباشر
-- (مثل ابن عبد الوهاب/ابن تيمية: فارق قرون، تأثر فكري لا تلمذة فعلية)
-- أو علاقة "رواية" عامة غير سردية بوضوح (مثل الأوزاعي/مالك: قائمة رواة
-- عامة بلا سرد واضح للتلمذة).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM knowledge_relationships
    WHERE source_id = 'dhahabi' AND target_id = 'ibn-kathir' AND relationship_type = 'شيخ_تلميذ'
  ) THEN
    RAISE NOTICE 'الدفعة الثانية من شيخ_تلميذ موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO knowledge_relationships (id, source_type, source_id, target_type, target_id, relationship_type, label, is_verified, source_reference)
  VALUES
    (gen_random_uuid(), 'scholar', 'dhahabi', 'scholar', 'ibn-kathir', 'شيخ_تلميذ', 'ابن كثير', true, 'scholars-data.ts bio — قراءة ابن كثير كتاب تاريخ الإسلام على الذهبي'),
    (gen_random_uuid(), 'scholar', 'muslim', 'scholar', 'tirmidhi', 'شيخ_تلميذ', 'الإمام الترمذي', true, 'scholars-data.ts bio — الترمذي: من شيوخه الإمام مسلم'),
    (gen_random_uuid(), 'scholar', 'abu-dawud', 'scholar', 'tirmidhi', 'شيخ_تلميذ', 'الإمام الترمذي', true, 'scholars-data.ts bio — الترمذي: من شيوخه أبو داود السجستاني'),
    (gen_random_uuid(), 'scholar', 'abu-hanifa', 'scholar', 'abu-yusuf', 'شيخ_تلميذ', 'الإمام أبو يوسف', true, 'scholars-data.ts bio — أبو يوسف: تلميذ أبي حنيفة لازمه حتى صار من أخصّ أصحابه'),
    (gen_random_uuid(), 'scholar', 'sufyan-uyayna', 'scholar', 'shafi', 'شيخ_تلميذ', 'الإمام الشافعي', true, 'scholars-data.ts bio — سفيان بن عيينة: أخذ عنه الشافعي'),
    (gen_random_uuid(), 'scholar', 'sufyan-uyayna', 'scholar', 'ahmad', 'شيخ_تلميذ', 'الإمام أحمد', true, 'scholars-data.ts bio — سفيان بن عيينة: أخذ عنه أحمد بن حنبل');

  RAISE NOTICE 'أُدخلت % علاقة شيخ_تلميذ إضافية', (SELECT count(*) FROM knowledge_relationships WHERE relationship_type = 'شيخ_تلميذ');
END $$;
