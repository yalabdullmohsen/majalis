/**
 * Quran audio URL generators + reciter catalog.
 *
 * Per-ayah: everyayah.com — Format: …/data/{folder}/{surah3}{ayah3}.mp3
 * Full-surah: mp3quran.net — Format: {surahBaseUrl}/{surah3}.mp3
 *
 * ⚠️ No TTS. Stream only — never ship MP3s in the app binary.
 * Abstraction: `@/lib/quran-audio-source` (AudioSource).
 * Kill-switch: `/data/quran-audio-remote.json` via quran-audio-remote-config.
 */

import {
  clampToVerifiedReciterId,
  getVerifiedRecitersSyncFallback,
} from "@/lib/audio-registry";
import {
  isAudioSourceDisabled,
  isReciterDisabled,
  refreshQuranAudioRemoteConfig,
} from "@/lib/quran-audio-remote-config";

export type QuranReciter = {
  id: string;
  nameAr: string;
  nameEn: string;
  /**
   * everyayah.com folder (verse-by-verse). `null` = سورة كاملة فقط (mp3quran).
   * لا تُعرض في منتقي آية-بآية إن كانت null.
   */
  everyayahFolder: string | null;
  /**
   * Absolute base URL for full-surah MP3s on mp3quran.net (no trailing slash).
   */
  surahBaseUrl: string;
  /** الرواية المعتمدة للتسجيل المعروض */
  riwaya: string;
  /** تسمية جودة للعرض (مثل 128kbps) */
  qualityLabel: string;
  /** Shown first in pickers (أشهر القراء). */
  featured: boolean;
};

const RIWAYA_HAFS = "حفص عن عاصم";

/**
 * قائمة القرّاء — مجلدات everyayah مُتحقَّقة HTTP 200 حيث وُجدت،
 * وروابط السور من واجهة mp3quran. من لا يتوفّر آية-بآية يبقى لوضع السورة فقط.
 */
