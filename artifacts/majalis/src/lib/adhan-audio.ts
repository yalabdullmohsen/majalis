/**
 * محرّك صوت الأذان — كتالوج التسجيلات + تشغيل HTMLAudioElement.
 *
 * سياسة النسبة (إلزامية):
 *  - لا يُعرض اسم مؤذن شخصي إلا عند attribution === "verified".
 *  - غير ذلك: الاسم المعروض = اسم النمط فقط («أذان الحرم المكي»…).
 *
 * المصدر: حزمة أوفلاين محلية (`/audio/adhan` مع توافق `/sounds/adhan`) + CDN mohsalvi كاحتياط،
 * مع كاش Cache API عبر adhan-downloads.
 * مفتاح التعطيل: `/data/adhan-audio-remote.json` عبر adhan-audio-remote-config.
 */

import { getAdhanPattern, type AdhanPatternId } from "./adhan-patterns";
import {
  isAdhanPatternDisabled,
  isAdhanRecordingDisabled,
  isAdhanSourceDisabled,
  type AdhanAudioRemoteSource,
} from "./adhan-audio-remote-config";
import {
  isAdhanPlaying as playbackIsPlaying,
  playAdhanUrl,
  playAdhanUrlAsync,
  stopAdhan as playbackStop,
  type AdhanPlayResult,
} from "./adhan-playback";
import {
  resolveAdhanClip,
  resolveIqamahClip,
  type AdhanPlaybackMode,
} from "./adhan-playback-modes";
import { getOfflineAdhanPack } from "./adhan-offline-assets";

const CDN = "https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main";

const OFF_MAKKAH = getOfflineAdhanPack("makkah");
const OFF_MADINAH = getOfflineAdhanPack("madinah");
const OFF_EGYPT = getOfflineAdhanPack("egypt");
const OFF_AQSA = getOfflineAdhanPack("aqsa");
const OFF_TURKEY = getOfflineAdhanPack("turkey");
const OFF_KUWAIT = getOfflineAdhanPack("kuwait");
const OFF_TAKBIR = getOfflineAdhanPack("takbeerat");

/** @deprecated استخدم AdhanPatternId — أُبقي للتوافق مع الواجهة القديمة */
export type MuezzinStyle = string;

export type AdhanAttribution = "verified" | "style_only";

export type Muezzin = {
  id: string;
  /** الاسم المعروض في الواجهة (نمط فقط إن لم تُوثَّق النسبة) */
  name: string;
  /** اسم المؤذن الشخصي — null ما لم تُتحقَّق النسبة */
  personName: string | null;
  attribution: AdhanAttribution;
  patternId: AdhanPatternId;
  mosque: string | null;
  recordingYear: number | null;
  origin: string;
  country: string;
  /** شارة قصيرة = shortLabel للنمط */
  style: string;
  category: string;
  tags: string[];
  biography: string;
  rating: number;
  totalRatings: number;
  followers: number;
  durationSec: number;
  /** هل يتوفّر ملف صوت قابل للتشغيل؟ */
  audioAvailable: boolean;
  audioUrl: string;
  /** أذان الفجر بالتثويب — مستقل؛ لا يُستبدل بالعام */
  fajrUrl?: string;
  /** مقطع قصير ≤28ث لصوت الإشعار (اختياري حتى يُورَّد مرخّصًا) */
  shortUrl?: string;
  /** تكبيرات الافتتاح فقط (اختياري) */
  takbirUrl?: string;
  /** الإقامة كمقطع ثالث اختياري */
  iqamahUrl?: string;
  sourceId: AdhanAudioRemoteSource;
  /** مرجع توثيق في CREDITS / LICENSE_RISKS */
  licenseNote: string;
};

function patternStyle(id: AdhanPatternId): string {
  return getAdhanPattern(id).shortLabel;
}

/**
 * كتالوج التسجيلات.
 * النسبة الشخصية غير موثَّقة مستقلًا من مستودع mohsalvi → كلها style_only حاليًا.
 * أنماط الأقصى/الشامي/التركي بلا ملف مرخّص بعد → audioAvailable: false (غير قابلة للاختيار).
 */
