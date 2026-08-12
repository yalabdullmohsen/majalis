-- تدقيق استشهادات الكتب في lesson_citations — الدفعة الثانية:
-- 27 نصًّا متمايزًا (كل العناوين ذات التكرار ≥2 مع مفردات المعاملات) — تحقُّق نسبة + ربط.
-- idempotent: كل عبارة مقيَّدة بالنصّ الأصلي.
BEGIN;

-- [1] الفقه الإسلامي وأدلته — وهبة الزحيلي
UPDATE lesson_citations SET url='https://shamela.ws/book/384' WHERE source_type='book' AND citation='الفقه الإسلامي وأدلته — وهبة الزحيلي' AND (url IS NULL OR url='');

-- [2] روائع البيان: تفسير آيات الأحكام من القرآن الكريم — محمد علي الصابوني
UPDATE lesson_citations SET url='https://shamela.ws/book/12347' WHERE source_type='book' AND citation='روائع البيان: تفسير آيات الأحكام من القرآن الكريم — محمد علي الصابوني' AND (url IS NULL OR url='');

-- [3] في فقه الأقليات المسلمة: حياة المسلمين وسط المجتمعات الأخرى — يوسف القرضاوي
UPDATE lesson_citations SET url='https://www.al-qaradawi.net/node/5061' WHERE source_type='book' AND citation='في فقه الأقليات المسلمة: حياة المسلمين وسط المجتمعات الأخرى — يوسف القرضاوي' AND (url IS NULL OR url='');

-- [4] لمعة الاعتقاد الهادي إلى سبيل الرشاد — ابن قدامة المقدسي
UPDATE lesson_citations SET url='https://shamela.ws/book/30855' WHERE source_type='book' AND citation='لمعة الاعتقاد الهادي إلى سبيل الرشاد — ابن قدامة المقدسي' AND (url IS NULL OR url='');

-- [5] أصول الدعوة — عبد الكريم زيدان
UPDATE lesson_citations SET url='https://shamela.ws/book/22615' WHERE source_type='book' AND citation='أصول الدعوة — عبد الكريم زيدان' AND (url IS NULL OR url='');

-- [6] إرشاد الفحول — الإمام محمد بن علي الشوكاني
UPDATE lesson_citations SET url='https://shamela.ws/book/11437' WHERE source_type='book' AND citation='إرشاد الفحول — الإمام محمد بن علي الشوكاني' AND (url IS NULL OR url='');

-- [7] البداية والنهاية — ابن كثير
UPDATE lesson_citations SET url='https://shamela.ws/book/4445' WHERE source_type='book' AND citation='البداية والنهاية — ابن كثير' AND (url IS NULL OR url='');

-- [8] الموافقات — أبو إسحاق الشاطبي
UPDATE lesson_citations SET url='https://shamela.ws/book/11435' WHERE source_type='book' AND citation='الموافقات — أبو إسحاق الشاطبي' AND (url IS NULL OR url='');

-- [9] تيسير مصطلح الحديث — محمود الطحان
UPDATE lesson_citations SET url='https://shamela.ws/book/8681' WHERE source_type='book' AND citation='تيسير مصطلح الحديث — محمود الطحان' AND (url IS NULL OR url='');

-- [10] شرح العقيدة الواسطية — الشيخ محمد بن صالح العثيمين
UPDATE lesson_citations SET url='https://shamela.ws/book/11250' WHERE source_type='book' AND citation='شرح العقيدة الواسطية — الشيخ محمد بن صالح العثيمين' AND (url IS NULL OR url='');

-- [11] علوم الحديث (مقدمة ابن الصلاح) — الإمام ابن الصلاح الشهرزوري
UPDATE lesson_citations SET url='https://shamela.ws/book/22870' WHERE source_type='book' AND citation='علوم الحديث (مقدمة ابن الصلاح) — الإمام ابن الصلاح الشهرزوري' AND (url IS NULL OR url='');

-- [12] فقه السنة — السيد سابق
UPDATE lesson_citations SET url='https://shamela.ws/book/9486' WHERE source_type='book' AND citation='فقه السنة — السيد سابق' AND (url IS NULL OR url='');

-- [13] نزهة النظر شرح نخبة الفكر — الحافظ ابن حجر العسقلاني
UPDATE lesson_citations SET url='https://shamela.ws/book/1565' WHERE source_type='book' AND citation='نزهة النظر شرح نخبة الفكر — الحافظ ابن حجر العسقلاني' AND (url IS NULL OR url='');