export const RECITERS: QuranReciter[] = [
  {
    id: "dosari",
    nameAr: "ياسر الدوسري",
    nameEn: "Yasser Al-Dosari",
    everyayahFolder: "Yasser_Ad-Dussary_128kbps",
    surahBaseUrl: "https://server11.mp3quran.net/yasser",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: true,
  },
  {
    id: "ali_jaber",
    nameAr: "علي جابر",
    nameEn: "Ali Jaber",
    everyayahFolder: "Ali_Jaber_64kbps",
    surahBaseUrl: "https://server11.mp3quran.net/a_jbr",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "64kbps",
    featured: true,
  },
  {
    id: "abdulsamad",
    nameAr: "عبد الباسط عبد الصمد",
    nameEn: "Abdul Basit Abdul Samad",
    everyayahFolder: "Abdul_Basit_Murattal_192kbps",
    surahBaseUrl: "https://server7.mp3quran.net/basit",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "192kbps",
    featured: true,
  },
  {
    id: "minshawi",
    nameAr: "محمد صديق المنشاوي",
    nameEn: "Muhammad Siddiq Al-Minshawi",
    everyayahFolder: "Minshawy_Murattal_128kbps",
    surahBaseUrl: "https://server10.mp3quran.net/minsh",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: true,
  },
  {
    id: "husary",
    nameAr: "محمود خليل الحصري",
    nameEn: "Mahmoud Khalil Al-Husary",
    everyayahFolder: "Husary_128kbps",
    surahBaseUrl: "https://server13.mp3quran.net/husr",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: true,
  },
  {
    id: "alafasy",
    nameAr: "مشاري راشد العفاسي",
    nameEn: "Mishary Rashid Alafasy",
    everyayahFolder: "Alafasy_128kbps",
    surahBaseUrl: "https://server8.mp3quran.net/afs",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: true,
  },
  {
    id: "ghamdi",
    nameAr: "سعد الغامدي",
    nameEn: "Saad Al-Ghamdi",
    everyayahFolder: "Ghamadi_40kbps",
    surahBaseUrl: "https://server7.mp3quran.net/s_gmd",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "40kbps",
    featured: true,
  },
  {
    id: "maher",
    nameAr: "ماهر المعيقلي",
    nameEn: "Maher Al-Muaiqly",
    everyayahFolder: "MaherAlMuaiqly128kbps",
    surahBaseUrl: "https://server12.mp3quran.net/maher",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: true,
  },
  {
    id: "sudais",
    nameAr: "عبد الرحمن السديس",
    nameEn: "Abdurrahman Al-Sudais",
    everyayahFolder: "Abdurrahmaan_As-Sudais_192kbps",
    surahBaseUrl: "https://server11.mp3quran.net/sds",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "192kbps",
    featured: true,
  },
  {
    id: "shuraim",
    nameAr: "سعود الشريم",
    nameEn: "Saud Al-Shuraim",
    everyayahFolder: "Saood_ash-Shuraym_128kbps",
    surahBaseUrl: "https://server7.mp3quran.net/shur",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: true,
  },
  {
    id: "ajamy",
    nameAr: "أحمد بن علي العجمي",
    nameEn: "Ahmed ibn Ali al-Ajamy",
    everyayahFolder: "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com",
    surahBaseUrl: "https://server10.mp3quran.net/ajm/128",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "64kbps",
    featured: true,
  },
  {
    id: "qatami",
    nameAr: "ناصر القطامي",
    nameEn: "Nasser Al-Qatami",
    everyayahFolder: "Nasser_Alqatami_128kbps",
    surahBaseUrl: "https://server6.mp3quran.net/qtm",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: true,
  },
  {
    id: "shatri",
    nameAr: "أبو بكر الشاطري",
    nameEn: "Abu Bakr Ash-Shaatree",
    everyayahFolder: "Abu_Bakr_Ash-Shaatree_128kbps",
    surahBaseUrl: "https://server11.mp3quran.net/shatri",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: true,
  },
  {
    id: "balilah",
    nameAr: "بندر بليلة",
    nameEn: "Bandar Balilah",
    everyayahFolder: null,
    surahBaseUrl: "https://server6.mp3quran.net/balilah",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "سورة كاملة",
    featured: true,
  },
  {
    id: "jaleel",
    nameAr: "خالد الجليل",
    nameEn: "Khalid Al-Jaleel",
    everyayahFolder: null,
    surahBaseUrl: "https://server10.mp3quran.net/jleel",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "سورة كاملة",
    featured: true,
  },
  {
    id: "abkar",
    nameAr: "إدريس أبكر",
    nameEn: "Idrees Abkar",
    everyayahFolder: null,
    surahBaseUrl: "https://server6.mp3quran.net/abkr",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "سورة كاملة",
    featured: true,
  },
  {
    id: "fares",
    nameAr: "فارس عباد",
    nameEn: "Fares Abbad",
    everyayahFolder: "Fares_Abbad_64kbps",
    surahBaseUrl: "https://server8.mp3quran.net/frs_a",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "64kbps",
    featured: true,
  },
  {
    id: "rifai",
    nameAr: "هاني الرفاعي",
    nameEn: "Hani Ar-Rifai",
    everyayahFolder: "Hani_Rifai_192kbps",
    surahBaseUrl: "https://server8.mp3quran.net/hani",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "192kbps",
    featured: true,
  },
  // ── Additional ───────────────────────────────────────────────────────────
  {
    id: "hudhaify",
    nameAr: "علي بن عبد الرحمن الحذيفي",
    nameEn: "Ali Al-Hudhaify",
    everyayahFolder: "Hudhaify_128kbps",
    surahBaseUrl: "https://server9.mp3quran.net/hthfi",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: false,
  },
  {
    id: "ayyoub",
    nameAr: "محمد أيوب",
    nameEn: "Muhammad Ayyoub",
    everyayahFolder: "Muhammad_Ayyoub_128kbps",
    surahBaseUrl: "https://server8.mp3quran.net/ayyub",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: false,
  },
  {
    id: "jibreel",
    nameAr: "محمد جبريل",
    nameEn: "Muhammad Jibreel",
    everyayahFolder: "Muhammad_Jibreel_64kbps",
    surahBaseUrl: "https://server8.mp3quran.net/jbrl",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "64kbps",
    featured: false,
  },
  {
    id: "basfar",
    nameAr: "عبد الله بصفر",
    nameEn: "Abdullah Basfar",
    everyayahFolder: "Abdullah_Basfar_192kbps",
    surahBaseUrl: "https://server6.mp3quran.net/bsfr",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "192kbps",
    featured: false,
  },
  {
    id: "mustafa_ismail",
    nameAr: "مصطفى إسماعيل",
    nameEn: "Mustafa Ismail",
    everyayahFolder: "Mustafa_Ismail_48kbps",
    surahBaseUrl: "https://server8.mp3quran.net/mustafa",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "48kbps",
    featured: false,
  },
  {
    id: "tablawi",
    nameAr: "محمد محمود الطبلاوي",
    nameEn: "Mohammad al-Tablawi",
    everyayahFolder: "Mohammad_al_Tablaway_128kbps",
    surahBaseUrl: "https://server12.mp3quran.net/tblawi",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: false,
  },
  {
    id: "budair",
    nameAr: "صلاح البدير",
    nameEn: "Salah Al-Budair",
    everyayahFolder: "Salah_Al_Budair_128kbps",
    surahBaseUrl: "https://server6.mp3quran.net/s_bud",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: false,
  },
  {
    id: "qasim",
    nameAr: "عبد المحسن القاسم",
    nameEn: "Abdulmohsen Al-Qasim",
    everyayahFolder: "Muhsin_Al_Qasim_192kbps",
    surahBaseUrl: "https://server8.mp3quran.net/qasm",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "192kbps",
    featured: false,
  },
  {
    id: "matrood",
    nameAr: "عبد الله المطرود",
    nameEn: "Abdullah Al-Matrood",
    everyayahFolder: "Abdullah_Matroud_128kbps",
    surahBaseUrl: "https://server8.mp3quran.net/mtrod",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: false,
  },
  {
    id: "akhdar",
    nameAr: "إبراهيم الأخضر",
    nameEn: "Ibrahim Al-Akhdar",
    everyayahFolder: "Ibrahim_Akhdar_32kbps",
    surahBaseUrl: "https://server6.mp3quran.net/akdr",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "32kbps",
    featured: false,
  },
  {
    id: "bukhatir",
    nameAr: "صلاح بو خاطر",
    nameEn: "Salah Bukhatir",
    everyayahFolder: "Salaah_AbdulRahman_Bukhatir_128kbps",
    surahBaseUrl: "https://server8.mp3quran.net/bu_khtr",
    riwaya: RIWAYA_HAFS,
    qualityLabel: "128kbps",
    featured: false,
  },
];