export const MUEZZINS: Muezzin[] = [
  {
    id: "makkah",
    name: "أذان الحرم المكي",
    personName: null,
    attribution: "style_only",
    patternId: "makki",
    mosque: "المسجد الحرام",
    recordingYear: null,
    origin: "مكة المكرمة",
    country: "السعودية",
    style: patternStyle("makki"),
    category: "حرم مكي",
    tags: ["مكي", "رسمي"],
    biography: "تسجيل بنمط الحرم المكي الشريف. يُعرض باسم النمط دون نسبة شخصية حتى التثبّت.",
    rating: 4.95,
    totalRatings: 380000,
    followers: 720000,
    durationSec: 130,
    audioAvailable: true,
    audioUrl:
      OFF_MAKKAH?.local.general ||
      OFF_MAKKAH?.remote.general ||
      `${CDN}/general/makkah-haram-01.mp3`,
    fajrUrl:
      OFF_MAKKAH?.local.fajr ||
      OFF_MAKKAH?.remote.fajr ||
      `${CDN}/fajr/makkah-fajr-01.mp3`,
    shortUrl: OFF_MAKKAH?.local.short || OFF_TAKBIR?.local.short,
    takbirUrl: OFF_MAKKAH?.local.takbir || OFF_TAKBIR?.local.takbir,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio + حزمة أوفلاين محلية — راجع CREDITS.md",
  },
  {
    id: "alharam",
    name: "أذان الحرم المكي (كلاسيكي)",
    personName: null,
    attribution: "style_only",
    patternId: "makki",
    mosque: "المسجد الحرام",
    recordingYear: null,
    origin: "مكة المكرمة",
    country: "السعودية",
    style: patternStyle("makki"),
    category: "حرم مكي",
    tags: ["مكي", "كلاسيكي"],
    biography: "تسجيل كلاسيكي بنمط الحرم المكي. بلا نسبة شخصية موثّقة.",
    rating: 4.85,
    totalRatings: 142000,
    followers: 310000,
    durationSec: 160,
    audioAvailable: true,
    audioUrl: `${CDN}/general/al-haram-01.mp3`,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio — راجع CREDITS.md وLICENSE_RISKS.md",
  },
  {
    id: "madinah",
    name: "أذان الحرم المدني",
    personName: null,
    attribution: "style_only",
    patternId: "madani",
    mosque: "المسجد النبوي",
    recordingYear: null,
    origin: "المدينة المنورة",
    country: "السعودية",
    style: patternStyle("madani"),
    category: "حرم نبوي",
    tags: ["مدني", "رسمي"],
    biography: "تسجيل بنمط المسجد النبوي الشريف. يُعرض باسم النمط دون نسبة شخصية حتى التثبّت.",
    rating: 4.92,
    totalRatings: 295000,
    followers: 580000,
    durationSec: 110,
    audioAvailable: true,
    audioUrl:
      OFF_MADINAH?.local.general ||
      OFF_MADINAH?.remote.general ||
      `${CDN}/general/madinah-01.mp3`,
    shortUrl: OFF_MADINAH?.local.short || OFF_TAKBIR?.local.short,
    takbirUrl: OFF_MADINAH?.local.takbir || OFF_TAKBIR?.local.takbir,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio + حزمة أوفلاين محلية — راجع CREDITS.md",
  },
  {
    id: "egypt",
    name: "أذان هادئ",
    personName: null,
    attribution: "style_only",
    patternId: "egyptian",
    mosque: "الجامع الأزهر",
    recordingYear: null,
    origin: "القاهرة",
    country: "مصر",
    style: patternStyle("egyptian"),
    category: "هادئ",
    tags: ["هادئ", "مصري", "أوفلاين"],
    biography: "تسجيل هادئ بالنمط المصري التقليدي (أوفلاين محلي). بلا نسبة شخصية موثّقة.",
    rating: 4.8,
    totalRatings: 165000,
    followers: 270000,
    durationSec: 145,
    audioAvailable: true,
    audioUrl:
      OFF_EGYPT?.local.general ||
      OFF_EGYPT?.remote.general ||
      `${CDN}/general/egypt-traditional-01.mp3`,
    shortUrl: OFF_EGYPT?.local.short || OFF_TAKBIR?.local.short,
    takbirUrl: OFF_EGYPT?.local.takbir || OFF_TAKBIR?.local.takbir,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio + حزمة أوفلاين محلية — راجع CREDITS.md",
  },
  {
    id: "abdulbasit",
    name: "أذان مصري (تسجيل ثانٍ)",
    personName: null,
    attribution: "style_only",
    patternId: "egyptian",
    mosque: null,
    recordingYear: null,
    origin: "القاهرة",
    country: "مصر",
    style: patternStyle("egyptian"),
    category: "مصري",
    tags: ["مصري"],
    biography:
      "ملف المصدر يحمل اسمًا شخصيًا في المسار، ولم تُتحقَّق النسبة مستقلًا — يُعرض باسم النمط فقط.",
    rating: 4.88,
    totalRatings: 198000,
    followers: 390000,
    durationSec: 170,
    audioAvailable: true,
    audioUrl: `${CDN}/general/abdul-basit-abdul-samad-01.mp3`,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio — نسبة شخصية غير موثّقة؛ style_only",
  },
  {
    id: "alafasy",
    name: "أذان خليجي معاصر",
    personName: null,
    attribution: "style_only",
    patternId: "makki",
    mosque: null,
    recordingYear: null,
    origin: "الكويت",
    country: "الكويت",
    style: patternStyle("makki"),
    category: "خليجي / قريب من المكي",
    tags: ["مكي", "معاصر"],
    biography:
      "تسجيل معاصر (مصدر CDN). النسبة الشخصية في اسم الملف غير موثّقة مستقلًا — يُعرض بلا اسم مؤذن.",
    rating: 4.9,
    totalRatings: 218000,
    followers: 450000,
    durationSec: 195,
    audioAvailable: true,
    audioUrl: `${CDN}/general/mishary-alafasy-01.mp3`,
    fajrUrl: `${CDN}/fajr/mishary-alafasy-fajr-01.mp3`,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio — نسبة شخصية غير موثّقة؛ style_only",
  },
  {
    id: "qatami",
    name: "أذان خليجي (تسجيل ثانٍ)",
    personName: null,
    attribution: "style_only",
    patternId: "makki",
    mosque: null,
    recordingYear: null,
    origin: "الكويت",
    country: "الكويت",
    style: patternStyle("makki"),
    category: "خليجي / قريب من المكي",
    tags: ["مكي", "معاصر"],
    biography: "تسجيل معاصر بلا نسبة شخصية موثّقة — يُعرض باسم وصفي للنمط.",
    rating: 4.82,
    totalRatings: 134000,
    followers: 245000,
    durationSec: 150,
    audioAvailable: true,
    audioUrl: `${CDN}/general/nasser-al-qatami-01.mp3`,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio — نسبة شخصية غير موثّقة؛ style_only",
  },
  {
    id: "nafees",
    name: "أذان حجازي",
    personName: null,
    attribution: "style_only",
    patternId: "makki",
    mosque: null,
    recordingYear: null,
    origin: "الرياض",
    country: "السعودية",
    style: patternStyle("makki"),
    category: "حجازي / مكي",
    tags: ["مكي", "تقليدي"],
    biography: "تسجيل بنمط حجازي قريب من المكي. بلا نسبة شخصية موثّقة.",
    rating: 4.75,
    totalRatings: 89000,
    followers: 165000,
    durationSec: 140,
    audioAvailable: true,
    audioUrl: `${CDN}/general/ahmad-al-nafees-01.mp3`,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio — نسبة شخصية غير موثّقة؛ style_only",
  },
  {
    id: "mansour",
    name: "أذان سعودي رسمي",
    personName: null,
    attribution: "style_only",
    patternId: "makki",
    mosque: null,
    recordingYear: null,
    origin: "جدة",
    country: "السعودية",
    style: patternStyle("makki"),
    category: "سعودي / مكي",
    tags: ["مكي", "رسمي"],
    biography: "تسجيل بنمط سعودي رسمي. بلا نسبة شخصية موثّقة.",
    rating: 4.78,
    totalRatings: 102000,
    followers: 188000,
    durationSec: 135,
    audioAvailable: true,
    audioUrl: `${CDN}/general/mansour-al-zahrani-01.mp3`,
    fajrUrl: `${CDN}/fajr/mansour-al-zahrani-fajr-01.mp3`,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio — نسبة شخصية غير موثّقة؛ style_only",
  },
  {
    id: "aqsa",
    name: "أذان المسجد الأقصى",
    personName: null,
    attribution: "style_only",
    patternId: "aqsa",
    mosque: "المسجد الأقصى",
    recordingYear: null,
    origin: "القدس",
    country: "فلسطين",
    style: patternStyle("aqsa"),
    category: "الأقصى",
    tags: ["الأقصى"],
    biography:
      "تسجيل بنمط المسجد الأقصى (أوفلاين محلي مضغوط). بلا نسبة شخصية موثّقة.",
    rating: 4.7,
    totalRatings: 12000,
    followers: 28000,
    durationSec: 180,
    audioAvailable: true,
    audioUrl:
      OFF_AQSA?.local.general ||
      OFF_AQSA?.remote.general ||
      `${CDN}/general/al-aqsa-jerusalem-02.mp3`,
    shortUrl: OFF_AQSA?.local.short || OFF_TAKBIR?.local.short,
    takbirUrl: OFF_AQSA?.local.takbir || OFF_TAKBIR?.local.takbir,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio — راجع CREDITS.md وLICENSE_RISKS.md",
  },
  {
    id: "takbeerat",
    name: "أذان قصير / تنبيه فقط",
    personName: null,
    attribution: "style_only",
    patternId: "makki",
    mosque: null,
    recordingYear: null,
    origin: "تنبيه قصير",
    country: "—",
    style: "تكبيرات",
    category: "تنبيه قصير",
    tags: ["تكبير", "قصير", "تنبيه", "أوفلاين"],
    biography: "مقطع تكبيرات قصيرة أوفلاين للتنبيه السريع دون أذان كامل.",
    rating: 4.5,
    totalRatings: 8000,
    followers: 12000,
    durationSec: 12,
    audioAvailable: true,
    audioUrl:
      OFF_TAKBIR?.local.general ||
      OFF_TAKBIR?.local.takbir ||
      `${CDN}/general/madinah-01.mp3`,
    shortUrl: OFF_TAKBIR?.local.short,
    takbirUrl: OFF_TAKBIR?.local.takbir,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "حزمة أوفلاين محلية — راجع CREDITS.md",
  },
  /* أنماط بلا ملف مرخّص مثبت بعد — ظاهرة في الفهرس كـ«قريبًا» وغير قابلة للاختيار */
  {
    id: "aqsa-pending",
    name: "أذان المسجد الأقصى (قريبًا)",
    personName: null,
    attribution: "style_only",
    patternId: "aqsa",
    mosque: "المسجد الأقصى",
    recordingYear: null,
    origin: "القدس",
    country: "فلسطين",
    style: patternStyle("aqsa"),
    category: "الأقصى",
    tags: ["الأقصى"],
    biography: "مدخل توافقي قديم — استخدم تسجيل «aqsa» المتاح.",
    rating: 0,
    totalRatings: 0,
    followers: 0,
    durationSec: 0,
    audioAvailable: false,
    audioUrl: "",
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "مُستبدل بـ aqsa — انظر LICENSE_RISKS.md",
  },
  {
    id: "levantine-pending",
    name: "أذان شامي",
    personName: null,
    attribution: "style_only",
    patternId: "levantine",
    mosque: null,
    recordingYear: null,
    origin: "بلاد الشام",
    country: "—",
    style: patternStyle("levantine"),
    category: "شامي",
    tags: ["شامي"],
    biography: "بانتظار توريد تسجيل مرخّص موثّق للنمط الشامي.",
    rating: 0,
    totalRatings: 0,
    followers: 0,
    durationSec: 0,
    audioAvailable: false,
    audioUrl: "",
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "لا ملف بعد — انظر LICENSE_RISKS.md",
  },
  {
    id: "turkey",
    name: "أذان تركي",
    personName: null,
    attribution: "style_only",
    patternId: "turkish",
    mosque: null,
    recordingYear: null,
    origin: "تركيا",
    country: "تركيا",
    style: patternStyle("turkish"),
    category: "تركي / عثماني",
    tags: ["تركي"],
    biography: "تسجيل بنمط تركي/عثماني — يُعرض باسم النمط دون نسبة شخصية.",
    rating: 4.5,
    totalRatings: 12000,
    followers: 20000,
    durationSec: 238,
    audioAvailable: true,
    audioUrl:
      OFF_TURKEY?.local.general ||
      OFF_TURKEY?.remote.general ||
      `${CDN}/general/mustafa-ozcan-turkey-01.mp3`,
    shortUrl: OFF_TURKEY?.local.short || OFF_TAKBIR?.local.short,
    takbirUrl: OFF_TURKEY?.local.takbir || OFF_TAKBIR?.local.takbir,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio + حزمة محلية — style_only",
  },
  {
    id: "kuwait",
    name: "أذان خليجي / كويتي",
    personName: null,
    attribution: "style_only",
    patternId: "makki",
    mosque: null,
    recordingYear: null,
    origin: "الخليج",
    country: "الكويت",
    style: patternStyle("makki"),
    category: "خليجي",
    tags: ["خليجي", "كويتي"],
    biography: "تسجيل خليجي للنمط العام — بلا نسبة شخصية لمؤذن معيّن.",
    rating: 4.4,
    totalRatings: 8000,
    followers: 15000,
    durationSec: 108,
    audioAvailable: true,
    audioUrl:
      OFF_KUWAIT?.local.general ||
      OFF_KUWAIT?.remote.general ||
      `${CDN}/general/uae-01.mp3`,
    shortUrl: OFF_KUWAIT?.local.short || OFF_TAKBIR?.local.short,
    takbirUrl: OFF_KUWAIT?.local.takbir || OFF_TAKBIR?.local.takbir,
    sourceId: "mohsalvi-adhan-audio",
    licenseNote: "بث عبر mohsalvi/adhan-audio + حزمة محلية — style_only",
  },
];