-- [14] الأحكام السلطانية — الماوردي
UPDATE lesson_citations SET url='https://shamela.ws/book/22881' WHERE source_type='book' AND citation='الأحكام السلطانية — الماوردي' AND (url IS NULL OR url='');

-- [15] الطرق الحكمية في السياسة الشرعية — الإمام ابن قيم الجوزية
UPDATE lesson_citations SET url='https://shamela.ws/book/18159' WHERE source_type='book' AND citation='الطرق الحكمية في السياسة الشرعية — الإمام ابن قيم الجوزية' AND (url IS NULL OR url='');

-- [16] النحو الواضح في قواعد اللغة العربية — علي الجارم ومصطفى أمين
UPDATE lesson_citations SET url='https://shamela.ws/book/10018' WHERE source_type='book' AND citation='النحو الواضح في قواعد اللغة العربية — علي الجارم ومصطفى أمين' AND (url IS NULL OR url='');

-- [17] بداية المجتهد ونهاية المقتصد — القاضي أبو الوليد ابن رشد
UPDATE lesson_citations SET url='https://shamela.ws/book/21739' WHERE source_type='book' AND citation='بداية المجتهد ونهاية المقتصد — القاضي أبو الوليد ابن رشد' AND (url IS NULL OR url='');

-- [18] جامع الدروس العربية — مصطفى الغلاييني
UPDATE lesson_citations SET url='https://shamela.ws/book/3284' WHERE source_type='book' AND citation='جامع الدروس العربية — مصطفى الغلاييني' AND (url IS NULL OR url='');

-- [19] حصن المسلم من أذكار الكتاب والسنة — سعيد بن علي بن وهف القحطاني
UPDATE lesson_citations SET url='https://shamela.ws/book/31307' WHERE source_type='book' AND citation='حصن المسلم من أذكار الكتاب والسنة — سعيد بن علي بن وهف القحطاني' AND (url IS NULL OR url='');

-- [20] «بداية المجتهد ونهاية المقتصد» — ابن رشد الحفيد (في تصنيف عقود المعاملات)
UPDATE lesson_citations SET url='https://shamela.ws/book/21739' WHERE source_type='book' AND citation='«بداية المجتهد ونهاية المقتصد» — ابن رشد الحفيد (في تصنيف عقود المعاملات)' AND (url IS NULL OR url='');

-- [21] تصحيح عنوان: كتاب ابن أبي الدم الحموي اسمه «أدب القضاء» (= الدرر المنظومات في الأقضية
--      والحكومات)، أمّا «أدب القاضي» فكتاب ابن القاص الطبري (ت 335) وكتاب الخصاف.
--      المصادر: فهرس المكتبة الوطنية الإسرائيلية NNL_ALEPH990033743360205171 (ت. محيي هلال السرحان)،
--      ومكتبة محمد بن راشد Library____347813، وطبعة مجمع اللغة العربية بدمشق 1975 بتحقيق محمد مصطفى الزحيلي.
UPDATE lesson_citations SET citation='أدب القضاء (الدرر المنظومات في الأقضية والحكومات) — الإمام أبو إسحاق إبراهيم بن أبي الدم الحموي'
  WHERE source_type='book' AND citation='أدب القاضي — الإمام أبو إسحاق إبراهيم بن أبي الدم';

-- [22] حذف نسبة غير قائمة: لا يُعرف لمحمد أحمد الراشد كتابٌ بعنوان «فقه الدعوة إلى الله»؛
--      ثبت الجرد الكامل لمؤلفاته (فولة بوك، كتوباتي، نور بوك) بلا هذا العنوان، وسلسلته اسمها
--      «إحياء فقه الدعوة» وكتابه «أصول الإفتاء والاجتهاد التطبيقي في نظريات فقه الدعوة الإسلامية».
--      والعنوانان القريبان لغيره: «فقه الدعوة إلى الله وفقه النصح والإرشاد…» لعبد الرحمن حبنكة الميداني،
--      و«فقه الدعوة إلى الله والأمر بالمعروف والنهي عن المنكر» لأبي فيصل البدراني (الشاملة 96251).
--      فالنسبة خاطئة قطعًا، والبديل المقصود غير محدَّد ⇒ حذف + وسم needs_post_review.
DELETE FROM lesson_citations WHERE source_type='book' AND citation='فقه الدعوة إلى الله — محمد أحمد الراشد';

COMMIT;
