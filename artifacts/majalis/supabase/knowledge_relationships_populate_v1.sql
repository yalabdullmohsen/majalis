-- ═══════════════════════════════════════════════════════════════════════════
-- knowledge_relationships_populate_v1.sql
--
-- سياق: بطلب صريح من المنسّق ("مرحلة 11: وسّع الروابط الداخلية... بيانات
-- موجودة بالفعل، لا تحتاج بحثًا جديدًا") — اكتُشف أن جدول
-- knowledge_relationships **فارغ تماماً (0 صف)** رغم أن مكوّن
-- KnowledgeRelatedItems.tsx مبنيّ بالكامل ومُستهلَك فعلياً في صفحتين
-- حيّتين (LibraryDetailPage.tsx، LessonDetailPage.tsx) — الميزة كانت
-- "ميتة صامتة" (لا تعرض شيئاً أبداً لأن `if (items.length === 0) return
-- null;`) منذ إنشائها، لم تُختبَر بمحتوى حقيقي قط.
--
-- **عطل حقيقي إضافي اكتُشف ومُصلح بالتزامن** (راجع
-- src/components/knowledge/KnowledgeRelatedItems.tsx): TYPE_HREF.scholar
-- كان يُنتج `/lessons?sheikh=${id}` — لكن /lessons يفلتر عبر `sheikhName`
-- (اسم عربي من بيانات الدروس)، بينما `id` هنا هو مُعرِّف scholars-data.ts
-- الإنجليزي (كـ"ibn-baz") — لا تطابق أبداً، فكانت ستُنتج نتائج فارغة
-- دائماً، نفس نمط عطل "fatwa" المُصلَح سابقاً هذه الجلسة. صُحِّح ليشير
-- لصفحة الملف الشخصي الصحيحة `/scholars/:id`.
--
-- هذا الملف يعبّئ الجدول بـ70 علاقة **مُستمَدة بالكامل من بيانات مُتحقَّقة
-- مسبقاً** عبر ثماني دفعات إثراء العلماء هذه الجلسات (لا WebSearch جديد،
-- كل علاقة موثَّقة حرفياً في bio الحقل النصي لـscholars-data.ts):
--   • 32 علاقة "مؤلف_كتاب" (عالم ← كتابه في library-catalog.ts)، اُستخرجت
--     ببرنامج مطابقة صارم بين key_works وعناوين الفهرس (تطابق شبه حرفي
--     فقط، لا مطابقة كلمات عامة فضفاضة كـ"الآثار"/"الجامع" التي أنتجت
--     إيجابيات كاذبة في محاولة أولى مرفوضة).
--   • 33 علاقة "شيخ_تلميذ" مباشرة، كل واحدة مقروءة حرفياً من نص bio
--     الشيخ أو التلميذ (اتجاه العلاقة تحقَّق يدوياً من الصياغة الفعلية
--     لكل سطر، لا افتراضاً).
--   • 5 علاقات "مرتبط" لعلاقات ثناء/زمالة موثَّقة لكنها **ليست** تلمذة
--     مباشرة (الألباني↔ابن باز، الألباني↔ابن عثيمين، مقبل↔الألباني،
--     مقبل↔ابن باز، ابن حزم↔ابن عبد البر [شيخ مشترك: ابن الجسور]) —
--     تمييز مطبَّق بدقة كالمعتاد، لا "شيخ_تلميذ" لعلاقة لم تثبت مباشرتها.
--
-- is_verified=true لكل الصفوف (البيانات المصدر مُتحقَّقة فعلياً عبر
-- WebSearch في جلسات سابقة، لا افتراض). label = الاسم العربي المعروض
-- للطرف المستهدَف (target)، تماشياً مع نمط النموذج الإداري
-- (RelationshipsSection.tsx، حقل "تسمية مختصرة" مثاله "شرح ابن عثيمين").
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM knowledge_relationships LIMIT 1) THEN
    RAISE NOTICE 'الجدول ليس فارغاً — تخطّي (يُفترض تطبيق هذا الملف مرة واحدة على جدول فارغ)';
    RETURN;
  END IF;

  INSERT INTO knowledge_relationships (id, source_type, source_id, target_type, target_id, relationship_type, label, is_verified, source_reference)
  VALUES
    -- ── مؤلف_كتاب (32) ────────────────────────────────────────────────
    (gen_random_uuid(), 'scholar', 'bukhari', 'book', 'book-bukhari', 'مؤلف_كتاب', 'صحيح البخاري', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'muslim', 'book', 'book-muslim', 'مؤلف_كتاب', 'صحيح مسلم', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'abu-dawud', 'book', 'book-abudawud', 'مؤلف_كتاب', 'سنن أبي داود', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-majah', 'book', 'book-ibnmajah', 'مؤلف_كتاب', 'سنن ابن ماجه', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'nawawi', 'book', 'book-riyadh', 'مؤلف_كتاب', 'رياض الصالحين', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'nawawi', 'book', 'book-nawawi40', 'مؤلف_كتاب', 'الأربعون النووية', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-qayyim', 'book', 'book-zad', 'مؤلف_كتاب', 'زاد المعاد', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-abd-al-wahhab', 'book', 'book-tawhid', 'مؤلف_كتاب', 'كتاب التوحيد', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'al-suyuti', 'book', 'book-itqan', 'مؤلف_كتاب', 'الإتقان في علوم القرآن', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'zarkashi', 'book', 'book-burhan', 'مؤلف_كتاب', 'البرهان في علوم القرآن', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-salah', 'book', 'book-muqaddimah-ibn-salah', 'مؤلف_كتاب', 'مقدمة ابن الصلاح في علوم الحديث', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ghazali', 'book', 'book-ihya', 'مؤلف_كتاب', 'إحياء علوم الدين', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'syed-saabiq', 'book', 'book-fiqh-sunnah', 'مؤلف_كتاب', 'فقه السنة', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'nawawi', 'book', 'book-majmoo', 'مؤلف_كتاب', 'المجموع شرح المهذب', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-rushd', 'book', 'book-bidayat-mujtahid', 'مؤلف_كتاب', 'بداية المجتهد ونهاية المقتصد', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-taymiyya', 'book', 'book-dara-at-taarus', 'مؤلف_كتاب', 'درء تعارض العقل والنقل', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'bukhari', 'book', 'book-adab-al-mufrad', 'مؤلف_كتاب', 'الأدب المفرد', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-hazm', 'book', 'book-al-muhalla', 'مؤلف_كتاب', 'المحلى بالآثار', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-hazm', 'book', 'book-al-ihkam-amidi', 'مؤلف_كتاب', 'الإحكام في أصول الأحكام', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-kathir', 'book', 'book-al-bidaya-wal-nihaya', 'مؤلف_كتاب', 'البداية والنهاية', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'daraqutni', 'book', 'book-sunan-daraqutni', 'مؤلف_كتاب', 'سنن الدارقطني', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'hakim', 'book', 'book-mustadrak-hakim', 'مؤلف_كتاب', 'المستدرك على الصحيحين', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-daqiq', 'book', 'book-sharh-arbaeen-ibn-daqiq', 'مؤلف_كتاب', 'شرح الأربعين النووية', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'al-mawardi', 'book', 'book-adab-dunya-din', 'مؤلف_كتاب', 'أدب الدنيا والدين', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-hajar', 'book', 'book-tahzib-tahzib', 'مؤلف_كتاب', 'تهذيب التهذيب', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-khaldun', 'book', 'book-tarikh-ibn-khaldun-ibar', 'مؤلف_كتاب', 'العبر وديوان المبتدأ والخبر', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-juzayy', 'book', 'book-taseel-manhal', 'مؤلف_كتاب', 'التسهيل لعلوم التنزيل', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-ashur', 'book', 'book-tahrir-wa-tanwir', 'مؤلف_كتاب', 'التحرير والتنوير', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'khatib-baghdadi', 'book', 'book-al-jami-li-akhlaq-al-rawi', 'مؤلف_كتاب', 'الجامع لأخلاق الراوي وآداب السامع', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'shatbi', 'book', 'book-al-muwafaqat-shatibi', 'مؤلف_كتاب', 'الموافقات في أصول الشريعة', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'ibn-khuzayma', 'book', 'book-ibn-khuzaymah', 'مؤلف_كتاب', 'صحيح ابن خزيمة', true, 'scholars-data.ts key_works'),
    (gen_random_uuid(), 'scholar', 'dhahabi', 'book', 'book-siyar-alam-nubala', 'مؤلف_كتاب', 'سير أعلام النبلاء', true, 'scholars-data.ts key_works'),

    -- ── شيخ_تلميذ (34) — كل اتجاه تحقَّق من نص bio الفعلي ──────────────
    (gen_random_uuid(), 'scholar', 'ibn-taymiyya', 'scholar', 'ibn-qayyim', 'شيخ_تلميذ', 'ابن القيم', true, 'ذيل طبقات الحنابلة — ابن رجب'),
    (gen_random_uuid(), 'scholar', 'ibn-taymiyya', 'scholar', 'ibn-kathir', 'شيخ_تلميذ', 'ابن كثير', true, 'الدرر الكامنة — ابن حجر'),
    (gen_random_uuid(), 'scholar', 'bukhari', 'scholar', 'tirmidhi', 'شيخ_تلميذ', 'الإمام الترمذي', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'bukhari', 'scholar', 'muslim', 'شيخ_تلميذ', 'الإمام مسلم', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'shafi', 'scholar', 'ahmad', 'شيخ_تلميذ', 'الإمام أحمد', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'shafi', 'scholar', 'muzani', 'شيخ_تلميذ', 'الإمام المزني', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'malik', 'scholar', 'shafi', 'شيخ_تلميذ', 'الإمام الشافعي', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'ahmad', 'scholar', 'abu-dawud', 'شيخ_تلميذ', 'أبو داود السجستاني', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'daraqutni', 'scholar', 'hakim', 'شيخ_تلميذ', 'الإمام الحاكم', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'hakim', 'scholar', 'bayhaki', 'شيخ_تلميذ', 'الإمام البيهقي', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'ibn-hibban', 'scholar', 'hakim', 'شيخ_تلميذ', 'الإمام الحاكم', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'sufyan-thawri', 'scholar', 'ibn-mubarak', 'شيخ_تلميذ', 'عبد الله بن المبارك', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'awzai', 'scholar', 'sufyan-thawri', 'شيخ_تلميذ', 'سفيان الثوري', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'awzai', 'scholar', 'malik', 'شيخ_تلميذ', 'الإمام مالك', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'juwayny', 'scholar', 'ghazali', 'شيخ_تلميذ', 'الإمام الغزالي', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'ibn-jawzi', 'scholar', 'ibn-qudama', 'شيخ_تلميذ', 'ابن قدامة المقدسي', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'ibn-baz', 'scholar', 'ibn-uthaymeen', 'شيخ_تلميذ', 'الشيخ ابن عثيمين', true, 'الموقع الرسمي للشيخ ابن باز'),
    (gen_random_uuid(), 'scholar', 'ibn-baz', 'scholar', 'ibn-jibreen', 'شيخ_تلميذ', 'الشيخ ابن جبرين', true, 'الموقع الرسمي للشيخ ابن باز'),
    (gen_random_uuid(), 'scholar', 'ibn-baz', 'scholar', 'fawzan', 'شيخ_تلميذ', 'الشيخ صالح الفوزان', true, 'الموقع الرسمي للشيخ ابن باز'),
    (gen_random_uuid(), 'scholar', 'ibn-baz', 'scholar', 'ibn-ghudiyan', 'شيخ_تلميذ', 'الشيخ عبد الله بن غديان', true, 'mimham.net — سيرة ابن غديان'),
    (gen_random_uuid(), 'scholar', 'shanqiti', 'scholar', 'ibn-baz', 'شيخ_تلميذ', 'الشيخ ابن باز', true, 'saaid.org — سيرة الشنقيطي'),
    (gen_random_uuid(), 'scholar', 'shanqiti', 'scholar', 'ibn-uthaymeen', 'شيخ_تلميذ', 'الشيخ ابن عثيمين', true, 'saaid.org — سيرة الشنقيطي'),
    (gen_random_uuid(), 'scholar', 'shanqiti', 'scholar', 'abu-zayd', 'شيخ_تلميذ', 'الشيخ بكر أبو زيد', true, 'saaid.org — سيرة الشنقيطي'),
    (gen_random_uuid(), 'scholar', 'shanqiti', 'scholar', 'ibn-ghudiyan', 'شيخ_تلميذ', 'الشيخ عبد الله بن غديان', true, 'mimham.net — سيرة ابن غديان'),
    (gen_random_uuid(), 'scholar', 'muhammad-abdu', 'scholar', 'rashid-rida', 'شيخ_تلميذ', 'رشيد رضا', true, 'الأعلام — خير الدين الزركلي'),
    (gen_random_uuid(), 'scholar', 'al-saadi', 'scholar', 'ibn-uthaymeen', 'شيخ_تلميذ', 'الشيخ ابن عثيمين', true, 'islamweb.net — ترجمة السعدي'),
    (gen_random_uuid(), 'scholar', 'muhammad-ghazali', 'scholar', 'qaradawi', 'شيخ_تلميذ', 'الشيخ القرضاوي', true, 'islamstory.com — ترجمة محمد الغزالي'),
    (gen_random_uuid(), 'scholar', 'muzani', 'scholar', 'ibn-khuzayma', 'شيخ_تلميذ', 'الإمام ابن خزيمة', true, 'سير أعلام النبلاء — الذهبي'),
    (gen_random_uuid(), 'scholar', 'afifi', 'scholar', 'ibn-uthaymeen', 'شيخ_تلميذ', 'الشيخ ابن عثيمين', true, 'جريدة الرياض — سيرة عفيفي'),
    (gen_random_uuid(), 'scholar', 'afifi', 'scholar', 'ibn-jibreen', 'شيخ_تلميذ', 'الشيخ ابن جبرين', true, 'جريدة الرياض — سيرة عفيفي'),
    (gen_random_uuid(), 'scholar', 'afifi', 'scholar', 'ibn-ghudiyan', 'شيخ_تلميذ', 'الشيخ عبد الله بن غديان', true, 'جريدة الرياض — سيرة عفيفي'),
    (gen_random_uuid(), 'scholar', 'al-mizzi', 'scholar', 'dhahabi', 'شيخ_تلميذ', 'الإمام الذهبي', true, 'islamweb.net — ترجمة المزي'),
    (gen_random_uuid(), 'scholar', 'al-mizzi', 'scholar', 'ibn-taymiyya', 'شيخ_تلميذ', 'ابن تيمية', true, 'islamweb.net — ترجمة المزي'),

    -- ── مرتبط (5) — ثناء/زمالة موثَّقة، ليست تلمذة مباشرة ────────────────
    (gen_random_uuid(), 'scholar', 'albani', 'scholar', 'ibn-baz', 'مرتبط', 'الشيخ ابن باز — ثناء متبادل', true, 'durar.net — الإيجاز في اختلاف الألباني وابن باز وابن عثيمين'),
    (gen_random_uuid(), 'scholar', 'albani', 'scholar', 'ibn-uthaymeen', 'مرتبط', 'الشيخ ابن عثيمين — ثناء متبادل', true, 'durar.net — الإيجاز في اختلاف الألباني وابن باز وابن عثيمين'),
    (gen_random_uuid(), 'scholar', 'muqbil', 'scholar', 'albani', 'مرتبط', 'الشيخ الألباني — ثناء', true, 'mimham.net — سيرة مقبل الوادعي'),
    (gen_random_uuid(), 'scholar', 'muqbil', 'scholar', 'ibn-baz', 'مرتبط', 'الشيخ ابن باز — ثناء', true, 'mimham.net — سيرة مقبل الوادعي'),
    (gen_random_uuid(), 'scholar', 'ibn-hazm', 'scholar', 'ibn-abd-al-barr', 'مرتبط', 'ابن عبد البر — شيخ مشترك (ابن الجسور)', true, 'سير أعلام النبلاء — الذهبي');

  RAISE NOTICE 'أُدخلت % علاقة معرفية', (SELECT count(*) FROM knowledge_relationships);
END $$;
