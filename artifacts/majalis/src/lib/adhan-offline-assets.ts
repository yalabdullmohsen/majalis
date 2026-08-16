/**
 * خريطة أصول الأذان الأوفلاين — مسارات محلية خفيفة أولاً ثم CDN.
 * المصدر الرسمي للتشغيل الكامل: `/audio/adhan/*` (مع إبقاء `/sounds/adhan` توافقًا).
 * التشغيل يستخدم Cache API عبر adhan-downloads عند توفر نسخة مخزّنة.
 */

export type OfflineAdhanClipKind = "general" | "fajr" | "short" | "takbir";

export type OfflineAdhanPack = {
  id: string;
  labelAr: string;
  /** مسارات محلية اختيارية تحت /audio/adhan */
  local: Partial<Record<OfflineAdhanClipKind, string>>;
  /** روابط CDN كاملة (fallback / تنزيل للكاش) */
  remote: Partial<Record<OfflineAdhanClipKind, string>>;
  /** صوت إشعار iOS القصير المقابل (اسم ملف في Bundle بدون مسار) */
  notificationSound?: string;
};

const CDN = "https://cdn.jsdelivr.net/gh/mohsalvi/adhan-audio@main";

/** الحزمة الأساسية: مكة / المدينة / مصر / الأقصى / تكبيرات (+ فجر مكة بالتثويب) */
export const OFFLINE_ADHAN_CORE_PACKS: OfflineAdhanPack[] = [
  {
    id: "makkah",
    labelAr: "أذان مكة المكرمة",
    local: {
      general: "/audio/adhan/adhan-makkah-full.mp3",
      fajr: "/audio/adhan/adhan-makkah-fajr.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/makkah-haram-01.mp3`,
      fajr: `${CDN}/fajr/makkah-fajr-01.mp3`,
      short: `${CDN}/general/madinah-01.mp3`,
      takbir: `${CDN}/general/madinah-01.mp3`,
    },
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "madinah",
    labelAr: "أذان المدينة المنورة",
    local: {
      general: "/audio/adhan/adhan-madinah-full.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/madinah-01.mp3`,
      short: `${CDN}/general/madinah-01.mp3`,
      takbir: `${CDN}/general/madinah-01.mp3`,
    },
    notificationSound: "adhan-short-madinah.caf",
  },
  {
    id: "egypt",
    labelAr: "الأذان المصري",
    local: {
      general: "/audio/adhan/adhan-egypt-full.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/egypt-traditional-01.mp3`,
      short: `${CDN}/general/madinah-01.mp3`,
      takbir: `${CDN}/general/madinah-01.mp3`,
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
      short: `${CDN}/general/madinah-01.mp3`,
      takbir: `${CDN}/general/madinah-01.mp3`,
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
      short: `${CDN}/general/madinah-01.mp3`,
      takbir: `${CDN}/general/madinah-01.mp3`,
      general: `${CDN}/general/madinah-01.mp3`,
    },
    notificationSound: "adhan-short-takbeerat.caf",
  },
  {
    id: "alharam",
    labelAr: "أذان الحرم",
    local: {
      general: "/audio/adhan/adhan-makkah-full.mp3",
      fajr: "/audio/adhan/adhan-makkah-fajr.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/al-haram-01.mp3`,
      fajr: `${CDN}/fajr/makkah-fajr-01.mp3`,
      short: `${CDN}/general/madinah-01.mp3`,
      takbir: `${CDN}/general/madinah-01.mp3`,
    },
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "turkey",
    labelAr: "أذان تركي",
    local: {
      // لا ملف تركي كامل مرخّص في الحزمة بعد — معاينة محلية قصيرة + CDN عند الاتصال
      general: "/audio/adhan/adhan-takbeerat-short.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/mustafa-ozcan-turkey-01.mp3`,
      short: `${CDN}/general/madinah-01.mp3`,
      takbir: `${CDN}/general/madinah-01.mp3`,
    },
    notificationSound: "adhan-short-takbeerat.caf",
  },
  {
    id: "soft",
    labelAr: "تنبيه لطيف بدون أذان",
    local: {
      general: "/audio/adhan/adhan-takbeerat-short.mp3",
      short: "/audio/adhan/adhan-takbeerat-short.mp3",
      takbir: "/audio/adhan/adhan-takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/madinah-01.mp3`,
      short: `${CDN}/general/madinah-01.mp3`,
      takbir: `${CDN}/general/madinah-01.mp3`,
    },
    notificationSound: "adhan-short-takbeerat.caf",
  },
];

/** معرفات المؤذنين المضمّنة أوفلاين في الحزمة */
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

/** توافق المسارات القديمة `/sounds/adhan/*` → الجديدة */
const LEGACY_SOUND_ALIASES: Record<string, string> = {
  "/sounds/adhan/makkah-general.mp3": "/audio/adhan/adhan-makkah-full.mp3",
  "/sounds/adhan/makkah-fajr.mp3": "/audio/adhan/adhan-makkah-fajr.mp3",
  "/sounds/adhan/madinah-general.mp3": "/audio/adhan/adhan-madinah-full.mp3",
  "/sounds/adhan/egypt-general.mp3": "/audio/adhan/adhan-egypt-full.mp3",
  "/sounds/adhan/aqsa-general.mp3": "/audio/adhan/adhan-aqsa-full.mp3",
  "/sounds/adhan/takbeerat-short.mp3": "/audio/adhan/adhan-takbeerat-short.mp3",
};

export function getOfflineAdhanPack(id: string): OfflineAdhanPack | undefined {
  return byId.get(id);
}

export function isOfflineFeaturedMuezzin(id: string): boolean {
  return (OFFLINE_FEATURED_MUEZZIN_IDS as readonly string[]).includes(id);
}

/** يفضّل المسار المحلي إن وُجد، وإلا البعيد. */
export function resolveOfflineClipUrl(
  packId: string,
  kind: OfflineAdhanClipKind,
): string | null {
  const pack = byId.get(packId);
  if (!pack) return null;
  return pack.local[kind] || pack.remote[kind] || null;
}

/**
 * إن كان الرابط البعيد له نظير محلي معروف، أعد المحلي (للتشغيل الفوري بلا شبكة).
 * وإلا أعد الرابط كما هو.
 */
export function preferLocalAdhanUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/audio/adhan/")) return url;
  if (LEGACY_SOUND_ALIASES[url]) return LEGACY_SOUND_ALIASES[url]!;
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

/** قائمة مسارات محلية للـ Service Worker precache */
export function listBundledAdhanSoundPaths(): string[] {
  const set = new Set<string>();
  for (const pack of OFFLINE_ADHAN_CORE_PACKS) {
    for (const path of Object.values(pack.local)) {
      if (path) set.add(path);
    }
  }
  return [...set];
}

/** صوت الإشعار القصير المرتبط بتسجيل الأذان */
export function notificationSoundForAdhanPack(packId: string): string | null {
  return byId.get(packId)?.notificationSound ?? null;
}
