import { SEED_FAWAID } from "./fawaid-seed";
import { filterQualityFawaid } from "./content-quality";
import { ADHKAR_ITEMS } from "./adhkar-seed";
import { ARBAEEN_NAWAWI } from "./arbaeen-nawawi-seed";

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
  ...ARBAEEN_NAWAWI.map((h) => ({
    id: `nawawi-${h.id}`,
    text: h.text,
    narrator: h.title,
    source: h.source,
    meaning: h.benefits,
  })),
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
  {
    id: "da-8",
    text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    surah: "سورة الطلاق",
    ayahNumber: 3,
    reference: "القرآن الكريم — 65:3",
    meaning: "من أسلم أمره لله كفاه الله جميع شؤونه.",
  },
  {
    id: "da-9",
    text: "يُرِيدُ اللَّهُ بِكُمُ الْيُسْرَ وَلَا يُرِيدُ بِكُمُ الْعُسْرَ",
    surah: "سورة البقرة",
    ayahNumber: 185,
    reference: "القرآن الكريم — 2:185",
    meaning: "شريعة الإسلام قائمة على التيسير ورفع الحرج.",
  },
  {
    id: "da-10",
    text: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
    surah: "سورة الضحى",
    ayahNumber: 5,
    reference: "القرآن الكريم — 93:5",
    meaning: "وعد رباني بالعطاء الوافر لمن صبر ورضي.",
  },
  {
    id: "da-11",
    text: "إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ",
    surah: "سورة الرعد",
    ayahNumber: 11,
    reference: "القرآن الكريم — 13:11",
    meaning: "التغيير الحقيقي يبدأ من الداخل بإصلاح النفس.",
  },
  {
    id: "da-12",
    text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    surah: "سورة الرعد",
    ayahNumber: 28,
    reference: "القرآن الكريم — 13:28",
    meaning: "الطمأنينة الحقيقية في ذكر الله وليس في الدنيا.",
  },
  {
    id: "da-13",
    text: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
    surah: "سورة الذاريات",
    ayahNumber: 56,
    reference: "القرآن الكريم — 51:56",
    meaning: "غاية الوجود هي العبادة لله وحده.",
  },
  {
    id: "da-14",
    text: "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",
    surah: "سورة ق",
    ayahNumber: 16,
    reference: "القرآن الكريم — 50:16",
    meaning: "الله أقرب إلى الإنسان من حبل وريده، فليستحِِ منه.",
  },
  {
    id: "da-15",
    text: "هُوَ الأَوَّلُ وَالآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ",
    surah: "سورة الحديد",
    ayahNumber: 3,
    reference: "القرآن الكريم — 57:3",
    meaning: "أسماء الله الأربعة تدل على إحاطته بكل الوجود.",
  },
  {
    id: "da-16",
    text: "كُنتُمْ خَيْرَ أُمَّةٍ أُخْرِجَتْ لِلنَّاسِ تَأْمُرُونَ بِالْمَعْرُوفِ وَتَنْهَوْنَ عَنِ الْمُنكَرِ",
    surah: "سورة آل عمران",
    ayahNumber: 110,
    reference: "القرآن الكريم — 3:110",
    meaning: "شرف الأمة الإسلامية مرتبط بالأمر بالمعروف والنهي عن المنكر.",
  },
  {
    id: "da-17",
    text: "وَشَاوِرْهُمْ فِي الْأَمْرِ فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ",
    surah: "سورة آل عمران",
    ayahNumber: 159,
    reference: "القرآن الكريم — 3:159",
    meaning: "المشاورة أدب إسلامي عظيم، ثم التوكل على الله عند العزم.",
  },
  {
    id: "da-18",
    text: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
    surah: "سورة النساء",
    ayahNumber: 103,
    reference: "القرآن الكريم — 4:103",
    meaning: "الصلاة فريضة موقّتة بأوقات محددة لا تُؤخّر.",
  },
  {
    id: "da-19",
    text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    surah: "سورة البقرة",
    ayahNumber: 153,
    reference: "القرآن الكريم — 2:153",
    meaning: "الصبر والصلاة سلاح المؤمن في مواجهة الشدائد.",
  },
  {
    id: "da-20",
    text: "وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا",
    surah: "سورة العنكبوت",
    ayahNumber: 69,
    reference: "القرآن الكريم — 29:69",
    meaning: "من بذل الجهد في طلب الحق هداه الله إلى الطريق المستقيم.",
  },
  {
    id: "da-21",
    text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    surah: "سورة الشرح",
    ayahNumber: 5,
    reference: "القرآن الكريم — 94:5-6",
    meaning: "تكرار البشرى يدل على تأكيد اليُسر بعد العُسر.",
  },
  {
    id: "da-22",
    text: "فَاصْبِرْ صَبْرًا جَمِيلًا",
    surah: "سورة المعارج",
    ayahNumber: 5,
    reference: "القرآن الكريم — 70:5",
    meaning: "الصبر الجميل هو الصبر بلا شكوى ولا تسخّط.",
  },
  {
    id: "da-23",
    text: "وَبَشِّرِ الصَّابِرِينَ الَّذِينَ إِذَا أَصَابَتْهُم مُّصِيبَةٌ قَالُوا إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ",
    surah: "سورة البقرة",
    ayahNumber: 155,
    reference: "القرآن الكريم — 2:155-156",
    meaning: "الاسترجاع عند المصيبة دليل الصبر والرضا بقضاء الله.",
  },
  {
    id: "da-24",
    text: "وَأَنَّ اللَّهَ هُوَ التَّوَّابُ الرَّحِيمُ",
    surah: "سورة التوبة",
    ayahNumber: 104,
    reference: "القرآن الكريم — 9:104",
    meaning: "الله يقبل التوبة ويرحم عباده التائبين.",
  },
  {
    id: "da-25",
    text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    surah: "سورة البقرة",
    ayahNumber: 201,
    reference: "القرآن الكريم — 2:201",
    meaning: "من أجمع الأدعية القرآنية التي تجمع خيري الدنيا والآخرة.",
  },
  {
    id: "da-26",
    text: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    surah: "سورة القمر",
    ayahNumber: 17,
    reference: "القرآن الكريم — 54:17",
    meaning: "القرآن ميسّر للحفظ والفهم، فمن يقبل على تعلّمه؟",
  },
  {
    id: "da-27",
    text: "إِنَّ اللَّهَ يُحِبُّ الْمُتَوَكِّلِينَ",
    surah: "سورة آل عمران",
    ayahNumber: 159,
    reference: "القرآن الكريم — 3:159",
    meaning: "التوكل على الله من أسباب محبة الله للعبد.",
  },
  {
    id: "da-28",
    text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    surah: "سورة الطلاق",
    ayahNumber: 2,
    reference: "القرآن الكريم — 65:2-3",
    meaning: "التقوى مفتاح الفرج والرزق من حيث لا يُتوقع.",
  },
  {
    id: "da-29",
    text: "وَاللَّهُ خَيْرُ الرَّازِقِينَ",
    surah: "سورة الجمعة",
    ayahNumber: 11,
    reference: "القرآن الكريم — 62:11",
    meaning: "الله وحده هو الرازق الحقيقي على الإطلاق.",
  },
  {
    id: "da-30",
    text: "وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
    surah: "سورة العصر",
    ayahNumber: 1,
    reference: "القرآن الكريم — 103:1-3",
    meaning: "أربعة شروط للنجاة: الإيمان، العمل الصالح، التواصي بالحق، التواصي بالصبر.",
  },
];

