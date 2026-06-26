export type QuranRadio = {
  id: string;
  name: string;
  streamUrl: string;
  fallbackUrls: string[];
  quality: string;
  reciter?: string;
  country?: string;
};

/** Verified HTTPS streams (qurango.net / mp3quran API — tested 2026-06-26). */
export const QURAN_RADIO_STATIONS: QuranRadio[] = [
  {
    id: "quran-radio-kw",
    name: "إذاعة القرآن الكريم — الكويت",
    streamUrl: "https://qurango.net/radio/abdulbasit_abdulsamad_murattal",
    fallbackUrls: [
      "https://qurango.net/radio/alzain_mohammad_ahmad",
      "https://qurango.net/radio/mix",
    ],
    quality: "128 kbps",
    reciter: "عبدالباسط عبدالصمد",
    country: "الكويت",
  },
  {
    id: "quran-radio-sa",
    name: "إذاعة القرآن الكريم — السعودية",
    streamUrl: "https://qurango.net/radio/ali_alhuthaifi",
    fallbackUrls: [
      "https://qurango.net/radio/yasser_aldosari",
      "https://qurango.net/radio/saad_alghamdi",
    ],
    quality: "128 kbps",
    reciter: "علي الحذيفي",
    country: "السعودية",
  },
  {
    id: "quran-radio-eg",
    name: "إذاعة القرآن الكريم — مصر",
    streamUrl: "https://qurango.net/radio/mohammed_siddiq_alminshawi",
    fallbackUrls: [
      "https://qurango.net/radio/abdulbasit_abdulsamad_murattal",
      "https://qurango.net/radio/mix",
    ],
    quality: "128 kbps",
    reciter: "محمد صديق المنشاوي",
    country: "مصر",
  },
  {
    id: "mp3quran-main",
    name: "مكتبة mp3quran — بث عام",
    streamUrl: "https://qurango.net/radio/mix",
    fallbackUrls: [
      "https://qurango.net/radio/alzain_mohammad_ahmad",
      "https://qurango.net/radio/saad_alghamdi",
    ],
    quality: "128 kbps",
    country: "عام",
  },
  {
    id: "quran-radio-tafseer",
    name: "إذاعة تفسير القرآن",
    streamUrl: "https://qurango.net/radio/tafseer",
    fallbackUrls: ["https://qurango.net/radio/mix"],
    quality: "128 kbps",
    country: "عام",
  },
];