/** افتراضي آمن: نمط مكي باسم النمط فقط + أذان فجر متاح */
export const DEFAULT_MUEZZIN_ID = "makkah";

export function isMuezzinSelectable(m: Muezzin): boolean {
  if (!m.audioAvailable || !m.audioUrl) return false;
  if (isAdhanRecordingDisabled(m.id)) return false;
  if (isAdhanSourceDisabled(m.sourceId)) return false;
  if (isAdhanPatternDisabled(m.patternId)) return false;
  return true;
}

/** التسجيلات الظاهرة للاختيار (بعد مفتاح التعطيل وتوفّر الصوت) */
export function listSelectableMuezzins(opts?: { requireFajr?: boolean }): Muezzin[] {
  return MUEZZINS.filter((m) => {
    if (!isMuezzinSelectable(m)) return false;
    if (opts?.requireFajr && !m.fajrUrl) return false;
    return true;
  });
}

export function getMuezzin(id: string, opts?: { requireFajr?: boolean }): Muezzin {
  const hit = MUEZZINS.find((m) => m.id === id);
  if (hit && isMuezzinSelectable(hit) && (!opts?.requireFajr || hit.fajrUrl)) {
    return hit;
  }
  const fallback = listSelectableMuezzins(opts)[0] ?? listSelectableMuezzins()[0] ?? MUEZZINS[0];
  return fallback;
}

