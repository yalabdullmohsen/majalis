-- تدقيق استشهادات الكتب في lesson_citations — الدفعة الأولى:
-- كتلة السيرة النبوية (16 عنوانًا مكرَّرة حرفيًّا في 12 درسًا = 192 صفًّا).
-- idempotent: كل عبارة مقيَّدة بالنصّ الأصلي، فإعادة التشغيل لا تغيّر شيئًا بعد أول تطبيق.
BEGIN;

-- [1] السيرة النبوية، ابن هشام
UPDATE lesson_citations SET url='https://shamela.ws/book/23833' WHERE source_type='book' AND citation='السيرة النبوية، ابن هشام' AND (url IS NULL OR url='');

-- [2] البداية والنهاية، ابن كثير
UPDATE lesson_citations SET url='https://shamela.ws/book/4445' WHERE source_type='book' AND citation='البداية والنهاية، ابن كثير' AND (url IS NULL OR url='');

-- [3] زاد المعاد في هدي خير العباد، ابن القيم
UPDATE lesson_citations SET url='https://shamela.ws/book/21713' WHERE source_type='book' AND citation='زاد المعاد في هدي خير العباد، ابن القيم' AND (url IS NULL OR url='');

-- [4] الرحيق المختوم، صفي الرحمن المباركفوري
UPDATE lesson_citations SET url='https://shamela.ws/book/9820' WHERE source_type='book' AND citation='الرحيق المختوم، صفي الرحمن المباركفوري' AND (url IS NULL OR url='');

-- [5] السيرة النبوية الصحيحة، أكرم ضياء العمري
UPDATE lesson_citations SET url='https://shamela.ws/book/122396' WHERE source_type='book' AND citation='السيرة النبوية الصحيحة، أكرم ضياء العمري' AND (url IS NULL OR url='');

-- [6] نور اليقين في سيرة سيد المرسلين، محمد الخضري بك
UPDATE lesson_citations SET url='https://shamela.ws/book/23692' WHERE source_type='book' AND citation='نور اليقين في سيرة سيد المرسلين، محمد الخضري بك' AND (url IS NULL OR url='');

-- [7] فقه السيرة، محمد الغزالي
UPDATE lesson_citations SET url='https://shamela.ws/book/23659' WHERE source_type='book' AND citation='فقه السيرة، محمد الغزالي' AND (url IS NULL OR url='');

-- [8] السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي
UPDATE lesson_citations SET url='https://shamela.ws/book/20364' WHERE source_type='book' AND citation='السيرة النبوية دروس وعبر، الدكتور مصطفى السباعي' AND (url IS NULL OR url='');

-- [9] شخصية النبي ﷺ، ابن تيمية
DELETE FROM lesson_citations WHERE source_type='book' AND citation='شخصية النبي ﷺ، ابن تيمية';

-- [10] السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد
UPDATE lesson_citations SET citation='السيرة النبوية في ضوء المصادر الأصلية: دراسة تحليلية، مهدي رزق الله أحمد', url='https://archive.org/details/sira-massader-aslia' WHERE source_type='book' AND citation='السيرة النبوية في ضوء المصادر الأصلية، مهدي رزق الله أحمد';

-- [11] نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي
UPDATE lesson_citations SET citation='فقه السيرة النبوية مع موجز لتاريخ الخلافة الراشدة، محمد سعيد رمضان البوطي', url='https://shamela.ws/book/23657' WHERE source_type='book' AND citation='نبي الرحمة ﷺ، الدكتور محمد سعيد رمضان البوطي';

-- [12] وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي
UPDATE lesson_citations SET citation='السيرة النبوية: عرض وقائع وتحليل أحداث، علي محمد الصلابي', url='https://ketabonline.com/ar/books/67087' WHERE source_type='book' AND citation='وما أرسلناك إلا رحمة للعالمين، علي محمد الصلابي';

-- [13] السيرة النبوية الشريفة، محمد أبو شهبة
UPDATE lesson_citations SET citation='السيرة النبوية في ضوء القرآن والسنة، محمد بن محمد أبو شهبة', url='https://shamela.ws/book/9896' WHERE source_type='book' AND citation='السيرة النبوية الشريفة، محمد أبو شهبة';

-- [14] موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء
UPDATE lesson_citations SET citation='نضرة النعيم في مكارم أخلاق الرسول الكريم، بإشراف صالح بن عبد الله بن حميد', url='https://shamela.ws/book/22798' WHERE source_type='book' AND citation='موسوعة نضرة النعيم في مكارم أخلاق النبي الكريم، مجموعة علماء';

-- [15] السيرة النبوية المختصرة، أحمد مبارك البغدادي
DELETE FROM lesson_citations WHERE source_type='book' AND citation='السيرة النبوية المختصرة، أحمد مبارك البغدادي';

-- [16] اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة
UPDATE lesson_citations SET citation='مصادر السيرة النبوية وتقويمها، فاروق حمادة', url='https://books.google.com/books?id=dz0W0QEACAAJ' WHERE source_type='book' AND citation='اليعقوبي في السيرة النبوية — دراسة نقدية، فاروق حمادة';

COMMIT;
