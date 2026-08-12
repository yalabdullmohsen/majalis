-- الدفعة الثانية من ملء محتوى تصنيفات "تعلّم" الفارغة (status='draft') تحت
-- "العقيدة والتوحيد" (aqeedah-tawheed). تغطي عنقوداً متماسكاً من 10 تصنيفات:
-- أركان الإيمان الستة (مدخل إلى العقيدة + الملائكة + الكتب + الرسل + اليوم
-- الآخر + القدر) بالإضافة إلى معنى العبادة والشرك وأنواعه والكفر والنفاق
-- والولاء والبراء — كل تصنيف يحصل على درس واحد حقيقي (lessons +
-- lesson_sections + lesson_citations) مبني على تعريفات عقدية مستقرة عند أهل
-- السنة (لا مسائل خلافية)، مع استشهاد قرآني محلي محقَّق حرفياً من
-- public/data/quran لكل درس، وحديث جبريل المشهور (متفق عليه) عند الحاجة.
-- بند الولاء والبراء عُرض بضابطه القرآني المعتدل (الممتحنة: 8) لا بتعميم أو
-- تحريض. idempotent (حارس NOT EXISTS بالعنوان+التصنيف) ثم status='published'
-- للتصنيفات العشرة.
DO $$
DECLARE
  v_lesson uuid;
