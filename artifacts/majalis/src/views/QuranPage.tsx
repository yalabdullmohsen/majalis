"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { Bookmark, BookOpen, ChevronLeft, ChevronRight, List, Minus, Moon, Plus, Search, Sun, Sunrise, X } from "lucide-react";
import "@/styles/mushaf.css";
import { applyPageSeo } from "@/lib/seo";

/* ══ ثوابت ══ */
const CDN_PRIMARY  = "https://cdn.jsdelivr.net/gh/QuranHub/quran-pages-images@main/kfgqpc/hafs-wasat";
const CDN_FALLBACK = "https://raw.githubusercontent.com/QuranHub/quran-pages-images/main/kfgqpc/hafs-wasat";
const TOTAL    = 604;
const PAGE_KEY  = "mj-mushaf-page-v2";
const MODE_KEY  = "mj-mushaf-mode-v2"; // "day" | "night" | "sepia"
const BM_KEY    = "mj-mushaf-bookmarks";

type ReadMode = "day" | "night" | "sepia";

/* ══ localStorage helpers ══ */
function lsGet(k: string, fb: number): number {
  try { const v = localStorage.getItem(k); return v ? +JSON.parse(v) : fb; } catch { return fb; }
}
function lsSet(k: string, v: number) {
  try { localStorage.setItem(k, String(v)); } catch { /* */ }
}
function lsGetArr(k: string): number[] {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : []; } catch { return []; }
}
function lsSetArr(k: string, v: number[]) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ }
}
function lsGetMode(): ReadMode {
  try { const v = localStorage.getItem(MODE_KEY); return (v === "night" || v === "sepia") ? v : "day"; } catch { return "day"; }
}

/* ══ بناء URL الصورة ══ */
function pageUrl(n: number, fallback = false): string {
  const base = fallback ? CDN_FALLBACK : CDN_PRIMARY;
  return `${base}/${n}.jpg`;
}

/* ══ بيانات السور (محفوظة بالكامل) ══ */
const SURAHS: [string, number][] = [
  ["الفاتحة",1],["البقرة",2],["آل عمران",50],["النساء",77],["المائدة",106],
  ["الأنعام",128],["الأعراف",151],["الأنفال",177],["التوبة",187],["يونس",208],
  ["هود",221],["يوسف",235],["الرعد",249],["إبراهيم",255],["الحجر",262],
  ["النحل",267],["الإسراء",282],["الكهف",293],["مريم",305],["طه",312],
  ["الأنبياء",322],["الحج",332],["المؤمنون",342],["النور",350],["الفرقان",359],
  ["الشعراء",367],["النمل",377],["القصص",385],["العنكبوت",396],["الروم",404],
  ["لقمان",411],["السجدة",415],["الأحزاب",418],["سبأ",428],["فاطر",434],
  ["يس",440],["الصافات",446],["ص",453],["الزمر",458],["غافر",467],
  ["فصلت",477],["الشورى",483],["الزخرف",489],["الدخان",496],["الجاثية",499],
  ["الأحقاف",502],["محمد",507],["الفتح",511],["الحجرات",515],["ق",518],
  ["الذاريات",520],["الطور",523],["النجم",526],["القمر",528],["الرحمن",531],
  ["الواقعة",534],["الحديد",537],["المجادلة",542],["الحشر",545],["الممتحنة",549],
  ["الصف",551],["الجمعة",553],["المنافقون",554],["التغابن",556],["الطلاق",558],
  ["التحريم",560],["الملك",562],["القلم",564],["الحاقة",566],["المعارج",568],
  ["نوح",570],["الجن",572],["المزمل",574],["المدثر",575],["القيامة",577],
  ["الإنسان",578],["المرسلات",580],["النبأ",582],["النازعات",583],["عبس",585],
  ["التكوير",586],["الانفطار",587],["المطففين",587],["الانشقاق",589],["البروج",590],
  ["الطارق",591],["الأعلى",591],["الغاشية",592],["الفجر",593],["البلد",594],
  ["الشمس",595],["الليل",595],["الضحى",596],["الشرح",596],["التين",597],
  ["العلق",597],["القدر",598],["البينة",598],["الزلزلة",599],["العاديات",599],
  ["القارعة",600],["التكاثر",600],["العصر",601],["الهمزة",601],["الفيل",601],
  ["قريش",602],["الماعون",602],["الكوثر",602],["الكافرون",603],["النصر",603],
  ["المسد",603],["الإخلاص",604],["الفلق",604],["الناس",604],
];

