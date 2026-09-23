import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearch } from "wouter";
import { navigateTo } from "@/lib/navigation-intent";
import { NewMushafReader as MushafViewport } from "@/features/mushaf-reader";
import { MushafAppearanceProvider } from "@/lib/mushaf-v2";
import { applyPageSeo } from "@/lib/seo";
import {
  clampMushafPage,
  loadLastPageSync,
  MUSHAF_PAGE_MAX,
} from "@/lib/quran-last-page";
import { loadReadingAyahKey, SURAH_START_PAGES } from "@/lib/quran-api";
import { ayahKeyToPage } from "@/lib/quran-ayah-page";
import { useNavigationPaintGate } from "@/hooks/useNavigationPaintGate";
import { ScriptureScreen } from "@/components/design-system/screens";
import { migrateMushafUserData, isMushafReaderV2Enabled } from "@/lib/mushaf-v2";
import {
  QuranNavigationService,
  buildQuranAyahReference,
  createPendingNavigationHighlight,
  parseMushafNavQuery,
  peekPendingNavigationHighlight,
  stashPendingNavigationHighlight,
  type QuranNavigationSource,
} from "@/lib/quran-navigation";

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

  /** deep-link خارجي يحمل surah+ayah+highlight — خزّن طلب التحديد */
  useEffect(() => {
    const nav = parseMushafNavQuery(search);
    if (nav.surahId == null || nav.ayahId == null || !nav.highlight) return;
    const built = buildQuranAyahReference({
      surahId: nav.surahId,
      ayahId: nav.ayahId,
      navigationSource: resolveNavSource(nav.source),
      highlightMode: "navigation",
    });
    if (!built.ok) return;
    stashPendingNavigationHighlight(createPendingNavigationHighlight(built.ref));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ssunnah:quran-nav-pending"));
    }
  }, [search]);

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
    window.history.replaceState(window.history.state, "", desired);
  }, []);

  const onPageChange = useCallback(
    (n: number) => {
      const next = clampMushafPage(n);
      setPageNumber(next);
      if (urlSyncTimer.current != null) window.clearTimeout(urlSyncTimer.current);
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
      <MushafAppearanceProvider>
        <MushafViewport
          pageNumber={pageNumber}
          onPageChange={onPageChange}
          onExit={() => QuranNavigationService.exitToReturnContext("/quran-hub")}
          onIndex={() => navigateTo("/quran-hub", { mode: "screen" })}
        />
      </MushafAppearanceProvider>
    </ScriptureScreen>
  );
}

function resolvePage(
  params: { page?: string; surah?: string },
  search: string,
): number {
  const nav = parseMushafNavQuery(search);
  /* Intent مباشر (سورة+آية) أعلى من Last Position */
  if (nav.surahId != null && nav.ayahId != null) {
    const built = buildQuranAyahReference({
      surahId: nav.surahId,
      ayahId: nav.ayahId,
      navigationSource: "deep-link",
    });
    if (built.ok) return clampMushafPage(built.ref.pageNumber);
  }
  if (peekPendingNavigationHighlight()) {
    const pending = peekPendingNavigationHighlight();
    if (pending) return clampMushafPage(pending.pageNumber);
  }
  if (nav.page != null) return clampMushafPage(nav.page);

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
