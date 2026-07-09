"use client";

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  Bookmark, BookOpen, ChevronLeft, ChevronRight, List,
  Moon, Search, Sun, X, ZoomIn, ZoomOut,
} from "lucide-react";
import "@/styles/mushaf.css";
import { applyPageSeo } from "@/lib/seo";

/* ══════════════════════════════════════════════════════════════════
   ثوابت
   ══════════════════════════════════════════════════════════════════ */
const TOTAL_PAGES = 604;
const PAGE_KEY   = "mj-mushaf-page-v4";
const BM_KEY     = "mj-mushaf-bm-v4";
const ZOOM_KEY   = "mj-mushaf-zoom-v4";
const MODE_KEY   = "mj-mushaf-mode-v4";

/* مصادر صور المصحف مرتبة حسب الأولوية — عند فشل مصدر تنتقل للتالي */
const CDN_SOURCES = [
  (n: string) => `https://evkur.net/sites/default/files/mushaf/hafs/hafs-${n}.png`,
  (n: string) => `https://qurancdn.com/images/pages/jpg/p${n}.jpg`,
  (n: string) => `https://www.searchtruth.com/quran/images/pages/${n}.jpg`,
];

type ReadMode = "day" | "night" | "sepia";

/* بيانات السور: [الاسم، أول صفحة] */
const SURAHS: [string, number][] = [
  ["الفاتحة",1],["البقرة",2],["آل عمران",50],["النساء",77],
  ["المائدة",106],["الأنعام",128],["الأعراف",151],["الأنفال",177],
  ["التوبة",187],["يونس",208],["هود",221],["يوسف",235],
  ["الرعد",249],["إبراهيم",255],["الحجر",262],["النحل",267],
  ["الإسراء",282],["الكهف",293],["مريم",305],["طه",312],
  ["الأنبياء",322],["الحج",332],["المؤمنون",342],["النور",350],
  ["الفرقان",359],["الشعراء",367],["النمل",377],["القصص",385],
  ["العنكبوت",396],["الروم",404],["لقمان",411],["السجدة",415],
  ["الأحزاب",418],["سبأ",428],["فاطر",434],["يس",440],
  ["الصافات",446],["ص",453],["الزمر",458],["غافر",467],
  ["فصلت",477],["الشورى",483],["الزخرف",489],["الدخان",496],
  ["الجاثية",499],["الأحقاف",502],["محمد",507],["الفتح",511],
  ["الحجرات",515],["ق",518],["الذاريات",520],["الطور",523],
  ["النجم",526],["القمر",528],["الرحمن",531],["الواقعة",534],
  ["الحديد",537],["المجادلة",542],["الحشر",545],["الممتحنة",549],
  ["الصف",551],["الجمعة",553],["المنافقون",554],["التغابن",556],
  ["الطلاق",558],["التحريم",560],["الملك",562],["القلم",564],
  ["الحاقة",566],["المعارج",568],["نوح",570],["الجن",572],
  ["المزمل",574],["المدثر",575],["القيامة",577],["الإنسان",578],
  ["المرسلات",580],["النبأ",582],["النازعات",583],["عبس",585],
  ["التكوير",586],["الانفطار",587],["المطففين",587],["الانشقاق",589],
  ["البروج",590],["الطارق",591],["الأعلى",591],["الغاشية",592],
  ["الفجر",593],["البلد",594],["الشمس",595],["الليل",595],
  ["الضحى",596],["الشرح",596],["التين",597],["العلق",597],
  ["القدر",598],["البينة",598],["الزلزلة",599],["العاديات",599],
  ["القارعة",600],["التكاثر",600],["العصر",601],["الهمزة",601],
  ["الفيل",601],["قريش",602],["الماعون",602],["الكوثر",602],
  ["الكافرون",603],["النصر",603],["المسد",603],["الإخلاص",604],
  ["الفلق",604],["الناس",604],
];

function pageToSurahName(page: number): string {
  let name = SURAHS[0][0];
  for (const [n, p] of SURAHS) {
    if (p <= page) name = n;
    else break;
  }
  return name;
}

function padPage(n: number) { return n.toString().padStart(3, "0"); }

function lsGet<T>(k: string, fb: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
}
function lsSet<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ }
}

/* ══════════════════════════════════════════════════════════════════
   المكون الرئيسي
   ══════════════════════════════════════════════════════════════════ */