/* ══ الأجزاء والأحزاب ══ */
const JUZ_PAGES = [1,22,42,62,82,102,121,142,162,182,201,221,241,261,281,301,321,341,361,381,401,421,441,461,481,501,521,542,561,581];
const AJZAA: [string, number][] = JUZ_PAGES.map((p, i) => [`الجزء ${i + 1}`, p]);

const HIZ_PAGES = [1,8,14,22,29,36,43,50,56,62,69,76,82,89,96,102,108,115,121,127,134,142,148,154,162,169,175,182,188,195,201,207,214,221,227,235,241,249,255,261,268,276,282,288,294,301,308,315,321,327,334,341,348,355,362,369,377,385,392,401];
const AHZAB: [string, number][] = HIZ_PAGES.map((p, i) => [`الحزب ${i + 1}`, p]);

const MODE_LABELS: Record<ReadMode, string> = { day: "النهاري", night: "الليلي", sepia: "الدافئ" };
const MODE_CYCLE: ReadMode[] = ["day", "sepia", "night"];
const ZOOM_STEP = 0.15;
const ZOOM_MIN  = 0.6;
const ZOOM_MAX  = 1.5;

type NavTab = "surahs" | "juz" | "ahzab" | "bookmarks";

/* ══ مكون صورة الصفحة (memo) ══ */
interface PageImgProps {
  page: number;
  mode: ReadMode;
  zoom: number;
  loaded: boolean;
  onLoad: () => void;
  onError: () => void;
}
const PageImg = memo(function PageImg({ page, mode, zoom, loaded, onLoad, onError }: PageImgProps) {
  const [useFallback, setUseFallback] = useState(false);

  const handleError = () => {
    if (!useFallback) { setUseFallback(true); }
    else { onError(); }
  };

  return (
    <img
      key={`${page}-${useFallback ? "fb" : "pr"}`}
      src={pageUrl(page, useFallback)}
      alt={`صفحة ${page}`}
      className={`mshf-page-img${loaded ? " loaded" : ""}${mode === "night" ? " night" : ""}`}
      loading="eager"
      draggable={false}
      style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
      onLoad={onLoad}
      onError={handleError}
    />
  );
});

