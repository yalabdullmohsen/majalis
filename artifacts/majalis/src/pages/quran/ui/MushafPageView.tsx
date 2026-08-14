import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useLocation } from "wouter";
import {
  Menu, Settings, X, ChevronRight, ChevronLeft, RotateCcw, ArrowRight, Bookmark, Mic, LayoutGrid, MoreHorizontal,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd, surahJsonLd } from "@/lib/seo-structured-data";
import { toArabicDigits } from "@/lib/utils";
import { toArabicPageDigits } from "@/lib/numerals";
import {
  fetchSurahDetail, getSurahList, getSurahMeta, getSurahForPage, SURAH_START_PAGES,
  savePagePosition, loadPagePosition, loadReadingAyahKey,
  formatRubElHizbFooterLabel,
  type Ayah, type SurahSummary,
} from "@/lib/quran-api";
import { loadPageJuzIndex, getSegmentsForPage, findPageForAyah, type QuranSegment } from "@/lib/recitation-ai/page-juz-lookup";
import { useQuranPreferences, type QuranReadingTheme, type QuranFrameStyle, type QuranHighlightStyle } from "@/hooks/useQuranPreferences";
import { useReadingBreakReminder } from "@/hooks/useReadingBreakReminder";
import { useAyahPlayer } from "@/hooks/useAyahPlayer";
import { useKeepAwake } from "@/hooks/useKeepAwake";
import { useRestoreLastPage } from "@/hooks/useRestoreLastPage";
import { useImmersiveSystemUi } from "@/hooks/useImmersiveSystemUi";
import { useMushafPageFlip } from "@/hooks/useMushafPageFlip";
import { AYAH_MUSHAF_PAPER_BG } from "@/lib/quran-immersive";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { addBookmark as addPageBookmark, isPageBookmarked } from "@/lib/quran-my-bookmarks";
import { SurahList } from "@/components/quran/SurahList";
import { PageAyahActionSheet } from "@/components/quran/PageAyahActionSheet";
import { ReadingBreakDialog } from "@/components/quran/ReadingBreakDialog";
import { JumpPageModal } from "@/components/quran/JumpPageModal";
import { MushafPageFlipStage } from "@/components/quran/MushafPageFlipStage";
import { ReciterDownloadManager } from "@/components/quran/ReciterDownloadManager";
import { loadMushafPage, prefetchMushafPage, type MushafPageLayout } from "@/lib/mushaf-v2-data";
import { ensureMushafPageFont } from "@/hooks/useMushafPageFont";
import { getMushafSpread, prefersMushafSpread } from "@/lib/mushaf-spread";
import { FONT_OPTIONS } from "@/lib/quran-font-options";
import {
  QURAN_FONT_DEFAULT_PX,
  QURAN_FONT_MAX_PX,
  QURAN_FONT_MIN_PX,
  QURAN_FONT_STEP_PX,
} from "@/lib/quran-font-size";
import { beginAbortScope, abortScope, guardAsync } from "@/lib/route-abort";
import { logDiagnostic } from "@/lib/diagnostics";
import { MushafPageV2 } from "@/components/quran/MushafPageV2";
import { QpcFontPackBanner } from "@/components/quran/QpcFontPackBanner";
import { MushafPageCartoucheSvg } from "@/components/quran/MushafOrnaments";
import { MushafPageProgressRail } from "@/components/quran/MushafPageProgressRail";
import { MushafBottomPager } from "@/components/quran/MushafBottomPager";
import { MushafLayeredPage, MUSHAF_OPTICAL_FONT_SCALE } from "@/features/mushaf";
import { getPreviousInternalRoute, goBackOrFallback, normalizeNavPath } from "@/lib/navigation-back";
import {
  captureMushafEntryOrigin,
  consumeMushafEntryOrigin,
} from "@/lib/mushaf-entry-origin";
import { handoffMushafPlayback, showMiniPlayer } from "@/lib/quran-mini-player";
import { hasMushafUnsavedWork, setMushafUnsavedWork } from "@/lib/mushaf-unsaved";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { afterNextPaint, yieldToMain } from "@/lib/yield-to-main";
import { AudioEngine } from "@/core/audio/AudioEngine";
import { useMushafRecitationFollow } from "@/hooks/useMushafRecitationFollow";
import "@/styles/quran.css";
import "@/styles/mushaf-v2.css";
import "@/styles/pages/mushaf-reader.css";
import "@/styles/quran-immersive-reader.css";

const TOTAL_PAGES = 604;

type SegmentAyahs = { segment: QuranSegment; ayahs: Ayah[] };

function clampPage(n: number): number {
  return Math.min(TOTAL_PAGES, Math.max(1, n));
}

const THEME_OPTIONS: { id: QuranReadingTheme; label: string }[] = [
  { id: "standard", label: "افتراضي" },
  { id: "warm", label: "سيبيا" },
  { id: "night", label: "ليلي" },
  { id: "high-contrast", label: "عالي التباين" },
];
const FRAME_OPTIONS: { id: QuranFrameStyle; label: string }[] = [
  { id: "emerald", label: "زمردي" },
  { id: "gold-classic", label: "ذهبي كلاسيكي" },
  { id: "paper", label: "ورقي" },
  { id: "minimal", label: "بسيط" },
  { id: "none", label: "بلا إطار" },
];
const HIGHLIGHT_OPTIONS: { id: QuranHighlightStyle; label: string }[] = [
  { id: "wash", label: "تظليل شفاف" },
  { id: "border", label: "إطار رفيع" },
  { id: "underline", label: "خط سفلي" },
  { id: "text-color", label: "لون النص" },
  { id: "spotlight", label: "مصباح القراءة" },
  { id: "side-indicator", label: "مؤشر جانبي" },
];
/* وضع «خفيف» أُلغي بصريًا — مسار QPC موحّد دائمًا عبر --mushaf-scale */

