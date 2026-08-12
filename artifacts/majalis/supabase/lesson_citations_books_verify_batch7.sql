-- تدقيق استشهادات الكتب في lesson_citations — الدفعة السابعة (ج-٢٢٢):
-- ثلاثة وثلاثون صفًّا بترتيب أبجدي (ORDER BY citation) من الـ91 صفًّا الباقية بلا رابط،
-- ابتداءً من كتلة «رياض الصالحين — النووي» (أي بعد الاثني عشر نصًّا الموثَّقة سابقًا
-- كـ«متحقَّقة النسبة بلا رابط عن قصد»: شبير ×3، أبو زهرة ×3، أدب القضاء ×2، الحلال والحرام،
-- معايير أيوفي ×3، المواريث/الصابوني، الورق النقدي/ابن منيع)
-- وانتهاءً بكتلة «فقه السنة — سيد سابق».
-- كل ربط تحقَّق بقراءة بطاقة الكتاب (العنوان + المؤلف) لا بتطابق العنوان وحده.
-- idempotent: كل عبارة مقيَّدة بالنصّ الأصلي، فإعادة التشغيل لا تغيّر شيئًا بعد أول تطبيق.
--
-- ⚠️ لم يُطبَّق هذا الملف على القاعدة الحيّة في دورة إنشائه: مفتاح `VITE_SUPABASE_ANON_KEY`
--    الوحيد المتاح في هذا الـworktree يقرأ ولا يكتب (PATCH يعود `204` بـ`content-range: */0`
--    على كل صفّ = سياسة RLS تمنع UPDATE للدور المجهول)، ولا `SUPABASE_SERVICE_ROLE_KEY`
--    ولا `DATABASE_URL` ولا psql/supabase CLI في أي worktree. يُطبَّق يدويًّا في SQL Editor.
BEGIN;

-- ═══ أ) تصحيح عنوان واحد — وهو في معاصر، للمرة الثامنة على التوالي ═══

-- 1) «فقه الأولويات — يوسف القرضاوي»: العنوان المطبوع للكتاب يبدأ بحرف الجر،
--    وهو «في فقه الأولويات.. دراسة جديدة في ضوء القرآن والسنة» كما في صفحة الكتاب
--    على موقع المؤلف الرسمي al-qaradawi.net/node/5135 (وعنوان الصفحة و<h1> كلاهما بهذا اللفظ)،
--    ويقول فيه القرضاوي إنه كان يسمّيه «فقه مراتب الأعمال» ثم اختار «فقه الأولويات» اصطلاحًا داخله.
--    فالتصحيح في العنوان لا في النسبة.
UPDATE lesson_citations SET citation='في فقه الأولويات: دراسة جديدة في ضوء القرآن والسنة — يوسف القرضاوي', url='https://www.al-qaradawi.net/node/5135' WHERE source_type='book' AND citation='فقه الأولويات — يوسف القرضاوي';

-- ═══ ب) روابط متحقَّقة ببطاقة الكتاب (العنوان + المؤلف مقروءان في المصدر) ═══

-- رياض الصالحين — النووي (تسع صيغ بأبواب مختلفة، تُحسم كلها ببطاقة واحدة):
--   بطاقة الشاملة 12014 «رياض الصالحين» — أبو زكريا محيي الدين يحيى بن شرف النووي (ت ٦٧٦هـ)،
--   تحقيق شعيب الأرنؤوط، مؤسسة الرسالة. (وطبعة ابن كثير ت الفحل على 2348 بديل صالح.)
UPDATE lesson_citations SET url='https://shamela.ws/book/12014' WHERE source_type='book' AND url IS NULL AND citation='رياض الصالحين — الإمام النووي (باب آداب الأكل)';
UPDATE lesson_citations SET url='https://shamela.ws/book/12014' WHERE source_type='book' AND url IS NULL AND citation='رياض الصالحين — الإمام النووي (باب الحث على مجالسة الصالحين ومصادقتهم)';
UPDATE lesson_citations SET url='https://shamela.ws/book/12014' WHERE source_type='book' AND url IS NULL AND citation='رياض الصالحين — الإمام النووي (باب بر الوالدين وصلة الأرحام)';
UPDATE lesson_citations SET url='https://shamela.ws/book/12014' WHERE source_type='book' AND url IS NULL AND citation='رياض الصالحين — الإمام النووي (باب حق الجار)';
UPDATE lesson_citations SET url='https://shamela.ws/book/12014' WHERE source_type='book' AND url IS NULL AND citation='رياض الصالحين — الإمام النووي (باب حق الطريق)';
UPDATE lesson_citations SET url='https://shamela.ws/book/12014' WHERE source_type='book' AND url IS NULL AND citation='رياض الصالحين — الإمام يحيى بن شرف النووي';
UPDATE lesson_citations SET url='https://shamela.ws/book/12014' WHERE source_type='book' AND url IS NULL AND citation='رياض الصالحين — الإمام يحيى بن شرف النووي (باب الاستقامة)';
UPDATE lesson_citations SET url='https://shamela.ws/book/12014' WHERE source_type='book' AND url IS NULL AND citation='رياض الصالحين — الإمام يحيى بن شرف النووي (باب المحافظة على الأعمال الصالحة)';
UPDATE lesson_citations SET url='https://shamela.ws/book/12014' WHERE source_type='book' AND url IS NULL AND citation='رياض الصالحين — الإمام يحيى بن شرف النووي (باب فضل قيام الليل)';

