-- تدقيق استشهادات الكتب في lesson_citations — الدفعة السادسة (ج-٢٢١):
-- ثلاثون نصًّا بترتيب أبجدي (ORDER BY citation) من الـ142 صفًّا الباقية بلا رابط،
-- ابتداءً من «المفردات في غريب القرآن — الراغب الأصفهاني» (أي بعد كتلة «المغني» المعالَجة في ج-٢٢٠)
-- وانتهاءً بـ«تطوير الأعمال المصرفية… — سامي حسن أحمد حمود».
-- يُستثنى «المواريث في الشريعة الإسلامية… — الصابوني» الموثَّق سابقًا كـ«متحقَّق النسبة بلا رابط عن قصد».
-- كل ربط تحقَّق بقراءة بطاقة الكتاب/السجل (العنوان + المؤلف) لا بتطابق العنوان وحده.
-- idempotent: كل عبارة مقيَّدة بالنصّ الأصلي، فإعادة التشغيل لا تغيّر شيئًا بعد أول تطبيق.
BEGIN;

-- ═══ أ) تصحيحات نسبة/عنوان — كلها في معاصرين للمرة السابعة على التوالي ═══

-- 1)+2) «الفقه الميسر» المنسوب إلى «لجنة علمية، وزارة الأوقاف الكويتية»: نسبة غير قائمة.
--    الكتاب المطبوع بهذا الاسم والمحتوي على أبواب الضمان والكفالة والحوالة والوقف والهبة والوصية
--    هو «الفقه الميسر» لعبد الله بن محمد الطيار وعبد الله بن محمد المطلق ومحمد بن إبراهيم الموسى
--    (مدار الوطن، الرياض) — بطاقة الشاملة 5913 تنصّ على الثلاثة، وفصولها تشمل الأبواب المذكورة.
--    أما وزارة الأوقاف الكويتية فمصنَّفها الفقهي الجماعي هو «الموسوعة الفقهية الكويتية» لا «الفقه الميسر».
--    (و«الفقه الميسر في ضوء الكتاب والسنة» فكتاب آخر لمجموعة مؤلفين عن مجمع الملك فهد — فخّ تشابه عنوان.)
UPDATE lesson_citations SET citation='باب الضمان والكفالة والحوالة من «الفقه الميسر» — عبد الله الطيار وعبد الله المطلق ومحمد الموسى', url='https://shamela.ws/book/5913' WHERE source_type='book' AND citation='باب الضمان والكفالة والحوالة من «الفقه الميسر» — لجنة علمية، وزارة الأوقاف الكويتية';
UPDATE lesson_citations SET citation='باب الوقف والهبة والوصية من «الفقه الميسر» — عبد الله الطيار وعبد الله المطلق ومحمد الموسى', url='https://shamela.ws/book/5913' WHERE source_type='book' AND citation='باب الوقف والهبة والوصية من «الفقه الميسر» — لجنة علمية، وزارة الأوقاف الكويتية';

-- 3) «تزكية النفس — الحافظ زين الدين ابن رجب الحنبلي»: العنوان والنسبة معًا غير قائمين.
--    الكتاب المتداول بهذا المضمون هو «تزكية النفوس وتربيتها كما يقررها علماء السلف: ابن رجب الحنبلي،
--    ابن القيم، أبو حامد الغزالي» — جمعه ورتّبه أحمد فريد (تحقيق ماجد بن أبي الليل، دار القلم بيروت،
--    ط١ ١٤٠٥هـ/١٩٨٥م، ١٦٠ص) وفق بطاقة المكتبة الوقفية 1574؛ فابن رجب أحد الثلاثة المنقول عنهم لا مؤلف الكتاب.
UPDATE lesson_citations SET citation='تزكية النفوس وتربيتها كما يقررها علماء السلف — جمع أحمد فريد من كلام ابن رجب الحنبلي وابن القيم وأبي حامد الغزالي', url='https://waqfeya.net/book.php?bid=1574' WHERE source_type='book' AND citation='تزكية النفس — الحافظ زين الدين ابن رجب الحنبلي';

-- 4) «تدريب الراوي شرح تقريب النواوي»: العنوان المطبوع «تدريب الراوي في شرح تقريب النواوي»
--    (بطاقة الشاملة 9329، تحقيق أبو قتيبة نظر محمد الفاريابي، دار طيبة) — والصيغة الصحيحة موجودة
--    أصلًا في صفّ آخر من الجدول، فيتوحّدان بهذا التصحيح.
UPDATE lesson_citations SET citation='تدريب الراوي في شرح تقريب النواوي — الإمام جلال الدين السيوطي', url='https://shamela.ws/book/9329' WHERE source_type='book' AND citation='تدريب الراوي شرح تقريب النواوي — الإمام جلال الدين السيوطي';

