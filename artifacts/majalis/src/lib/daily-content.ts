import { SEED_FAWAID } from "./fawaid-seed";

export type DailyHadithEntry = {
  id: string;
  text: string;
  narrator: string;
  source: string;
  grade?: string;
  meaning: string;
};

export type DailyAyahEntry = {
  id: string;
  text: string;
  surah: string;
  ayahNumber: number;
  reference: string;
  meaning: string;
};

export type DailyFaidaEntry = {
  id: string;
  text: string;
  category: string;
  source?: string;
  author_name?: string;
};

/** Deterministic day index (Asia/Kuwait) — not random */
export function getDayIndex(date = new Date()): number {
  const kuwaitDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [y, m, d] = kuwaitDate.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  return Math.floor(utc / 86_400_000);
}

export function pickDailyItem<T>(items: T[], date = new Date()): T {
  if (items.length === 0) throw new Error("empty daily pool");
  const index = getDayIndex(date) % items.length;
  return items[index];
}

export const DAILY_HADITH_POOL: DailyHadithEntry[] = [
  {
    id: "dh-1",
    text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    narrator: "عمر بن الخطاب رضي الله عنه",
    source: "متفق عليه",
    grade: "صحيح",
    meaning: "العمل يُنسب إلى النية، فليحرص المسلم على إخلاص قلبه.",
  },
  {
    id: "dh-2",
    text: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    narrator: "أبو هريرة رضي الله عنه",
    source: "متفق عليه",
    grade: "صحيح",
    meaning: "من حق الإيمان كف اللسان عن الشر والكلام النافع أو السكوت.",
  },
  {
    id: "dh-3",
    text: "لا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    narrator: "أنس بن مالك رضي الله عنه",
    source: "متفق عليه",
    grade: "صحيح",
    meaning: "كمال الإيمان يقتضي محبة الخير للمسلمين كمحبة الخير للنفس.",
  },
  {
    id: "dh-4",
    text: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    narrator: "عبد الله بن عمرو رضي الله عنهما",
    source: "متفق عليه",
    grade: "صحيح",
    meaning: "سلامة المسلمين من أذاه باللسان واليد من حقوق الإسلام.",
  },
  {
    id: "dh-5",
    text: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
    narrator: "أنس بن مالك رضي الله عنه",
    source: "رواه ابن ماجه",
    grade: "حسن",
    meaning: "طلب العلم الشرعي واجب على كل مسلم بحسب حاجته.",
  },
  {
    id: "dh-6",
    text: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ",
    narrator: "أبو ذر ومعاذ بن جبل رضي الله عنهما",
    source: "رواه الترمذي",
    grade: "حسن",
    meaning: "خلاصة الدين: تقوى الله، ومحو السيئات بالحسنات، وحسن الخلق.",
  },
  {
    id: "dh-7",
    text: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ",
    narrator: "أبو هريرة رضي الله عنه",
    source: "رواه مسلم",
    grade: "صحيح",
    meaning: "السعي في طلب العلم سبب لتيسير طريق الجنة.",
  },
];

export const DAILY_AYAH_POOL: DailyAyahEntry[] = [
  {
    id: "da-1",
    text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    surah: "سورة الشرح",
    ayahNumber: 6,
    reference: "القرآن الكريم — 94:6",
    meaning: "بعد الشدة يسر، ومع كل ضيق مخرج من الله.",
  },
  {
    id: "da-2",
    text: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ",
    surah: "سورة هود",
    ayahNumber: 88,
    reference: "القرآن الكريم — 11:88",
    meaning: "التوكل على الله أساس النجاح في الدنيا والآخرة.",
  },
  {
    id: "da-3",
    text: "وَاذْكُرُوا اللَّهَ كَثِيرًا لَعَلَّكُمْ تُفْلِحُونَ",
    surah: "سورة الأنفال",
    ayahNumber: 45,
    reference: "القرآن الكريم — 8:45",
    meaning: "كثرة ذكر الله من أسباب الفلاح.",
  },
  {
    id: "da-4",
    text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    surah: "سورة البقرة",
    ayahNumber: 153,
    reference: "القرآن الكريم — 2:153",
    meaning: "الصبر سبب لنيل معية الله ونصره.",
  },
  {
    id: "da-5",
    text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    surah: "سورة طه",
    ayahNumber: 114,
    reference: "القرآن الكريم — 20:114",
    meaning: "الدعاء بزيادة العلم من أعظم الأدعية.",
  },
  {
    id: "da-6",
    text: "فَاذْكُرُونِي أَذْكُرْكُمْ",
    surah: "سورة البقرة",
    ayahNumber: 152,
    reference: "القرآن الكريم — 2:152",
    meaning: "ذكر الله يورث ذكرًا من الله وثوابًا عظيمًا.",
  },
  {
    id: "da-7",
    text: "إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ",
    surah: "سورة آل عمران",
    ayahNumber: 190,
    reference: "القرآن الكريم — 3:190",
    meaning: "في الكون آيات تدل أصحاب العقول على عظمة الخالق.",
  },
];

const curatedFawaid = SEED_FAWAID.filter(
  (f) => f.source === "القرآن الكريم" || f.author_name === "المجلس العلمي",
).slice(0, 14);

export const DAILY_FAIDA_POOL: DailyFaidaEntry[] = [
  ...curatedFawaid.map((f) => ({
    id: f.id,
    text: f.text,
    category: f.category,
    source: f.source || undefined,
    author_name: f.author_name || undefined,
  })),
  {
    id: "df-1",
    text: "قال ﷺ: «من سلك طريقًا يلتمس فيه علمًا سهل الله له طريقًا إلى الجنة».",
    category: "فوائد حديثية",
    source: "رواه مسلم",
  },
  {
    id: "df-2",
    text: "التوحيد أول الواجبات، وهو إفراد الله بالعبادة والإقرار بربوبيته وأسمائه وصفاته.",
    category: "فوائد عقدية",
    source: "العقيدة الطحاوية",
  },
  {
    id: "df-3",
    text: "الوضوء شرط لصحة الصلاة، ومن أسباب رفع الدرجات ومحو السيئات.",
    category: "فوائد فقهية",
    source: "القرآن والسنة",
  },
  {
    id: "df-4",
    text: "حسن الخلق من أعظم ما يُقرب العبد إلى الله وإلى قلوب الناس.",
    category: "فوائد سلوكية",
    source: "السنة النبوية",
  },
  {
    id: "df-5",
    text: "الدعوة إلى الله بالحكمة والموعظة الحسنة أصل في دين الإسلام.",
    category: "فوائد دعوية",
    source: "قال تعالى: ﴿ادْعُ إِلَىٰ سَبِيلِ رَبِّكَ﴾",
  },
  {
    id: "df-6",
    text: "تربية النفس على الصبر واليقين من أهم ثمرات العلم الشرعي.",
    category: "فوائد تربوية",
    source: "المجلس العلمي",
  },
];

export function getDailyHadith(date = new Date()) {
  return pickDailyItem(DAILY_HADITH_POOL, date);
}

export function getDailyAyah(date = new Date()) {
  return pickDailyItem(DAILY_AYAH_POOL, date);
}

export function getDailyFaida(date = new Date()) {
  return pickDailyItem(DAILY_FAIDA_POOL, date);
}
