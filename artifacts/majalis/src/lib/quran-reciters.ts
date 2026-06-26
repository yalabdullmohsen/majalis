export type ReciterQuality = {
  id: string;
  label: string;
  bitrate: string;
};

export type QuranReciter = {
  id: string;
  name: string;
  slug: string;
  bio: string;
  folder: string;
  qualities: ReciterQuality[];
  defaultQuality: string;
  featured?: boolean;
};

/** mp3quran.net server folders — verified public recitation URLs. */
export const QURAN_RECITERS: QuranReciter[] = [
  {
    id: "abdulbasit",
    name: "عبدالباسط عبدالصمد",
    slug: "abdulbasit",
    bio: "من أبرز قرّاء القرن العشرين، يُعرف بصوته المرتل والمجود.",
    folder: "abd_basit",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
    featured: true,
  },
  {
    id: "mishary",
    name: "مشاري راشد العفاسي",
    slug: "mishary",
    bio: "قارئ كويتي معروف بتلاوته الواضحة المؤثرة.",
    folder: "mishary",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
    featured: true,
  },
  {
    id: "maher",
    name: "ماهر المعيقلي",
    slug: "maher",
    bio: "إمام وقارئ في المسجد الحرام، يتميز بالخشوع والترتيل.",
    folder: "maher",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
    featured: true,
  },
  {
    id: "shuraim",
    name: "سعود الشريم",
    slug: "shuraim",
    bio: "إمام وقارئ في المسجد الحرام، صوته معروف عالمياً.",
    folder: "shur",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
    featured: true,
  },
  {
    id: "sudais",
    name: "عبدالرحمن السديس",
    slug: "sudais",
    bio: "إمام وقارئ في المسجد الحرام، من أشهر أصوات التلاوة المعاصرة.",
    folder: "sds",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
    featured: true,
  },
  {
    id: "dosari",
    name: "ياسر الدوسري",
    slug: "dosari",
    bio: "قارئ سعودي معروف بتلاوته المؤثرة في التراويح والمحاضرات.",
    folder: "yasser",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
    featured: true,
  },
  {
    id: "baleela",
    name: "بندر بليلة",
    slug: "baleela",
    bio: "إمام وقارئ في المسجد الحرام، يتميز بالترتيل الهادئ.",
    folder: "baleela",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
  },
  {
    id: "ajamy",
    name: "أحمد بن علي العجمي",
    slug: "ajamy",
    bio: "قارئ سعودي معروف بصوته العذب والخاشع.",
    folder: "ajamy",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
  },
  {
    id: "ghamdi",
    name: "سعد الغامدي",
    slug: "ghamdi",
    bio: "قارئ سعودي يُعرف بتلاوته الواضحة المرتلة.",
    folder: "ghamdi",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
  },
  {
    id: "shatri",
    name: "أبو بكر الشاطري",
    slug: "shatri",
    bio: "إمام وقارئ في المسجد الحرام، يتميز بالترتيل المتقن.",
    folder: "shatri",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
  },
  {
    id: "alafasy",
    name: "مشاري العفاسي (بديل)",
    slug: "alafasy",
    bio: "نسخة بديلة عبر islamic.network للتوافق مع الأجهزة المختلفة.",
    folder: "afs",
    defaultQuality: "128",
    qualities: [{ id: "128", label: "عالية", bitrate: "128 kbps" }],
  },
];

export function getReciterById(id: string): QuranReciter | undefined {
  return QURAN_RECITERS.find((r) => r.id === id);
}

export function getReciterAudioUrl(reciter: QuranReciter, surah: number): string {
  const padded = String(surah).padStart(3, "0");
  if (reciter.id === "alafasy") {
    return `https://server8.mp3quran.net/afs/${padded}.mp3`;
  }
  return `https://server8.mp3quran.net/${reciter.folder}/${padded}.mp3`;
}

const RECITER_KEY = "majalis-quran-reciter-v1";
const RECITER_POSITION_KEY = "majalis-quran-audio-position-v1";

export function getSavedReciterId(): string {
  try {
    return localStorage.getItem(RECITER_KEY) || "mishary";
  } catch {
    return "mishary";
  }
}

export function saveReciterId(id: string) {
  try {
    localStorage.setItem(RECITER_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getAudioPosition(reciterId: string, surah: number): number {
  try {
    const raw = JSON.parse(localStorage.getItem(RECITER_POSITION_KEY) || "{}");
    return raw[`${reciterId}:${surah}`] || 0;
  } catch {
    return 0;
  }
}

export function saveAudioPosition(reciterId: string, surah: number, seconds: number) {
  try {
    const raw = JSON.parse(localStorage.getItem(RECITER_POSITION_KEY) || "{}");
    raw[`${reciterId}:${surah}`] = seconds;
    localStorage.setItem(RECITER_POSITION_KEY, JSON.stringify(raw));
  } catch {
    /* ignore */
  }
}