/**
 * هل يصلح هذا التسجيل لأذان الفجر؟
 * شرط شرعي: نسخة مستقلة بالتثويب — لا يكفي الأذان العام.
 */
/** مسار تثويب: CDN `/fajr/` أو ملف محلي باسم fajr */
export function isFajrThasweebUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /\/fajr\//i.test(url) || /makkah-fajr|[-_/]fajr\./i.test(url);
}

export function hasFajrAdhan(m: Muezzin): boolean {
  return Boolean(
    m.fajrUrl &&
      m.audioAvailable &&
      isMuezzinSelectable(m) &&
      m.fajrUrl !== m.audioUrl &&
      isFajrThasweebUrl(m.fajrUrl),
  );
}

/** أول تسجيل متاح بأذان فجر بالتثويب */
export function getDefaultFajrMuezzin(): Muezzin {
  return (
    listSelectableMuezzins({ requireFajr: true })[0] ??
    getMuezzin(DEFAULT_MUEZZIN_ID, { requireFajr: true })
  );
}

// ─── Audio Engine (يوكّل إلى adhan-playback الخفيف) ───────────────────────────

export function stopAdhan() {
  playbackStop();
}

export function isAdhanPlaying() {
  return playbackIsPlaying();
}

/**
 * تشغيل الأذان حسب الصيغة.
 * للفجر: fajrUrl فقط — بلا استبدال بالنسخة العامة.
 * silent → null (إشعار بلا صوت).
 */
