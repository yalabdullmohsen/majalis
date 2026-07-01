/**
 * Quran audio URL generators.
 *
 * Per-ayah audio: everyayah.com
 *   Format: https://everyayah.com/data/{folder}/{surah3}{ayah3}.mp3
 *   Source: https://everyayah.com — free, real recitations, no TTS.
 *
 * Full-surah audio: server8.mp3quran.net
 *   Format: https://server8.mp3quran.net/{folder}/{surah3}.mp3
 *   Source: https://mp3quran.net — real recitations by named reciters.
 *
 * ⚠️ No TTS (text-to-speech). Only real recordings by verified reciters.
 */

export type QuranReciter = {
  id: string;
  nameAr: string;
  nameEn: string;
  /** everyayah.com folder */
  everyayahFolder: string;
  /** mp3quran.net folder (for full surah stream) */
  mp3quranFolder: string;
  featured: boolean;
};

export const RECITERS: QuranReciter[] = [
  {
    id: "alafasy",
    nameAr: "مشاري راشد العفاسي",
    nameEn: "Mishary Rashid Alafasy",
    everyayahFolder: "Alafasy_64kbps",
    mp3quranFolder: "afs",
    featured: true,
  },
  {
    id: "abdulsamad",
    nameAr: "عبد الباسط عبد الصمد",
    nameEn: "Abdul Basit Abdul Samad",
    everyayahFolder: "AbdulSamad_64kbps",
    mp3quranFolder: "abd_basit",
    featured: true,
  },
  {
    id: "maher",
    nameAr: "ماهر المعيقلي",
    nameEn: "Maher Al-Muaiqly",
    everyayahFolder: "Maher_Al_Muaiqly_64kbps",
    mp3quranFolder: "maher",
    featured: true,
  },
  {
    id: "sudais",
    nameAr: "عبد الرحمن السديس",
    nameEn: "Abdurrahman Al-Sudais",
    everyayahFolder: "Sudais_64kbps",
    mp3quranFolder: "sds",
    featured: true,
  },
  {
    id: "husary",
    nameAr: "محمود خليل الحصري",
    nameEn: "Mahmoud Khalil Al-Husary",
    everyayahFolder: "Husary_64kbps",
    mp3quranFolder: "Husary",
    featured: true,
  },
  {
    id: "minshawi",
    nameAr: "محمد صديق المنشاوي",
    nameEn: "Muhammad Siddiq Al-Minshawi",
    everyayahFolder: "Minshawy_64kbps",
    mp3quranFolder: "minshawi",
    featured: false,
  },
  {
    id: "shuraim",
    nameAr: "سعود الشريم",
    nameEn: "Saud Al-Shuraim",
    everyayahFolder: "Shuraim_64kbps",
    mp3quranFolder: "shur",
    featured: false,
  },
  {
    id: "dosari",
    nameAr: "ياسر الدوسري",
    nameEn: "Yasser Al-Dosari",
    everyayahFolder: "Yasser_Ad-Dossari_128kbps",
    mp3quranFolder: "yasser",
    featured: false,
  },
  {
    id: "ghamdi",
    nameAr: "سعد الغامدي",
    nameEn: "Saad Al-Ghamdi",
    everyayahFolder: "Ghamadi_40kbps",
    mp3quranFolder: "ghamdi",
    featured: false,
  },
];

export function getReciter(id: string): QuranReciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
}

/** Per-ayah MP3 from everyayah.com — lazy loaded, never pre-fetched */
export function getAyahAudioUrl(surah: number, ayah: number, reciterId: string): string {
  const r = getReciter(reciterId);
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${r.everyayahFolder}/${s}${a}.mp3`;
}

/** Full-surah MP3 from mp3quran.net */
export function getSurahAudioUrl(surah: number, reciterId: string): string {
  const r = getReciter(reciterId);
  const s = String(surah).padStart(3, "0");
  return `https://server8.mp3quran.net/${r.mp3quranFolder}/${s}.mp3`;
}

// ─── Reciter preference ────────────────────────────────────────────────────
const RECITER_KEY = "mj-quran-reciter-v3";

export function loadReciterId(): string {
  try {
    const stored = localStorage.getItem(RECITER_KEY);
    if (stored && RECITERS.some((r) => r.id === stored)) return stored;
    return "alafasy";
  } catch { return "alafasy"; }
}

export function saveReciterId(id: string) {
  try { localStorage.setItem(RECITER_KEY, id); } catch { /* ignore */ }
}
