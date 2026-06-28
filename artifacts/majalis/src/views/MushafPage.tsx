import { useCallback, useEffect, useMemo, useState } from "react";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import {
  clampPage,
  fetchMushafPage,
  MUSHAF_LABEL,
  MUSHAF_TOTAL_PAGES,
  prefetchMushafPage,
  readLastMushafPage,
  readMushafBookmarks,
  readMushafZoom,
  toggleMushafBookmark,
  writeLastMushafPage,
  writeMushafZoom,
  type MushafPageData,
} from "@/lib/mushaf";
import { MushafIndexPanel } from "@/components/mushaf/MushafIndexPanel";
import { MushafPageView } from "@/components/mushaf/MushafPageView";
import { MushafToolbar } from "@/components/mushaf/MushafToolbar";
import { PageHeader, Loading } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import "@/styles/mushaf.css";

export default function MushafPage() {
  const { resolvedTheme } = useThemePreference();
  const [page, setPage] = useState(() => readLastMushafPage());
  const [data, setData] = useState<MushafPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(() => readMushafZoom());
  const [indexOpen, setIndexOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => readMushafBookmarks());

  const isNight = resolvedTheme === "dark";
  const isBookmarked = useMemo(() => bookmarks.some((b) => b.page === page), [bookmarks, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMushafPage(page)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          writeLastMushafPage(page);
          prefetchMushafPage(page + 1);
          prefetchMushafPage(page - 1);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "تعذّر تحميل الصفحة");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  const goToPage = useCallback((n: number) => {
    setPage(clampPage(n));
    setIndexOpen(false);
  }, []);

  const onZoomChange = useCallback((z: number) => {
    setZoom(z);
    writeMushafZoom(z);
  }, []);

  const onToggleBookmark = useCallback(() => {
    const next = toggleMushafBookmark(page);
    setBookmarks(next);
  }, [page]);

  const onToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const resumePage = readLastMushafPage();

  return (
    <div className={`page-shell mushaf-page${isNight ? " mushaf-page--night" : ""}${fullscreen ? " mushaf-page--fullscreen" : ""}`}>
      {!fullscreen && (
        <>
          <PageHeader
            eyebrow="القرآن الكريم"
            title="المصحف الشريف"
            subtitle={`${MUSHAF_LABEL} — قراءة صفحات المصحف الورقي`}
          />
          <QuranSubnav active="mushaf" />
        </>
      )}

      <MushafToolbar
        page={page}
        totalPages={MUSHAF_TOTAL_PAGES}
        zoom={zoom}
        isBookmarked={isBookmarked}
        indexOpen={indexOpen}
        onPrev={() => goToPage(page - 1)}
        onNext={() => goToPage(page + 1)}
        onPageChange={goToPage}
        onZoomChange={onZoomChange}
        onToggleIndex={() => setIndexOpen((v) => !v)}
        onToggleBookmark={onToggleBookmark}
        onToggleFullscreen={onToggleFullscreen}
        resumePage={resumePage !== page ? resumePage : null}
        onResume={() => goToPage(resumePage)}
      />

      {indexOpen && (
        <MushafIndexPanel
          currentPage={page}
          bookmarks={bookmarks}
          onSelectPage={goToPage}
          onClose={() => setIndexOpen(false)}
        />
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="mushaf-error ui-card" role="alert">{error}</div>
      ) : data ? (
        <MushafPageView data={data} zoom={zoom} />
      ) : null}
    </div>
  );
}
