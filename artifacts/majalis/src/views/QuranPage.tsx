"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@/styles/mushaf.css";

const PDF_URL  = "/quran.pdf";
const PAGE_KEY = "mj-mushaf-page-v2";
const BM_KEY   = "mj-mushaf-bookmarks";
const TOTAL    = 604;

function lsGet(k: string, fb: number) {
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

function Star({ cls }: { cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2 L18.5 10 L26 8 L23 15.5 L30 16 L23 16.5 L26 24 L18.5 22 L16 30 L13.5 22 L6 24 L9 16.5 L2 16 L9 15.5 L6 8 L13.5 10 Z"
        fill="none" stroke="rgba(106,181,142,0.65)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

/* ══ بيانات السور (اسم + الصفحة الأولى) ══ */
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

const AJZAA: [string, number][] = Array.from({ length: 30 }, (_, i) => {
  const pages = [1,22,42,62,82,102,121,142,162,182,201,221,241,261,281,301,321,341,361,381,401,421,441,461,481,501,521,542,561,581];
  return [`الجزء ${i + 1}`, pages[i]];
});

type NavTab = "surahs" | "juz" | "bookmarks";

export default function QuranPage() {
  const [page, setPage]             = useState(() => Math.min(lsGet(PAGE_KEY, 1), TOTAL));
  const [pdfDoc, setPdfDoc]         = useState<any>(null);
  const [rendering, setRendering]   = useState(true);
  const [loadErr, setLoadErr]       = useState(false);
  const [uiOn, setUiOn]             = useState(true);
  const [editingPage, setEditingPage] = useState(false);
  const [editVal, setEditVal]       = useState("");
  const [navOpen, setNavOpen]       = useState(false);
  const [navTab, setNavTab]         = useState<NavTab>("surahs");
  const [search, setSearch]         = useState("");
  const [bookmarks, setBookmarks]   = useState<number[]>(() => lsGetArr(BM_KEY));
  const [nightMode, setNightMode]   = useState(() => localStorage.getItem("mj-mushaf-night") === "1");
  const [zoom, setZoom]             = useState(() => { try { const v = localStorage.getItem("mj-mushaf-zoom"); return v ? parseFloat(v) : 1.0; } catch { return 1.0; } });

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const frameRef     = useRef<HTMLDivElement>(null);
  const taskRef      = useRef<any>(null);
  const uiTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchRef     = useRef<{ x: number; y: number } | null>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  /* ── تحميل PDF.js ── */
  useEffect(() => {
    let dead = false;
    const url = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";
    (async () => {
      try {
        const lib: any = await import(/* @vite-ignore */ url);
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";
        const doc = await lib.getDocument(PDF_URL).promise;
        if (!dead) setPdfDoc(doc);
      } catch (e) {
        console.error(e);
        if (!dead) setLoadErr(true);
      }
    })();
    return () => { dead = true; };
  }, []);

  /* ── رسم الصفحة ── */
  const draw = useCallback(async (doc: any, p: number, z: number) => {
    if (!doc || !canvasRef.current || !frameRef.current) return;
    if (taskRef.current) { try { taskRef.current.cancel(); } catch { /* */ } taskRef.current = null; }
    setRendering(true);
    try {
      const pg  = await doc.getPage(p);
      const cvs = canvasRef.current;
      const fr  = frameRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const vp0 = pg.getViewport({ scale: 1 });
      const sc  = Math.min((fr.clientWidth * dpr) / vp0.width, (fr.clientHeight * dpr) / vp0.height) * 0.97 * z;
      const vp  = pg.getViewport({ scale: sc });
      cvs.width  = vp.width;
      cvs.height = vp.height;
      cvs.style.width  = `${vp.width  / dpr}px`;
      cvs.style.height = `${vp.height / dpr}px`;
      const ctx = cvs.getContext("2d")!;
      ctx.fillStyle = "#F9F3E8";
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      const t = pg.render({ canvasContext: ctx, viewport: vp });
      taskRef.current = t;
      await t.promise;
      taskRef.current = null;
      setRendering(false);
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") setRendering(false);
    }
  }, []);

  useEffect(() => { if (pdfDoc) draw(pdfDoc, page, zoom); }, [pdfDoc, page, draw, zoom]);

  /* ── مؤقت الـ UI ── */
  const bump = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    setUiOn(true);
    uiTimer.current = setTimeout(() => setUiOn(false), 3200);
  }, []);

  useEffect(() => { bump(); return () => { if (uiTimer.current) clearTimeout(uiTimer.current); }; }, [page, bump]);

  /* ── لوحة المفاتيح ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editingPage || navOpen) return;
      if (e.key === "ArrowLeft")  go(page + 1);
      else if (e.key === "ArrowRight") go(page - 1);
      else if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [page, editingPage, navOpen]);

  const go = useCallback((n: number) => {
    const p = Math.max(1, Math.min(TOTAL, n));
    setPage(p); lsSet(PAGE_KEY, p); bump();
  }, [bump]);

  /* ── اللمس ── */
  const onTS = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTE = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y);
    touchRef.current = null;
    if (dy > 60 || Math.abs(dx) < 35) { bump(); return; }
    go(dx < 0 ? page + 1 : page - 1);
  };

  const onFrameClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editingPage || navOpen) return;
    const { clientX, currentTarget } = e;
    const w = currentTarget.clientWidth;
    const zone = clientX / w;
    if (zone < 0.35)      go(page + 1);
    else if (zone > 0.65) go(page - 1);
    else bump();
  };

  /* ── تحرير رقم الصفحة ── */
  const startEdit = () => {
    setEditingPage(true);
    setEditVal(String(page));
    bump();
    setTimeout(() => pageInputRef.current?.select(), 30);
  };
  const commitEdit = () => {
    const n = parseInt(editVal, 10);
    if (!isNaN(n)) go(n);
    setEditingPage(false);
  };

  /* ── علامات المرجعية ── */
  const isBookmarked = bookmarks.includes(page);
  const toggleBookmark = () => {
    const next = isBookmarked
      ? bookmarks.filter(b => b !== page)
      : [...bookmarks, page].sort((a, b) => a - b);
    setBookmarks(next);
    lsSetArr(BM_KEY, next);
    bump();
  };

  /* ── الوضع الليلي ── */
  const toggleNight = () => {
    const next = !nightMode;
    setNightMode(next);
    try { localStorage.setItem("mj-mushaf-night", next ? "1" : "0"); } catch { /* */ }
    bump();
  };

  /* ── التكبير / التصغير ── */
  const adjustZoom = (delta: number) => {
    const next = Math.max(0.7, Math.min(1.35, Math.round((zoom + delta) * 10) / 10));
    setZoom(next);
    try { localStorage.setItem("mj-mushaf-zoom", String(next)); } catch { /* */ }
    bump();
  };

  const navBodyRef = useRef<HTMLDivElement>(null);

  /* ── فتح لوحة التنقل ── */
  const openNav = (tab: NavTab = "surahs") => {
    setNavTab(tab);
    setSearch("");
    setNavOpen(true);
    // على سطح المكتب فقط نفتح لوحة المفاتيح تلقائياً
    if (tab === "surahs" && window.matchMedia("(pointer: fine)").matches) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  };
  const goTo = (p: number) => { go(p); setNavOpen(false); };

  /* ── تمرير تلقائي للسورة الحالية عند فتح اللوحة ── */
  useEffect(() => {
    if (!navOpen || navTab !== "surahs") return;
    setTimeout(() => {
      navBodyRef.current
        ?.querySelector(".mshf-surah-item.active")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 120);
  }, [navOpen, navTab]);

  /* ── قائمة السور المفلترة ── */
  const filteredSurahs = SURAHS.filter(([name]) =>
    !search || name.includes(search)
  );

  /* ── اسم السورة الحالية ── */
  const currentSurah = (() => {
    for (let i = SURAHS.length - 1; i >= 0; i--) {
      if (page >= SURAHS[i][1]) return `${i + 1}. ${SURAHS[i][0]}`;
    }
    return "";
  })();

  /* ── رقم الجزء الحالي ── */
  const currentJuz = (() => {
    const pages = [1,22,42,62,82,102,121,142,162,182,201,221,241,261,281,301,321,341,361,381,401,421,441,461,481,501,521,542,561,581];
    for (let i = pages.length - 1; i >= 0; i--) {
      if (page >= pages[i]) return i + 1;
    }
    return 1;
  })();

  return (
    <div className="mshf-shell" dir="rtl">

      {/* ══ شريط علوي ══ */}
      <header className={`mshf-top${uiOn ? " on" : ""}`}>
        <button className="mshf-back" onClick={() => window.history.back()} aria-label="رجوع">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div className="mshf-title-wrap">
          <Star cls="mshf-star" />
          <div className="mshf-title-col">
            <span className="mshf-title">المصحف الشريف</span>
            {currentSurah && <span className="mshf-surah-name">{currentSurah}</span>}
          </div>
          <Star cls="mshf-star" />
        </div>

        <div className="mshf-top__actions">
          <button
            className={`mshf-icon-btn${isBookmarked ? " mshf-icon-btn--active" : ""}`}
            onClick={toggleBookmark}
            aria-label={isBookmarked ? "إزالة العلامة" : "إضافة علامة"}
            title={isBookmarked ? "إزالة العلامة" : "إضافة علامة"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
          <button
            className={`mshf-icon-btn${nightMode ? " mshf-icon-btn--active" : ""}`}
            onClick={toggleNight}
            aria-label={nightMode ? "الوضع النهاري" : "الوضع الليلي"}
            title={nightMode ? "الوضع النهاري" : "الوضع الليلي"}
          >
            {nightMode
              ? <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <button
            className="mshf-icon-btn"
            onClick={() => openNav("surahs")}
            aria-label="فهرس السور"
            title="فهرس السور"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/>
              <circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ══ منطقة الصفحة ══ */}
      <div
        ref={frameRef}
        className={`mshf-frame${nightMode ? " mshf-frame--night" : ""}`}
        onTouchStart={onTS}
        onTouchEnd={onTE}
        onClick={onFrameClick}
      >
        {rendering && !loadErr && (
          <div className="mshf-loading">
            <div className="mshf-spinner" />
            <span>{pdfDoc ? "جاري الرسم…" : "جاري تحميل المصحف…"}</span>
          </div>
        )}

        {loadErr && (
          <div className="mshf-err">
            <div className="mshf-err__icon">⚠</div>
            <p>تعذّر تحميل المصحف</p>
            <button onClick={() => window.location.reload()} className="mshf-err__btn">إعادة المحاولة</button>
          </div>
        )}

        {!loadErr && (
          <div className="mshf-wrap">
            <Star cls="mshf-c mshf-c--tl" />
            <Star cls="mshf-c mshf-c--tr" />
            <Star cls="mshf-c mshf-c--bl" />
            <Star cls="mshf-c mshf-c--br" />
            <canvas
              ref={canvasRef}
              className={`mshf-canvas${!rendering ? " ready" : ""}${nightMode ? " mshf-canvas--night" : ""}`}
              aria-label={`صفحة ${page} — ${currentSurah}`}
            />
          </div>
        )}

        {!loadErr && !rendering && (
          <>
            <div className="mshf-tap mshf-tap--next" onClick={e => { e.stopPropagation(); go(page + 1); }} aria-label="التالية" />
            <div className="mshf-tap mshf-tap--prev" onClick={e => { e.stopPropagation(); go(page - 1); }} aria-label="السابقة" />
          </>
        )}
      </div>

      {/* ══ شريط سفلي ══ */}
      <footer className={`mshf-bot${uiOn ? " on" : ""}`}>
        <button className="mshf-nav" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="السابقة">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <button className="mshf-zoom-btn" onClick={() => adjustZoom(-0.1)} disabled={zoom <= 0.7} aria-label="تصغير" title="تصغير">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>

        <div className="mshf-pgnum">
          {editingPage ? (
            <input
              ref={pageInputRef}
              className="mshf-pgnum__input"
              type="number"
              min={1}
              max={TOTAL}
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingPage(false); }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <button className="mshf-pgnum__btn" onClick={e => { e.stopPropagation(); startEdit(); }}>
              <span className="mshf-pgnum__juz">ج{currentJuz}</span>
              <span className="mshf-pgnum__cur">{page}</span>
              <span className="mshf-pgnum__sep">/</span>
              <span className="mshf-pgnum__tot">{TOTAL}</span>
            </button>
          )}
        </div>

        <button className="mshf-zoom-btn" onClick={() => adjustZoom(+0.1)} disabled={zoom >= 1.35} aria-label="تكبير" title="تكبير">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>

        <button className="mshf-nav" onClick={() => go(page + 1)} disabled={page >= TOTAL} aria-label="التالية">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </footer>

      {/* ══ لوحة التنقل (فهرس السور / الأجزاء / العلامات) ══ */}
      {navOpen && (
        <div className="mshf-nav-overlay" onClick={() => setNavOpen(false)}>
          <div className="mshf-nav-panel" onClick={e => e.stopPropagation()}>

            {/* رأس اللوحة */}
            <div className="mshf-nav-panel__head">
              <div className="mshf-nav-panel__tabs">
                {([["surahs","السور"],["juz","الأجزاء"],["bookmarks","العلامات"]] as [NavTab, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    className={`mshf-nav-panel__tab${navTab === id ? " active" : ""}`}
                    onClick={() => { setNavTab(id); setSearch(""); }}
                  >{label}</button>
                ))}
              </div>
              <button className="mshf-nav-panel__close" onClick={() => setNavOpen(false)} aria-label="إغلاق">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* بحث (للسور فقط) */}
            {navTab === "surahs" && (
              <div className="mshf-nav-search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={searchRef}
                  className="mshf-nav-search__input"
                  placeholder="ابحث عن سورة…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="بحث في السور"
                />
                {search && (
                  <button className="mshf-nav-search__clear" onClick={() => setSearch("")} aria-label="مسح البحث">✕</button>
                )}
              </div>
            )}

            {/* محتوى اللوحة */}
            <div ref={navBodyRef} className="mshf-nav-panel__body">

              {/* السور */}
              {navTab === "surahs" && (
                <div className="mshf-surah-list">
                  {filteredSurahs.length === 0 ? (
                    <p className="mshf-nav-empty">لا نتائج</p>
                  ) : filteredSurahs.map(([name, startPage]) => {
                    const idx = SURAHS.findIndex(s => s[0] === name);
                    const isActive = page >= startPage && (idx === SURAHS.length - 1 || page < SURAHS[idx + 1][1]);
                    return (
                      <button
                        key={name}
                        className={`mshf-surah-item${isActive ? " active" : ""}`}
                        onClick={() => goTo(startPage)}
                      >
                        <span className="mshf-surah-item__num">{idx + 1}</span>
                        <span className="mshf-surah-item__name">{name}</span>
                        <span className="mshf-surah-item__page">ص {startPage}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* الأجزاء */}
              {navTab === "juz" && (
                <div className="mshf-juz-grid">
                  {AJZAA.map(([label, startPage], i) => {
                    const isActive = page >= startPage && (i === AJZAA.length - 1 || page < AJZAA[i + 1][1]);
                    return (
                      <button
                        key={label}
                        className={`mshf-juz-item${isActive ? " active" : ""}`}
                        onClick={() => goTo(startPage)}
                      >
                        <span className="mshf-juz-item__n">{i + 1}</span>
                        <span className="mshf-juz-item__pg">ص {startPage}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* العلامات */}
              {navTab === "bookmarks" && (
                <div className="mshf-bm-list">
                  {bookmarks.length === 0 ? (
                    <div className="mshf-nav-empty">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                      </svg>
                      <p>لا توجد علامات محفوظة</p>
                      <p className="mshf-nav-empty__sub">اضغط 🔖 لحفظ صفحة</p>
                    </div>
                  ) : bookmarks.map(p => {
                    const surah = (() => { for (let i = SURAHS.length - 1; i >= 0; i--) if (p >= SURAHS[i][1]) return `${SURAHS[i][0]}`; return ""; })();
                    return (
                      <div key={p} className="mshf-bm-item">
                        <button className="mshf-bm-item__btn" onClick={() => goTo(p)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                          </svg>
                          <div>
                            <span className="mshf-bm-item__page">صفحة {p}</span>
                            <span className="mshf-bm-item__surah">{surah}</span>
                          </div>
                        </button>
                        <button
                          className="mshf-bm-item__del"
                          onClick={() => {
                            const next = bookmarks.filter(b => b !== p);
                            setBookmarks(next); lsSetArr(BM_KEY, next);
                          }}
                          aria-label="حذف العلامة"
                        >✕</button>
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
