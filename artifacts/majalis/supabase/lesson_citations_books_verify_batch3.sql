-- تدقيق استشهادات الكتب في lesson_citations — الدفعة الثالثة (ج-٢١٨):
-- ثلاثون عنوانًا مفردًا بترتيب أبجدي (ORDER BY citation) من الـ227 صفًّا الباقية بلا رابط.
-- كل ربط تحقَّق بقراءة بطاقة الكتاب/السجل (العنوان + المؤلف) لا بتطابق العنوان وحده.
-- idempotent: كل عبارة مقيَّدة بالنصّ الأصلي، فإعادة التشغيل لا تغيّر شيئًا بعد أول تطبيق.
BEGIN;

-- آثار الحرب في الفقه الإسلامي — وهبة الزحيلي  [أرشيف الإنترنت — نسخة دار الفكر دمشق ط3 1998، «دراسة مقارنة»]
UPDATE lesson_citations SET url='https://archive.org/details/Pdf003519983' WHERE source_type='book' AND citation='آثار الحرب في الفقه الإسلامي — وهبة الزحيلي' AND (url IS NULL OR url='');

-- أبواب السلم والرهن والقرض من «الفقه الإسلامي وأدلته» — د. وهبة الزحيلي  [نفس الكتاب المتحقَّق في ج-٢١٧]
UPDATE lesson_citations SET url='https://shamela.ws/book/384' WHERE source_type='book' AND citation='أبواب السلم والرهن والقرض من «الفقه الإسلامي وأدلته» — د. وهبة الزحيلي' AND (url IS NULL OR url='');

-- أحكام أهل الذمة — ابن القيم الجوزية  [ط رمادي — اختيار طبعة من بين طبعتين في الشاملة]
UPDATE lesson_citations SET url='https://shamela.ws/book/21747' WHERE source_type='book' AND citation='أحكام أهل الذمة — ابن القيم الجوزية' AND (url IS NULL OR url='');

-- أحكام الأوراق النقدية وقيمتها في الفقه الإسلامي — الشيخ عبد الله بن سليمان بن منيع  [مؤلف قائم + عنوان غير قائم: صُحّح إلى كتابه المطبوع في الباب نفسه]
UPDATE lesson_citations SET citation='الورق النقدي — الشيخ عبد الله بن سليمان بن منيع' WHERE source_type='book' AND citation='أحكام الأوراق النقدية وقيمتها في الفقه الإسلامي — الشيخ عبد الله بن سليمان بن منيع';

-- أحكام الجراحة الطبية والآثار المترتبة عليها — محمد المختار الشنقيطي  [المؤلف في بطاقة الكتاب: محمد بن محمد المختار الشنقيطي]
UPDATE lesson_citations SET url='https://shamela.ws/book/10815' WHERE source_type='book' AND citation='أحكام الجراحة الطبية والآثار المترتبة عليها — محمد المختار الشنقيطي' AND (url IS NULL OR url='');

-- أحكام القرآن — أبو بكر ابن العربي المالكي  [أحكام القرآن لابن العربي ط العلمية — المؤلف: القاضي أبو بكر بن العربي المعافري المالكي (ت 543)]
UPDATE lesson_citations SET url='https://shamela.ws/book/1464' WHERE source_type='book' AND citation='أحكام القرآن — أبو بكر ابن العربي المالكي' AND (url IS NULL OR url='');

-- أحكام النساء — أبو الفرج عبد الرحمن بن الجوزي  [جامع الكتب الإسلامية — «أحكام النساء لابن الجوزي»]
UPDATE lesson_citations SET url='https://ketabonline.com/ar/books/26369' WHERE source_type='book' AND citation='أحكام النساء — أبو الفرج عبد الرحمن بن الجوزي' AND (url IS NULL OR url='');

-- أدب الخلاف في الإسلام — طه جابر العلواني  [العنوان المطبوع «أدب الاختلاف» لا «أدب الخلاف»؛ المؤلف في البطاقة: طه جابر فياض العلواني]
UPDATE lesson_citations SET citation='أدب الاختلاف في الإسلام — طه جابر العلواني', url='https://shamela.ws/book/1523' WHERE source_type='book' AND citation='أدب الخلاف في الإسلام — طه جابر العلواني';

