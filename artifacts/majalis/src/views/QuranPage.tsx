"use client";

import {
  useCallback, useEffect, useMemo, useRef, useState, memo,
} from "react";
import {
  Bookmark, ChevronLeft, ChevronRight, List, Moon, Minus, Plus,
  Search, Sunrise, Sun, X,
} from "lucide-react";
import { useSearch } from "wouter";
import "@/styles/mushaf.css";
import { applyPageSeo } from "@/lib/seo";

/* ══════════════════════════════════════════════════════════════════════
   ثوابت وأنواع
   ══════════════════════════════════════════════════════════════════════ */
const API_BASE  = "https://api.alquran.cloud/v1";
const EDITION   = "quran-uthmani";      // النص العثماني الموثوق
const TOTAL_SURAHS = 114;

const SURAH_KEY  = "mj-quran-surah-v3";
const MODE_KEY   = "mj-quran-mode-v3";
const BM_KEY     = "mj-quran-bookmarks-v3";
const FONT_KEY   = "mj-quran-font-v3";

type ReadMode = "day" | "night" | "sepia";
type Ayah = { number: number; numberInSurah: number; text: string };
type SurahData = {
  number: number; name: string; englishName: string;
  revelationType: string; numberOfAyahs: number;
  ayahs: Ayah[];
};
type BmEntry = { surah: number; ayah: number; name: string };
type NavTab = "surahs" | "bookmarks";

/* ══ بيانات السور (اسم + عدد الآيات) — محفوظة من التغيير ══ */
const SURAHS_META: [string, number][] = [
  ["الفاتحة",7],["البقرة",286],["آل عمران",200],["النساء",176],
  ["المائدة",120],["الأنعام",165],["الأعراف",206],["الأنفال",75],
  ["التوبة",129],["يونس",109],["هود",123],["يوسف",111],
  ["الرعد",43],["إبراهيم",52],["الحجر",99],["النحل",128],
  ["الإسراء",111],["الكهف",110],["مريم",98],["طه",135],
  ["الأنبياء",112],["الحج",78],["المؤمنون",118],["النور",64],
  ["الفرقان",77],["الشعراء",227],["النمل",93],["القصص",88],
  ["العنكبوت",69],["الروم",60],["لقمان",34],["السجدة",30],
  ["الأحزاب",73],["سبأ",54],["فاطر",45],["يس",83],
  ["الصافات",182],["ص",88],["الزمر",75],["غافر",85],
  ["فصلت",54],["الشورى",53],["الزخرف",89],["الدخان",59],
  ["الجاثية",37],["الأحقاف",35],["محمد",38],["الفتح",29],
  ["الحجرات",18],["ق",45],["الذاريات",60],["الطور",49],
  ["النجم",62],["القمر",55],["الرحمن",78],["الواقعة",96],
  ["الحديد",29],["المجادلة",22],["الحشر",24],["الممتحنة",13],
  ["الصف",14],["الجمعة",11],["المنافقون",11],["التغابن",18],
  ["الطلاق",12],["التحريم",12],["الملك",30],["القلم",52],
  ["الحاقة",52],["المعارج",44],["نوح",28],["الجن",28],
  ["المزمل",20],["المدثر",56],["القيامة",40],["الإنسان",31],
  ["المرسلات",50],["النبأ",40],["النازعات",46],["عبس",42],
  ["التكوير",29],["الانفطار",19],["المطففين",36],["الانشقاق",25],
  ["البروج",22],["الطارق",17],["الأعلى",19],["الغاشية",26],
  ["الفجر",30],["البلد",20],["الشمس",15],["الليل",21],
  ["الضحى",11],["الشرح",8],["التين",8],["العلق",19],
  ["القدر",5],["البينة",8],["الزلزلة",8],["العاديات",11],
  ["القارعة",11],["التكاثر",8],["العصر",3],["الهمزة",9],
  ["الفيل",5],["قريش",4],["الماعون",7],["الكوثر",3],
  ["الكافرون",6],["النصر",3],["المسد",5],["الإخلاص",4],
  ["الفلق",5],["الناس",6],
];