-- 5) «الولاء والبراء في الإسلام — د. محمد سعيد بن سالم القحطاني»: اسم المؤلف على البطاقة
--    «محمد بن سعيد بن سالم القحطاني» (بترتيب النسب الصحيح)، وعنوان الرسالة المطبوعة
--    «الولاء والبراء في الإسلام من مفاهيم عقيدة السلف» (دار طيبة، تقديم عبد الرزاق عفيفي) — الشاملة 9758.
--    ملحوظة فخّ: «الولاء والبراء في الإسلام» عنوانٌ لرسالة أخرى لصالح الفوزان (الشاملة 30005) ولثالثة للبركاتي (96272).
UPDATE lesson_citations SET citation='الولاء والبراء في الإسلام — د. محمد بن سعيد بن سالم القحطاني', url='https://shamela.ws/book/9758' WHERE source_type='book' AND citation='الولاء والبراء في الإسلام — د. محمد سعيد بن سالم القحطاني';

-- ═══ ب) روابط متحقَّقة ببطاقة الكتاب على المكتبة الشاملة (العنوان + المؤلف مقروءان) ═══

UPDATE lesson_citations SET url='https://shamela.ws/book/23636' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='المفردات في غريب القرآن — الراغب الأصفهاني';
UPDATE lesson_citations SET url='https://shamela.ws/book/26461' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='المكتفى في الوقف والابتدا — أبو عمرو عثمان بن سعيد الداني';
UPDATE lesson_citations SET url='https://shamela.ws/book/11817' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='النبوات — شيخ الإسلام ابن تيمية';
UPDATE lesson_citations SET url='https://shamela.ws/book/22642' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='النشر في القراءات العشر — شمس الدين ابن الجزري';
UPDATE lesson_citations SET url='https://shamela.ws/book/23691' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='النهاية في غريب الحديث والأثر — الإمام مجد الدين ابن الأثير الجزري';
-- فخّ تشابه عنوان مُتجنَّب: «الوابل الصيب من الكلم الطيب» لابن القيم (216) غير «الكلم الطيب» لابن تيمية (21578) المربوط في ج-٢٢٠.
UPDATE lesson_citations SET url='https://shamela.ws/book/216' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='الوابل الصيب من الكلم الطيب — محمد بن أبي بكر ابن قيم الجوزية';
UPDATE lesson_citations SET url='https://shamela.ws/book/8379' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='الوجيز في إيضاح قواعد الفقه الكلية — محمد صدقي بن أحمد البورنو';
UPDATE lesson_citations SET url='https://shamela.ws/book/11811' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='باب الربا من «الملخص الفقهي» — الشيخ صالح بن فوزان الفوزان';
UPDATE lesson_citations SET url='https://shamela.ws/book/11811' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='بابا الإجارة والجعالة من «الملخص الفقهي» — الشيخ صالح بن فوزان الفوزان';
UPDATE lesson_citations SET url='https://shamela.ws/book/11811' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='بابا الوديعة والعارية من «الملخص الفقهي» — الشيخ صالح بن فوزان الفوزان';
UPDATE lesson_citations SET url='https://shamela.ws/book/384' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='باب الشركات من «الفقه الإسلامي وأدلته» — د. وهبة الزحيلي';
UPDATE lesson_citations SET url='https://shamela.ws/book/384' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='باب الوكالة من «الفقه الإسلامي وأدلته» — د. وهبة الزحيلي';
UPDATE lesson_citations SET url='https://shamela.ws/book/21739' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='بداية المجتهد ونهاية المقتصد — ابن رشد الحفيد';
UPDATE lesson_citations SET url='https://shamela.ws/book/21739' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='بداية المجتهد ونهاية المقتصد — القاضي أبو الوليد ابن رشد (كتاب الشهادات)';
UPDATE lesson_citations SET url='https://shamela.ws/book/21739' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='بداية المجتهد ونهاية المقتصد — القاضي أبو الوليد ابن رشد (كتاب النكاح)';
UPDATE lesson_citations SET url='https://shamela.ws/book/7292' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تأويل مختلف الحديث — الإمام عبد الله بن مسلم بن قتيبة الدينوري';
UPDATE lesson_citations SET url='https://shamela.ws/book/9995' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تاريخ التشريع الإسلامي — مناع القطان';
UPDATE lesson_citations SET url='https://shamela.ws/book/30183' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تاريخ الخلفاء — جلال الدين السيوطي';
UPDATE lesson_citations SET url='https://shamela.ws/book/9329' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تدريب الراوي في شرح تقريب النواوي — الإمام جلال الدين السيوطي';
-- «تفسير غريب القرآن» لابن قتيبة هو المطبوع بتحقيق أحمد صقر (3259)؛ وبطاقة 37660 «تفسير غريب القرآن — الكواري» كتاب آخر (فخّ تشابه عنوان).
UPDATE lesson_citations SET url='https://shamela.ws/book/3259' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تفسير غريب القرآن — أبو محمد عبدالله بن مسلم بن قتيبة';
UPDATE lesson_citations SET url='https://shamela.ws/book/8609' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تقريب التهذيب — الحافظ ابن حجر العسقلاني';
UPDATE lesson_citations SET url='https://shamela.ws/book/9994' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='جلباب المرأة المسلمة في الكتاب والسنة — محمد ناصر الدين الألباني';
UPDATE lesson_citations SET url='https://shamela.ws/book/7478' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='دلائل النبوة ومعرفة أحوال صاحب الشريعة — أحمد بن الحسين البيهقي';
UPDATE lesson_citations SET url='https://shamela.ws/book/12010' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='روضة الناظر — ابن قدامة';

