import { useEffect, useMemo } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { MushafViewport } from "@/features/mushaf-madinah";
import { applyPageSeo } from "@/lib/seo";
import {
  clampMushafPage,
  loadLastPageSync,
  MUSHAF_PAGE_MAX,
} from "@/lib/quran-last-page";
import { SURAH_START_PAGES } from "@/lib/quran-api";

/**
 * مسار المصحف الحقيقي `/mushaf` — VerifiedMushafReader عبر alias MushafViewport، بلا PDF.
 */
export default function MushafReaderPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ page?: string; surah?: string }>();
  const search = useSearch();

  const pageNumber = useMemo(() => resolvePage(params, search), [params, search]);

  useEffect(() => {
    applyPageSeo({
      path: `/mushaf?page=${pageNumber}`,
      title: `المصحف — صفحة ${pageNumber} | المجلس العلمي`,
      description: "مصحف المدينة الرقمي في المجلس العلمي — نص عثماني من بيانات QPC مع خطوط مضمّنة.",
      keywords: ["المصحف", "القرآن", "مصحف المدينة", "QPC"],
    });
  }, [pageNumber]);

  useEffect(() => {
    const desired = `/mushaf?page=${pageNumber}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (!params.page && !params.surah && current !== desired) {
      window.history.replaceState(null, "", desired);
    }
  }, [pageNumber, params.page, params.surah]);

  return (
    <MushafViewport
      pageNumber={pageNumber}
      onPageChange={(n) => setLocation(`/mushaf?page=${clampMushafPage(n)}`)}
      onExit={() => setLocation("/quran-hub")}
      onIndex={() => setLocation("/quran-hub")}
    />
  );
}

function resolvePage(
  params: { page?: string; surah?: string },
  search: string,
): number {
  const qs = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fromQuery = Number.parseInt(qs.get("page") ?? "", 10);
  if (Number.isFinite(fromQuery)) return clampMushafPage(fromQuery);

  if (params.page) {
    const n = Number.parseInt(params.page, 10);
    if (Number.isFinite(n)) return clampMushafPage(n);
  }

  if (params.surah) {
    const n = Number.parseInt(params.surah, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 114) {
      const start = SURAH_START_PAGES[n - 1];
      if (typeof start === "number" && start >= 1 && start <= MUSHAF_PAGE_MAX) {
        return clampMushafPage(start);
      }
    }
  }

  return loadLastPageSync() ?? 1;
}
