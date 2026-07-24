import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useLocation } from "wouter";
import { Menu, ChevronRight, ChevronLeft, X, BookOpen, Hash, Layers, Mic } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { getSurahList, getSurahMeta, stripEmbeddedBismillah } from "@/lib/quran-api";
import {
  fetchPage, fetchPagesManifest, firstPageOfSurah, juzForPage,
  type PageContent, type PagesManifest,
} from "@/lib/quran-pages";
import { SurahList } from "@/components/quran/SurahList";
import { AyahActionSheet } from "@/components/quran/AyahActionSheet";
import { useAyahPlayer } from "@/hooks/useAyahPlayer";
import { usePageSwipe } from "@/hooks/usePageSwipe";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/quran.css";

/**
 * قارئ المصحف — إعادة بناء المرحلة 8 (2026-07-18): ترقيم مدينة 604 صفحة
 * حقيقي (لا سرد بالسورة فقط كما كان)، سحب أفقي RTL بين الصفحات، Bottom
 * Sheet بدل الأزرار الدائمة لكل آية، ووضع قراءة هادئ (ضغطة تُخفي/تُظهر
 * التحكم). البيانات من src/lib/quran-pages.ts (فهرس صفحات مُتحقَّق + نص
 * محلي checksum). البحث الحي الحالي في SurahList أُبقي كما هو دون تعديل.
 */

const LAST_PAGE_KEY = "majalis-mushaf-last-page-v1";
const TOTAL_PAGES = 604;

function readLastPage(): number {
  try {
    const raw = localStorage.getItem(LAST_PAGE_KEY);
    const n = raw ? Number(raw) : 1;
    return Number.isFinite(n) && n >= 1 && n <= TOTAL_PAGES ? n : 1;
  } catch {
    return 1;
  }
}

function saveLastPage(page: number) {
  try { localStorage.setItem(LAST_PAGE_KEY, String(page)); } catch { /* تجاهل بأمان */ }
}

type SidebarTab = "surah" | "juz" | "page";