export default function MushafPageView() {
  // مُثبَّت أيضًا على المسار القديم /mushaf/:surah (رقم سورة) — يُحوَّل
  // مباشرة لأول صفحته عبر SURAH_START_PAGES، دون مسار/مكوّن منفصل مكرَّر.
  const params = useParams<{ page?: string; surah?: string }>();
  const [location, navigate] = useLocation();
  const { prefs, setPref } = useQuranPreferences();
  const { resolvedTheme } = useThemePreference();
  const breakReminder = useReadingBreakReminder();
  /** Keep screen lit while the mushaf page is open (expo-keep-awake port). */
  useKeepAwake();
  /** Flutter SystemChrome.immersiveSticky — hide StatusBar / app chrome on /mushaf.
   * Ayah warm paper `#FAF7F2` for standard/warm; night & site-dark keep contrast. */
  const siteDarkMushaf =
    resolvedTheme === "dark" &&
    prefs.readingTheme !== "warm" &&
    prefs.readingTheme !== "high-contrast";
  const immersivePaper =
    prefs.readingTheme === "night" || siteDarkMushaf
      ? "#0F172A"
      : prefs.readingTheme === "high-contrast"
        ? "#ffffff"
        : AYAH_MUSHAF_PAPER_BG;
  useImmersiveSystemUi(true, immersivePaper);

  const routePage = params.page
    ? Number(params.page)
    : params.surah && Number(params.surah) >= 1 && Number(params.surah) <= 114
      ? SURAH_START_PAGES[Number(params.surah) - 1]
      : null;
  const [page, setPageState] = useState<number>(() => clampPage(routePage ?? loadPagePosition() ?? 1));
  /**
   * RN sketch: storageService.getLastPage / loadLastPage on mount when URL has no explicit page.
   * Sync init already uses loadPagePosition (falls back to `lastPage`);
   * this async restore mirrors the AsyncStorage useEffect.
   */
  useRestoreLastPage({
    enabled: !routePage,
    onRestore: (saved) => setPageState(clampPage(saved)),
  });
  const [segAyahs, setSegAyahs] = useState<SegmentAyahs[] | null>(null);
  const [v2Layout, setV2Layout] = useState<MushafPageLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isJumpModalVisible, setIsJumpModalVisible] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<{ surah: number; ayah: number } | null>(null);
  /** تمييز استئناف القراءة دون فتح شيت الإجراءات. */
  const [resumeAyahKey, setResumeAyahKey] = useState<string | null>(() => loadReadingAyahKey());
  const [resumeBanner, setResumeBanner] = useState<number | null>(null);
  const [jumpSurah, setJumpSurah] = useState(1);
  const [jumpAyah, setJumpAyah] = useState(1);
  /* تجربة قراءة غامرة بنمط "آية": افتراضيًا الأدوات مخفية (رأس/شارة فقط)؛
     نقرة وسط الصفحة تُظهر الشريط؛ يختفي بعد خمول أو عند بدء السحب. */
  const [textChromeVisible, setTextChromeVisible] = useState(false);
  const [toolbarMoreOpen, setToolbarMoreOpen] = useState(false);
  const chromeIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearChromeIdle = useCallback(() => {
    if (chromeIdleTimerRef.current) {
      clearTimeout(chromeIdleTimerRef.current);
      chromeIdleTimerRef.current = null;
    }
  }, []);

  const hideChrome = useCallback(() => {
    setTextChromeVisible(false);
  }, []);

  const toggleChrome = useCallback(() => {
    setTextChromeVisible((v) => !v);
  }, []);

  useEffect(() => {
    if (!textChromeVisible) {
      clearChromeIdle();
      return;
    }
    clearChromeIdle();
    chromeIdleTimerRef.current = setTimeout(() => {
      setTextChromeVisible(false);
      chromeIdleTimerRef.current = null;
    }, 3200);
    return clearChromeIdle;
  }, [textChromeVisible, page, clearChromeIdle]);

  useEffect(() => {
    if (!textChromeVisible) setToolbarMoreOpen(false);
  }, [textChromeVisible]);
  const [bookmarkStatus, setBookmarkStatus] = useState<string | null>(null);
  const [pageBookmarked, setPageBookmarked] = useState(() => isPageBookmarked(page));
  const flipStageRef = useRef<HTMLDivElement | null>(null);
  const [neighborLayouts, setNeighborLayouts] = useState<{
    prev: MushafPageLayout | null;
    next: MushafPageLayout | null;
    spreadLeft: MushafPageLayout | null;
  }>({ prev: null, next: null, spreadLeft: null });
  const [spreadEnabled, setSpreadEnabled] = useState(false);

  // ── استئناف تلقائي: عند الدخول دون رقم صفحة صريح في الرابط، نبدأ من آخر موضع محفوظ محليًا ──
  useEffect(() => {
    if (!routePage) {
      const saved = loadPagePosition();
      if (saved && saved !== 1) setResumeBanner(saved);
    }
  }, []);

  useEffect(() => {
    const prev = getPreviousInternalRoute(location);
    captureMushafEntryOrigin(prev);
  }, [location]);

  useEffect(() => {
    if (routePage) setPageState(clampPage(routePage));
  }, [routePage]);

  /** Deep link: /mushaf/page/:n?ayah=2:255 أو /mushaf?ayah=… */
  useEffect(() => {
    const q = location.includes("?") ? location.slice(location.indexOf("?") + 1) : "";
    const ayahParam = new URLSearchParams(q).get("ayah");
    if (!ayahParam) return;
    const [s, a] = ayahParam.split(":").map(Number);
    if (s >= 1 && s <= 114 && a >= 1) {
      setSelectedAyah({ surah: s, ayah: a });
    }
  }, [location]);

  useEffect(() => {
    const ayahKey = selectedAyah
      ? `${selectedAyah.surah}:${selectedAyah.ayah}`
      : undefined;
    savePagePosition(page, ayahKey);
    setPageBookmarked(isPageBookmarked(page));
  }, [page, selectedAyah]);

  useEffect(() => {
    if (!bookmarkStatus) return;
    const t = window.setTimeout(() => setBookmarkStatus(null), 2000);
    return () => window.clearTimeout(t);
  }, [bookmarkStatus]);

  // يمنع تمرير الصفحة الأساسية خلف الوضع الغامر (نفس نمط
  // body.assistant-panel-open القائم فعلاً لنوافذ أخرى في التطبيق) —
  // ضروري خصوصًا على iOS Safari حيث التمرير خلف عنصر fixed مشكلة معروفة.
  useEffect(() => {
    document.body.classList.add("has-immersive-mushaf");
    return () => document.body.classList.remove("has-immersive-mushaf");
  }, []);

  const surahs = useMemo<SurahSummary[]>(
    () => getSurahList().map((s) => ({
      number: s.number, name: s.name, englishName: "", englishNameTranslation: "",
      numberOfAyahs: s.ayahs, revelationType: s.revelation === "مدنية" ? "Medinan" : "Meccan",
    })),
    [],
  );

  // ── تحميل محتوى الصفحة (نص) — يعتمد على فهرس page-juz-index.json + fetchSurahDetail المحليّين الموجودين فعلاً ──
  const loadPage = useCallback(async (p: number, { silent }: { silent?: boolean } = {}) => {
    if (!silent) { setLoading(true); setError(false); }
    try {
      // Yield so page-switch click/touch paint lands before heavy JSON work (INP).
      if (!silent) await afterNextPaint();
      else await yieldToMain();
      const index = await loadPageJuzIndex();
      await yieldToMain();
      const segments = getSegmentsForPage(index, p);
      if (segments.length === 0) throw new Error("لا مقاطع لهذه الصفحة");
      const details = await Promise.all(segments.map((s) => fetchSurahDetail(s.surah)));
      await yieldToMain();
      const result: SegmentAyahs[] = segments.map((seg, i) => ({
        segment: seg,
        ayahs: details[i].ayahs
          .filter((a) => a.numberInSurah >= seg.ayahFrom && a.numberInSurah <= seg.ayahTo)
          .map((a) => ({ ...a, surahNumber: seg.surah })),
      }));
      if (!silent) setSegAyahs(result);
      return result;
    } catch {
      if (!silent) setError(true);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const signal = beginAbortScope(`mushaf-page:${page}`);
    void guardAsync(signal, async () => {
      await loadPage(page);
      if (signal.aborted) return;
      if (page > 1) loadPage(page - 1, { silent: true });
      if (page < TOTAL_PAGES) loadPage(page + 1, { silent: true });
    });
    return () => {
      abortScope(`mushaf-page:${page}`);
      logDiagnostic("nav-abort", `mushaf-page:${page}`);
    };
  }, [page, loadPage]);

  // ── تخطيط السطر الحقيقي (line_number) من نفس بيانات quran-v2 — مصدر
  // واحد يُستهلَك من كلا وضعي العرض (خفيف/دقة مطبعية)، لا تحميل مزدوج. ──
  useEffect(() => {
    const signal = beginAbortScope(`mushaf-layout:${page}`);
    setV2Layout(null);
    void guardAsync(signal, async () => {
      const layout = await loadMushafPage(page);
      if (signal.aborted) return;
      setV2Layout(layout);
    }).catch(() => {});
    if (page > 1) prefetchMushafPage(page - 1);
    if (page < TOTAL_PAGES) prefetchMushafPage(page + 1);
    /* تحميل مسبق لخطوط الصفحة الحالية والجيران + خط بسملة الفاتحة */
    void ensureMushafPageFont(page).catch(() => {});
    void ensureMushafPageFont(1).catch(() => {});
    if (page > 1) void ensureMushafPageFont(page - 1).catch(() => {});
    if (page < TOTAL_PAGES) void ensureMushafPageFont(page + 1).catch(() => {});
    /* جيران في الذاكرة لتقليب فوري (تحت الورقة) */
    void guardAsync(signal, async () => {
      const [prev, next] = await Promise.all([
        page > 1 ? loadMushafPage(page - 1) : Promise.resolve(null),
        page < TOTAL_PAGES ? loadMushafPage(page + 1) : Promise.resolve(null),
      ]);
      if (signal.aborted) return;
      setNeighborLayouts((s) => ({ ...s, prev, next }));
    }).catch(() => {});
    /* حزمة التفسير المختصر: الصفحة الحالية ± المجاورتان (خلفية، بلا حجب واجهة) */
    void import("@/features/mushaf/offline-tafsir-pack").then(({ prefetchOfflineTafsirForPage }) => {
      if (signal.aborted) return;
      void prefetchOfflineTafsirForPage(page, { neighbors: true, signal });
    });
    return () => {
      abortScope(`mushaf-layout:${page}`);
    };
  }, [page]);

  useEffect(() => {
    const syncSpread = () => {
      setSpreadEnabled(prefersMushafSpread(window.innerWidth, window.innerHeight));
    };
    syncSpread();
    window.addEventListener("resize", syncSpread);
    return () => window.removeEventListener("resize", syncSpread);
  }, []);

  const spread = useMemo(() => getMushafSpread(page, spreadEnabled), [page, spreadEnabled]);

  useEffect(() => {
    if (!spread.isSpread || spread.left == null) {
      setNeighborLayouts((s) => ({ ...s, spreadLeft: null }));
      return;
    }
    const left = spread.left;
    let cancelled = false;
    void loadMushafPage(left).then((layout) => {
      if (!cancelled) setNeighborLayouts((s) => ({ ...s, spreadLeft: layout }));
    });
    return () => {
      cancelled = true;
    };
  }, [spread.isSpread, spread.left]);

  const primarySegment = segAyahs?.[0];
  const primarySurahMeta = primarySegment ? getSurahMeta(primarySegment.segment.surah) : getSurahForPage(page);
  const firstAyahOfPage = primarySegment?.ayahs[0];
  const juz = v2Layout?.juzNumber ?? firstAyahOfPage?.juz ?? 0;
  /** يمين الرأس: الجزء فقط — الحزب في الذيل عند وجود حد */
  const headerJuzLabel = useMemo(() => {
    if (!juz) return "—";
    return `الجزء ${toArabicDigits(juz)}`;
  }, [juz]);
  /** يسار الرأس: سور تبدأ أو تستمر في الصفحة — بلا كلمة «سورة» · فاصل مسافة */
  const headerSurahNames = useMemo(() => {
    const strip = (raw: string) =>
      String(raw ?? "").replace(/^(?:سُورَةُ|سورة)\s*/u, "").trim();
    const onPage = v2Layout?.surahsOnPage ?? [];
    if (onPage.length) {
      return onPage.map((s) => strip(s.nameArabic ?? "")).filter(Boolean).join(" ");
    }
    const starters = v2Layout?.surahsStartingOnPage ?? [];
    if (starters.length) {
      return starters.map((s) => strip(s.nameArabic ?? "")).filter(Boolean).join(" ");
    }
    return strip(primarySurahMeta.name ?? "");
  }, [v2Layout, primarySurahMeta.name]);
  const pageParity = page % 2 === 1 ? "odd" : "even";
  const mushafScale = prefs.fontScale / QURAN_FONT_DEFAULT_PX;
  /** ذيل: ربع/نصف/ثلاثة أرباع أو بداية حزب */
  const footerMetaLabel = useMemo(() => {
    const rub = v2Layout?.rubElHizbStartingOnPage;
    if (rub != null) {
      const rubLabel = formatRubElHizbFooterLabel(rub, toArabicDigits);
      if (rubLabel) return rubLabel;
    }
    if (v2Layout?.hizbStartingOnPage) {
      return `الحزب ${toArabicDigits(v2Layout.hizbStartingOnPage)}`;
    }
    return null;
  }, [v2Layout?.rubElHizbStartingOnPage, v2Layout?.hizbStartingOnPage]);

  useEffect(() => {
    const path = `/mushaf/page/${page}`;
    const description = `اقرأ صفحة ${page} من المصحف الشريف (سورة ${primarySurahMeta.name}) برواية حفص عن عاصم، بتقسيم مصحف المدينة الحقيقي.`;
    applyPageSeo({
      path,
      title: `صفحة ${page} — ${primarySurahMeta.name} | المصحف الشريف | المجلس العلمي`,
      description,
      keywords: ["المصحف", "صفحات القرآن", primarySurahMeta.name, `صفحة ${page}`],
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        surahJsonLd({
          number: primarySurahMeta.number,
          name: primarySurahMeta.name.replace(/^سُورَةُ\s*/u, ""),
          description,
          url: path,
          ayahCount: primarySurahMeta.ayahs,
        }),
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المصحف", path: "/mushaf" },
          { name: `صفحة ${page}`, path },
        ]),
      ],
    });
  }, [page, primarySurahMeta.name, primarySurahMeta.number, primarySurahMeta.ayahs]);

  const goToPage = useCallback((n: number) => {
    const clamped = clampPage(n);
    setPageState(clamped);
    setSelectedAyah(null);
    setResumeBanner(null);
    navigate(`/mushaf/page/${clamped}`, { replace: true });
  }, [navigate]);

  /** RN addBookmark(page, label) — page separator in `myBookmarks`. */
  const saveCurrentPageBookmark = useCallback(async () => {
    const surahName = primarySurahMeta.name;
    const label = `سورة ${surahName} · ص ${page}`;
    const saved = await addPageBookmark(page, label);
    if (saved) {
      setPageBookmarked(true);
      setBookmarkStatus("تم حفظ الفاصل");
    } else {
      setBookmarkStatus("تعذّر حفظ الفاصل");
    }
  }, [page, primarySurahMeta.name]);

  const goToPageOrAyah = useCallback(async (pageNum: number, opts?: { surah?: number; ayah?: number }) => {
    if (opts?.surah && opts?.ayah) {
      try {
        const idx = await loadPageJuzIndex();
        const found = findPageForAyah(idx, opts.surah, opts.ayah);
        if (found) {
          const clamped = clampPage(found);
          setPageState(clamped);
          setSelectedAyah({ surah: opts.surah, ayah: opts.ayah });
          setResumeBanner(null);
          navigate(`/mushaf/page/${clamped}`, { replace: true });
          return;
        }
      } catch {
        /* فهرس غير متاح — نسقط لأول صفحة السورة إن أمكن */
        if (opts.surah >= 1 && opts.surah <= 114) {
          goToPage(SURAH_START_PAGES[opts.surah - 1]);
          setSelectedAyah({ surah: opts.surah, ayah: opts.ayah });
          return;
        }
      }
    }
    goToPage(pageNum);
  }, [goToPage, navigate]);

  const nextPage = useCallback(() => goToPage(page + 1), [goToPage, page]);
  const prevPage = useCallback(() => goToPage(page - 1), [goToPage, page]);

  const flipDisabled = Boolean(settingsOpen || sidebarOpen || selectedAyah || isJumpModalVisible);

  const { flip, flipHandlers, setFlipWidth } = useMushafPageFlip({
    onNext: nextPage,
    onPrev: prevPage,
    onCenterTap: toggleChrome,
    onFlipStart: hideChrome,
    disabled: flipDisabled,
  });

  useEffect(() => {
    const el = flipStageRef.current;
    if (!el) return;
    const sync = () => setFlipWidth(el.clientWidth || window.innerWidth);
    sync();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [setFlipWidth, page, spread.isSpread]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settingsOpen || sidebarOpen || selectedAyah || isJumpModalVisible) return;
      if (e.key === "ArrowLeft") nextPage();
      else if (e.key === "ArrowRight") prevPage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextPage, prevPage, settingsOpen, sidebarOpen, selectedAyah, isJumpModalVisible]);

  const openJumpModal = useCallback(() => {
    setIsJumpModalVisible(true);
  }, []);

  /** انتقال من نافذة القفز بعد تطبيع الأرقام/الأسماء (٢٨٣ و 2:255 والبقرة). */
  const handleJump = useCallback(
    (target: { kind: "page"; page: number } | { kind: "ayah"; surah: number; ayah: number; pageHint: number }) => {
      if (target.kind === "ayah") {
        void goToPageOrAyah(target.pageHint, { surah: target.surah, ayah: target.ayah });
        return;
      }
      goToPage(target.page);
    },
    [goToPage, goToPageOrAyah],
  );

  const activeSurahForPlayer = primarySegment?.segment.surah ?? 1;
  const activeSurahAyahCount = primarySegment ? getSurahMeta(activeSurahForPlayer).ayahs : 0;
  const {
    currentAyah,
    playerState,
    reciterId,
    setReciterId,
    playbackRate,
    setPlaybackRate,
    repeatOn,
    setRepeatOn,
    sleepTimer,
    setSleepTimer,
    stop: stopAyahPlayer,
  } = useAyahPlayer(activeSurahForPlayer, activeSurahAyahCount);
  const playerStateRef = useRef(playerState);
  const currentAyahRef = useRef(currentAyah);
  const reciterIdRef = useRef(reciterId);
  const activeSurahRef = useRef(activeSurahForPlayer);
  playerStateRef.current = playerState;
  currentAyahRef.current = currentAyah;
  reciterIdRef.current = reciterId;
  activeSurahRef.current = activeSurahForPlayer;

  const [engineAyahKey, setEngineAyahKey] = useState<string | null>(null);
  const [enginePlaying, setEnginePlaying] = useState(false);
  const [engineLoading, setEngineLoading] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    return engine.onSnapshot((s) => {
      setEnginePlaying(s.playerState === "playing" || s.playerState === "buffering");
      setEngineLoading(s.playerState === "loading");
      setEngineError(s.playerState === "error" ? s.errorMessage : null);
      if (s.surah != null && s.ayah != null) {
        setEngineAyahKey(`${s.surah}:${s.ayah}`);
      } else if (s.playerState === "idle") {
        setEngineAyahKey(null);
      }
    });
  }, []);

  useMushafRecitationFollow({
    currentPage: page,
    goToPage,
    onEngineAyah: setEngineAyahKey,
  });

  /** تشغيل عبر المحرّك العام حتى يستمر الشريط المصغّر عبر الصفحات والمسارات. */
  const toggleEnginePlayForAyah = useCallback(
    (surah: number, ayah: number) => {
      stopAyahPlayer();
      const engine = AudioEngine.getInstance();
      engine.setReciter(reciterId);
      void engine.togglePlay(surah, ayah);
      showMiniPlayer();
    },
    [reciterId, stopAyahPlayer],
  );

  useEffect(() => {
    return () => {
      setMushafUnsavedWork(false);
      if (
        (playerStateRef.current === "playing" || playerStateRef.current === "buffering") &&
        currentAyahRef.current != null
      ) {
        handoffMushafPlayback({
          surah: activeSurahRef.current,
          ayah: currentAyahRef.current,
          reciterId: reciterIdRef.current,
        });
      }
    };
  }, []);

  // زر رجوع داخل الشريط العلوي — يُغني عن GlobalBackButton العائم العام
  // الذي أُخفي على مسار /mushaf/page تحديدًا (راجع GlobalBackButton.tsx).
  // أول رجوع في الوضع الغامر يُظهر الأدوات؛ الثاني يخرج إلى أصل الدخول.
  const goBack = useCallback(() => {
    if (!textChromeVisible) {
      setTextChromeVisible(true);
      return;
    }
    if (hasMushafUnsavedWork()) {
      const ok = window.confirm("لديك ملاحظة غير محفوظة. هل تريد الخروج دون حفظ؟");
      if (!ok) return;
      setMushafUnsavedWork(false);
    }
    if (
      (playerState === "playing" || playerState === "buffering") &&
      currentAyah != null
    ) {
      handoffMushafPlayback({
        surah: activeSurahForPlayer,
        ayah: currentAyah,
        reciterId,
      });
    }
    const origin = consumeMushafEntryOrigin();
    if (origin && normalizeNavPath(origin) !== normalizeNavPath(location)) {
      goBackOrFallback(location, origin);
      return;
    }
    goBackOrFallback(location);
  }, [
    textChromeVisible,
    location,
    playerState,
    currentAyah,
    activeSurahForPlayer,
    reciterId,
  ]);

  // ── جسر بين مكوّني تخطيط السطر الحقيقي (V2/خفيف) وحالة الآية المختارة/المُشغَّلة القائمة أصلًا ──
  const handleV2AyahPress = useCallback((verseKey: string) => {
    const [s, a] = verseKey.split(":").map(Number);
    if (!s || !a) return;
    setResumeAyahKey(null);
    setSelectedAyah({ surah: s, ayah: a });
    setTextChromeVisible(false);
  }, []);
  const clearAyahSelection = useCallback(() => {
    setSelectedAyah(null);
  }, []);
  const v2ActiveKey = selectedAyah
    ? `${selectedAyah.surah}:${selectedAyah.ayah}`
    : enginePlaying && engineAyahKey
      ? engineAyahKey
      : (playerState === "playing" || playerState === "buffering") && currentAyah !== null
        ? `${activeSurahForPlayer}:${currentAyah}`
        : resumeAyahKey;

  const shellThemeClass = `quran-shell--${prefs.readingTheme}`;
  /* Ayah reading surface is borderless by default; optional frame styles
     still apply when the user explicitly picks one other than "none". */
  const frameClass =
    prefs.frameStyle === "none"
      ? "qs-mushaf-frame--ayah"
      : prefs.frameStyle === "emerald"
        ? "qs-mushaf-frame--ayah-chrome"
        : `qs-mushaf-frame--ayah-chrome qs-mushaf-frame--${prefs.frameStyle}`;

  const selectedAyahData = useMemo(() => {
    if (!selectedAyah || !segAyahs) return null;
    for (const seg of segAyahs) {
      const found = seg.ayahs.find((a) => a.surahNumber === selectedAyah.surah && a.numberInSurah === selectedAyah.ayah);
      if (found) return found;
    }
    return null;
  }, [selectedAyah, segAyahs]);

  useEffect(() => {
    if (!selectedAyah) return;
    const meta = getSurahMeta(selectedAyah.surah);
    if (selectedAyah.ayah >= meta.ayahs) {
      void import("@/lib/local-milestones").then((m) => m.markSurahCompleted(selectedAyah.surah));
    }
  }, [selectedAyah]);

  const flatAyahs = useMemo(() => segAyahs?.flatMap((s) => s.ayahs) ?? [], [segAyahs]);
  const selectedIdx = selectedAyah ? flatAyahs.findIndex((a) => a.surahNumber === selectedAyah.surah && a.numberInSurah === selectedAyah.ayah) : -1;

  return createPortal(
    <div
      className={`quran-shell quran-shell--immersive quran-shell--ayah ${shellThemeClass}${textChromeVisible ? "" : " quran-shell--chrome-hidden"}`}
      dir="rtl"
      style={{ ["--ayah-paper" as string]: immersivePaper }}
    >
      <>
          {/* هيدر عائم بسيط — بلا أزرار أو خلفيات (مطابق مخطط آية) */}
          <header className="mpv-ayah-header" aria-label="معلومات الصفحة" data-aya-header="1">
            <span className="mpv-ayah-header__juz">{headerJuzLabel}</span>
            <span className="mpv-ayah-header__surah">{headerSurahNames}</span>
          </header>

          {/* أربعة أزرار ظاهرة + ⋯ — عائم تحت رأس الجزء/الحزب بلا تراكب */}
          <div
            className={`mpv-toolbar mpv-toolbar--ayah ${textChromeVisible ? "" : "mpv-toolbar--hidden"}`}
            role="toolbar"
            aria-label="أدوات المصحف"
          >
            <button type="button" className="mpv-toolbar__btn" onClick={goBack} aria-label="رجوع">
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="mpv-toolbar__btn"
              onClick={() => { setToolbarMoreOpen(false); setSidebarOpen(true); }}
              aria-label="فهرس السور"
            >
              <Menu size={16} aria-hidden="true" />
              <span className="mpv-toolbar__label">فهرس</span>
            </button>
            <button
              type="button"
              className="mpv-toolbar__btn"
              onClick={() => {
                setToolbarMoreOpen(false);
                navigate(`/quran/recitation-test-ai?surah=${primarySurahMeta.number}`);
              }}
              aria-label="التسميع"
            >
              <Mic size={16} aria-hidden="true" />
              <span className="mpv-toolbar__label">تسميع</span>
            </button>
            <button
              type="button"
              className="mpv-toolbar__btn"
              onClick={() => { setToolbarMoreOpen(false); setSettingsOpen(true); }}
              aria-label="إعدادات القراءة"
            >
              <Settings size={16} aria-hidden="true" />
              <span className="mpv-toolbar__label">إعدادات</span>
            </button>
            <div className="mpv-toolbar__more">
              <button
                type="button"
                className={`mpv-toolbar__btn${toolbarMoreOpen ? " is-on" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setToolbarMoreOpen((v) => !v);
                }}
                aria-label="المزيد من الأدوات"
                aria-expanded={toolbarMoreOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </button>
              {toolbarMoreOpen ? (
                <div className="mpv-toolbar__menu" role="menu" aria-label="أدوات إضافية">
                  <button
                    type="button"
                    role="menuitem"
                    className="mpv-toolbar__menu-item"
                    onClick={() => { setToolbarMoreOpen(false); navigate("/quran-hub"); }}
                  >
                    <LayoutGrid size={16} aria-hidden="true" />
                    <span>أقسام</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mpv-toolbar__menu-item"
                    onClick={() => { setToolbarMoreOpen(false); void saveCurrentPageBookmark(); }}
                  >
                    <Bookmark size={16} aria-hidden="true" fill={pageBookmarked ? "currentColor" : "none"} />
                    <span>{pageBookmarked ? "فاصل محفوظ" : "حفظ فاصل"}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mpv-toolbar__menu-item"
                    onClick={() => { setToolbarMoreOpen(false); prevPage(); }}
                    disabled={page <= 1}
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                    <span>السابقة</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="mpv-toolbar__menu-item"
                    onClick={() => { setToolbarMoreOpen(false); nextPage(); }}
                    disabled={page >= TOTAL_PAGES}
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    <span>التالية</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          {bookmarkStatus ? (
            <p className="mpv-bookmark-status" role="status" aria-live="polite">
              {bookmarkStatus}
            </p>
          ) : null}

          {/* تبديل الأدوات عبر نقر الوسط في محرك التقليب؛ الحواف تقلّب الصفحات. */}
          <div className="mpv-body mpv-body--ayah">
            {resumeBanner && (
              <div className="mpv-resume-banner">
                <span>تابعت القراءة تلقائيًا من الصفحة {toArabicDigits(resumeBanner)}</span>
                <button type="button" className="mpv-resume-banner__btn" onClick={() => goToPage(1)}>
                  <RotateCcw size={13} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> ابدأ من الأولى
                </button>
              </div>
            )}

            {error && !loading ? (
              <div className="ds-empty" role="alert">
                <p>تعذّر تحميل هذه الصفحة. تحقّق من اتصالك وحاول مجددًا.</p>
                <button
                  type="button"
                  className="mpv-resume-banner__btn"
                  onClick={() => { void loadPage(page); }}
                  aria-label="إعادة محاولة تحميل الصفحة"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <div className={`qs-mushaf-frame ${frameClass}`}>
                <div
                  className={`qs-mushaf-body qs-mushaf-body--ayah qs-mushaf-body--hl-${prefs.highlightStyle} ${prefs.highlightStyle === "spotlight" && selectedAyah ? "qs-mushaf-body--spotlight" : ""}`}
                  style={{
                    ["--qs-font-size" as string]: `${prefs.fontScale}px`,
                    ["--qs-font-scale" as string]: String(mushafScale),
                    ["--mushaf-scale" as string]: String(mushafScale),
                    ["--mushaf-font-scale" as string]: String(MUSHAF_OPTICAL_FONT_SCALE),
                    ["--mushaf-line-height" as string]: "1.32",
                  }}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const max = el.scrollHeight - el.clientHeight;
                    if (max <= 0) return;
                    const ratio = el.scrollTop / max;
                    if (ratio < 0.8) return;
                    if (page < TOTAL_PAGES) {
                      prefetchMushafPage(page + 1);
                      if (page + 1 < TOTAL_PAGES) prefetchMushafPage(page + 2);
                    }
                  }}
                >
                  <MushafPageFlipStage
                    stageRef={flipStageRef}
                    flip={flip}
                    flipHandlers={flipHandlers}
                    isSpread={spread.isSpread}
                    spreadLeft={
                      spread.isSpread && neighborLayouts.spreadLeft ? (
                        <MushafLayeredPage
                          layout={neighborLayouts.spreadLeft}
                          activeAyahKey={null}
                          showAyahNumbers={prefs.showAyahNumbers}
                          mushafScale={mushafScale}
                        />
                      ) : null
                    }
                    underlay={
                      (flip.progress >= 0 ? neighborLayouts.next : neighborLayouts.prev) ? (
                        <MushafLayeredPage
                          layout={(flip.progress >= 0 ? neighborLayouts.next : neighborLayouts.prev)!}
                          activeAyahKey={null}
                          showAyahNumbers={prefs.showAyahNumbers}
                          mushafScale={mushafScale}
                        />
                      ) : undefined
                    }
                  >
                    {loading || !segAyahs ? (
                      <MushafPageV2 layout={null} bare mushafScale={mushafScale} />
                    ) : (
                      <MushafLayeredPage
                        layout={v2Layout}
                        activeAyahKey={v2ActiveKey}
                        onAyahPress={handleV2AyahPress}
                        onBackgroundPress={clearAyahSelection}
                        showAyahNumbers={prefs.showAyahNumbers}
                        mushafScale={mushafScale}
                      />
                    )}
                  </MushafPageFlipStage>
                </div>
              </div>
            )}
          </div>

          {/* ذيل: خرطوش فردي يمين / زوجي يسار · وصف الحزب على الحافة المقابلة */}
          <footer
            className="mpv-ayah-footer"
            data-cartouche-align="parity"
            data-page-parity={pageParity}
          >
            <span className="mpv-ayah-footer__meta">{footerMetaLabel ?? ""}</span>
            <button
              type="button"
              className="mpv-ayah-page-badge"
              data-cartouche-side={pageParity === "odd" ? "right" : "left"}
              data-page-parity={pageParity}
              onClick={openJumpModal}
              aria-haspopup="dialog"
              aria-expanded={isJumpModalVisible}
              aria-label={`الانتقال إلى صفحة — الحالية ${toArabicDigits(page)} من ${toArabicDigits(TOTAL_PAGES)}`}
            >
              <MushafPageCartoucheSvg className="mpv-ayah-page-badge__cartouche" />
              <span className="mpv-ayah-page-badge__num">{toArabicPageDigits(page)}</span>
            </button>
          </footer>
          <MushafPageProgressRail
            page={page}
            totalPages={TOTAL_PAGES}
            pulseKey={page}
            visible={!selectedAyah && !flip.active && !flip.settling}
            onJump={openJumpModal}
          />
          <MushafBottomPager
            page={page}
            totalPages={TOTAL_PAGES}
            visible={
              textChromeVisible &&
              !selectedAyah &&
              !flip.active &&
              !flip.settling &&
              !sidebarOpen &&
              !settingsOpen
            }
            onPrev={prevPage}
            onNext={nextPage}
            onJump={openJumpModal}
            onIndex={() => setSidebarOpen(true)}
          />
        </>

      {sidebarOpen && (
        // نقر الخلفية للإغلاق مصحوب بزر إغلاق حقيقي وظاهر داخل اللوحة — مسار
        // وصول بديل كامل بلوحة المفاتيح.
         
        <div className="mpv-settings-sheet" onClick={() => setSidebarOpen(false)} role="presentation">
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="mpv-settings-panel" onClick={(e) => e.stopPropagation()} style={{ height: "70vh", display: "flex", flexDirection: "column" }}>
            <div className="mpv-settings-panel__head">
              <h2 className="mpv-settings-panel__title">فهرس المصحف</h2>
              <button type="button" onClick={() => setSidebarOpen(false)} aria-label="إغلاق" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <SurahList
                surahs={surahs}
                currentSurah={primarySurahMeta.number}
                onSelect={(n) => { goToPage(SURAH_START_PAGES[n - 1]); setSidebarOpen(false); }}
                onSelectPage={(p, opts) => { void goToPageOrAyah(p, opts); setSidebarOpen(false); }}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        // نقر الخلفية للإغلاق مصحوب بزر إغلاق حقيقي وظاهر داخل اللوحة — مسار
        // وصول بديل كامل بلوحة المفاتيح.
         
        <div className="mpv-settings-sheet" onClick={() => setSettingsOpen(false)} role="presentation">
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="mpv-settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mpv-settings-panel__head">
              <h2 className="mpv-settings-panel__title">إعدادات القراءة</h2>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="إغلاق" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mpv-settings-group">
              <span className="mpv-settings-group__label">حجم الخط</span>
              <div className="mpv-settings-group__grid">
                <button type="button" className="mpv-chip" onClick={() => setPref("fontScale", Math.max(QURAN_FONT_MIN_PX, prefs.fontScale - QURAN_FONT_STEP_PX))}>أصغر −</button>
                <span className="mpv-chip is-active">{Math.round(mushafScale * 100)}٪</span>
                <button type="button" className="mpv-chip" onClick={() => setPref("fontScale", Math.min(QURAN_FONT_MAX_PX, prefs.fontScale + QURAN_FONT_STEP_PX))}>أكبر +</button>
              </div>
              <small style={{ display: "block", opacity: .7, marginTop: ".35rem" }}>
                مقياس موحّد عبر --mushaf-scale على شبكة الـ١٥ خانة — بلا إعادة التفاف.
              </small>
            </div>

            <div className="mpv-settings-group" data-font-pack-sheet="1">
              <span className="mpv-settings-group__label">خطوط المصحف</span>
              <QpcFontPackBanner currentPage={page} variant="sheet" />
            </div>

            <div className="mpv-settings-group">
              <span className="mpv-settings-group__label">انتقال سريع لآية</span>
              <div className="mpv-settings-group__grid" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
                <input
                  type="number"
                  className="mpv-navbar__page-input"
                  min={1}
                  max={114}
                  placeholder="سورة"
                  aria-label="رقم السورة"
                  value={jumpSurah}
                  onChange={(e) => setJumpSurah(Number(e.target.value) || 1)}
                />
                <input
                  type="number"
                  className="mpv-navbar__page-input"
                  min={1}
                  placeholder="آية"
                  aria-label="رقم الآية"
                  value={jumpAyah}
                  onChange={(e) => setJumpAyah(Number(e.target.value) || 1)}
                />
                <button
                  type="button"
                  className="mpv-chip is-active"
                  onClick={() => {
                    if (jumpSurah >= 1 && jumpSurah <= 114 && jumpAyah >= 1) {
                      void goToPageOrAyah(1, { surah: jumpSurah, ayah: jumpAyah });
                      setSettingsOpen(false);
                    }
                  }}
                >
                  انتقل
                </button>
              </div>
            </div>

            <div className="mpv-settings-group">
              <span className="mpv-settings-group__label">خط الواجهة (غير المصحف)</span>
              <div className="mpv-settings-group__grid">
                {FONT_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`mpv-chip ${prefs.fontId === o.id ? "is-active" : ""}`}
                    onClick={() => setPref("fontId", o.id)}
                    aria-pressed={prefs.fontId === o.id}
                    title={o.label}
                  >
                    {o.labelAr}
                  </button>
                ))}
              </div>
              <small style={{ display: "block", opacity: .7, marginTop: ".35rem" }}>
                نص المصحف دائمًا من خط الصفحة QPC — هذا الخيار لعناصر الواجهة فقط.
              </small>
            </div>

            <div className="mpv-settings-group">
              <span className="mpv-settings-group__label">أرقام الآيات</span>
              <div className="mpv-settings-group__grid">
                <button
                  type="button"
                  className={`mpv-chip ${prefs.showAyahNumbers ? "is-active" : ""}`}
                  onClick={() => setPref("showAyahNumbers", true)}
                  aria-pressed={prefs.showAyahNumbers}
                >
                  إظهار
                </button>
                <button
                  type="button"
                  className={`mpv-chip ${!prefs.showAyahNumbers ? "is-active" : ""}`}
                  onClick={() => setPref("showAyahNumbers", false)}
                  aria-pressed={!prefs.showAyahNumbers}
                >
                  إخفاء
                </button>
              </div>
            </div>

            <div className="mpv-settings-group">
              <span className="mpv-settings-group__label">وضع القراءة</span>
              <div className="mpv-settings-group__grid">
                {THEME_OPTIONS.map((o) => (
                  <button key={o.id} type="button" className={`mpv-chip ${prefs.readingTheme === o.id ? "is-active" : ""}`} onClick={() => setPref("readingTheme", o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mpv-settings-group">
              <span className="mpv-settings-group__label">إطار الصفحة</span>
              <div className="mpv-settings-group__grid">
                {FRAME_OPTIONS.map((o) => (
                  <button key={o.id} type="button" className={`mpv-chip ${prefs.frameStyle === o.id ? "is-active" : ""}`} onClick={() => setPref("frameStyle", o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mpv-settings-group">
              <span className="mpv-settings-group__label">نمط تمييز الآية المختارة</span>
              <div className="mpv-settings-group__grid">
                {HIGHLIGHT_OPTIONS.map((o) => (
                  <button key={o.id} type="button" className={`mpv-chip ${prefs.highlightStyle === o.id ? "is-active" : ""}`} onClick={() => setPref("highlightStyle", o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <ReciterDownloadManager />
          </div>
        </div>
      )}

      {selectedAyah && selectedAyahData && (
        <SectionErrorBoundary name="PageAyahActionSheet">
          <PageAyahActionSheet
            surahNum={selectedAyah.surah}
            surahName={getSurahMeta(selectedAyah.surah).name}
            ayahNum={selectedAyah.ayah}
            ayahText={selectedAyahData.text}
            isPlaying={
              (enginePlaying && engineAyahKey === `${selectedAyah.surah}:${selectedAyah.ayah}`) ||
              (selectedAyah.surah === activeSurahForPlayer &&
                currentAyah === selectedAyah.ayah &&
                (playerState === "playing" || playerState === "buffering"))
            }
            canPlay={true}
            audioError={engineError}
            audioLoading={engineLoading}
            onTogglePlay={() => toggleEnginePlayForAyah(selectedAyah.surah, selectedAyah.ayah)}
            onPrev={selectedIdx > 0 ? () => {
              const prev = flatAyahs[selectedIdx - 1];
              setSelectedAyah({ surah: prev.surahNumber!, ayah: prev.numberInSurah });
            } : undefined}
            onNext={selectedIdx >= 0 && selectedIdx < flatAyahs.length - 1 ? () => {
              const next = flatAyahs[selectedIdx + 1];
              setSelectedAyah({ surah: next.surahNumber!, ayah: next.numberInSurah });
            } : undefined}
            onClose={() => setSelectedAyah(null)}
            reciterId={reciterId}
            onSetReciter={setReciterId}
            playbackRate={playbackRate}
            onSetPlaybackRate={setPlaybackRate}
            repeatOn={repeatOn}
            onToggleRepeat={() => setRepeatOn(!repeatOn)}
            sleepTimerOption={sleepTimer.option}
            onSetSleepTimer={setSleepTimer}
          />
        </SectionErrorBoundary>
      )}

      <ReadingBreakDialog
        open={breakReminder.open}
        title={breakReminder.title}
        message={breakReminder.message}
        onDismiss={breakReminder.dismiss}
      />

      <JumpPageModal
        open={isJumpModalVisible}
        currentPage={page}
        totalPages={TOTAL_PAGES}
        onClose={() => setIsJumpModalVisible(false)}
        onJump={handleJump}
      />
    </div>,
    document.body,
  );
}
