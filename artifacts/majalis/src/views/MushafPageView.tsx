import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useLocation } from "wouter";
import {
  Menu, Settings, X, ChevronRight, ChevronLeft, RotateCcw, ArrowRight,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import {
  fetchSurahDetail, getSurahList, getSurahMeta, getSurahForPage, SURAH_START_PAGES,
  savePagePosition, loadPagePosition, deriveHizbRub,
  type Ayah, type SurahSummary,
} from "@/lib/quran-api";
import { loadPageJuzIndex, getSegmentsForPage, type QuranSegment } from "@/lib/recitation-ai/page-juz-lookup";
import { useQuranPreferences, type QuranReadingTheme, type QuranFrameStyle, type QuranHighlightStyle, type QuranPageMode } from "@/hooks/useQuranPreferences";
import { useAyahPlayer } from "@/hooks/useAyahPlayer";
import { SurahList } from "@/components/quran/SurahList";
import { PageAyahActionSheet } from "@/components/quran/PageAyahActionSheet";
import { ReciterDownloadManager } from "@/components/quran/ReciterDownloadManager";
import { loadMushafPage, prefetchMushafPage, type MushafPageLayout, type QpcWord } from "@/lib/mushaf-v2-data";
import { MushafPageV2 } from "@/components/quran/MushafPageV2";
import "@/styles/quran.css";
import "@/styles/mushaf-v2.css";

const TOTAL_PAGES = 604;

type SegmentAyahs = { segment: QuranSegment; ayahs: Ayah[] };

function toArabicDigits(n: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).replace(/[0-9]/g, (d) => digits[Number(d)]);
}

function clampPage(n: number): number {
  return Math.min(TOTAL_PAGES, Math.max(1, n));
}

/** عرض كلمة للوضع الخفيف: نص Unicode عادي (لا PUA خاص بخط الصفحة) —
 * شارة نجمية زمردية زخرفية موحّدة لرقم نهاية الآية بدل glyph خط الصفحة
 * (خط QPC غير مُحمَّل أصلًا في هذا الوضع). */
function renderLightWord(w: QpcWord) {
  if (w.charType === "end") {
    return (
      <Fragment key={w.id}>
        <span className="qs-ayah-num">{toArabicDigits(Number(w.textUthmani.replace(/\D/g, "")) || 0)}</span>
        {w.sajdahNumber !== null && <span className="mf2-sajda-badge">سجدة</span>}
      </Fragment>
    );
  }
  return <span key={w.id} className="mf2-word">{w.textQpcHafs}</span>;
}

