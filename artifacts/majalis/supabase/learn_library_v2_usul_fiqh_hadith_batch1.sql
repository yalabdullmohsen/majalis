-- الدفعة الأولى من ملء محتوى تصنيفات "تعلّم" الفارغة (status='draft') التي
-- أضافتها learn_library_v2_requested_taxonomy(_part2).sql سابقًا. تُغطي هذه
-- الدفعة 13 تصنيفًا فرعيًا من "أصول الفقه" (usul-fiqh) وتصنيفين من "علوم
-- الحديث" (mustalah-hadith) — كل تصنيف يحصل على درس واحد حقيقي (jadwal
-- lessons + lesson_sections + lesson_citations) مبني على تعريفات أصولية/
-- حديثية مستقرة عبر المذاهب (لا مسائل خلافية)، مع استشهاد قرآني محلي
-- محقَّق حرفيًا من public/data/quran حيثما استُشهد بآية. idempotent (حارس
-- NOT EXISTS بالعنوان+التصنيف) ثم status='published' للتصنيفات الخمسة عشر.
DO $$
DECLARE
  v_lesson uuid;
BEGIN
  -- 1) القرآن دليلًا
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='5544f229-dedf-42a3-be07-9ff9d4fe2b95' AND title='القرآن دليلًا') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('القرآن دليلًا', 'منزلة القرآن الكريم بوصفه الدليل الأول والأصل الأعظم من أدلة التشريع', '5544f229-dedf-42a3-be07-9ff9d4fe2b95', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه ومنزلته', 'القرآن الكريم هو كلام الله المنزَّل على النبي محمد ﷺ بلفظه ومعناه، المتعبَّد بتلاوته، المنقول إلينا بالتواتر القطعي الثبوت. وهو الدليل الأول الذي ترجع إليه بقية الأدلة الشرعية؛ فالسنة النبوية والإجماع والقياس تعمل في ضوئه ولا تخالفه، بل تفصّل ما أجمله أو تبيّن ما استُشكل منه.', 1),
    (v_lesson, 'body', 'دلالات ألفاظه', 'يقسِّم الأصوليون دلالة ألفاظ القرآن من حيث وضوح المعنى إلى: نص (لا يحتمل غير معنى واحد)، وظاهر (يحتمل معنى راجحاً وآخر مرجوحاً)، ومجمل يحتاج بياناً من السنة النبوية.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 2) السنة دليلًا
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='7c578825-7021-46b1-8ced-2e776ee57784' AND title='السنة دليلًا') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('السنة دليلًا', 'السنة النبوية بوصفها الدليل الثاني المتفق على حجيته من أدلة التشريع', '7c578825-7021-46b1-8ced-2e776ee57784', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفها وحجيتها', 'السنة النبوية تشمل كل ما صدر عن النبي ﷺ من قول أو فعل أو تقرير (إقرار على فعل رآه أو عَلِمَ به فلم يُنكِره). ودليل حجيتها قوله تعالى: ﴿وَمَا آتَاكُمُ الرَّسُولُ فَخُذُوهُ وَمَا نَهَاكُمْ عَنْهُ فَانتَهُوا﴾ (الحشر: 7).', 1),
    (v_lesson, 'body', 'وظيفتها تجاه القرآن وأقسامها', 'تأتي السنة مؤكِّدة لحكم ورد في القرآن، أو مبيِّنة ومفسِّرة لمجمله، أو منشئة لحكم لم يرد فيه نص قرآني صريح. وتنقسم من حيث طرق نقلها إلى متواترة (تفيد القطع) وآحاد (تفيد الظن الراجح عند جمهور الأصوليين).', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 3) الإجماع
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='d6163e77-44d6-4a39-848f-5adb0213635c' AND title='الإجماع') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الإجماع', 'الدليل الثالث من أدلة التشريع المتفق عليها بين جمهور الأصوليين', 'd6163e77-44d6-4a39-848f-5adb0213635c', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه ودليله', 'الإجماع هو اتفاق المجتهدين من أمة محمد ﷺ في عصر من العصور بعد وفاته على حكم شرعي. ومن أدلة حجيته قوله تعالى: ﴿وَمَن يُشَاقِقِ الرَّسُولَ مِن بَعْدِ مَا تَبَيَّنَ لَهُ الْهُدَىٰ وَيَتَّبِعْ غَيْرَ سَبِيلِ الْمُؤْمِنِينَ نُوَلِّهِ مَا تَوَلَّىٰ﴾ (النساء: 115).', 1),
    (v_lesson, 'examples', 'أمثلة تاريخية', 'من أشهر أمثلة الإجماع التطبيقية: إجماع الصحابة رضي الله عنهم على قتال مانعي الزكاة في خلافة أبي بكر الصديق، وإجماعهم على توريث الجدة السدس.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 4) القياس
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='f439e8bf-7273-4c69-86ae-da91d1212b59' AND title='القياس') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('القياس', 'إلحاق واقعة لا نص فيها بواقعة ورد فيها نص لاشتراكهما في علة الحكم', 'f439e8bf-7273-4c69-86ae-da91d1212b59', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه وأركانه', 'القياس هو إلحاق واقعة لم يرد فيها نص بواقعة ورد فيها نص، لاشتراكهما في علة الحكم. له أربعة أركان: الأصل (المقيس عليه)، الفرع (المقيس)، حكم الأصل، والعلة الجامعة بينهما.', 1),
    (v_lesson, 'examples', 'مثاله المشهور', 'المثال الأصولي الأشهر للقياس: قياس عصير التمر المسكِر (النبيذ) على الخمر في حكم التحريم، لاشتراكهما في علة الإسكار.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 5) الاستصحاب
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='9fc02c6d-da49-405a-a227-65268c26e3d2' AND title='الاستصحاب') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الاستصحاب', 'استمرار إثبات ما كان ثابتاً أو نفي ما كان منفياً حتى يقوم دليل مغيِّر', '9fc02c6d-da49-405a-a227-65268c26e3d2', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه وقاعدته', 'الاستصحاب هو استمرار إثبات ما كان ثابتاً أو نفي ما كان منفياً، ما لم يقم دليل يغيِّر ذلك الحكم. أصله القاعدة الفقهية المشهورة: "اليقين لا يزول بالشك".', 1),
    (v_lesson, 'examples', 'مثاله', 'من طبَّق قاعدة الاستصحاب: من تيقَّن الطهارة ثم شكَّ هل انتقض وضوؤه، فهو باقٍ على طهارته استصحاباً لليقين السابق، ولا يلتفت إلى الشك الطارئ.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 6) المصالح المرسلة
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='3c56336d-3bcc-472a-8d3d-5ac52465a42c' AND title='المصالح المرسلة') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('المصالح المرسلة', 'كل مصلحة لم يرد نص خاص باعتبارها أو إلغائها لكنها موافقة لمقاصد الشريعة', '3c56336d-3bcc-472a-8d3d-5ac52465a42c', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفها وموقف الفقهاء منها', 'المصلحة المرسلة هي كل مصلحة لم يرد نص خاص باعتبارها أو إلغائها، لكنها موافقة لمقاصد الشريعة العامة (حفظ الدين والنفس والعقل والنسل والمال). اعتمد عليها المالكية والحنابلة خصوصاً في تأصيل بعض الأحكام غير المنصوص عليها مباشرة.', 1),
    (v_lesson, 'examples', 'مثالها التاريخي', 'من أشهر تطبيقاتها التاريخية: جمع الصحابة رضي الله عنهم للقرآن الكريم في مصحف واحد في عهد أبي بكر ثم عثمان، إذ لم يرد نص بالجمع لكنه تحقيق لمصلحة حفظ القرآن من الضياع.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'أصول الفقه — الشيخ محمد أبو زهرة', 1);
  END IF;

  -- 7) سد الذرائع
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='5a88f95a-4fd8-47fa-b059-83a8e894fc42' AND title='سد الذرائع') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('سد الذرائع', 'منع الأمور المباحة ظاهراً إذا كانت وسيلة مفضية إلى مفسدة', '5a88f95a-4fd8-47fa-b059-83a8e894fc42', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفها وقاعدتها', 'سد الذرائع هو منع الأمور المباحة في ظاهرها إذا كانت وسيلة مفضية إلى مفسدة أو محرَّم، وقاعدتها الأصولية: "الوسائل لها حكم المقاصد".', 1),
    (v_lesson, 'evidence', 'دليلها القرآني', 'من أدلتها القرآنية قوله تعالى: ﴿وَلَا تَسُبُّوا الَّذِينَ يَدْعُونَ مِن دُونِ اللَّهِ فَيَسُبُّوا اللَّهَ عَدْوًا بِغَيْرِ عِلْمٍ﴾ (الأنعام: 108) — فمنع سبُّ آلهة المشركين مع أنه في ذاته حق، سداً لذريعة سبِّهم لله تعالى.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 8) العرف
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='74354c47-b1dc-4259-98f3-113798717fcd' AND title='العرف') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('العرف', 'ما اعتاده الناس وساروا عليه من قول أو فعل ولم يخالف نصاً شرعياً', '74354c47-b1dc-4259-98f3-113798717fcd', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفه وأقسامه', 'العرف هو ما اعتاده الناس وساروا عليه من قول أو فعل. ينقسم إلى عرف صحيح (لا يخالف نصاً شرعياً، كتعارف الناس على تعجيل جزء من المهر وتأجيل باقيه) وعرف فاسد (يخالف الشرع فلا يُعتَد به).', 1),
    (v_lesson, 'body', 'قاعدته الفقهية', 'من القواعد الفقهية الكبرى المبنية على اعتبار العرف: "العادة محكَّمة"، وهي أصل يرجع إليه الفقهاء في المسائل التي لم يرد فيها نص خاص وتتفاوت بتفاوت أعراف الناس وأزمنتهم وأماكنهم.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 9) العام والخاص
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='ddfbfaf6-ce04-43fb-839a-419d0c0926b5' AND title='العام والخاص') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('العام والخاص', 'تصنيف أصولي لدلالة الألفاظ من حيث شمولها لأفرادها', 'ddfbfaf6-ce04-43fb-839a-419d0c0926b5', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفهما', 'العام هو اللفظ المستغرق لجميع أفراده بلا حصر، ويبقى على عمومه حتى يرد ما يخصِّصه. الخاص هو اللفظ الموضوع لمعنى محدد أو لفرد أو أفراد محصورة.', 1),
    (v_lesson, 'examples', 'مثال قرآني', 'من أمثلة العام المخصَّص: قوله تعالى: ﴿وَالسَّارِقُ وَالسَّارِقَةُ فَاقْطَعُوا أَيْدِيَهُمَا﴾ (المائدة: 38) لفظ عام في كل سارق وسارقة، خصَّصه الفقهاء بشروط كبلوغ المسروق نصاباً معيناً وكونه محرَزاً.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 10) المطلق والمقيد
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='8b9e0d82-2879-4261-85b8-437c72e7b50f' AND title='المطلق والمقيد') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('المطلق والمقيد', 'تصنيف أصولي لدلالة الألفاظ من حيث تقيُّدها بوصف', '8b9e0d82-2879-4261-85b8-437c72e7b50f', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفهما', 'المطلق هو اللفظ الدال على الماهية بلا قيد، كلفظ "رقبة" في كفارة اليمين. المقيد هو اللفظ الدال على الماهية مقيدة بوصف، كلفظ "رقبة مؤمنة" في كفارة القتل الخطأ.', 1),
    (v_lesson, 'body', 'قاعدة حمل أحدهما على الآخر', 'من قواعد أصول الفقه المستقرة: يُحمَل المطلق على المقيد إذا اتحد الحكم والسبب في النصين، فتشترط الإيمان في الرقبة المُعتَقة في كفارة اليمين قياساً على كفارة القتل عند من يقول بهذا الحمل.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 11) الأمر والنهي
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='0bb2ab17-7ca1-49b7-a235-3e2bfa41d2f8' AND title='الأمر والنهي') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الأمر والنهي', 'صيغتا الطلب الأصوليتان وأصل دلالتهما', '0bb2ab17-7ca1-49b7-a235-3e2bfa41d2f8', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفهما وأصل الدلالة', 'الأمر هو طلب الفعل على وجه الاستعلاء (كصيغة "افعل")، وأصله يفيد الوجوب ما لم تصرفه قرينة إلى الندب أو الإباحة. النهي هو طلب الكف عن الفعل على وجه الاستعلاء، وأصله يفيد التحريم ما لم تصرفه قرينة إلى الكراهة.', 1),
    (v_lesson, 'body', 'أهمية القرائن', 'لا يكفي مجرد ورود صيغة الأمر أو النهي للحكم بالوجوب أو التحريم؛ إذ قد تُصرَف الصيغة عن أصلها بقرينة سياقية، كصيغة الأمر في قوله تعالى ﴿وَإِذَا حَلَلْتُمْ فَاصْطَادُوا﴾ (المائدة: 2) الدالة على الإباحة بعد التحريم لا على الوجوب.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 12) المجمل والمبين
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='71e92e2f-3e42-4c36-82ac-ae0f7e7b0fde' AND title='المجمل والمبين') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('المجمل والمبين', 'تصنيف أصولي لدلالة الألفاظ من حيث الحاجة إلى بيان زائد', '71e92e2f-3e42-4c36-82ac-ae0f7e7b0fde', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفهما', 'المجمل هو اللفظ الذي لا يُفهَم المراد منه إلا ببيان زائد. المبيَّن هو اللفظ الواضح الدلالة على المراد منه ابتداءً أو بعد ورود ما يزيل إجماله.', 1),
    (v_lesson, 'examples', 'مثاله ودور السنة', 'من أشهر أمثلة المجمل في القرآن: لفظا "الصلاة" و"الزكاة"، إذ لم تُفصَّل أركانهما وشروطهما ومقاديرهما إلا ببيان السنة النبوية العملي والقولي، وهذا يُبرز الدور التفسيري المحوري للسنة في بيان مجملات القرآن.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'الوجيز في أصول الفقه — د. وهبة الزحيلي', 1);
  END IF;

  -- 13) تخريج المناط وتنقيحه
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='3d14db72-af54-4309-8604-8be02077c4fb' AND title='تخريج المناط وتنقيحه') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('تخريج المناط وتنقيحه', 'من مسالك استنباط علة الحكم في القياس الأصولي', '3d14db72-af54-4309-8604-8be02077c4fb', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريف تخريج المناط', 'تخريج المناط هو استخراج المجتهد للعلة التي بُني عليها الحكم من نص أو إجماع لم تُذكر فيه العلة صراحة، وذلك بالاجتهاد في تحديدها من بين الأوصاف المحتمِلة.', 1),
    (v_lesson, 'body', 'تعريف تنقيح المناط', 'تنقيح المناط هو تجريد العلة المستنبَطة مما يقترن بها في واقعة النص من أوصاف لا تأثير لها في الحكم، حتى تبقى العلة الحقيقية المؤثِّرة وحدها. مثاله: تحريم الخمر معلَّلاً بالإسكار، مع تجريد وصف كونها من العنب تحديداً؛ لأن هذا الوصف لا أثر له في علة التحريم.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'إرشاد الفحول — الإمام محمد بن علي الشوكاني', 1);
  END IF;

  -- 14) الصحيح والحسن والضعيف
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='92780a8f-d7ac-4793-996b-53792289fe27' AND title='الصحيح والحسن والضعيف') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('الصحيح والحسن والضعيف', 'تصنيف علماء الحديث للأخبار بحسب درجة ثبوتها', '92780a8f-d7ac-4793-996b-53792289fe27', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'terms', 'الحديث الصحيح', 'عرَّفه الحافظ ابن حجر العسقلاني بأنه: ما اتصل سنده بنقل العدل الضابط عن مثله إلى منتهاه، من غير شذوذ ولا علة.', 1),
    (v_lesson, 'terms', 'الحديث الحسن', 'هو ما اتصل سنده بنقل العدل الذي خفَّ ضبطه عن مثله إلى منتهاه، من غير شذوذ ولا علة — فيشترك مع الصحيح في الاتصال والعدالة، ويفارقه في خفة الضبط.', 2),
    (v_lesson, 'terms', 'الحديث الضعيف', 'هو ما لم تجتمع فيه شروط الصحيح أو الحسن، سواء بانقطاع في السند أو طعن في عدالة أحد رواته أو ضبطه.', 3);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'نزهة النظر شرح نخبة الفكر — الحافظ ابن حجر العسقلاني', 1);
  END IF;

  -- 15) شروح الحديث
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE category_id='40327a3c-d487-429d-b3a8-c7c343b55ec2' AND title='شروح الحديث') THEN
    INSERT INTO lessons (title, description, category_id, activity_type, status)
    VALUES ('شروح الحديث', 'فن تصنيفي يتناول أحاديث كتب السنة بالتفسير وبيان الفقه المستنبط منها', '40327a3c-d487-429d-b3a8-c7c343b55ec2', 'درس', 'approved')
    RETURNING id INTO v_lesson;
    INSERT INTO lesson_sections (lesson_id, section_type, title, content, sort_order) VALUES
    (v_lesson, 'body', 'تعريفها وغايتها', 'شروح الحديث مصنفات تتناول أحاديث كتب السنة بالتوضيح اللغوي وضبط الألفاظ وبيان أسباب ورودها والفقه والفوائد المستنبطة منها، وهي من أهم أدوات فهم الحديث النبوي في سياقه الصحيح.', 1),
    (v_lesson, 'examples', 'أمثلة من كتب الشروح المعتمدة', 'من أشهر شروح الحديث: "فتح الباري بشرح صحيح البخاري" لابن حجر العسقلاني، و"المنهاج شرح صحيح مسلم" للإمام النووي، و"عون المعبود شرح سنن أبي داود" لمحمد شمس الحق العظيم آبادي.', 2);
    INSERT INTO lesson_citations (lesson_id, source_type, citation, sort_order) VALUES
    (v_lesson, 'book', 'علوم الحديث (مقدمة ابن الصلاح) — الإمام ابن الصلاح الشهرزوري', 1);
  END IF;

  -- نشر التصنيفات الخمسة عشر بعد اكتمال محتواها الأساسي
  UPDATE categories SET status='published', updated_at=now()
  WHERE slug IN (
    'quran-dalil','sunnah-dalil','ijma','qiyas','istishab','masalih-mursala',
    'sadd-dharai','urf','aam-khas','mutlaq-muqayyad','amr-nahy','mujmal-mubayyan',
    'takhrij-tanqih-manat','sahih-hasan-daif','shuruh-hadith'
  ) AND status='draft';
END $$;
