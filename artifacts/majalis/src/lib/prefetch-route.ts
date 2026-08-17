/**
 * تحميل مسبق لوجهة البطاقة عند pointerdown — انتقال يبدو فوريًا.
 */
const seen = new Set<string>();

const CHUNK: Record<string, () => Promise<unknown>> = {
  "/quran-hub": () => import("@/pages/quran/QuranHubPage"),
  "/mushaf": () => import("@/pages/quran/MushafReaderPage"),
  "/lessons": () => import("@/pages/lessons/LessonsPage"),
  "/lessons/archive": () => import("@/pages/lessons/LessonsArchivePage"),
  "/prayer-times": () => import("@/pages/worship/PrayerTimesPage"),
  "/fiqh": () => import("@/pages/fiqh/FiqhPage"),
  "/sections": () => import("@/pages/account/SectionsPage"),
  "/qibla": () => import("@/pages/worship/QiblaPage"),
  "/duas": () => import("@/pages/worship/DuasPage"),
  "/adhan-settings": () => import("@/pages/worship/AdhanSettingsPage"),
  "/calendar": () => import("@/views/CalendarPage"),
  "/quran-circles": () => import("@/pages/quran/QuranCirclesPage"),
};

export function prefetchRoute(href: string): void {
  const path = (href.split("?")[0] || "/").split("#")[0] || "/";
  if (seen.has(path)) return;
  seen.add(path);
  const load = CHUNK[path];
  if (load) void load().catch(() => undefined);
  if (typeof document === "undefined") return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = path;
  document.head.appendChild(link);
}