-- أدب الدنيا والدين — أبو الحسن الماوردي (باب آداب المحاورة والمجادلة)  [المؤلف في البطاقة: أبو الحسن علي بن محمد الماوردي (ت 450)]
UPDATE lesson_citations SET url='https://shamela.ws/book/765' WHERE source_type='book' AND citation='أدب الدنيا والدين — أبو الحسن الماوردي (باب آداب المحاورة والمجادلة)' AND (url IS NULL OR url='');

-- أدلة الإثبات في الفقه الإسلامي — أحمد فراج حسين  [مصورات عبد الرحمن النجدي — العنوان والمؤلف معًا في عنوان الصفحة]
UPDATE lesson_citations SET url='https://www.moswarat.com/books_view_1405.html' WHERE source_type='book' AND citation='أدلة الإثبات في الفقه الإسلامي — أحمد فراج حسين' AND (url IS NULL OR url='');

-- أسباب اختلاف الفقهاء — علي الخفيف  [المكتبة الوقفية — المؤلف في السجل: الخفيف، علي محمد]
UPDATE lesson_citations SET url='https://waqfeya.net/books/%D8%A3%D8%B3%D8%A8%D8%A7%D8%A8-%D8%A7%D8%AE%D8%AA%D9%84%D8%A7%D9%81-%D8%A7%D9%84%D9%81%D9%82%D9%87%D8%A7%D8%A1-afb0b7cfbcd34496a04e217e03c84e49' WHERE source_type='book' AND citation='أسباب اختلاف الفقهاء — علي الخفيف' AND (url IS NULL OR url='');

-- أسباب النزول — أبو الحسن علي بن أحمد الواحدي (أقدم مصنَّف مفرد في الباب)  [ت الحميدان — اختيار طبعة]
UPDATE lesson_citations SET url='https://shamela.ws/book/11314' WHERE source_type='book' AND citation='أسباب النزول — أبو الحسن علي بن أحمد الواحدي (أقدم مصنَّف مفرد في الباب)' AND (url IS NULL OR url='');

-- أشراط الساعة — الشيخ يوسف بن عبدالله الوابل  [المؤلف في البطاقة: يوسف بن عبد الله بن يوسف الوابل]
UPDATE lesson_citations SET url='https://shamela.ws/book/182' WHERE source_type='book' AND citation='أشراط الساعة — الشيخ يوسف بن عبدالله الوابل' AND (url IS NULL OR url='');

-- أصول الاقتصاد الإسلامي — د. رفيق يونس المصري  [صفحة الكتاب تنصّ: المؤلف أ.د رفيق يونس المصري، دار القلم دمشق، ط1 1431هـ/2010م]
UPDATE lesson_citations SET url='https://alektesad.com/%D8%A3%D8%B5%D9%88%D9%84-%D8%A7%D9%84%D8%A3%D9%82%D8%AA%D8%B5%D8%A7%D8%AF-%D8%A7%D9%84%D8%A5%D8%B3%D9%84%D8%A7%D9%85%D9%89/' WHERE source_type='book' AND citation='أصول الاقتصاد الإسلامي — د. رفيق يونس المصري' AND (url IS NULL OR url='');

-- أصول التخريج ودراسات الأسانيد — د. محمود الطحان  [العنوان المطبوع «دراسة» لا «دراسات»؛ وليس هو كتاب «التخريج ودراسة الأسانيد» لحاتم العوني (الشاملة 3933)]
UPDATE lesson_citations SET citation='أصول التخريج ودراسة الأسانيد — د. محمود الطحان', url='https://archive.org/details/Oussoul_elTakhrij' WHERE source_type='book' AND citation='أصول التخريج ودراسات الأسانيد — د. محمود الطحان';

-- أطلس تاريخ الإسلام — حسين مؤنس  [أرشيف الإنترنت — العنوان يحمل اسم المؤلف حسين مؤنس]
UPDATE lesson_citations SET url='https://archive.org/details/elshandawily8951' WHERE source_type='book' AND citation='أطلس تاريخ الإسلام — حسين مؤنس' AND (url IS NULL OR url='');

-- أمثال القرآن — ابن قيم الجوزية  [جامع الكتب الإسلامية — «أمثال القرآن لابن القيم (ت: ناصر الرشيد)»]
UPDATE lesson_citations SET url='https://ketabonline.com/ar/books/23728' WHERE source_type='book' AND citation='أمثال القرآن — ابن قيم الجوزية' AND (url IS NULL OR url='');