export type ReciterSelectMode = "ayah" | "surah" | "any";

function isCatalogVisible(r: QuranReciter, mode: ReciterSelectMode): boolean {
  if (isReciterDisabled(r.id)) return false;
  if (mode === "ayah") {
    if (isAudioSourceDisabled("everyayah")) return false;
    return Boolean(r.everyayahFolder);
  }
  if (mode === "surah") {
    if (isAudioSourceDisabled("mp3quran")) return false;
    return Boolean(r.surahBaseUrl);
  }
  // any: يظهر إن بقي مصدر واحد على الأقل
  const ayahOk = Boolean(r.everyayahFolder) && !isAudioSourceDisabled("everyayah");
  const surahOk = Boolean(r.surahBaseUrl) && !isAudioSourceDisabled("mp3quran");
  return ayahOk || surahOk;
}

/** قرّاء قابلون للاختيار بعد تطبيق مفتاح التعطيل وتوفّر المصدر. */
export function getSelectableReciters(mode: ReciterSelectMode = "any"): QuranReciter[] {
  return RECITERS.filter((r) => isCatalogVisible(r, mode));
}

/** أشهر القراء فقط (بعد الفلترة). */
export function getFeaturedReciters(mode: ReciterSelectMode = "any"): QuranReciter[] {
  return getSelectableReciters(mode).filter((r) => r.featured);
}

export function getReciter(id: string): QuranReciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS.find((r) => r.id === "alafasy") ?? RECITERS[0]!;
}

/** Per-ayah MP3 — يعيد سلسلة فارغة إن لم يتوفّر everyayah لهذا القارئ. */
export function getAyahAudioUrl(surah: number, ayah: number, reciterId: string): string {
  const r = getReciter(reciterId);
  if (!r.everyayahFolder || isAudioSourceDisabled("everyayah") || isReciterDisabled(reciterId)) {
    return "";
  }
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${r.everyayahFolder}/${s}${a}.mp3`;
}

/** رقم الآية العالمي (١…٦٢٣٦) لمصدر islamic.network */
export function getGlobalAyahNumber(surah: number, ayah: number): number {
  if (surah < 1 || surah > 114 || ayah < 1) return 0;
  let n = 0;
  for (let s = 1; s < surah; s++) {
    n += SURAH_AYAH_COUNTS[s - 1] ?? 0;
  }
  return n + ayah;
}

/** عدد آيات كل سورة (ترتيب عثماني) — لروابط CDN البديلة فقط */
const SURAH_AYAH_COUNTS: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
  89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
  30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

/** islamic.network edition id — احتياط عند فشل everyayah */
const ISLAMIC_NETWORK_EDITION: Record<string, string> = {
  alafasy: "ar.alafasy",
  husary: "ar.husary",
  minshawi: "ar.minshawi",
  abdulbasitmurattal: "ar.abdulbasitmurattal",
  abdulsamad: "ar.abdulsamad",
  ajamy: "ar.ahmedajamy",
  maher: "ar.mahermuaiqly",
  sudais: "ar.abdurrahmaansudais",
  shuraim: "ar.saoodshuraym",
  ghamdi: "ar.ghamadi",
};

export function getIslamicNetworkAyahUrl(
  surah: number,
  ayah: number,
  reciterId: string,
): string {
  if (isAudioSourceDisabled("everyayah") && isAudioSourceDisabled("mp3quran")) {
    /* كلا المصدرين معطّلان من الإعداد البعيد — لا نكسر سياسة التعطيل */
  }
  if (isReciterDisabled(reciterId) && reciterId !== "alafasy") return "";
  const edition =
    ISLAMIC_NETWORK_EDITION[reciterId] ?? ISLAMIC_NETWORK_EDITION.alafasy ?? "ar.alafasy";
  const global = getGlobalAyahNumber(surah, ayah);
  if (global < 1) return "";
  return `https://cdn.islamic.network/quran/audio/128/${edition}/${global}.mp3`;
}

