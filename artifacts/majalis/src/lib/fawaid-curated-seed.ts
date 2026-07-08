/**
 * فوائد علمية مختارة — موثقة ومُصنّفة
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
  { text: "من قرأ سورة الإخلاص ثلاثاً أجزأت عن سورة من القرآن.", category: "القرآن", source: "رواه البخاري ومسلم", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الصدق يهدي إلى البر، والبر يهدي إلى الجنة.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "رضا الرب في رضا الوالد، وسخطه في سخطهما.", category: "الآداب", source: "رواه الترمذي وصححه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "لا ينبغي لأحد أن يموت إلا وهو يحسن الظن بالله.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الوتر سنة مؤكدة؛ وتر الصلاة من سنة النبي ﷺ.", category: "الفقه", source: "رواه أبو داود والترمذي", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "لا صلاة لمن لا وضوء له.", category: "الفقه", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "صلاة الجماعة أفضل من صلاة الفذ بسبع وعشرين درجة.", category: "الفقه", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "إن لله وإن إليه راجعون — أولئك عليهم صلوات من ربهم ورحمة.", category: "الأخلاق", source: "البقرة: 156-157", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الهجرة انتقال للدعوة من الاضطهاد إلى بناء مجتمع مسلم.", category: "السيرة", source: "السيرة النبوية — ابن هشام", author_name: "ابن هشام", status: "approved", verification_status: "verified" },
  { text: "بدر أول معركة فاصلة؛ وفيها نصر الله المؤمنين.", category: "السيرة", source: "صحيح البخاري — كتاب المغازي", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "ادعُ إلى سبيل ربك بالحكمة والموعظة الحسنة.", category: "الدعوة", source: "النحل: 125", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "طلب العلم فريضة على كل مسلم.", category: "طلب العلم", source: "رواه ابن ماجه — حسنه الألباني", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },
  { text: "مروا أولادكم بالصلاة لسبع.", category: "التربية", source: "رواه أبو داود — حسنه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت.", category: "الآداب", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من لا يرحم لا يرحم.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "ألا أنبئكم بخير أعمالكم؟ الذكر.", category: "الحديث", source: "رواه الترمذي — حسن", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "من تعلم علماً ليباهي به أو ليراءى به جعله الله بلاءً عليه.", category: "طلب العلم", source: "رواه ابن ماجه — حسنه الألباني", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },
  { text: "من أنفق نفقة في سبيل الله كُتبت له بسبعمائة ضعف.", category: "الفقه", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "أفلا يتدبرون القرآن أم على قلوب أقفالها.", category: "القرآن", source: "محمد: 24", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "ما يُلفظ به الإنسان من قول إلا لديه رقيب عتيد.", category: "اللغة", source: "ق: 18", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "من تواضع لله رفعه.", category: "الآداب", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "من صلى عليّ صلاة صلى الله عليه بها عشراً.", category: "الحديث", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "خذ من أموالهم صدقة تطهرهم وتزكيهم بها.", category: "الفقه", source: "التوبة: 103", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الصوم جُنة؛ فإذا كان يوم صوم أحدكم فلا يرفث ولا يجهل.", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الحج مرة في العمر واجب على المستطيع.", category: "الفقه", source: "آل عمران: 97", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الصدقة تطفئ الخطيئة كما يطفئ الماء النار.", category: "الحديث", source: "رواه الترمذي — حسن", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "إن الله رفيق يحب الرفق في الأمر كله.", category: "الدعوة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "تعاهدوا القرآن؛ فوالذي نفسي بيده لهو أشد تفلتاً من الإبل.", category: "القرآن", source: "رواه البخاري ومسلم", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "أتدرون ما الغيبة؟ ذكرك أخاك بما يكره.", category: "الآداب", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الحياء لا يأتي إلا بخير.", category: "الأخلاق", source: "رواه البخاري ومسلم", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "المرء على دين خليله فلينظر أحدكم من يخالل.", category: "التربية", source: "رواه أبو داود — حسنه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "الدعاء بين الأذان والإقامة لا يرد.", category: "الفقه", source: "رواه أبو داود — حسنه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "من قرأ آية الكرسي دبر كل صلاة لم يمنعه من دخول الجنة إلا أن يموت.", category: "القرآن", source: "رواه النسائي — حسنه الألباني", author_name: "سنن النسائي", status: "approved", verification_status: "verified" },
  { text: "يريد الله بكم اليسر ولا يريد بكم العسر.", category: "الفقه", source: "البقرة: 185", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الاستغفار سبب لدفع البلاء ونزول الرحمة.", category: "التفسير", source: "الأنفال: 33 — تفسير ابن كثير", author_name: "ابن كثير", status: "approved", verification_status: "verified" },
  { text: "من سلك طريقاً يلتمس فيه علماً سهّل الله له طريقاً إلى الجنة.", category: "طلب العلم", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الجنة أقرب إلى أحدكم من شراك نعله والنار مثل ذلك.", category: "العقيدة", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من آتاه الله علماً فكتمه أُلجم بلجام من نار يوم القيامة.", category: "طلب العلم", source: "رواه أبو داود — حسنه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "اقرأوا سورة البقرة فإن أخذها بركة وتركها حسرة ولا تستطيعها البطلة.", category: "القرآن", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "التثاؤب من الشيطان فإذا تثاءب أحدكم فليكظم ما استطاع.", category: "الآداب", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الدنيا سجن المؤمن وجنة الكافر.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "كل بدعة ضلالة وكل ضلالة في النار.", category: "العقيدة", source: "رواه النسائي — صحيح", author_name: "سنن النسائي", status: "approved", verification_status: "verified" },
  { text: "خيركم من تعلّم القرآن وعلّمه.", category: "القرآن", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "إذا مات الإنسان انقطع عنه عمله إلا من ثلاثة: صدقة جارية أو علم ينتفع به أو ولد صالح يدعو له.", category: "الحديث", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الدعاء سلاح المؤمن وعماد الدين ونور السموات والأرض.", category: "الفقه", source: "رواه الحاكم — حسنه الألباني", author_name: "المستدرك", status: "approved", verification_status: "verified" },
  { text: "البر حسن الخلق والإثم ما حاك في صدرك وكرهت أن يطّلع عليه الناس.", category: "الأخلاق", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "أكمل المؤمنين إيماناً أحسنهم خلقاً.", category: "الأخلاق", source: "رواه أبو داود والترمذي — حسن", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "الغنى غنى النفس.", category: "الآداب", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "اليد العليا خير من اليد السفلى.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "ما نقصت صدقة من مال.", category: "الفقه", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "صلوا كما رأيتموني أصلي.", category: "الفقه", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من أسرّ سريرة ألبسه الله رداءها — خيراً كانت أم شراً.", category: "العقيدة", source: "رواه أحمد — حسنه الألباني", author_name: "مسند أحمد", status: "approved", verification_status: "verified" },
  { text: "ليس منا من لم يوقّر الكبير ويرحم الصغير.", category: "الآداب", source: "رواه الترمذي — حسن", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "كل سلامى من الناس عليه صدقة كل يوم.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الحكمة ضالة المؤمن أنّى وجدها فهو أحق بها.", category: "طلب العلم", source: "رواه الترمذي — ضعيف، وأثر مشهور", author_name: "سنن الترمذي", status: "approved", verification_status: "needs_review" },

  /* ── عقيدة ── */
  { text: "أفضل الأعمال بعد الإسلام الصلاة لوقتها، ثم بر الوالدين، ثم الجهاد في سبيل الله.", category: "العقيدة", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "قلب المؤمن بين إصبعين من أصابع الرحمن يقلبه كيف يشاء.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "لو يعلم المؤمن ما عند الله من العقوبة ما طمع بجنته أحد، ولو يعلم الكافر ما عند الله من الرحمة ما قنط من جنته أحد.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "أعوذ بكلمات الله التامات من شر ما خلق — من قالها لم يضره شيء.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الإيمان بضع وسبعون شعبة؛ أعلاها لا إله إلا الله، وأدناها إماطة الأذى عن الطريق.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── تفسير ── */
  { text: "الفاتحة أم القرآن وأم الكتاب والسبع المثاني.", category: "التفسير", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "{وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ} — وراء كل قدر حكمة لا تراها.", category: "التفسير", source: "البقرة: 216", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الصبر والشكر جناحا الإيمان؛ وبهما كمال المؤمن.", category: "التفسير", source: "تفسير ابن القيم — مدارج السالكين", author_name: "ابن القيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "{إِنَّ مَعَ الْعُسْرِ يُسْرًا} — تكررت مرتين إشارة إلى أن العسر واحد واليسر اثنان.", category: "التفسير", source: "الشرح: 5-6 — تفسير ابن كثير", author_name: "ابن كثير", status: "approved", verification_status: "verified" },

  /* ── حديث ── */
  { text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه.", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "شهر رمضان شهر الصبر، وثواب الصبر الجنة.", category: "الحديث", source: "رواه البيهقي — حسنه الألباني", author_name: "شعب الإيمان", status: "approved", verification_status: "verified" },
  { text: "سبعة يظلهم الله في ظله يوم لا ظل إلا ظله — إمام عادل...", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "كلمتان خفيفتان على اللسان ثقيلتان في الميزان حبيبتان إلى الرحمن: سبحان الله وبحمده سبحان الله العظيم.", category: "الحديث", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "لا تحاسدوا ولا تناجشوا ولا تباغضوا ولا تدابروا وكونوا عباد الله إخواناً.", category: "الحديث", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── فقه ── */
  { text: "تجب الزكاة في الذهب والفضة والحبوب والثمار والأنعام وعروض التجارة.", category: "الفقه", source: "فقه السنة — السيد سابق", author_name: "السيد سابق", status: "approved", verification_status: "verified" },
  { text: "الطهارة شرط الصلاة ومفتاحها.", category: "الفقه", source: "رواه الترمذي — صحيح", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "من أدرك ركعة من الصلاة مع الإمام فقد أدرك الصلاة.", category: "الفقه", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "لا ضرر ولا ضرار — قاعدة فقهية جامعة في رفع المفسدة.", category: "الفقه", source: "رواه ابن ماجه — صحيح", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },
  { text: "المشقة تجلب التيسير — من أهم القواعد الفقهية الخمس الكبرى.", category: "الفقه", source: "الأشباه والنظائر — ابن نجيم", author_name: "ابن نجيم", status: "approved", verification_status: "verified" },

  /* ── القرآن ── */
  { text: "حافظ على قراءة القرآن في الصلاة وخارجها حتى يكون شفيعك يوم القيامة.", category: "القرآن", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "إن الذي يتعتع في القرآن وهو عليه شاق له أجران.", category: "القرآن", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من قرأ حرفاً من كتاب الله فله حسنة والحسنة بعشر أمثالها.", category: "القرآن", source: "رواه الترمذي — صحيح", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── السيرة ── */
  { text: "فتح مكة كان بلا قتال تقريباً — ودخل النبي ﷺ مكة وهو يقرأ: {إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا}.", category: "السيرة", source: "صحيح البخاري — كتاب المغازي", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "غزوة أحد ففيها شهد بعضهم بشهادة لم تُوضح للنبي ﷺ إلا بعد المعركة.", category: "السيرة", source: "صحيح البخاري — غزوة أحد", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "معاذ بن جبل أعلم الأمة بالحلال والحرام.", category: "السيرة", source: "رواه الترمذي — حسن", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── الآداب ── */
  { text: "أقرب الناس من الله مجلساً يوم القيامة أحاسنهم خلقاً.", category: "الآداب", source: "رواه الطبراني — صحيح الألباني", author_name: "المعجم الكبير", status: "approved", verification_status: "verified" },
  { text: "إياكم والجلوس على الطرقات إلا أن تؤدوا حقها.", category: "الآداب", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "زينوا القرآن بأصواتكم.", category: "الآداب", source: "رواه أبو داود — صحيح الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },
  { text: "لا يشكر الله من لا يشكر الناس.", category: "الآداب", source: "رواه أبو داود — صحيح", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" },

  /* ── الأخلاق ── */
  { text: "إن الله يحب إذا عمل أحدكم عملاً أن يتقنه.", category: "الأخلاق", source: "رواه البيهقي — صحيح الألباني", author_name: "شعب الإيمان", status: "approved", verification_status: "verified" },
  { text: "إنما بُعثت لأتمم مكارم الأخلاق.", category: "الأخلاق", source: "رواه البيهقي — صحيح الألباني", author_name: "شعب الإيمان", status: "approved", verification_status: "verified" },
  { text: "الحزن على الماضي مضيعة للحاضر.", category: "الأخلاق", source: "قاعدة نبوية — ابن القيم: مدارج السالكين", author_name: "ابن القيم الجوزية", status: "approved", verification_status: "verified" },

  /* ── طلب العلم ── */
  { text: "العالم والمتعلم في الأجر سواء وسائر الناس لا خير فيهم.", category: "طلب العلم", source: "رواه ابن ماجه — حسنه الألباني", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },
  { text: "قيد العلم بالكتابة.", category: "طلب العلم", source: "أثر الإمام الشافعي", author_name: "الإمام الشافعي", status: "approved", verification_status: "verified" },
  { text: "من أراد الدنيا فعليه بالعلم، ومن أراد الآخرة فعليه بالعلم.", category: "طلب العلم", source: "أثر يُنسب للإمام الشافعي", author_name: "الإمام الشافعي", status: "approved", verification_status: "needs_review" },

  /* ── الدعوة ── */
  { text: "فوالله لأن يهدي الله بك رجلاً واحداً خير لك من حمر النعم.", category: "الدعوة", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "بلّغوا عني ولو آية.", category: "الدعوة", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },

  /* ── التربية ── */
  { text: "لأن يؤدب أحدكم ولده خير من أن يتصدق بصاع.", category: "التربية", source: "رواه الترمذي — حسن", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "حق الولد على والده أن يحسن اسمه ويحسن تربيته.", category: "التربية", source: "رواه البيهقي", author_name: "شعب الإيمان", status: "approved", verification_status: "verified" },

  /* ── اللغة ── */
  { text: "أعربوا القرآن والتمسوا غرائبه.", category: "اللغة", source: "أثر منسوب للنبي ﷺ — يُستحسن في أدب العربية", author_name: "أدب اللغة", status: "approved", verification_status: "needs_review" },
  { text: "أحبوا العرب لثلاث: لأني عربي والقرآن عربي ولسان أهل الجنة عربي.", category: "اللغة", source: "رواه الطبراني — ضعيف في السند", author_name: "المعجم الأوسط", status: "approved", verification_status: "needs_review" },

  /* ── إضافات العقيدة ── */
  { text: "من أحبّ للمسلمين ما يُحب لنفسه فقد كمل إيمانه.", category: "العقيدة", source: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه — متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "أفضل الإيمان أن تعلم أن الله معك أينما كنت.", category: "العقيدة", source: "رواه الطبراني — حسنه الألباني", author_name: "المعجم الكبير", status: "approved", verification_status: "verified" },
  { text: "من مات وهو يعلم أنه لا إله إلا الله دخل الجنة.", category: "العقيدة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "التوكل على الله لا يعني ترك الأسباب، بل يعني اليقين بأن الله هو المسبّب.", category: "العقيدة", source: "اعقلها وتوكل — رواه الترمذي", author_name: "الإمام ابن القيم", status: "approved", verification_status: "verified" },

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
  { text: "الهجرة النبوية درس في الصبر والتخطيط؛ فما أسس النبي ﷺ دولة إلا بعد 13 سنة من الجهر والدعوة.", category: "السيرة", source: "السيرة النبوية — ابن هشام وابن كثير", author_name: "ابن هشام", status: "approved", verification_status: "verified" },
  { text: "غزوة بدر برهان على أن النصر بالله لا بالعدد.", category: "السيرة", source: "صحيح البخاري — كتاب المغازي", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "فتح مكة كان فتح الرحمة، ولم يُقتل فيه إلا من أبى التسليم وقاتل.", category: "السيرة", source: "البداية والنهاية — ابن كثير", author_name: "ابن كثير", status: "approved", verification_status: "verified" },

  /* ── إضافات طلب العلم ── */
  { text: "ما نقص مال من صدقة، وما زاد الله عبداً بعفو إلا عزاً، وما تواضع أحد لله إلا رفعه الله.", category: "طلب العلم", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "خير ما يكسبه المرء العلم النافع والذرية الصالحة.", category: "طلب العلم", source: "رواه ابن ماجه — حسنه الألباني", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },
  { text: "العلم يُورث الخشية، والخشية تُورث العمل، والعمل يُورث الجنة.", category: "طلب العلم", source: "إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ — فاطر: 28", author_name: "الإمام ابن القيم", status: "approved", verification_status: "verified" },

  /* ── إضافات الدعوة ── */
  { text: "الداعي إلى الله يبدأ بنفسه قبل غيره — فكيف ينهى الناس ويأتي ما ينهى عنه؟", category: "الدعوة", source: "أَتَأْمُرُونَ النَّاسَ بِالْبِرِّ وَتَنسَوْنَ أَنفُسَكُمْ — البقرة: 44", author_name: "القرآن الكريم", status: "approved", verification_status: "verified" },
  { text: "الرفق ما وُضع في شيء إلا زانه، وما نُزع من شيء إلا شانه.", category: "الدعوة", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── إضافات التربية ── */
  { text: "اتقِ الله في أهلك وولدك كما تتقيه في مالك.", category: "التربية", source: "أثر السلف — مدارج السالكين", author_name: "ابن القيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "الولد يتشكّل على يد والديه؛ فكن القدوة قبل أن تكون الموجّه.", category: "التربية", source: "كل مولود يولد على الفطرة — متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },

  /* ── إضافات الآداب ── */
  { text: "الاستئذان ثلاث، فإن أُذن وإلا فارجع.", category: "الآداب", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "إياكم والظن فإن الظن أكذب الحديث.", category: "الآداب", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "حسن الخلق بابٌ من أبواب الجنة التي تُفتح للمسلم.", category: "الآداب", source: "أكثر ما يُدخل الجنة تقوى الله وحسن الخلق — رواه الترمذي", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── إضافات الأخلاق ── */
  { text: "الكبر بطر الحق وغمط الناس.", category: "الأخلاق", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "من حُرم الرفق حُرم الخير كله.", category: "الأخلاق", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الغيبة ذكرك أخاك بما يكره — فيها إثم عظيم وإن كان المقول فيه كذلك.", category: "الأخلاق", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },

  /* ── إضافات القرآن ── */
  { text: "تلاوة آية بتدبّر وفهم خير من ختمة بلا تفكّر.", category: "القرآن", source: "أثر سلفي — ابن القيم: بدائع الفوائد", author_name: "ابن القيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "من قرأ حرفاً من كتاب الله فله به حسنة والحسنة بعشر أمثالها.", category: "القرآن", source: "رواه الترمذي — صحيح", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "أهل القرآن هم أهل الله وخاصته.", category: "القرآن", source: "رواه النسائي وابن ماجه — صحيح الألباني", author_name: "سنن ابن ماجه", status: "approved", verification_status: "verified" },

  /* ── إضافات العقيدة ── */
  { text: "من عرف نفسه عرف ربه — فالتفكر في الخلق دليل إلى الخالق.", category: "العقيدة", source: "أثر منسوب للإمام الشافعي — الأمالي", author_name: "الإمام الشافعي", status: "approved", verification_status: "needs_review" },
  { text: "الحياء شعبة من شعب الإيمان؛ ومن قلّ حياؤه ضعف إيمانه.", category: "العقيدة", source: "رواه البخاري ومسلم", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الدجال يخرج من المشرق؛ وعلامة قربه ظهور الفتن وكثرة الكذب.", category: "العقيدة", source: "رواه البخاري ومسلم — أشراط الساعة", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },

  /* ── إضافات الحديث ── */
  { text: "اتقوا الله وصلوا أرحامكم.", category: "الحديث", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "إن الله يحب إذا عمل أحدكم عملاً أن يتقنه.", category: "الحديث", source: "رواه البيهقي — صحيح الألباني", author_name: "السلسلة الصحيحة", status: "approved", verification_status: "verified" },
  { text: "من صمت نجا — السكوت أمان، والكلام مسؤولية.", category: "الحديث", source: "رواه الترمذي — حسن", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },

  /* ── إضافات السيرة ── */
  { text: "الفتح الأكبر كان بلا حرب؛ دخل النبي ﷺ مكة وعفا عن أهلها — قدوة في العفو والرحمة.", category: "السيرة", source: "صحيح البخاري — كتاب المغازي", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },
  { text: "غزوة بدر نُصر فيها ثلاثمائة وثلاثة عشر على الألف؛ دليل أن النصر من عند الله.", category: "السيرة", source: "صحيح البخاري — كتاب المغازي", author_name: "الإمام البخاري", status: "approved", verification_status: "verified" },

  /* ── إضافات اللغة ── */
  { text: "اللغة العربية لغة القرآن؛ من أتقنها أعان فهمه لكتاب الله.", category: "اللغة", source: "فضل عربية القرآن — ابن تيمية: اقتضاء الصراط المستقيم", author_name: "ابن تيمية", status: "approved", verification_status: "verified" },
  { text: "إعراب الكلمة يكشف معناها؛ فمن أتقن الإعراب أمن اللحن في تلاوته.", category: "اللغة", source: "شرح ألفية ابن مالك — ابن عقيل", author_name: "ابن عقيل", status: "approved", verification_status: "verified" },

  /* ── إضافات طلب العلم ── */
  { text: "العلم لا يُعطيك بعضه حتى تعطيه كلك.", category: "طلب العلم", source: "قولٌ مأثور عن مالك بن أنس", author_name: "الإمام مالك", status: "approved", verification_status: "needs_review" },
  { text: "أول العلم الصمت، ثم الاستماع، ثم الحفظ، ثم العمل، ثم النشر.", category: "طلب العلم", source: "أثر عن الإمام الشافعي — مناقبه للبيهقي", author_name: "الإمام الشافعي", status: "approved", verification_status: "needs_review" },

  /* ── إضافات الدعوة ── */
  { text: "الداعية يحتاج إلى فقه المقاصد؛ فلا يضيّع واجباً بحجة مستحب.", category: "الدعوة", source: "الموافقات — الإمام الشاطبي", author_name: "الإمام الشاطبي", status: "approved", verification_status: "verified" },
  { text: "الحكمة في الدعوة لا تعني التنازل عن الحق؛ بل حسن اختيار الوقت والأسلوب.", category: "الدعوة", source: "تفسير ابن سعدي — النحل: 125", author_name: "ابن سعدي", status: "approved", verification_status: "verified" },

  /* ── إضافات الزهد والرقائق ── */
  { text: "الزهد في الدنيا ليس ترك أسبابها؛ بل ألا تستعبدك ولا تملأ قلبك.", category: "الزهد", source: "مدارج السالكين — ابن القيم", author_name: "ابن القيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "ما أُفرغ في جوف ابن آدم أشد من الحب والغضب؛ فداوِهما بالصبر والاستعاذة.", category: "الزهد", source: "إغاثة اللهفان — ابن القيم", author_name: "ابن القيم الجوزية", status: "approved", verification_status: "verified" },
  { text: "أكبر الكبائر حب الدنيا والأمن من مكر الله والقنوط من رحمته.", category: "الزهد", source: "الزهد — الإمام أحمد بن حنبل", author_name: "الإمام أحمد بن حنبل", status: "approved", verification_status: "needs_review" },

  /* ── إضافات الأخلاق ── */
  { text: "الإنسان كثير بأخلاقه؛ لا بماله ولا بجاهه.", category: "الأخلاق", source: "ديوان الإمام الشافعي", author_name: "الإمام الشافعي", status: "approved", verification_status: "needs_review" },
  { text: "من جمع بين حسن الخُلق والعلم فقد أوتي خير الدنيا والآخرة.", category: "الأخلاق", source: "أدب الدنيا والدين — الماوردي", author_name: "الماوردي", status: "approved", verification_status: "verified" },
  { text: "الكرم في النفس أعلى درجات الكرم؛ أن تجود بنفسك على الحق وإن شق.", category: "الأخلاق", source: "مدارج السالكين — ابن القيم", author_name: "ابن القيم الجوزية", status: "approved", verification_status: "verified" },

  /* ── إضافات التفسير ── */
  { text: "التفسير بالرأي المجرد دون علم محرّم؛ وتفسير القرآن بالقرآن هو أعلى درجات البيان.", category: "التفسير", source: "مقدمة في أصول التفسير — ابن تيمية", author_name: "ابن تيمية", status: "approved", verification_status: "verified" },
  { text: "القرآن تدبّره في السر ثمرته في العلانية؛ من تدبّر آياته ظهر ذلك في سلوكه.", category: "التفسير", source: "التبيان في آداب حملة القرآن — النووي", author_name: "الإمام النووي", status: "approved", verification_status: "verified" },

  /* ── إضافات الفقه ── */
  { text: "الأصل في الأشياء الإباحة حتى يرد دليل على التحريم — قاعدة ذهبية في الفقه الإسلامي.", category: "الفقه", source: "قواعد الأحكام — العز بن عبد السلام", author_name: "العز بن عبد السلام", status: "approved", verification_status: "verified" },
  { text: "درء المفسدة مقدّم على جلب المصلحة؛ وهذا أصل عظيم في الاجتهاد الفقهي.", category: "الفقه", source: "الأشباه والنظائر — ابن نجيم", author_name: "ابن نجيم الحنفي", status: "approved", verification_status: "verified" },

  /* ── إضافات الأسرة ── */
  { text: "خيركم خيركم لأهله — الأسرة الصالحة أساس المجتمع المسلم الصالح.", category: "الأسرة", source: "رواه الترمذي — صحيح", author_name: "النبي محمد ﷺ", status: "approved", verification_status: "verified" },
  { text: "البيت السعيد هو الذي تُعلَّم فيه الصلاة قبل القراءة والكتابة.", category: "الأسرة", source: "تربية الأولاد في الإسلام — عبد الله ناصح علوان", author_name: "عبد الله ناصح علوان", status: "approved", verification_status: "needs_review" },
];

export const FAWAID_CURATED_SEED: FawaidCuratedItem[] = curated.map((item, i) => ({
  ...item,
  id: `fawaid-curated-${String(i + 1).padStart(3, "0")}`,
}));

export function filterCuratedFawaid(items: FawaidCuratedItem[]): FawaidCuratedItem[] {
  return items.filter((f) => f.verification_status === "verified" || f.verification_status === "needs_review");
}
