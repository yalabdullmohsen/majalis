/**
 * خريطة أصول الأذان الأوفلاين — مسارات محلية عالية الجودة أولاً ثم CDN.
 * المصدر الرسمي للتشغيل: `/audio/adhan/*` (مع إبقاء `/sounds/adhan` توافقًا).
 * ملاحظة: الملفات المحلية الكاملة مقاطع ~٢٨ث AAC ضمن ميزانية الحزمة؛ الكامل الطويل عبر CDN.
 */

export type OfflineAdhanClipKind = "general" | "fajr" | "short" | "takbir";

export type OfflineAdhanPack = {
  id: string;
  labelAr: string;
  local: Partial<Record<OfflineAdhanClipKind, string>>;
  remote: Partial<Record<OfflineAdhanClipKind, string>>;
  notificationSound?: string;
};

const CDN = "https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main";

/** الحزمة الأساسية: مكة / المدينة / مصر / الأقصى / حرم / تكبيرات / لطيف / تركي */
export const OFFLINE_ADHAN_CORE_PACKS: OfflineAdhanPack[] = [
  {
    id: "makkah",
    labelAr: "أذان مكة المكرمة",
    local: {
      general: "/audio/adhan/adhan-makkah-full.m4a",
      fajr: "/audio/adhan/adhan-makkah-fajr.mp3",
      short: "/audio/adhan/adhan-makkah-full.m4a",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/makkah-haram-02.mp3`,
      fajr: `${CDN}/fajr/makkah-fajr-01.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "madinah",
    labelAr: "أذان المدينة المنورة",
    local: {
      general: "/audio/adhan/adhan-madinah-full.m4a",
      short: "/audio/adhan/adhan-madinah-full.m4a",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/madinah-02.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
    notificationSound: "adhan-short-madinah.caf",
  },
  {
    id: "egypt",
    labelAr: "الأذان المصري",
    local: {
      general: "/audio/adhan/adhan-egypt-full.m4a",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/egypt-traditional-02.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
    notificationSound: "adhan-short-egypt.caf",
  },
  {
    id: "aqsa",
    labelAr: "أذان المسجد الأقصى",
    local: {
      general: "/audio/adhan/adhan-aqsa-full.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/al-aqsa-jerusalem-02.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
    notificationSound: "adhan-short-aqsa.caf",
  },
  {
    id: "takbeerat",
    labelAr: "تكبيرات قصيرة",
    local: {
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
      general: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
      general: `${CDN}/general/madinah-02.mp3`,
    },
    notificationSound: "adhan-short-takbeerat.caf",
  },
  {
    id: "alharam",
    labelAr: "أذان الحرم",
    local: {
      general: "/audio/adhan/adhan-haram-full.m4a",
      fajr: "/audio/adhan/adhan-makkah-fajr.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/al-haram-01.mp3`,
      fajr: `${CDN}/fajr/makkah-fajr-01.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "soft",
    labelAr: "تنبيه لطيف بدون أذان",
    local: {
      general: "/audio/adhan/adhan-soft-alert.m4a",
      short: "/audio/adhan/adhan-soft-alert.m4a",
      takbir: "/audio/adhan/adhan-soft-alert.m4a",
    },
    remote: {
      general: `${CDN}/general/madinah-02.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
    notificationSound: "adhan-short-takbeerat.caf",
  },
  {
    id: "turkey",
    labelAr: "أذان تركي",
    local: {
      general: "/audio/adhan/adhan-takbeerat-short.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/mustafa-ozcan-turkey-01.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
    notificationSound: "adhan-short-takbeerat.caf",
  },
  {
    id: "kuwait",
    labelAr: "أذان خليجي / كويتي",
    local: {
      general: "/audio/adhan/adhan-takbeerat-short.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/uae-01.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
    notificationSound: "adhan-short-makkah.caf",
  },
];

export const OFFLINE_FEATURED_MUEZZIN_IDS = [
  "makkah",
  "madinah",
  "alharam",
  "egypt",
  "aqsa",
  "turkey",
  "takbeerat",
  "soft",
] as const;

const byId = new Map(OFFLINE_ADHAN_CORE_PACKS.map((p) => [p.id, p]));

/** توافق المسارات القديمة → الجديدة (m4a) */
const LEGACY_SOUND_ALIASES: Record<string, string> = {
  "/sounds/adhan/makkah-general.mp3": "/audio/adhan/adhan-makkah-full.m4a",
  "/sounds/adhan/makkah-general.m4a": "/audio/adhan/adhan-makkah-full.m4a",
  "/sounds/adhan/makkah-fajr.mp3": "/audio/adhan/adhan-makkah-fajr.mp3",
  "/sounds/adhan/madinah-general.mp3": "/audio/adhan/adhan-madinah-full.m4a",
  "/sounds/adhan/madinah-general.m4a": "/audio/adhan/adhan-madinah-full.m4a",
  "/sounds/adhan/egypt-general.mp3": "/audio/adhan/adhan-egypt-full.m4a",
  "/sounds/adhan/egypt-general.m4a": "/audio/adhan/adhan-egypt-full.m4a",
  "/sounds/adhan/aqsa-general.mp3": "/audio/adhan/adhan-aqsa-full.mp3",
  "/sounds/adhan/takbeerat-short.mp3": "/audio/adhan/adhan-takbeerat-short.mp3",
  "/audio/adhan/adhan-makkah-full.mp3": "/audio/adhan/adhan-makkah-full.m4a",
  "/audio/adhan/adhan-madinah-full.mp3": "/audio/adhan/adhan-madinah-full.m4a",
  "/audio/adhan/adhan-egypt-full.mp3": "/audio/adhan/adhan-egypt-full.m4a",
};

export function getOfflineAdhanPack(id: string): OfflineAdhanPack | undefined {
  return byId.get(id);
}

export function isOfflineFeaturedMuezzin(id: string): boolean {
  return (OFFLINE_FEATURED_MUEZZIN_IDS as readonly string[]).includes(id);
}

export function resolveOfflineClipUrl(
  packId: string,
  kind: OfflineAdhanClipKind,
): string | null {
  const pack = byId.get(packId);
  if (!pack) return null;
  return pack.local[kind] || pack.remote[kind] || null;
}

export function preferLocalAdhanUrl(url: string): string {
  if (!url) return url;
  if (LEGACY_SOUND_ALIASES[url]) return LEGACY_SOUND_ALIASES[url]!;
  if (url.startsWith("/audio/adhan/")) return url;
  if (url.startsWith("/sounds/adhan/")) return url;
  for (const pack of OFFLINE_ADHAN_CORE_PACKS) {
    for (const kind of ["general", "fajr", "short", "takbir"] as const) {
      if (pack.remote[kind] === url && pack.local[kind]) {
        return pack.local[kind]!;
      }
    }
  }
  return url;
}

export function listBundledAdhanSoundPaths(): string[] {
  const set = new Set<string>();
  for (const pack of OFFLINE_ADHAN_CORE_PACKS) {
    for (const path of Object.values(pack.local)) {
      if (path) set.add(path);
    }
  }
  return [...set];
}

export function notificationSoundForAdhanPack(packId: string): string | null {
  return byId.get(packId)?.notificationSound ?? null;
}
