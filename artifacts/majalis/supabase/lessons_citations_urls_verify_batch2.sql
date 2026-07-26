-- ============================================================================
-- تدقيق المصدر السابع والعشرين `lessons` — الدفعة الثانية:
-- استشهادات الفتاوى غير الكتابية في `lesson_citations` (22 fatwa_body + 2 website)
--
-- الخلفية: كل صفوف `lesson_citations` (505 صفًّا) كانت `url IS NULL` بلا
-- استثناء، مع أن `LearnLessonPage.tsx:122` يعرض رابط الاستشهاد للمستخدم متى
-- وُجد. فالاستشهادات التي تنسب فتوى إلى جهة رسمية (دار الإفتاء المصرية،
-- إسلام ويب، مجمع الفقه الإسلامي الدولي) كانت تصل المستخدم **بلا أي مستند
-- قابل للتحقق** — وهو الصنف نفسه الذي أدّى إلى حذف ثلاثين صفًّا في ج-٢٠٩.
--
-- ما جرى: فُتحت صفحة كل فتوى على موقع الجهة نفسها وقُوبل **رقم الفتوى
-- وتاريخها واسم المفتي وعنوانها** بما في الاستشهاد، واحدًا واحدًا:
--   • أربع فتاوى إسلام ويب (124273، 197189، 286906، 296344): مطابقة تامة.
--   • ست عشرة فتوى لدار الإفتاء المصرية: الرقم والتاريخ والمفتي مطابق في
--     كلٍّ منها بلا استثناء (4205، 4237، 4458، 503، 7351، 7360، 7553،
--     8009، 8152، 8216، 8535، 8669، 8784، 8839، 8924).
--   • مقالان لدار الإفتاء، وقرارا مجمع الفقه الإسلامي الدولي 237 (8/24)
--     و26 (1/4): مطابقان لصفحتيهما الرسميتين على iifa-aifi.org.
-- فلم يُحذف شيء في هذه الدفعة؛ العلاج هو **إسناد كل استشهاد إلى رابطه**.
--
-- وثلاثة عناوين خالفت العنوان الرسمي المنشور فصُحّحت إلى نصّه حرفيًّا
-- (الرقم والتاريخ والمفتي كانت صحيحة فيها كلها).
--
-- idempotent: كل جملة UPDATE مقيَّدة بـ id ثابت وتكتب قيمة نهائية.
-- ============================================================================

-- (١) إسلام ويب — مركز الفتوى (أربعة استشهادات)
UPDATE lesson_citations SET url = 'https://www.islamweb.net/ar/fatwa/124273/' WHERE id = '97f90cbe-e9f7-49db-aae0-5f4b312182da';
UPDATE lesson_citations SET url = 'https://www.islamweb.net/ar/fatwa/197189/' WHERE id = '1b3265dc-e19a-41a3-bf75-e4d3e01d1703';
UPDATE lesson_citations SET url = 'https://www.islamweb.net/ar/fatwa/286906/' WHERE id = 'a8d3424d-5afa-4f87-bb58-ab25f246e0c3';
UPDATE lesson_citations SET url = 'https://www.islamweb.net/ar/fatwa/296344/' WHERE id = '92e51707-a7d2-45a5-b212-6e038172943e';

-- (٢) دار الإفتاء المصرية — الفتاوى (ستة عشر استشهادًا)
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/14139/' WHERE id = '127a6c1b-2272-4e13-ab93-a294fac9f50a';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/14201/' WHERE id = 'f690fe24-4b63-485e-a214-716018d2f212';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/14616/' WHERE id = '2148872a-28f2-48c9-a9fb-43b812003c1d';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/11432/' WHERE id = 'e62745b4-aad2-4024-a440-aaeb9837f883';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/18059/' WHERE id = 'd33fb292-5b90-4426-803b-9b4429a46334';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/18087/' WHERE id = '4d548054-f088-4f63-b038-ebe0436862e9';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/18445/' WHERE id = '96ddb549-62b9-4d01-b82d-ef5c16599e46';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/20678/' WHERE id = '4efb8831-107f-43d7-b0c0-a41cd0538b90';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/19890/' WHERE id = '83d06c20-ed54-473b-a521-04430feed3dc';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/20178/' WHERE id = '20d27876-3fbb-4c2c-88f4-191fc08f63f4';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/21697/' WHERE id = '43a3e7dc-337a-4731-a796-2d3a1d480d0e';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/21972/' WHERE id = '2867f1d7-59e4-47ce-a6a8-1d78ad545ebe';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/22158/' WHERE id = '037fca68-915d-4b4c-9c40-998d7f46adc3';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/22158/' WHERE id = '4fcaa483-0cc8-4471-94ca-2436424433ca';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/22375/' WHERE id = 'ec94170a-6f8e-4d78-b735-2b155e46d1fe';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/fatwa/details/23885/' WHERE id = '78ddb55a-8094-446e-9640-bb6d4e5cc285';

-- (٣) دار الإفتاء المصرية — المقالات (استشهادان)
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/ourreligion/details/4143/' WHERE id = 'c949ddd7-84fc-4544-81e7-d2311155f471';
UPDATE lesson_citations SET url = 'https://www.dar-alifta.org/ar/articles/details/12220/' WHERE id = '0d01b541-791f-4c53-9206-6c22a2e346d9';

-- (٤) مجمع الفقه الإسلامي الدولي (استشهادان)
UPDATE lesson_citations SET url = 'https://iifa-aifi.org/en/33163.html' WHERE id = '81018340-8cdc-45af-b4f7-33e27f058bb4';
UPDATE lesson_citations SET url = 'https://iifa-aifi.org/en/32287.html' WHERE id = '8781f275-e8db-4fdc-b278-be26714acbfe';

-- ============================================================================
-- (٥) تصحيح ثلاثة عناوين إلى نصّها الرسمي المنشور على موقع الجهة
-- ============================================================================

-- 503: العنوان الرسمي «أطفال الأنابيب» لا «طفل الأنابيب»
UPDATE lesson_citations
SET citation = 'دار الإفتاء المصرية، فتوى رقم 503: حكم الإخصاب الصناعي وأطفال الأنابيب وتأجير الأرحام (7 فبراير 2006م، أ.د/ علي جمعة محمد)'
WHERE id = 'e62745b4-aad2-4024-a440-aaeb9837f883';

-- 8216: العنوان الرسمي «بعض مظاهر حماية ورعاية الإسلام للبيئة»
UPDATE lesson_citations
SET citation = 'دار الإفتاء المصرية، فتوى رقم 8216: بعض مظاهر حماية ورعاية الإسلام للبيئة (4 يناير 2024م، أ.د/ شوقي إبراهيم علام)'
WHERE id = '20d27876-3fbb-4c2c-88f4-191fc08f63f4';

-- 8784: العنوان الرسمي «حكم استخدام تطبيقات الذكاء الاصطناعي (AI) في الاستفتاء»
UPDATE lesson_citations
SET citation = 'دار الإفتاء المصرية، فتوى رقم 8784: حكم استخدام تطبيقات الذكاء الاصطناعي (AI) في الاستفتاء (22 سبتمبر 2025م، أ.د/ نظير محمد عياد)'
WHERE id = '4fcaa483-0cc8-4471-94ca-2436424433ca';

-- تحقّق بعد التطبيق:
--   SELECT count(*) FILTER (WHERE url IS NULL) AS no_url, count(*) AS total
--   FROM lesson_citations WHERE source_type <> 'book';   -- المتوقَّع: 0 / 24
