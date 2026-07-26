/**
 * فوائد علمية مختارة — موثقة ومُصنّفة
 *
 * ملاحظة (2026-07-19): اكتُشف بالفحص المباشر أن 10 عناصر في هذا الملف
 * كانت تحمل قيم category ("الزهد"، "الزهد والتقوى"، "الأسرة"، "الصبر
 * والتوكل"، "اللغة العربية") لا تطابق أياً من الشرائح المعروضة فعلياً في
 * FawaidPage.tsx (لا هنا في FAWAID_CURATED_CATEGORIES ولا في
 * LEGACY_CATEGORIES بذلك الملف) — فكانت تختفي صامتاً عند الفلترة بأي
 * تصنيف محدَّد رغم ظهورها تحت "الكل"، نفس عائلة عطل "142 فائدة" المُصلَح
 * سابقاً في fawaid-seed.ts (2026-07-18) لكن في هذا الملف تحديداً الذي لم
 * يُفحص حينها. أُعيدت تسميتها لأقرب تصنيف قائم فعلاً: "الزهد"/"الزهد
 * والتقوى" → "الرقائق" (نفس معنى تزكية القلب)، "الأسرة" → "التربية"،
 * "الصبر والتوكل" → "العقيدة" (التوكل من مسائل الاعتقاد)، "اللغة
 * العربية" → "اللغة" (نفس المعنى بالضبط).
 */
export const FAWAID_CURATED_CATEGORIES = [
  "العقيدة",
  "التفسير",
  "الحديث",
  "الفقه",
  "السيرة",
  "الآداب",
  "الأخلاق",
  "القرآن",
  "طلب العلم",
  "الدعوة",
  "التربية",
  "اللغة",
] as const;

export type FawaidCuratedItem = {
  id: string;
  text: string;
  category: string;
  source: string | null;
  author_name: string | null;
  status: "approved";
  verification_status: "verified" | "needs_review";
};

