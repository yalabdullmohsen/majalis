/**
 * تحويل المسار القديم `/mushaf/:surah?ayah=` إلى العقد الموحّد `/mushaf?page=&surah=&ayah=`.
 * كان الخلل: معاملة رقم السورة كرقم صفحة وإسقاط استعلام الآية.
 */
import { SURAH_START_PAGES } from "@/lib/quran-api";
import { clampMushafPage, MUSHAF_PAGE_MAX } from "@/lib/quran-last-page";
import { buildMushafAyahHref, parseMushafNavQuery } from "./href";
import {
  createPendingNavigationHighlight,
  type PendingNavigationHighlight,
} from "./service";
import type { QuranNavigationSource } from "./types";
import { buildQuranAyahReference } from "./validate";

const NAV_SOURCES = new Set<QuranNavigationSource>([
  "prophets-stories",
  "asbab-nuzul",
  "tafsir",
  "search",
  "bookmarks",
  "deep-link",
  "quran-people",
  "other",
]);

function resolveNavSource(raw?: string): QuranNavigationSource {
  if (raw && NAV_SOURCES.has(raw as QuranNavigationSource)) {
    return raw as QuranNavigationSource;
  }
  return "deep-link";
}

export type LegacyMushafSurahRedirectResult = {
  href: string;
  pending: PendingNavigationHighlight | null;
  /** للتشخيص: الصفحة الخاطئة التي كان ينتجها التحويل القديم */
  legacyBuggyPageIfNumericSurah: number | null;
};

/**
 * Pure resolver — قابل للاختبار بلا React.
 */
export function resolveLegacyMushafSurahRedirect(
  surahParam: string,
  search: string,
): LegacyMushafSurahRedirectResult {
  const raw = String(surahParam || "").trim();
  const legacyBuggyPageIfNumericSurah = /^\d+$/.test(raw) ? Number.parseInt(raw, 10) : null;

  if (!/^\d+$/.test(raw)) {
    return { href: "/mushaf", pending: null, legacyBuggyPageIfNumericSurah: null };
  }

  const surahId = Number.parseInt(raw, 10);
  const nav = parseMushafNavQuery(search);
  const ayahId = nav.ayahId;

  if (ayahId != null) {
    const built = buildQuranAyahReference({
      surahId,
      ayahId,
      navigationSource: resolveNavSource(nav.source),
      highlightMode: "navigation",
      sourceRoute: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
    if (built.ok) {
      return {
        href: buildMushafAyahHref(built.ref, { highlight: true }),
        pending: createPendingNavigationHighlight(built.ref),
        legacyBuggyPageIfNumericSurah,
      };
    }
  }

  /* بلا آية: بداية السورة — لا تُعامل رقم السورة كرقم صفحة */
  if (surahId >= 1 && surahId <= 114) {
    const start = SURAH_START_PAGES[surahId - 1];
    if (typeof start === "number" && start >= 1 && start <= MUSHAF_PAGE_MAX) {
      return {
        href: `/mushaf?page=${clampMushafPage(start)}`,
        pending: null,
        legacyBuggyPageIfNumericSurah,
      };
    }
  }

  return { href: "/mushaf", pending: null, legacyBuggyPageIfNumericSurah };
}
