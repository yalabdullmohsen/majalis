import { useCallback, useEffect, useMemo, useState } from "react";
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
  type MushafBookmark,
  type MushafPrefs,
} from "@/lib/mushaf/mushaf-storage";
import { preloadMushafPages, clearMushafPageCache } from "@/lib/mushaf/mushaf-page-loader";
import { resolveAyahPage } from "@/lib/mushaf/mushaf-search";

export function useKuwaitMushaf(initialPage?: number) {
  const [page, setPageRaw] = useState(() => initialPage ?? getLastMushafPage() ?? 1);
  const [prefs, setPrefsState] = useState<MushafPrefs>(() => getMushafPrefs());
  const [bookmarks, setBookmarks] = useState<MushafBookmark[]>(() => getMushafBookmarks());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const theme: "light" | "dark" = prefs.nightMode ? "dark" : "light";

  const setPage = useCallback((next: number) => {
    const clamped = clampPage(next);
    setPageRaw(clamped);
    saveLastMushafPage(clamped);
  }, []);

  const pageMeta = useMemo(() => getPageMeta(page), [page]);

  useEffect(() => {
    preloadMushafPages([page - 1, page + 1, page + 2], theme);
  }, [page, theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
  }, [page]);

  useEffect(() => {
    clearMushafPageCache();
  }, [theme]);

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

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  return {
    page,
    setPage,
    pageMeta,
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
    resumeLast,
    bookmarks,
    bookmarkCurrent,
    removeBookmark,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < MUSHAF_TOTAL_PAGES ? page + 1 : null,
  };
}

export type KuwaitMushafState = ReturnType<typeof useKuwaitMushaf>;
