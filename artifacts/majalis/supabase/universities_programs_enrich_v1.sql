-- universities_programs_enrich_v1.sql
-- إثراء البرامج والأسئلة الشائعة بنمط NOT EXISTS لمنع التكرار عند إعادة التشغيل.
-- لا توجد رسوم دراسية أو مواعيد قبول ثابتة في هذا الملف؛ tuition_fees يظل NULL افتراضياً.

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الشريعة', 'كلية الشريعة', 'الفقه وأصوله', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', true, 'تُعلن الجامعة منحاً ومزايا للطلاب غير السعوديين المقبولين وفق لوائحها الرسمية.', 'SAR'
FROM universities u
WHERE u.slug = 'islamic-university-madinah'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الشريعة'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس القرآن الكريم والدراسات الإسلامية', 'كلية القرآن الكريم والدراسات الإسلامية', 'القراءات والتفسير', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', true, 'تخضع المنح وشروطها لما تنشره الجامعة في بوابة القبول الرسمية.', 'SAR'
FROM universities u
WHERE u.slug = 'islamic-university-madinah'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس القرآن الكريم والدراسات الإسلامية'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ماجستير الحديث الشريف', 'كلية الحديث الشريف والدراسات الإسلامية', 'علوم الحديث', 'ماجستير', 'العربية', 'حضوري', 'سنتان', true, 'قد تتاح منح أو مقاعد للطلاب الدوليين وفق إعلان الجامعة.', 'SAR'
FROM universities u
WHERE u.slug = 'islamic-university-madinah'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ماجستير الحديث الشريف'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الدعوة وأصول الدين', 'كلية الدعوة وأصول الدين', 'العقيدة والدعوة', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', true, 'المنح مرتبطة بالقبول الرسمي وباللوائح المنشورة.', 'SAR'
FROM universities u
WHERE u.slug = 'islamic-university-madinah'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الدعوة وأصول الدين'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل تقبل الجامعة طلاباً من خارج السعودية؟', 'نعم، تُعرف الجامعة بقبول طلاب مسلمين من دول متعددة، لكن تفاصيل القبول والمنح تُراجع من بوابة الجامعة الرسمية في كل دورة.', 1
FROM universities u
WHERE u.slug = 'islamic-university-madinah'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل تقبل الجامعة طلاباً من خارج السعودية؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'ما لغة الدراسة في الكليات الشرعية؟', 'الأصل في الكليات الشرعية أن الدراسة بالعربية، مع وجود مسارات أو معاهد تأهيلية للطلاب غير الناطقين بها بحسب إعلان الجامعة.', 2
FROM universities u
WHERE u.slug = 'islamic-university-madinah'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'ما لغة الدراسة في الكليات الشرعية؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل توجد كلية متخصصة للقرآن والحديث؟', 'نعم، تضم الجامعة كلية للقرآن الكريم والدراسات الإسلامية وكلية للحديث الشريف والدراسات الإسلامية ضمن كلياتها الرسمية.', 3
FROM universities u
WHERE u.slug = 'islamic-university-madinah'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل توجد كلية متخصصة للقرآن والحديث؟'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس أصول الدين', 'كلية أصول الدين', 'العقيدة والتفسير والحديث', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'EGP'
FROM universities u
WHERE u.slug = 'al-azhar-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس أصول الدين'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الشريعة والقانون', 'كلية الشريعة والقانون', 'الفقه والقانون', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'EGP'
FROM universities u
WHERE u.slug = 'al-azhar-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الشريعة والقانون'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس اللغة العربية', 'كلية اللغة العربية', 'النحو والبلاغة والأدب', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'EGP'
FROM universities u
WHERE u.slug = 'al-azhar-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس اللغة العربية'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ماجستير الدراسات الإسلامية', 'كليات الدراسات الإسلامية والعربية', 'دراسات إسلامية متخصصة', 'ماجستير', 'العربية', 'حضوري', 'سنتان', false, '', 'EGP'
FROM universities u
WHERE u.slug = 'al-azhar-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ماجستير الدراسات الإسلامية'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل توجد كليات شرعية متعددة في الأزهر؟', 'نعم، تشمل الكليات الشرعية واللغوية أصول الدين والشريعة والقانون واللغة العربية والدراسات الإسلامية والعربية، وتختلف الفروع بحسب المحافظة.', 1
FROM universities u
WHERE u.slug = 'al-azhar-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل توجد كليات شرعية متعددة في الأزهر؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل تُنشر رسوم أو مواعيد ثابتة هنا؟', 'لا؛ لأن الرسوم والمواعيد تتغير، ويجب الرجوع إلى بوابة جامعة الأزهر أو مكتب تنسيق الوافدين عند التقديم.', 2
FROM universities u
WHERE u.slug = 'al-azhar-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل تُنشر رسوم أو مواعيد ثابتة هنا؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل الدراسة في الكليات الشرعية بالعربية؟', 'الأصل أن الدراسة في الكليات الشرعية واللغوية بالعربية، مع اختلاف التفاصيل حسب الكلية والبرنامج.', 3
FROM universities u
WHERE u.slug = 'al-azhar-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل الدراسة في الكليات الشرعية بالعربية؟'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الشريعة', 'كلية الشريعة والدراسات الإسلامية', 'الشريعة', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'SAR'
FROM universities u
WHERE u.slug = 'umm-al-qura-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الشريعة'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الدعوة وأصول الدين', 'كلية الدعوة وأصول الدين', 'الدعوة والعقيدة', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'SAR'
FROM universities u
WHERE u.slug = 'umm-al-qura-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الدعوة وأصول الدين'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس اللغة العربية', 'كلية اللغة العربية وآدابها', 'اللغة العربية وآدابها', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'SAR'
FROM universities u
WHERE u.slug = 'umm-al-qura-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس اللغة العربية'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الشريعة', 'كلية الشريعة', 'الفقه وأصوله', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'SAR'
FROM universities u
WHERE u.slug = 'imam-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الشريعة'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس أصول الدين', 'كلية أصول الدين', 'العقيدة والقرآن والسنة', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'SAR'
FROM universities u
WHERE u.slug = 'imam-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس أصول الدين'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ماجستير السياسة الشرعية', 'المعهد العالي للقضاء', 'القضاء والسياسة الشرعية', 'ماجستير', 'العربية', 'حضوري', 'سنتان', false, '', 'SAR'
FROM universities u
WHERE u.slug = 'imam-university'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ماجستير السياسة الشرعية'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Bachelor of Islamic Revealed Knowledge and Heritage', 'AbdulHamid AbuSulayman Kulliyyah of Islamic Revealed Knowledge and Human Sciences', 'Islamic Revealed Knowledge', 'بكالوريوس', 'الإنجليزية', 'حضوري', '4 سنوات', false, '', 'MYR'
FROM universities u
WHERE u.slug = 'iium-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Bachelor of Islamic Revealed Knowledge and Heritage'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Bachelor of Laws (Shariah)', 'Ahmad Ibrahim Kulliyyah of Laws', 'الشريعة والقانون', 'بكالوريوس', 'الإنجليزية', 'حضوري', '4 سنوات', false, '', 'MYR'
FROM universities u
WHERE u.slug = 'iium-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Bachelor of Laws (Shariah)'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Master of Islamic Revealed Knowledge and Heritage', 'Kulliyyah of Islamic Revealed Knowledge and Human Sciences', 'الدراسات الإسلامية', 'ماجستير', 'الإنجليزية', 'حضوري', 'سنة إلى سنتين', false, '', 'MYR'
FROM universities u
WHERE u.slug = 'iium-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Master of Islamic Revealed Knowledge and Heritage'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل تعتمد IIUM العربية لغة رئيسية؟', 'تستخدم الجامعة الإنجليزية على نطاق واسع، وتوجد مقررات ومكونات عربية في التخصصات الإسلامية بحسب البرنامج والكلية.', 1
FROM universities u
WHERE u.slug = 'iium-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل تعتمد IIUM العربية لغة رئيسية؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'كيف تُعرض إشارة QS 2026؟', 'تُذكر بحذر كخبر أو تغطية تصنيفية في مجال Theology, Divinity and Religious Studies، ولا تُستخدم وحدها بديلاً عن مراجعة البرنامج الرسمي.', 2
FROM universities u
WHERE u.slug = 'iium-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'كيف تُعرض إشارة QS 2026؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل تقدم الجامعة تخصصات شرعية وقانونية؟', 'نعم، توجد مسارات في المعرفة الإسلامية والتراث، إضافة إلى برامج في الشريعة والقانون ضمن كليات الجامعة.', 3
FROM universities u
WHERE u.slug = 'iium-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل تقدم الجامعة تخصصات شرعية وقانونية؟'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الفقه وأصوله', 'كلية الشريعة والدراسات الإسلامية', 'الفقه وأصوله', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'QAR'
FROM universities u
WHERE u.slug = 'qatar-faculty-shariah'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الفقه وأصوله'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس القرآن والسنة', 'كلية الشريعة والدراسات الإسلامية', 'القرآن والسنة', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'QAR'
FROM universities u
WHERE u.slug = 'qatar-faculty-shariah'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس القرآن والسنة'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ماجستير الفقه وأصوله', 'كلية الشريعة والدراسات الإسلامية', 'الفقه وأصوله', 'ماجستير', 'العربية', 'حضوري', 'سنتان', false, '', 'QAR'
FROM universities u
WHERE u.slug = 'qatar-faculty-shariah'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ماجستير الفقه وأصوله'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'ما الرابط الرسمي للكلية؟', 'الرابط المدرج هو صفحة كلية الشريعة والدراسات الإسلامية ضمن موقع جامعة قطر، وقد يتغير مسار الصفحات الداخلية مع تحديثات الموقع.', 1
FROM universities u
WHERE u.slug = 'qatar-faculty-shariah'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'ما الرابط الرسمي للكلية؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'ما أبرز البرامج المتاحة؟', 'تذكر جامعة قطر برامج في الفقه وأصوله، والقرآن والسنة، والعقيدة والدعوة، والدراسات الإسلامية، إضافة إلى برامج ماجستير ذات صلة.', 2
FROM universities u
WHERE u.slug = 'qatar-faculty-shariah'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'ما أبرز البرامج المتاحة؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل توجد مواعيد تقديم ثابتة؟', 'لا تُثبت المواعيد هنا؛ يجب الرجوع إلى تقويم القبول في جامعة قطر لأنه يتغير حسب الفصل والبرنامج.', 3
FROM universities u
WHERE u.slug = 'qatar-faculty-shariah'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل توجد مواعيد تقديم ثابتة؟'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'BA in Liberal Arts and Islamic Studies', 'Liberal Arts and Islamic Studies', 'الدراسات الإسلامية والآداب الحرة', 'بكالوريوس', 'الإنجليزية', 'حضوري', '4 سنوات', false, '', 'USD'
FROM universities u
WHERE u.slug = 'zaytuna-college'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'BA in Liberal Arts and Islamic Studies'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MA in Islamic Texts', 'Graduate Studies', 'النصوص الإسلامية', 'ماجستير', 'الإنجليزية والعربية', 'حضوري', 'سنتان', false, '', 'USD'
FROM universities u
WHERE u.slug = 'zaytuna-college'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MA in Islamic Texts'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'BS Shariah and Law', 'Faculty of Shariah and Law', 'الشريعة والقانون', 'بكالوريوس', 'الإنجليزية والعربية', 'حضوري', '4 سنوات', false, '', 'PKR'
FROM universities u
WHERE u.slug = 'iiu-islamabad'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'BS Shariah and Law'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'BS Usuluddin', 'Faculty of Usuluddin', 'أصول الدين', 'بكالوريوس', 'العربية والإنجليزية', 'حضوري', '4 سنوات', false, '', 'PKR'
FROM universities u
WHERE u.slug = 'iiu-islamabad'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'BS Usuluddin'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MS Islamic Banking and Finance', 'International Institute of Islamic Economics', 'الاقتصاد والتمويل الإسلامي', 'ماجستير', 'الإنجليزية', 'حضوري', 'سنتان', false, '', 'PKR'
FROM universities u
WHERE u.slug = 'iiu-islamabad'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MS Islamic Banking and Finance'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'الإجازة في الشريعة', 'كلية الشريعة', 'الشريعة والفقه', 'بكالوريوس', 'العربية', 'حضوري', '3 سنوات', false, '', 'MAD'
FROM universities u
WHERE u.slug = 'al-qarawiyyin'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'الإجازة في الشريعة'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'الإجازة في اللغة العربية', 'كلية اللغة العربية', 'اللغة العربية وآدابها', 'بكالوريوس', 'العربية', 'حضوري', '3 سنوات', false, '', 'MAD'
FROM universities u
WHERE u.slug = 'al-qarawiyyin'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'الإجازة في اللغة العربية'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ماجستير التاريخ والحضارة الإسلامية', 'الكليات الشرعية واللغوية', 'التاريخ والحضارة الإسلامية', 'ماجستير', 'العربية', 'حضوري', 'سنتان', false, '', 'MAD'
FROM universities u
WHERE u.slug = 'al-qarawiyyin'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ماجستير التاريخ والحضارة الإسلامية'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'لماذا تُعد القرويين اسماً مهماً؟', 'تُذكر القرويين في مراجع دولية بوصفها من أقدم مؤسسات التعليم المستمر، لكن تفاصيل البرامج الحالية تُؤخذ من موقع الجامعة ولوائحها المغربية.', 1
FROM universities u
WHERE u.slug = 'al-qarawiyyin'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'لماذا تُعد القرويين اسماً مهماً؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'ما أبرز مجالات الدراسة فيها؟', 'تدور مجالاتها المتصلة بالمنصة حول الشريعة واللغة العربية والتاريخ والحضارة الإسلامية.', 2
FROM universities u
WHERE u.slug = 'al-qarawiyyin'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'ما أبرز مجالات الدراسة فيها؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل توجد رسوم أو مواعيد محددة هنا؟', 'لا، لم تُدرج رسوم أو مواعيد ثابتة لأن الإعلان الرسمي يتغير حسب السنة والمسلك.', 3
FROM universities u
WHERE u.slug = 'al-qarawiyyin'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل توجد رسوم أو مواعيد محددة هنا؟'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Bachelor of Laws and Shariah with Honours', 'Faculty of Syariah and Law (FSU)', 'الشريعة والقانون', 'بكالوريوس', 'الإنجليزية والماليزية', 'حضوري', '4 سنوات', false, '', 'MYR'
FROM universities u
WHERE u.slug = 'usim-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Bachelor of Laws and Shariah with Honours'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Bachelor of Fiqh and Fatwa with Honours', 'Faculty of Syariah and Law (FSU)', 'الفقه والفتوى', 'بكالوريوس', 'الماليزية والعربية', 'حضوري', '4 سنوات', false, '', 'MYR'
FROM universities u
WHERE u.slug = 'usim-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Bachelor of Fiqh and Fatwa with Honours'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Master of Shariah', 'Faculty of Syariah and Law (FSU)', 'الشريعة', 'ماجستير', 'الإنجليزية والماليزية', 'حضوري', 'سنة إلى سنتين', false, '', 'MYR'
FROM universities u
WHERE u.slug = 'usim-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Master of Shariah'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Bachelor of Islamic Sciences', 'Faculty of Islamic Sciences', 'علوم إسلامية', 'بكالوريوس', 'العربية', 'عن_بعد', '4 سنوات', false, '', 'MYR'
FROM universities u
WHERE u.slug = 'mediu-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Bachelor of Islamic Sciences'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Bachelor of Arabic Language', 'Faculty of Languages', 'اللغة العربية', 'بكالوريوس', 'العربية', 'عن_بعد', '4 سنوات', false, '', 'MYR'
FROM universities u
WHERE u.slug = 'mediu-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Bachelor of Arabic Language'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Master in Fiqh and Usul al-Fiqh', 'Faculty of Islamic Sciences', 'الفقه وأصوله', 'ماجستير', 'العربية', 'عن_بعد', 'سنتان', false, '', 'MYR'
FROM universities u
WHERE u.slug = 'mediu-malaysia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Master in Fiqh and Usul al-Fiqh'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Sarjana Hukum Keluarga Islam', 'Fakultas Syari’ah dan Hukum', 'الأحوال الشخصية الإسلامية', 'بكالوريوس', 'الإندونيسية', 'حضوري', '4 سنوات', false, '', 'IDR'
FROM universities u
WHERE u.slug = 'uin-sunan-kalijaga'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Sarjana Hukum Keluarga Islam'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Sarjana Ilmu Al-Quran dan Tafsir', 'Fakultas Ushuluddin dan Pemikiran Islam', 'علوم القرآن والتفسير', 'بكالوريوس', 'الإندونيسية والعربية', 'حضوري', '4 سنوات', false, '', 'IDR'
FROM universities u
WHERE u.slug = 'uin-sunan-kalijaga'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Sarjana Ilmu Al-Quran dan Tafsir'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الشريعة', 'كلية الشريعة والدراسات الإسلامية', 'الفقه وأصوله', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'KWD'
FROM universities u
WHERE u.slug = 'kuwait-sharia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الشريعة'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس التفسير والحديث', 'كلية الشريعة والدراسات الإسلامية', 'التفسير والحديث', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'KWD'
FROM universities u
WHERE u.slug = 'kuwait-sharia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس التفسير والحديث'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ماجستير الفقه المقارن وأصول الفقه', 'كلية الدراسات العليا/كلية الشريعة', 'الفقه وأصوله', 'ماجستير', 'العربية', 'حضوري', 'سنتان', false, '', 'KWD'
FROM universities u
WHERE u.slug = 'kuwait-sharia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ماجستير الفقه المقارن وأصول الفقه'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل الكلية تابعة لجامعة الكويت؟', 'نعم، هي كلية ضمن جامعة الكويت، ويجب متابعة شروط القبول عبر قنوات الجامعة الرسمية.', 1
FROM universities u
WHERE u.slug = 'kuwait-sharia'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل الكلية تابعة لجامعة الكويت؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل توجد سنة تأسيس موثقة؟', 'تُذكر سنة 1982 بوصفها سنة تأسيس الكلية في التعريفات المنشورة عنها.', 2
FROM universities u
WHERE u.slug = 'kuwait-sharia'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل توجد سنة تأسيس موثقة؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل أدرجت رسوم الدراسة؟', 'لا؛ تُترك الرسوم والمنح للوائح جامعة الكويت لأن الأرقام تتغير حسب الفئة والبرنامج.', 3
FROM universities u
WHERE u.slug = 'kuwait-sharia'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل أدرجت رسوم الدراسة؟'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MA in Applied Islamic Ethics', 'College of Islamic Studies', 'الأخلاق الإسلامية التطبيقية', 'ماجستير', 'الإنجليزية', 'حضوري', 'سنتان', false, '', 'QAR'
FROM universities u
WHERE u.slug = 'hbku-cis'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MA in Applied Islamic Ethics'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MA in Islam and Global Affairs', 'College of Islamic Studies', 'الإسلام والشؤون العالمية', 'ماجستير', 'الإنجليزية', 'حضوري', 'سنتان', false, '', 'QAR'
FROM universities u
WHERE u.slug = 'hbku-cis'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MA in Islam and Global Affairs'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'PhD in Islamic Finance and Economy', 'College of Islamic Studies', 'التمويل والاقتصاد الإسلامي', 'دكتوراه', 'الإنجليزية', 'حضوري', '3 إلى 4 سنوات', false, '', 'QAR'
FROM universities u
WHERE u.slug = 'hbku-cis'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'PhD in Islamic Finance and Economy'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل تقدم الكلية بكالوريوس؟', 'تتركز برامج كلية الدراسات الإسلامية في HBKU غالباً في الدراسات العليا، لذلك يجب مراجعة صفحة البرامج الرسمية قبل التقديم.', 1
FROM universities u
WHERE u.slug = 'hbku-cis'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل تقدم الكلية بكالوريوس؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'ما طبيعة الدراسة فيها؟', 'تميل البرامج إلى معالجة قضايا إسلامية معاصرة وبحثية مثل الأخلاق التطبيقية والاقتصاد الإسلامي والشؤون العالمية.', 2
FROM universities u
WHERE u.slug = 'hbku-cis'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'ما طبيعة الدراسة فيها؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'ما لغة البرامج؟', 'تعرض برامج كثيرة بالإنجليزية مع حضور لمصادر عربية وإسلامية بحسب المساق والمجال.', 3
FROM universities u
WHERE u.slug = 'hbku-cis'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'ما لغة البرامج؟'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الفقه والفتوى', 'كلية الدراسات الإسلامية', 'الفقه والفتوى', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'AED'
FROM universities u
WHERE u.slug = 'mbzuh'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الفقه والفتوى'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس القرآن والحديث', 'كلية الدراسات الإسلامية', 'القرآن والحديث', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'AED'
FROM universities u
WHERE u.slug = 'mbzuh'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس القرآن والحديث'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ليسانس الشريعة', 'كلية الشريعة والاقتصاد', 'الشريعة', 'بكالوريوس', 'العربية', 'حضوري', '3 سنوات', false, '', 'DZD'
FROM universities u
WHERE u.slug = 'emir-abdelkader-constantine'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ليسانس الشريعة'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ليسانس أصول الدين', 'كلية أصول الدين', 'العقيدة والدعوة', 'بكالوريوس', 'العربية', 'حضوري', '3 سنوات', false, '', 'DZD'
FROM universities u
WHERE u.slug = 'emir-abdelkader-constantine'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ليسانس أصول الدين'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'BA (Hons) in Islamic Studies', 'Cambridge Muslim College', 'الدراسات الإسلامية', 'بكالوريوس', 'الإنجليزية والعربية', 'حضوري', '3 سنوات', false, '', 'GBP'
FROM universities u
WHERE u.slug = 'cambridge-muslim-college'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'BA (Hons) in Islamic Studies'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'Classical Arabic Programme', 'Cambridge Muslim College', 'العربية الكلاسيكية', 'دبلوم', 'الإنجليزية والعربية', 'حضوري', 'سنة واحدة', false, '', 'GBP'
FROM universities u
WHERE u.slug = 'cambridge-muslim-college'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'Classical Arabic Programme'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'من يمنح درجة BA؟', 'توضح الكلية أن BA (Hons) in Islamic Studies validated by The Open University، أي أن الجامعة المفتوحة هي الجهة المانحة للدرجة.', 1
FROM universities u
WHERE u.slug = 'cambridge-muslim-college'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'من يمنح درجة BA؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'هل القبول لعام 2026 مفتوح؟', 'نشر موقع الكلية إعلاناً عن قبول دفعة 2026، لكن حالة القبول النهائية والمواعيد تُراجع من صفحة البرنامج الرسمية.', 2
FROM universities u
WHERE u.slug = 'cambridge-muslim-college'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'هل القبول لعام 2026 مفتوح؟'
  );