const curated: Omit<FawaidCuratedItem, "id">[] = [
  { text: "التوحيد أصل دعوة الرسل؛ فمن أقرّ به دخل الجنة وإن لم يكمل الأعمال.", category: "العقيدة", source: "قال تعالى: {وَمَا أَرْسَلْنَا مِن قَبْلِكَ مِن رَّسُولٍ إِلَّا نُوحِي إِلَيْهِ أَنَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدُونِ}", author_name: "القرآن الكريم — الأنبياء: 25", status: "approved", verification_status: "verified" },
  { text: "الأعمال بالنيات؛ فمن أخلص لله نفعته، ومن أشرك أبطلها.", category: "العقيدة", source: "متفق عليه: «إنما الأعمال بالنيات»", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الشفاعة يوم القيامة من خصائص هذه الأمة بإذن الله.", category: "العقيدة", source: "«أنا أول من يشفع يوم القيامة» — رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "«بسم الله» أي: أبدأ باسم الله مستعيناً به.", category: "التفسير", source: "تفسير ابن كثير — سورة الفاتحة", author_name: "ابن كثير", status: "approved", verification_status: "verified" },
  { text: "الاستعاذة قبل التلاوة سنة؛ لأن الشيطان يحاول صرف القارئ.", category: "التفسير", source: "«فإذا قرأت القرآن فاستعذ بالله من الشيطان الرجيم» — النحل: 98", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "سورة الإخلاص تعدل ثلث القرآن في الأجر والثواب.", category: "القرآن", source: "«والذي نفسي بيده إنها لتعدل ثلث القرآن» — متفق عليه عن أبي سعيد الخدري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الصدق يهدي إلى البر، والبر يهدي إلى الجنة.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "رضا الرب في رضا الوالد، وسخطه في سخطهما.", category: "الآداب", source: "رواه الترمذي وصححه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "لا ينبغي لأحد أن يموت إلا وهو يحسن الظن بالله.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الوتر سنة مؤكدة؛ وتر الصلاة من سنة النبي ﷺ.", category: "الفقه", source: "أبو داود ١٤١٨ والترمذي ٤٥٢ — صححه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "الوضوء شرط لصحة الصلاة عند الحدث؛ فلا تُقبل صلاة بلا طهارة مما أوجبها.", category: "الفقه", source: "متفق عليه: «لا تُقبل صلاة بغير طهور» — ومعناه مجمع عليه", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "صلاة الجماعة أفضل من صلاة الفذ بسبع وعشرين درجة.", category: "الفقه", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "إنا لله وإنا إليه راجعون — أولئك عليهم صلوات من ربهم ورحمة.", category: "الأخلاق", source: "البقرة: 156-157", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الهجرة انتقال للدعوة من الاضطهاد إلى بناء مجتمع مسلم.", category: "السيرة", source: "السيرة النبوية — ابن هشام", author_name: "ابن هشام", status: "approved", verification_status: "verified" },
  { text: "بدر أول معركة فاصلة؛ وفيها نصر الله المؤمنين.", category: "السيرة", source: "صحيح البخاري — كتاب المغازي", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "ادعُ إلى سبيل ربك بالحكمة والموعظة الحسنة.", category: "الدعوة", source: "النحل: 125", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "من يرد الله به خيراً يفقهه في الدين — متفق عليه. وأما لفظ «طلب العلم فريضة على كل مسلم» فضعيف عند أكثر المحققين فلا يُستقل به؛ وفرضُ ما يحتاجه المسلم من أمر دينه ثابت بعموم التكليف.", category: "طلب العلم", source: "البخاري ٧١ ومسلم ١٠٣٥", author_name: null, status: "approved", verification_status: "verified" },
  { text: "مروا أولادكم بالصلاة لسبع.", category: "التربية", source: "رواه أبو داود — حسنه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت.", category: "الآداب", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من لا يرحم لا يرحم؛ فالرحمة سبب لنيل رحمة الله.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "ألا أنبئكم بخير أعمالكم وأزكاها عند مليككم… ذكر الله.", category: "الحديث", source: "الترمذي ٣٣٧٧ — صححه الألباني في صحيح الترغيب", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "من تعلم العلم ليباهي به العلماء ويجاري به السفهاء ويصرف به وجوه الناس إليه أدخله الله جهنم.", category: "طلب العلم", source: "رواه ابن ماجه (260) والترمذي (2654) — صححه الألباني", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },
  { text: "من أنفق نفقة في سبيل الله كُتبت له بسبعمائة ضعف.", category: "الفقه", source: "رواه الترمذي (1625) والنسائي (3186) عن خريم بن فاتك الأسدي — حسّنه الترمذي وصححه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "أفلا يتدبرون القرآن أم على قلوب أقفالها.", category: "القرآن", source: "محمد: 24", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "ما يلفظ من قول إلا لديه رقيب عتيد.", category: "اللغة", source: "ق: 18", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "من تواضع لله رفعه؛ فالرفعة ثمرة الخفض لله.", category: "الآداب", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "من صلى عليّ صلاة صلى الله عليه بها عشراً.", category: "الحديث", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "خذ من أموالهم صدقة تطهرهم وتزكيهم بها.", category: "الفقه", source: "التوبة: 103", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الصوم جُنة؛ فإذا كان يوم صوم أحدكم فلا يرفث ولا يجهل.", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الحج مرة في العمر واجب على المستطيع.", category: "الفقه", source: "وجوب الحج من آل عمران: 97، وتحديد المرة الواحدة من حديث «الحج مرة، فمن زاد فهو تطوع» — رواه أبو داود (1721) وابن ماجه (2886)، صححه الألباني", author_name: "القرآن الكريم والحديث النبوي", status: "approved", verification_status: "verified" },
  { text: "الصدقة تطفئ الخطيئة كما يطفئ الماء النار.", category: "الحديث", source: "الترمذي ٦١٤ — حسّنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "إن الله رفيق يحب الرفق في الأمر كله.", category: "الدعوة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "تعاهدوا القرآن؛ فوالذي نفسي بيده لهو أشد تفلتاً من الإبل في عقلها.", category: "القرآن", source: "رواه البخاري ومسلم", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "أتدرون ما الغيبة؟ ذكرك أخاك بما يكره.", category: "الآداب", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الحياء لا يأتي إلا بخير.", category: "الأخلاق", source: "رواه البخاري ومسلم", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "المرء على دين خليله فلينظر أحدكم من يخالل.", category: "التربية", source: "رواه أبو داود — حسنه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "الدعاء بين الأذان والإقامة لا يرد.", category: "الفقه", source: "رواه أبو داود والترمذي — صححه الألباني في صحيح الترمذي", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "من قرأ آية الكرسي دبر كل صلاة لم يمنعه من دخول الجنة إلا أن يموت.", category: "القرآن", source: "رواه النسائي — صححه الألباني في السلسلة الصحيحة (972)", author_name: "سنن النسائي", status: "approved", verification_status: "verified" },
  { text: "يريد الله بكم اليسر ولا يريد بكم العسر.", category: "الفقه", source: "البقرة: 185", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الاستغفار سبب لدفع البلاء ونزول الرحمة.", category: "التفسير", source: "الأنفال: 33 — تفسير ابن كثير", author_name: "ابن كثير", status: "approved", verification_status: "verified" },
  { text: "من سلك طريقاً يلتمس فيه علماً سهّل الله له طريقاً إلى الجنة.", category: "طلب العلم", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الجنة أقرب إلى أحدكم من شراك نعله والنار مثل ذلك.", category: "العقيدة", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من آتاه الله علماً فكتمه أُلجم بلجام من نار يوم القيامة.", category: "طلب العلم", source: "رواه أبو داود — حسنه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "اقرأوا سورة البقرة فإن أخذها بركة وتركها حسرة ولا تستطيعها البطلة.", category: "القرآن", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "التثاؤب من الشيطان فإذا تثاءب أحدكم فليكظم ما استطاع.", category: "الآداب", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الدنيا سجن المؤمن وجنة الكافر.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "كل بدعة ضلالة وكل ضلالة في النار.", category: "العقيدة", source: "النسائي ١٥٧٨ — صححه الألباني", author_name: "سنن النسائي", status: "approved", verification_status: "verified" },
  { text: "خيركم من تعلّم القرآن وعلّمه.", category: "القرآن", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "إذا مات الإنسان انقطع عنه عمله إلا من ثلاثة: صدقة جارية أو علم ينتفع به أو ولد صالح يدعو له.", category: "الحديث", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الدعاء من أعظم أبواب العبادة والافتقار إلى الله، وهو مأمور به في الكتاب والسنة.", category: "الفقه", source: "قال تعالى: {ادْعُونِي أَسْتَجِبْ لَكُمْ} — غافر: 60", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "البر حسن الخلق والإثم ما حاك في صدرك وكرهت أن يطّلع عليه الناس.", category: "الأخلاق", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "أكمل المؤمنين إيماناً أحسنهم خلقاً.", category: "الأخلاق", source: "الترمذي ١١٦٢ وأبو داود — حسّنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "الغنى غنى النفس؛ فمن استغنى بما آتاه الله كفاه.", category: "الآداب", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "اليد العليا خير من اليد السفلى.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "ما نقصت صدقة من مال؛ فالبركة تعوّض الظاهر بالنقص.", category: "الفقه", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "صلوا كما رأيتموني أصلي؛ فالسنة مرجع صفة الصلاة.", category: "الفقه", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من أسرّ سريرة ألبسه الله رداءها — خيراً كانت أم شراً.", category: "العقيدة", source: "رواه أحمد — حسنه الألباني", author_name: "مسند أحمد", status: "approved", verification_status: "verified" },
  { text: "ليس منا من لم يرحم صغيرنا ويوقّر كبيرنا.", category: "الآداب", source: "رواه الترمذي (1919) — صححه الألباني في السلسلة الصحيحة (2196) بمجموع طرقه", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "كل سلامى من الناس عليه صدقة كل يوم.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "يُقبل الحق ممن جاء به إذا وافق الدليل؛ وأما اللفظ المرفوع «الحكمة ضالة المؤمن» فضعيف عند المحدّثين فلا يُستقل به.", category: "طلب العلم", source: "معنى مقرَّر عند أهل العلم؛ ضعّف الألباني اللفظ المشهور", author_name: null, status: "approved", verification_status: "verified" },

  /* ── عقيدة ── */
  { text: "أفضل الأعمال بعد الإسلام الصلاة لوقتها، ثم بر الوالدين، ثم الجهاد في سبيل الله.", category: "العقيدة", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "إن قلوب بني آدم كلها بين إصبعين من أصابع الرحمن، كقلب واحد، يصرّفه حيث يشاء.", category: "العقيدة", source: "رواه مسلم (2654) عن عبدالله بن عمرو بن العاص", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "لو يعلم المؤمن ما عند الله من العقوبة ما طمع بجنته أحد، ولو يعلم الكافر ما عند الله من الرحمة ما قنط من جنته أحد.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "أعوذ بكلمات الله التامات من شر ما خلق — من قالها لم يضره شيء.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الإيمان بضع وسبعون شعبة؛ فأفضلها لا إله إلا الله، وأدناها إماطة الأذى عن الطريق.", category: "العقيدة", source: "رواه مسلم (35)", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── تفسير ── */
  { text: "الفاتحة أم القرآن وأم الكتاب والسبع المثاني.", category: "التفسير", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "{وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ} — وراء كل قدر حكمة لا تراها.", category: "التفسير", source: "البقرة: 216", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الصبر والشكر مطيتان للإيمان لا يُحمل إلا عليهما.", category: "التفسير", source: "مدارج السالكين — فصل منزلة الصبر", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "{إِنَّ مَعَ الْعُسْرِ يُسْرًا} — تكررت مرتين إشارة إلى أن العسر واحد واليسر اثنان.", category: "التفسير", source: "الشرح: 5-6 — تفسير ابن كثير", author_name: "ابن كثير", status: "approved", verification_status: "verified" },

  /* ── حديث ── */
  { text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه.", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "رمضان مدرسة للصبر؛ والصبر مأمور به في القرآن وثوابه عظيم. وأما خطبة سلمان المشهورة في فضائل رمضان فمنكرة فلا تُروى للاستدلال.", category: "الحديث", source: "آيات الصبر وفضائل رمضان الثابتة؛ خطبة سلمان منكرة عند المحدّثين", author_name: null, status: "approved", verification_status: "verified" },
  { text: "سبعة يظلهم الله في ظله يوم لا ظل إلا ظله: الإمام العادل، وشاب نشأ في عبادة الله، ورجل قلبه معلّق بالمساجد، ورجلان تحابّا في الله، ورجل دعته امرأة ذات منصب وجمال فقال إني أخاف الله، ورجل تصدّق فأخفى حتى لا تعلم شماله ما تنفق يمينه، ورجل ذكر الله خالياً ففاضت عيناه.", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "كلمتان خفيفتان على اللسان ثقيلتان في الميزان حبيبتان إلى الرحمن: سبحان الله وبحمده سبحان الله العظيم.", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "لا تحاسدوا ولا تناجشوا ولا تباغضوا ولا تدابروا وكونوا عباد الله إخواناً.", category: "الحديث", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── فقه ── */
  { text: "تجب الزكاة في الذهب والفضة والحبوب والثمار والأنعام وعروض التجارة.", category: "الفقه", source: "فقه السنة — السيد سابق", author_name: "السيد سابق", status: "approved", verification_status: "verified" },
  { text: "مفتاح الصلاة الطهور، وتحريمها التكبير، وتحليلها التسليم.", category: "الفقه", source: "الترمذي ٣ — حسّنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "من أدرك ركعة من الصلاة مع الإمام فقد أدرك الصلاة.", category: "الفقه", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "لا ضرر ولا ضرار — قاعدة فقهية جامعة في رفع المفسدة.", category: "الفقه", source: "ابن ماجه ٢٣٤١ — حسّنه الألباني بمجموع الطرق", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },
  { text: "المشقة تجلب التيسير — من أهم القواعد الفقهية الخمس الكبرى.", category: "الفقه", source: "الأشباه والنظائر — ابن نجيم", author_name: "ابن نجيم", status: "approved", verification_status: "verified" },

  /* ── القرآن ── */
  { text: "حافظ على قراءة القرآن في الصلاة وخارجها حتى يكون شفيعك يوم القيامة.", category: "القرآن", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "إن الذي يتعتع في القرآن وهو عليه شاق له أجران.", category: "القرآن", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من قرأ حرفاً من كتاب الله فله به حسنة والحسنة بعشر أمثالها.", category: "القرآن", source: "الترمذي ٢٩١٠ — صححه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── السيرة ── */
  { text: "فتح مكة كان بلا قتال تقريباً — ودخل النبي ﷺ مكة وهو يقرأ: {إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا}.", category: "السيرة", source: "صحيح البخاري — كتاب فضائل القرآن، باب الترجيع", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "خالف الرماة أمر النبي ﷺ بلزوم الجبل في غزوة أحد فانكشف ظهر المسلمين وانقلبت دفة المعركة.", category: "السيرة", source: "صحيح البخاري، حديث 3039 — كتاب المغازي", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "معاذ بن جبل أعلم الأمة بالحلال والحرام.", category: "السيرة", source: "الترمذي ٣٧٩٠ — حسّنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── الآداب ── */
  { text: "أقرب الناس من النبي ﷺ مجلساً يوم القيامة أحاسنهم خلقاً.", category: "الآداب", source: "الترمذي ٢٠١٨ عن جابر — حسّنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "إياكم والجلوس على الطرقات إلا أن تؤدوا حقها.", category: "الآداب", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "زينوا القرآن بأصواتكم؛ وتحسين الصوت بالتلاوة مشروع.", category: "الآداب", source: "رواه أبو داود — صحيح الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "لا يشكر الله من لا يشكر الناس.", category: "الآداب", source: "أبو داود ٤٨١١ — صححه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },

  /* ── الأخلاق ── */
  { text: "إن الله يحب إذا عمل أحدكم عملاً أن يتقنه.", category: "الأخلاق", source: "رواه البيهقي — صحيح الألباني", author_name: "شعب الإيمان", status: "approved", verification_status: "verified" },
  { text: "إنما بُعثت لأتمم مكارم الأخلاق.", category: "الأخلاق", source: "رواه البيهقي — صحيح الألباني", author_name: "شعب الإيمان", status: "approved", verification_status: "verified" },
  { text: "الحزن على الماضي مضيعة للحاضر.", category: "الأخلاق", source: "قاعدة نبوية — ابن القيم: مدارج السالكين", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },

  /* ── طلب العلم ── */
  { text: "العلم النافع يرفع صاحبه ويثمر العمل؛ قال ﷺ: «من سلك طريقًا يلتمس فيه علمًا سهّل الله له به طريقًا إلى الجنة» — مسلم. وأما ألفاظ «العالم والمتعلم شريكان…» فضعيفة فلا يُستقل بها.", category: "طلب العلم", source: "مسلم ٢٦٩٩؛ ضعّف أهل التحقيق الألفاظ المشهورة الأخرى", author_name: null, status: "approved", verification_status: "verified" },
  { text: "قيدوا العلم بالكتاب؛ فالكتابة تصون الحفظ من النسيان.", category: "طلب العلم", source: "أثر موقوف — رواه الدارمي وابن أبي شيبة، وصححه الحاكم في المستدرك", author_name: "عمر بن الخطاب", status: "approved", verification_status: "verified" },
  { text: "طلب العلم نافع للدنيا والآخرة؛ يُنسب للشافعي: «من أراد الدنيا فعليه بالعلم…» وهو قول مأثور بلا إسناد متصل يُعوَّل عليه، فيُذكر أدباً لا حديثاً.", category: "طلب العلم", source: "نسبة مشهورة للشافعي بلا إسناد متصل معتمد", author_name: "يُنسب للإمام الشافعي", status: "approved", verification_status: "verified" },

  /* ── الدعوة ── */
  { text: "فوالله لأن يهدي الله بك رجلاً واحداً خير لك من حمر النعم.", category: "الدعوة", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "بلّغوا عني ولو آية؛ فالعلم يزكو بالتبليغ ولو قلّ.", category: "الدعوة", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },

  /* ── التربية ── */
  { text: "تأديب الولد وتعليمه من أعظم الحقوق؛ قال ﷺ: «مروا أولادكم بالصلاة لسبع» — أبو داود، حسّنه الألباني. وأما لفظ «لأن يؤدب أحدكم ولده خير من أن يتصدق بصاع» فضعيف فلا يُستقل به.", category: "التربية", source: "أبو داود ٤٩٥ حسّنه الألباني؛ ضعّف الترمذي وغيره لفظ «خير من أن يتصدق بصاع»", author_name: null, status: "approved", verification_status: "verified" },
  { text: "حق الولد على والده أن يحسن اسمه ويحسن تربيته.", category: "التربية", source: "رواه البيهقي", author_name: "شعب الإيمان", status: "approved", verification_status: "verified" },

  /* ── اللغة ── */
  { text: "العناية بالعربية خدمة لفهم ألفاظ القرآن؛ والمعنى مقرَّر عند أهل العلم. وأما المرفوع «أعربوا القرآن والتمسوا غرائبه» فضعيف فلا يُستقل به.", category: "اللغة", source: "معنى علمي مقرَّر؛ ضعّف المحدّثون لفظ «أعربوا القرآن»", author_name: null, status: "approved", verification_status: "verified" },
  { text: "العناية بالعربية تعين على فهم القرآن والسنة؛ ولا يُحتج في ذلك بحديث موضوع.", category: "اللغة", source: "حديث «أحبوا العرب لثلاث» موضوع باتفاق النقاد — لا يُروى", author_name: null, status: "approved", verification_status: "verified" },

  /* ── إضافات العقيدة ── */
  { text: "من أحبّ للمسلمين ما يُحب لنفسه فقد كمل إيمانه.", category: "العقيدة", source: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه — متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "أفضل الإيمان أن تعلم أن الله معك أينما كنت.", category: "العقيدة", source: "رواه الطبراني — حسنه الألباني", author_name: "المعجم الكبير", status: "approved", verification_status: "verified" },
  { text: "من مات وهو يعلم أنه لا إله إلا الله دخل الجنة.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "التوكل على الله لا يعني ترك الأسباب؛ قال ﷺ للأعرابي: «اعقلها وتوكل» — الترمذي ٢٥١٧، حسّنه الألباني.", category: "العقيدة", source: "الترمذي ٢٥١٧ — حسن", author_name: null, status: "approved", verification_status: "verified" },

  /* ── إضافات الحديث ── */
  { text: "كفى بالمرء كذباً أن يُحدّث بكل ما سمع.", category: "الحديث", source: "رواه مسلم في مقدمة صحيحه", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "المسلم من سلم المسلمون من لسانه ويده.", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "لا تحقرن من المعروف شيئاً ولو أن تلقى أخاك بوجه طلق.", category: "الحديث", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── إضافات التفسير ── */
  { text: "القرآن الكريم نزل بلغة العرب ليُفهم ويُعمل به، فمن تدبّره وجد فيه دواء لكل داء.", category: "التفسير", source: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ — الإسراء: 82", author_name: "تفسير ابن كثير", status: "approved", verification_status: "verified" },
  { text: "الفاتحة أم القرآن لأنها جمعت أصول الدين: التوحيد، والعبادة، والطلب، والتوسل.", category: "التفسير", source: "تفسير ابن كثير — الفاتحة", author_name: "ابن كثير", status: "approved", verification_status: "verified" },
  { text: "آية الكرسي أعظم آية في القرآن لاشتمالها على صفات الله العليا.", category: "التفسير", source: "رواه مسلم — كتاب صلاة المسافرين", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── إضافات الفقه ── */
  { text: "لا ضرر ولا ضرار — قاعدة فقهية جامعة تمنع كل أذى للنفس أو الغير.", category: "الفقه", source: "رواه ابن ماجه وصححه الألباني", author_name: "قواعد الفقه الإسلامي", status: "approved", verification_status: "verified" },
  { text: "المشقة تجلب التيسير — رفع الحرج من أبرز خصائص الشريعة الإسلامية.", category: "الفقه", source: "وَمَا جَعَلَ عَلَيْكُمْ فِي الدِّينِ مِنْ حَرَجٍ — الحج: 78", author_name: "الأشباه والنظائر — السيوطي", status: "approved", verification_status: "verified" },
  { text: "الأمور بمقاصدها — فالعبرة في الأحكام الشرعية بالنوايا والمآلات.", category: "الفقه", source: "القاعدة الأولى من القواعد الخمس الكبرى", author_name: "المجلة الأحكام العدلية", status: "approved", verification_status: "verified" },

  /* ── إضافات السيرة ── */
  { text: "الهجرة النبوية درس في الصبر والتخطيط؛ فما أسس النبي ﷺ دولة إلا بعد 13 سنة من الدعوة (3 سنوات سرًا و10 سنوات جهرًا).", category: "السيرة", source: "السيرة النبوية — ابن هشام وابن كثير", author_name: "ابن هشام", status: "approved", verification_status: "verified" },
  { text: "غزوة بدر برهان على أن النصر بالله لا بالعدد.", category: "السيرة", source: "صحيح البخاري — كتاب المغازي", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "فتح مكة كان فتح الرحمة، ولم يُقتل فيه إلا من أبى التسليم وقاتل.", category: "السيرة", source: "البداية والنهاية — ابن كثير", author_name: "ابن كثير", status: "approved", verification_status: "verified" },

  /* ── إضافات طلب العلم ── */
  { text: "ما نقص مال من صدقة، وما زاد الله عبداً بعفو إلا عزاً، وما تواضع أحد لله إلا رفعه الله.", category: "طلب العلم", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "خير ما يخلّف الرجل من بعده ثلاث: ولد صالح يدعو له، وصدقة تجري يبلغه أجرها، وعلم يُعمل به من بعده.", category: "طلب العلم", source: "رواه ابن ماجه (242) — حسنه الألباني", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },
  { text: "العلم يُورث الخشية، والخشية تُورث العمل، والعمل يُورث الجنة.", category: "طلب العلم", source: "إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ — فاطر: 28", author_name: "الإمام ابن القيم", status: "approved", verification_status: "verified" },

  /* ── إضافات الدعوة ── */
  { text: "الداعي إلى الله يبدأ بنفسه قبل غيره — فكيف ينهى الناس ويأتي ما ينهى عنه؟", category: "الدعوة", source: "أَتَأْمُرُونَ النَّاسَ بِالْبِرِّ وَتَنسَوْنَ أَنفُسَكُمْ — البقرة: 44", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الرفق ما وُضع في شيء إلا زانه، وما نُزع من شيء إلا شانه.", category: "الدعوة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── إضافات التربية ── */
  { text: "اتقِ الله في أهلك وولدك كما تتقيه في مالك.", category: "التربية", source: "أثر السلف — مدارج السالكين", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "الولد يتشكّل على يد والديه؛ فكن القدوة قبل أن تكون الموجّه.", category: "التربية", source: "كل مولود يولد على الفطرة — متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },

  /* ── إضافات الآداب ── */
  { text: "الاستئذان ثلاث، فإن أُذن وإلا فارجع.", category: "الآداب", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "إياكم والظن فإن الظن أكذب الحديث.", category: "الآداب", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "حسن الخلق بابٌ من أبواب الجنة؛ قال ﷺ: «أكثر ما يُدخل الجنة تقوى الله وحسن الخلق» — الترمذي ٢٠٠٤، صححه الألباني.", category: "الآداب", source: "الترمذي ٢٠٠٤ — صحيح", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── إضافات الأخلاق ── */
  { text: "الكبر بطر الحق وغمط الناس.", category: "الأخلاق", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "من حُرم الرفق حُرم الخير كله.", category: "الأخلاق", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الغيبة ذكرك أخاك بما يكره — فيها إثم عظيم وإن كان المقول فيه كذلك.", category: "الأخلاق", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── إضافات القرآن ── */
  { text: "تلاوة آية بتدبّر وفهم خير من ختمة بلا تفكّر.", category: "القرآن", source: "أثر سلفي — ابن القيم: مفتاح دار السعادة", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "من قرأ حرفاً من كتاب الله فله به حسنة والحسنة بعشر أمثالها.", category: "القرآن", source: "الترمذي ٢٩١٠ — صححه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "أهل القرآن هم أهل الله وخاصته.", category: "القرآن", source: "رواه النسائي وابن ماجه — صحيح الألباني", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },

  /* ── إضافات العقيدة ── */
  { text: "التفكر في النفس والخلق يدل على عظمة الخالق؛ قال تعالى: ﴿وَفِي أَنفُسِكُمْ أَفَلَا تُبْصِرُونَ﴾. وأما لفظ «من عرف نفسه عرف ربه» فليس بحديث مرفوع.", category: "العقيدة", source: "الذاريات: ٢١؛ أنكره النووي وابن تيمية كحديث مرفوع", author_name: null, status: "approved", verification_status: "verified" },
  { text: "الحياء شعبة من شعب الإيمان؛ ومن قلّ حياؤه ضعف إيمانه.", category: "العقيدة", source: "الشطر الأول حديث متفق عليه: «الإيمان بضع وستون شعبة، والحياء شعبة من الإيمان»؛ الشطر الثاني تعليق تفسيري وليس من نص الحديث", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الدجال يخرج من المشرق؛ وعلامة قربه ظهور الفتن وكثرة الكذب.", category: "العقيدة", source: "رواه البخاري ومسلم — أشراط الساعة", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },

  /* ── إضافات الحديث ── */
  { text: "اتقوا الله وصلوا أرحامكم.", category: "الحديث", source: "رواه البيهقي في شعب الإيمان عن ابن مسعود — حسّنه الألباني في صحيح الجامع", author_name: "صحيح الجامع للألباني", status: "approved", verification_status: "verified" },
  { text: "إن الله يحب إذا عمل أحدكم عملاً أن يتقنه.", category: "الحديث", source: "رواه البيهقي — صحيح الألباني", author_name: "السلسلة الصحيحة", status: "approved", verification_status: "verified" },
  { text: "من صمت نجا — السكوت أمان، والكلام مسؤولية.", category: "الحديث", source: "الترمذي ٢٥٠١ — حسّنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── إضافات السيرة ── */
  { text: "الفتح الأكبر كان بلا حرب؛ دخل النبي ﷺ مكة وعفا عن أهلها — قدوة في العفو والرحمة.", category: "السيرة", source: "صحيح البخاري — كتاب المغازي", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "غزوة بدر نُصر فيها المؤمنون وهم نحو ثلاثمائة وبضعة عشر على قريش — دليل أن النصر من عند الله. العدد «٣١٣» بتفصيله في الترمذي؛ والأصل العام في البخاري.", category: "السيرة", source: "البخاري (ثلاثمائة وبضعة عشر)؛ الترمذي عن البراء بالعدد المفصّل", author_name: "صحيح البخاري / سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── إضافات اللغة ── */
  { text: "اللغة العربية لغة القرآن؛ من أتقنها أعان فهمه لكتاب الله.", category: "اللغة", source: "فضل عربية القرآن — ابن تيمية: اقتضاء الصراط المستقيم", author_name: "ابن تيمية", status: "approved", verification_status: "verified" },
  { text: "إعراب الكلمة يكشف معناها؛ فمن أتقن الإعراب أمن اللحن في تلاوته.", category: "اللغة", source: "شرح ألفية ابن مالك — ابن عقيل", author_name: "ابن عقيل", status: "approved", verification_status: "verified" },

  /* ── إضافات طلب العلم ── */
  { text: "العلم يحتاج إلى تفرّغ؛ يُنسب: «العلم لا يعطيك بعضه حتى تعطيه كلك» — قول مأثور بلا إسناد متصل معتمد، فيُذكر أدباً لا مرفوعاً.", category: "طلب العلم", source: "نسبة مشهورة للشافعي/الجاحظ بلا إسناد متصل", author_name: "قول مأثور", status: "approved", verification_status: "verified" },
  { text: "أول العلم الصمت، ثم الاستماع، ثم الحفظ، ثم العمل، ثم النشر.", category: "طلب العلم", source: "قول مأثور عن الأصمعي (عبد الملك بن قريب)، لا عن الإمام الشافعي", author_name: "الأصمعي", status: "approved", verification_status: "verified" },

  /* ── إضافات الدعوة ── */
  { text: "الداعية يحتاج إلى فقه المقاصد؛ فلا يضيّع واجباً بحجة مستحب.", category: "الدعوة", source: "الموافقات — الإمام الشاطبي", author_name: "الإمام الشاطبي", status: "approved", verification_status: "verified" },
  { text: "الحكمة في الدعوة لا تعني التنازل عن الحق؛ بل حسن اختيار الوقت والأسلوب.", category: "الدعوة", source: "تفسير ابن سعدي — النحل: 125", author_name: "ابن سعدي", status: "approved", verification_status: "verified" },

  /* ── إضافات الزهد والرقائق ── */
  { text: "الزهد في الدنيا ليس ترك أسبابها؛ بل ألا تستعبدك ولا تملأ قلبك.", category: "الرقائق", source: "مدارج السالكين — ابن القيم", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "ما أُفرغ في جوف ابن آدم أشد من الحب والغضب؛ فداوِهما بالصبر والاستعاذة.", category: "الرقائق", source: "إغاثة اللهفان — ابن القيم", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "أكبر الكبائر: الإشراك بالله، والأمن من مكر الله، والقنوط من رحمة الله، واليأس من روح الله.", category: "الرقائق", source: "أثر عن عبدالله بن مسعود — رواه عبدالرزاق والطبراني في الكبير وذكره ابن جرير، إسناده صحيح", author_name: "عبدالله بن مسعود", status: "approved", verification_status: "verified" },

  /* ── إضافات الأخلاق ── */
  { text: "قيمة المرء بأخلاقه لا بماله ولا بجاهه — معنى أدبي يُنسب لشعر الشافعي؛ يُذكر أدباً لا حديثاً.", category: "الأخلاق", source: "يُنسب لديوان الشافعي — أدب لا مرفوع", author_name: "يُنسب للإمام الشافعي", status: "approved", verification_status: "verified" },
  { text: "من جمع بين حسن الخُلق والعلم فقد أوتي خير الدنيا والآخرة.", category: "الأخلاق", source: "أدب الدنيا والدين — الماوردي", author_name: "الماوردي", status: "approved", verification_status: "verified" },
  { text: "الكرم في النفس أعلى درجات الكرم؛ أن تجود بنفسك على الحق وإن شق.", category: "الأخلاق", source: "مدارج السالكين — ابن القيم", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },

  /* ── إضافات التفسير ── */
  { text: "التفسير بالرأي المجرد دون علم محرّم؛ وتفسير القرآن بالقرآن هو أعلى درجات البيان.", category: "التفسير", source: "مقدمة في أصول التفسير — ابن تيمية", author_name: "ابن تيمية", status: "approved", verification_status: "verified" },
  { text: "القرآن تدبّره في السر ثمرته في العلانية؛ من تدبّر آياته ظهر ذلك في سلوكه.", category: "التفسير", source: "التبيان في آداب حملة القرآن — النووي", author_name: "الإمام النووي", status: "approved", verification_status: "verified" },

  /* ── إضافات الفقه ── */
  { text: "الأصل في الأشياء الإباحة حتى يرد دليل على التحريم — قاعدة ذهبية في الفقه الإسلامي.", category: "الفقه", source: "قواعد الأحكام — العز بن عبد السلام", author_name: "العز بن عبد السلام", status: "approved", verification_status: "verified" },
  { text: "درء المفسدة مقدّم على جلب المصلحة؛ وهذا أصل عظيم في الاجتهاد الفقهي.", category: "الفقه", source: "الأشباه والنظائر — ابن نجيم", author_name: "ابن نجيم الحنفي", status: "approved", verification_status: "verified" },

  /* ── إضافات الأسرة ── */
  { text: "خيركم خيركم لأهله — الأسرة الصالحة أساس المجتمع المسلم الصالح.", category: "التربية", source: "الترمذي ٣٨٩٥ — صححه الألباني", author_name: "النبي محمد ﷺ", status: "approved", verification_status: "verified" },
  { text: "تعليم الصلاة مقدَّم في تربية الأولاد؛ قال ﷺ: «مروا أولادكم بالصلاة لسبع» — أبو داود حسّنه الألباني. وأما صياغة «البيت السعيد…» فتعبير تربوي حديث لا مرفوع.", category: "التربية", source: "أبو داود ٤٩٥؛ صياغة البيت من كتب التربية المعاصرة (علوان) لا حديث", author_name: null, status: "approved", verification_status: "verified" },

  /* ── إضافات العقيدة ── */
  { text: "التوحيد أسُّ الدين وقمّته؛ فلا عمل يُقبل بلا توحيد، ولا توحيد يكتمل بلا إخلاص.", category: "العقيدة", source: "درء تعارض العقل والنقل — ابن تيمية", author_name: "ابن تيمية", status: "approved", verification_status: "verified" },
  { text: "اليقين هو الركن الركين في بنيان الإيمان؛ من رُزق اليقين هانت عليه الدنيا وعظمت عنده الآخرة.", category: "العقيدة", source: "مدارج السالكين — ابن القيم", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "الإيمان قول وعمل ونية — لا يصح بعضها دون بعض في منظومة الاعتقاد الصحيح.", category: "العقيدة", source: "شرح السنة — الإمام البغوي", author_name: "الإمام البغوي", status: "approved", verification_status: "verified" },

  /* ── إضافات طلب العلم ── */
  { text: "لا تصلح الأُمة حتى يصلح علماؤها؛ وعلماء الأمة مصابيح الهداية في الظلمات.", category: "طلب العلم", source: "جامع بيان العلم — ابن عبد البر", author_name: "ابن عبد البر", status: "approved", verification_status: "verified" },
  { text: "من أدب طالب العلم أن لا يفتتن بمدح الناس ولا ينكسر بذمهم في طلبه — معنى مبثوث في كتب آداب الطلب كالجامع للخطيب؛ ليس حديثاً مرفوعاً.", category: "طلب العلم", source: "معنى من آداب الطلب (الجامع لأخلاق الراوي ونحوه) — أدب لا مرفوع", author_name: "الخطيب البغدادي (معنى)", status: "approved", verification_status: "verified" },

  /* ── إضافات القرآن ── */
  { text: "من أراد علم الأولين والآخرين فليتدبّر القرآن — فيه جواب كل سؤال وشفاء كل داء.", category: "القرآن", source: "أثر عن عبدالله بن مسعود — رواه أحمد في الزهد وابن أبي شيبة والطبراني في الكبير والبيهقي في شعب الإيمان، نقله ابن تيمية في مقدمة في أصول التفسير", author_name: "عبدالله بن مسعود", status: "approved", verification_status: "verified" },
  { text: "الحافظ للقرآن يُقال له يوم القيامة: اقرأ وارتقِ ورتّل — فمنزلته عند آخر آية يقرؤها.", category: "القرآن", source: "الترمذي ٢٩١٤ وأبو داود ١٤٦٤ — حسّنه الألباني", author_name: "النبي محمد ﷺ", status: "approved", verification_status: "verified" },

  /* ── إضافات التربية ── */
  { text: "القدوة أبلغ من الوعظ؛ والأصل: ﴿أَتَأْمُرُونَ النَّاسَ بِالْبِرِّ وَتَنسَوْنَ أَنفُسَكُمْ﴾. صياغة «التربية تبدأ بالنفس…» تعبير معاصر لا مرفوع.", category: "التربية", source: "البقرة: ٤٤؛ صياغة معاصرة في كتب التربية (علوان ونحوه)", author_name: null, status: "approved", verification_status: "verified" },
  { text: "لا تُكثر أمر ولدك بالنهي؛ فإن الإكثار يُفضي إلى الجرأة. علّمه بالترغيب قبل الترهيب.", category: "التربية", source: "أدب الدنيا والدين — الماوردي", author_name: "الماوردي", status: "approved", verification_status: "verified" },

  /* ── إضافات الحديث ── */
  { text: "صحيح البخاري أصح الكتب بعد كتاب الله؛ وقد استغرق البخاري ستة عشر عاماً في تصنيفه.", category: "الحديث", source: "هدي الساري مقدمة فتح الباري — ابن حجر العسقلاني", author_name: "ابن حجر العسقلاني", status: "approved", verification_status: "verified" },
  { text: "ما صحّ عن النبي ﷺ حجة بنفسه عند أهل السنة؛ والعمل به لا يتوقف على موافقة مذهب معيّن — تقرير أصولي معروف عند المحدّثين والفقهاء المحققين.", category: "الحديث", source: "تقرير أصولي عند أهل السنة (انظر كلام الألباني في صفة الصلاة ونحوه)", author_name: "أصول أهل السنة", status: "approved", verification_status: "verified" },

  /* ── إضافات الفقه ── */
  { text: "الفقه ليس حفظ المسائل فحسب؛ بل فهم المقاصد وتنزيلها على الوقائع. والفقيه من يُحسن ذلك.", category: "الفقه", source: "الموافقات — أبو إسحاق الشاطبي", author_name: "الشاطبي", status: "approved", verification_status: "verified" },
  { text: "من أتقن أصول الفقه أمن من الزلل؛ لأن الأصول ميزان الأحكام وبها يُفرَّق بين الصحيح والفاسد.", category: "الفقه", source: "إرشاد الفحول — الشوكاني", author_name: "الشوكاني", status: "approved", verification_status: "verified" },

  /* ── إضافات السيرة ── */
  { text: "دراسة السيرة النبوية واجب على كل مسلم؛ فهي التطبيق العملي للقرآن الكريم في حياة بشرية كاملة.", category: "السيرة", source: "الشمائل المحمدية — الترمذي", author_name: "الإمام الترمذي", status: "approved", verification_status: "verified" },

  /* ── إضافات الزهد والتقوى ── */
  { text: "الزهد ليس فراراً من الدنيا؛ بل ألّا تُسكن الدنيا قلبك وهي في يدك. فاعملها واتركها في يدك لا في قلبك.", category: "الرقائق", source: "إحياء علوم الدين — الغزالي", author_name: "الإمام الغزالي", status: "approved", verification_status: "verified" },
  { text: "قيمة الوقت عند المؤمن من قيمة نفسه؛ فكل ساعة تمر بلا طاعة أو نفع هي خسارة لا تُعوَّض.", category: "الرقائق", source: "الفوائد — ابن القيم", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },

  /* ── إضافات الصبر والتوكل ── */
  { text: "التوكل على الله لا يعني ترك الأسباب؛ بل أن تأخذ بالأسباب وقلبك معلق بالمسبب لا بالسبب.", category: "العقيدة", source: "مدارج السالكين — ابن القيم", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },

  /* ── إضافات اللغة العربية ── */
  { text: "من أتقن العربية فتح له باب الفهم على الكتاب والسنة؛ ولغة القرآن ليست وسيلة فحسب بل هي من شريعته.", category: "اللغة", source: "اقتضاء الصراط المستقيم — ابن تيمية", author_name: "ابن تيمية", status: "approved", verification_status: "verified" },
  { text: "أفصح البشر لساناً رسول الله ﷺ — أوتي جوامع الكلم: كلمات قليلة تحمل معاني غزيرة لا يُحيط بها شرح.", category: "اللغة", source: "جوامع الكلم — دراسة حديثية", author_name: "النبي محمد ﷺ", status: "approved", verification_status: "verified" },

  /* ── الطب النبوي والصحة ── */
  { text: "عليكم بهذا العود الهندي فإن فيه سبعة أشفية.", category: "الحديث", source: "رواه البخاري ومسلم", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الشفاء في ثلاثة: شربة عسل، وحجامة (شرطة مِحجم)، وكية بالنار — ونهى النبي ﷺ أمته عن الكي.", category: "الحديث", source: "رواه البخاري (٥٦٨٠) عن ابن عباس", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الاعتدال في الطعام مشروع؛ قال ﷺ: «ما ملأ آدمي وعاء شراً من بطن…» — الترمذي ٢٣٨٠ حسّنه الألباني. وأما نسبته للحارث بن كلدة فأدب طبي لا مرفوع.", category: "الحديث", source: "الترمذي ٢٣٨٠ حسّنه الألباني؛ قول الحارث بن كلدة أدب طبي لا حديث", author_name: null, status: "approved", verification_status: "verified" },
  { text: "يصبح على كل سلامى من أحدكم صدقة: فكل تسبيحة صدقة، وكل تحميدة صدقة، وكل تهليلة صدقة، وكل تكبيرة صدقة، وأمر بالمعروف صدقة، ونهي عن المنكر صدقة، ويجزئ من ذلك ركعتان يركعهما من الضحى.", category: "الحديث", source: "رواه مسلم عن أبي ذر (٧٢٠)", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── المعاملات والأخلاق التجارية ── */
  { text: "البيّعان بالخيار ما لم يتفرّقا؛ فإن صدقا وبيّنا بورك لهما، وإن كتما وكذبا مُحقت بركة بيعهما.", category: "الفقه", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "المسلم أخو المسلم — لا يحل لمسلم أن يبيع على بيع أخيه.", category: "الفقه", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "إن التجار يُبعثون يوم القيامة فجاراً إلا من اتقى الله وبرّ وصدق.", category: "الأخلاق", source: "الترمذي ١٢١٠ — حسّنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "ثلاثة لا يكلمهم الله يوم القيامة: المُسبل والمنّان والمنفّق سلعته بالحلف الكاذب.", category: "الفقه", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── مواقف المؤمن من الابتلاء ── */
  { text: "عجباً لأمر المؤمن إن أمره كله خير؛ إن أصابته سراء شكر فكان خيراً له، وإن أصابته ضراء صبر فكان خيراً له.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "ما يصيب المسلم من نصب ولا وصب، ولا هم ولا حزن، ولا أذى ولا غم، حتى الشوكة يُشاكها، إلا كفّر الله بها من خطاياه.", category: "العقيدة", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "إن الله إذا أحب قوماً ابتلاهم؛ فمن رضي فله الرضا، ومن سخط فله السخط.", category: "العقيدة", source: "الترمذي ٢٣٩٦ — حسّنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── العلم والإبداع من منظور إسلامي ── */
  { text: "العقل أكبر نعمة أنعمها الله على الإنسان؛ ومن لم يستعمله في خدمة الحق فقد أضاع أعز ما أُعطي.", category: "طلب العلم", source: "إحياء علوم الدين — الغزالي", author_name: "الإمام الغزالي", status: "approved", verification_status: "verified" },
  { text: "التفقه في الدين من أعظم الخيرات؛ قال ﷺ: «من يرد الله به خيراً يفقهه في الدين» — متفق عليه. ولا يتوقف نفع العلم على جاهٍ ولا سنٍّ.", category: "طلب العلم", source: "البخاري ٧١ ومسلم ١٠٣٥", author_name: null, status: "approved", verification_status: "verified" },
  { text: "التأمل في خلق الله مطلوب شرعاً؛ قال تعالى: ﴿وَيَتَفَكَّرُونَ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ﴾. وأما لفظ «التفكر ساعة خير من عبادة سبعين سنة» فلم يثبت مرفوعاً فلا يُستدل به.", category: "طلب العلم", source: "آل عمران: ١٩١؛ ضعّف أهل التحقيق المرفوع المشهور", author_name: null, status: "approved", verification_status: "verified" },

  /* ── الدعاء والتوسل ── */
  { text: "يُستدل على حسن الظن عند الدعاء بقوله تعالى: ﴿ادْعُونِي أَسْتَجِبْ لَكُمْ﴾ و«الدعاء هو العبادة» — الترمذي ٢٩٦٩ صحيح. وأما «ادعوا الله وأنتم موقنون بالإجابة» و«من قلب غافل لاهٍ» فضعيفان عند المحققين فلا يُستقل بهما.", category: "الفقه", source: "غافر: ٦٠؛ الترمذي ٢٩٦٩ صحيح؛ ضعّف الألباني ٣٤٧٩ وما في معناه", author_name: null, status: "approved", verification_status: "verified" },
  { text: "الدعاء هو العبادة — من تركه تكبّر، ومن واظب عليه قَرُب.", category: "الفقه", source: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ — غافر: 60", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "أقرب ما يكون العبد من ربه وهو ساجد؛ فأكثروا فيه الدعاء.", category: "الفقه", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── الصبر والثبات ── */
  { text: "الصبر ثلاثة أنواع: صبر على الطاعة، وصبر عن المعصية، وصبر على المصيبة.", category: "الأخلاق", source: "عدة الصابرين — ابن القيم", author_name: "ابن قيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "إن الله مع الصابرين — هذه المعية تعني النصر والتأييد والحفظ والتوفيق.", category: "العقيدة", source: "البقرة: 153، وتفسير ابن سعدي", author_name: "الإمام ابن سعدي", status: "approved", verification_status: "verified" },

  /* ── الأسرة والمجتمع ── */
  { text: "المجتمع المسلم كالجسد الواحد؛ إذا اشتكى منه عضو تداعى له سائر الجسد بالسهر والحمى.", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "المؤمن للمؤمن كالبنيان يشد بعضه بعضاً — التماسك الاجتماعي فريضة إسلامية.", category: "الحديث", source: "رواه البخاري ومسلم", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من كان في حاجة أخيه كان الله في حاجته، ومن فرّج كربة فرّج الله عنه كربة من كرب يوم القيامة.", category: "الحديث", source: "رواه البخاري ومسلم", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },

  /* ── التوبة والمغفرة ── */
  { text: "قل يا عبادي الذين أسرفوا على أنفسهم لا تقنطوا من رحمة الله — فالرحمة تسع كل ذنب.", category: "العقيدة", source: "الزمر: 53", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "التائب من الذنب كمن لا ذنب له — التوبة تمحو ما قبلها ولا تُبقي أثراً في سجل الأعمال.", category: "العقيدة", source: "رواه ابن ماجه — حسنه الألباني", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },

  /* ── الوقت والتخطيط ── */
  { text: "نعمتان مغبون فيهما كثير من الناس: الصحة والفراغ — من عرف قدرهما ربح دنياه وآخرته.", category: "الحديث", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "اغتنم خمساً قبل خمس: شبابك قبل هرمك، وصحتك قبل سقمك، وغناك قبل فقرك، وفراغك قبل شغلك، وحياتك قبل موتك.", category: "الحديث", source: "رواه الحاكم في المستدرك (٧٨٤٦) عن ابن عباس وصححه على شرط الشيخين، والبيهقي في شعب الإيمان — صححه الألباني في صحيح الجامع وصحيح الترغيب", author_name: "المستدرك", status: "approved", verification_status: "verified" },

  /* ── ذكر الله وتلاوة القرآن ── */
  { text: "ألا بذكر الله تطمئن القلوب — الذكر دواء القلوب وغذاؤها وقوتها في كل وقت.", category: "العقيدة", source: "الرعد: 28", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الذاكرون الله كثيراً والذاكرات أعد الله لهم مغفرة وأجراً عظيماً — فأكثر من الذكر في كل حال.", category: "الحديث", source: "الأحزاب: 35", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },

  /* ── الذكر والدعاء (تعميق 2026-07-19: كانت أشح تصنيفات الفوائد بـ4
     عناصر فقط بعد إصلاح فجوة التصنيفات اليتيمة أعلاه) ── */
  { text: "دعاء ذي النون في بطن الحوت: «لا إله إلا أنت سبحانك إني كنت من الظالمين» — استجاب الله له فنجّاه من الغمّ، وهي من أعظم أدعية الكرب.", category: "الذكر والدعاء", source: "الأنبياء: 87", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الأمر بذكر الله ذكراً كثيراً والتسبيح بكرة وأصيلاً — لا يقتصر الذكر على وقت دون آخر بل يلازم المؤمن في كل أحواله.", category: "الذكر والدعاء", source: "الأحزاب: 41-42", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "«فاذكروني أذكركم» — وعد إلهي مباشر: من ذكر الله في نفسه ذكره الله، ومن ذكره في ملأ ذكره الله في ملأ خير منه.", category: "الذكر والدعاء", source: "البقرة: 152", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "«ادعوني أستجب لكم» — أمر إلهي بالدعاء مقروناً بوعد الإجابة، والاستكبار عن الدعاء استكبار عن العبادة نفسها.", category: "الذكر والدعاء", source: "غافر: 60", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
];

export const FAWAID_CURATED_SEED: FawaidCuratedItem[] = curated.map((item, i) => ({
  ...item,
  id: `fawaid-curated-${String(i + 1).padStart(3, "0")}`,
}));

export function filterCuratedFawaid(items: FawaidCuratedItem[]): FawaidCuratedItem[] {
  return items.filter((f) => f.verification_status === "verified" || f.verification_status === "needs_review");
}