const MODE_LABELS: Record<ReadMode, string> = {
  day: "النهاري", night: "الليلي", sepia: "الدافئ",
};
const MODE_CYCLE: ReadMode[] = ["day", "sepia", "night"];

/* البسملة (تُعرض قبل كل سورة ما عدا التوبة والفاتحة) */
const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/* ══ localStorage helpers ══ */
function lsGet<T>(k: string, fb: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) as T : fb;
  } catch { return fb; }
}
function lsSet<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ }
}

/* ══════════════════════════════════════════════════════════════════════
   مكون آية واحدة
   ══════════════════════════════════════════════════════════════════════ */
const AyahItem = memo(function AyahItem({
  ayah, fontSize, isBookmarked, onToggleBm,
}: {
  ayah: Ayah;
  fontSize: number;
  isBookmarked: boolean;
  onToggleBm: (n: number) => void;
}) {
  return (
    <div
      id={`ayah-${ayah.numberInSurah}`}
      className={`qs-ayah${isBookmarked ? " qs-ayah--bm" : ""}`}
    >
      <span className="qs-ayah__text" style={{ fontSize: `${fontSize}rem` }}>
        {ayah.text}
        {" "}
        <span className="qs-ayah__num" aria-label={`الآية ${ayah.numberInSurah}`}>
          &#x202D;({ayah.numberInSurah.toLocaleString("ar-EG")})&#x202C;
        </span>
      </span>
      <button
        type="button"
        className="qs-ayah__bm-btn"
        onClick={() => onToggleBm(ayah.numberInSurah)}
        aria-label={isBookmarked ? "إزالة العلامة" : "إضافة علامة"}
        title={isBookmarked ? "إزالة العلامة" : "إضافة علامة"}
      >
        <Bookmark
          size={13}
          strokeWidth={2}
          fill={isBookmarked ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </button>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════════════
   المكون الرئيسي
   ══════════════════════════════════════════════════════════════════════ */
export default function QuranPage() {
  const urlSearch = useSearch();
  /* ── حالة ── */
  const [surahNum, setSurahNum] = useState<number>(() => {
    const fromUrl = parseInt(new URLSearchParams(urlSearch).get("surah") ?? "", 10);
    if (fromUrl >= 1 && fromUrl <= TOTAL_SURAHS) return fromUrl;
    return lsGet(SURAH_KEY, 1);
  });
  const [readMode, setReadMode] = useState<ReadMode>(() => lsGet(MODE_KEY, "day"));
  const [fontSize, setFontSize] = useState<number>(() => lsGet(FONT_KEY, 1.9));
  const [bookmarks, setBookmarks] = useState<BmEntry[]>(() => lsGet(BM_KEY, []));

  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [navOpen, setNavOpen] = useState(false);
  const [navTab, setNavTab]   = useState<NavTab>("surahs");
  const [search, setSearch]   = useState("");
  const [uiOn, setUiOn]       = useState(true);

  const [modeBadge, setModeBadge] = useState(false);

  /* ── refs ── */
  const cache       = useRef<Map<number, SurahData>>(new Map());
  const uiTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  /* ── SEO ── */
  useEffect(() => {
    applyPageSeo({
      path: "/quran",
      title: "القرآن الكريم | المجلس العلمي",
      description: "اقرأ القرآن الكريم سورةً سورةً بنص عثماني موثوق — ابحث وضع علامات واختر وضع القراءة المناسب.",
      keywords: ["قرآن كريم", "مصحف", "تلاوة", "سور القرآن", "قراءة القرآن"],
    });
  }, []);

  /* ── جلب بيانات السورة ── */
  const fetchSurah = useCallback(async (n: number) => {
    if (cache.current.has(n)) {
      setSurahData(cache.current.get(n)!);
      setLoading(false);
      setError(false);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(false);
    setSurahData(null);
    const timeout = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`${API_BASE}/surah/${n}/${EDITION}`, { signal: ctrl.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      const d = json.data as SurahData;
      if (!d?.ayahs?.length) throw new Error("empty");
      cache.current.set(n, d);
      setSurahData(d);
    } catch (e: unknown) {
      clearTimeout(timeout);
      if ((e as Error)?.name !== "AbortError") setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /* حين تتغير السورة */
  useEffect(() => {
    fetchSurah(surahNum);
    lsSet(SURAH_KEY, surahNum);
    /* إعادة التمرير للأعلى */
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: "instant" }), 50);
  }, [surahNum, fetchSurah]);

  /* preload السورة التالية */
  useEffect(() => {
    if (surahNum < TOTAL_SURAHS && !cache.current.has(surahNum + 1)) {
      fetch(`${API_BASE}/surah/${surahNum + 1}/${EDITION}`)
        .then(r => r.json())
        .then(j => { cache.current.set(surahNum + 1, j.data); })
        .catch(() => { /* تجاهل أخطاء preload */ });
    }
  }, [surahNum]);

  /* ── UI timer ── */
  const bump = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    setUiOn(true);
    uiTimer.current = setTimeout(() => setUiOn(false), 4000);
  }, []);

  useEffect(() => { bump(); }, [surahNum, bump]);
  useEffect(() => () => { if (uiTimer.current) clearTimeout(uiTimer.current); }, []);

  /* ── الانتقال بين السور ── */
  const goSurah = useCallback((n: number) => {
    const p = Math.max(1, Math.min(TOTAL_SURAHS, n));
    setSurahNum(p);
    bump();
  }, [bump]);

  /* ── لوحة المفاتيح ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (navOpen) return;
      if (e.key === "ArrowLeft")       goSurah(surahNum + 1);
      else if (e.key === "ArrowRight") goSurah(surahNum - 1);
      else if (e.key === "+")          setFontSize(f => Math.min(3.0, +(f + 0.1).toFixed(1)));
      else if (e.key === "-")          setFontSize(f => Math.max(1.2, +(f - 0.1).toFixed(1)));
      else if (e.key === "Escape")     window.history.back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [surahNum, navOpen, goSurah]);

  /* ── حجم الخط ── */
  const incFont = () => setFontSize(f => { const n = Math.min(3.0, +(f + 0.15).toFixed(2)); lsSet(FONT_KEY, n); return n; });
  const decFont = () => setFontSize(f => { const n = Math.max(1.2, +(f - 0.15).toFixed(2)); lsSet(FONT_KEY, n); return n; });

  /* ── دورة الوضع ── */
  const cycleMode = useCallback(() => {
    setReadMode(cur => {
      const idx = MODE_CYCLE.indexOf(cur);
      const next = MODE_CYCLE[(idx + 1) % MODE_CYCLE.length];
      lsSet(MODE_KEY, next);
      return next;
    });
    setModeBadge(true);
    if (badgeTimer.current) clearTimeout(badgeTimer.current);
    badgeTimer.current = setTimeout(() => setModeBadge(false), 1800);
    bump();
  }, [bump]);

  /* ── علامات الآيات ── */
  const bmSet = useMemo(
    () => new Set(bookmarks.filter(b => b.surah === surahNum).map(b => b.ayah)),
    [bookmarks, surahNum],
  );

  const toggleBm = useCallback((ayahN: number) => {
    setBookmarks(cur => {
      const exists = cur.some(b => b.surah === surahNum && b.ayah === ayahN);
      const next = exists
        ? cur.filter(b => !(b.surah === surahNum && b.ayah === ayahN))
        : [...cur, { surah: surahNum, ayah: ayahN, name: SURAHS_META[surahNum - 1][0] }];
      lsSet(BM_KEY, next);
      return next;
    });
  }, [surahNum]);

  /* ── فتح لوحة التنقل ── */
  const openNav = useCallback((tab: NavTab = "surahs") => {
    setNavTab(tab);
    setSearch("");
    setNavOpen(true);
    if (tab === "surahs") setTimeout(() => searchRef.current?.focus(), 80);
  }, []);

  const goTo = useCallback((n: number) => { goSurah(n); setNavOpen(false); }, [goSurah]);

  /* ── السور المفلترة ── */
  const filteredSurahs = useMemo(
    () => SURAHS_META.map((m, i) => ({ ...m, idx: i + 1 }))
          .filter(({ 0: name }) => !search || name.includes(search)),
    [search],
  );

  /* بسملة — لا تُعرض للفاتحة (مضمّنة في الآيات) ولا التوبة */
  const showBasmala = surahNum !== 1 && surahNum !== 9;

  /* أيقونة الوضع */
  const ModeIcon = readMode === "night" ? Moon : readMode === "sepia" ? Sunrise : Sun;

  /* معلومات السورة الحالية */
  const surahMeta = SURAHS_META[surahNum - 1];

  /* ══════════════════════════════════════════════════════════════════════
     JSX
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={`mshf-shell qs-shell${
        readMode === "night" ? " mshf-night" : readMode === "sepia" ? " mshf-sepia" : ""
      }`}
      dir="rtl"
      onClick={bump}
    >

      {/* شريط التقدم */}
      <div
        className="mshf-progress"
        style={{ "--mshf-pct": `${((surahNum - 1) / (TOTAL_SURAHS - 1)) * 100}%` } as React.CSSProperties}
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
            {surahNum}. {surahMeta[0]} — {surahMeta[1].toLocaleString("ar-EG")} آية
          </span>
        </div>

        <div className="mshf-top-actions">
          <button
            type="button"
            className={`mshf-icon-btn${readMode !== "day" ? " active" : ""}`}
            onClick={cycleMode}
            aria-label={`وضع القراءة: ${MODE_LABELS[readMode]}`}
          >
            <ModeIcon size={17} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mshf-icon-btn"
            onClick={() => openNav("surahs")}
            aria-label="قائمة السور"
          >
            <List size={17} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ══ منطقة النص ══ */}
      <div
        className="mshf-page-container qs-reader-area"
        ref={scrollRef}
        onClick={bump}
      >
        {loading && (
          <div className="mshf-loading">
            <div className="mshf-spinner" />
            <span>جاري تحميل السورة…</span>
          </div>
        )}

        {error && !loading && (
          <div className="mshf-err">
            <p>تعذّر تحميل سورة {SURAHS_META[surahNum - 1][0]}.</p>
            <p className="mshf-err-sub">تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p>
            <button
              type="button"
              className="mshf-err-btn"
              onClick={() => { setError(false); fetchSurah(surahNum); }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {surahData && !loading && (
          <div className="qs-surah">
            {/* رأس السورة */}
            <div className="qs-surah-header">
              <div className="qs-surah-ornament" aria-hidden="true">﷽</div>
              <h1 className="qs-surah-name">سورة {surahData.name}</h1>
              <p className="qs-surah-meta">
                {surahData.revelationType === "Meccan" ? "مكية" : "مدنية"}
                {" · "}
                {surahData.numberOfAyahs.toLocaleString("ar-EG")} آية
              </p>
            </div>

            {/* البسملة */}
            {showBasmala && (
              <div className="qs-basmala" aria-label="بسم الله الرحمن الرحيم">
                {BASMALA}
              </div>
            )}

            {/* الآيات */}
            <div className="qs-ayahs" lang="ar">
              {surahData.ayahs.map(ay => (
                <AyahItem
                  key={ay.number}
                  ayah={ay}
                  fontSize={fontSize}
                  isBookmarked={bmSet.has(ay.numberInSurah)}
                  onToggleBm={toggleBm}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* بادج الوضع */}
      <div
        className={`mshf-mode-badge${modeBadge ? " show" : ""}`}
        aria-live="polite"
      >
        وضع {MODE_LABELS[readMode]}
      </div>

      {/* ══ شريط سفلي ══ */}
      <footer className={`mshf-bot${uiOn ? " on" : ""}`}>
        {/* تحكم حجم الخط */}
        <div className="mshf-zoom-ctrl">
          <button
            type="button"
            className="mshf-zoom-btn"
            onClick={decFont}
            disabled={fontSize <= 1.2}
            aria-label="تصغير الخط"
          >
            <Minus size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mshf-zoom-btn mshf-zoom-btn--reset"
            onClick={() => { setFontSize(1.9); lsSet(FONT_KEY, 1.9); }}
            title="إعادة الضبط"
          >
            {Math.round(fontSize * 10)}
          </button>
          <button
            type="button"
            className="mshf-zoom-btn"
            onClick={incFont}
            disabled={fontSize >= 3.0}
            aria-label="تكبير الخط"
          >
            <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* السورة السابقة */}
        <button
          type="button"
          className="mshf-nav-btn"
          onClick={() => goSurah(surahNum - 1)}
          disabled={surahNum <= 1}
          aria-label="السورة السابقة"
        >
          <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>

        {/* رقم السورة */}
        <div className="mshf-pgnum">
          <button
            type="button"
            className="mshf-pgnum-btn"
            onClick={() => openNav("surahs")}
            aria-label="اختيار سورة"
          >
            <span className="mshf-pgnum-cur">{surahNum.toLocaleString("ar-EG")}</span>
            <span className="mshf-pgnum-sep">/</span>
            <span className="mshf-pgnum-tot">{TOTAL_SURAHS}</span>
          </button>
        </div>

        {/* السورة التالية */}
        <button
          type="button"
          className="mshf-nav-btn"
          onClick={() => goSurah(surahNum + 1)}
          disabled={surahNum >= TOTAL_SURAHS}
          aria-label="السورة التالية"
        >
          <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </footer>

      {/* ══ Bottom Sheet — الفهرس والعلامات ══ */}
      {navOpen && (
        <div className="mshf-sheet-overlay" onClick={() => setNavOpen(false)}>
          <div className="mshf-sheet" onClick={e => e.stopPropagation()}>

            <div className="mshf-sheet-handle" />

            <div className="mshf-sheet-head">
              <div className="mshf-sheet-tabs">
                {([
                  ["surahs",    "السور"],
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
                    <p className="mshf-empty" style={{ gridColumn: "1/-1" }}>لا نتائج</p>
                  ) : filteredSurahs.map(({ 0: name, 1: ayahCount, idx }) => (
                    <button
                      type="button"
                      key={idx}
                      className={`mshf-surah-row${surahNum === idx ? " active" : ""}`}
                      onClick={() => goTo(idx)}
                    >
                      <span className="mshf-surah-num">{idx}</span>
                      <span className="mshf-surah-name">{name}</span>
                      <span className="mshf-surah-page">{ayahCount.toLocaleString("ar-EG")} آية</span>
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
                      <p className="mshf-empty-sub">اضغط أيقونة العلامة بجانب أي آية لحفظها</p>
                    </div>
                  ) : bookmarks.map(bm => (
                    <div key={`${bm.surah}-${bm.ayah}`} className="mshf-bm-row">
                      <button
                        type="button"
                        className="mshf-bm-btn"
                        onClick={() => {
                          goSurah(bm.surah);
                          setNavOpen(false);
                          setTimeout(() => {
                            document.getElementById(`ayah-${bm.ayah}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 400);
                        }}
                      >
                        <Bookmark size={13} fill="currentColor" stroke="none" aria-hidden="true" />
                        <div className="mshf-bm-info">
                          <span className="mshf-bm-page">
                            سورة {bm.name} — آية {bm.ayah.toLocaleString("ar-EG")}
                          </span>
                          <span className="mshf-bm-surah">السورة {bm.surah.toLocaleString("ar-EG")}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="mshf-bm-del"
                        onClick={() => setBookmarks(cur => {
                          const next = cur.filter(b => !(b.surah === bm.surah && b.ayah === bm.ayah));
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
