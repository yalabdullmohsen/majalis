-- الدفعة الأولى من ملء محتوى تصنيفات "تعلّم" الفارغة (status='draft')
-- تحت "القرآن الكريم وعلومه" (quran-uloom) — تستنفد العنقود بالكامل
-- (18 تصنيفاً فرعياً بلا محتوى: تلاوة، تجويد، حفظ ومراجعة، أصول التفسير،
-- علوم القرآن، أسباب النزول، الناسخ والمنسوخ، المكي والمدني، جمع القرآن،
-- القراءات، الوقف والابتداء، غريب القرآن، أمثال القرآن، قصص القرآن،
-- تدبر القرآن، أحكام القرآن، إعجاز القرآن، مناهج المفسرين).
-- كل تصنيف يحصل على درس واحد حقيقي (lessons + lesson_sections +
-- lesson_citations)، مبني على مصادر علوم قرآن معتمدة (مباحث في علوم
-- القرآن لمناع القطان، الإتقان للسيوطي، البرهان للزركشي، وكتب مفردة
-- كلاسيكية لكل فن: التبيان للنووي، النشر لابن الجزري، أسباب النزول
-- للواحدي، الناسخ والمنسوخ لابن الجوزي، أحكام القرآن للجصاص/ابن العربي،
-- إعجاز القرآن للباقلاني، التفسير والمفسرون للذهبي، وغيرها).
-- كل آية استُشهد بها تحقَّقت حرفياً من public/data/quran محلياً قبل
-- الإدراج. الحديث المذكور (أُنزل القرآن على سبعة أحرف) متفق عليه، لا
-- تصحيح متذبذب فيه.
-- idempotent (حارس NOT EXISTS بالعنوان+التصنيف) ثم status='published'
-- للتصنيفات الثمانية عشر عند اكتمالها.
DO $$
DECLARE
  v_lesson uuid;
