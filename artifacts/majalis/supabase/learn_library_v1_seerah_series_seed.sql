-- مولَّد آليًا عبر scripts/generate-seerah-series-seed.mjs — لا يُعدَّل يدويًا، أعد التوليد بدلاً من ذلك.
DO $$
DECLARE
  v_series_id UUID;
  v_lesson_1_id UUID;
  v_lesson_2_id UUID;
  v_lesson_3_id UUID;
  v_lesson_4_id UUID;
  v_lesson_5_id UUID;
  v_lesson_6_id UUID;
  v_lesson_7_id UUID;
  v_lesson_8_id UUID;
  v_lesson_9_id UUID;
  v_lesson_10_id UUID;
  v_lesson_11_id UUID;
  v_lesson_12_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM lesson_series WHERE slug = 'seerah-kamila') THEN
    RAISE NOTICE 'سلسلة السيرة موجودة مسبقًا — تخطّي (idempotent)'; RETURN;
  END IF;

  INSERT INTO lesson_series (slug, title, description, category_id, level, status, sort_order)
  VALUES ('seerah-kamila', 'السيرة النبوية الكاملة — من المولد إلى الوفاة',
    'رحلة زمنية مرتبة عبر 12 مرحلة من حياة النبي ﷺ، من نسبه ومولده حتى وفاته، بأحداثها الرئيسية وأدلتها من كتب السيرة المعتمدة.',
    (SELECT id FROM categories WHERE slug = 'seerah-nabawiyya'), 'beginner', 'published', 1)
  RETURNING id INTO v_series_id;

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('النسب والمولد', 'وُلد النبي ﷺ في مكة المكرمة عام الفيل، من نسب قريشي شريف يمتد إلى إبراهيم الخليل عليه السلام. وفي ذلك العام حمى الله الكعبة المشرفة من أبرهة وجنده.', 'سيرة', (SELECT id FROM categories WHERE slug = 'mawlid-nashaa'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:lineage-birth')
  RETURNING id INTO v_lesson_1_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_1_id, 1, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_1_id, 'body', 'ملخص المرحلة', 'وُلد النبي ﷺ في مكة المكرمة عام الفيل، من نسب قريشي شريف يمتد إلى إبراهيم الخليل عليه السلام. وفي ذلك العام حمى الله الكعبة المشرفة من أبرهة وجنده.', 1),
    (v_lesson_1_id, 'objectives', 'الموضوعات', 'نسبه الشريف ﷺ — مولده في مكة — حادثة الفيل', 2),
    (v_lesson_1_id, 'timeline_events', 'الأحداث الرئيسية (عام الفيل، 571م)', '1. مولده ﷺ في الثاني عشر من ربيع الأول عام الفيل (571م)
2. نسبه: محمد بن عبد الله بن عبد المطلب من بني هاشم، قريش
3. توفي والده عبد الله قبل ولادته في رحلة تجارية إلى المدينة
4. في العام نفسه: أرسل الله الطير الأبابيل على جيش أبرهة دفاعاً عن الكعبة', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الطفولة والرضاعة', 'أُرضع ﷺ عند حليمة السعدية في بني سعد، وفُقد والده قبل ولادته. توفيت أمه آمنة وهو في السادسة، فكفله جده عبد المطلب ثم عمه أبو طالب.', 'سيرة', (SELECT id FROM categories WHERE slug = 'mawlid-nashaa'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:childhood')
  RETURNING id INTO v_lesson_2_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_2_id, 2, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_2_id, 'body', 'ملخص المرحلة', 'أُرضع ﷺ عند حليمة السعدية في بني سعد، وفُقد والده قبل ولادته. توفيت أمه آمنة وهو في السادسة، فكفله جده عبد المطلب ثم عمه أبو طالب.', 1),
    (v_lesson_2_id, 'objectives', 'الموضوعات', 'رضاعته عند حليمة — يتمه ﷺ — كفالة جده وعمه', 2),
    (v_lesson_2_id, 'timeline_events', 'الأحداث الرئيسية (571–576م)', '1. أرضعته ثويبة مولاة أبي لهب أياماً ثم أرسلته للرضاعة
2. أرضعته حليمة السعدية من بني سعد وبارك الله في قومها بسببه
3. حادثة شق الصدر وهو عند حليمة، أُعيد إلى مكة بعدها
4. توفيت أمه آمنة بنت وهب وعمره ست سنوات عند الأبواء
5. كفله جده عبد المطلب ثم توفي وعمره ثماني سنوات
6. آل كفالته إلى عمه أبي طالب فربّاه وحماه', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الشباب قبل البعثة', 'عُرف ﷺ في قومه بالصادق الأمين، شارك في حلف الفضول لنصرة المظلومين، عمل بالتجارة، وتزوج خديجة رضي الله عنها، وكان يتحنث في غار حراء.', 'سيرة', (SELECT id FROM categories WHERE slug = 'arab-qabl-islam'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:youth')
  RETURNING id INTO v_lesson_3_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_3_id, 3, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_3_id, 'body', 'ملخص المرحلة', 'عُرف ﷺ في قومه بالصادق الأمين، شارك في حلف الفضول لنصرة المظلومين، عمل بالتجارة، وتزوج خديجة رضي الله عنها، وكان يتحنث في غار حراء.', 1),
    (v_lesson_3_id, 'objectives', 'الموضوعات', 'الصادق الأمين — حلف الفضول — زواجه من خديجة ﷢ — تحنّثه في حراء', 2),
    (v_lesson_3_id, 'timeline_events', 'الأحداث الرئيسية (576–610م)', '1. سافر مع عمه إلى الشام وتنبأ الراهب بحيرا بنبوته
2. لقّبه أهل مكة «الصادق الأمين» لأمانته وصدقه
3. شارك في حلف الفضول لنصرة المظلوم وقال: لو دُعيت إليه في الإسلام لأجبت
4. تزوج خديجة بنت خويلد وعمره 25 وهي 40، عشا معاً 25 عاماً
5. أنجب منها: القاسم والزينب ورقية وأم كلثوم وفاطمة وعبد الله
6. كان يتحنث في غار حراء كل عام في رمضان قبيل البعثة
7. أعاد وضع الحجر الأسود مكانه عام 605م دون إراقة دماء: جعل الزعماء يحملونه معاً على ثوب بيده الشريفة', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('البعثة', 'نزل جبريل عليه السلام على النبي ﷺ في غار حراء بأوائل سورة العلق، فكانت بداية الوحي والرسالة المحمدية الخاتمة.', 'سيرة', (SELECT id FROM categories WHERE slug = 'bitha-dawa-sirriyya'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:prophethood')
  RETURNING id INTO v_lesson_4_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_4_id, 4, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_4_id, 'body', 'ملخص المرحلة', 'نزل جبريل عليه السلام على النبي ﷺ في غار حراء بأوائل سورة العلق، فكانت بداية الوحي والرسالة المحمدية الخاتمة.', 1),
    (v_lesson_4_id, 'objectives', 'الموضوعات', 'نزول الوحي الأول — غار حراء — أوائل المؤمنين', 2),
    (v_lesson_4_id, 'timeline_events', 'الأحداث الرئيسية (610م)', '1. نزول جبريل في غار حراء بأوائل العلق: ﴿اقْرَأْ بِاسْمِ رَبِّكَ﴾
2. رجع ﷺ يرتجف فدثّرته خديجة وقالت: والله لا يخزيك الله أبداً
3. ذهب به إلى ورقة بن نوفل الذي أخبره بحقيقة الوحي وبشّره
4. فترة انقطاع الوحي (الفترة) ثم عودته بسورة المدثر
5. أول من آمن: خديجة ﷢، ثم علي بن أبي طالب، ثم أبو بكر الصديق', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الدعوة السرية', 'انطلقت الدعوة سراً بين الأهل والمقربين؛ أسلمت خديجة وعلي وأبو بكر وزيد رضي الله عنهم، واتسعت الدائرة تدريجياً قبل الجهر.', 'سيرة', (SELECT id FROM categories WHERE slug = 'bitha-dawa-sirriyya'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:secret-dawah')
  RETURNING id INTO v_lesson_5_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_5_id, 5, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_5_id, 'body', 'ملخص المرحلة', 'انطلقت الدعوة سراً بين الأهل والمقربين؛ أسلمت خديجة وعلي وأبو بكر وزيد رضي الله عنهم، واتسعت الدائرة تدريجياً قبل الجهر.', 1),
    (v_lesson_5_id, 'objectives', 'الموضوعات', 'الدعوة في السر — أوائل المسلمين — الهجرة إلى الحبشة', 2),
    (v_lesson_5_id, 'timeline_events', 'الأحداث الرئيسية (610–613م)', '1. دخل دار الأرقم بن أبي الأرقم مقراً للتعليم السري
2. أسلم عثمان بن عفان والزبير وطلحة وسعد وأبو عبيدة
3. الهجرة الأولى إلى الحبشة بأحد عشر رجلاً وأربع نساء
4. الهجرة الثانية بأكثر من ثمانين شخصاً بعد اشتداد الأذى
5. استقبل النجاشي المهاجرين وأحسن وفادتهم ورفض تسليمهم
6. أسلم عبد الله بن مسعود في مرحلة مبكرة وكان يرعى غنم عقبة بن أبي معيط فسمع النبي ﷺ يقرأ
7. خرجت بيعات إسلام متعددة سراً في مواسم الحج، الأوس والخزرج من المدينة', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الدعوة الجهرية', 'أُعلنت الدعوة على رؤوس الأشهاد وصعد النبي ﷺ الصفا ينادي قريشاً. فاشتد الإيذاء وهاجر المستضعفون إلى الحبشة، وحُوصر المسلمون في شعب أبي طالب.', 'سيرة', (SELECT id FROM categories WHERE slug = 'dawa-jahriyya-makka'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:open-dawah')
  RETURNING id INTO v_lesson_6_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_6_id, 6, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_6_id, 'body', 'ملخص المرحلة', 'أُعلنت الدعوة على رؤوس الأشهاد وصعد النبي ﷺ الصفا ينادي قريشاً. فاشتد الإيذاء وهاجر المستضعفون إلى الحبشة، وحُوصر المسلمون في شعب أبي طالب.', 1),
    (v_lesson_6_id, 'objectives', 'الموضوعات', 'الجهر بالدعوة — إيذاء قريش — الحصار في الشعب', 2),
    (v_lesson_6_id, 'timeline_events', 'الأحداث الرئيسية (613–619م)', '1. نزل: ﴿فَاصْدَعْ بِمَا تُؤْمَرُ﴾ فصعد الصفا ونادى قريشاً
2. عرض على قبائل العرب في موسم الحج الإسلام
3. تعذيب بلال وعمار وخبّاب وسمية وياسر على الإيمان
4. إسلام حمزة بن عبد المطلب وعمر بن الخطاب كان تحولاً كبيراً
5. حصار المسلمين في شعب أبي طالب ثلاث سنوات، جوع وشدة شديدة
6. أُكل الصحيفة التي كتبتها قريش للمقاطعة بعد ثلاث سنوات', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('عام الحزن والإسراء', 'توفيت أم المؤمنين خديجة وعمه أبو طالب في عام واحد سُمّي بعام الحزن. ثم كانت رحلة الإسراء إلى المسجد الأقصى والمعراج إلى السماوات تثبيتاً للنبي ﷺ.', 'سيرة', (SELECT id FROM categories WHERE slug = 'dawa-jahriyya-makka'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:year-of-sorrow')
  RETURNING id INTO v_lesson_7_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_7_id, 7, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_7_id, 'body', 'ملخص المرحلة', 'توفيت أم المؤمنين خديجة وعمه أبو طالب في عام واحد سُمّي بعام الحزن. ثم كانت رحلة الإسراء إلى المسجد الأقصى والمعراج إلى السماوات تثبيتاً للنبي ﷺ.', 1),
    (v_lesson_7_id, 'objectives', 'الموضوعات', 'وفاة خديجة ﷢ — وفاة أبي طالب — الإسراء والمعراج', 2),
    (v_lesson_7_id, 'timeline_events', 'الأحداث الرئيسية (619–620م)', '1. وفاة خديجة ﷢ بعد خمسة وعشرين عاماً من الوفاء والنصرة
2. وفاة أبي طالب الذي ظل درعاً حامياً للنبي ﷺ من قريش
3. خروجه إلى الطائف يطلب النصرة، رفضوه وأُذوا وجُرح
4. الإسراء: رحلة ليلية من المسجد الحرام إلى المسجد الأقصى
5. المعراج: صعوده إلى السماوات ومقابلة الأنبياء وفرض الصلوات
6. كانت خمسين صلاة فراجع حتى صارت خمساً في الفعل وخمسين في الأجر', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الهجرة إلى المدينة', 'أذن الله بالهجرة إلى يثرب، فخرج النبي ﷺ مع أبي بكر رضي الله عنه وآثرا غار ثور مأوىً، ثم وصل المدينة فاستُقبل بالفرح والترحيب. كانت هذه الهجرة بداية التقويم الهجري.', 'سيرة', (SELECT id FROM categories WHERE slug = 'hijra'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:hijra')
  RETURNING id INTO v_lesson_8_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_8_id, 8, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_8_id, 'body', 'ملخص المرحلة', 'أذن الله بالهجرة إلى يثرب، فخرج النبي ﷺ مع أبي بكر رضي الله عنه وآثرا غار ثور مأوىً، ثم وصل المدينة فاستُقبل بالفرح والترحيب. كانت هذه الهجرة بداية التقويم الهجري.', 1),
    (v_lesson_8_id, 'objectives', 'الموضوعات', 'مغادرة مكة — الوصول للمدينة — بناء المسجد النبوي — الأخوّة بين المهاجرين والأنصار', 2),
    (v_lesson_8_id, 'timeline_events', 'الأحداث الرئيسية (622م)', '1. بيعة العقبة الثانية مع 73 رجلاً وامرأتين من الأنصار
2. خرج ﷺ مع أبي بكر ليلاً ومكثا في غار ثور ثلاثة أيام
3. وصل المدينة فاستقبله أهلها بالتهليل والفرح
4. بنى أول مسجد في التاريخ الإسلامي: المسجد النبوي بيده الشريفة
5. عقد المؤاخاة بين المهاجرين والأنصار، أخوة الإسلام
6. وضع وثيقة المدينة، أول دستور مكتوب في التاريخ', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الغزوات الكبرى', 'شهدت هذه المرحلة غزوات بدر الكبرى وأُحد والخندق؛ أبلى فيها المسلمون بلاءً حسناً وثبّتت إيمانهم، وكان النصر والابتلاء كلاهما درساً وتكويناً للأمة.', 'سيرة', (SELECT id FROM categories WHERE slug = 'ahd-madani-ghazawat'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:ghazawat')
  RETURNING id INTO v_lesson_9_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_9_id, 9, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_9_id, 'body', 'ملخص المرحلة', 'شهدت هذه المرحلة غزوات بدر الكبرى وأُحد والخندق؛ أبلى فيها المسلمون بلاءً حسناً وثبّتت إيمانهم، وكان النصر والابتلاء كلاهما درساً وتكويناً للأمة.', 1),
    (v_lesson_9_id, 'objectives', 'الموضوعات', 'غزوة بدر الكبرى — غزوة أُحد — غزوة الأحزاب، الخندق', 2),
    (v_lesson_9_id, 'timeline_events', 'الأحداث الرئيسية (624–627م)', '1. بدر الكبرى (624م): 313 مسلم يهزمون 1000 مشرك، أول نصر كبير
2. أُسر سبعون وقُتل سبعون من زعماء قريش في بدر
3. أُحد (625م): نكسة بسبب مخالفة الرماة، استشهد 70 صحابياً
4. جُرح النبي ﷺ في أُحد ووقف على جبل الرماة يحرّض
5. الخندق/الأحزاب (627م): حصار المدينة بعشرة آلاف مقاتل
6. حفر الخندق بفكرة سلمان الفارسي وصمد المسلمون شهراً ثم تفرق الأحزاب
7. غزوة بني قينقاع (624م): أول مواجهة مع يهود المدينة الذين نقضوا العهد وجُلّوا منها
8. غزوة بني النضير (625م): يهود ثانيون نقضوا العهد فحوصروا وجُلّوا إلى الشام وخيبر', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الحديبية وفتح مكة', 'كان صلح الحديبية فتحاً مبيناً مهّد لانتشار الإسلام أفواجاً. تُوّج ذلك بدخول مكة المكرمة عام ثمانية للهجرة بلا قتال، وعفا النبي ﷺ عمن آذاه.', 'سيرة', (SELECT id FROM categories WHERE slug = 'ahd-madani-ghazawat'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:hudaybiyya-mecca')
  RETURNING id INTO v_lesson_10_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_10_id, 10, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_10_id, 'body', 'ملخص المرحلة', 'كان صلح الحديبية فتحاً مبيناً مهّد لانتشار الإسلام أفواجاً. تُوّج ذلك بدخول مكة المكرمة عام ثمانية للهجرة بلا قتال، وعفا النبي ﷺ عمن آذاه.', 1),
    (v_lesson_10_id, 'objectives', 'الموضوعات', 'صلح الحديبية — فتح مكة — العفو العام', 2),
    (v_lesson_10_id, 'timeline_events', 'الأحداث الرئيسية (628–630م)', '1. صلح الحديبية (628م): هدنة عشر سنوات وعمرة قضاء في العام التالي
2. سمّاه الله فتحاً مبيناً، فدخل الناس في الإسلام أفواجاً
3. أرسل رسائل إلى هرقل وكسرى والنجاشي والمقوقس يدعوهم للإسلام
4. فتح مكة (630م) بعشرة آلاف مقاتل، دخلها بلا قتال
5. تحطيم الأصنام من حول الكعبة وقال: ﴿جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ﴾
6. أعلن العفو العام عن أهل مكة: اذهبوا فأنتم الطلقاء
7. فتح خيبر (628م): حصون اليهود فُتحت وبقيت بعض القبائل على عهد حتى جُلّيَت في عهد عمر
8. إرسال رسائل الإسلام إلى هرقل وكسرى والمقوقس وملك غسان، بعثات دبلوماسية موسّعة', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('حجة الوداع', 'أدّى النبي ﷺ فريضة الحج وألقى خطبته الجامعة في عرفات بين مئة ألف من الصحابة. وأُنزل في ذلك اليوم العظيم: ﴿الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ﴾.', 'سيرة', (SELECT id FROM categories WHERE slug = 'wafah-nabawiyya'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:farewell')
  RETURNING id INTO v_lesson_11_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_11_id, 11, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_11_id, 'body', 'ملخص المرحلة', 'أدّى النبي ﷺ فريضة الحج وألقى خطبته الجامعة في عرفات بين مئة ألف من الصحابة. وأُنزل في ذلك اليوم العظيم: ﴿الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ﴾.', 1),
    (v_lesson_11_id, 'objectives', 'الموضوعات', 'حجة الوداع — خطبة عرفة — اكتمال الدين', 2),
    (v_lesson_11_id, 'timeline_events', 'الأحداث الرئيسية (السنة العاشرة، 632م)', '1. خرج في ذي القعدة سنة عشر بنحو مئة ألف وأربعة وعشرين ألفاً
2. أدّى مناسك الحج ووقف في عرفات يوم التاسع من ذي الحجة
3. ألقى خطبته العظيمة: حرمة الدماء والأموال والأعراض محفوظة
4. نزل: ﴿الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي﴾
5. أوصى بكتاب الله وسنته: تركت فيكم ما إن تمسكتم به لن تضلوا
6. سأل الصحابة: أبلّغت؟ فقالوا: نعم، فقال: اللهم اشهد', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الوفاة', 'مرض النبي ﷺ في أواخر صفر سنة إحدى عشرة، وانتقل إلى الرفيق الأعلى في الثاني عشر من ربيع الأول. دُفن في حجرة عائشة رضي الله عنها بالمدينة المنورة.', 'سيرة', (SELECT id FROM categories WHERE slug = 'wafah-nabawiyya'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:death')
  RETURNING id INTO v_lesson_12_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_12_id, 12, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_12_id, 'body', 'ملخص المرحلة', 'مرض النبي ﷺ في أواخر صفر سنة إحدى عشرة، وانتقل إلى الرفيق الأعلى في الثاني عشر من ربيع الأول. دُفن في حجرة عائشة رضي الله عنها بالمدينة المنورة.', 1),
    (v_lesson_12_id, 'objectives', 'الموضوعات', 'مرضه ﷺ الأخير — وفاته ودفنه — الحزن العظيم', 2),
    (v_lesson_12_id, 'timeline_events', 'الأحداث الرئيسية (السنة الحادية عشرة، 632م)', '1. بدأ مرضه ﷺ في صفر سنة إحدى عشرة بعد رحلة للبقيع
2. أمّ الناس في صلاته وهو مريض حتى آخر أيامه
3. انتقل إلى الرفيق الأعلى فجر الإثنين 12 ربيع الأول الساعة الثالثة
4. أعلن أبو بكر: «من كان يعبد محمداً فإن محمداً قد مات»
5. دُفن في حجرة عائشة ﷢ حيث قُبض، الحجرة المدفن الشريف
6. بكى الصحابة بكاءً شديداً، وكان عمره ثلاثة وستين عاماً', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية، ابن هشام', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'البداية والنهاية، ابن كثير', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'زاد المعاد في هدي خير العباد، ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'الرحيق المختوم، صفي الرحمن المباركفوري', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية الصحيحة، أكرم ضياء العمري', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'نور اليقين في سيرة سيد المرسلين، محمد الخضري بك', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'فقه السيرة، محمد الغزالي', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'شخصية النبي ﷺ، ابن تيمية', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد', 10);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي', 11);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي', 12);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية الشريفة، محمد أبو شهبة', 13);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء', 14);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية المختصرة، أحمد مبارك البغدادي', 15);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة', 16);

  RAISE NOTICE 'زُرعت سلسلة السيرة الكاملة: % مرحلة، % استشهاد لكل مرحلة', 12, 16;
END $$;
