/**
 * Quran audio URL generators.
 *
 * Per-ayah audio: everyayah.com
 *   Format: https://everyayah.com/data/{folder}/{surah3}{ayah3}.mp3
 *   Source: https://everyayah.com — free, real recitations, no TTS.
 *
 * Full-surah audio: mp3quran.net (server varies per reciter)
 *   Format: {surahBaseUrl}/{surah3}.mp3
 *
 * ⚠️ No TTS (text-to-speech). Only real recordings by verified reciters.
 */

export type QuranReciter = {
  id: string;
  nameAr: string;
  nameEn: string;
  /** everyayah.com folder (verified verse-by-verse). */
  everyayahFolder: string;
  /**
   * Absolute base URL for full-surah MP3s on mp3quran.net (no trailing slash).
   * Example: `https://server8.mp3quran.net/afs`
   */
  surahBaseUrl: string;
  /** Shown first in pickers (أشهر القراء). */
  featured: boolean;
};

/**
 * أشهر القرّاء — مجلدات everyayah مُتحقَّقة، وروابط السور من واجهة mp3quran.
 * الترتيب: المميَّزون أولًا ثم الباقون أبجديًا بالاسم العربي.
 */
export const RECITERS: QuranReciter[] = [
  // ── Featured (أشهر القراء) ───────────────────────────────────────────────
  {
    id: "alafasy",
    nameAr: "مشاري راشد العفاسي",
    nameEn: "Mishary Rashid Alafasy",
    everyayahFolder: "Alafasy_64kbps",
    surahBaseUrl: "https://server8.mp3quran.net/afs",
    featured: true,
  },
  {
    id: "abdulsamad",
    nameAr: "عبد الباسط عبد الصمد",
    nameEn: "Abdul Basit Abdul Samad",
    everyayahFolder: "Abdul_Basit_Murattal_64kbps",
    surahBaseUrl: "https://server7.mp3quran.net/basit",
    featured: true,
  },
  {
    id: "husary",
    nameAr: "محمود خليل الحصري",
    nameEn: "Mahmoud Khalil Al-Husary",
    everyayahFolder: "Husary_64kbps",
    surahBaseUrl: "https://server13.mp3quran.net/husr",
    featured: true,
  },
  {
    id: "minshawi",
    nameAr: "محمد صديق المنشاوي",
    nameEn: "Muhammad Siddiq Al-Minshawi",
    everyayahFolder: "Minshawy_Murattal_128kbps",
    surahBaseUrl: "https://server10.mp3quran.net/minsh",
    featured: true,
  },
  {
    id: "sudais",
    nameAr: "عبد الرحمن السديس",
    nameEn: "Abdurrahman Al-Sudais",
    everyayahFolder: "Abdurrahmaan_As-Sudais_64kbps",
    surahBaseUrl: "https://server11.mp3quran.net/sds",
    featured: true,
  },
  {
    id: "maher",
    nameAr: "ماهر المعيقلي",
    nameEn: "Maher Al-Muaiqly",
    everyayahFolder: "Maher_AlMuaiqly_64kbps",
    surahBaseUrl: "https://server12.mp3quran.net/maher",
    featured: true,
  },
  {
    id: "shuraim",
    nameAr: "سعود الشريم",
    nameEn: "Saud Al-Shuraim",
    everyayahFolder: "Saood_ash-Shuraym_64kbps",
    surahBaseUrl: "https://server7.mp3quran.net/shur",
    featured: true,
  },
  {
    id: "dosari",
    nameAr: "ياسر الدوسري",
    nameEn: "Yasser Al-Dosari",
    everyayahFolder: "Yasser_Ad-Dussary_128kbps",
    surahBaseUrl: "https://server11.mp3quran.net/yasser",
    featured: true,
  },
  {
    id: "ghamdi",
    nameAr: "سعد الغامدي",
    nameEn: "Saad Al-Ghamdi",
    everyayahFolder: "Ghamadi_40kbps",
    surahBaseUrl: "https://server7.mp3quran.net/s_gmd",
    featured: true,
  },
  {
    id: "ajamy",
    nameAr: "أحمد بن علي العجمي",
    nameEn: "Ahmed ibn Ali al-Ajamy",
    everyayahFolder: "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com",
    surahBaseUrl: "https://server10.mp3quran.net/ajm/128",
    featured: true,
  },
  {
    id: "hudhaify",
    nameAr: "علي بن عبد الرحمن الحذيفي",
    nameEn: "Ali Al-Hudhaify",
    everyayahFolder: "Hudhaify_64kbps",
    surahBaseUrl: "https://server9.mp3quran.net/hthfi",
    featured: true,
  },
  {
    id: "shatri",
    nameAr: "أبو بكر الشاطري",
    nameEn: "Abu Bakr Ash-Shaatree",
    everyayahFolder: "Abu_Bakr_Ash-Shaatree_128kbps",
    surahBaseUrl: "https://server11.mp3quran.net/shatri",
    featured: true,
  },
  // ── Additional well-known reciters ───────────────────────────────────────
  {
    id: "ayyoub",
    nameAr: "محمد أيوب",
    nameEn: "Muhammad Ayyoub",
    everyayahFolder: "Muhammad_Ayyoub_128kbps",
    surahBaseUrl: "https://server8.mp3quran.net/ayyub",
    featured: false,
  },
  {
    id: "jibreel",
    nameAr: "محمد جبريل",
    nameEn: "Muhammad Jibreel",
    everyayahFolder: "Muhammad_Jibreel_64kbps",
    surahBaseUrl: "https://server8.mp3quran.net/jbrl",
    featured: false,
  },
  {
    id: "qatami",
    nameAr: "ناصر القطامي",
    nameEn: "Nasser Al-Qatami",
    everyayahFolder: "Nasser_Alqatami_128kbps",
    surahBaseUrl: "https://server6.mp3quran.net/qtm",
    featured: false,
  },
  {
    id: "rifai",
    nameAr: "هاني الرفاعي",
    nameEn: "Hani Ar-Rifai",
    everyayahFolder: "Hani_Rifai_192kbps",
    surahBaseUrl: "https://server8.mp3quran.net/hani",
    featured: false,
  },
  {
    id: "basfar",
    nameAr: "عبد الله بصفر",
    nameEn: "Abdullah Basfar",
    everyayahFolder: "Abdullah_Basfar_192kbps",
    surahBaseUrl: "https://server6.mp3quran.net/bsfr",
    featured: false,
  },
  {
    id: "fares",
    nameAr: "فارس عباد",
    nameEn: "Fares Abbad",
    everyayahFolder: "Fares_Abbad_64kbps",
    surahBaseUrl: "https://server8.mp3quran.net/frs_a",
    featured: false,
  },
  {
    id: "mustafa_ismail",
    nameAr: "مصطفى إسماعيل",
    nameEn: "Mustafa Ismail",
    everyayahFolder: "Mustafa_Ismail_48kbps",
    surahBaseUrl: "https://server8.mp3quran.net/mustafa",
    featured: false,
  },
  {
    id: "tablawi",
    nameAr: "محمد محمود الطبلاوي",
    nameEn: "Mohammad al-Tablawi",
    everyayahFolder: "Mohammad_al_Tablaway_128kbps",
    surahBaseUrl: "https://server12.mp3quran.net/tblawi",
    featured: false,
  },
  {
    id: "ali_jaber",
    nameAr: "علي جابر",
    nameEn: "Ali Jaber",
    everyayahFolder: "Ali_Jaber_64kbps",
    surahBaseUrl: "https://server11.mp3quran.net/a_jbr",
    featured: false,
  },
  {
    id: "budair",
    nameAr: "صلاح البدير",
    nameEn: "Salah Al-Budair",
    everyayahFolder: "Salah_Al_Budair_128kbps",
    surahBaseUrl: "https://server6.mp3quran.net/s_bud",
    featured: false,
  },
  {
    id: "qasim",
    nameAr: "عبد المحسن القاسم",
    nameEn: "Abdulmohsen Al-Qasim",
    everyayahFolder: "Muhsin_Al_Qasim_192kbps",
    surahBaseUrl: "https://server8.mp3quran.net/qasm",
    featured: false,
  },
  {
    id: "matrood",
    nameAr: "عبد الله المطرود",
    nameEn: "Abdullah Al-Matrood",
    everyayahFolder: "Abdullah_Matroud_128kbps",
    surahBaseUrl: "https://server8.mp3quran.net/mtrod",
    featured: false,
  },
  {
    id: "akhdar",
    nameAr: "إبراهيم الأخضر",
    nameEn: "Ibrahim Al-Akhdar",
    everyayahFolder: "Ibrahim_Akhdar_32kbps",
    surahBaseUrl: "https://server6.mp3quran.net/akdr",
    featured: false,
  },
  {
    id: "bukhatir",
    nameAr: "صلاح بو خاطر",
    nameEn: "Salah Bukhatir",
    everyayahFolder: "Salaah_AbdulRahman_Bukhatir_128kbps",
    surahBaseUrl: "https://server8.mp3quran.net/bu_khtr",
    featured: false,
  },
];
/** أشهر القراء فقط (للوحة والقوائم المختصرة). */
export function getFeaturedReciters(): QuranReciter[] {
  return RECITERS.filter((r) => r.featured);
}