BEGIN
  -- 1) مدخل إلى العقيدة
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='3bc32e4a-8880-4bf5-a936-03fd7dd9c756' AND title='مدخل إلى العقيدة') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('مدخل إلى العقيدة', 'تعريف العقيدة الإسلامية وأركانها الإجمالية ومصدرها الوحيد المعصوم', '3bc32e4a-8880-4bf5-a936-03fd7dd9c756', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريف العقيدة', 'العقيدة لغةً من "العَقْد" وهو الربط والإحكام، واصطلاحاً: الأمور التي يجزم بها القلب ويطمئن إليها يقيناً لا يمازجه شك، وأصلها الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره، كما بيَّن ذلك حديث جبريل عليه السلام المشهور حين سأل النبي ﷺ عن الإيمان فقال: «أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر، وتؤمن بالقدر خيره وشره» (رواه مسلم في صحيحه، كتاب الإيمان).', 1),
    (v_lesson, 'evidence', 'مصدرها ودليلها الإجمالي', 'مصدر العقيدة الإسلامية الوحي المعصوم وحده: القرآن الكريم والسنة النبوية الصحيحة، فلا مجال فيها للرأي أو الذوق أو القياس العقلي المجرَّد فيما أخبر الله ورسوله عنه من أمور الغيب. ومن أدلتها الإجمالية قوله تعالى: ﴿كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ﴾ (البقرة: 285).', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'لمعة الاعتقاد الهادي إلى سبيل الرشاد — الإمام موفق الدين ابن قدامة المقدسي', 1);
  END IF;

  -- 2) الإيمان بالملائكة
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='73d8e002-48a6-477e-891c-d070246b9a7b' AND title='الإيمان بالملائكة') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الإيمان بالملائكة', 'الركن الثاني من أركان الإيمان الستة: حقيقة الملائكة وصفاتهم وما يجب اعتقاده فيهم', '73d8e002-48a6-477e-891c-d070246b9a7b', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'حقيقتهم وصفاتهم', 'الملائكة عالَم غيبي خلقهم الله تعالى من نور، عباد مكرمون لا يعصون الله ما أمرهم ويفعلون ما يُؤمرون، لا يوصفون بذكورة ولا أنوثة ولا تلحقهم صفات البشر من أكل أو شرب أو نوم، خُلقوا لعبادة الله تعالى وتنفيذ أوامره.', 1),
    (v_lesson, 'evidence', 'مراتب الإيمان بهم ودليله', 'يشمل الإيمان بالملائكة: التصديق الجازم بوجودهم، والإيمان بمن عرفنا اسمه منهم كجبريل وميكائيل وإسرافيل، والإيمان بصفاتهم وأعمالهم التي أخبر بها الوحي كحمل العرش وتبليغ الوحي وقبض الأرواح. قال تعالى: ﴿كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ﴾ (البقرة: 285)، فقرن الإيمان بالملائكة بالإيمان بالله تعالى.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'لمعة الاعتقاد الهادي إلى سبيل الرشاد — ابن قدامة المقدسي', 1);
  END IF;

  -- 3) الإيمان بالكتب
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='c2f6af72-bbbb-4001-9316-e2e1d23ea7f9' AND title='الإيمان بالكتب') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الإيمان بالكتب', 'الركن الثالث من أركان الإيمان: التصديق بما أنزل الله من كتب على رسله', 'c2f6af72-bbbb-4001-9316-e2e1d23ea7f9', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه ومقتضاه', 'الإيمان بالكتب هو التصديق الجازم بأن الله تعالى أنزل على أنبيائه ورسله كتباً هي كلامه حقاً، فيها هداية للناس وحكم يفصل به بينهم. يشمل ذلك الإيمان إجمالاً بكل كتاب أنزله الله، وتفصيلاً بما سمَّاه منها كالتوراة والإنجيل والزبور والقرآن.', 1),
    (v_lesson, 'evidence', 'دليله ومكانة القرآن بينها', 'قال تعالى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا آمِنُوا بِاللَّهِ وَرَسُولِهِ وَالْكِتَابِ الَّذِي نَزَّلَ عَلَى رَسُولِهِ وَالْكِتَابِ الَّذِي أَنْزَلَ مِنْ قَبْلُ﴾ (النساء: 136). والقرآن الكريم هو آخر الكتب المنزَّلة والمهيمن على ما قبلها، تعبَّدنا الله بتلاوته والعمل بأحكامه إلى قيام الساعة، بخلاف الكتب السابقة التي طرأ عليها التبديل والتحريف كما أخبر الوحي.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'لمعة الاعتقاد الهادي إلى سبيل الرشاد — ابن قدامة المقدسي', 1);
  END IF;

  -- 4) الإيمان بالرسل
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='09d5b333-5c08-4d7f-a9b1-ef262fc416c7' AND title='الإيمان بالرسل') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الإيمان بالرسل', 'الركن الرابع من أركان الإيمان: التصديق برسالات الرسل جميعاً ومحمد ﷺ خاتمهم', '09d5b333-5c08-4d7f-a9b1-ef262fc416c7', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه', 'الإيمان بالرسل هو التصديق الجازم بأن الله تعالى أرسل إلى كل أمة رسولاً يدعوها إلى عبادته وحده لا شريك له وترك ما يُعبَد من دونه، وأن جميع الرسل صادقون مصدَّقون بلَّغوا رسالات ربهم كاملة غير منقوصة، وأن محمداً ﷺ خاتم النبيين لا نبي بعده.', 1),
    (v_lesson, 'evidence', 'رسالتهم الواحدة', 'اتفقت دعوة جميع الرسل على أصل واحد هو توحيد الله في عبادته، قال تعالى: ﴿وَمَا أَرْسَلْنَا مِنْ قَبْلِكَ مِنْ رَسُولٍ إِلَّا نُوحِي إِلَيْهِ أَنَّهُ لَا إِلَهَ إِلَّا أَنَا فَاعْبُدُونِ﴾ (الأنبياء: 25)، وإن اختلفت شرائعهم في التفاصيل بحسب أحوال أممهم وأزمانهم.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'لمعة الاعتقاد الهادي إلى سبيل الرشاد — ابن قدامة المقدسي', 1);
  END IF;

  -- 5) الإيمان باليوم الآخر
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='77f194a5-93ea-4c1b-a647-e6d5724f052c' AND title='الإيمان باليوم الآخر') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الإيمان باليوم الآخر', 'الركن الخامس من أركان الإيمان: التصديق بالبعث والحساب والجزاء', '77f194a5-93ea-4c1b-a647-e6d5724f052c', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه وما يشمله', 'الإيمان باليوم الآخر هو التصديق الجازم بكل ما أخبر الله به في كتابه وأخبر به رسوله ﷺ مما يكون بعد الموت، من فتنة القبر ونعيمه أو عذابه، والبعث، والحشر، والحساب، وتطاير الصحف، والميزان، والصراط، والجنة والنار.', 1),
    (v_lesson, 'evidence', 'دليله', 'قال تعالى: ﴿وَأَنَّ السَّاعَةَ آتِيَةٌ لَا رَيْبَ فِيهَا وَأَنَّ اللَّهَ يَبْعَثُ مَنْ فِي الْقُبُورِ﴾ (الحج: 7). والإيمان بهذا الركن له أثر عظيم في استقامة سلوك المسلم؛ إذ يستحضر أن كل عمل محاسَب عليه.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'لمعة الاعتقاد الهادي إلى سبيل الرشاد — ابن قدامة المقدسي', 1);
  END IF;

  -- 6) الإيمان بالقدر
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='48299cbf-d039-4fd2-aa0c-27a4e4d6fb0e' AND title='الإيمان بالقدر') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الإيمان بالقدر', 'الركن السادس من أركان الإيمان: التصديق بأن كل شيء بقضاء الله وقدره', '48299cbf-d039-4fd2-aa0c-27a4e4d6fb0e', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه ومراتبه', 'الإيمان بالقدر هو التصديق الجازم بأن كل ما يجري في الكون من خير وشر هو بعلم الله السابق وكتابته ومشيئته وخلقه. له أربع مراتب عند أهل السنة: العلم، والكتابة، والمشيئة، والخلق.', 1),
    (v_lesson, 'evidence', 'دليله وأثره', 'قال تعالى: ﴿إِنَّا كُلَّ شَيْءٍ خَلَقْنَاهُ بِقَدَرٍ﴾ (القمر: 49). والإيمان بالقدر لا يعني إسقاط الأخذ بالأسباب أو المسؤولية عن الاختيار، بل الجمع بين الإيمان بسبق علم الله وكتابته وبين كون العبد فاعلاً مختاراً يُحاسَب على كسبه.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'لمعة الاعتقاد الهادي إلى سبيل الرشاد — ابن قدامة المقدسي', 1);
  END IF;

  -- 7) معنى العبادة
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='bc3ac972-c8e0-4202-8a76-eedca6007139' AND title='معنى العبادة') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('معنى العبادة', 'تعريف العبادة الشرعي وشمولها لكل ما يحبه الله ويرضاه', 'bc3ac972-c8e0-4202-8a76-eedca6007139', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفها', 'العبادة اصطلاحاً كما عرَّفها شيخ الإسلام ابن تيمية: اسم جامع لكل ما يحبه الله ويرضاه من الأقوال والأعمال الظاهرة والباطنة، فهي أشمل من الشعائر التعبدية المحضة كالصلاة والصوم، لتشمل كل قول أو عمل يُقصد به وجه الله موافقاً لشرعه.', 1),
    (v_lesson, 'evidence', 'الغاية من الخلق وشروط قبولها', 'قال تعالى: ﴿وَمَا خَلَقْتُ الْجِنَّ وَالْإِنْسَ إِلَّا لِيَعْبُدُونِ﴾ (الذاريات: 56)، فبيَّنت الآية أن العبادة هي الغاية التي خُلق الخلق من أجلها، وشرط قبولها ركنان: الإخلاص لله وحده، والمتابعة لهدي النبي ﷺ.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'شرح العقيدة الواسطية — الشيخ محمد بن صالح العثيمين', 1);
  END IF;

  -- 8) الشرك وأنواعه
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='2810ca3c-3eae-4ead-b62c-6ce10f207c6e' AND title='الشرك وأنواعه') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الشرك وأنواعه', 'تعريف الشرك بالله وأقسامه الأكبر والأصغر', '2810ca3c-3eae-4ead-b62c-6ce10f207c6e', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه وخطورته', 'الشرك هو صرف شيء من خصائص الألوهية أو الربوبية أو الأسماء والصفات لغير الله تعالى. وهو أعظم الذنوب على الإطلاق؛ لأنه يناقض أصل التوحيد الذي خُلق الخلق من أجله.', 1),
    (v_lesson, 'evidence', 'أقسامه ودليله', 'ينقسم الشرك إلى: شرك أكبر يُخرج من الملة (كدعاء غير الله أو الذبح لغيره تقرباً)، وشرك أصغر لا يُخرج من الملة لكنه من كبائر الذنوب (كيسير الرياء والحلف بغير الله). قال تعالى: ﴿إِنَّ اللَّهَ لَا يَغْفِرُ أَنْ يُشْرَكَ بِهِ وَيَغْفِرُ مَا دُونَ ذَلِكَ لِمَنْ يَشَاءُ﴾ (النساء: 48)، وقال: ﴿إِنَّ الشِّرْكَ لَظُلْمٌ عَظِيمٌ﴾ (لقمان: 13).', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'شرح العقيدة الواسطية — الشيخ محمد بن صالح العثيمين', 1);
  END IF;

  -- 9) الكفر والنفاق
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='2f47ed0d-51eb-45f0-b581-387562af4ed1' AND title='الكفر والنفاق') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الكفر والنفاق', 'التفريق بين الكفر الصريح والنفاق الاعتقادي وصفات المنافقين', '2f47ed0d-51eb-45f0-b581-387562af4ed1', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريف الكفر والنفاق', 'الكفر هو الجحود والتكذيب بما عُلم من الدين بالضرورة بعد بلوغ الحجة. أما النفاق فهو إظهار الإسلام مع إبطان الكفر، وهو أشد خطراً من الكفر الصريح لما فيه من الخداع والغش.', 1),
    (v_lesson, 'evidence', 'صفات المنافقين ودليلها', 'قال تعالى: ﴿وَمِنَ النَّاسِ مَنْ يَقُولُ آمَنَّا بِاللَّهِ وَبِالْيَوْمِ الْآخِرِ وَمَا هُمْ بِمُؤْمِنِينَ يُخَادِعُونَ اللَّهَ وَالَّذِينَ آمَنُوا وَمَا يَخْدَعُونَ إِلَّا أَنْفُسَهُمْ وَمَا يَشْعُرُونَ﴾ (البقرة: 8-9)، ووصفهم في موضع آخر بقوله: ﴿يَأْمُرُونَ بِالْمُنْكَرِ وَيَنْهَوْنَ عَنِ الْمَعْرُوفِ وَيَقْبِضُونَ أَيْدِيَهُمْ نَسُوا اللَّهَ فَنَسِيَهُمْ﴾ (التوبة: 67).', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'شرح العقيدة الواسطية — الشيخ محمد بن صالح العثيمين', 1);
  END IF;

  -- 10) الولاء والبراء
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='e2f1f6cc-9ee5-421a-baeb-574ed72d086d' AND title='الولاء والبراء') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الولاء والبراء', 'أصل عقدي في التعامل: محبة أهل الإيمان وموالاتهم، والبراءة من الكفر والشرك لا من أشخاص الناس ظلماً', 'e2f1f6cc-9ee5-421a-baeb-574ed72d086d', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه', 'الولاء والبراء أصل عقدي معناه محبة أهل الإيمان ونصرتهم وموالاتهم، والبراءة من الكفر والشرك ومعاداتهما اعتقاداً، لا بمعنى الإساءة لعموم غير المسلمين أو ظلمهم؛ فالإسلام يفرِّق بين البراءة من الاعتقاد الباطل وبين حسن معاملة أصحابه ممن لا يُعادون المسلمين ولا يقاتلونهم.', 1),
    (v_lesson, 'evidence', 'ضابطه القرآني', 'قال تعالى: ﴿لَا يَنْهَاكُمُ اللَّهُ عَنِ الَّذِينَ لَمْ يُقَاتِلُوكُمْ فِي الدِّينِ وَلَمْ يُخْرِجُوكُمْ مِنْ دِيَارِكُمْ أَنْ تَبَرُّوهُمْ وَتُقْسِطُوا إِلَيْهِمْ إِنَّ اللَّهَ يُحِبُّ الْمُقْسِطِينَ﴾ (الممتحنة: 8)، فبيَّنت الآية أن أصل التعامل مع غير المحاربين هو البر والعدل، وإنما تُشرَع المعاداة لمن حارب المسلمين وأخرجهم من ديارهم كما في الآية التالية لها.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الولاء والبراء في الإسلام — د. محمد سعيد بن سالم القحطاني', 1);
  END IF;

  -- نشر التصنيفات العشرة بعد اكتمال محتواها الأساسي
  UPDATE categories SET status='published', updated_at=now()
  WHERE slug IN (
    'aqeedah-intro','iman-malaika','iman-kutub','iman-rusul','iman-yawm-akhir',
    'iman-qadar','mana-ibadah','shirk-anwauh','kufr-nifaq','wala-bara'
  ) AND status='draft';
END $$;
