import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearch } from "wouter";
import { navigateTo } from "@/lib/navigation-intent";
import { NewMushafReader as MushafViewport } from "@/features/mushaf-reader";
import { applyPageSeo } from "@/lib/seo";
import {
  clampMushafPage,
  loadLastPageSync,
  MUSHAF_PAGE_MAX,
} from "@/lib/quran-last-page";
import { loadReadingAyahKey, SURAH_START_PAGES } from "@/lib/quran-api";
import { ayahKeyToPage } from "@/lib/quran-my-bookmarks";
import { useNavigationPaintGate } from "@/hooks/useNavigationPaintGate";
import { ScriptureScreen } from "@/components/design-system/screens";
import { migrateMushafUserData, isMushafReaderV2Enabled } from "@/lib/mushaf-v2";

/**
 * مسار المصحف الحقيقي `/mushaf` — قارئ واحد ثابت؛ رقم الصفحة حالة داخلية.
 * تحديث URL عبر replaceState فقط بعد الالتزام، بلا إعادة تركيب القارئ.
 */
export default function MushafReaderPage() {
  const params = useParams<{ page?: string; surah?: string }>();
  const search = useSearch();
  const paintReady = useNavigationPaintGate(100);
  /** لا تفكّ تركيب القارئ عند كل ?page= — وإلا ينكسر القلب المتتالي والتلاوة */
  const [readerMounted, setReaderMounted] = useState(false);

  /** مصدر الحقيقة للصفحة داخل الجلسة — يُحسب مرة عند الإقلاع فقط */
  const bootPageRef = useRef<number | null>(null);
  if (bootPageRef.current == null) {
    bootPageRef.current = resolvePage(params, search);
  }
  const [pageNumber, setPageNumber] = useState(() => bootPageRef.current ?? 1);
  const pageRef = useRef(pageNumber);
  pageRef.current = pageNumber;
  const urlSyncTimer = useRef<number | null>(null);

  useEffect(() => {
    if (paintReady) setReaderMounted(true);
  }, [paintReady]);

  useEffect(() => {
    if (isMushafReaderV2Enabled()) migrateMushafUserData();
  }, []);

  useEffect(() => {
    void import("@/lib/font-ready").then((m) => {
      void m.warmStaticQuranicFonts(["Amiri Quran", "KFGQPC Hafs Uthmanic"]);
    });
  }, []);

  /** مزامنة من URL فقط عند رجوع المتصفح / روابط خارجية — لا أثناء تقليب داخلي */
  useEffect(() => {
    const fromUrl = resolvePage(params, search);
    if (fromUrl !== pageRef.current) setPageNumber(fromUrl);
  }, [params, search]);

  useEffect(() => {
    applyPageSeo({
      path: `/mushaf?page=${pageNumber}`,
      title: `المصحف — صفحة ${pageNumber} | سُنّة`,
      description: "مصحف المدينة الرقمي في سُنّة — نص عثماني من بيانات QPC مع خطوط مضمّنة.",
      keywords: ["المصحف", "القرآن", "مصحف المدينة", "QPC"],
    });
  }, [pageNumber]);

  const syncUrlQuietly = useCallback((n: number) => {
    if (typeof window === "undefined") return;
    const desired = `/mushaf?page=${n}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === desired) return;
    /* replaceState بلا popstate — لا يعيد تركيب المسار ولا يمر عبر wouter */
    window.history.replaceState(window.history.state, "", desired);
  }, []);

  const onPageChange = useCallback(
    (n: number) => {
      const next = clampMushafPage(n);
      setPageNumber(next);
      if (urlSyncTimer.current != null) window.clearTimeout(urlSyncTimer.current);
      /* بعد استقرار التقليب — لا تزامن URL في كل إطار سحب */
      urlSyncTimer.current = window.setTimeout(() => {
        urlSyncTimer.current = null;
        syncUrlQuietly(next);
      }, 180);
    },
    [syncUrlQuietly],
  );

  useEffect(() => {
    return () => {
      if (urlSyncTimer.current != null) window.clearTimeout(urlSyncTimer.current);
    };
  }, []);

  if (!readerMounted) {
    return (
      <div
        className="mm-page-placeholder"
        role="status"
        aria-busy="true"
        aria-label="تجهيز المصحف"
        style={{ minHeight: "70dvh" }}
        data-mushaf-boot="1"
      />
    );
  }

  return (
    <ScriptureScreen compose="mark">
      <MushafViewport
        pageNumber={pageNumber}
        onPageChange={onPageChange}
        onExit={() => navigateTo("/quran-hub", { mode: "screen" })}
        onIndex={() => navigateTo("/quran-hub", { mode: "screen" })}
      />
    </ScriptureScreen>
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

  const saved = loadLastPageSync();
  const ayahKey = loadReadingAyahKey();
  if (ayahKey) {
    return clampMushafPage(ayahKeyToPage(ayahKey, saved ?? undefined));
  }
  return saved ?? 1;
}