-- إحياء علوم الدين — أبو حامد الغزالي (ربع المنجيات، كتاب رياضة النفس وتهذيب الأخلاق)
UPDATE lesson_citations SET url='https://shamela.ws/book/9472' WHERE source_type='book' AND citation='إحياء علوم الدين — أبو حامد الغزالي (ربع المنجيات، كتاب رياضة النفس وتهذيب الأخلاق)' AND (url IS NULL OR url='');

-- إحياء علوم الدين — أبو حامد الغزالي (كتاب آفات اللسان)
UPDATE lesson_citations SET url='https://shamela.ws/book/9472' WHERE source_type='book' AND citation='إحياء علوم الدين — أبو حامد الغزالي (كتاب آفات اللسان)' AND (url IS NULL OR url='');

-- إحياء علوم الدين — أبو حامد الغزالي (كتاب رياضة النفس وتهذيب الأخلاق)
UPDATE lesson_citations SET url='https://shamela.ws/book/9472' WHERE source_type='book' AND citation='إحياء علوم الدين — أبو حامد الغزالي (كتاب رياضة النفس وتهذيب الأخلاق)' AND (url IS NULL OR url='');

-- إحياء علوم الدين — الإمام أبو حامد الغزالي (كتاب آداب الصحبة والمعاشرة)
UPDATE lesson_citations SET url='https://shamela.ws/book/9472' WHERE source_type='book' AND citation='إحياء علوم الدين — الإمام أبو حامد الغزالي (كتاب آداب الصحبة والمعاشرة)' AND (url IS NULL OR url='');

-- إحياء علوم الدين — الإمام أبو حامد الغزالي (كتاب العلم)
UPDATE lesson_citations SET url='https://shamela.ws/book/9472' WHERE source_type='book' AND citation='إحياء علوم الدين — الإمام أبو حامد الغزالي (كتاب العلم)' AND (url IS NULL OR url='');

-- إصلاح المال — الحافظ ابن أبي الدنيا  [المؤلف في البطاقة: ابن أبي الدنيا (ت 281)]
UPDATE lesson_citations SET url='https://shamela.ws/book/13187' WHERE source_type='book' AND citation='إصلاح المال — الحافظ ابن أبي الدنيا' AND (url IS NULL OR url='');

-- إعجاز القرآن — القاضي أبو بكر الباقلاني  [المؤلف في البطاقة: أبو بكر الباقلاني محمد بن الطيب (ت 403)]
UPDATE lesson_citations SET url='https://shamela.ws/book/953' WHERE source_type='book' AND citation='إعجاز القرآن — القاضي أبو بكر الباقلاني' AND (url IS NULL OR url='');

-- إغاثة اللهفان من مصايد الشيطان — ابن القيم الجوزية  [ت الفقي — اختيار طبعة]
UPDATE lesson_citations SET url='https://shamela.ws/book/11688' WHERE source_type='book' AND citation='إغاثة اللهفان من مصايد الشيطان — ابن القيم الجوزية' AND (url IS NULL OR url='');

-- الأحكام السلطانية — أبو الحسن الماوردي  [«الأحكام السلطانية للماوردي» — متمايز عن كتاب أبي يعلى الفراء (22877)]
UPDATE lesson_citations SET url='https://shamela.ws/book/22881' WHERE source_type='book' AND citation='الأحكام السلطانية — أبو الحسن الماوردي' AND (url IS NULL OR url='');

-- الأحوال الشخصية — الإمام محمد أبو زهرة (باب الحضانة)  [أرشيف الإنترنت — «الأحوال الشخصية المؤلف: محمد أبو زهرة»]
UPDATE lesson_citations SET url='https://archive.org/details/ozkorallh_20181028' WHERE source_type='book' AND citation='الأحوال الشخصية — الإمام محمد أبو زهرة (باب الحضانة)' AND (url IS NULL OR url='');

-- الأذكار — أبو زكريا يحيى بن شرف النووي  [ت الأرنؤوط — اختيار طبعة]
UPDATE lesson_citations SET url='https://shamela.ws/book/1956' WHERE source_type='book' AND citation='الأذكار — أبو زكريا يحيى بن شرف النووي' AND (url IS NULL OR url='');

COMMIT;
