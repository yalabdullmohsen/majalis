/**
 * تحميل مسبق لوجهة البطاقة عند pointerdown — انتقال يبدو فوريًا.
 */
import { prefetchAppRoutesShell } from "@/lib/prefetch-app-routes";

const seen = new Set<string>();

const CHUNK: Record<string, () => Promise<unknown>> = {
  "/hadith": () => import("@/pages/hadith/HadithPage"),
  "/hadith/sahih": () => import("@/pages/hadith/HadithSahihPage"),
  "/hadith/daif": () => import("@/pages/hadith/HadithDaifPage"),
  "/hadith/mawdu": () => import("@/pages/hadith/HadithMawduPage"),
  "/hadith/books": () => import("@/pages/hadith/HadithBooksPage"),
  "/arbaeen-nawawi": () => import("@/pages/hadith/ArbaeenNawawiPage"),
  "/hadith-science": () => import("@/pages/hadith/HadithSciencePage"),
  "/quran-hub": () => import("@/pages/quran/QuranHubPage"),
  "/mushaf": () => import("@/pages/quran/MushafReaderPage"),
  "/tafsir": () => import("@/pages/quran/TafsirPage"),
  "/ulum-quran": () => import("@/pages/quran/UlumQuranPage"),
  "/quran-hub/seven-ahruf": () => import("@/pages/quran/QuranSevenAhrufPage"),
  "/lessons": () => import("@/pages/lessons/LessonsPage"),
  "/lessons/archive": () => import("@/pages/lessons/LessonsArchivePage"),
  "/prayer-times": () => import("@/pages/worship/PrayerTimesPage"),
  "/adhkar": () => import("@/pages/worship/AdhkarPage"),
  "/daily-wird": () => import("@/pages/worship/DailyWirdPage"),
  "/fiqh": () => import("@/pages/fiqh/FiqhPage"),
  "/fiqh/usul": () => import("@/pages/fiqh/FiqhUsulPage"),
  "/sections": () => import("@/pages/account/SectionsPage"),
  "/tawhid": () => import("@/views/TawhidPage"),
  "/islamic-history": () => import("@/views/TarikhIslamiPage"),
  "/tarikh-islami": () => import("@/views/TarikhIslamiPage"),
  "/miracles": () => import("@/views/MiraclesPage"),
  "/islamic-glossary": () => import("@/pages/account/IslamicGlossaryPage"),
  "/akhlaq": () => import("@/views/AkhlaqPage"),
  "/islamic-stories": () => import("@/views/IslamicStoriesPage"),
  "/stories": () => import("@/views/IslamicStoriesPage"),
  "/quiz": () => import("@/pages/account/QuizPage"),
  "/qibla": () => import("@/pages/worship/QiblaPage"),
  "/duas": () => import("@/pages/worship/DuasPage"),
  "/adhan-settings": () => import("@/pages/worship/AdhanSettingsPage"),
  "/calendar": () => import("@/views/CalendarPage"),
  "/quran-circles": () => import("@/pages/quran/QuranCirclesPage"),
};

export function prefetchRoute(href: string): void {
  prefetchAppRoutesShell();
  const path = (href.split("?")[0] || "/").split("#")[0] || "/";
  if (!path || path === "/" || seen.has(path)) return;
  seen.add(path);
  const load = CHUNK[path];
  if (load) void load().catch(() => undefined);
  // بادئات شائعة: /hadith/* → صفحة الحديث إن لم تُسجَّل حرفيًا
  if (!load) {
    const prefix = Object.keys(CHUNK)
      .filter((k) => k !== "/" && path.startsWith(`${k}/`))
      .sort((a, b) => b.length - a.length)[0];
    if (prefix) void CHUNK[prefix]().catch(() => undefined);
  }
  if (typeof document === "undefined") return;
  try {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "document";
    link.href = path;
    document.head.appendChild(link);
  } catch {
    /* تجاهل */
  }
}

/** مسارات أساسية من الرئيسية — للتسخين الجماعي */
export const HOME_WARM_ROUTES = [
  "/quran-hub",
  "/mushaf",
  "/prayer-times",
  "/lessons",
  "/sections",
  "/hadith",
  "/fiqh",
  "/tafsir",
  "/tawhid",
  "/adhkar",
  "/hadith-science",
  "/islamic-glossary",
] as const;

export function prefetchHomeWarmRoutes(): void {
  for (const href of HOME_WARM_ROUTES) prefetchRoute(href);
}
