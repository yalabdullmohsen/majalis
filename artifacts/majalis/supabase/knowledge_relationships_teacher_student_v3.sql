-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_relationships_teacher_student_v3.sql
--
-- دفعة ثالثة من علاقات شيخ_تلميذ (4 علاقات) اكتُشفت أثناء الدفعة التاسعة
-- لإثراء العلماء (izz-ibn-abd-al-salam، ibn-badis، laith-ibn-sad،
-- ibn-asakir، al-mawardi، fakhr-razi، ibn-abi-shaybah، sufyan-uyayna) —
-- كل زوج تحقَّق منه عبر WebFetch مباشرة من ويكيبيديا العربية (بعد نفاد
-- رصيد WebSearch)، وتحقَّق أن كلا المعرِّفين موجودان فعلاً في
-- scholars-data.ts وأن الزوج غير موجود مسبقاً في الجدول (بحث SQL مباشر
-- قبل الإدراج). استُبعدت عمداً حالات لا يوجد لها معرِّف مطابق في الفهرس
-- (شيوخ/تلاميذ غير مُفهرَسين كسجل مستقل، مثل شيوخ الرازي وتلاميذ ابن
-- عساكر وابن باديس ومعظم شيوخ/تلاميذ الماوردي).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM knowledge_relationships
    WHERE source_id = 'izz-ibn-abd-al-salam' AND target_id = 'ibn-daqiq' AND relationship_type = 'شيخ_تلميذ'
  ) THEN
    RAISE NOTICE 'الدفعة الثالثة من شيخ_تلميذ موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO knowledge_relationships (id, source_type, source_id, target_type, target_id, relationship_type, label, is_verified, source_reference)
  VALUES
    (gen_random_uuid(), 'scholar', 'izz-ibn-abd-al-salam', 'scholar', 'ibn-daqiq', 'شيخ_تلميذ', 'ابن دقيق العيد', true, 'scholars-data.ts bio — العز بن عبد السلام: من أبرز تلاميذه ابن دقيق العيد الذي لقّبه بسلطان العلماء'),
    (gen_random_uuid(), 'scholar', 'laith-ibn-sad', 'scholar', 'shafi', 'شيخ_تلميذ', 'الإمام الشافعي', true, 'scholars-data.ts bio — الليث بن سعد: روى عنه الإمام الشافعي الذي أدركه في مصر'),
    (gen_random_uuid(), 'scholar', 'ibn-ashur', 'scholar', 'ibn-badis', 'شيخ_تلميذ', 'عبد الحميد بن باديس', true, 'scholars-data.ts bio — عبد الحميد بن باديس: درس في جامع الزيتونة على محمد الطاهر بن عاشور'),
    (gen_random_uuid(), 'scholar', 'sufyan-uyayna', 'scholar', 'ibn-abi-shaybah', 'شيخ_تلميذ', 'ابن أبي شيبة', true, 'scholars-data.ts bio — ابن أبي شيبة: أخذ الحديث عن سفيان بن عيينة');

  RAISE NOTICE 'أُدخلت % علاقة شيخ_تلميذ إجمالاً', (SELECT count(*) FROM knowledge_relationships WHERE relationship_type = 'شيخ_تلميذ');
END $$;
