export type QuranRadio = {
  id: string;
  name: string;
  streamUrl: string;
  quality: string;
  reciter?: string;
};

export const QURAN_RADIO_STATIONS: QuranRadio[] = [
  {
    id: "quran-radio-kw",
    name: "إذاعة القرآن الكريم — الكويت",
    streamUrl: "https://stream.radiojar.com/8s5u5tadnceuv",
    quality: "128 kbps",
  },
  {
    id: "mp3quran-main",
    name: "مكتبة mp3quran — بث عام",
    streamUrl: "https://backup.qurango.net/radio/ahmad_alnufais",
    quality: "64 kbps",
    reciter: "أحمد النفيس",
  },
  {
    id: "quran-radio-sa",
    name: "إذاعة القرآن الكريم — السعودية",
    streamUrl: "https://stream.radiojar.com/4wqre23fku0uv",
    quality: "128 kbps",
  },
];

export type SurahMeta = {
  number: number;
  name: string;
  englishName: string;
  ayahs: number;
};

const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس",
];

const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

export function getSurahList(): SurahMeta[] {
  return SURAH_NAMES.map((name, i) => ({
    number: i + 1,
    name,
    englishName: `Surah ${i + 1}`,
    ayahs: SURAH_AYAH_COUNTS[i] || 0,
  }));
}

export async function fetchSurahAyahs(surahNumber: number) {
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("تعذر تحميل السورة");
  const json = await response.json();
  return json.data.ayahs as { numberInSurah: number; text: string }[];
}

export function getQuranAudioUrl(surah: number, reciter = "ar.alafasy") {
  return `https://cdn.islamic.network/quran/audio/128/${reciter}/${surah}.mp3`;
}

const WIRD_KEY = "majalis-daily-wird-v1";

export type DailyWirdState = {
  pagesPerDay: number;
  currentSurah: number;
  currentAyah: number;
  completedToday: number;
  lastDate: string;
  monthlyTotal: number;
};

export function getDailyWirdState(): DailyWirdState {
  try {
    const raw = localStorage.getItem(WIRD_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    pagesPerDay: 2,
    currentSurah: 1,
    currentAyah: 1,
    completedToday: 0,
    lastDate: "",
    monthlyTotal: 0,
  };
}

export function saveDailyWirdState(state: DailyWirdState) {
  try {
    localStorage.setItem(WIRD_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getLastQuranPosition() {
  try {
    return JSON.parse(localStorage.getItem("majalis-quran-position-v1") || "null");
  } catch {
    return null;
  }
}

export function saveQuranPosition(surah: number, ayah: number) {
  try {
    localStorage.setItem("majalis-quran-position-v1", JSON.stringify({ surah, ayah, at: Date.now() }));
  } catch {
    /* ignore */
  }
}