const THEME_OPTIONS: { id: QuranReadingTheme; label: string }[] = [
  { id: "standard", label: "عادي" },
  { id: "night", label: "ليلي" },
  { id: "warm", label: "دافئ" },
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
const PAGE_MODE_OPTIONS: { id: QuranPageMode; label: string; hint: string }[] = [
  { id: "precision", label: "دقة مطبعية (الافتراضي)", hint: "خط QPC مطابق للمطبوع لكل صفحة — ~155 كيلوبايت/صفحة عند الفتح" },
  { id: "light", label: "خفيف", hint: "خط موحّد لكل الصفحات — بلا تحميل إضافي، مناسب لبطء الاتصال" },
];

export default function MushafPageView() {
  // مُثبَّت أيضًا على المسار القديم /mushaf/:surah (رقم سورة) — يُحوَّل
  // مباشرة لأول صفحته عبر SURAH_START_PAGES، دون مسار/مكوّن منفصل مكرَّر.
  const params = useParams<{ page?: string; surah?: string }>();
  const [, navigate] = useLocation();
  const { prefs, setPref } = useQuranPreferences();

  const routePage = params.page
    ? Number(params.page)
    : params.surah && Number(params.surah) >= 1 && Number(params.surah) <= 114
      ? SURAH_START_PAGES[Number(params.surah) - 1]
      : null;
  const [page, setPageState] = useState<number>(() => clampPage(routePage ?? loadPagePosition() ?? 1));
  const [segAyahs, setSegAyahs] = useState<SegmentAyahs[] | null>(null);
  const [v2Layout, setV2Layout] = useState<MushafPageLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<{ surah: number; ayah: number } | null>(null);
  const [pageInput, setPageInput] = useState(String(page));
  const [resumeBanner, setResumeBanner] = useState<number | null>(null);
  /* تجربة قراءة غامرة بنمط "آية"/"ترتيل": نقرة واحدة على جسم الصفحة (لا
     على آية — onClick على .mf2-ayah-group يوقف الانتشار propagation)
     تُبدِّل ظهور الشريطين العلوي/السفلي، مستقلة عن chromeVisible الخاصة
     مستقلة عن باقي التبديلات — تبديل دائم لا اختفاء تلقائي بعد مهلة). */
  const [textChromeVisible, setTextChromeVisible] = useState(true);
  const touchStartX = useRef<number | null>(null);

  // ── استئناف تلقائي: عند الدخول دون رقم صفحة صريح في الرابط، نبدأ من آخر موضع محفوظ محليًا ──
  useEffect(() => {
    if (!routePage) {
      const saved = loadPagePosition();
      if (saved && saved !== 1) setResumeBanner(saved);
    }
  }, []);

  useEffect(() => {
    if (routePage) setPageState(clampPage(routePage));
  }, [routePage]);

  useEffect(() => {
    setPageInput(String(page));
    savePagePosition(page);
  }, [page]);

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
      const index = await loadPageJuzIndex();
      const segments = getSegmentsForPage(index, p);
      if (segments.length === 0) throw new Error("لا مقاطع لهذه الصفحة");
      const details = await Promise.all(segments.map((s) => fetchSurahDetail(s.surah)));
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
    let cancelled = false;
    loadPage(page).then(() => {
      if (cancelled) return;
      // تحميل مسبق هادئ للصفحتين المجاورتين — لا يُحدِّث الواجهة، فقط يملأ ذاكرة fetchSurahDetail المحلية
      if (page > 1) loadPage(page - 1, { silent: true });
      if (page < TOTAL_PAGES) loadPage(page + 1, { silent: true });
    });
    return () => { cancelled = true; };
  }, [page, loadPage]);

  // ── تخطيط السطر الحقيقي (line_number) من نفس بيانات quran-v2 — مصدر
  // واحد يُستهلَك من كلا وضعي العرض (خفيف/دقة مطبعية)، لا تحميل مزدوج. ──
  useEffect(() => {
    let cancelled = false;
    setV2Layout(null);
    loadMushafPage(page).then((layout) => { if (!cancelled) setV2Layout(layout); }).catch(() => {});
    if (page > 1) prefetchMushafPage(page - 1);
    if (page < TOTAL_PAGES) prefetchMushafPage(page + 1);
    return () => { cancelled = true; };
  }, [page]);

  const primarySegment = segAyahs?.[0];
  const primarySurahMeta = primarySegment ? getSurahMeta(primarySegment.segment.surah) : getSurahForPage(page);
  const firstAyahOfPage = primarySegment?.ayahs[0];
  const { hizb, rubInHizb } = firstAyahOfPage?.hizbQuarter
    ? deriveHizbRub(firstAyahOfPage.hizbQuarter)
    : { hizb: 0, rubInHizb: 0 };
  const juz = firstAyahOfPage?.juz ?? 0;

  useEffect(() => {
    applyPageSeo({
      path: `/mushaf/page/${page}`,
      title: `صفحة ${page} — ${primarySurahMeta.name} | المصحف الشريف | المجلس العلمي`,
      description: `اقرأ صفحة ${page} من المصحف الشريف (سورة ${primarySurahMeta.name}) برواية حفص عن عاصم، بتقسيم مصحف المدينة الحقيقي.`,
      keywords: ["المصحف", "صفحات القرآن", primarySurahMeta.name, `صفحة ${page}`],
    });
  }, [page, primarySurahMeta.name]);

  const goToPage = useCallback((n: number) => {
    const clamped = clampPage(n);
    setPageState(clamped);
    setSelectedAyah(null);
    setResumeBanner(null);
    navigate(`/mushaf/page/${clamped}`, { replace: true });
  }, [navigate]);

  const nextPage = useCallback(() => goToPage(page + 1), [goToPage, page]);
  const prevPage = useCallback(() => goToPage(page - 1), [goToPage, page]);

  // زر رجوع داخل الشريط العلوي — يُغني عن GlobalBackButton العائم العام
  // الذي أُخفي على مسار /mushaf/page تحديدًا (راجع GlobalBackButton.tsx)
  // لأنه يتراكب فعليًا فوق شريط التنقّل السفلي الثابت بعرض الشاشة هنا،
  // اكتُشف حيًّا أثناء تحقّق Playwright (زر "السابقة" تعذّر النقر عليه).
  const goBack = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else navigate("/quran-hub");
  }, [navigate]);

  // ── سحب أفقي RTL صحيح الاتجاه: تحريك الإصبع لليسار = الصفحة التالية (تقدّم في القراءة) ──
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 55) return;
    if (delta < 0) nextPage(); else prevPage();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settingsOpen || sidebarOpen || selectedAyah) return;
      if (e.key === "ArrowLeft") nextPage();
      else if (e.key === "ArrowRight") prevPage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextPage, prevPage, settingsOpen, sidebarOpen, selectedAyah]);

  const activeSurahForPlayer = primarySegment?.segment.surah ?? 1;
  const activeSurahAyahCount = primarySegment ? getSurahMeta(activeSurahForPlayer).ayahs : 0;
  const { currentAyah, playerState, togglePlayAyah, reciterId, setReciterId, playbackRate, setPlaybackRate, repeatOn, setRepeatOn } = useAyahPlayer(activeSurahForPlayer, activeSurahAyahCount);

  // ── جسر بين مكوّني تخطيط السطر الحقيقي (V2/خفيف) وحالة الآية المختارة/المُشغَّلة القائمة أصلًا ──
  const handleV2AyahPress = useCallback((verseKey: string) => {
    const [s, a] = verseKey.split(":").map(Number);
    setSelectedAyah({ surah: s, ayah: a });
  }, []);
  const v2ActiveKey = selectedAyah
    ? `${selectedAyah.surah}:${selectedAyah.ayah}`
    : playerState === "playing" && currentAyah !== null
      ? `${activeSurahForPlayer}:${currentAyah}`
      : null;

  const shellThemeClass = `quran-shell--${prefs.readingTheme}`;
  const frameClass = prefs.frameStyle === "emerald" ? "" : `qs-mushaf-frame--${prefs.frameStyle}`;

  const selectedAyahData = useMemo(() => {
    if (!selectedAyah || !segAyahs) return null;
    for (const seg of segAyahs) {
      const found = seg.ayahs.find((a) => a.surahNumber === selectedAyah.surah && a.numberInSurah === selectedAyah.ayah);
      if (found) return found;
    }
    return null;
  }, [selectedAyah, segAyahs]);

  const flatAyahs = useMemo(() => segAyahs?.flatMap((s) => s.ayahs) ?? [], [segAyahs]);
  const selectedIdx = selectedAyah ? flatAyahs.findIndex((a) => a.surahNumber === selectedAyah.surah && a.numberInSurah === selectedAyah.ayah) : -1;

  return createPortal(
    <div className={`quran-shell quran-shell--immersive ${shellThemeClass}`} dir="rtl">
      <>
          <div className={`mpv-toolbar ${textChromeVisible ? "" : "mpv-toolbar--hidden"}`}>
            <button type="button" className="mpv-toolbar__btn" onClick={goBack} aria-label="رجوع">
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button type="button" className="mpv-toolbar__btn" onClick={() => setSidebarOpen(true)} aria-label="فهرس السور">
              <Menu size={16} aria-hidden="true" />
              الفهرس
            </button>
            <div className="mpv-toolbar__title">
              {primarySurahMeta.name}
              <small>صفحة {toArabicDigits(page)} · جزء {toArabicDigits(juz)}</small>
            </div>
            <button type="button" className="mpv-toolbar__btn" onClick={() => setSettingsOpen(true)} aria-label="إعدادات القراءة">
              <Settings size={16} aria-hidden="true" />
            </button>
          </div>

          <div
            className="mpv-body"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={() => setTextChromeVisible((v) => !v)}
          >
            {resumeBanner && (
              <div className="mpv-resume-banner">
                <span>تابعت القراءة تلقائيًا من الصفحة {toArabicDigits(resumeBanner)}</span>
                <button type="button" className="mpv-resume-banner__btn" onClick={() => goToPage(1)}>
                  <RotateCcw size={13} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> ابدأ من الأولى
                </button>
              </div>
            )}

            {loading ? (
              <p className="ds-empty">جاري تحميل الصفحة...</p>
            ) : error || !segAyahs ? (
              <p className="ds-empty">تعذّر تحميل هذه الصفحة. تحقّق من اتصالك وحاول مجددًا.</p>
            ) : (
              <div className={`qs-mushaf-frame ${frameClass}`}>
                <span className="qs-mushaf-corner qs-mushaf-corner--tl" aria-hidden="true">❈</span>
                <span className="qs-mushaf-corner qs-mushaf-corner--tr" aria-hidden="true">❈</span>
                <span className="qs-mushaf-corner qs-mushaf-corner--bl" aria-hidden="true">❈</span>
                <span className="qs-mushaf-corner qs-mushaf-corner--br" aria-hidden="true">❈</span>

                <div className="qs-mushaf-header-row">
                  <span>سورة {primarySurahMeta.name}</span>
                  <span>الجزء {toArabicDigits(juz)} · الحزب {toArabicDigits(hizb)} · الربع {toArabicDigits(rubInHizb)}</span>
                </div>

                <div className={`qs-mushaf-body ${prefs.highlightStyle === "spotlight" && selectedAyah ? "qs-mushaf-body--spotlight" : ""}`} style={{ ["--qs-font-size" as string]: `${prefs.fontScale}px` }}>
                  <div style={{ height: "100%", transform: `scale(${prefs.fontScale / 26})`, transformOrigin: "top center" }}>
                    {prefs.pageMode === "precision" ? (
                      <MushafPageV2 layout={v2Layout} activeAyahKey={v2ActiveKey} onAyahPress={handleV2AyahPress} bare />
                    ) : (
                      <MushafPageV2
                        layout={v2Layout}
                        activeAyahKey={v2ActiveKey}
                        onAyahPress={handleV2AyahPress}
                        sharedFontFamily={'"Amiri Quran", "Scheherazade New", serif'}
                        renderWord={renderLightWord}
                        bare
                      />
                    )}
                  </div>
                </div>

                <div className="qs-mushaf-footer-row">
                  <span className="qs-mushaf-footer-row__line" aria-hidden="true" />
                  <span className="qs-mushaf-footer-row__page">صفحة {toArabicDigits(page)}</span>
                  <span className="qs-mushaf-footer-row__line" aria-hidden="true" />
                </div>
              </div>
            )}
          </div>

          <nav className={`mpv-navbar ${textChromeVisible ? "" : "mpv-navbar--hidden"}`} aria-label="التنقل بين صفحات المصحف">
            <button type="button" className="mpv-navbar__btn" onClick={prevPage} disabled={page <= 1} aria-label="الصفحة السابقة">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <div className="mpv-navbar__page-input-wrap">
              <input
                type="number"
                className="mpv-navbar__page-input"
                value={pageInput}
                min={1}
                max={TOTAL_PAGES}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => { const n = Number(pageInput); if (Number.isFinite(n)) goToPage(n); else setPageInput(String(page)); }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                aria-label="رقم الصفحة"
              />
              <span>من {toArabicDigits(TOTAL_PAGES)}</span>
            </div>
            <button type="button" className="mpv-navbar__btn" onClick={nextPage} disabled={page >= TOTAL_PAGES} aria-label="الصفحة التالية">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
          </nav>
        </>

      {sidebarOpen && (
        <div className="mpv-settings-sheet" onClick={() => setSidebarOpen(false)} role="presentation">
          <div className="mpv-settings-panel" onClick={(e) => e.stopPropagation()} style={{ height: "70vh", display: "flex", flexDirection: "column" }}>
            <div className="mpv-settings-panel__head">
              <h2 className="mpv-settings-panel__title">فهرس السور</h2>
              <button type="button" onClick={() => setSidebarOpen(false)} aria-label="إغلاق" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <SurahList
                surahs={surahs}
                currentSurah={primarySurahMeta.number}
                onSelect={(n) => { goToPage(SURAH_START_PAGES[n - 1]); setSidebarOpen(false); }}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="mpv-settings-sheet" onClick={() => setSettingsOpen(false)} role="presentation">
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
                <button type="button" className="mpv-chip" onClick={() => setPref("fontScale", Math.max(18, prefs.fontScale - 2))}>أصغر −</button>
                <span className="mpv-chip is-active">{prefs.fontScale}px</span>
                <button type="button" className="mpv-chip" onClick={() => setPref("fontScale", Math.min(42, prefs.fontScale + 2))}>أكبر +</button>
              </div>
            </div>

            <div className="mpv-settings-group">
              <span className="mpv-settings-group__label">وضع عرض الصفحة</span>
              <div className="mpv-settings-group__grid">
                {PAGE_MODE_OPTIONS.map((o) => (
                  <button key={o.id} type="button" className={`mpv-chip ${prefs.pageMode === o.id ? "is-active" : ""}`} onClick={() => setPref("pageMode", o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
              <small style={{ display: "block", opacity: .7, marginTop: ".35rem" }}>
                {PAGE_MODE_OPTIONS.find((o) => o.id === prefs.pageMode)?.hint}{" "}
                <a href="/mushaf/about-edition" target="_blank" rel="noopener noreferrer">عن طبعة المصحف</a>
              </small>
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
        <PageAyahActionSheet
          surahNum={selectedAyah.surah}
          surahName={getSurahMeta(selectedAyah.surah).name}
          ayahNum={selectedAyah.ayah}
          ayahText={selectedAyahData.text}
          isPlaying={selectedAyah.surah === activeSurahForPlayer && currentAyah === selectedAyah.ayah && playerState === "playing"}
          canPlay={selectedAyah.surah === activeSurahForPlayer}
          onTogglePlay={() => togglePlayAyah(selectedAyah.ayah)}
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
        />
      )}
    </div>,
    document.body,
  );
}
