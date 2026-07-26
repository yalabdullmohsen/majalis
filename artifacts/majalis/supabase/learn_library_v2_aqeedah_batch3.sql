-- دفعة 3: دروس للتصنيفات المنشورة تحت العقيدة بلا محتوى سابق
-- iman-billah / aqsam-tawheed / nawaqid-islam / aqeedat-ahl-sunnah
-- Idempotent عبر slug + عنوان الدرس. لا UUIDs ثابتة.
DO $$
DECLARE
  v_cat uuid;
  v_lesson uuid;
BEGIN
  -- 1) الإيمان بالله
  SELECT id INTO v_cat FROM categories WHERE slug = 'iman-billah';
  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'الإيمان بالله'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES (
      'الإيمان بالله',
      'الركن الأول: الإيمان بوجود الله وربوبيته وألوهيته وأسمائه وصفاته على منهج السلف',
      v_cat, 'درس', 'approved'
    ) RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'حقيقة الإيمان بالله',
     'الإيمان بالله هو التصديق الجازم بوجوده سبحانه، والإقرار بربوبيته: أنه الخالق الرازق المدبّر وحده، وبألوهيته: أنه المستحق وحده لجميع أنواع العبادة، وبأسمائه وصفاته الواردة في الكتاب والسنة على الوجه اللائق به بلا تحريف ولا تعطيل ولا تكييف ولا تمثيل.', 1),
    (v_lesson, 'evidence', 'أدلته',
     'قال تعالى: ﴿فَاعْلَمْ أَنَّهُ لَا إِلَٰهَ إِلَّا اللَّهُ﴾ (محمد: 19)، وقال: ﴿اللَّهُ خَالِقُ كُلِّ شَيْءٍ﴾ (الزمر: 62)، وقال: ﴿لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ الْبَصِيرُ﴾ (الشورى: 11). وفي حديث جبريل: «أن تؤمن بالله…» (رواه مسلم).', 2),
    (v_lesson, 'terms', 'مصطلحات',
     'الربوبية: توحيد الخلق والملك والتدبير. الألوهية: توحيد العبادة والقصد. الأسماء والصفات: إثبات ما أثبته الله لنفسه ورسوله من غير تمثيل ولا تعطيل.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'العقيدة الواسطية — شيخ الإسلام ابن تيمية', 1),
    (v_lesson, 'book', 'شرح العقيدة الواسطية — محمد بن صالح العثيمين', 2);
  END IF;

  -- 2) أقسام التوحيد الثلاثة
  SELECT id INTO v_cat FROM categories WHERE slug = 'aqsam-tawheed';
  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'أقسام التوحيد الثلاثة'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES (
      'أقسام التوحيد الثلاثة',
      'توحيد الربوبية وتوحيد الألوهية وتوحيد الأسماء والصفات؛ تقسيم اصطلاحي يخدم البيان لا يزيد على الوحي',
      v_cat, 'درس', 'approved'
    ) RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'التقسيم وحكمة ذكره',
     'قسّم أهل العلم التوحيد اصطلاحًا إلى ثلاثة: توحيد الربوبية، وتوحيد الألوهية، وتوحيد الأسماء والصفات. وهذا التقسيم مستنبط من استقراء النصوص، يُعين على ضبط مسائل التوحيد والشرك، وليس وحيًا منزلًا بلفظه.', 1),
    (v_lesson, 'evidence', 'معاني الأقسام',
     'توحيد الربوبية: إفراد الله بالخلق والملك والتدبير. توحيد الألوهية: إفراده بجميع العبادة، وهو مضمون لا إله إلا الله. توحيد الأسماء والصفات: الإيمان بما سمّى به نفسه ووصف به نفسه في كتابه وسنة رسوله على منهج السلف. وأكثر من أشرك من الأمم أقرّ بالربوبية وكفر بالألوهية، كما في قوله تعالى: ﴿وَلَئِن سَأَلْتَهُم مَّنْ خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ لَيَقُولُنَّ اللَّهُ﴾ (لقمان: 25).', 2),
    (v_lesson, 'terms', 'تنبيه',
     'لا يكفي الإقرار بالربوبية للنجاة دون توحيد العبادة. والأسماء والصفات باب توقيفي: لا يُسمّى الله ولا يُوصف إلا بما ورد.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'فتح المجيد شرح كتاب التوحيد — عبد الرحمن بن حسن آل الشيخ', 1),
    (v_lesson, 'book', 'القول المفيد على كتاب التوحيد — ابن عثيمين', 2);
  END IF;

  -- 3) نواقض الإسلام
  SELECT id INTO v_cat FROM categories WHERE slug = 'nawaqid-islam';
  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'نواقض الإسلام — مدخل منضبط'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES (
      'نواقض الإسلام — مدخل منضبط',
      'بيان أن الإسلام ينتقض بأعمال وأقوال واعتقادات معلومة، مع ضوابط التكفير وعدم تكفير المعيّن بلا شروط',
      v_cat, 'درس', 'approved'
    ) RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'معنى الناقض',
     'نواقض الإسلام أمور إذا وقع فيها المسلم خرج من دائرة الإسلام، كالشرك الأكبر، والجحد لما عُلم من الدين بالضرورة بعد قيام الحجة، والاستهزاء بالله أو رسوله أو دينه. ويُرجع في تفصيلها إلى تقريرات أهل العلم المعتمدة مع ضبط الشروط والموانع.', 1),
    (v_lesson, 'evidence', 'ضوابط مهمة',
     'لا يُكفَّر المعيَّن إلا بعد تحقق الشروط وانتفاء الموانع: العلم، ورفع الجهل، وانتفاء الإكراه، وانتفاء التأويل السائغ عند أهله. قال تعالى: ﴿إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ وَيَغْفِرُ مَا دُونَ ذَٰلِكَ لِمَن يَشَاءُ﴾ (النساء: 48). والتكفير حكم شرعي خطير ليس بابًا للتشفّي أو التصنيف المعاصر.', 2),
    (v_lesson, 'terms', 'تحذير',
     'يُمنع تكفير المعيّنين والجماعات المعاصرة من غير أهل العلم الراسخين، ويُكتفى ببيان نواقض الإسلام علميًا مع شروط التكفير وموانعه.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'نواقض الإسلام — محمد بن عبد الوهاب، مع شروح ابن عثيمين والفوزان', 1),
    (v_lesson, 'book', 'شرح العقيدة الطحاوية — ابن أبي العز', 2);
  END IF;

  -- 4) عقيدة أهل السنة والجماعة
  SELECT id INTO v_cat FROM categories WHERE slug = 'aqeedat-ahl-sunnah';
  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'عقيدة أهل السنة والجماعة — معالم المنهج'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES (
      'عقيدة أهل السنة والجماعة — معالم المنهج',
      'أصول اعتقاد أهل السنة: مصدر التلقي، الإيمان، الصفات، الصحابة، القدر، والوسطية بين الفرق',
      v_cat, 'درس', 'approved'
    ) RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'معالم المنهج',
     'أهل السنة والجماعة هم من كان على مثل ما كان عليه النبي ﷺ وأصحابه في الاعتقاد والعمل. يعتمدون الكتاب والسنة بفهم السلف، ويُثبتون الصفات بلا تمثيل ولا تعطيل، ويؤمنون بأن الإيمان قول وعمل يزيد وينقص، ويكفّون عما شجر بين الصحابة مع الترضّي عنهم جميعًا، ويتوسّطون بين الخوارج والمرجئة في باب الأسماء والأحكام.', 1),
    (v_lesson, 'evidence', 'أدلة المنهج',
     'قال تعالى: ﴿فَإِنْ آمَنُوا بِمِثْلِ مَا آمَنتُم بِهِ فَقَدِ اهْتَدَوا﴾ (البقرة: 137)، وقال ﷺ: «عليكم بسنتي وسنة الخلفاء الراشدين المهديين من بعدي» (رواه أبو داود والترمذي، وحسّنه الترمذي وصححه جمع من أهل العلم). ومن جوامع تقرير هذا المنهج: العقيدة الواسطية لابن تيمية، وشرح الطحاوية لابن أبي العز.', 2),
    (v_lesson, 'terms', 'الجماعة',
     'الجماعة هنا: جماعة المسلمين على الحق، لا مجرّد الاجتماع العددي على الباطل.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'العقيدة الواسطية — ابن تيمية', 1),
    (v_lesson, 'book', 'شرح العقيدة الطحاوية — ابن أبي العز', 2),
    (v_lesson, 'book', 'لمعة الاعتقاد — ابن قدامة', 3);
  END IF;

  UPDATE categories SET status = 'published', updated_at = now()
  WHERE slug IN ('iman-billah', 'aqsam-tawheed', 'nawaqid-islam', 'aqeedat-ahl-sunnah');
END $$;
