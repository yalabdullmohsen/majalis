-- ═══════════════════════════════════════════════════════════════════════════
-- زرع شجرة التصنيفات المرجعية الكاملة (25 بابًا رئيسيًا) — بيانات هيكلية فقط
-- (عناوين وتصنيف وبنية شجرية) لا نص شرعي مولَّد — كل شيء draft افتراضيًا ثم
-- يُنشَر صراحة فقط ما يغطيه محتوى حقيقي موجود فعلاً في نهاية الملف.
-- Idempotent بالكامل: يمكن إعادة تشغيله بأمان (ON CONFLICT DO NOTHING على
-- slug الفريد، فلا يكرر تصنيفًا ولا يطيح بتعديلات الأدمن اللاحقة على الحالة).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION _seed_cat(
  p_parent_slug TEXT, p_slug TEXT, p_name TEXT, p_sort INT DEFAULT 0, p_desc TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE v_parent_id UUID;
BEGIN
  IF p_parent_slug IS NOT NULL THEN
    SELECT id INTO v_parent_id FROM categories WHERE slug = p_parent_slug;
  END IF;
  INSERT INTO categories (parent_id, slug, name, description, sort_order, status)
  VALUES (v_parent_id, p_slug, p_name, p_desc, p_sort, 'draft')
  ON CONFLICT (slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ═══ 1. القرآن الكريم وعلومه ═══
SELECT _seed_cat(NULL, 'quran-uloom', 'القرآن الكريم وعلومه', 1);
SELECT _seed_cat('quran-uloom', 'tilawah', 'التلاوة', 1);
SELECT _seed_cat('quran-uloom', 'tajweed', 'التجويد', 2);
SELECT _seed_cat('quran-uloom', 'hifz-murajaah', 'الحفظ والمراجعة', 3);
SELECT _seed_cat('quran-uloom', 'tafseer', 'التفسير', 4);
SELECT _seed_cat('quran-uloom', 'usul-tafseer', 'أصول التفسير', 5);
SELECT _seed_cat('quran-uloom', 'uloom-quran-branch', 'علوم القرآن', 6);
SELECT _seed_cat('quran-uloom', 'asbab-nuzul', 'أسباب النزول', 7);
SELECT _seed_cat('quran-uloom', 'nasikh-mansukh', 'الناسخ والمنسوخ', 8);
SELECT _seed_cat('quran-uloom', 'makki-madani', 'المكي والمدني', 9);
SELECT _seed_cat('quran-uloom', 'jam-quran', 'جمع القرآن', 10);
SELECT _seed_cat('quran-uloom', 'qiraat', 'القراءات', 11);
SELECT _seed_cat('quran-uloom', 'waqf-ibtida', 'الوقف والابتداء', 12);
SELECT _seed_cat('quran-uloom', 'gharib-quran', 'غريب القرآن', 13);
SELECT _seed_cat('quran-uloom', 'amthal-quran', 'أمثال القرآن', 14);
SELECT _seed_cat('quran-uloom', 'qasas-quran', 'قصص القرآن', 15);
SELECT _seed_cat('quran-uloom', 'tadabbur-quran', 'تدبر القرآن', 16);
SELECT _seed_cat('quran-uloom', 'ahkam-quran', 'أحكام القرآن', 17);
SELECT _seed_cat('quran-uloom', 'ijaz-quran', 'إعجاز القرآن', 18, 'بضوابط علمية منضبطة');
SELECT _seed_cat('quran-uloom', 'manahij-mufassireen', 'مناهج المفسرين', 19);

-- ═══ 2. العقيدة والتوحيد ═══
SELECT _seed_cat(NULL, 'aqeedah-tawheed', 'العقيدة والتوحيد', 2);
SELECT _seed_cat('aqeedah-tawheed', 'aqeedah-intro', 'مدخل إلى العقيدة', 1);
SELECT _seed_cat('aqeedah-tawheed', 'iman-billah', 'الإيمان بالله', 2);
SELECT _seed_cat('aqeedah-tawheed', 'iman-malaika', 'الإيمان بالملائكة', 3);
SELECT _seed_cat('aqeedah-tawheed', 'iman-kutub', 'الإيمان بالكتب', 4);
SELECT _seed_cat('aqeedah-tawheed', 'iman-rusul', 'الإيمان بالرسل', 5);
SELECT _seed_cat('aqeedah-tawheed', 'iman-yawm-akhir', 'الإيمان باليوم الآخر', 6);
SELECT _seed_cat('aqeedah-tawheed', 'iman-qadar', 'الإيمان بالقدر', 7);
SELECT _seed_cat('aqeedah-tawheed', 'aqsam-tawheed', 'أقسام التوحيد الثلاثة', 8);
SELECT _seed_cat('aqeedah-tawheed', 'mana-ibadah', 'معنى العبادة', 9);
SELECT _seed_cat('aqeedah-tawheed', 'shirk-anwauh', 'الشرك وأنواعه', 10);
SELECT _seed_cat('aqeedah-tawheed', 'kufr-nifaq', 'الكفر والنفاق', 11);
SELECT _seed_cat('aqeedah-tawheed', 'wala-bara', 'الولاء والبراء', 12, 'بضوابطه الشرعية');
SELECT _seed_cat('aqeedah-tawheed', 'nawaqid-islam', 'نواقض الإسلام', 13, 'بشرح منضبط');
SELECT _seed_cat('aqeedah-tawheed', 'aqeedat-ahl-sunnah', 'عقيدة أهل السنة والجماعة', 14);
SELECT _seed_cat('aqeedah-tawheed', 'sahaba-al-bayt', 'الصحابة وآل البيت', 15);
SELECT _seed_cat('aqeedah-tawheed', 'fitan-ashrat-saah', 'الفتن وأشراط الساعة', 16);
SELECT _seed_cat('aqeedah-tawheed', 'asma-ahkam', 'مسائل الأسماء والأحكام', 17);
SELECT _seed_cat('aqeedah-tawheed', 'radd-shubuhat-aqeedah', 'الرد على الشبهات', 18);
SELECT _seed_cat('aqeedah-tawheed', 'firaq-madhahib', 'الفرق والمذاهب', 19);
SELECT _seed_cat('aqeedah-tawheed', 'adyan-muasira', 'الأديان المعاصرة', 20);
SELECT _seed_cat('aqeedah-tawheed', 'ilhad-shubuhat-fikriyya', 'الإلحاد والشبهات الفكرية', 21);
SELECT _seed_cat('aqeedah-tawheed', 'athar-iman', 'أثر الإيمان', 22);

-- ═══ 3. الحديث والسنة ═══
SELECT _seed_cat(NULL, 'hadith-sunnah', 'الحديث والسنة', 3);
SELECT _seed_cat('hadith-sunnah', 'sunnah-intro', 'مدخل إلى السنة', 1);
SELECT _seed_cat('hadith-sunnah', 'hujjiyat-sunnah', 'حجية السنة', 2);
SELECT _seed_cat('hadith-sunnah', 'arbaeen-nawawiyya', 'الأربعون النووية', 3);
SELECT _seed_cat('hadith-sunnah', 'jawami-kalim', 'جوامع الكلم', 4);
SELECT _seed_cat('hadith-sunnah', 'ahadith-ahkam', 'أحاديث الأحكام', 5);
SELECT _seed_cat('hadith-sunnah', 'ahadith-adab', 'أحاديث الآداب', 6);
SELECT _seed_cat('hadith-sunnah', 'targhib-tarhib', 'أحاديث الترغيب والترهيب', 7);
SELECT _seed_cat('hadith-sunnah', 'sahihan', 'الصحيحان', 8);
SELECT _seed_cat('hadith-sunnah', 'sunan-arbaa', 'السنن الأربع', 9);
SELECT _seed_cat('hadith-sunnah', 'muwatta', 'الموطأ', 10);
SELECT _seed_cat('hadith-sunnah', 'musnad', 'المسند', 11);
SELECT _seed_cat('hadith-sunnah', 'shuruh-ahadith', 'شروح الأحاديث', 12);
SELECT _seed_cat('hadith-sunnah', 'takhrij', 'التخريج', 13);
SELECT _seed_cat('hadith-sunnah', 'dirasat-asanid', 'دراسة الأسانيد', 14);
SELECT _seed_cat('hadith-sunnah', 'ilal-hadith', 'العلل', 15);
SELECT _seed_cat('hadith-sunnah', 'mukhtalaf-hadith', 'مختلف الحديث ومشكله', 16);
SELECT _seed_cat('hadith-sunnah', 'gharib-hadith', 'غريب الحديث', 17);
SELECT _seed_cat('hadith-sunnah', 'fiqh-hadith', 'فقه الحديث', 18);
SELECT _seed_cat('hadith-sunnah', 'difa-sunnah', 'الدفاع عن السنة', 19);

-- ═══ 4. مصطلح الحديث ═══
SELECT _seed_cat(NULL, 'mustalah-hadith', 'مصطلح الحديث', 4);
SELECT _seed_cat('mustalah-hadith', 'aqsam-hadith', 'أقسام الحديث', 1, 'الصحيح، الحسن، الضعيف، الموضوع');
SELECT _seed_cat('mustalah-hadith', 'mutawatir-ahad', 'المتواتر والآحاد', 2);
SELECT _seed_cat('mustalah-hadith', 'anwa-inqita', 'أنواع الانقطاع', 3, 'المرسل، المنقطع، المعضل، المعلق');
SELECT _seed_cat('mustalah-hadith', 'ilal-riwaya', 'علل الرواية', 4, 'المدلس، الشاذ، المنكر، المضطرب، المدرج، المقلوب');
SELECT _seed_cat('mustalah-hadith', 'jarh-tadil', 'الجرح والتعديل', 5);
SELECT _seed_cat('mustalah-hadith', 'tabaqat-ruwat', 'طبقات الرواة', 6);
SELECT _seed_cat('mustalah-hadith', 'tahammul-ada', 'التحمل والأداء', 7);
SELECT _seed_cat('mustalah-hadith', 'turuq-takhrij', 'طرق التخريج', 8);
SELECT _seed_cat('mustalah-hadith', 'manahij-muhaddithin', 'مناهج المحدثين وكتب السنة', 9);

-- ═══ 5. الفقه الإسلامي ═══
SELECT _seed_cat(NULL, 'fiqh-islami', 'الفقه الإسلامي', 5);
SELECT _seed_cat('fiqh-islami', 'ibadat', 'العبادات', 1);
SELECT _seed_cat('ibadat', 'tahara', 'الطهارة', 1);
SELECT _seed_cat('ibadat', 'salah', 'الصلاة', 2);
SELECT _seed_cat('ibadat', 'janaiz', 'الجنائز', 3);
SELECT _seed_cat('ibadat', 'zakat', 'الزكاة', 4);
SELECT _seed_cat('ibadat', 'siyam', 'الصيام', 5);
SELECT _seed_cat('ibadat', 'itikaf', 'الاعتكاف', 6);
SELECT _seed_cat('ibadat', 'hajj-umrah', 'الحج والعمرة', 7);
SELECT _seed_cat('ibadat', 'udhiyah', 'الأضحية', 8);
SELECT _seed_cat('ibadat', 'nadhr-ayman', 'النذر والأيمان', 9);

SELECT _seed_cat('fiqh-islami', 'muamalat', 'المعاملات', 2);
SELECT _seed_cat('muamalat', 'buyu', 'البيوع', 1);
SELECT _seed_cat('muamalat', 'riba', 'الربا', 2);
SELECT _seed_cat('muamalat', 'uqud-tawthiq', 'عقود التوثيق والإرفاق', 3);
SELECT _seed_cat('muamalat', 'waqf-hiba-wasiyya', 'الوقف والهبة والوصية', 4);
SELECT _seed_cat('muamalat', 'muamalat-bankiyya', 'المعاملات البنكية المعاصرة', 5);
SELECT _seed_cat('muamalat', 'ashum-sukuk', 'الأسهم والصكوك', 6);
SELECT _seed_cat('muamalat', 'umlat-raqmiyya', 'العملات الرقمية', 7, 'بضوابط شرعية');
SELECT _seed_cat('muamalat', 'tamin', 'التأمين', 8);
SELECT _seed_cat('muamalat', 'tijara-iliktroniyya', 'التجارة الإلكترونية', 9);
SELECT _seed_cat('muamalat', 'huquq-fikriyya', 'الحقوق الفكرية', 10);

SELECT _seed_cat('fiqh-islami', 'fiqh-usrah', 'الأسرة', 3);
SELECT _seed_cat('fiqh-usrah', 'khitba-zawaj', 'الخطبة والزواج', 1);
SELECT _seed_cat('fiqh-usrah', 'aqd-nikah', 'عقد النكاح', 2);
SELECT _seed_cat('fiqh-usrah', 'huquq-zawjayn', 'حقوق الزوجين', 3);
SELECT _seed_cat('fiqh-usrah', 'talaq-khula', 'الطلاق والخلع', 4);
SELECT _seed_cat('fiqh-usrah', 'hadana-nasab', 'الحضانة والنسب', 5);
SELECT _seed_cat('fiqh-usrah', 'rada', 'الرضاع', 6);

SELECT _seed_cat('fiqh-islami', 'jinayat-qada', 'الجنايات والقضاء', 4);
SELECT _seed_cat('jinayat-qada', 'jinayat', 'الجنايات', 1);
SELECT _seed_cat('jinayat-qada', 'diyat', 'الديات', 2);
SELECT _seed_cat('jinayat-qada', 'hudud', 'الحدود', 3);
SELECT _seed_cat('jinayat-qada', 'tazir', 'التعزير', 4);
SELECT _seed_cat('jinayat-qada', 'qada-bayyinat', 'القضاء والبينات', 5);
SELECT _seed_cat('jinayat-qada', 'siyasa-shariyya', 'السياسة الشرعية', 6);

SELECT _seed_cat('fiqh-islami', 'fara-mawarith', 'الفرائض والمواريث', 5);
SELECT _seed_cat('fara-mawarith', 'muqaddimat-fara', 'مقدمات الفرائض', 1);
SELECT _seed_cat('fara-mawarith', 'as-hab-furud', 'أصحاب الفروض والعصبات', 2);
SELECT _seed_cat('fara-mawarith', 'hajb-tasib', 'الحجب والتعصيب', 3);
SELECT _seed_cat('fara-mawarith', 'manasikhat-tatbiqat', 'المناسخات والتطبيقات العملية', 4, 'مع تنبيه لمراجعة المختص عند التطبيق الفعلي');

-- ═══ 6. أصول الفقه ═══
SELECT _seed_cat(NULL, 'usul-fiqh', 'أصول الفقه', 6);
SELECT _seed_cat('usul-fiqh', 'hukm-sharei', 'الحكم الشرعي بقسميه', 1);
SELECT _seed_cat('usul-fiqh', 'adilla-muttafaq', 'الأدلة المتفق عليها', 2);
SELECT _seed_cat('usul-fiqh', 'adilla-mukhtalaf', 'الأدلة المختلف فيها', 3);
SELECT _seed_cat('usul-fiqh', 'dalalat-alfaz', 'دلالات الألفاظ', 4);
SELECT _seed_cat('usul-fiqh', 'naskh-usul', 'النسخ', 5);
SELECT _seed_cat('usul-fiqh', 'taarud-tarjih', 'التعارض والترجيح', 6);
SELECT _seed_cat('usul-fiqh', 'ijtihad-taqlid-fatwa', 'الاجتهاد والتقليد والفتوى', 7);
SELECT _seed_cat('usul-fiqh', 'tahqiq-manat', 'تحقيق المناط', 8);
SELECT _seed_cat('usul-fiqh', 'qawaid-usuliyya', 'القواعد الأصولية', 9);

-- ═══ 7. القواعد الفقهية ═══
SELECT _seed_cat(NULL, 'qawaid-fiqhiyya', 'القواعد الفقهية', 7);
SELECT _seed_cat('qawaid-fiqhiyya', 'qawaid-khamsa-kubra', 'القواعد الخمس الكبرى', 1);
SELECT _seed_cat('qawaid-fiqhiyya', 'qawaid-kulliya', 'القواعد الكلية والتابعة', 2);
SELECT _seed_cat('qawaid-fiqhiyya', 'dawabit-fiqhiyya', 'الضوابط الفقهية', 3);
SELECT _seed_cat('qawaid-fiqhiyya', 'tatbiqat-qawaid', 'تطبيقات في العبادات والمعاملات المعاصرة', 4);

-- ═══ 8. السيرة النبوية ═══
SELECT _seed_cat(NULL, 'seerah-nabawiyya', 'السيرة النبوية', 8);
SELECT _seed_cat('seerah-nabawiyya', 'arab-qabl-islam', 'العرب قبل الإسلام', 1);
SELECT _seed_cat('seerah-nabawiyya', 'mawlid-nashaa', 'المولد والنشأة', 2);
SELECT _seed_cat('seerah-nabawiyya', 'bitha-dawa-sirriyya', 'البعثة والدعوة السرية', 3);
SELECT _seed_cat('seerah-nabawiyya', 'dawa-jahriyya-makka', 'الدعوة الجهرية بمكة', 4);
SELECT _seed_cat('seerah-nabawiyya', 'hijra', 'الهجرة', 5);
SELECT _seed_cat('seerah-nabawiyya', 'ahd-madani-ghazawat', 'العهد المدني والغزوات', 6);
SELECT _seed_cat('seerah-nabawiyya', 'wafah-nabawiyya', 'الوفاة وما بعدها', 7);
SELECT _seed_cat('seerah-nabawiyya', 'shamail', 'الشمائل المحمدية', 8);
SELECT _seed_cat('seerah-nabawiyya', 'akhlaq-nabawiyya', 'الأخلاق النبوية', 9);
SELECT _seed_cat('seerah-nabawiyya', 'dalail-nubuwwa', 'دلائل النبوة', 10);
SELECT _seed_cat('seerah-nabawiyya', 'fiqh-seerah', 'فقه السيرة والدروس التربوية', 11);

-- ═══ 9. التاريخ الإسلامي ═══
SELECT _seed_cat(NULL, 'tarikh-islami', 'التاريخ الإسلامي', 9);
SELECT _seed_cat('tarikh-islami', 'khulafa-rashidun', 'الخلفاء الراشدون', 1);
SELECT _seed_cat('tarikh-islami', 'duwal-islamiyya-kubra', 'الدول الإسلامية الكبرى', 2);
SELECT _seed_cat('tarikh-islami', 'andalus', 'الأندلس', 3);
SELECT _seed_cat('tarikh-islami', 'hurub-salibiyya-tatar', 'الحروب الصليبية والتتار', 4);
SELECT _seed_cat('tarikh-islami', 'dawla-uthmaniyya', 'الدولة العثمانية', 5);
SELECT _seed_cat('tarikh-islami', 'tarikh-ulama-madhahib', 'تاريخ العلماء والمذاهب', 6);
SELECT _seed_cat('tarikh-islami', 'hadara-islamiyya', 'الحضارة الإسلامية', 7);
SELECT _seed_cat('tarikh-islami', 'qiraa-naqdiyya', 'القراءة النقدية للمصادر', 8);

-- ═══ 10. الأخلاق والآداب ═══
SELECT _seed_cat(NULL, 'akhlaq-adab', 'الأخلاق والآداب', 10);
SELECT _seed_cat('akhlaq-adab', 'amal-qulub-mahmuda', 'أعمال القلوب المحمودة', 1);
SELECT _seed_cat('akhlaq-adab', 'afat-qulub-lisan', 'آفات القلوب واللسان', 2);
SELECT _seed_cat('akhlaq-adab', 'adab-yawmiyya', 'الآداب العملية اليومية', 3, 'الطعام، اللباس، النوم');
SELECT _seed_cat('akhlaq-adab', 'adab-majlis-tariq', 'آداب المجلس والطريق', 4);
SELECT _seed_cat('akhlaq-adab', 'adab-hiwar-khilaf', 'آداب الحوار والخلاف', 5);
SELECT _seed_cat('akhlaq-adab', 'huquq-walidayn-rahim', 'حق الوالدين والرحم', 6);
SELECT _seed_cat('akhlaq-adab', 'huquq-jar-muslim', 'حق الجار والمسلم', 7);
SELECT _seed_cat('akhlaq-adab', 'suhba-tarbiyat-nafs', 'الصحبة وتربية النفس', 8);

-- ═══ 11. الأذكار والأدعية ═══
SELECT _seed_cat(NULL, 'adhkar-adiya', 'الأذكار والأدعية', 11);
SELECT _seed_cat('adhkar-adiya', 'adhkar-yawm-layla', 'أذكار اليوم والليلة', 1);
SELECT _seed_cat('adhkar-adiya', 'adhkar-munasabat', 'أذكار المناسبات والأحوال', 2);
SELECT _seed_cat('adhkar-adiya', 'adiya-quran-sunnah', 'أدعية القرآن والسنة', 3);
SELECT _seed_cat('adhkar-adiya', 'ruqya-shariyya', 'الرقية الشرعية', 4);
SELECT _seed_cat('adhkar-adiya', 'fiqh-dua-dhikr', 'فقه الدعاء والذكر', 5);

-- ═══ 12. اللغة العربية ═══
SELECT _seed_cat(NULL, 'lugha-arabiyya', 'اللغة العربية', 12);
SELECT _seed_cat('lugha-arabiyya', 'imla', 'الإملاء', 1);
SELECT _seed_cat('lugha-arabiyya', 'nahw', 'النحو', 2);
SELECT _seed_cat('lugha-arabiyya', 'sarf', 'الصرف', 3);
SELECT _seed_cat('lugha-arabiyya', 'balagha', 'البلاغة', 4);
SELECT _seed_cat('lugha-arabiyya', 'fiqh-lugha', 'فقه اللغة', 5);
SELECT _seed_cat('lugha-arabiyya', 'mufradat-shariyya', 'المفردات الشرعية', 6);
SELECT _seed_cat('lugha-arabiyya', 'fahm-nusus', 'مهارات فهم النصوص الشرعية', 7);
SELECT _seed_cat('lugha-arabiyya', 'tadribat-tatbiqiyya', 'تدريبات تطبيقية', 8);

-- ═══ 13. الدعوة إلى الله ═══
SELECT _seed_cat(NULL, 'dawah', 'الدعوة إلى الله', 13);
SELECT _seed_cat('dawah', 'fadl-dawah', 'فضل الدعوة', 1);
SELECT _seed_cat('dawah', 'sifat-daiya', 'صفات الداعية', 2);
SELECT _seed_cat('dawah', 'fiqh-dawah', 'فقه الدعوة وأولوياتها وموازناتها', 3);
SELECT _seed_cat('dawah', 'dawat-ghayr-muslimin', 'دعوة غير المسلمين والمسلم الجديد', 4);
SELECT _seed_cat('dawah', 'tamul-shubuhat', 'التعامل مع الشبهات', 5);
SELECT _seed_cat('dawah', 'dawah-raqmiyya', 'الدعوة الرقمية', 6);
SELECT _seed_cat('dawah', 'khataba-idad-durus', 'الخطابة وإعداد الدروس', 7);

-- ═══ 14. التربية الإيمانية ═══
SELECT _seed_cat(NULL, 'tarbiya-imaniyya', 'التربية الإيمانية', 14);
SELECT _seed_cat('tarbiya-imaniyya', 'amal-qulub', 'أعمال القلوب', 1);
SELECT _seed_cat('tarbiya-imaniyya', 'tazkiya-muhasaba', 'التزكية والمحاسبة', 2);
SELECT _seed_cat('tarbiya-imaniyya', 'mujahada', 'المجاهدة', 3);
SELECT _seed_cat('tarbiya-imaniyya', 'thabat-istiqama', 'الثبات والاستقامة', 4);
SELECT _seed_cat('tarbiya-imaniyya', 'ilaj-futur', 'علاج الفتور', 5);
SELECT _seed_cat('tarbiya-imaniyya', 'uluw-himma', 'علو الهمة وطلب العلم', 6);
SELECT _seed_cat('tarbiya-imaniyya', 'bina-adat', 'بناء العادات', 7);
SELECT _seed_cat('tarbiya-imaniyya', 'qiyam-layl-tadabbur', 'قيام الليل والتدبر', 8);
SELECT _seed_cat('tarbiya-imaniyya', 'suhba-saliha', 'الصحبة الصالحة', 9);

-- ═══ 15. الأسرة والمجتمع ═══
SELECT _seed_cat(NULL, 'usrah-mujtama', 'الأسرة والمجتمع', 15);
SELECT _seed_cat('usrah-mujtama', 'bina-usrah', 'بناء الأسرة', 1);
SELECT _seed_cat('usrah-mujtama', 'tarbiyat-abna', 'تربية الأبناء والمراهقين', 2);
SELECT _seed_cat('usrah-mujtama', 'mushkilat-usariyya', 'المشكلات الأسرية والإصلاح', 3);
SELECT _seed_cat('usrah-mujtama', 'takaful-ijtimai', 'التكافل وحقوق الفئات', 4);
SELECT _seed_cat('usrah-mujtama', 'amal-tatawwui', 'العمل التطوعي', 5);
SELECT _seed_cat('usrah-mujtama', 'himayat-usrah-raqmiyya', 'حماية الأسرة رقميًا', 6);

-- ═══ 16. المرأة المسلمة ═══
SELECT _seed_cat(NULL, 'mara-muslima', 'المرأة المسلمة', 16);
SELECT _seed_cat('mara-muslima', 'makanat-mara', 'مكانة المرأة في الإسلام', 1);
SELECT _seed_cat('mara-muslima', 'ahkam-mara-khassa', 'أحكامها الخاصة في الطهارة والعبادات', 2);
SELECT _seed_cat('mara-muslima', 'libas-hijab', 'اللباس والحجاب', 3);
SELECT _seed_cat('mara-muslima', 'huquq-mara', 'حقوق المرأة', 4);
SELECT _seed_cat('mara-muslima', 'umuma', 'الأمومة', 5);
SELECT _seed_cat('mara-muslima', 'mara-ilm-amal', 'طلب العلم والعمل', 6);

-- ═══ 17. الشباب والناشئة ═══
SELECT _seed_cat(NULL, 'shabab-nashia', 'الشباب والناشئة', 17);
SELECT _seed_cat('shabab-nashia', 'asasiyyat-mubassata', 'الأساسيات المبسطة', 1);
SELECT _seed_cat('shabab-nashia', 'akhlaq-suhbat-shabab', 'الأخلاق والصحبة', 2);
SELECT _seed_cat('shabab-nashia', 'internet-tawasul', 'الإنترنت والألعاب ووسائل التواصل', 3);
SELECT _seed_cat('shabab-nashia', 'shubuhat-shahawat', 'الشبهات والشهوات', 4);
SELECT _seed_cat('shabab-nashia', 'bina-shakhsiyya', 'بناء الشخصية', 5);
SELECT _seed_cat('shabab-nashia', 'qasas-anbiya-mubassata', 'قصص الأنبياء والسيرة المبسطة', 6);

-- ═══ 18. المسلم الجديد ═══
SELECT _seed_cat(NULL, 'muslim-jadid', 'المسلم الجديد', 18);
SELECT _seed_cat('muslim-jadid', 'tarif-islam', 'التعريف بالإسلام', 1);
SELECT _seed_cat('muslim-jadid', 'shahadatan', 'الشهادتان', 2);
SELECT _seed_cat('muslim-jadid', 'arkan-amaliyya', 'الأركان العملية', 3);
SELECT _seed_cat('muslim-jadid', 'wudu-salah-amali', 'الوضوء والصلاة عمليًا', 4);
SELECT _seed_cat('muslim-jadid', 'adhkar-asasiyya', 'الأذكار الأساسية', 5);
SELECT _seed_cat('muslim-jadid', 'halal-haram', 'الحلال والحرام', 6);
SELECT _seed_cat('muslim-jadid', 'barnamaj-tadarruji', 'برنامج تدرجي (٧/٣٠/٩٠ يومًا)', 7);

-- ═══ 19. الفتاوى الموثقة ═══
SELECT _seed_cat(NULL, 'fatawa-muwaththaqa', 'الفتاوى الموثقة', 19,
  'تعرض فقط فتاوى موثقة من جهات وعلماء معتمدين — الذكاء الاصطناعي لا يصدر فتوى أبدًا');
SELECT _seed_cat('fatawa-muwaththaqa', 'fatawa-ibadat', 'فتاوى العبادات', 1);
SELECT _seed_cat('fatawa-muwaththaqa', 'fatawa-usrah', 'فتاوى الأسرة', 2);
SELECT _seed_cat('fatawa-muwaththaqa', 'fatawa-muamalat', 'فتاوى المعاملات', 3);
SELECT _seed_cat('fatawa-muwaththaqa', 'fatawa-tibbiyya', 'فتاوى طبية', 4);
SELECT _seed_cat('fatawa-muwaththaqa', 'fatawa-tiqniyya', 'فتاوى تقنية', 5);
SELECT _seed_cat('fatawa-muwaththaqa', 'fatawa-ai', 'فتاوى الذكاء الاصطناعي', 6);

-- ═══ 20. مقاصد الشريعة ═══
SELECT _seed_cat(NULL, 'maqasid-sharia', 'مقاصد الشريعة', 20);
SELECT _seed_cat('maqasid-sharia', 'mafhum-maqasid', 'المفهوم والتاريخ', 1);
SELECT _seed_cat('maqasid-sharia', 'kulliyat-khams', 'الكليات الخمس', 2);
SELECT _seed_cat('maqasid-sharia', 'maratib-masalih', 'مراتب المصالح', 3);
SELECT _seed_cat('maqasid-sharia', 'maalat', 'المآلات', 4);
SELECT _seed_cat('maqasid-sharia', 'tatbiqat-istidlal', 'التطبيقات وضوابط الاستدلال', 5);

-- ═══ 21. المذاهب والفقه المقارن ═══
SELECT _seed_cat(NULL, 'madhahib-fiqh-muqaran', 'المذاهب والفقه المقارن', 21);
SELECT _seed_cat('madhahib-fiqh-muqaran', 'tarif-madhahib-arbaa', 'التعريف بالمذاهب الأربعة', 1, 'مصادرها ومصطلحاتها');
SELECT _seed_cat('madhahib-fiqh-muqaran', 'asbab-ikhtilaf', 'أسباب اختلاف الفقهاء', 2);
SELECT _seed_cat('madhahib-fiqh-muqaran', 'adab-khilaf-fiqhi', 'أدب الخلاف', 3);
SELECT _seed_cat('madhahib-fiqh-muqaran', 'manhajiyyat-muqaran', 'منهجية دراسة الفقه المقارن', 4, 'نبذ التعصب المذهبي');

-- ═══ 22. الثقافة الإسلامية والفكر ═══
SELECT _seed_cat(NULL, 'thaqafa-fikr', 'الثقافة الإسلامية والفكر', 22);
SELECT _seed_cat('thaqafa-fikr', 'huwiyya-islamiyya', 'الهوية الإسلامية', 1);
SELECT _seed_cat('thaqafa-fikr', 'wasatiyya-ghuluw', 'الوسطية والغلو', 2);
SELECT _seed_cat('thaqafa-fikr', 'tayarat-fikriyya', 'التيارات الفكرية المعاصرة', 3);
SELECT _seed_cat('thaqafa-fikr', 'istishraq', 'الاستشراق', 4);
SELECT _seed_cat('thaqafa-fikr', 'awlama-ilam', 'العولمة والإعلام', 5);
SELECT _seed_cat('thaqafa-fikr', 'shubuhat-muasira', 'الشبهات المعاصرة', 6);
SELECT _seed_cat('thaqafa-fikr', 'tafkir-naqdi', 'التفكير النقدي والتحقق من المعلومات', 7);

-- ═══ 23. الاقتصاد والمالية الإسلامية ═══
SELECT _seed_cat(NULL, 'iqtisad-maliyya-islamiyya', 'الاقتصاد والمالية الإسلامية', 23);
SELECT _seed_cat('iqtisad-maliyya-islamiyya', 'mabadi-iqtisadiyya', 'المبادئ الاقتصادية', 1);
SELECT _seed_cat('iqtisad-maliyya-islamiyya', 'mal-milkiyya', 'المال والملكية', 2);
SELECT _seed_cat('iqtisad-maliyya-islamiyya', 'muharramat-maliyya', 'المحرمات المالية', 3, 'الربا، الغرر، القمار');
SELECT _seed_cat('iqtisad-maliyya-islamiyya', 'siyagh-tamwil', 'صيغ التمويل الإسلامي', 4);
SELECT _seed_cat('iqtisad-maliyya-islamiyya', 'masarif-islamiyya', 'المصارف الإسلامية', 5);
SELECT _seed_cat('iqtisad-maliyya-islamiyya', 'istithmar-zakat', 'الاستثمار والزكاة عليه', 6);
SELECT _seed_cat('iqtisad-maliyya-islamiyya', 'takhtit-mali', 'التخطيط المالي الشخصي', 7);

-- ═══ 24. الطب والأحكام الشرعية ═══
SELECT _seed_cat(NULL, 'tibb-ahkam-shariyya', 'الطب والأحكام الشرعية', 24,
  'يتطلب مراجعة مختصين شرعيين وطبيين قبل أي نشر');
SELECT _seed_cat('tibb-ahkam-shariyya', 'tadawi', 'التداوي', 1);
SELECT _seed_cat('tibb-ahkam-shariyya', 'nawazil-tibbiyya', 'النوازل الطبية المعاصرة', 2, 'نقل الدم، زراعة الأعضاء، الموت الدماغي، الإجهاض، التلقيح');
SELECT _seed_cat('tibb-ahkam-shariyya', 'ahkam-marid', 'أحكام المريض', 3, 'الطهارة والصلاة والصيام');
SELECT _seed_cat('tibb-ahkam-shariyya', 'akhlaqiyyat-mumarasa', 'أخلاقيات الممارسة الطبية', 4);

-- ═══ 25. المناسبات الإسلامية ═══
SELECT _seed_cat(NULL, 'munasabat-islamiyya', 'المناسبات الإسلامية', 25);
SELECT _seed_cat('munasabat-islamiyya', 'ramadan-laylat-qadr', 'رمضان وليلة القدر والعشر', 1);
SELECT _seed_cat('munasabat-islamiyya', 'idan', 'العيدان', 2);
SELECT _seed_cat('munasabat-islamiyya', 'hajj-ashr-dhul-hijja', 'الحج وعشر ذي الحجة وعرفة', 3);
SELECT _seed_cat('munasabat-islamiyya', 'muharram-ashura', 'المحرم وعاشوراء', 4);
SELECT _seed_cat('munasabat-islamiyya', 'jumua', 'الجمعة وأحكام الأهلة', 5);
SELECT _seed_cat('munasabat-islamiyya', 'munasabat-la-asl', 'مناسبات لا أصل لها', 6, 'بشرح علمي موثق');

DROP FUNCTION _seed_cat(TEXT, TEXT, TEXT, INT, TEXT);

-- ═══════════════════════════════════════════════════════════════════════════
-- نشر التصنيفات التي يغطيها محتوى حقيقي فعليًا فقط (الدروس الـ28 المعتمدة في
-- الإنتاج + محتوى السيرة الغني الموجود في SeerahPage.tsx) — كل ما عداها يبقى
-- draft حتى تتوفر مادة معتمدة تحته، تطبيقًا صارمًا للقاعدة الثانية.
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE categories SET status = 'published' WHERE slug IN (
  'quran-uloom', 'tafseer',
  'hadith-sunnah', 'arbaeen-nawawiyya', 'ahadith-ahkam', 'shuruh-ahadith', 'difa-sunnah',
  'mustalah-hadith',
  'aqeedah-tawheed', 'iman-billah', 'aqsam-tawheed', 'nawaqid-islam', 'aqeedat-ahl-sunnah',
  'fiqh-islami', 'ibadat', 'salah',
  'madhahib-fiqh-muqaran',
  'mara-muslima', 'ahkam-mara-khassa',
  'seerah-nabawiyya'
);
