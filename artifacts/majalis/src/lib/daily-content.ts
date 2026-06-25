import { DAILY_AYAH, DAILY_HADITH, type DailyAyah, type DailyHadith } from "./home-content";
import { SEED_FAWAID } from "./fawaid-seed";

const HADITH_POOL: DailyHadith[] = [
  DAILY_HADITH,
  {
    text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    narrator: "عمر بن الخطاب رضي الله عنه",
    source: "متفق عليه",
    meaning: "العمل يقبل ويُرد بحسب النية الصادقة.",
  },
  {
    text: "الدِّينُ النَّصِيحَةُ",
    narrator: "تميم الداري رضي الله عنه",
    source: "رواه مسلم",
    meaning: "الدين كله نصح لله ولرسوله ولأئمة المسلمين وعامتهم.",
  },
  {
    text: "لا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    narrator: "أنس بن مالك رضي الله عنه",
    source: "متفق عليه",
    meaning: "كمال الإيمان يتجلى في المحبة والإخلاص للمسلمين.",
  },
];

const AYAH_POOL: DailyAyah[] = [
  DAILY_AYAH,
  {
    text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
    surah: "سورة الطلاق",
    ayahNumber: 2,
    meaning: "من اتقى الله يسّر له أموره وفرج كربه.",
  },
  {
    text: "فَاذْكُرُونِي أَذْكُرْكُمْ",
    surah: "سورة البقرة",
    ayahNumber: 152,
    meaning: "ذكر الله سبب لذكره لعبده ونصره وتيسير أمره.",
  },
  {
    text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    surah: "سورة طه",
    ayahNumber: 114,
    meaning: "طلب العلم من أعظم الدعوات وأجلّها أجرًا.",
  },
];

function dayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function getDailyHadith(): DailyHadith {
  return HADITH_POOL[dayIndex() % HADITH_POOL.length];
}

export function getDailyAyah(): DailyAyah {
  return AYAH_POOL[dayIndex() % AYAH_POOL.length];
}

export function getDailyFaid() {
  if (!SEED_FAWAID.length) return null;
  return SEED_FAWAID[dayIndex() % SEED_FAWAID.length];
}

export function getRandomFaid() {
  if (!SEED_FAWAID.length) return null;
  const idx = Math.floor(Math.random() * SEED_FAWAID.length);
  return SEED_FAWAID[idx];
}