-- زاد المعاد في هدي خير العباد — ابن قيم الجوزية:
--   بطاقة الشاملة 21713 «زاد المعاد في هَدي خير العباد» — شمس الدين محمد بن أبي بكر الزرعي
--   الدمشقي ابن قيم الجوزية (٦٩١–٧٥١هـ)، مؤسسة الرسالة (ت الرسالة الثاني).
UPDATE lesson_citations SET url='https://shamela.ws/book/21713' WHERE source_type='book' AND url IS NULL AND citation='زاد المعاد في هدي خير العباد — محمد بن أبي بكر ابن قيم الجوزية';

-- سبل السلام الموصلة إلى بلوغ المرام — الصنعاني:
--   بطاقة الشاملة 1082 عنوانها بالحرف «سبل السلام الموصلة إلى بلوغ المرام» — محمد بن إسماعيل
--   الأمير الصنعاني (ت ١١٨٢هـ)، ت حلاق، دار ابن الجوزي. (وطبعة دار الحديث 21590 تسمّيه
--   «سبل السلام شرح بلوغ المرام»، فالبطاقة المطابقة لعنواننا حرفيًّا هي 1082.)
UPDATE lesson_citations SET url='https://shamela.ws/book/1082' WHERE source_type='book' AND url IS NULL AND citation='سبل السلام الموصلة إلى بلوغ المرام — الإمام محمد بن إسماعيل الصنعاني';

-- سير أعلام النبلاء — الذهبي:
--   بطاقة الشاملة 10906 — شمس الدين محمد بن أحمد بن عثمان الذهبي (ت ٧٤٨هـ)، مؤسسة الرسالة.
UPDATE lesson_citations SET url='https://shamela.ws/book/10906' WHERE source_type='book' AND url IS NULL AND citation='سير أعلام النبلاء — شمس الدين الذهبي';

-- شبهات حول الإسلام — محمد قطب:
--   غير موجود على الشاملة. سجلّ أرشيف الإنترنت chobohate_alislam_549_2 عنوانه
--   «شبهات حول الإسلام، محمد قطب» (المؤلف داخل حقل العنوان لا creator — وهو الوضع الشائع
--   في رفوع الأرشيف العربية). ⚠️ فخّ الأخوين مُتجنَّب: الكتاب لمحمد قطب لا لأخيه سيد قطب.
UPDATE lesson_citations SET url='https://archive.org/details/chobohate_alislam_549_2' WHERE source_type='book' AND url IS NULL AND citation='شبهات حول الإسلام — محمد قطب';

-- شخصية المسلم كما يصوغها الإسلام في الكتاب والسنة — محمد علي الهاشمي:
--   بطاقة الشاملة 96265 بالعنوان الكامل نفسه — الدكتور محمد علي الهاشمي، دار البشائر الإسلامية.
UPDATE lesson_citations SET url='https://shamela.ws/book/96265' WHERE source_type='book' AND url IS NULL AND citation='شخصية المسلم كما يصوغها الإسلام في الكتاب والسنة — محمد علي الهاشمي';