-- ═══ ج) روابط متحقَّقة على أرشيف الإنترنت (البطاقة تحمل العنوان والمؤلف معًا) ═══

-- «الوجيز في أصول الفقه» لوهبة الزحيلي: بطاقة الأرشيف تنصّ في وصفها على «د. وهبة الزحيلي».
-- ⚠️ فخّ مُتجنَّب: «الوجيز في أصول الفقه الإسلامي» (الشاملة 17118) لمحمد مصطفى الزحيلي — أخيه — لا لوهبة،
--    و«الوجيز في أصول الفقه» عنوانٌ لكتاب ثالث لعبد الكريم زيدان؛ فلم يُربط أيٌّ منهما هنا.
UPDATE lesson_citations SET url='https://archive.org/details/20201017_20201017_0731' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='الوجيز في أصول الفقه — د. وهبة الزحيلي';
-- «تاريخ التشريع الإسلامي» للخضري بك: حقل creator في الأرشيف = «محمد عفيفي الباجوري الشهير بمحمد الخضري بك».
UPDATE lesson_citations SET url='https://archive.org/details/IslamicLegislationHistory' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تاريخ التشريع الإسلامي — محمد الخضري بك';
-- «تاريخ المذاهب الفقهية» لأبي زهرة: مصوّرة مكتبة الإسكندرية، creator=«ابو زهرة، محمد»، الناشر «مطبعة المدني»،
--    وعنوان المصوّرة «القسم الثاني في تاريخ المذاهب الفقهية» — وهو القسم المطبوع مستقلًّا بهذا الاسم.
UPDATE lesson_citations SET url='https://archive.org/details/AAlexandrina-151991' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تاريخ المذاهب الفقهية — محمد أبو زهرة';
-- «تحرير المرأة في عصر الرسالة»: عنوان البطاقة يجمع الكتاب ومؤلفه «عبد الحليم أبو شقة».
UPDATE lesson_citations SET url='https://archive.org/details/Tahrirmar2a' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تحرير المرأة في عصر الرسالة — عبد الحليم أبو شقة';
-- «دليل المسلم الجديد»: عنوان البطاقة «دليل المسلم الجديد فهد بن سالم باهمام».
UPDATE lesson_citations SET url='https://archive.org/details/dlilmuslimjded' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='دليل المسلم الجديد — فهد بن سالم باهمام';

-- ═══ د) روابط متحقَّقة على مصادر متخصصة ═══

-- كتابا القرضاوي: بطاقتاهما في «مكتبة القرضاوي» على موقعه الرسمي (على نمط ج-٢١٧ وج-٢٢٠).
UPDATE lesson_citations SET url='https://www.al-qaradawi.net/node/5086' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='خطابنا الإسلامي في عصر العولمة — يوسف القرضاوي';
UPDATE lesson_citations SET url='https://www.al-qaradawi.net/node/5040' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='دراسة في فقه مقاصد الشريعة: بين المقاصد الكلية والنصوص الجزئية — يوسف القرضاوي';
-- أطروحة سامي حمود (دكتوراه، مطبعة الشرق ومكتبتها عمّان ١٤٠٢هـ): بطاقة «مصورات عبد الرحمن النجدي»
-- تنصّ على العنوان والمؤلف معًا («…(دكتوراه) - د. سامي حمود»).
UPDATE lesson_citations SET url='https://www.moswarat.com/books_view_1265.html' WHERE source_type='book' AND (url IS NULL OR url='') AND citation='تطوير الأعمال المصرفية بما يتفق والشريعة الإسلامية — د. سامي حسن أحمد حمود';

-- ═══ هـ) متحقَّق النسبة بلا رابط عن قصد ═══
-- «الورق النقدي — الشيخ عبد الله بن سليمان بن منيع»: الكتاب ثابت النسبة (عنوانه الكامل «الورق النقدي:
-- تاريخه، حقيقته، قيمته، حكمه»، نشر مجلة المجمع الفقهي الإسلامي ١٤٠٥هـ)، لكن لم تُوجد له بطاقة
-- مفتوحة تجمع العنوان بالمؤلف على مصدر يُقرأ آليًّا (waqfeya/archive/شاملة بلا نتيجة، وفهرس مكتبة
-- غرس القيم لم يستجب للجلب)؛ فيُترك بلا رابط بدل إضافة رابط لم يُقرأ.

COMMIT;