export default function QuranPage() {
  /* ── حالة ── */
  const [page, setPage]         = useState<number>(() => lsGet(PAGE_KEY, 1));
  const [mode, setMode]         = useState<ReadMode>(() => lsGet(MODE_KEY, "day"));
  const [zoom, setZoom]         = useState<number>(() => lsGet(ZOOM_KEY, 1.0));
  const [bookmarks, setBookmarks] = useState<number[]>(() => lsGet(BM_KEY, []));
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const [cdnIdx, setCdnIdx]       = useState(0);
  const [navOpen, setNavOpen]     = useState(false);
  const [navTab, setNavTab]       = useState<"surahs" | "bookmarks">("surahs");
  const [search, setSearch]       = useState("");
  const [uiOn, setUiOn]           = useState(true);
  const [anim, setAnim]           = useState<"" | "anim-left" | "anim-right">("");

  /* ── refs ── */
  const uiTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const touchX    = useRef<number | null>(null);

  /* ── SEO ── */
  useEffect(() => {
    applyPageSeo({
      path: "/quran",
      title: "القرآن الكريم | المجلس العلمي",
      description: "اقرأ المصحف الشريف — 604 صفحة بخط عثماني عالي الجودة مع حفظ الموضع والإشارات المرجعية.",
      keywords: ["قرآن كريم", "مصحف", "تلاوة", "سور القرآن"],
    });
  }, []);

  /* ── bump لإظهار واجهة التحكم ── */
  const bump = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    setUiOn(true);
    uiTimer.current = setTimeout(() => setUiOn(false), 4500);
  }, []);

  useEffect(() => { bump(); }, [page, bump]);
  useEffect(() => () => { if (uiTimer.current) clearTimeout(uiTimer.current); }, []);

  /* ── الانتقال بين الصفحات بأنيمشن ── */
  const goPage = useCallback((n: number, dir: "left" | "right" | "" = "") => {
    const p = Math.max(1, Math.min(TOTAL_PAGES, n));
    if (p === page) return;
    if (dir) {
      setAnim(dir === "left" ? "anim-left" : "anim-right");
      setTimeout(() => {
        setPage(p);
        lsSet(PAGE_KEY, p);
        setImgLoaded(false);
        setImgError(false);
        setCdnIdx(0);
        setAnim("");
      }, 180);
    } else {
      setPage(p);
      lsSet(PAGE_KEY, p);
      setImgLoaded(false);
      setImgError(false);
      setCdnIdx(0);
    }
    bump();
  }, [page, bump]);

  /* ── لوحة المفاتيح ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (navOpen) return;
      if (e.key === "ArrowLeft")       goPage(page + 1, "left");
      else if (e.key === "ArrowRight") goPage(page - 1, "right");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [page, navOpen, goPage]);

  /* ── لمس للجوال ── */
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goPage(page + 1, "left");
    else         goPage(page - 1, "right");
  };

  /* ── دورة الوضع ── */
  const cycleMode = useCallback(() => {
    setMode(cur => {
      const modes: ReadMode[] = ["day", "sepia", "night"];
      const next = modes[(modes.indexOf(cur) + 1) % modes.length];
      lsSet(MODE_KEY, next);
      return next;
    });
    bump();
  }, [bump]);

  /* ── العلامات ── */
  const isBm = bookmarks.includes(page);
  const toggleBm = useCallback(() => {
    setBookmarks(cur => {
      const next = cur.includes(page)
        ? cur.filter(p => p !== page)
        : [...cur, page].sort((a, b) => a - b);
      lsSet(BM_KEY, next);
      return next;
    });
  }, [page]);

  /* ── حجم الخط (تكبير الصورة) ── */
  const incZoom = () => { const n = Math.min(2.5, +(zoom + 0.15).toFixed(2)); setZoom(n); lsSet(ZOOM_KEY, n); };
  const decZoom = () => { const n = Math.max(0.6, +(zoom - 0.15).toFixed(2)); setZoom(n); lsSet(ZOOM_KEY, n); };

  /* ── السور المفلترة ── */
  const filteredSurahs = useMemo(
    () => SURAHS.map(([name, firstPage], i) => ({ name, firstPage, num: i + 1 }))
          .filter(s => !search || s.name.includes(search)),
    [search],
  );

  const surahName = useMemo(() => pageToSurahName(page), [page]);
  const modeClass = mode === "night" ? " mshf-night" : mode === "sepia" ? " mshf-sepia" : "";
  const ModeIcon  = mode === "night" ? Moon : Sun;

  const imgSrc = CDN_SOURCES[cdnIdx]?.(padPage(page)) ?? CDN_SOURCES[0](padPage(page));
  const allCdnsFailed = cdnIdx >= CDN_SOURCES.length;

  /* ══════════════════════════════════════════════════════════════════
     JSX
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={`mshf-shell${modeClass}`}
      dir="rtl"
      onClick={bump}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* شريط التقدم */}
      <div
        className="mshf-progress"
        style={{ "--mshf-pct": `${((page - 1) / (TOTAL_PAGES - 1)) * 100}%` } as React.CSSProperties}
      />

      {/* ══ رأس ══ */}
      <header className={`mshf-top${uiOn ? " on" : ""}`}>
        <button
          type="button"
          className="mshf-back"
          onClick={() => window.history.back()}
          aria-label="رجوع"
        >
          <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>

        <div className="mshf-title-wrap">
          <span className="mshf-title-main">القرآن الكريم</span>
          <span className="mshf-title-sub">
            ص {page.toLocaleString("ar-EG")} — {surahName}
          </span>
        </div>

        <div className="mshf-top-actions">
          <button
            type="button"
            className={`mshf-icon-btn${isBm ? " active" : ""}`}
            onClick={e => { e.stopPropagation(); toggleBm(); }}
            aria-label={isBm ? "إزالة العلامة" : "إضافة علامة"}
            title={isBm ? "إزالة العلامة" : "إضافة علامة"}
          >
            <Bookmark size={17} strokeWidth={2} fill={isBm ? "currentColor" : "none"} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`mshf-icon-btn${mode !== "day" ? " active" : ""}`}
            onClick={e => { e.stopPropagation(); cycleMode(); }}
            aria-label={`وضع القراءة: ${mode === "night" ? "الليلي" : mode === "sepia" ? "الدافئ" : "النهاري"}`}
          >
            <ModeIcon size={17} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mshf-icon-btn"
            onClick={e => { e.stopPropagation(); setSearch(""); setNavOpen(true); setNavTab("surahs"); setTimeout(() => searchRef.current?.focus(), 80); }}
            aria-label="قائمة السور"
          >
            <List size={17} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ══ صفحة المصحف ══ */}
      <div className={`mshf-page-container${anim ? ` ${anim}` : ""}`}>
        {/* مؤشر التحميل */}
        {!imgLoaded && !allCdnsFailed && (
          <div className="mshf-loading" aria-live="polite">
            <div className="mshf-spinner" />
            <span>
              جاري تحميل الصفحة {page.toLocaleString("ar-EG")}
              {cdnIdx > 0 ? ` (مصدر ${(cdnIdx + 1).toLocaleString("ar-EG")})` : ""}
              …
            </span>
          </div>
        )}

        {/* خطأ التحميل — بعد انتهاء جميع المصادر */}
        {allCdnsFailed && (
          <div className="mshf-err">
            <BookOpen size={52} strokeWidth={1} style={{ opacity: 0.25 }} aria-hidden="true" />
            <p>تعذّر تحميل الصفحة {page.toLocaleString("ar-EG")}</p>
            <p className="mshf-err-sub">تحقق من اتصالك بالإنترنت ثم أعد المحاولة</p>
            <button
              type="button"
              className="mshf-err-btn"
              onClick={() => { setImgError(false); setImgLoaded(false); setCdnIdx(0); }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* الصورة — تجرب كل CDN بالترتيب */}
        {!allCdnsFailed && (
          <img
            key={`${page}-${cdnIdx}`}
            src={imgSrc}
            alt={`صفحة ${page} من القرآن الكريم — ${surahName}`}
            className={`mshf-page-img${imgLoaded ? " loaded" : ""}${mode === "night" ? " night" : ""}`}
            style={{
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
              transformOrigin: "top center",
            }}
            onLoad={() => { setImgLoaded(true); setImgError(false); }}
            onError={() => {
              if (cdnIdx + 1 < CDN_SOURCES.length) {
                setCdnIdx(idx => idx + 1);
                setImgLoaded(false);
              } else {
                setImgError(true);
                setCdnIdx(CDN_SOURCES.length);
              }
            }}
            draggable={false}
          />
        )}
      </div>

      {/* ══ شريط سفلي ══ */}
      <footer className={`mshf-bot${uiOn ? " on" : ""}`}>
        {/* تحكم التكبير */}
        <div className="mshf-zoom-ctrl">
          <button
            type="button"
            className="mshf-zoom-btn"
            onClick={decZoom}
            disabled={zoom <= 0.6}
            aria-label="تصغير"
          >
            <ZoomOut size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mshf-zoom-btn mshf-zoom-btn--reset"
            onClick={() => { setZoom(1.0); lsSet(ZOOM_KEY, 1.0); }}
            title="إعادة الضبط"
          >
            {Math.round(zoom * 100)}٪
          </button>
          <button
            type="button"
            className="mshf-zoom-btn"
            onClick={incZoom}
            disabled={zoom >= 2.5}
            aria-label="تكبير"
          >
            <ZoomIn size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* السابق */}
        <button
          type="button"
          className="mshf-nav-btn"
          onClick={() => goPage(page - 1, "right")}
          disabled={page <= 1}
          aria-label="الصفحة السابقة"
        >
          <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>

        {/* رقم الصفحة */}
        <div className="mshf-pgnum">
          <button
            type="button"
            className="mshf-pgnum-btn"
            onClick={() => { setNavOpen(true); setNavTab("surahs"); }}
            aria-label="اختيار سورة"
          >
            <span className="mshf-pgnum-cur">{page.toLocaleString("ar-EG")}</span>
            <span className="mshf-pgnum-sep">/</span>
            <span className="mshf-pgnum-tot">{TOTAL_PAGES}</span>
          </button>
        </div>

        {/* التالي */}
        <button
          type="button"
          className="mshf-nav-btn"
          onClick={() => goPage(page + 1, "left")}
          disabled={page >= TOTAL_PAGES}
          aria-label="الصفحة التالية"
        >
          <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </footer>

      {/* ══ Bottom Sheet — السور والعلامات ══ */}
      {navOpen && (
        <div className="mshf-sheet-overlay" role="presentation" onClick={() => setNavOpen(false)}>
          <div
            className="mshf-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="التنقل في القرآن"
            onClick={e => e.stopPropagation()}
          >
            <div className="mshf-sheet-handle" />

            <div className="mshf-sheet-head">
              <div className="mshf-sheet-tabs">
                {(["surahs", "bookmarks"] as const).map(id => (
                  <button
                    key={id}
                    type="button"
                    className={`mshf-sheet-tab${navTab === id ? " active" : ""}`}
                    onClick={() => { setNavTab(id); setSearch(""); }}
                  >
                    {id === "surahs" ? "السور" : "العلامات"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mshf-sheet-close"
                onClick={() => setNavOpen(false)}
                aria-label="إغلاق"
              >
                <X size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            {/* بحث السور */}
            {navTab === "surahs" && (
              <div className="mshf-search-bar">
                <Search size={14} strokeWidth={2} aria-hidden="true" />
                <input
                  ref={searchRef}
                  className="mshf-search-input"
                  placeholder="ابحث عن سورة…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="بحث في السور"
                />
                {search && (
                  <button
                    type="button"
                    className="mshf-search-clear"
                    onClick={() => setSearch("")}
                    aria-label="مسح"
                  >✕</button>
                )}
              </div>
            )}

            <div className="mshf-sheet-body">
              {/* السور */}
              {navTab === "surahs" && (
                <div className="mshf-surah-list">
                  {filteredSurahs.length === 0 ? (
                    <p className="mshf-empty mshf-empty--full-row">لا نتائج</p>
                  ) : filteredSurahs.map(({ name, firstPage, num }) => (
                    <button
                      key={num}
                      type="button"
                      className={`mshf-surah-row${surahName === name ? " active" : ""}`}
                      onClick={() => { goPage(firstPage); setNavOpen(false); }}
                    >
                      <span className="mshf-surah-num">{num}</span>
                      <span className="mshf-surah-name">{name}</span>
                      <span className="mshf-surah-page">ص {firstPage}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* العلامات */}
              {navTab === "bookmarks" && (
                <div className="mshf-bm-list">
                  {bookmarks.length === 0 ? (
                    <div className="mshf-empty mshf-empty--center">
                      <Bookmark size={36} strokeWidth={1.5} aria-hidden="true" />
                      <p>لا توجد علامات محفوظة</p>
                      <p className="mshf-empty-sub">اضغط أيقونة العلامة في الأعلى لحفظ الصفحة الحالية</p>
                    </div>
                  ) : bookmarks.map(bm => (
                    <div key={bm} className="mshf-bm-row">
                      <button
                        type="button"
                        className="mshf-bm-btn"
                        onClick={() => { goPage(bm); setNavOpen(false); }}
                      >
                        <Bookmark size={13} fill="currentColor" stroke="none" aria-hidden="true" />
                        <div className="mshf-bm-info">
                          <span className="mshf-bm-page">صفحة {bm.toLocaleString("ar-EG")}</span>
                          <span className="mshf-bm-surah">{pageToSurahName(bm)}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="mshf-bm-del"
                        onClick={() => setBookmarks(cur => {
                          const next = cur.filter(p => p !== bm);
                          lsSet(BM_KEY, next);
                          return next;
                        })}
                        aria-label="حذف العلامة"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
