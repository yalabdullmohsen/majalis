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
];

export const FAWAID_CURATED_SEED: FawaidCuratedItem[] = curated.map((item, i) => ({
  ...item,
  id: `fawaid-curated-${String(i + 1).padStart(3, "0")}`,
}));

export function filterCuratedFawaid(items: FawaidCuratedItem[]): FawaidCuratedItem[] {
  return items.filter((f) => f.verification_status === "verified" || f.verification_status === "needs_review");
}