export default function MushafPage() {
  const params = useParams<{ surah?: string }>();
  const [, navigate] = useLocation();

  const [manifest, setManifest] = useState<PagesManifest | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("surah");
  const [quietMode, setQuietMode] = useState(false);
  const [pageJumpInput, setPageJumpInput] = useState("");
  const [activeAyah, setActiveAyah] = useState<PageContent["ayahs"][number] | null>(null);
  const [repeatOn, setRepeatOn] = useState(false);
  const initializedFromRoute = useRef(false);

  // ── ضغط مطول لفتح إجراءات الآية (لا لمسة/نقرة عادية) ─────────────────────
  // بأمر صريح من المالك: اللمسة العادية أثناء القراءة كانت تفتح لوحة
  // الإجراءات بسهولة زائدة وتقاطع القراءة؛ الفتح الآن فقط بضغط مستمر
  // (٥٠٠ مللي ثانية) مع إلغائه تلقائيًا لو تحرّك الإصبع (سحب صفحة حقيقي
  // لا ضغط ثابت). لوحة المفاتيح تبقى فورية (Enter/مسافة) — لا مكافئ منطقي
  // لـ"ضغط مطول" بالكيبورد.
  const LONG_PRESS_MS = 500;
  const LONG_PRESS_MOVE_CANCEL_PX = 10;
  const pressTimerRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleAyahPointerDown = useCallback(
    (e: React.PointerEvent, ayah: PageContent["ayahs"][number]) => {
      pressStartRef.current = { x: e.clientX, y: e.clientY };
      if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = window.setTimeout(() => {
        pressTimerRef.current = null;
        setActiveAyah(ayah);
      }, LONG_PRESS_MS);
    },
    [],
  );
  const handleAyahPointerMove = useCallback((e: React.PointerEvent) => {
    if (pressTimerRef.current === null || !pressStartRef.current) return;
    const dx = Math.abs(e.clientX - pressStartRef.current.x);
    const dy = Math.abs(e.clientY - pressStartRef.current.y);
    if (dx > LONG_PRESS_MOVE_CANCEL_PX || dy > LONG_PRESS_MOVE_CANCEL_PX) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);
  const cancelAyahPress = useCallback(() => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);
  useEffect(() => () => { if (pressTimerRef.current !== null) window.clearTimeout(pressTimerRef.current); }, []);

  const surahs = useMemo(
    () => getSurahList().map((s) => ({
      number: s.number, name: s.name, englishName: "", englishNameTranslation: "",
      numberOfAyahs: s.ayahs,
      revelationType: (s.revelation === "مدنية" ? "Medinan" : "Meccan") as "Meccan" | "Medinan",
    })),
    [],
  );

  useEffect(() => {
    if (!sidebarOpen) return;
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [sidebarOpen]);

  // ── تحديد الصفحة الابتدائية: من رابط /mushaf/:surah إن وُجد، وإلا آخر موضع محفوظ ──
  useEffect(() => {
    if (initializedFromRoute.current) return;
    initializedFromRoute.current = true;
    let cancelled = false;
    (async () => {
      try {
        const m = await fetchPagesManifest();
        if (cancelled) return;
        setManifest(m);
        if (params.surah) {
          const n = Math.min(114, Math.max(1, Number(params.surah) || 1));
          const page = await firstPageOfSurah(n);
          if (!cancelled) setCurrentPage(page);
        } else {
          setCurrentPage(readLastPage());
        }
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── تحميل محتوى الصفحة الحالية + تحضير مسبق للمجاورتين ──
  useEffect(() => {
    if (currentPage === null) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchPage(currentPage)
      .then((c) => { if (!cancelled) setContent(c); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    if (currentPage < TOTAL_PAGES) void fetchPage(currentPage + 1).catch(() => {});
    if (currentPage > 1) void fetchPage(currentPage - 1).catch(() => {});

    saveLastPage(currentPage);
    return () => { cancelled = true; };
  }, [currentPage]);

  // ── مزامنة الرابط (استبدال، لا دفع تاريخ) بالسورة الرائدة في الصفحة، للمشاركة/الفهرسة ──
  useEffect(() => {
    if (!content || content.surahs.length === 0) return;
    const leadingSurah = content.surahs[0].number;
    const target = leadingSurah === 1 ? "/mushaf" : `/mushaf/${leadingSurah}`;
    if (window.location.pathname !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [content]);

  useEffect(() => {
    const leadingSurah = content?.surahs[0];
    applyPageSeo({
      path: leadingSurah && leadingSurah.number !== 1 ? `/mushaf/${leadingSurah.number}` : "/mushaf",
      title: `${leadingSurah ? `سورة ${leadingSurah.name}` : "المصحف الشريف"} — صفحة ${currentPage ?? ""} | المجلس العلمي`,
      description: "اقرأ القرآن الكريم بترقيم مصحف المدينة (604 صفحة)، بخط عثماني واضح، مع الاستماع والتفسير والمشاركة لكل آية.",
      keywords: ["المصحف", "القرآن الكريم", "قراءة القرآن", leadingSurah?.name ?? ""].filter(Boolean),
    });
  }, [content, currentPage]);

  const activeSurahForPlayer = activeAyah?.surahNumber ?? content?.surahs[0]?.number ?? 1;
  const totalAyahsForPlayer = getSurahMeta(activeSurahForPlayer).ayahs;
  const { currentAyah, playerState, reciterId, setReciterId, togglePlayAyah, playFromAyah } =
    useAyahPlayer(activeSurahForPlayer, totalAyahsForPlayer);

  // تكرار: عند انتهاء الآية (idle) وتفعيل "تكرار"، أعِد تشغيل نفس الآية بدل التوقف.
  const lastPlayedAyah = useRef<number | null>(null);
  useEffect(() => {
    if (currentAyah !== null) lastPlayedAyah.current = currentAyah;
    if (repeatOn && playerState === "idle" && lastPlayedAyah.current !== null) {
      playFromAyah(lastPlayedAyah.current);
    }
  }, [playerState, currentAyah, repeatOn, playFromAyah]);

  const goToPage = useCallback((n: number) => {
    setCurrentPage((prev) => {
      const clamped = Math.min(TOTAL_PAGES, Math.max(1, n));
      return clamped === prev ? prev : clamped;
    });
  }, []);

  const { dragOffset, dragging, swipeHandlers } = usePageSwipe({
    onNext: () => goToPage((currentPage ?? 1) + 1),
    onPrev: () => goToPage((currentPage ?? 1) - 1),
    disabled: currentPage === null || Boolean(activeAyah),
  });

  const handleSelectSurah = async (n: number) => {
    const page = await firstPageOfSurah(n);
    goToPage(page);
    setSidebarOpen(false);
  };

  const handleSelectJuz = (firstPage: number) => {
    goToPage(firstPage);
    setSidebarOpen(false);
  };

  const handlePageJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(pageJumpInput);
    if (Number.isFinite(n) && n >= 1 && n <= TOTAL_PAGES) {
      goToPage(n);
      setSidebarOpen(false);
      setPageJumpInput("");
    }
  };

  const juzNumber = manifest && currentPage ? juzForPage(manifest, currentPage) : null;

  return (
    <div className={`quran-shell mushaf-v2${quietMode ? " mushaf-v2--quiet" : ""}`} dir="rtl" lang="ar">
      {!quietMode && (
        <header className="mushaf-v2__header">
          <button type="button" className="mushaf-v2__sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="فهرس السور والأجزاء والصفحات">
            <Menu size={18} aria-hidden="true" />
          </button>
          <div className="mushaf-v2__header-info">
            <span className="mushaf-v2__header-surah">
              {content?.surahs.map((s) => s.name).join(" / ") ?? "المصحف الشريف"}
            </span>
            <span className="mushaf-v2__header-meta">
              {currentPage ? `صفحة ${toArabicDigits(currentPage)}` : ""}{juzNumber ? ` · الجزء ${toArabicDigits(juzNumber)}` : ""}
            </span>
          </div>
          <button
            type="button"
            className="qs-recitation-cta"
            onClick={() => navigate(`/quran/recitation-test-ai?surah=${activeSurahForPlayer}`)}
          >
            <Mic size={16} aria-hidden="true" />
            سمّع
            <span className="qs-recitation-cta__badge">تجريبي</span>
          </button>
        </header>
      )}

      {/* onClick هنا يبدّل "الوضع الهادئ" (إخفاء الهيدر/الشريط للقراءة الغامرة)
          — تفضيل عرض اختياري بحت، لا إجراء لازم للوصول إلى نص القرآن نفسه
          (كل الآيات موجودة وقابلة للقراءة بلا أي تفاعل). لم يُضَف role/tabIndex
          هنا عمدًا: main هو المعلَم الأساسي لكل محتوى الصفحة، وتحويله بالكامل
          إلى "زر" واحد ضخم يمكن التبويب إليه يضرّ بمستخدمي لوحة المفاتيح/قارئ
          الشاشة أكثر مما ينفعهم (محطة Tab واحدة مربكة تغطي كل نص القرآن). ترك
          هذا التبديل كميزة مريحة بالماوس/اللمس فقط قرار واعٍ، لا إغفال. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <main
        className="mushaf-v2__page"
        {...swipeHandlers}
        style={dragging ? { transform: `translateX(${dragOffset * 0.35}px)` } : undefined}
        onClick={() => setQuietMode((v) => !v)}
      >
        {loading || currentPage === null ? (
          <p className="ds-empty">جاري التحميل...</p>
        ) : error || !content ? (
          <div className="ds-empty">
            <p>تعذّر تحميل الصفحة. تحقّق من اتصالك وحاول مجددًا.</p>
            <button type="button" className="page-link-inline" onClick={(e) => { e.stopPropagation(); goToPage(currentPage); }}>
              إعادة المحاولة
            </button>
          </div>
        ) : (
          // onClick هنا لا يفعل شيئًا سوى e.stopPropagation() (منع تفعيل تبديل
          // "الوضع الهادئ" في main الأب عند النقر داخل نص الآيات) — لا إجراء
          // فعليًا يحتاج مكافئ لوحة مفاتيح.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div className="mushaf-v2__ayahs" dir="rtl" lang="ar" onClick={(e) => e.stopPropagation()}>
            {content.ayahs.map((a) => {
              const isPlaying = currentAyah === a.numberInSurah && a.surahNumber === activeSurahForPlayer && playerState === "playing";
              const showBasmala = a.isFirstOfSurah && a.surahNumber !== 1 && a.surahNumber !== 9;
              // البسملة مدمَجة داخل نص الآية 1 في مصدر البيانات لكل سورة عدا
              // الفاتحة/التوبة (راجع stripEmbeddedBismillah) — دون هذا كانت
              // تظهر مرتين: مرة كعنوان showBasmala فوق السورة، ومرة أخرى
              // داخل نص الآية نفسها. لا تعديل للنص المخزَّن، عرض فقط.
              const displayText = stripEmbeddedBismillah(a.surahNumber, a.numberInSurah, a.text);
              // a.surahNameFull بالفعل بصيغة "سُورَةُ ..." الكاملة — لا تُضَف "سورة" ثانيةً
              // (كانت مُكرَّرة فعليًا هنا: "سورة سُورَةُ..."، رصدتُها بلقطة Playwright
              // حقيقية لصفحة 604). سورة وحيدة في الصفحة ومطابقة لعنوان الهيدر أصلًا
              // → لا داعي لعنوان مكرَّر هنا إطلاقًا (لا نصّ فارغ).
              const surahMarkerText =
                a.isFirstOfSurah && (content.surahs.length > 1 || a.surahNumber !== content.surahs[0].number)
                  ? a.surahNameFull
                  : "";
              return (
                <span key={`${a.surahNumber}-${a.number}`} className="mushaf-v2__ayah-wrap">
                  {surahMarkerText && (
                    <span className="mushaf-v2__surah-marker" aria-hidden="true">{surahMarkerText}</span>
                  )}
                  {showBasmala && <span className="mushaf-v2__bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>}
                  <span
                    className={`mushaf-v2__ayah${isPlaying ? " mushaf-v2__ayah--playing" : ""}`}
                    style={{ fontFamily: "var(--font-quran)" }}
                    onPointerDown={(e) => handleAyahPointerDown(e, a)}
                    onPointerMove={handleAyahPointerMove}
                    onPointerUp={cancelAyahPress}
                    onPointerCancel={cancelAyahPress}
                    onPointerLeave={cancelAyahPress}
                    onContextMenu={(e) => e.preventDefault()}
                    role="button"
                    tabIndex={0}
                    aria-label={`آية ${a.numberInSurah} من سورة ${a.surahName} — اضغط مطوّلًا لفتح إجراءات الآية`}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveAyah(a); } }}
                  >
                    {displayText}
                    {/* ۩ (U+06E9) بلا لون في كل خطوط المشروع المُحمَّلة — يسقط Chromium
                        لخط إيموجي ملوَّن بديل مهما كانت سلسلة font-family (تحقّقتُ
                        فعليًا: font-variant-emoji:text وحدها وتقديم Noto Naskh Arabic
                        كلاهما بلا أثر)، فيبدو أيقونة غريبة وسط نص عثماني أحادي اللون.
                        بطاقة نصية بدلًا منه: موثوقة عبر كل المتصفحات/الخطوط بلا
                        استثناء، ومعناها أوضح من الرمز التقليدي أصلًا. */}
                    {a.sajda && <span className="mushaf-v2__sajda-mark">سجدة</span>}
                    <span className="mushaf-v2__ayah-num ayah-marker" aria-hidden="true">﴿{toArabicDigits(a.numberInSurah)}﴾</span>
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </main>

      {!quietMode && (
        <nav className="mushaf-v2__pager" aria-label="التنقل بين صفحات المصحف">
          <button
            type="button"
            className="mushaf-v2__pager-btn"
            onClick={() => goToPage((currentPage ?? 1) - 1)}
            disabled={!currentPage || currentPage <= 1}
            aria-label="الصفحة السابقة"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          {/* dir="ltr" إلزامي هنا: زوج رقم/رقم بفاصل "/" داخل حاوية RTL يُعاد ترتيبه
              بصريًا بخوارزمية bidi الافتراضية (لاحظتُه فعليًا بلقطة Playwright:
              "1 / 604" يظهر معكوسًا "604 / 1") — نفس فخّ ترقيم الصفحات في تخطيط RTL. */}
          <span className="mushaf-v2__pager-count" dir="ltr">{currentPage ?? "—"} / {TOTAL_PAGES}</span>
          <button
            type="button"
            className="mushaf-v2__pager-btn"
            onClick={() => goToPage((currentPage ?? 1) + 1)}
            disabled={!currentPage || currentPage >= TOTAL_PAGES}
            aria-label="الصفحة التالية"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
        </nav>
      )}

      {sidebarOpen && typeof document !== "undefined" && createPortal(
        // Portal إلى document.body إلزامي هنا (نفس نمط AyahActionSheet/ExploreAyahPanel
        // الموجودَين مسبقًا) — بدونه يبقى العنصر محاصرًا داخل سياق تكديس (stacking
        // context) وسيط أدنى من الهيدر العلوي الثابت (.navbar-v3) بصرف النظر عن
        // z-index مهما ارتفع (تحقّقتُ فعليًا بـ Playwright: النقر كان يصل لأيقونة
        // القمر داخل الهيدر بدل تبويب الفهرس رغم z-index أعلى بكثير). راجع أيضًا
        // ملاحظة z-index:10000 في elite-2026.css بخصوص .navbar-v3 المُثبَّت 9999/200.
        // نقر الخلفية للإغلاق مصحوب الآن بمعالج Escape فعلي (أعلاه) — مسار
        // بديل كامل بلوحة المفاتيح.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <div className="mushaf-v2__sidebar-overlay" role="presentation" onClick={() => setSidebarOpen(false)}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */}
          <aside className="mushaf-v2__sidebar" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="فهرس السور والأجزاء والصفحات">
            <div className="mushaf-v2__sidebar-head">
              <div className="mushaf-v2__sidebar-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={sidebarTab === "surah"} className={`mushaf-v2__sidebar-tab${sidebarTab === "surah" ? " is-active" : ""}`} onClick={() => setSidebarTab("surah")}>
                  <BookOpen size={14} aria-hidden="true" /> سورة
                </button>
                <button type="button" role="tab" aria-selected={sidebarTab === "juz"} className={`mushaf-v2__sidebar-tab${sidebarTab === "juz" ? " is-active" : ""}`} onClick={() => setSidebarTab("juz")}>
                  <Layers size={14} aria-hidden="true" /> جزء
                </button>
                <button type="button" role="tab" aria-selected={sidebarTab === "page"} className={`mushaf-v2__sidebar-tab${sidebarTab === "page" ? " is-active" : ""}`} onClick={() => setSidebarTab("page")}>
                  <Hash size={14} aria-hidden="true" /> صفحة
                </button>
              </div>
              <button type="button" className="mushaf-v2__sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="إغلاق">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {sidebarTab === "surah" && (
              <SurahList
                surahs={surahs}
                currentSurah={content?.surahs[0]?.number ?? 1}
                onSelect={handleSelectSurah}
                onClose={() => setSidebarOpen(false)}
              />
            )}

            {sidebarTab === "juz" && manifest && (
              <ol className="mushaf-v2__juz-list">
                {manifest.juz.map((j) => (
                  <li key={j.juz}>
                    <button
                      type="button"
                      className={`mushaf-v2__juz-item${juzNumber === j.juz ? " is-active" : ""}`}
                      onClick={() => handleSelectJuz(j.firstPage)}
                      aria-current={juzNumber === j.juz ? "true" : undefined}
                    >
                      <span>الجزء {j.juz}</span>
                      <span className="mushaf-v2__juz-item-page">صفحة {j.firstPage}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}

            {sidebarTab === "page" && (
              <form className="mushaf-v2__page-jump" onSubmit={handlePageJumpSubmit}>
                <input
                  type="number"
                  min={1}
                  max={TOTAL_PAGES}
                  value={pageJumpInput}
                  onChange={(e) => setPageJumpInput(e.target.value)}
                  placeholder={`رقم الصفحة (1-${TOTAL_PAGES})`}
                  aria-label="انتقال إلى رقم صفحة"
                  className="qs-search-input"
                />
                <button type="submit" className="mushaf-v2__page-jump-btn">انتقال</button>
              </form>
            )}
          </aside>
        </div>,
        document.body,
      )}

      {activeAyah && (
        <AyahActionSheet
          surahNumber={activeAyah.surahNumber}
          surahName={activeAyah.surahName}
          ayahNumberInSurah={activeAyah.numberInSurah}
          ayahText={stripEmbeddedBismillah(activeAyah.surahNumber, activeAyah.numberInSurah, activeAyah.text)}
          playerState={playerState}
          isCurrentAyah={currentAyah === activeAyah.numberInSurah && activeAyah.surahNumber === activeSurahForPlayer}
          reciterId={reciterId}
          onSetReciter={setReciterId}
          onTogglePlay={() => togglePlayAyah(activeAyah.numberInSurah)}
          repeatOn={repeatOn}
          onToggleRepeat={() => setRepeatOn((v) => !v)}
          onClose={() => setActiveAyah(null)}
        />
      )}
    </div>
  );
}