export function playAdhan(
  muezzin: Muezzin,
  isFajr = false,
  mode: AdhanPlaybackMode = "full",
  volume = 1,
): HTMLAudioElement | null {
  const clip = resolveAdhanClip(muezzin, { isFajr, mode });
  if (!clip) return null;
  const vol = Math.min(1, Math.max(0, volume));
  return playAdhanUrl(clip.url, vol, { maxMs: clip.maxMs });
}

/** تشغيل الإقامة إن وُجد ملف مستقل */
export function playIqamah(muezzin: Muezzin): HTMLAudioElement | null {
  const clip = resolveIqamahClip(muezzin);
  if (!clip) return null;
  return playAdhanUrl(clip.url, 1, { maxMs: clip.maxMs });
}

export function previewAdhan(muezzin: Muezzin): HTMLAudioElement {
  if (!muezzin.audioUrl) {
    throw new Error(`لا ملف معاينة للتسجيل: ${muezzin.id}`);
  }
  const audio = playAdhanUrl(muezzin.audioUrl, 0.8, { maxMs: 15_000, fadeIn: true });
  return audio;
}

/** معاينة مع نتيجة واضحة للواجهة (لا فشل صامت). */
export async function previewAdhanAsync(muezzin: Muezzin): Promise<AdhanPlayResult> {
  if (!muezzin.audioUrl) {
    return {
      ok: false,
      code: "missing_file",
      message: `لا ملف معاينة للتسجيل: ${muezzin.id}`,
    };
  }
  return playAdhanUrlAsync(muezzin.audioUrl, 0.8, { maxMs: 15_000, fadeIn: true });
}