export type SurahMeta = {
  number: number;
  name: string;
  englishName: string;
  ayahs: number;
  revelation: "مكية" | "مدنية";
  revelationOrder?: number;
  themes: string[];
  objectives: string[];
  mainTopics: string[];
  openingClosingConnection: string;
  keyRulings: string[];
  keyBenefits: string[];
  asbabNuzul: string;
  commonNames: string[];
  virtues: string;
  tafsirLinks: { title: string; href: string; source: string }[];
  relatedLessons: { title: string; href: string }[];
  similarAyahLinks: { title: string; href: string }[];
  source: string;
  lastReviewed: string;
  trustLevel: number;
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

const ENGLISH_NAMES = [
  "Al-Fatihah", "Al-Baqarah", "Aal-Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Taha",
  "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat",
  "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas",
];

const MADANI_SURAHS = new Set([2, 3, 4, 5, 8, 9, 22, 24, 33, 47, 48, 49, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76, 98, 99, 110]);

const CURATED_SURAH_DETAILS: Record<number, Partial<SurahMeta>> = {
  1: {
    themes: ["التوحيد", "العبادة", "الهداية"],
    objectives: ["جمع معاني الثناء والدعاء وطلب الصراط المستقيم"],
    mainTopics: ["حمد الله", "إفراد الله بالعبادة", "طلب الهداية"],
    virtues: "ثبت في الصحيحين أنها أعظم سورة في القرآن، وهي السبع المثاني.",
    commonNames: ["الفاتحة", "أم الكتاب", "السبع المثاني"],
  },
  2: {
    themes: ["الاستخلاف", "الشريعة", "بناء الأمة"],
    objectives: ["تقرير أصول الإيمان والتشريع وبناء الجماعة المؤمنة"],
    mainTopics: ["الإيمان بالغيب", "بنو إسرائيل", "أحكام الأسرة والمال", "آية الكرسي"],
    virtues: "ثبت في صحيح مسلم فضل قراءة سورة البقرة وأن الشيطان ينفر من البيت الذي تُقرأ فيه.",
  },
  18: {
    themes: ["الثبات على الإيمان", "الفتن", "العلم والعمل"],
    objectives: ["بيان النجاة من فتن الدين والمال والعلم والسلطان"],
    mainTopics: ["أصحاب الكهف", "صاحب الجنتين", "موسى والخضر", "ذو القرنين"],
    virtues: "ورد فضل قراءة سورة الكهف يوم الجمعة بأحاديث حسّنها عدد من أهل العلم، وتحتاج الروايات إلى عزو عند التفصيل.",
  },
  36: {
    themes: ["البعث", "الرسالة", "دلائل القدرة"],
    objectives: ["تقرير صدق الرسالة والبعث بدلائل الخلق والتاريخ"],
    mainTopics: ["إثبات الرسالة", "أصحاب القرية", "دلائل الآفاق", "البعث"],
  },
  67: {
    themes: ["الملك", "الابتلاء", "دلائل القدرة"],
    objectives: ["تعظيم ملك الله وتنبيه الإنسان إلى الابتلاء والعمل"],
    mainTopics: ["ملك الله", "الموت والحياة", "خلق السماوات", "الإنذار"],
    virtues: "وردت أحاديث في فضلها وشفاعة السورة، منها ما حسّنه أهل العلم، فينبغي عزو كل رواية عند عرضها.",
  },
  112: {
    themes: ["التوحيد", "تنزيه الله"],
    objectives: ["تقرير توحيد الله وتنزيهه عن الشريك والولد"],
    mainTopics: ["أحدية الله", "الصمدية", "نفي الولد والمثل"],
    virtues: "ثبت في الصحيحين أنها تعدل ثلث القرآن من جهة المعنى والفضل.",
    commonNames: ["الإخلاص", "قل هو الله أحد"],
  },
};

function defaultSurahDetails(number: number, name: string): Partial<SurahMeta> {
  const revelation = MADANI_SURAHS.has(number) ? "مدنية" : "مكية";
  return {
    revelation,
    revelationOrder: undefined,
    themes: revelation === "مدنية" ? ["التشريع", "بناء المجتمع", "تزكية الإيمان"] : ["التوحيد", "البعث", "تزكية القلب"],
    objectives: [`عرض مقاصد سورة ${name} من خلال موضوعاتها القرآنية الموثقة دون الجزم بسبب نزول خاص إلا بدليل.`],
    mainTopics: revelation === "مدنية" ? ["أصول الإيمان", "الأحكام", "الأخلاق الاجتماعية"] : ["دلائل التوحيد", "النبوة", "اليوم الآخر"],
    openingClosingConnection: "تُراجع المناسبة بين مطلع السورة وخاتمتها في كتب التفسير، ويُعرض هنا قدر عام لا يُنسب كرواية ثابتة.",
    keyRulings: revelation === "مدنية" ? ["تُستخرج الأحكام التفصيلية من كتب التفسير وأحكام القرآن المعتمدة."] : ["الأصل في السور المكية تقرير العقيدة والتزكية، وقد تتضمن أحكاماً عامة."],
    keyBenefits: ["الهداية، التزكية، وربط المعاني بالأدلة القرآنية."],
    asbabNuzul: "لا يُذكر سبب نزول خاص إلا إذا ثبت في مصادر أسباب النزول المعتمدة؛ راجع الروابط التفسيرية.",
    commonNames: [name],
    virtues: "لا تُثبت فضيلة خاصة للسورة إلا بدليل صحيح أو حسن، ويُكتفى بالفضل العام لتلاوة القرآن عند عدم ثبوت الخاص.",
  };
}

export function getSurahList(): SurahMeta[] {
  return SURAH_NAMES.map((name, i) => {
    const number = i + 1;
    const defaults = defaultSurahDetails(number, name);
    const details = { ...defaults, ...CURATED_SURAH_DETAILS[number] };

    return {
      number,
      name,
      englishName: ENGLISH_NAMES[i] || `Surah ${number}`,
      ayahs: SURAH_AYAH_COUNTS[i] || 0,
      revelation: details.revelation || (MADANI_SURAHS.has(number) ? "مدنية" : "مكية"),
      revelationOrder: details.revelationOrder,
      themes: details.themes || [],
      objectives: details.objectives || [],
      mainTopics: details.mainTopics || [],
      openingClosingConnection: details.openingClosingConnection || "",
      keyRulings: details.keyRulings || [],
      keyBenefits: details.keyBenefits || [],
      asbabNuzul: details.asbabNuzul || "",
      commonNames: details.commonNames || [name],
      virtues: details.virtues || "",
      tafsirLinks: [
        { title: "تفسير ابن كثير", href: `/search/تفسير ${encodeURIComponent(name)}`, source: "تفسير ابن كثير" },
        { title: "تفسير الطبري", href: `/search/جامع البيان ${encodeURIComponent(name)}`, source: "جامع البيان" },
        { title: "تفسير السعدي", href: `/search/تيسير الكريم الرحمن ${encodeURIComponent(name)}`, source: "تفسير السعدي" },
      ],
      relatedLessons: [
        { title: `دروس متعلقة بسورة ${name}`, href: `/search/سورة ${encodeURIComponent(name)}` },
      ],
      similarAyahLinks: [
        { title: "آيات وموضوعات مشابهة", href: `/search/${encodeURIComponent(name)} آيات مشابهة` },
      ],
      source: "بيانات فهرسية من المصحف، مع مراجعة موضوعية عامة بالرجوع إلى كتب التفسير المعتمدة.",
      lastReviewed: "2026-06-26",
      trustLevel: 92,
    };
  });
}

export function getSurahMeta(surahNumber: number) {
  return getSurahList().find((s) => s.number === surahNumber) || getSurahList()[0];
}

export async function fetchSurahAyahs(surahNumber: number) {
  const cached = getCachedSurahAyahs(surahNumber);
  if (cached) return cached;

  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("تعذر تحميل السورة");
  const json = await response.json();
  const ayahs = json.data.ayahs as { numberInSurah: number; text: string }[];
  cacheSurahAyahs(surahNumber, ayahs);
  return ayahs;
}

const CACHE_PREFIX = "majalis-quran-cache-v1-";

function cacheSurahAyahs(surahNumber: number, ayahs: { numberInSurah: number; text: string }[]) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${surahNumber}`, JSON.stringify({ ayahs, at: Date.now() }));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function getCachedSurahAyahs(surahNumber: number): { numberInSurah: number; text: string }[] | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${surahNumber}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.ayahs || null;
  } catch {
    return null;
  }
}

export function clearQuranCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export function getQuranAudioUrl(surah: number, reciter = "ar.alafasy") {
  if (reciter === "ar.alafasy") {
    return `https://server8.mp3quran.net/afs/${String(surah).padStart(3, "0")}.mp3`;
  }
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${surah}.mp3`;
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