const curatedFawaid = filterQualityFawaid(
  SEED_FAWAID.filter(
    (f) => f.source === "القرآن الكريم" || f.author_name === "المجلس العلمي",
  ),
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

export type DailyDhikrEntry = {
  id: string;
  text: string;
  category?: string;
  source?: string;
};

export function getDailyHadith(date = new Date()) {
  return pickDailyItem(DAILY_HADITH_POOL, date);
}

export function getDailyAyah(date = new Date()) {
  return pickDailyItem(DAILY_AYAH_POOL, date);
}

export function getDailyFaida(date = new Date()) {
  return pickDailyItem(DAILY_FAIDA_POOL, date);
}

export function getDailyDhikr(date = new Date()): DailyDhikrEntry {
  const pool = ADHKAR_ITEMS.filter((item) => item.categoryId === "adh-morning" || item.categoryId === "adh-evening");
  const item = pickDailyItem(pool.length > 0 ? pool : ADHKAR_ITEMS, date);
  return {
    id: item.id,
    text: item.text,
    category: item.categoryId === "adh-morning" ? "أذكار الصباح" : "أذكار المساء",
    source: item.source,
  };
}

export function getDailyQa<T extends { id?: string }>(items: T[], date = new Date()): T {
  return pickDailyItem(items, date);
}