INSERT INTO university_faqs (university_id, question, answer, order_index)
SELECT u.id, 'ما مدة BA؟', 'تذكر صفحة البرنامج أنه برنامج حضوري بدوام كامل مدته ثلاث سنوات.', 3
FROM universities u
WHERE u.slug = 'cambridge-muslim-college'
  AND NOT EXISTS (
    SELECT 1 FROM university_faqs q
    WHERE q.university_id = u.id AND q.question = 'ما مدة BA؟'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'BA Religions and Philosophies', 'School of History, Religions and Philosophies', 'الأديان والفلسفات مع مسارات إسلامية', 'بكالوريوس', 'الإنجليزية', 'حضوري', '3 سنوات', false, '', 'GBP'
FROM universities u
WHERE u.slug = 'soas-islamic-studies'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'BA Religions and Philosophies'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MA Islamic Studies', 'School of History, Religions and Philosophies', 'الدراسات الإسلامية الأكاديمية', 'ماجستير', 'الإنجليزية', 'حضوري', 'سنة واحدة غالباً', false, '', 'GBP'
FROM universities u
WHERE u.slug = 'soas-islamic-studies'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MA Islamic Studies'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MA Islamic Studies and Middle Eastern Studies', 'Islamic and Middle Eastern Studies', 'الدراسات الإسلامية والشرق أوسطية', 'بكالوريوس', 'الإنجليزية', 'حضوري', '4 سنوات', false, '', 'GBP'
FROM universities u
WHERE u.slug = 'edinburgh-imes'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MA Islamic Studies and Middle Eastern Studies'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MSc Islamic and Middle Eastern Studies', 'Islamic and Middle Eastern Studies', 'دراسات إسلامية وشرق أوسطية', 'ماجستير', 'الإنجليزية', 'حضوري', 'سنة واحدة غالباً', false, '', 'GBP'
FROM universities u
WHERE u.slug = 'edinburgh-imes'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MSc Islamic and Middle Eastern Studies'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'İlahiyat Lisans Programı', 'Faculty of Theology', 'الإلهيات', 'بكالوريوس', 'التركية والعربية', 'حضوري', '4 سنوات', false, '', 'TRY'
FROM universities u
WHERE u.slug = 'ankara-ilahiyat'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'İlahiyat Lisans Programı'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MA in Basic Islamic Sciences', 'Faculty of Theology', 'العلوم الإسلامية الأساسية', 'ماجستير', 'التركية', 'حضوري', 'سنتان', false, '', 'TRY'
FROM universities u
WHERE u.slug = 'ankara-ilahiyat'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MA in Basic Islamic Sciences'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الشريعة والقانون', 'كلية الشريعة والقانون', 'الشريعة والقانون', 'بكالوريوس', 'العربية والفرنسية', 'حضوري', '4 سنوات', false, '', 'XOF'
FROM universities u
WHERE u.slug = 'islamic-university-niger'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الشريعة والقانون'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس اللغة العربية والدراسات الإسلامية', 'كلية الآداب والعلوم الإسلامية', 'العربية والدراسات الإسلامية', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'XOF'
FROM universities u
WHERE u.slug = 'islamic-university-niger'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس اللغة العربية والدراسات الإسلامية'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الدراسات الإسلامية', 'برامج الدراسات الإسلامية ضمن الجامعة', 'الدراسات الإسلامية', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'SAR'
FROM universities u
WHERE u.slug = 'king-saud-islamic-studies'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الدراسات الإسلامية'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ماجستير الثقافة الإسلامية', 'الأقسام الشرعية والإنسانية ذات الصلة', 'الثقافة الإسلامية', 'ماجستير', 'العربية', 'حضوري', 'سنتان', false, '', 'SAR'
FROM universities u
WHERE u.slug = 'king-saud-islamic-studies'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ماجستير الثقافة الإسلامية'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس الفقه وأصوله', 'كلية الشريعة', 'الفقه وأصوله', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'JOD'
FROM universities u
WHERE u.slug = 'al-bayt-university-sharia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس الفقه وأصوله'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس أصول الدين', 'كلية الشريعة', 'أصول الدين', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'JOD'
FROM universities u
WHERE u.slug = 'al-bayt-university-sharia'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس أصول الدين'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'بكالوريوس علوم القرآن والتربية الإسلامية', 'قسم علوم القرآن الكريم والتربية الإسلامية', 'علوم القرآن والتربية الإسلامية', 'بكالوريوس', 'العربية', 'حضوري', '4 سنوات', false, '', 'IQD'
FROM universities u
WHERE u.slug = 'mustansiriya-quran'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'بكالوريوس علوم القرآن والتربية الإسلامية'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'ماجستير علوم القرآن', 'قسم علوم القرآن الكريم والتربية الإسلامية', 'علوم القرآن', 'ماجستير', 'العربية', 'حضوري', 'سنتان', false, '', 'IQD'
FROM universities u
WHERE u.slug = 'mustansiriya-quran'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'ماجستير علوم القرآن'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'BA Islamic Studies', 'Department of Islamic Studies', 'الدراسات الإسلامية', 'بكالوريوس', 'الإنجليزية والأردية', 'حضوري', '3 سنوات', false, '', 'INR'
FROM universities u
WHERE u.slug = 'amu-islamic-studies'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'BA Islamic Studies'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MA Islamic Studies', 'Department of Islamic Studies', 'الدراسات الإسلامية', 'ماجستير', 'الإنجليزية والأردية', 'حضوري', 'سنتان', false, '', 'INR'
FROM universities u
WHERE u.slug = 'amu-islamic-studies'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MA Islamic Studies'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'İlahiyat Lisans Programı', 'Faculty of Theology', 'الإلهيات', 'بكالوريوس', 'التركية والعربية', 'حضوري', '4 سنوات', false, '', 'TRY'
FROM universities u
WHERE u.slug = 'istanbul-ilahiyat'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'İlahiyat Lisans Programı'
  );

INSERT INTO university_programs (university_id, program_name, faculty_department, specialization, degree_level, study_language, study_mode, duration, has_scholarship, scholarship_details, currency)
SELECT u.id, 'MA in Islamic Studies', 'Faculty of Theology', 'العلوم الإسلامية', 'ماجستير', 'التركية', 'حضوري', 'سنتان', false, '', 'TRY'
FROM universities u
WHERE u.slug = 'istanbul-ilahiyat'
  AND NOT EXISTS (
    SELECT 1 FROM university_programs p
    WHERE p.university_id = u.id AND p.program_name = 'MA in Islamic Studies'
  );