BEGIN
  -- 1) التلاوة
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='b942313a-22c8-417b-ae36-18375429cba9' AND title='آداب تلاوة القرآن الكريم') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('آداب تلاوة القرآن الكريم', 'الآداب الظاهرة والباطنة التي ينبغي مراعاتها عند تلاوة كتاب الله', 'b942313a-22c8-417b-ae36-18375429cba9', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'معنى حق التلاوة', 'التلاوة في اللغة الاتباع، وحق التلاوة عند المفسرين اتباع ألفاظ القرآن بالقراءة الصحيحة المتقنة، واتباع معانيه بالتصديق والتدبر والعمل بما فيه من أمر ونهي، لا مجرد مرور اللسان على الحروف من غير تفكر.', 1),
    (v_lesson, 'evidence', 'دليلها من القرآن', 'قال تعالى: ﴿الَّذِينَ آتَيْنَاهُمُ الْكِتَابَ يَتْلُونَهُ حَقَّ تِلَاوَتِهِ أُولَٰئِكَ يُؤْمِنُونَ بِهِ﴾ (البقرة: 121)، فجمعت الآية بين التلاوة اللفظية والإيمان القلبي والعمل، وهو ما ينبغي أن يقصده القارئ في كل جلسة تلاوة.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'التبيان في آداب حملة القرآن — الإمام أبو زكريا يحيى بن شرف النووي', 1);
  END IF;

  -- 2) التجويد
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='8b9352cc-7036-41e4-abcf-905485495843' AND title='التعريف بعلم التجويد وحكمه') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('التعريف بعلم التجويد وحكمه', 'إتقان مخارج الحروف وصفاتها وأحكامها كما تلقّاها الصحابة عن النبي ﷺ', '8b9352cc-7036-41e4-abcf-905485495843', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفه وحكمه', 'التجويد لغة التحسين، واصطلاحاً إخراج كل حرف من مخرجه الصحيح مع إعطائه حقه من الصفات اللازمة ومستحقه من الصفات العارضة. والعلم به من فروض الكفايات، والعمل به عند التلاوة من فروض الأعيان على كل قارئ حسب طاقته.', 1),
    (v_lesson, 'evidence', 'دليله من القرآن', 'قال تعالى آمراً نبيه ﷺ: ﴿أَوْ زِدْ عَلَيْهِ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾ (المزمل: 4)، والترتيل هو التأني في القراءة وإعطاء كل حرف حقه، وهو أصل ما بُني عليه علم التجويد لاحقاً.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'التمهيد في علم التجويد — شمس الدين ابن الجزري', 1);
  END IF;

  -- 3) الحفظ والمراجعة
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='b4260346-fa03-4c10-b794-56d5c369d757' AND title='منهجية حفظ القرآن ومراجعته') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('منهجية حفظ القرآن ومراجعته', 'أسس ضبط الحفظ وتثبيته بالمراجعة المنتظمة وعدم تفلته', 'b4260346-fa03-4c10-b794-56d5c369d757', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'أهمية المراجعة', 'حفظ القرآن نعمة عظيمة يعقبها واجب المحافظة عليه بالمراجعة الدائمة، فقد شبَّه النبي ﷺ سرعة تفلته بتفلت الإبل من عقلها إن لم تُعاهَد، كما في الحديث المتفق عليه: «تعاهدوا القرآن، فوالذي نفسي بيده لهو أشد تفلتاً من الإبل في عقلها». فالحافظ مطالب بخطة منتظمة للورد اليومي والمراجعة الدورية لا بالحفظ وحده.', 1),
    (v_lesson, 'evidence', 'دليل حفظه وتيسيره', 'تكفَّل الله بحفظ القرآن من التغيير والتبديل، قال تعالى: ﴿إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ﴾ (الحجر: 9)، ويسَّر سبحانه ألفاظه ومعانيه للحفظ والتذكر، قال تعالى: ﴿وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِنْ مُدَّكِرٍ﴾ (القمر: 17).', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'التبيان في آداب حملة القرآن — الإمام النووي (باب آداب الحفظ والمراجعة)', 1);
  END IF;

  -- 4) أصول التفسير
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='c4138249-aa92-400d-88fd-0ccf0a3a5989' AND title='مصادر التفسير المعتبرة وترتيبها') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('مصادر التفسير المعتبرة وترتيبها', 'الترتيب المنهجي لمصادر تفسير القرآن الكريم عند أهل العلم', 'c4138249-aa92-400d-88fd-0ccf0a3a5989', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'ترتيب مصادر التفسير', 'أصح طرق التفسير عند أهل العلم أن يُفسَّر القرآن بالقرآن، فما أُجمل في موضع فُسِّر في موضع آخر، فإن لم يوجد رُجع إلى السنة النبوية فهي شارحة للقرآن، فإن لم يوجد رُجع إلى أقوال الصحابة لمعايشتهم نزول الوحي وفهمهم لمقاصده، ثم أقوال التابعين، ثم لغة العرب التي نزل بها القرآن.', 1),
    (v_lesson, 'evidence', 'دليل البيان النبوي', 'قال تعالى: ﴿ثُمَّ إِنَّ عَلَيْنَا بَيَانَهُ﴾ (القيامة: 19)، وهذا البيان يشمل ما تكفَّل الله ببيانه من طريق الوحي على لسان النبي ﷺ، ومنه ما فسّره النبي ﷺ بقوله وفعله لأصحابه فنقلوه عنه، فكانت السنة مصدراً أصيلاً من مصادر التفسير بعد القرآن نفسه.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'مقدمة في أصول التفسير — شيخ الإسلام ابن تيمية', 1);
  END IF;

  -- 5) علوم القرآن (الفرع العام)
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='0b9e1e73-73da-4f34-8aca-27054b9ae1d9' AND title='مدخل إلى علوم القرآن') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('مدخل إلى علوم القرآن', 'تعريف عام بعلم علوم القرآن وأبرز موضوعاته التي دوَّنها العلماء', '0b9e1e73-73da-4f34-8aca-27054b9ae1d9', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفه وموضوعاته', '"علوم القرآن" مصطلح جامع لمباحث متعددة تتعلق بالقرآن الكريم من حيث نزوله وأسباب نزوله وجمعه وترتيبه وقراءاته ومكيّه ومدنيّه وناسخه ومنسوخه وإعجازه وأمثاله وقصصه، دوّنها العلماء عبر القرون في مصنفات جامعة أفردت لكل نوع منها بحثاً مستقلاً.', 1),
    (v_lesson, 'evidence', 'غاية هذا العلم', 'قال تعالى: ﴿كِتَابٌ أَنْزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ﴾ (ص: 29)، فغاية علوم القرآن كلها إعانة القارئ على فهم الكتاب وتدبره على الوجه الصحيح الذي أراده منه.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'مباحث في علوم القرآن — الشيخ مناع بن خليل القطان', 1),
    (v_lesson, 'book', 'الإتقان في علوم القرآن — جلال الدين السيوطي', 2);
  END IF;

  -- 6) أسباب النزول
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='b94ec7be-051f-4a1c-974e-cb593325573b' AND title='التعريف بأسباب النزول وفائدتها') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('التعريف بأسباب النزول وفائدتها', 'الحادثة أو السؤال الذي نزلت الآية بسببه، وأثره في فهم المراد', 'b94ec7be-051f-4a1c-974e-cb593325573b', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفه وفائدته', 'سبب النزول ما نزلت الآية أو الآيات بسببه من حادثة وقعت أو سؤال وُجِّه إلى النبي ﷺ وقت نزول الوحي. ومعرفته تُعين على فهم المعنى المراد من الآية، ورفع الإشكال عمن ظنّ عموم اللفظ يخالف سبب نزوله، فالعبرة عند جمهور العلماء بعموم اللفظ لا بخصوص السبب، مع أن السبب يبقى قرينة مهمة في فهم المقصود.', 1),
    (v_lesson, 'evidence', 'دليل نزوله منجَّماً', 'أشار القرآن إلى نزوله منجَّماً حسب الوقائع لا جملة واحدة، قال تعالى: ﴿وَقَالَ الَّذِينَ كَفَرُوا لَوْلَا نُزِّلَ عَلَيْهِ الْقُرْآنُ جُمْلَةً وَاحِدَةً كَذَٰلِكَ لِنُثَبِّتَ بِهِ فُؤَادَكَ وَرَتَّلْنَاهُ تَرْتِيلًا﴾ (الفرقان: 32)، وهذا التنجيم هو الذي أنتج كثيراً من أسباب النزول المرتبطة بوقائع بعينها.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'أسباب النزول — أبو الحسن علي بن أحمد الواحدي (أقدم مصنَّف مفرد في الباب)', 1);
  END IF;

  -- 7) الناسخ والمنسوخ
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='4cce32e5-e5e4-4454-ab63-7b5e83637d50' AND title='تعريف النسخ في القرآن وضوابطه') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('تعريف النسخ في القرآن وضوابطه', 'رفع حكم شرعي متقدم بدليل شرعي متأخر، وشروط ثبوته', '4cce32e5-e5e4-4454-ab63-7b5e83637d50', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفه وشروطه', 'النسخ لغة الإزالة أو النقل، واصطلاحاً رفع حكم شرعي متقدم بدليل شرعي متأخر عنه. ولثبوت النسخ شروط عند العلماء: تعذُّر الجمع بين النصين، وتأخُّر الناسخ زمناً عن المنسوخ ثبوتاً لا احتمالاً، وأن يكون كلاهما حكماً شرعياً عملياً لا خبراً محضاً.', 1),
    (v_lesson, 'evidence', 'دليله من القرآن', 'قال تعالى: ﴿مَا نَنْسَخْ مِنْ آيَةٍ أَوْ نُنْسِهَا نَأْتِ بِخَيْرٍ مِنْهَا أَوْ مِثْلِهَا﴾ (البقرة: 106)، فأثبتت الآية جواز النسخ في الشريعة، وأن الحكمة الإلهية تقتضي أن يكون البديل خيراً للأمة أو مساوياً له.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'نواسخ القرآن — أبو الفرج ابن الجوزي', 1);
  END IF;

  -- 8) المكي والمدني
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='6e1f91c0-cf0c-407a-8230-860dcc636347' AND title='ضوابط التمييز بين المكي والمدني') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('ضوابط التمييز بين المكي والمدني', 'الضابط الزمني المعتمد عند العلماء لتصنيف آي القرآن', '6e1f91c0-cf0c-407a-8230-860dcc636347', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'الضابط الراجح', 'أرجح الضوابط عند جمهور العلماء لتمييز المكي من المدني هو الضابط الزمني: فالمكي ما نزل قبل الهجرة النبوية ولو كان نزوله بغير مكة، والمدني ما نزل بعد الهجرة ولو كان نزوله بغير المدينة، خلافاً للضابط المكاني الذي يربط التسمية بمكان النزول حرفياً وهو ضابط أقل دقة.', 1),
    (v_lesson, 'evidence', 'أثر ذلك في فهم التنزيل', 'يظهر أثر هذا التقسيم في فهم تدرج التشريع، قال تعالى واصفاً طبيعة نزول القرآن: ﴿وَقُرْآنًا فَرَقْنَاهُ لِتَقْرَأَهُ عَلَى النَّاسِ عَلَىٰ مُكْثٍ وَنَزَّلْنَاهُ تَنْزِيلًا﴾ (الإسراء: 106)، فالتنزيل المتدرج عبر مرحلتي مكة والمدينة له خصائص أسلوبية وموضوعية مميزة لكل مرحلة درسها علماء علوم القرآن.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'البرهان في علوم القرآن — بدر الدين الزركشي', 1);
  END IF;

  -- 9) جمع القرآن
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='902171e2-4ca8-4d2e-996f-95c8591b93db' AND title='مراحل جمع القرآن الكريم') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('مراحل جمع القرآن الكريم', 'من الجمع في الصدور زمن النبي ﷺ إلى توحيد المصحف زمن عثمان', '902171e2-4ca8-4d2e-996f-95c8591b93db', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'مراحله الثلاث', 'مرَّ جمع القرآن بثلاث مراحل رئيسة: الأولى الجمع في الصدور والسطور المتفرقة زمن النبي ﷺ نفسه بإشرافه المباشر، والثانية جمعه في صحف واحدة مرتبة زمن أبي بكر الصديق رضي الله عنه بعد استحرِّ القتل بالقرَّاء في موقعة اليمامة خشية ضياع شيء منه، والثالثة نسخ الصحف في مصاحف متعددة موحَّدة الرسم وتوزيعها على الأمصار زمن عثمان بن عفان رضي الله عنه لقطع الاختلاف في القراءة.', 1),
    (v_lesson, 'evidence', 'دليل تكفُّل الله بجمعه', 'قال تعالى: ﴿إِنَّ عَلَيْنَا جَمْعَهُ وَقُرْآنَهُ﴾ (القيامة: 17)، فتكفَّل الله بجمع القرآن في صدر النبي ﷺ أولاً، ثم يسَّر أسباب جمعه كتابياً بعده على يد صحابته رضي الله عنهم.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الإتقان في علوم القرآن — جلال الدين السيوطي (النوع الثامن عشر: في جمعه وترتيبه)', 1);
  END IF;

  -- 10) القراءات
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='6d97aaa4-4b90-475d-b370-3e378facdad2' AND title='التعريف بعلم القراءات') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('التعريف بعلم القراءات', 'وجوه الأداء المتواترة عن النبي ﷺ في ألفاظ القرآن الكريم', '6d97aaa4-4b90-475d-b370-3e378facdad2', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفه وأشهر رواته', 'علم القراءات يبحث في كيفيات أداء ألفاظ القرآن الكريم ووجوه اختلافها المنقولة بالسند الصحيح المتصل عن النبي ﷺ، من حيث النطق بالحروف والحركات والمدود وغيرها. واشتهرت منها القراءات العشر المتواترة المنسوبة إلى أئمتها كنافع وعاصم وابن كثير وأبي عمرو وغيرهم، ولكل إمام راويان مشهوران عنه.', 1),
    (v_lesson, 'evidence', 'دليلها من السنة', 'ثبت في الحديث المتفق عليه عن ابن عباس رضي الله عنهما أن النبي ﷺ قال: «أقرأني جبريل على حرف فراجعته فلم أزل أستزيده حتى انتهى إلى سبعة أحرف»، وهذا الحديث هو أصل ما دوَّنه العلماء لاحقاً من علم الأحرف السبعة الذي تفرَّعت عنه القراءات المتواترة.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'صحيح البخاري وصحيح مسلم — عن ابن عباس رضي الله عنهما (حديث الأحرف السبعة، متفق عليه)', 1),
    (v_lesson, 'book', 'النشر في القراءات العشر — شمس الدين ابن الجزري', 2);
  END IF;

  -- 11) الوقف والابتداء
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='4eee2144-8ef2-4b1c-8c3f-9fd5f59dfbf8' AND title='أحكام الوقف والابتداء في التلاوة') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('أحكام الوقف والابتداء في التلاوة', 'ضبط مواضع قطع الصوت واستئنافه بما يحفظ المعنى المراد', '4eee2144-8ef2-4b1c-8c3f-9fd5f59dfbf8', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفهما وأقسام الوقف', 'الوقف قطع الصوت عن الكلمة زمناً يتنفس فيه القارئ بنية استئناف القراءة، وينقسم إلى وقف تام يحسن الوقوف عليه والابتداء بما بعده، وكافٍ، وحسن، وقبيح لا يحسن الوقوف عليه لتعلق ما بعده بما قبله معنى. والابتداء استئناف القراءة بعد الوقف بلفظ يحسن الابتداء به دون إخلال بالمعنى.', 1),
    (v_lesson, 'evidence', 'أصل التأني في القراءة', 'أرشد الله نبيه ﷺ إلى التأني في تلقي الوحي وعدم استعجاله، قال تعالى: ﴿لَا تُحَرِّكْ بِهِ لِسَانَكَ لِتَعْجَلَ بِهِ﴾ (القيامة: 16)، وهذا الأصل في التأني هو ما بُني عليه لاحقاً ضبط مواضع الوقف والابتداء في علم أداء القرآن.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'المكتفى في الوقف والابتدا — أبو عمرو عثمان بن سعيد الداني', 1);
  END IF;

  -- 12) غريب القرآن
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='024e533e-db17-4d07-8658-b5bae44342aa' AND title='التعريف بعلم غريب القرآن') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('التعريف بعلم غريب القرآن', 'الألفاظ القرآنية التي يخفى معناها على غير المتخصص وطرق بيانها', '024e533e-db17-4d07-8658-b5bae44342aa', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفه وأهميته', 'غريب القرآن الألفاظ الواردة فيه التي يخفى معناها على غير المتخصص لقلة استعمالها في اللغة الدارجة أو لتحوُّل دلالتها عبر الزمن، فيحتاج بيانها إلى الرجوع إلى معاجم اللغة العربية القديمة وأشعار العرب وأقوال المفسرين المتقدمين ليسلم فهم القارئ من الخطأ.', 1),
    (v_lesson, 'evidence', 'دليل عربيته المبينة', 'نزل القرآن الكريم بلغة العرب الفصيحة الواضحة، قال تعالى: ﴿إِنَّا أَنْزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَعَلَّكُمْ تَعْقِلُونَ﴾ (يوسف: 2)، ووصفه سبحانه بأنه ﴿بِلِسَانٍ عَرَبِيٍّ مُبِينٍ﴾ (الشعراء: 195)، ومع هذا الوضوح احتاج المتأخرون البعيدون عن سليقة العرب الأول إلى تعلُّم معاني ألفاظه الغريبة عليهم.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'تفسير غريب القرآن — أبو محمد عبدالله بن مسلم بن قتيبة', 1);
  END IF;

  -- 13) أمثال القرآن
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='baa5e13d-fbec-4a22-9393-bdff0e3c6471' AND title='الأمثال في القرآن الكريم ومقاصدها') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الأمثال في القرآن الكريم ومقاصدها', 'تشبيه المعاني المعقولة بصور محسوسة تقريباً للفهم وتثبيتاً في النفس', 'baa5e13d-fbec-4a22-9393-bdff0e3c6471', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريف المثل القرآني', 'المثل في القرآن تشبيه معنى معقول مجرد بصورة محسوسة مألوفة تقريباً للفهم وتثبيتاً للمعنى في النفس، كتمثيل حال المنافقين بمن استوقد ناراً، أو تمثيل الكلمة الطيبة بشجرة طيبة أصلها ثابت وفرعها في السماء.', 1),
    (v_lesson, 'evidence', 'دليل فائدتها العلمية', 'قال تعالى: ﴿وَتِلْكَ الْأَمْثَالُ نَضْرِبُهَا لِلنَّاسِ وَمَا يَعْقِلُهَا إِلَّا الْعَالِمُونَ﴾ (العنكبوت: 43)، فبيَّنت الآية أن فهم أمثال القرآن على وجهها الصحيح يحتاج إلى تأمل وعلم لا مجرد قراءة عابرة.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'أمثال القرآن — ابن قيم الجوزية', 1);
  END IF;

  -- 14) قصص القرآن
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='de72d765-6e33-44ff-86b8-c9451bb4f0f9' AND title='قصص القرآن الكريم وأنواعها ومقاصدها') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('قصص القرآن الكريم وأنواعها ومقاصدها', 'إخبار القرآن عن الأمم السابقة والأنبياء تصديقاً وعبرة', 'de72d765-6e33-44ff-86b8-c9451bb4f0f9', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'أنواع القصص القرآني', 'القصة القرآنية إخبار عن وقائع الأمم السابقة والأنبياء والأحداث الغيبية، تنقسم إلى ثلاثة أنواع: قصص الأنبياء مع أقوامهم كقصة موسى ونوح عليهما السلام، وقصص أشخاص وجماعات غير الأنبياء كأصحاب الكهف وقارون، وقصص حوادث ووقائع معينة كغزوتي بدر وأحد.', 1),
    (v_lesson, 'evidence', 'دليل مقصدها', 'قال تعالى: ﴿نَحْنُ نَقُصُّ عَلَيْكَ أَحْسَنَ الْقَصَصِ بِمَا أَوْحَيْنَا إِلَيْكَ هَٰذَا الْقُرْآنَ﴾ (يوسف: 3)، فمقصد القصص القرآني ليس مجرد السرد التاريخي، بل التصديق والعبرة وتثبيت قلب النبي ﷺ والمؤمنين معه.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'مباحث في علوم القرآن — مناع القطان (باب القصص في القرآن الكريم)', 1);
  END IF;

  -- 15) تدبر القرآن
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='a74ed1e2-e9e6-4df8-b5dc-a95c2a75bd2f' AND title='منزلة التدبر في تلاوة القرآن') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('منزلة التدبر في تلاوة القرآن', 'تأمل معاني القرآن والعمل بمقتضاها، لا مجرد الأداء الصوتي', 'a74ed1e2-e9e6-4df8-b5dc-a95c2a75bd2f', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريف التدبر وغايته', 'التدبر تأمل معاني القرآن والتفكر في دلالاتها وربطها بواقع القارئ وأحواله حتى يعمل بمقتضاها، وهو الغاية الأصلية من نزول القرآن وتلاوته، لا مجرد إتقان الأداء الصوتي وحده وإن كان مطلوباً.', 1),
    (v_lesson, 'evidence', 'دليل الأمر به والتحذير من تركه', 'قال تعالى منكِراً على من يقرأ القرآن دون تدبر: ﴿أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ أَمْ عَلَىٰ قُلُوبٍ أَقْفَالُهَا﴾ (محمد: 24)، فجعلت الآية ترك التدبر عن القرآن دليلاً على قسوة القلب وانغلاقه، تحذيراً من الاكتفاء بالتلاوة اللفظية.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'مفتاح دار السعادة ومنشور ولاية العلم والإرادة — ابن قيم الجوزية (فصل فضل التدبر)', 1);
  END IF;

  -- 16) أحكام القرآن
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='4cd5848f-a2ba-4b33-ac69-1623f639c3c3' AND title='علم أحكام القرآن ومنهج التصنيف فيه') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('علم أحكام القرآن ومنهج التصنيف فيه', 'استخراج الأحكام الفقهية من آيات القرآن وبيان وجوه استنباطها', '4cd5848f-a2ba-4b33-ac69-1623f639c3c3', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفه وموضوعه', '"أحكام القرآن" علم يُعنى باستخراج الأحكام الفقهية من آيات القرآن الكريم المتعلقة بالعبادات والمعاملات والأحوال الشخصية، وبيان وجوه دلالتها ومناهج الفقهاء في استنباط الأحكام منها، وقد أفرد فيه فقهاء المذاهب مصنفات مستقلة كل بحسب أصوله.', 1),
    (v_lesson, 'evidence', 'دليل نزول القرآن للحكم بين الناس', 'قال تعالى مخاطباً نبيه ﷺ: ﴿إِنَّا أَنْزَلْنَا إِلَيْكَ الْكِتَابَ بِالْحَقِّ لِتَحْكُمَ بَيْنَ النَّاسِ بِمَا أَرَاكَ اللَّهُ﴾ (النساء: 105)، فمن مقاصد إنزال القرآن أن يكون مرجعاً للحكم والفصل بين الناس بما فيه من أحكام.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'أحكام القرآن — أبو بكر ابن العربي المالكي', 1);
  END IF;

  -- 17) إعجاز القرآن
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='dbaae36d-852d-4fa2-ae21-08c31fe081e6' AND title='وجوه إعجاز القرآن الكريم') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('وجوه إعجاز القرآن الكريم', 'عجز البشر عن الإتيان بمثل القرآن رغم التحدي المتكرر ووجوه ذلك', 'dbaae36d-852d-4fa2-ae21-08c31fe081e6', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تعريفه ووجوهه', 'الإعجاز عجز البشر مجتمعين عن الإتيان بمثل القرآن الكريم رغم تكرار التحدي بذلك. ومن أبرز وجوه إعجازه: الإعجاز البلاغي في نظمه وأسلوبه الذي عجزت عنه فصحاء العرب وهم أهل اللسان، والإعجاز التشريعي في شموله وعدله، والإعجاز الغيبي فيما أخبر به من أمور ماضية وآتية.', 1),
    (v_lesson, 'evidence', 'دليل التحدي القرآني', 'تحدَّى الله المشركين بالإتيان بمثل القرآن فعجزوا، قال تعالى: ﴿وَإِنْ كُنْتُمْ فِي رَيْبٍ مِمَّا نَزَّلْنَا عَلَىٰ عَبْدِنَا فَأْتُوا بِسُورَةٍ مِنْ مِثْلِهِ وَادْعُوا شُهَدَاءَكُمْ مِنْ دُونِ اللَّهِ إِنْ كُنْتُمْ صَادِقِينَ﴾ (البقرة: 23)، وهذا التحدي المتكرر بصور مختلفة في القرآن ظل قائماً دون أن يستطيع أحد مجاراته.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'إعجاز القرآن — القاضي أبو بكر الباقلاني', 1);
  END IF;

  -- 18) مناهج المفسرين
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='d3099eab-d3e2-4cbf-b69b-1285637a2f50' AND title='مناهج المفسرين في تفسير القرآن') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('مناهج المفسرين في تفسير القرآن', 'تصنيف مدارس التفسير بحسب المصدر والاتجاه العلمي', 'd3099eab-d3e2-4cbf-b69b-1285637a2f50', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'تصنيف المناهج', 'تصنَّف مناهج المفسرين بحسب المصدر إلى تفسير بالمأثور، وهو المبني على ما رُوي عن القرآن والسنة وأقوال الصحابة والتابعين كتفسير الطبري وابن كثير، وتفسير بالرأي المبني على الاجتهاد اللغوي والعقلي بضوابطه الشرعية. وتصنَّف بحسب الاتجاه إلى فقهي وبلاغي ولغوي وعلمي وإشاري، لكل اتجاه أعلامه ومصنفاته الخاصة.', 1),
    (v_lesson, 'evidence', 'أصل التفرق في التعامل مع المتشابه', 'يرجع أصل تفرُّق بعض مناهج التفسير في التعامل مع الآيات المتشابهة إلى قوله تعالى: ﴿هُوَ الَّذِي أَنْزَلَ عَلَيْكَ الْكِتَابَ مِنْهُ آيَاتٌ مُحْكَمَاتٌ هُنَّ أُمُّ الْكِتَابِ وَأُخَرُ مُتَشَابِهَاتٌ ۖ فَأَمَّا الَّذِينَ فِي قُلُوبِهِمْ زَيْغٌ فَيَتَّبِعُونَ مَا تَشَابَهَ مِنْهُ ابْتِغَاءَ الْفِتْنَةِ وَابْتِغَاءَ تَأْوِيلِهِ ۗ وَمَا يَعْلَمُ تَأْوِيلَهُ إِلَّا اللَّهُ ۗ وَالرَّاسِخُونَ فِي الْعِلْمِ يَقُولُونَ آمَنَّا بِهِ﴾ (آل عمران: 7)، فبيَّنت الآية أن المنهج السليم هو منهج الراسخين في العلم القائم على التسليم والرد إلى المحكم، بخلاف منهج أهل الزيغ.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'التفسير والمفسرون — محمد حسين الذهبي', 1);
  END IF;

  -- نشر التصنيفات الثمانية عشر بعد اكتمال محتواها الأساسي
  UPDATE categories SET status='published', updated_at=now()
  WHERE slug IN (
    'tilawah','tajweed','hifz-murajaah','usul-tafseer','uloom-quran-branch',
    'asbab-nuzul','nasikh-mansukh','makki-madani','jam-quran','qiraat',
    'waqf-ibtida','gharib-quran','amthal-quran','qasas-quran','tadabbur-quran',
    'ahkam-quran','ijaz-quran','manahij-mufassireen'
  ) AND status='draft';
END $$;