-- شذا العرف في فن الصرف — أحمد الحملاوي:
--   بطاقة الشاملة 11243 — أحمد بن محمد الحملاوي (ت ١٣٥١هـ)، تحقيق نصر الله عبد الرحمن نصر الله،
--   مكتبة الرشد بالرياض.
UPDATE lesson_citations SET url='https://shamela.ws/book/11243' WHERE source_type='book' AND url IS NULL AND citation='شذا العرف في فن الصرف — أحمد الحملاوي';

-- شرح العقيدة الطحاوية — ابن أبي العز الحنفي:
--   بطاقة الشاملة 8352 — عليّ بن علي بن محمد بن أبي العز الدمشقي (ت ٧٩٢هـ)، مؤسسة الرسالة.
--   ⚠️ فخّ تشابه العنوان الأكبر في هذه الدفعة: في الشاملة ستة عشر عنوانًا فيها «العقيدة الطحاوية»
--   وأكثرها شروح معاصرين (صالح آل الشيخ 934، الراجحي 1094، سفر الحوالي 2827، خالد المصلح 7712،
--   ابن جبرين 7724، البراك 23001…) لا شرح ابن أبي العز.
UPDATE lesson_citations SET url='https://shamela.ws/book/8352' WHERE source_type='book' AND url IS NULL AND citation='شرح العقيدة الطحاوية — ابن أبي العز الحنفي';

-- صفة صلاة النبي صلى الله عليه وسلم — الألباني:
--   بطاقة الشاملة 657 «صفة صلاة النبي صلى الله عليه وسلم من التكبير إلى التسليم كأنك تراها»
--   — محمد ناصر الدين الألباني (ت ١٤٢٠هـ)، مكتبة المعارف بالرياض.
--   ⚠️ فخّ مُتجنَّب: 21816 كتاب بالعنوان نفسه للعثيمين لا للألباني.
UPDATE lesson_citations SET url='https://shamela.ws/book/657' WHERE source_type='book' AND url IS NULL AND citation='صفة صلاة النبي صلى الله عليه وسلم — محمد ناصر الدين الألباني';

-- علل الحديث — ابن أبي حاتم الرازي:
--   بطاقة الشاملة 1350 «العلل لابن أبي حاتم» (ت الحميد) — أبو محمد عبد الرحمن بن محمد بن إدريس
--   بن المنذر التميمي الحنظلي الرازي ابن أبي حاتم (ت ٣٢٧هـ).
--   ⚠️ فخّ مُتجنَّب: «علل الحديث — الفلاس» (96609) مؤلَّف آخر لعمرو بن علي الفلاس لا لابن أبي حاتم،
--   وكذلك «علل الدارقطني» (9082) و«العلل لابن المديني» (6038).
UPDATE lesson_citations SET url='https://shamela.ws/book/1350' WHERE source_type='book' AND url IS NULL AND citation='علل الحديث — الإمام ابن أبي حاتم الرازي';

-- علم أصول الفقه — عبد الوهاب خلاف:
--   بطاقة الشاملة 10767 عنوانها بالحرف «علم أصول الفقه» — عبد الوهاب خلاف (ت ١٣٧٥هـ)،
--   مكتبة الدعوة شباب الأزهر عن الطبعة الثامنة لدار القلم.
--   (والبطاقة 12380 لطبعة المدني تسمّيه «علم أصول الفقه وخلاصة تاريخ التشريع» — نفس المؤلف
--   لكن عنوان بطاقتها أطول، فاختيرت المطابقة الحرفية.)
UPDATE lesson_citations SET url='https://shamela.ws/book/10767' WHERE source_type='book' AND url IS NULL AND citation='علم أصول الفقه — عبد الوهاب خلاف';

-- فتح الباري بشرح صحيح البخاري — ابن حجر العسقلاني (صيغتا نسبة، بطاقة واحدة):
--   بطاقة الشاملة 1673 «فتح الباري بشرح البخاري» — أحمد بن علي بن حجر العسقلاني (٧٧٣–٨٥٢هـ)،
--   المكتبة السلفية بمصر. ⚠️ فخّ مُتجنَّب: «فتح الباري لابن رجب» (137) شرح آخر لمؤلف آخر.
UPDATE lesson_citations SET url='https://shamela.ws/book/1673' WHERE source_type='book' AND url IS NULL AND citation='فتح الباري بشرح صحيح البخاري — أحمد بن علي بن حجر العسقلاني';
UPDATE lesson_citations SET url='https://shamela.ws/book/1673' WHERE source_type='book' AND url IS NULL AND citation='فتح الباري بشرح صحيح البخاري — الحافظ ابن حجر العسقلاني';