export function getReciter(id: string): QuranReciter {
  const normalized =
    id === "mishary" || id === "afasy" ? "alafasy" : id === "muaiqly" ? "maher" : id;
  return RECITERS.find((r) => r.id === normalized) ?? RECITERS[0]!;
}

/** Per-ayah MP3 from everyayah.com — lazy loaded, never pre-fetched */
export function getAyahAudioUrl(surah: number, ayah: number, reciterId: string): string {
  // Same formula as RN `getAudioUrl(verseNumber)` via quran-reciters baseUrl.
  const r = getReciter(reciterId === "mishary" || reciterId === "afasy" ? "alafasy" : reciterId);
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${r.everyayahFolder}/${s}${a}.mp3`;
}

/** Full-surah MP3 from mp3quran.net (reciter-specific server). */
export function getSurahAudioUrl(surah: number, reciterId: string): string {
  const r = getReciter(reciterId);
  const s = String(surah).padStart(3, "0");
  return `${r.surahBaseUrl}/${s}.mp3`;
}

// ─── Reciter preference ────────────────────────────────────────────────────
const RECITER_KEY = "mj-quran-reciter-v3";

export function loadReciterId(): string {
  try {
    const stored = localStorage.getItem(RECITER_KEY);
    if (stored && RECITERS.some((r) => r.id === stored)) return stored;
    return "alafasy";
  } catch {
    return "alafasy";
  }
}

export function saveReciterId(id: string) {
  try {
    localStorage.setItem(RECITER_KEY, id);
  } catch {
    /* ignore */
  }
}

// ─── Playback speed preference (0.5x–2x) ───────────────────────────────────
const PLAYBACK_RATE_KEY = "mj-quran-playback-rate-v1";
const VALID_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function loadPlaybackRate(): number {
  try {
    const stored = Number(localStorage.getItem(PLAYBACK_RATE_KEY));
    if (VALID_RATES.includes(stored)) return stored;
    return 1;
  } catch {
    return 1;
  }
}

export function savePlaybackRate(rate: number) {
  try {
    localStorage.setItem(PLAYBACK_RATE_KEY, String(rate));
  } catch {
    /* ignore */
  }
}
