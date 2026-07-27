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
  VALUES ('النسب والمولد', 'وُلد النبي ﷺ بمكة في عام الفيل من نسب هاشمي قرشي إلى إسماعيل عليه السلام. وفي العام نفسه حفظ الله البيت من أبرهة. واختلف أهل السيرة في تعيين يوم المولد، فلا يُبنى على يومٍ بعينه عبادة لم تُشرع.', 'سيرة', (SELECT id FROM categories WHERE slug = 'mawlid-nashaa'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:lineage-birth')
  RETURNING id INTO v_lesson_1_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_1_id, 1, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_1_id, 'body', 'ملخص المرحلة', 'وُلد النبي ﷺ بمكة في عام الفيل من نسب هاشمي قرشي إلى إسماعيل عليه السلام. وفي العام نفسه حفظ الله البيت من أبرهة. واختلف أهل السيرة في تعيين يوم المولد، فلا يُبنى على يومٍ بعينه عبادة لم تُشرع.', 1),
    (v_lesson_1_id, 'objectives', 'الموضوعات', 'نسبه الشريف ﷺ — مولده في مكة — حادثة الفيل', 2),
    (v_lesson_1_id, 'timeline_events', 'الأحداث الرئيسية (عام الفيل، 571م)', '1. وُلد ﷺ يوم الاثنين في عام الفيل. واختلف أهل السيرة في تحديد يوم وشهر مولده — والمشهور 12 ربيع الأول؛ ولا يُبنى على يومٍ بعينه عبادةٌ لم تُشرع
2. نسبه: محمد بن عبد الله بن عبد المطلب من بني هاشم، قريش، إلى إسماعيل عليه السلام
3. توفي والده عبد الله وأمّه حاملٌ به على المشهور في كتب السيرة — وفي بعض الروايات خلافٌ يسير في التوقيت
4. في العام نفسه: قصة أصحاب الفيل وحفظ البيت، كما في سورة الفيل والأخبار التاريخية المشهورة', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_1_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الطفولة والرضاعة', 'نشأ ﷺ يتيماً: أرضعته حليمة السعدية، وتوفيت أمه وهو صغير، فكفله عبد المطلب ثم أبو طالب. وفي هذه المرحلة تظهر آثار الحفظ الإلهي والتربية في كنف قريش قبل البعثة.', 'سيرة', (SELECT id FROM categories WHERE slug = 'mawlid-nashaa'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:childhood')
  RETURNING id INTO v_lesson_2_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_2_id, 2, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_2_id, 'body', 'ملخص المرحلة', 'نشأ ﷺ يتيماً: أرضعته حليمة السعدية، وتوفيت أمه وهو صغير، فكفله عبد المطلب ثم أبو طالب. وفي هذه المرحلة تظهر آثار الحفظ الإلهي والتربية في كنف قريش قبل البعثة.', 1),
    (v_lesson_2_id, 'objectives', 'الموضوعات', 'رضاعته عند حليمة — يتمه ﷺ — كفالة جده وعمه', 2),
    (v_lesson_2_id, 'timeline_events', 'الأحداث الرئيسية (571–576م)', '1. أرضعته ثويبة مولاة أبي لهب أياماً ثم أُرسل إلى بني سعد للرضاعة — على ما اشتهر في المغازي
2. أرضعته حليمة السعدية من بني سعد، وذكر أهل السيرة بركةً في قومها بسببه
3. شقّ الصدر في طفولته ثابتٌ في الصحيح من حديث أنس؛ ويُفرَّق بينه وبين ما يُروى في المعراج
4. توفيت أمه آمنة بنت وهب وهو صغير — والمشهور عند الأبواء في الطريق من المدينة
5. كفله جده عبد المطلب ثم توفي وهو صبي، فآل الأمر إلى عمه أبي طالب
6. ربّاه أبو طالب وحماه في مكة حتى البعثة وما بعدها', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_2_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الشباب قبل البعثة', 'عُرف بالصادق الأمين، وشارك في حلف الفضول، وتاجر، وتزوج خديجة رضي الله عنها، وكان يتحنث في حراء. وعمر خديجة عند الزواج مما اختلف فيه، ولا يثبت تحديده بحديث صحيح، ورواية بحيرا تاريخية تحتاج تمحيص التفاصيل.', 'سيرة', (SELECT id FROM categories WHERE slug = 'arab-qabl-islam'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:youth')
  RETURNING id INTO v_lesson_3_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_3_id, 3, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_3_id, 'body', 'ملخص المرحلة', 'عُرف بالصادق الأمين، وشارك في حلف الفضول، وتاجر، وتزوج خديجة رضي الله عنها، وكان يتحنث في حراء. وعمر خديجة عند الزواج مما اختلف فيه، ولا يثبت تحديده بحديث صحيح، ورواية بحيرا تاريخية تحتاج تمحيص التفاصيل.', 1),
    (v_lesson_3_id, 'objectives', 'الموضوعات', 'الصادق الأمين — حلف الفضول — زواجه من خديجة ﷢ — تحنّثه في حراء', 2),
    (v_lesson_3_id, 'timeline_events', 'الأحداث الرئيسية (576–610م)', '1. سافر مع عمه إلى الشام، وتذكر بعض الروايات التاريخية ملاحظة الراهب بحيرا لعلامات النبوة عليه (رواية تاريخية، تفاصيلها المطوَّلة تحتاج تحقيقًا)
2. لقّبه أهل مكة «الصادق الأمين» لأمانته وصدقه
3. شارك في حلف الفضول لنصرة المظلوم وقال: لو دُعيت إليه في الإسلام لأجبت
4. تزوج خديجة بنت خويلد وعمره 25، والمشهور أنها كانت في الأربعين وقيل دون ذلك ولا يثبت في تحديد عمرها حديث صحيح
5. أنجب منها: القاسم والزينب ورقية وأم كلثوم وفاطمة وعبد الله
6. كان يتحنث في غار حراء كل عام في رمضان قبيل البعثة
7. أعاد وضع الحجر الأسود مكانه عام 605م دون إراقة دماء: جعل الزعماء يحملونه معاً على ثوب بيده الشريفة', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_3_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('البعثة', 'نزل جبريل عليه السلام في غار حراء بأوائل العلق، فكانت بداية الرسالة الخاتمة. ثبتته خديجة، وأرشدها ورقة بن نوفل إلى حقيقة الوحي. ثم كانت فترة الوحي ثم عودته، فبدأ طور النبوة والبلاغ.', 'سيرة', (SELECT id FROM categories WHERE slug = 'bitha-dawa-sirriyya'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:prophethood')
  RETURNING id INTO v_lesson_4_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_4_id, 4, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_4_id, 'body', 'ملخص المرحلة', 'نزل جبريل عليه السلام في غار حراء بأوائل العلق، فكانت بداية الرسالة الخاتمة. ثبتته خديجة، وأرشدها ورقة بن نوفل إلى حقيقة الوحي. ثم كانت فترة الوحي ثم عودته، فبدأ طور النبوة والبلاغ.', 1),
    (v_lesson_4_id, 'objectives', 'الموضوعات', 'نزول الوحي الأول — غار حراء — أوائل المؤمنين', 2),
    (v_lesson_4_id, 'timeline_events', 'الأحداث الرئيسية (610م)', '1. نزول جبريل في غار حراء بأوائل العلق: ﴿اقْرَأْ بِاسْمِ رَبِّكَ﴾
2. رجع ﷺ يرتجف فدثّرته خديجة وقالت: والله لا يخزيك الله أبداً
3. ذهب به إلى ورقة بن نوفل الذي أخبره بحقيقة الوحي وبشّره
4. فترة انقطاع الوحي (الفترة) ثم عودته بسورة المدثر
5. أول من آمن من النساء خديجة ﷢ باتفاق؛ واختلف أهل العلم في ترتيب أوائل الرجال بين عليّ وأبي بكر وزيد رضي الله عنهم بحسب قيد «الحرّ/الصبي/العبد»', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_4_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الدعوة السرية', 'بدأت الدعوة سرًّا بين الأهل والمقربين، فأسلم السابقون كخديجة وعلي وأبي بكر وزيد رضي الله عنهم، واجتمع المسلمون في دار الأرقم. والتدرج هنا فقه دعوي يحفظ الدعوة والمستضعفين قبل الجهر.', 'سيرة', (SELECT id FROM categories WHERE slug = 'bitha-dawa-sirriyya'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:secret-dawah')
  RETURNING id INTO v_lesson_5_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_5_id, 5, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_5_id, 'body', 'ملخص المرحلة', 'بدأت الدعوة سرًّا بين الأهل والمقربين، فأسلم السابقون كخديجة وعلي وأبي بكر وزيد رضي الله عنهم، واجتمع المسلمون في دار الأرقم. والتدرج هنا فقه دعوي يحفظ الدعوة والمستضعفين قبل الجهر.', 1),
    (v_lesson_5_id, 'objectives', 'الموضوعات', 'الدعوة في السر — أوائل المسلمين — الهجرة إلى الحبشة', 2),
    (v_lesson_5_id, 'timeline_events', 'الأحداث الرئيسية (610–613م)', '1. دخل دار الأرقم بن أبي الأرقم مقراً للتعليم السري
2. أسلم عثمان بن عفان والزبير وطلحة وسعد وأبو عبيدة
3. الهجرة الأولى إلى الحبشة في نفرٍ قليل — وتختلف الروايات في العدد الدقيق
4. الهجرة الثانية بعد اشتداد الأذى، في جمعٍ أكبر على ما اشتهر في المغازي
5. أحسن النجاشي وفادة المهاجرين ورفض تسليمهم لقريش — والخبر ثابت المعنى في السيرة الصحيحة
6. أسلم عبد الله بن مسعود في مرحلة مبكرة، وروى أهل السيرة سماعه القرآن وهو يرعى
7. في مواسم الحج ظهرت بوادر بيعة الأوس والخزرج قبل الهجرة — والتفصيل في مرحلة الهجرة', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_5_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الدعوة الجهرية', 'جهر النبي ﷺ بالدعوة على الصفا، فاشتد أذى قريش، وهاجر المستضعفون إلى الحبشة، وحُصر بنو هاشم في شعب أبي طالب. وقصة الأرضة في صحيفة المقاطعة من المراسيل عند أهل النقد، فتُذكر بحذر لا كخبرٍ مسند قاطع.', 'سيرة', (SELECT id FROM categories WHERE slug = 'dawa-jahriyya-makka'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:open-dawah')
  RETURNING id INTO v_lesson_6_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_6_id, 6, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_6_id, 'body', 'ملخص المرحلة', 'جهر النبي ﷺ بالدعوة على الصفا، فاشتد أذى قريش، وهاجر المستضعفون إلى الحبشة، وحُصر بنو هاشم في شعب أبي طالب. وقصة الأرضة في صحيفة المقاطعة من المراسيل عند أهل النقد، فتُذكر بحذر لا كخبرٍ مسند قاطع.', 1),
    (v_lesson_6_id, 'objectives', 'الموضوعات', 'الجهر بالدعوة — إيذاء قريش — الحصار في الشعب', 2),
    (v_lesson_6_id, 'timeline_events', 'الأحداث الرئيسية (613–619م)', '1. نزل: ﴿فَاصْدَعْ بِمَا تُؤْمَرُ﴾ فصعد الصفا ونادى قريشاً
2. عرض على قبائل العرب في موسم الحج الإسلام
3. تعذيب بلال وعمار وخبّاب وسمية وياسر على الإيمان
4. إسلام حمزة بن عبد المطلب وعمر بن الخطاب كان تحولاً كبيراً
5. حصار المسلمين في شعب أبي طالب ثلاث سنوات، جوع وشدة شديدة
6. يُروى في كتب السيرة أن الأرضة أكلت صحيفة المقاطعة إلا ما كان من ذكر الله — ويُذكر بتحفّظ لأنه من مراسيل السيرة لا من الصحيح المسند', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_6_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('عام الحزن والإسراء', 'توفيت خديجة وأبو طالب في عامٍ واحد سُمّي عام الحزن، ثم كان الإسراء إلى المسجد الأقصى والمعراج تثبيتاً للنبي ﷺ، وفيه فرضت الصلاة. فالابتلاء والتكريم يجتمعان في تربية الأنبياء.', 'سيرة', (SELECT id FROM categories WHERE slug = 'dawa-jahriyya-makka'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:year-of-sorrow')
  RETURNING id INTO v_lesson_7_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_7_id, 7, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_7_id, 'body', 'ملخص المرحلة', 'توفيت خديجة وأبو طالب في عامٍ واحد سُمّي عام الحزن، ثم كان الإسراء إلى المسجد الأقصى والمعراج تثبيتاً للنبي ﷺ، وفيه فرضت الصلاة. فالابتلاء والتكريم يجتمعان في تربية الأنبياء.', 1),
    (v_lesson_7_id, 'objectives', 'الموضوعات', 'وفاة خديجة ﷢ — وفاة أبي طالب — الإسراء والمعراج', 2),
    (v_lesson_7_id, 'timeline_events', 'الأحداث الرئيسية (619–620م)', '1. وفاة خديجة ﷢ بعد خمسة وعشرين عاماً من الوفاء والنصرة
2. وفاة أبي طالب الذي ظل درعاً حامياً للنبي ﷺ من قريش
3. خروجه إلى الطائف يطلب النصرة، رفضوه وأُذوا وجُرح
4. الإسراء: رحلة ليلية من المسجد الحرام إلى المسجد الأقصى
5. المعراج: صعوده إلى السماوات ومقابلة الأنبياء وفرض الصلوات
6. كانت خمسين صلاة فراجع حتى صارت خمساً في الفعل وخمسين في الأجر', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_7_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الهجرة إلى المدينة', 'أذن الله بالهجرة إلى يثرب، فخرج ﷺ مع أبي بكر، وآويا إلى غار ثور، ثم وصل المدينة فبنى المسجد وآخى بين المهاجرين والأنصار، ووضع وثيقة المدينة. والهجرة تحول من الاستضعاف إلى تأسيس مجتمع الرسالة.', 'سيرة', (SELECT id FROM categories WHERE slug = 'hijra'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:hijra')
  RETURNING id INTO v_lesson_8_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_8_id, 8, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_8_id, 'body', 'ملخص المرحلة', 'أذن الله بالهجرة إلى يثرب، فخرج ﷺ مع أبي بكر، وآويا إلى غار ثور، ثم وصل المدينة فبنى المسجد وآخى بين المهاجرين والأنصار، ووضع وثيقة المدينة. والهجرة تحول من الاستضعاف إلى تأسيس مجتمع الرسالة.', 1),
    (v_lesson_8_id, 'objectives', 'الموضوعات', 'مغادرة مكة — الوصول للمدينة — بناء المسجد النبوي — الأخوّة بين المهاجرين والأنصار', 2),
    (v_lesson_8_id, 'timeline_events', 'الأحداث الرئيسية (622م)', '1. بيعة العقبة الثانية مع 73 رجلاً وامرأتين من الأنصار
2. خرج ﷺ مع أبي بكر ليلاً ومكثا في غار ثور ثلاثة أيام
3. وصل المدينة فاستقبله أهلها بالتهليل والفرح
4. بنى مسجد قباء ثم المسجد النبوي بيده الشريفة
5. عقد المؤاخاة بين المهاجرين والأنصار، أخوة الإسلام
6. وضع وثيقة المدينة، وهي من أوائل الوثائق السياسية المكتوبة في التاريخ الإسلامي', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_8_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الغزوات الكبرى', 'شهدت المرحلة غزوات بدر وأحد والخندق وغيرها؛ وفيها نصر وابتلاء، وشورى وصبر. والجهاد هنا حماية للدعوة والأمة لا طلبًا للدنيا، ويُقرأ في ضوء مقاصد الشريعة وأخلاق النبي ﷺ.', 'سيرة', (SELECT id FROM categories WHERE slug = 'ahd-madani-ghazawat'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:ghazawat')
  RETURNING id INTO v_lesson_9_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_9_id, 9, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_9_id, 'body', 'ملخص المرحلة', 'شهدت المرحلة غزوات بدر وأحد والخندق وغيرها؛ وفيها نصر وابتلاء، وشورى وصبر. والجهاد هنا حماية للدعوة والأمة لا طلبًا للدنيا، ويُقرأ في ضوء مقاصد الشريعة وأخلاق النبي ﷺ.', 1),
    (v_lesson_9_id, 'objectives', 'الموضوعات', 'غزوة بدر الكبرى — غزوة أُحد — غزوة الأحزاب، الخندق', 2),
    (v_lesson_9_id, 'timeline_events', 'الأحداث الرئيسية (624–627م)', '1. بدر الكبرى (٢هـ/٦٢٤م): نصرٌ عظيم بأقلّ عددٍ على ما اشتهر في المغازي؛ والأعداد التقريبية مما تتداوله كتب السيرة
2. أُسر من المشركين وقُتل منهم عددٌ كبير في بدر، ونزلت أحكامٌ في الأسرى والفداء
3. أُحد (٣هـ): ابتلاءٌ بعد مخالفة الرماة؛ استُشهد عشرات الصحابة رضي الله عنهم
4. جُرح النبي ﷺ في أُحد، وثبت صبره وثباته مع أصحابه
5. الخندق/الأحزاب (٥هـ): حصار المدينة بجمعٍ عظيم من الأحزاب
6. حفر الخندق بمشورة سلمان الفارسي، ثم فرّق الله الأحزاب بعد الشدة
7. بنو قينقاع (٢هـ): نقضوا العهد فجُلّوا من المدينة على ما قرّره أهل المغازي
8. بنو النضير (٤هـ): نقضوا العهد فحُوصروا ثم جُلّوا — والتفاصيل في كتب السيرة المحرَّرة', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_9_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الحديبية وفتح مكة', 'كان صلح الحديبية فتحاً مبيناً رغم ظاهره، ثم كان فتح مكة سنة ٨هـ بعفوٍ عظيم. وفي ذلك فقه السياسة الشرعية: تقديم المصلحة العامة، وكسر دائرة الثأر، وضبط القوة بالرحمة.', 'سيرة', (SELECT id FROM categories WHERE slug = 'ahd-madani-ghazawat'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:hudaybiyya-mecca')
  RETURNING id INTO v_lesson_10_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_10_id, 10, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_10_id, 'body', 'ملخص المرحلة', 'كان صلح الحديبية فتحاً مبيناً رغم ظاهره، ثم كان فتح مكة سنة ٨هـ بعفوٍ عظيم. وفي ذلك فقه السياسة الشرعية: تقديم المصلحة العامة، وكسر دائرة الثأر، وضبط القوة بالرحمة.', 1),
    (v_lesson_10_id, 'objectives', 'الموضوعات', 'صلح الحديبية — فتح مكة — العفو العام', 2),
    (v_lesson_10_id, 'timeline_events', 'الأحداث الرئيسية (628–630م)', '1. صلح الحديبية (٦هـ): هدنةٌ مهّدت لانتشار الدعوة؛ وعمرة القضاء في العام التالي
2. سمّاه الله فتحاً مبيناً، فدخل الناس في الإسلام أفواجاً بعد الصلح
3. كُتبت رسائل دعوة إلى ملوك الأمصار (هرقل وكسرى والنجاشي والمقوقس وغيرهم) على ما ثبت في المغازي
4. فتح مكة (٨هـ) في جمعٍ كبير، ودخلها ﷺ بأقلّ قتال
5. حُطّمت الأصنام حول الكعبة، وتُليت: ﴿جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ﴾
6. أعلن العفو عن أهل مكة: «اذهبوا فأنتم الطلقاء» — على ما اشتهر في السيرة
7. فتح خيبر (٧هـ): فُتحت الحصون، وبقي أهلها على عهدٍ ثم جُلّيَ من بقي في عهد عمر', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_10_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('حجة الوداع', 'حج النبي ﷺ حجة الوداع، وخطب في عرفات في جمع عظيم اختلفت الروايات في عدده، وأُنزل إكمال الدين. وألفاظ الوصية بالكتاب والسنة مما يُروى بوجوه؛ فيُذكر المعنى الثابت دون الجزم بصيغة لم تتحرر عند أهل الحديث.', 'سيرة', (SELECT id FROM categories WHERE slug = 'wafah-nabawiyya'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:farewell')
  RETURNING id INTO v_lesson_11_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_11_id, 11, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_11_id, 'body', 'ملخص المرحلة', 'حج النبي ﷺ حجة الوداع، وخطب في عرفات في جمع عظيم اختلفت الروايات في عدده، وأُنزل إكمال الدين. وألفاظ الوصية بالكتاب والسنة مما يُروى بوجوه؛ فيُذكر المعنى الثابت دون الجزم بصيغة لم تتحرر عند أهل الحديث.', 1),
    (v_lesson_11_id, 'objectives', 'الموضوعات', 'حجة الوداع — خطبة عرفة — اكتمال الدين', 2),
    (v_lesson_11_id, 'timeline_events', 'الأحداث الرئيسية (السنة العاشرة، 631م)', '1. خرج في ذي القعدة سنة عشر في جمعٍ عظيم اختلفت الروايات في تقدير عدده
2. أدّى مناسك الحج ووقف في عرفات يوم التاسع من ذي الحجة
3. ألقى خطبته العظيمة: حرمة الدماء والأموال والأعراض محفوظة
4. نزل: ﴿الْيَوْمَ أَكْمَلْتُ لَكُمْ دِينَكُمْ وَأَتْمَمْتُ عَلَيْكُمْ نِعْمَتِي﴾
5. أوصى بالاعتصام بكتاب الله كما في الصحيح؛ وأما لفظ «كتاب الله وسنتي» فمروي بطرق تُضعَّف عند كثير من أهل الحديث
6. سأل الصحابة: أبلّغت؟ فقالوا: نعم، فقال: اللهم اشهد', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_11_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  INSERT INTO lessons (title, description, category, category_id, activity_type, is_course, status, delivery, external_key)
  VALUES ('الوفاة', 'مرض النبي ﷺ في أواخر صفر سنة ١١هـ، وانتقل إلى الرفيق الأعلى في ربيع الأول — والمشهور ١٢ منه مع خلاف في التعيين — ودُفن في حجرة عائشة رضي الله عنها. فبشريته ﷺ ظاهرة، ورسالته قد كملت، وثبّت أبو بكر الناس بكلمة الحق.', 'سيرة', (SELECT id FROM categories WHERE slug = 'wafah-nabawiyya'), 'قراءة', false, 'approved', 'قراءة ذاتية', 'seerah-kamila:death')
  RETURNING id INTO v_lesson_12_id;

  INSERT INTO series_lessons (series_id, lesson_id, sort_order, is_required) VALUES (v_series_id, v_lesson_12_id, 12, true);
  INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson_12_id, 'body', 'ملخص المرحلة', 'مرض النبي ﷺ في أواخر صفر سنة ١١هـ، وانتقل إلى الرفيق الأعلى في ربيع الأول — والمشهور ١٢ منه مع خلاف في التعيين — ودُفن في حجرة عائشة رضي الله عنها. فبشريته ﷺ ظاهرة، ورسالته قد كملت، وثبّت أبو بكر الناس بكلمة الحق.', 1),
    (v_lesson_12_id, 'objectives', 'الموضوعات', 'مرضه ﷺ الأخير — وفاته ودفنه — الحزن العظيم', 2),
    (v_lesson_12_id, 'timeline_events', 'الأحداث الرئيسية (السنة الحادية عشرة، 632م)', '1. بدأ مرضه ﷺ في صفر سنة إحدى عشرة بعد رحلة للبقيع
2. صلّى بالناس في مرضه، ثم أمر أبا بكر أن يؤمهم في أيامه الأخيرة
3. انتقل إلى الرفيق الأعلى ضحى يوم الإثنين في ربيع الأول سنة ١١هـ — والمشهور تعيين ١٢ منه مع خلاف بين أهل السيرة
4. أعلن أبو بكر: «من كان يعبد محمداً فإن محمداً قد مات»
5. دُفن في حجرة عائشة ﷢ في الموضع الذي قُبض فيه
6. بكى الصحابة بكاءً شديداً، وكان عمره ثلاثة وستين عاماً', 3);

  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية — ابن هشام (بعد تمحيص ما رواه عن ابن إسحاق)', 1);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'الطبقات الكبرى — ابن سعد', 2);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'زاد المعاد في هدي خير العباد — ابن القيم', 3);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'البداية والنهاية — ابن كثير (مع الحذر مما أورده من الواهي)', 4);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية — الذهبي', 5);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'الشفا بتعريف حقوق المصطفى — القاضي عياض', 6);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية الصحيحة — أكرم ضياء العمري', 7);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'مصادر السيرة النبوية وتقويمها — فاروق حمادة', 8);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'السيرة النبوية في ضوء المصادر الأصلية — مهدي رزق الله أحمد', 9);
  INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES (v_lesson_12_id, 'book', 'الرحيق المختوم — المباركفوري (عرض مبسّط معاصر يُستأنس به مع الرجوع للأصول)', 10);

  RAISE NOTICE 'زُرعت سلسلة السيرة الكاملة: % مرحلة، % استشهاد لكل مرحلة', 12, 10;
END $$;