/* ══ المكون الرئيسي ══ */
export default function QuranPage() {
  const [page, setPage]         = useState(() => Math.min(lsGet(PAGE_KEY, 1), TOTAL));
  const [readMode, setReadMode] = useState<ReadMode>(lsGetMode);
  const [zoom, setZoom]         = useState(1.0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgErr, setImgErr]       = useState(false);
  const [uiOn, setUiOn]           = useState(true);
  const [editingPage, setEditingPage] = useState(false);
  const [editVal, setEditVal]     = useState("");
  const [navOpen, setNavOpen]     = useState(false);
  const [navTab, setNavTab]       = useState<NavTab>("surahs");
  const [search, setSearch]       = useState("");
  const [bookmarks, setBookmarks] = useState<number[]>(() => lsGetArr(BM_KEY));
  const [modeBadge, setModeBadge] = useState(false);

  const [animDir, setAnimDir]     = useState<"" | "left" | "right">("");
  const [displayPage, setDisplayPage] = useState(page);

  const cache        = useRef<Map<number, string>>(new Map());
  const uiTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchRef     = useRef<{ x: number; y: number } | null>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);
  const navBodyRef   = useRef<HTMLDivElement>(null);
  const animating    = useRef(false);

  useEffect(() => {
    applyPageSeo({
      path: "/quran",
      title: "القرآن الكريم | المجلس العلمي",
      description: "اقرأ القرآن الكريم بصفحات المصحف الشريف — تصفّح السور والآيات بواجهة مصحفية أنيقة.",
      keywords: ["قرآن كريم", "مصحف", "تلاوة", "سور القرآن", "قراءة القرآن"],
    });
  }, []);

  /* preload */
  const preload = useCallback((n: number) => {
    if (n < 1 || n > TOTAL || cache.current.has(n)) return;
    const img = new Image();
    img.onload = () => cache.current.set(n, pageUrl(n));
    img.src = pageUrl(n);
  }, []);

  useEffect(() => {
    preload(page - 1);
    preload(page + 1);
    preload(page + 2);
  }, [page, preload]);

  /* UI timer */
  const bump = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    setUiOn(true);
    uiTimer.current = setTimeout(() => setUiOn(false), 3500);
  }, []);

  useEffect(() => {
    bump();
    return () => { if (uiTimer.current) clearTimeout(uiTimer.current); };
  }, [page, bump]);

  /* الانتقال بالأنيمشن */
  const go = useCallback((n: number) => {
    if (animating.current) return;
    const p = Math.max(1, Math.min(TOTAL, n));
    if (p === page) return;
    const dir = p > page ? "left" : "right";
    animating.current = true;
    setAnimDir(dir);
    setTimeout(() => {
      setPage(p);
      setDisplayPage(p);
      lsSet(PAGE_KEY, p);
      setImgLoaded(false);
      setImgErr(false);
      setAnimDir("");
      animating.current = false;
      bump();
    }, 220);
  }, [page, bump]);

  /* لوحة المفاتيح */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editingPage || navOpen) return;
      if (e.key === "ArrowLeft")        go(page + 1);
      else if (e.key === "ArrowRight")  go(page - 1);
      else if (e.key === "+" || e.key === "=") setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
      else if (e.key === "-")           setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
      else if (e.key === "0")           setZoom(1.0);
      else if (e.key === "Escape")      window.history.back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [page, editingPage, navOpen, go]);

  /* السحب (swipe) */
  const onTS = useCallback((e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTE = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y);
    touchRef.current = null;
    if (dy > 60 || Math.abs(dx) < 40) { bump(); return; }
    go(dx < 0 ? page + 1 : page - 1);
  }, [page, go, bump]);

  /* نقر على الصفحة */
  const onFrameClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (editingPage || navOpen) return;
    const { clientX, currentTarget } = e;
    const w = currentTarget.clientWidth;
    const zone = clientX / w;
    if (zone < 0.28)       go(page + 1);
    else if (zone > 0.72)  go(page - 1);
    else { setUiOn(v => !v); if (uiTimer.current) clearTimeout(uiTimer.current); }
  }, [editingPage, navOpen, page, go]);

  /* تحرير رقم الصفحة */
  const startEdit = useCallback(() => {
    setEditingPage(true);
    setEditVal(String(page));
    bump();
    setTimeout(() => pageInputRef.current?.select(), 30);
  }, [page, bump]);

  const commitEdit = useCallback(() => {
    const n = parseInt(editVal, 10);
    if (!isNaN(n)) go(n);
    setEditingPage(false);
  }, [editVal, go]);

  /* علامات المرجعية */
  const isBookmarked = useMemo(() => bookmarks.includes(page), [bookmarks, page]);
  const toggleBookmark = useCallback(() => {
    const next = isBookmarked
      ? bookmarks.filter(b => b !== page)
      : [...bookmarks, page].sort((a, b) => a - b);
    setBookmarks(next);
    lsSetArr(BM_KEY, next);
    bump();
  }, [isBookmarked, bookmarks, page, bump]);

  /* دورة أوضاع القراءة */
  const cycleMode = useCallback(() => {
    setReadMode(cur => {
      const idx = MODE_CYCLE.indexOf(cur);
      const next = MODE_CYCLE[(idx + 1) % MODE_CYCLE.length];
      try { localStorage.setItem(MODE_KEY, next); } catch { /* */ }
      return next;
    });
    setModeBadge(true);
    if (badgeTimer.current) clearTimeout(badgeTimer.current);
    badgeTimer.current = setTimeout(() => setModeBadge(false), 1800);
    bump();
  }, [bump]);

  /* تحكم الزوم */
  const zoomIn  = useCallback(() => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))), []);

  /* السورة الحالية */
  const currentSurah = useMemo(() => {
    for (let i = SURAHS.length - 1; i >= 0; i--) {
      if (page >= SURAHS[i][1]) return { name: SURAHS[i][0], idx: i + 1 };
    }
    return { name: "", idx: 0 };
  }, [page]);

  /* الجزء الحالي */
  const currentJuz = useMemo(() => {
    for (let i = JUZ_PAGES.length - 1; i >= 0; i--) {
      if (page >= JUZ_PAGES[i]) return i + 1;
    }
    return 1;
  }, [page]);

  /* الحزب الحالي */
  const currentHizb = useMemo(() => {
    for (let i = HIZ_PAGES.length - 1; i >= 0; i--) {
      if (page >= HIZ_PAGES[i]) return i + 1;
    }
    return 1;
  }, [page]);

  /* شريط التقدم */
  const progress = useMemo(() => ((page - 1) / (TOTAL - 1)) * 100, [page]);

  /* السور المفلترة */
  const filteredSurahs = useMemo(
    () => SURAHS.filter(([name]) => !search || name.includes(search)),
    [search]
  );

  /* فتح لوحة التنقل */
  const openNav = useCallback((tab: NavTab = "surahs") => {
    setNavTab(tab);
    setSearch("");
    setNavOpen(true);
    if (tab === "surahs" && window.matchMedia("(pointer: fine)").matches) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, []);

  const goTo = useCallback((p: number) => { go(p); setNavOpen(false); }, [go]);

  /* تمرير السورة النشطة */
  useEffect(() => {
    if (!navOpen || navTab !== "surahs") return;
    setTimeout(() => {
      navBodyRef.current
        ?.querySelector(".mshf-surah-row.active")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 120);
  }, [navOpen, navTab]);

  /* ── أيقونة الوضع ── */
  const ModeIcon = readMode === "night" ? Moon : readMode === "sepia" ? Sunrise : Sun;

  /* ══════════════════════════════════════════════════════
     JSX
  ══════════════════════════════════════════════════════ */
  return (
    <div
      className={`mshf-shell${readMode === "night" ? " mshf-night" : readMode === "sepia" ? " mshf-sepia" : ""}`}
      dir="rtl"
    >
      {/* شريط التقدم */}
      <div className="mshf-progress" style={{ "--mshf-pct": `${progress}%` } as React.CSSProperties} />

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
          <span className="mshf-title-main">المصحف الشريف</span>
          <span className="mshf-title-sub">
            {currentSurah.name ? `${currentSurah.idx}. ${currentSurah.name} · ` : ""}
            ج{currentJuz} · ح{currentHizb}
          </span>
        </div>

        <div className="mshf-top-actions">
          <button
            type="button"
            className={`mshf-icon-btn${isBookmarked ? " active" : ""}`}
            onClick={toggleBookmark}
            aria-label={isBookmarked ? "إزالة العلامة" : "إضافة علامة"}
          >
            <Bookmark size={17} strokeWidth={2} fill={isBookmarked ? "currentColor" : "none"} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`mshf-icon-btn${readMode !== "day" ? " active" : ""}`}
            onClick={cycleMode}
            aria-label={`الوضع الحالي: ${MODE_LABELS[readMode]} — اضغط للتغيير`}
          >
            <ModeIcon size={17} strokeWidth={2} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="mshf-icon-btn"
            onClick={() => openNav("surahs")}
            aria-label="الفهرس"
          >
            <List size={17} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ══ منطقة الصفحة ══ */}
      <div
        className={`mshf-page-container${animDir ? ` anim-${animDir}` : ""}`}
        onTouchStart={onTS}
        onTouchEnd={onTE}
        onClick={onFrameClick}
      >
        {!imgLoaded && !imgErr && (
          <div className="mshf-loading">
            <div className="mshf-spinner" />
            <span>جاري التحميل…</span>
          </div>
        )}

        {imgErr && (
          <div className="mshf-err">
            <BookOpen size={40} strokeWidth={1.2} aria-hidden="true" style={{ opacity: 0.25 }} />
            <p>تعذّر تحميل الصفحة</p>
            <button
              type="button"
              onClick={() => { setImgErr(false); setImgLoaded(false); }}
              className="mshf-err-btn"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {!imgErr && (
          <PageImg
            page={displayPage}
            mode={readMode}
            zoom={zoom}
            loaded={imgLoaded}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgErr(true)}
          />
        )}
      </div>

      {/* بادج الوضع */}
      <div className={`mshf-mode-badge${modeBadge ? " show" : ""}`} aria-live="polite">
        وضع {MODE_LABELS[readMode]}
      </div>

      {/* ══ شريط سفلي ══ */}
      <footer className={`mshf-bot${uiOn ? " on" : ""}`}>
        {/* أزرار التكبير */}
        <div className="mshf-zoom-ctrl">
          <button
            type="button"
            className="mshf-zoom-btn"
            onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN}
            aria-label="تصغير"
          >
            <Minus size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mshf-zoom-btn"
            style={{ fontSize: "0.6rem", width: "30px" }}
            onClick={() => setZoom(1.0)}
            title="إعادة الضبط"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="mshf-zoom-btn"
            onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX}
            aria-label="تكبير"
          >
            <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* التنقل بين الصفحات */}
        <button
          type="button"
          className="mshf-nav-btn"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="الصفحة السابقة"
        >
          <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>

        <div className="mshf-pgnum">
          {editingPage ? (
            <input
              ref={pageInputRef}
              className="mshf-pgnum-input"
              type="number"
              min={1}
              max={TOTAL}
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditingPage(false);
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <button
              type="button"
              className="mshf-pgnum-btn"
              onClick={e => { e.stopPropagation(); startEdit(); }}
              aria-label="انتقل إلى صفحة"
            >
              <span className="mshf-pgnum-cur">{page}</span>
              <span className="mshf-pgnum-sep">/</span>
              <span className="mshf-pgnum-tot">{TOTAL}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          className="mshf-nav-btn"
          onClick={() => go(page + 1)}
          disabled={page >= TOTAL}
          aria-label="الصفحة التالية"
        >
          <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </footer>

      {/* ══ Bottom Sheet (الفهرس) ══ */}
      {navOpen && (
        <div className="mshf-sheet-overlay" onClick={() => setNavOpen(false)}>
          <div className="mshf-sheet" onClick={e => e.stopPropagation()}>

            <div className="mshf-sheet-handle" />

            <div className="mshf-sheet-head">
              <div className="mshf-sheet-tabs">
                {([
                  ["surahs",    "السور"],
                  ["juz",       "الأجزاء"],
                  ["ahzab",     "الأحزاب"],
                  ["bookmarks", "العلامات"],
                ] as [NavTab, string][]).map(([id, label]) => (
                  <button
                    type="button"
                    key={id}
                    className={`mshf-sheet-tab${navTab === id ? " active" : ""}`}
                    onClick={() => { setNavTab(id); setSearch(""); }}
                  >
                    {label}
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
                    aria-label="مسح البحث"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* جسم الـ sheet */}
            <div ref={navBodyRef} className="mshf-sheet-body">

              {/* السور */}
              {navTab === "surahs" && (
                <div className="mshf-surah-list">
                  {filteredSurahs.length === 0 ? (
                    <p className="mshf-empty" style={{ gridColumn: "1/-1" }}>لا نتائج</p>
                  ) : filteredSurahs.map(([name, sp]) => {
                    const idx = SURAHS.findIndex(s => s[0] === name);
                    const isActive = page >= sp && (idx === SURAHS.length - 1 || page < SURAHS[idx + 1][1]);
                    return (
                      <button
                        type="button"
                        key={name}
                        className={`mshf-surah-row${isActive ? " active" : ""}`}
                        onClick={() => goTo(sp)}
                      >
                        <span className="mshf-surah-num">{idx + 1}</span>
                        <span className="mshf-surah-name">{name}</span>
                        <span className="mshf-surah-page">ص {sp}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* الأجزاء */}
              {navTab === "juz" && (
                <div className="mshf-grid5">
                  {AJZAA.map(([, sp], i) => {
                    const isActive = page >= sp && (i === AJZAA.length - 1 || page < AJZAA[i + 1][1]);
                    return (
                      <button
                        type="button"
                        key={i}
                        className={`mshf-grid-item${isActive ? " active" : ""}`}
                        onClick={() => goTo(sp)}
                      >
                        <span className="mshf-grid-num">{i + 1}</span>
                        <span className="mshf-grid-pg">ص {sp}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* الأحزاب */}
              {navTab === "ahzab" && (
                <div className="mshf-grid6">
                  {AHZAB.map(([, sp], i) => {
                    const isActive = page >= sp && (i === AHZAB.length - 1 || page < AHZAB[i + 1][1]);
                    return (
                      <button
                        type="button"
                        key={i}
                        className={`mshf-grid-item${isActive ? " active" : ""}`}
                        onClick={() => goTo(sp)}
                      >
                        <span className="mshf-grid-num">{i + 1}</span>
                        <span className="mshf-grid-pg">ص {sp}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* العلامات */}
              {navTab === "bookmarks" && (
                <div className="mshf-bm-list">
                  {bookmarks.length === 0 ? (
                    <div className="mshf-empty mshf-empty--center">
                      <Bookmark size={36} strokeWidth={1.5} aria-hidden="true" />
                      <p>لا توجد علامات محفوظة</p>
                      <p className="mshf-empty-sub">اضغط أيقونة العلامة في الأعلى لحفظ صفحة</p>
                    </div>
                  ) : bookmarks.map(bm => {
                    const s = (() => {
                      for (let i = SURAHS.length - 1; i >= 0; i--)
                        if (bm >= SURAHS[i][1]) return SURAHS[i][0];
                      return "";
                    })();
                    return (
                      <div key={bm} className="mshf-bm-row">
                        <button type="button" className="mshf-bm-btn" onClick={() => goTo(bm)}>
                          <Bookmark size={13} fill="currentColor" stroke="none" aria-hidden="true" />
                          <div className="mshf-bm-info">
                            <span className="mshf-bm-page">صفحة {bm}</span>
                            <span className="mshf-bm-surah">{s}</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="mshf-bm-del"
                          onClick={() => {
                            const next = bookmarks.filter(b => b !== bm);
                            setBookmarks(next);
                            lsSetArr(BM_KEY, next);
                          }}
                          aria-label="حذف العلامة"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
