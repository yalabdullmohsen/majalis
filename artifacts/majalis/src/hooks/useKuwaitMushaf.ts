import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clampPage,
  getPageMeta,
  getSurahStartPage,
  getJuzStartPage,
  getHizbStartPage,
  getQuarterStartPage,
  MUSHAF_TOTAL_PAGES,
} from "@/lib/mushaf/kuwait-mushaf-data";
import {
  getLastMushafPage,
  saveLastMushafPage,
  getMushafPrefs,
  saveMushafPrefs,
  getMushafBookmarks,
  addMushafBookmark,
  removeMushafBookmark,
  getReadHistory,
  isPageBookmarked,
  type MushafBookmark,
  type MushafPrefs,
  type MushafHistoryEntry,
} from "@/lib/mushaf/mushaf-storage";
import { preloadMushafPages, clearMushafPageCache } from "@/lib/mushaf/mushaf-page-loader";
import { resolveAyahPage } from "@/lib/mushaf/mushaf-search";
import { estimateAyahsOnPage } from "@/lib/mushaf/mushaf-page-info";

export type KuwaitMushafInit = {
  page?: number;
  surah?: number;
  ayah?: number;
};

export function useKuwaitMushaf(initial?: KuwaitMushafInit) {
  const [page, setPageRaw] = useState(() => initial?.page ?? getLastMushafPage() ?? 1);
  const [prefs, setPrefsState] = useState<MushafPrefs>(() => getMushafPrefs());
  const [bookmarks, setBookmarks] = useState<MushafBookmark[]>(() => getMushafBookmarks());
  const [readHistory, setReadHistory] = useState<MushafHistoryEntry[]>(() => getReadHistory());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const ayahResolved = useRef(false);

  const theme: "light" | "dark" = prefs.nightMode ? "dark" : "light";

  const setPage = useCallback((next: number) => {
    const clamped = clampPage(next);
    setPageRaw(clamped);
    saveLastMushafPage(clamped);
    setReadHistory(getReadHistory());
  }, []);

  const pageMeta = useMemo(() => getPageMeta(page), [page]);
  const spreadSecondPage = prefs.dualPage && page < MUSHAF_TOTAL_PAGES ? page + 1 : null;
  const ayahCountEstimate = useMemo(() => estimateAyahsOnPage(page), [page]);
  const bookmarked = useMemo(() => isPageBookmarked(page), [page, bookmarks]);

  useEffect(() => {
    const pages = prefs.dualPage && spreadSecondPage
      ? [page - 1, page, page + 1, page + 2, spreadSecondPage + 1]
      : [page - 1, page + 1, page + 2];
    preloadMushafPages(pages, theme);
  }, [page, theme, prefs.dualPage, spreadSecondPage]);

  useEffect(() => {
    clearMushafPageCache();
  }, [theme]);

  useEffect(() => {
    if (ayahResolved.current || !initial?.surah || !initial?.ayah) return;
    ayahResolved.current = true;
    void resolveAyahPage(initial.surah, initial.ayah).then(setPage);
  }, [initial?.surah, initial?.ayah, setPage]);

  const setPref = useCallback((patch: Partial<MushafPrefs>) => {
    setPrefsState((prev) => saveMushafPrefs({ ...prev, ...patch }));
  }, []);

  const goToSurah = useCallback((surah: number) => setPage(getSurahStartPage(surah)), [setPage]);
  const goToJuz = useCallback((juz: number) => setPage(getJuzStartPage(juz)), [setPage]);
  const goToHizb = useCallback((hizb: number) => setPage(getHizbStartPage(hizb)), [setPage]);
  const goToQuarter = useCallback((quarter: number) => setPage(getQuarterStartPage(quarter)), [setPage]);

  const goToAyah = useCallback(
    async (surah: number, ayah: number) => {
      const p = await resolveAyahPage(surah, ayah);
      setPage(p);
    },
    [setPage],
  );

  const goNext = useCallback(() => {
    if (page < MUSHAF_TOTAL_PAGES) setPage(page + 1);
  }, [page, setPage]);

  const goPrev = useCallback(() => {
    if (page > 1) setPage(page - 1);
  }, [page, setPage]);

  const resumeLast = useCallback(() => {
    const last = getLastMushafPage();
    if (last) setPage(last);
  }, [setPage]);

  const bookmarkCurrent = useCallback(
    (label?: string) => {
      const next = addMushafBookmark({
        page,
        label: label ?? `صفحة ${page} — ${pageMeta.surahName}`,
        surah: pageMeta.surah,
      });
      setBookmarks(next);
    },
    [page, pageMeta.surah, pageMeta.surahName],
  );

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(removeMushafBookmark(id));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  const copyPageNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(page));
    } catch {
      /* ignore */
    }
  }, [page]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Home") {
        e.preventDefault();
        setPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        setPage(MUSHAF_TOTAL_PAGES);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, setPage]);

  return {
    page,
    setPage,
    pageMeta,
    spreadSecondPage,
    ayahCountEstimate,
    totalPages: MUSHAF_TOTAL_PAGES,
    prefs,
    setPref,
    theme,
    sidebarOpen,
    setSidebarOpen,
    fullscreen,
    toggleFullscreen,
    goToSurah,
    goToJuz,
    goToHizb,
    goToQuarter,
    goToAyah,
    goNext,
    goPrev,
    resumeLast,
    bookmarks,
    readHistory,
    bookmarked,
    bookmarkCurrent,
    removeBookmark,
    copyPageNumber,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < MUSHAF_TOTAL_PAGES ? page + 1 : null,
  };
}

export type KuwaitMushafState = ReturnType<typeof useKuwaitMushaf>;