-- فقه الزكاة — القرضاوي (صيغتان، صفحة الكتاب على موقع المؤلف الرسمي):
--   al-qaradawi.net/content/فقه-الزكاة — صفحة الكتاب في «مكتبة القرضاوي»، وفيها شهادتا
--   محمد المبارك ومحمد الغزالي في الكتاب نصًّا. غير موجود على الشاملة، ونسخ مكتبة الإسكندرية
--   على الأرشيف (AAlexandrina-002310 وغيرها) تحمل `creator: "القرضاوي، يوسف"` و`publisher: مؤسسة الرسالة`
--   بعنوان «فقه الزكاة: دراسة مقارنة لأحكامها وفلسفتها في ضوء القرآن والسنة» — فالنسبة قطعية.
UPDATE lesson_citations SET url='https://www.al-qaradawi.net/content/%D9%81%D9%82%D9%87-%D8%A7%D9%84%D8%B2%D9%83%D8%A7%D8%A9' WHERE source_type='book' AND url IS NULL AND citation='فقه الزكاة — الدكتور يوسف القرضاوي';
UPDATE lesson_citations SET url='https://www.al-qaradawi.net/content/%D9%81%D9%82%D9%87-%D8%A7%D9%84%D8%B2%D9%83%D8%A7%D8%A9' WHERE source_type='book' AND url IS NULL AND citation='فقه الزكاة — د. يوسف القرضاوي';

-- فقه السنة — سيد سابق (أربع صيغ بكتب مختلفة، بطاقة واحدة):
--   بطاقة الشاملة 9486 — سيد سابق (ت ١٤٢٠هـ)، دار الكتاب العربي ببيروت، ط٣ ١٣٩٧هـ.
--   ⚠️ فخاخ مُتجنَّبة: «تمام المنة في التعليق على فقه السنة» (11122) للألباني، و«صحيح فقه السنة»
--   (13619) لأبي مالك كمال بن السيد سالم — كلاهما كتاب آخر لا «فقه السنة» نفسه.
UPDATE lesson_citations SET url='https://shamela.ws/book/9486' WHERE source_type='book' AND url IS NULL AND citation='فقه السنة — السيد سابق (كتاب الزواج)';
UPDATE lesson_citations SET url='https://shamela.ws/book/9486' WHERE source_type='book' AND url IS NULL AND citation='فقه السنة — السيد سابق (كتاب الطلاق)';
UPDATE lesson_citations SET url='https://shamela.ws/book/9486' WHERE source_type='book' AND url IS NULL AND citation='فقه السنة — السيد سابق (كتاب العدة)';
UPDATE lesson_citations SET url='https://shamela.ws/book/9486' WHERE source_type='book' AND url IS NULL AND citation='فقه السنة — سيد سابق';

COMMIT;

-- ═══ ج) خمسة صفوف فُحصت ولم تُربط عن قصد (الصنف المرصود في ج-٢٢٠) ═══
-- الصفوف الآتية `source_type='book'` لكن نصَّها تخريج حديث لا عنوان كتاب، فلا بطاقة كتاب لها،
-- وتُترك للمعالجة الموحَّدة المخطَّطة لهذا الصنف (تحويل `source_type` أو إعادة صياغة الاستشهاد):
--   • صحيح البخاري (50) وصحيح مسلم (9) — حديث جبريل عليه السلام
--   • صحيح البخاري (6094) وصحيح مسلم (2607)
--   • صحيح البخاري وصحيح مسلم — عن ابن عباس رضي الله عنهما (حديث الأحرف السبعة، متفق عليه)
--   • صحيح البخاري، كتاب فضائل القرآن، رقم 5027
--   • صحيح مسلم، كتاب العلم، رقم 2670

-- ═══ د) تحقُّق بعد التطبيق ═══
-- SELECT count(*) FROM lesson_citations WHERE source_type='book';                  -- متوقَّع: 455 (لا حذف ولا إضافة)
-- SELECT count(*) FROM lesson_citations WHERE source_type='book' AND url IS NULL;  -- متوقَّع: 91 ⇐ 63
-- SELECT count(*) FROM lesson_citations WHERE source_type='book' AND citation='فقه الأولويات — يوسف القرضاوي'; -- متوقَّع: 0
