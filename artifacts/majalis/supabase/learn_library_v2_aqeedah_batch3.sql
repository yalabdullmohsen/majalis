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

  -- 4b–4j) توسيع منهج أهل السنة (دروس إضافية — idempotent بالعنوان)
  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'مصدر التلقي عند أهل السنة'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('مصدر التلقي عند أهل السنة', 'الكتاب والسنة بفهم الصحابة والتابعين، وتقديم النقل على الهوى', v_cat, 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'أصل التلقي',
     'مصدر التلقي عند أهل السنة: كتاب الله وسنة رسوله ﷺ الصحيحة، ثم ما أجمع عليه الصحابة، ثم فهم السلف الصالح للنصوص. لا يُعارَض الوحي بذوقٍ ولا كشفٍ ولا قياسٍ فاسد.', 1),
    (v_lesson, 'evidence', 'أدلة',
     'قال تعالى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا أَطِيعُوا اللَّهَ وَأَطِيعُوا الرَّسُولَ وَأُولِي الْأَمْرِ مِنكُمْ﴾ (النساء: 59)، وقال: ﴿فَإِن تَنَازَعْتُمْ فِي شَيْءٍ فَرُدُّوهُ إِلَى اللَّهِ وَالرَّسُولِ﴾.', 2),
    (v_lesson, 'terms', 'فهم السلف',
     'المراد بفهم السلف: طريقة الصحابة والتابعين وأتباعهم في تفسير النصوص العقدية.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'إعلام الموقعين — ابن القيم', 1),
    (v_lesson, 'book', 'العقيدة الواسطية — ابن تيمية', 2);
  END IF;

  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'الإيمان قول وعمل يزيد وينقص'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الإيمان قول وعمل يزيد وينقص', 'تعريف الإيمان عند أهل السنة والفرق عن المرجئة والخوارج', v_cat, 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريف الإيمان',
     'الإيمان عند أهل السنة: قول باللسان، واعتقاد بالقلب، وعمل بالجوارح؛ يزيد بالطاعة وينقص بالمعصية. قال تعالى: ﴿وَيَزْدَادَ الَّذِينَ آمَنُوا إِيمَانًا﴾ (المدثر: 31).', 1),
    (v_lesson, 'evidence', 'الوسط بين طرفين',
     'خالف المرجئة فجعلوا الإيمان تصديقًا لا يضر معه عمل، وخالف الخوارج فكفّروا بالذنب. وأهل السنة يثبتون الوعيد لأهل الكبائر مع عدم تكفيرهم بالمعصية ما لم يستحلّوها.', 2),
    (v_lesson, 'terms', 'الكبيرة والصغيرة',
     'الكبيرة: ما ترتّب عليها حدّ في الدنيا أو وعيد في الآخرة. والصغيرة تُكفَّر باجتناب الكبائر وبالحسنات الماحية.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'شرح العقيدة الطحاوية — ابن أبي العز', 1),
    (v_lesson, 'book', 'جامع العلوم والحكم — ابن رجب', 2);
  END IF;

  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'منهج أهل السنة في الأسماء والصفات'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('منهج أهل السنة في الأسماء والصفات', 'الإثبات بلا تمثيل والتنزيه بلا تعطيل', v_cat, 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'القاعدة الكلية',
     'يُثبت أهل السنة ما أثبته الله لنفسه أو أثبته رسوله من الأسماء والصفات، من غير تحريف ولا تعطيل ولا تكييف ولا تمثيل. قال تعالى: ﴿لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ الْبَصِيرُ﴾ (الشورى: 11).', 1),
    (v_lesson, 'evidence', 'باب توقيفي',
     'الأسماء والصفات توقيفية. والكَيْف مجهول، والسؤال عنه بدعة، والإيمان به واجب، كما نُقل عن مالك في الاستواء.', 2),
    (v_lesson, 'terms', 'مخالفات',
     'المعطل ينفي الصفة أو يفرّغها، والممثّل يشبّه الله بخلقه. وأهل السنة وسط بينهما.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'العقيدة الواسطية — ابن تيمية', 1),
    (v_lesson, 'book', 'شرح العقيدة الواسطية — ابن عثيمين', 2);
  END IF;

  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'عقيدة أهل السنة في الصحابة وآل البيت'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('عقيدة أهل السنة في الصحابة وآل البيت', 'محبة الصحابة والكفّ عما شجر وتوقير آل البيت بلا غلو', v_cat, 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'الصحابة',
     'يُحبّ أهل السنة جميع صحابة النبي ﷺ ويرضون عنهم، ويرتّبون الخلفاء الراشدين في الفضل كترتيبهم في الخلافة، ويكفّون عما شجر بينهم.', 1),
    (v_lesson, 'evidence', 'آل البيت',
     'آل بيت النبي ﷺ لهم حق المودّة والاحترام الشرعي دون غلوّ يرفعهم فوق منزلتهم أو تنقّصٍ يبخسهم حقهم.', 2),
    (v_lesson, 'terms', 'تحذير من الطعن',
     'الطعن في عموم الصحابة أو تكفيرهم أو سبّهم مخالف لمنهج أهل السنة.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'العقيدة الواسطية — ابن تيمية (فصل الصحابة)', 1),
    (v_lesson, 'book', 'العواصم من القواصم — ابن العربي', 2);
  END IF;

  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'الإيمان بالقدر خيره وشره'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الإيمان بالقدر خيره وشره', 'مراتب القدر الأربع ووسطية أهل السنة بين الجبرية والقدرية', v_cat, 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'المراتب الأربع',
     'الإيمان بالقدر يقوم على: علم الله الأزلي، وكتابته، ومشيئته النافذة، وخلقه لكل شيء بما في ذلك أفعال العباد. قال ﷺ: «وتؤمن بالقدر خيره وشره» (مسلم).', 1),
    (v_lesson, 'evidence', 'الوسط',
     'نفى الجبرية قدرة العبد، ونفى القدرية علم الله السابق أو خلقه لأفعال العباد. وأهل السنة يثبتون الأمرين مع مسؤولية العبد.', 2),
    (v_lesson, 'terms', 'الاحتجاج بالقدر',
     'يُحتجّ بالقدر على المصائب لا على المعاصي.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'شفاء العليل — ابن القيم', 1),
    (v_lesson, 'book', 'العقيدة الواسطية — ابن تيمية', 2);
  END IF;

  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'وسطية أهل السنة بين الفرق'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('وسطية أهل السنة بين الفرق', 'التوسّط في الصفات والإيمان والصحابة والوعيد', v_cat, 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'معنى الوسطية',
     'وسطية أهل السنة لزوم الحق الذي كان عليه النبي ﷺ وأصحابه، لا تلفيق بين باطلين. هم وسط في الصفات والإيمان والصحابة والقدر.', 1),
    (v_lesson, 'evidence', 'التمسك بالجماعة',
     'المراد بالجماعة لزوم الحق وأهله. ولا يلزم من كثرة العدد صحة المنهج.', 2),
    (v_lesson, 'terms', 'التحذير من الغلو',
     'الغلو في التكفير أو التبديع بلا ضوابط خارج عن سمت أهل السنة.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'العقيدة الواسطية — ابن تيمية', 1),
    (v_lesson, 'book', 'شرح أصول اعتقاد أهل السنة — اللالكائي', 2);
  END IF;

  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'السنة والبدعة عند أهل السنة'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('السنة والبدعة عند أهل السنة', 'معنى السنة وضابط البدعة', v_cat, 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'السنة',
     'السنة: ما شرعه النبي ﷺ من قول أو فعل أو تقرير. قال ﷺ: «من أحدث في أمرنا هذا ما ليس منه فهو رد» (متفق عليه).', 1),
    (v_lesson, 'evidence', 'البدعة',
     'البدعة في الدين: التقرّب إلى الله بما لم يشرعه. وكل بدعة ضلالة كما في الحديث.', 2),
    (v_lesson, 'terms', 'ضابط الترك',
     'ترك النبي ﷺ مع وجود المقتضى وانتفاء المانع في العبادات دليل على عدم المشروعية عند كثير من أهل العلم.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الاعتصام — الشاطبي', 1),
    (v_lesson, 'book', 'اقتضاء الصراط المستقيم — ابن تيمية', 2);
  END IF;

  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'اليوم الآخر عند أهل السنة'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('اليوم الآخر عند أهل السنة', 'القبر والبعث والميزان والصراط والرؤية والشفاعة', v_cat, 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'أصول الباب',
     'يؤمن أهل السنة بفتنة القبر ونعيمه وعذابه، والبعث، والحشر، والميزان، والصراط، والجنة والنار، ورؤية المؤمنين ربهم، والشفاعة الثابتة.', 1),
    (v_lesson, 'evidence', 'الرؤية والشفاعة',
     'رؤية المؤمنين لربهم ثابتة بقوله تعالى: ﴿وُجُوهٌ يَوْمَئِذٍ نَّاضِرَةٌ * إِلَىٰ رَبِّهَا نَاظِرَةٌ﴾ (القيامة: 22-23)، وبحديث جرير في الصحيحين.', 2),
    (v_lesson, 'terms', 'مخالفات',
     'أنكرت طوائف عذاب القبر أو الرؤية أو الشفاعة لأهل الكبائر. ومذهب أهل السنة إثبات ما ثبت بالنص.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'شرح العقيدة الطحاوية — ابن أبي العز', 1),
    (v_lesson, 'book', 'العقيدة الواسطية — ابن تيمية', 2);
  END IF;

  IF v_cat IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM lessons WHERE category_id = v_cat AND title = 'كتب ومراجع عقيدة أهل السنة'
  ) THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('كتب ومراجع عقيدة أهل السنة', 'متون وشروح معتمدة للطلب', v_cat, 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'متون المبتدئ',
     'يُبدأ غالبًا بـ: الأصول الثلاثة، وكتاب التوحيد مع شروحه، ولمعة الاعتقاد، والعقيدة الواسطية.', 1),
    (v_lesson, 'evidence', 'متون التوسّع',
     'للتوسّع: شرح الطحاوية لابن أبي العز، وشرح أصول اعتقاد أهل السنة للالكائي، والحموية والتدمرية.', 2),
    (v_lesson, 'terms', 'منهج الطلب',
     'يُقرأ المتن على شيخ أو شرح معتمد، ويُضبط الدليل، والعمل بالعلم مقصود الباب.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'العقيدة الواسطية — ابن تيمية', 1),
    (v_lesson, 'book', 'العقيدة الطحاوية مع شرح ابن أبي العز', 2),
    (v_lesson, 'book', 'لمعة الاعتقاد — ابن قدامة', 3);
  END IF;

  UPDATE categories SET status = 'published', updated_at = now()
  WHERE slug IN ('iman-billah', 'aqsam-tawheed', 'nawaqid-islam', 'aqeedat-ahl-sunnah');
END $$;