/**
 * مرشّحو تشغيل الآية بالترتيب: القارئ → عفاسي everyayah → islamic.network.
 * لا يغيّر نص القرآن — روابط صوت فقط.
 */
export function listAyahAudioUrls(surah: number, ayah: number, reciterId: string): string[] {
  const urls: string[] = [];
  const push = (u: string) => {
    if (u && !urls.includes(u)) urls.push(u);
  };
  const primary = getAyahAudioUrl(surah, ayah, reciterId);
  push(primary);
  if (primary.includes("://everyayah.com/")) {
    push(primary.replace("://everyayah.com/", "://www.everyayah.com/"));
  }
  if (reciterId !== "alafasy") {
    const afasy = getAyahAudioUrl(surah, ayah, "alafasy");
    push(afasy);
    if (afasy.includes("://everyayah.com/")) {
      push(afasy.replace("://everyayah.com/", "://www.everyayah.com/"));
    }
  }
  push(getIslamicNetworkAyahUrl(surah, ayah, reciterId));
  if (reciterId !== "alafasy") {
    push(getIslamicNetworkAyahUrl(surah, ayah, "alafasy"));
  }
  return urls;
}

/** Full-surah MP3 from mp3quran.net. */
export function getSurahAudioUrl(surah: number, reciterId: string): string {
  const r = getReciter(reciterId);
  if (!r.surahBaseUrl || isAudioSourceDisabled("mp3quran") || isReciterDisabled(reciterId)) {
    return "";
  }
  const s = String(surah).padStart(3, "0");
  return `${r.surahBaseUrl}/${s}.mp3`;
}

/** حرف أول للعرض عند غياب الصورة. */
export function reciterInitial(reciter: QuranReciter): string {
  const ch = reciter.nameAr.trim().charAt(0);
  return ch || "?";
}

// ─── Reciter preference ────────────────────────────────────────────────────
const RECITER_KEY = "mj-quran-reciter-v3";

export function loadReciterId(): string {
  try {
    const stored = localStorage.getItem(RECITER_KEY);
    const verified = getVerifiedRecitersSyncFallback();
    if (stored && verified.some((r) => r.id === stored)) return stored;
    return verified[0]?.id ?? "alafasy";
  } catch {
    return clampToVerifiedReciterId("alafasy");
  }
}

export function saveReciterId(id: string) {
  try {
    localStorage.setItem(RECITER_KEY, id);
  } catch {
    /* ignore */
  }
}

/** حدّث مفتاح التعطيل ثم صحّح القارئ المحفوظ إن أُخفي. */
export async function ensureValidReciterPreference(): Promise<string> {
  await refreshQuranAudioRemoteConfig();
  const id = loadReciterId();
  const verified = getVerifiedRecitersSyncFallback();
  const ok = verified.some((r) => r.id === id);
  if (!ok) {
    const fallback = verified[0]?.id ?? "alafasy";
    saveReciterId(fallback);
    return fallback;
  }
  return id;
}

// ─── Playback speed preference (0.75×–2×) ──────────────────────────────────
const PLAYBACK_RATE_KEY = "mj-quran-playback-rate-v1";

/** Valid rates — يشمل 0.75×–2× حسب متطلّب التشغيل. */
export const VALID_PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const VALID_RATES: number[] = [...VALID_PLAYBACK_RATES];

export function normalizePlaybackRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1;
  let best = 1;
  let bestDist = Infinity;
  for (const r of VALID_RATES) {
    const d = Math.abs(r - rate);
    if (d < bestDist) {
      best = r;
      bestDist = d;
    }
  }
  return best;
}

export function loadPlaybackRate(): number {
  try {
    const stored = Number(localStorage.getItem(PLAYBACK_RATE_KEY));
    if (VALID_RATES.includes(stored)) return stored;
    /* ترحيل 0.5 القديم → 0.75 */
    if (stored === 0.5) return 0.75;
    return 1;
  } catch {
    return 1;
  }
}

export function savePlaybackRate(rate: number) {
  try {
    localStorage.setItem(PLAYBACK_RATE_KEY, String(normalizePlaybackRate(rate)));
  } catch {
    /* ignore */
  }
}
