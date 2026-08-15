/**
 * خريطة أصول الأذان الأوفلاين — مسارات محلية خفيفة أولاً ثم CDN.
 * الصيغة المفضّلة: Opus/WebM ~48kbps mono؛ الحالي: MP3 مضغوط ≤500KB للحزمة.
 * التشغيل يستخدم Cache API عبر adhan-downloads عند توفر نسخة مخزّنة.
 */

export type OfflineAdhanClipKind = "general" | "fajr" | "short" | "takbir";

export type OfflineAdhanPack = {
  id: string;
  labelAr: string;
  /** مسارات محلية اختيارية تحت /sounds/adhan */
  local: Partial<Record<OfflineAdhanClipKind, string>>;
  /** روابط CDN كاملة (fallback / تنزيل للكاش) */
  remote: Partial<Record<OfflineAdhanClipKind, string>>;
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
      short: "/sounds/adhan/takbeerat-short.mp3",
      takbir: "/sounds/adhan/takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/makkah-haram-02.mp3`,
      fajr: `${CDN}/fajr/makkah-fajr-01.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
  },
  {
    id: "madinah",
    labelAr: "أذان المدينة المنورة",
    local: {
      general: "/audio/adhan/adhan-madinah-full.mp3",
      short: "/sounds/adhan/takbeerat-short.mp3",
      takbir: "/sounds/adhan/takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/madinah-02.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
  },
  {
    id: "egypt",
    labelAr: "الأذان المصري",
    local: {
      general: "/audio/adhan/adhan-egypt-full.mp3",
      short: "/sounds/adhan/takbeerat-short.mp3",
      takbir: "/sounds/adhan/takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/egypt-traditional-02.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
  },
  {
    id: "aqsa",
    labelAr: "أذان المسجد الأقصى",
    local: {
      general: "/audio/adhan/adhan-aqsa-full.mp3",
      short: "/sounds/adhan/takbeerat-short.mp3",
      takbir: "/sounds/adhan/takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/al-aqsa-jerusalem-02.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
  },
  {
    id: "turkey",
    labelAr: "الأذان التركي",
    local: {
      general: "/audio/adhan/adhan-turkey-full.mp3",
      short: "/sounds/adhan/takbeerat-short.mp3",
      takbir: "/sounds/adhan/takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/mustafa-ozcan-turkey-01.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
  },
  {
    id: "kuwait",
    labelAr: "أذان خليجي / كويتي",
    local: {
      general: "/audio/adhan/adhan-kuwait-full.mp3",
      short: "/sounds/adhan/takbeerat-short.mp3",
      takbir: "/sounds/adhan/takbeerat-short.mp3",
    },
    remote: {
      general: `${CDN}/general/uae-01.mp3`,
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
    },
  },
  {
    id: "takbeerat",
    labelAr: "تكبيرات قصيرة",
    local: {
      short: "/sounds/adhan/takbeerat-short.mp3",
      takbir: "/sounds/adhan/takbeerat-short.mp3",
      general: "/sounds/adhan/takbeerat-short.mp3",
    },
    remote: {
      short: `${CDN}/general/madinah-02.mp3`,
      takbir: `${CDN}/general/madinah-02.mp3`,
      general: `${CDN}/general/madinah-02.mp3`,
    },
  },
];

/** معرفات المؤذنين المضمّنة أوفلاين في الحزمة */
export const OFFLINE_FEATURED_MUEZZIN_IDS = [
  "makkah",
  "madinah",
  "egypt",
  "aqsa",
  "turkey",
  "kuwait",
  "takbeerat",
] as const;

const byId = new Map(OFFLINE_ADHAN_CORE_PACKS.map((p) => [p.id, p]));

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
  if (url.startsWith("/sounds/adhan/") || url.startsWith("/audio/adhan/")) return url;
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
