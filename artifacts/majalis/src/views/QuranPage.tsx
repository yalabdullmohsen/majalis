import {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Bookmark, BookOpen, ChevronLeft, ChevronRight,
  List, Moon, Pause, Play, Search, Sun, Volume2, X, ZoomIn, ZoomOut,
} from "lucide-react";
import "@/styles/mushaf.css";
import { applyPageSeo } from "@/lib/seo";
import { useAuth } from "@/components/AuthProvider";

/* ══════════════════════════════════════════════════════════════════
   ثوابت
   ══════════════════════════════════════════════════════════════════ */
const TOTAL_PAGES  = 604;
const PAGE_KEY     = "mj-mushaf-page-v4";
const BM_KEY       = "mj-mushaf-bm-v4";
const ZOOM_KEY     = "mj-mushaf-zoom-v4";
const MODE_KEY     = "mj-mushaf-mode-v4";
const FAV_KEY      = "mj-mushaf-fav-v4";
const BASE_FONT    = 1.9; // rem
const API_BASE     = "https://api.alquran.cloud/v1/page";
const EDITION      = "quran-uthmani";

type ReadMode = "day" | "night" | "sepia";

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  surah: { number: number; name: string; numberOfAyahs: number; revelationType: string };
  juz: number;
  sajda: boolean | object;
}

interface SearchResult {
  number: number;
  text: string;
  surah: { number: number; name: string };
  numberInSurah: number;
  page: number;
}

/* كاش في الذاكرة، يمنع إعادة الجلب عند التنقل بين الصفحات */
const pageCache = new Map<number, Ayah[]>();

/* القراء المتاحون */
const RECITERS = [
  { id: "ar.alafasy",            name: "المشاري راشد العفاسي"   },
  { id: "ar.mahermuaiqly",       name: "ماهر المعيقلي"          },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد"  },
  { id: "ar.husary",             name: "محمود خليل الحصري"      },
  { id: "ar.minshawi",           name: "محمد صديق المنشاوي"    },
  { id: "ar.abdullahbasfar",     name: "عبد الله بصفر"          },
  { id: "ar.saoodshuraym",       name: "سعود الشريم"            },
  { id: "ar.yasseraldosari",     name: "ياسر الدوسري"           },
  { id: "ar.ahmedajamy",         name: "أحمد العجمي"            },
  { id: "ar.muhammadayyoub",     name: "محمد أيوب"              },
  { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس"      },
  { id: "ar.muhammadjibreel",    name: "محمد جبريل"             },
  { id: "ar.hudhaify",           name: "علي الحذيفي"            },
  { id: "ar.hanirifai",          name: "هاني الرفاعي"           },
  { id: "ar.shaatree",           name: "أبو بكر الشاطري"        },
  { id: "ar.aymanswoaid",        name: "أيمن سويد"              },
];

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

/* الأجزاء الثلاثون — رقم الجزء → أول صفحة */
const JUZS: [string, number][] = [
  ["الجزء الأول",1],["الجزء الثاني",22],["الجزء الثالث",42],
  ["الجزء الرابع",62],["الجزء الخامس",82],["الجزء السادس",102],
  ["الجزء السابع",121],["الجزء الثامن",142],["الجزء التاسع",162],
  ["الجزء العاشر",182],["الجزء الحادي عشر",201],["الجزء الثاني عشر",222],
  ["الجزء الثالث عشر",242],["الجزء الرابع عشر",262],["الجزء الخامس عشر",282],
  ["الجزء السادس عشر",302],["الجزء السابع عشر",322],["الجزء الثامن عشر",342],
  ["الجزء التاسع عشر",362],["الجزء العشرون",382],["الجزء الحادي والعشرون",402],
  ["الجزء الثاني والعشرون",422],["الجزء الثالث والعشرون",442],["الجزء الرابع والعشرون",462],
  ["الجزء الخامس والعشرون",482],["الجزء السادس والعشرون",502],["الجزء السابع والعشرون",522],
  ["الجزء الثامن والعشرون",542],["الجزء التاسع والعشرون",562],["الجزء الثلاثون",582],
];

function pageToJuzNum(page: number): number {
  let juz = 1;
  for (let i = 0; i < JUZS.length; i++) {
    if (JUZS[i][1] <= page) juz = i + 1;
    else break;
  }
  return juz;
}

function pageToSurahName(page: number): string {
  let name = SURAHS[0][0];
  for (const [n, p] of SURAHS) {
    if (p <= page) name = n;
    else break;
  }
  return name;
}

function lsGet<T>(k: string, fb: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
}
function lsSet<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ }
}

/* تجميع الآيات حسب السورة */
function groupBySurah(ayahs: Ayah[]) {
  const result: { num: number; name: string; revelationType: string; isFirst: boolean; ayahs: Ayah[] }[] = [];
  for (const a of ayahs) {
    const last = result[result.length - 1];
    if (!last || last.num !== a.surah.number) {
      result.push({ num: a.surah.number, name: a.surah.name, revelationType: a.surah.revelationType, isFirst: a.numberInSurah === 1, ayahs: [a] });
    } else {
      last.ayahs.push(a);
    }
  }
  return result;
}

/* يفصل البسملة المدمجة في نص الآية الأولى من API في طبقة العرض فقط */
function stripBasmalaFromDisplay(text: string): string {
  const END_MARKER = "ٱلرَّحِيمِ";
  const idx = text.indexOf(END_MARKER);
  if (idx === -1) return text;
  const after = idx + END_MARKER.length;
  let start = after;
  while (start < text.length && (text[start] === " " || text.charCodeAt(start) === 0x200C || text.charCodeAt(start) === 0x200D)) {
    start++;
  }
  return start < text.length ? text.slice(start) : text;
}

/* ══════════════════════════════════════════════════════════════════
   المكون الرئيسي
   ══════════════════════════════════════════════════════════════════ */
export default function QuranPage() {
  const { isAdmin } = useAuth();

  /* ── حالة ── */
  const [page, setPage]       = useState<number>(() => lsGet(PAGE_KEY, 1));
  const [mode, setMode]       = useState<ReadMode>(() => lsGet(MODE_KEY, "day"));
  const [zoom, setZoom]       = useState<number>(() => {
    const v = lsGet(ZOOM_KEY, BASE_FONT);
    return v < 1.0 ? BASE_FONT : v;
  });
  const [bookmarks, setBookmarks] = useState<number[]>(() => lsGet(BM_KEY, []));
  /* الآيات المفضلة: مصفوفة أرقام الآيات (الترتيب المطلق في القرآن) */
  const [favAyahs, setFavAyahs] = useState<number[]>(() => lsGet(FAV_KEY, []));
  const [navOpen, setNavOpen]  = useState(false);
  const [navTab, setNavTab]    = useState<"surahs" | "juzs" | "bookmarks" | "favs" | "search">("surahs");
  const [search, setSearch]    = useState("");
  /* تعديل رقم الصفحة مباشرة */
  const [editPage, setEditPage] = useState(false);
  const [editVal,  setEditVal]  = useState("");

  /* ── بحث نص الآيات ── */
  const [vsearch, setVsearch]       = useState("");
  const [vsLoading, setVsLoading]   = useState(false);
  const [vsErr, setVsErr]           = useState(false);
  const [vsResults, setVsResults]   = useState<SearchResult[]>([]);
  const [vsTotal, setVsTotal]       = useState(0);
  const [uiOn, setUiOn]        = useState(true);
  const [anim, setAnim]        = useState<"" | "anim-left" | "anim-right">("");

  /* ── حالة API ── */
  const [ayahs, setAyahs]     = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  /* ── حالة لوحة القراء ── */
  const [selAyah, setSelAyah]       = useState<Ayah | null>(null);
  const [playingId, setPlayingId]   = useState<string | null>(null);
  const audioRef                    = useRef<HTMLAudioElement | null>(null);

  /* ── ميزة التكرار والتوقف بوقت محدد ── */
  const [repeatMode,    setRepeatMode]    = useState<"none"|"verse"|"page"|"surah">("none");
  const [stopAtTime,    setStopAtTime]    = useState(""); // "HH:MM"
  const [timerActive,   setTimerActive]   = useState(false);
  const repeatRef = useRef<"none"|"verse"|"page"|"surah">("none");

  /* ── التفسير المختصر ── */
  const [tafseer, setTafseer]       = useState<string | null>(null);
  const [tafseerLoading, setTafseerLoading] = useState(false);
  const stopTimeRef = useRef<string>("");
  const timerCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { repeatRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { stopTimeRef.current = stopAtTime; }, [stopAtTime]);

  /* تحقق كل 15 ث إن كان الوقت تجاوز وقت التوقف */
  useEffect(() => {
    if (!timerActive || !stopAtTime) {
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
      timerCheckRef.current = null;
      return;
    }
    timerCheckRef.current = setInterval(() => {
      const now = new Date();
      const [hh, mm] = stopTimeRef.current.split(":").map(Number);
      if (!isNaN(hh) && !isNaN(mm)) {
        if (now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= mm)) {
          audioRef.current?.pause();
          setPlayingId(null);
          setTimerActive(false);
          setRepeatMode("none");
          clearInterval(timerCheckRef.current!);
          timerCheckRef.current = null;
        }
      }
    }, 15000);
    return () => { if (timerCheckRef.current) clearInterval(timerCheckRef.current); };
  }, [timerActive, stopAtTime]);

  /* ── refs ── */
  const uiTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef  = useRef<HTMLInputElement>(null);
  const vsearchRef = useRef<HTMLInputElement>(null);
  const pageEditRef = useRef<HTMLInputElement>(null);
  const touchX     = useRef<number | null>(null);
  const readerRef  = useRef<HTMLDivElement>(null);

  /* ref لتخزين حالة التشغيل المتسلسل */
  const repeatStateRef = useRef<{ reciterId: string; queue: number[]; idx: number } | null>(null);

  /* تشغيل آية واحدة، مع منطق التكرار عند الانتهاء */
  const playAyahDirect = useCallback((reciterId: string, ayahNum: number) => {
    const url = `https://cdn.islamic.network/quran/audio/128/${reciterId}/${ayahNum}.mp3`;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(reciterId);
    audio.play().catch(() => {});
    audio.onended = () => {
      const st = repeatStateRef.current;
      if (!st || repeatRef.current === "none") { setPlayingId(null); return; }
      let nextIdx = st.idx + 1;
      if (nextIdx >= st.queue.length) nextIdx = 0;
      repeatStateRef.current = { ...st, idx: nextIdx };
      playAyahDirect(st.reciterId, st.queue[nextIdx]);
    };
    audio.onerror = () => { setPlayingId(null); repeatStateRef.current = null; };
  }, []);

  /* ── وظائف الصوت ── */
  const playReciter = useCallback((reciterId: string, ayahNum: number) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (playingId === reciterId && repeatRef.current === "none") {
      setPlayingId(null);
      repeatStateRef.current = null;
      return;
    }
    /* بناء قائمة الآيات حسب وضع التكرار */
    const mode = repeatRef.current;
    let queue: number[] = [ayahNum];
    if (mode === "verse") {
      queue = [ayahNum];
    } else if (mode === "page" || mode === "surah") {
      const currentAyah = ayahs.find(a => a.number === ayahNum);
      if (currentAyah && mode === "surah") {
        queue = ayahs.filter(a => a.surah.number === currentAyah.surah.number).map(a => a.number);
      } else {
        queue = ayahs.map(a => a.number);
      }
    }
    const startIdx = queue.indexOf(ayahNum);
    repeatStateRef.current = { reciterId, queue, idx: startIdx >= 0 ? startIdx : 0 };
    playAyahDirect(reciterId, ayahNum);
  }, [playingId, ayahs, playAyahDirect]);

  const closeReciterPanel = useCallback(() => {
    audioRef.current?.pause();
    setPlayingId(null);
    setSelAyah(null);
  }, []);

  /* ── تبديل الآيات المفضلة ── */
  const toggleFav = useCallback((ayahNum: number) => {
    setFavAyahs(cur => {
      const next = cur.includes(ayahNum) ? cur.filter(n => n !== ayahNum) : [...cur, ayahNum];
      lsSet(FAV_KEY, next);
      return next;
    });
  }, []);

  /* ── SEO ── */
  useEffect(() => {
    applyPageSeo({
      path: "/quran",
      title: "القرآن الكريم | المجلس العلمي",
      description: "اقرأ المصحف الشريف، 604 صفحة بخط عثماني عالي الجودة مع حفظ الموضع والإشارات المرجعية.",
      keywords: ["قرآن كريم", "مصحف", "تلاوة", "سور القرآن"],
    });
  }, []);

  /* ── جلب الصفحة من API ── */
  useEffect(() => {
    if (pageCache.has(page)) {
      setAyahs(pageCache.get(page)!);
      setLoading(false);
      setFetchErr(false);
      readerRef.current?.scrollTo({ top: 0 });
      return;
    }
    setLoading(true);
    setFetchErr(false);
    const ctrl = new AbortController();
    fetch(`${API_BASE}/${page}/${EDITION}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then((data: { code: number; data: { ayahs: Ayah[] } }) => {
        if (data.code === 200) {
          pageCache.set(page, data.data.ayahs);
          setAyahs(data.data.ayahs);
          setLoading(false);
          readerRef.current?.scrollTo({ top: 0 });
        } else {
          setFetchErr(true);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setFetchErr(true);
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [page, retryKey]);

  /* ── جلب التفسير المختصر عند اختيار آية ── */
  useEffect(() => {
    if (!selAyah) { setTafseer(null); return; }
    setTafseerLoading(true);
    setTafseer(null);
    fetch(`https://api.alquran.cloud/v1/ayah/${selAyah.number}/ar.jalalayn`)
      .then(r => r.json())
      .then((d: { code: number; data: { text: string } }) => {
        if (d.code === 200) setTafseer(d.data.text);
      })
      .catch(() => {})
      .finally(() => setTafseerLoading(false));
  }, [selAyah]);

  /* ── bump، إظهار واجهة التحكم لفترة ثم إخفاؤها ── */
  const bump = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    setUiOn(true);
    uiTimer.current = setTimeout(() => setUiOn(false), 4500);
  }, []);

  useEffect(() => { bump(); }, [page, bump]);
  useEffect(() => () => { if (uiTimer.current) clearTimeout(uiTimer.current); }, []);

  /* ── بحث في نصوص الآيات، debounced 700ms ── */
  useEffect(() => {
    if (navTab !== "search") return;
    if (vsearch.trim().length < 2) { setVsResults([]); setVsTotal(0); return; }
    const t = setTimeout(() => {
      setVsLoading(true);
      setVsErr(false);
      fetch(
        `https://api.alquran.cloud/v1/search/${encodeURIComponent(vsearch.trim())}/all/quran-uthmani`,
      )
        .then(r => r.json())
        .then((d: { code: number; data: { count: number; matches: SearchResult[] } }) => {
          if (d.code === 200) {
            setVsResults(d.data.matches.slice(0, 30));
            setVsTotal(d.data.count);
          } else {
            setVsErr(true);
          }
        })
        .catch(() => setVsErr(true))
        .finally(() => setVsLoading(false));
    }, 700);
    return () => clearTimeout(t);
  }, [vsearch, navTab]);

  /* ── التنقل بين الصفحات ── */
  const goPage = useCallback((n: number, dir: "left" | "right" | "" = "") => {
    const p = Math.max(1, Math.min(TOTAL_PAGES, n));
    if (p === page) return;
    if (dir) {
      setAnim(dir === "left" ? "anim-left" : "anim-right");
      setTimeout(() => { setPage(p); lsSet(PAGE_KEY, p); setAnim(""); }, 180);
    } else {
      setPage(p); lsSet(PAGE_KEY, p);
    }
    bump();
  }, [page, bump]);

  /* ── لوحة المفاتيح ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setNavOpen(false); return; }
      if (navOpen) return;
      if (e.key === "ArrowLeft")       goPage(page + 1, "left");
      else if (e.key === "ArrowRight") goPage(page - 1, "right");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [page, navOpen, goPage]);

  /* ── اللمس ── */
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goPage(page + 1, "left");
    else         goPage(page - 1, "right");
  };

  /* ── دورة وضع القراءة ── */
  const cycleMode = useCallback(() => {
    setMode(cur => {
      const modes: ReadMode[] = ["day", "sepia", "night"];
      const next = modes[(modes.indexOf(cur) + 1) % modes.length];
      lsSet(MODE_KEY, next);
      return next;
    });
    bump();
  }, [bump]);

  /* ── العلامات المرجعية ── */
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

  /* ── حجم الخط ── */
  const incZoom = () => { const n = Math.min(3.2, +(zoom + 0.2).toFixed(1)); setZoom(n); lsSet(ZOOM_KEY, n); };
  const decZoom = () => { const n = Math.max(1.2, +(zoom - 0.2).toFixed(1)); setZoom(n); lsSet(ZOOM_KEY, n); };
  const zoomPct = Math.round((zoom / BASE_FONT) * 100);

  /* ── قائمة السور المفلترة ── */
  const filteredSurahs = useMemo(
    () => SURAHS.map(([name, firstPage], i) => ({ name, firstPage, num: i + 1 }))
          .filter(s => !search || s.name.includes(search)),
    [search],
  );

  const surahName = useMemo(() => pageToSurahName(page), [page]);
  const juzNum    = useMemo(() => pageToJuzNum(page), [page]);
  const groups    = useMemo(() => groupBySurah(ayahs), [ayahs]);
  const modeClass = mode === "night" ? " mshf-night" : mode === "sepia" ? " mshf-sepia" : "";
  const ModeIcon  = mode === "night" ? Moon : Sun;

  /* ══════════════════════════════════════════════════════════════════
     JSX
     ══════════════════════════════════════════════════════════════════ */
  return createPortal(
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
            {surahName} — ص {page.toLocaleString("ar-EG")}
            {isAdmin && ` — ج ${juzNum.toLocaleString("ar-EG")}`}
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
            onClick={e => {
              e.stopPropagation();
              setVsearch(""); setVsResults([]); setVsTotal(0);
              setNavOpen(true);
              setNavTab("search");
              setTimeout(() => vsearchRef.current?.focus(), 80);
            }}
            aria-label="بحث في القرآن"
          >
            <Search size={17} strokeWidth={2} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="mshf-icon-btn"
            onClick={e => {
              e.stopPropagation();
              setSearch("");
              setNavOpen(true);
              setNavTab("surahs");
              setTimeout(() => searchRef.current?.focus(), 80);
            }}
            aria-label="قائمة السور"
          >
            <List size={17} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ══ منطقة القراءة ══ */}
      <div
        ref={readerRef}
        className={`mshf-page-container qs-reader-area${anim ? ` ${anim}` : ""}`}
        style={{ "--qs-font-size": `${zoom}rem` } as React.CSSProperties}
      >
        {/* مؤشر التحميل */}
        {loading && (
          <div className="mshf-loading" aria-live="polite">
            <div className="mshf-spinner" />
            <span>جاري تحميل الصفحة {page.toLocaleString("ar-EG")}…</span>
          </div>
        )}

        {/* خطأ الجلب */}
        {fetchErr && !loading && (
          <div className="mshf-err">
            <BookOpen size={52} strokeWidth={1} className="icon-ghost" aria-hidden="true" />
            <p>تعذّر تحميل الصفحة {page.toLocaleString("ar-EG")}</p>
            <p className="mshf-err-sub">تحقق من اتصالك بالإنترنت ثم أعد المحاولة</p>
            <button
              type="button"
              className="mshf-err-btn"
              onClick={() => setRetryKey(k => k + 1)}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* النص القرآني بالرسم العثماني */}
        {!loading && !fetchErr && groups.map(group => (
          <div key={group.num} className="qs-surah-block">
            {/* البسملة منفصلة فوق السورة، لكل سورة جديدة ما عدا الفاتحة والتوبة */}
            {group.isFirst && group.num !== 1 && group.num !== 9 && (
              <div className="qs-basmala" lang="ar" dir="rtl">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
            )}

            <div className="qs-surah">
            {/* رأس السورة */}
            {group.isFirst && (
              <div className="qs-surah-header">
                <span className="qs-surah-ornament" aria-hidden="true">❧</span>
                <h2 className="qs-surah-name">{group.name}</h2>
                <p className="qs-surah-meta">
                  سورة رقم {group.num.toLocaleString("ar-EG")}، {group.revelationType === "Meccan" ? "مكية" : "مدنية"}
                </p>
              </div>
            )}

            {/* الآيات بالرسم العثماني */}
            <div className="qs-ayahs" lang="ar" dir="rtl">
              {group.ayahs.map(ayah => {
                const isFav = favAyahs.includes(ayah.number);
                const displayText = (group.isFirst && ayah.numberInSurah === 1 && group.num !== 1 && group.num !== 9)
                  ? stripBasmalaFromDisplay(ayah.text)
                  : ayah.text;
                const isSelected = selAyah?.number === ayah.number;
                return (
                  <span
                    key={ayah.number}
                    className={`qs-ayah${isSelected ? " qs-ayah--selected" : ""}${isFav ? " qs-ayah--fav" : ""}`}
                    onClick={e => { e.stopPropagation(); setSelAyah(isSelected ? null : ayah); if (isSelected) closeReciterPanel(); }}
                    title={`اضغط لسماع الآية ${ayah.numberInSurah}`}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="qs-ayah__text">{displayText}</span>
                    {isFav && <span className="qs-ayah__fav-dot" aria-hidden="true">⭐</span>}
                    <span
                      className="qs-ayah__num"
                      aria-label={`آية ${ayah.numberInSurah}`}
                      role="img"
                    >
                      {ayah.numberInSurah.toLocaleString("ar-EG")}
                    </span>
                  </span>
                );
              })}
            </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ شريط سفلي ══ */}
      <footer className={`mshf-bot${uiOn ? " on" : ""}`}>
        {/* تحكم حجم الخط */}
        <div className="mshf-zoom-ctrl">
          <button
            type="button"
            className="mshf-zoom-btn"
            onClick={decZoom}
            disabled={zoom <= 1.2}
            aria-label="تصغير الخط"
          >
            <ZoomOut size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mshf-zoom-btn mshf-zoom-btn--reset"
            onClick={() => { setZoom(BASE_FONT); lsSet(ZOOM_KEY, BASE_FONT); }}
            title="إعادة الحجم الافتراضي"
          >
            {zoomPct}٪
          </button>
          <button
            type="button"
            className="mshf-zoom-btn"
            onClick={incZoom}
            disabled={zoom >= 3.2}
            aria-label="تكبير الخط"
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

        {/* رقم الصفحة — نقرة واحدة تفتح الإدخال المباشر */}
        <div className="mshf-pgnum">
          {editPage ? (
            <input
              ref={pageEditRef}
              type="number"
              className="mshf-pgnum-input"
              value={editVal}
              min={1}
              max={TOTAL_PAGES}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const n = parseInt(editVal, 10);
                  if (!isNaN(n)) goPage(n);
                  setEditPage(false);
                } else if (e.key === "Escape") {
                  setEditPage(false);
                }
              }}
              onBlur={() => {
                const n = parseInt(editVal, 10);
                if (!isNaN(n)) goPage(n);
                setEditPage(false);
              }}
              aria-label="رقم الصفحة"
            />
          ) : (
            <button
              type="button"
              className="mshf-pgnum-btn"
              onClick={() => {
                setEditVal(String(page));
                setEditPage(true);
                setTimeout(() => { pageEditRef.current?.select(); }, 60);
              }}
              aria-label="انقر لتحديد صفحة"
              title="انقر لتحديد صفحة"
            >
              <span className="mshf-pgnum-cur">{page.toLocaleString("ar-EG")}</span>
              <span className="mshf-pgnum-sep">/</span>
              <span className="mshf-pgnum-tot">{TOTAL_PAGES}</span>
            </button>
          )}
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

      {/* ══ Bottom Sheet، السور والعلامات ══ */}
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
                {(["surahs", "juzs", "favs", "bookmarks", "search"] as const).map(id => (
                  <button
                    key={id}
                    type="button"
                    className={`mshf-sheet-tab${navTab === id ? " active" : ""}`}
                    onClick={() => {
                      setNavTab(id);
                      if (id !== "search") setSearch("");
                      if (id === "search") setTimeout(() => vsearchRef.current?.focus(), 80);
                    }}
                  >
                    {id === "surahs" ? "السور" : id === "juzs" ? "الأجزاء" : id === "favs" ? "⭐ مفضلة" : id === "bookmarks" ? "علامات" : "بحث"}
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

            {/* بحث في نصوص الآيات */}
            {navTab === "search" && (
              <div className="mshf-search-bar">
                <Search size={14} strokeWidth={2} aria-hidden="true" />
                <input
                  ref={vsearchRef}
                  className="mshf-search-input"
                  placeholder="ابحث في القرآن الكريم…"
                  value={vsearch}
                  onChange={e => setVsearch(e.target.value)}
                  aria-label="بحث في نصوص الآيات"
                  type="search"
                  dir="rtl"
                  autoComplete="off"
                />
                {vsearch && (
                  <button
                    type="button"
                    className="mshf-search-clear"
                    onClick={() => { setVsearch(""); setVsResults([]); setVsTotal(0); }}
                    aria-label="مسح"
                  >✕</button>
                )}
              </div>
            )}

            <div className="mshf-sheet-body">

              {/* نتائج البحث في الآيات */}
              {navTab === "search" && (
                <div>
                  {vsLoading && (
                    <div className="mshf-vsr-loading">
                      <div className="mshf-spinner" aria-hidden="true" />
                      <span>جاري البحث…</span>
                    </div>
                  )}
                  {vsErr && !vsLoading && (
                    <div className="mshf-vsr-err">
                      تعذّر البحث، تحقق من اتصالك وأعد المحاولة
                    </div>
                  )}
                  {!vsLoading && !vsErr && vsResults.length > 0 && (
                    <div className="mshf-vsr-list">
                      {vsTotal > 0 && (
                        <p className="mshf-vsr-count">
                          {vsTotal.toLocaleString("ar-EG")} نتيجة، يُعرض {vsResults.length.toLocaleString("ar-EG")}
                        </p>
                      )}
                      {vsResults.map(r => (
                        <button
                          key={r.number}
                          type="button"
                          className="mshf-vsr-row"
                          onClick={() => { goPage(r.page); setNavOpen(false); setVsearch(""); setVsResults([]); }}
                        >
                          <div className="mshf-vsr-meta">
                            <span className="mshf-vsr-surah">
                              {r.surah.name} : {r.numberInSurah.toLocaleString("ar-EG")}
                            </span>
                            <span className="mshf-vsr-page">صفحة {r.page.toLocaleString("ar-EG")}</span>
                          </div>
                          <div className="mshf-vsr-text" lang="ar" dir="rtl">{r.text}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {!vsLoading && !vsErr && vsearch.trim().length >= 2 && vsResults.length === 0 && (
                    <div className="mshf-empty mshf-empty--center">
                      <Search size={36} strokeWidth={1.2} aria-hidden="true" />
                      <p>لا نتائج لـ «{vsearch}»</p>
                    </div>
                  )}
                  {!vsLoading && !vsErr && vsearch.trim().length < 2 && (
                    <div className="mshf-empty mshf-empty--center">
                      <Search size={36} strokeWidth={1.2} aria-hidden="true" />
                      <p>ابحث بكلمة أو عبارة قرآنية</p>
                      <p className="mshf-empty-sub">مثال: الرحمن الرحيم</p>
                    </div>
                  )}
                </div>
              )}

              {/* الأجزاء */}
              {navTab === "juzs" && (
                <div className="mshf-juz-grid">
                  {JUZS.map(([name, firstPage], i) => {
                    const num = i + 1;
                    const isActive = juzNum === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        className={`mshf-juz-row${isActive ? " active" : ""}`}
                        onClick={() => { goPage(firstPage); setNavOpen(false); }}
                      >
                        <span className="mshf-juz-num">{num.toLocaleString("ar-EG")}</span>
                        <span className="mshf-juz-name">{name.replace("الجزء ", "")}</span>
                        <span className="mshf-juz-page">ص {firstPage}</span>
                      </button>
                    );
                  })}
                </div>
              )}

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

              {/* الآيات المفضلة */}
              {navTab === "favs" && (
                <div className="mshf-bm-list">
                  {favAyahs.length === 0 ? (
                    <div className="mshf-empty mshf-empty--center">
                      <span style={{ fontSize: "2.5rem", opacity: 0.25 }}>⭐</span>
                      <p>لا توجد آيات مفضلة</p>
                      <p className="mshf-empty-sub">انقر أي آية ثم اضغط ⭐ لإضافتها للمفضلة</p>
                    </div>
                  ) : favAyahs.map(ayahNum => {
                    const cachedAyah = Array.from(pageCache.values()).flat().find(a => a.number === ayahNum);
                    return (
                      <div key={ayahNum} className="mshf-bm-row">
                        <button
                          type="button"
                          className="mshf-bm-btn"
                          onClick={() => {
                            const pg = Array.from(pageCache.entries()).find(([, ayahs]) => ayahs.some(a => a.number === ayahNum))?.[0];
                            if (pg) { goPage(pg); setNavOpen(false); }
                          }}
                        >
                          <span style={{ fontSize: "0.85rem" }}>⭐</span>
                          <div className="mshf-bm-info">
                            <span className="mshf-bm-page" lang="ar" dir="rtl" style={{ fontFamily: "inherit", fontSize: "0.82rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {cachedAyah ? `${cachedAyah.surah.name} : ${cachedAyah.numberInSurah}` : `آية ${ayahNum}`}
                            </span>
                            {cachedAyah && (
                              <span className="mshf-bm-surah" lang="ar" dir="rtl" style={{ fontSize: "0.72rem", fontFamily: '"Scheherazade New", serif', maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {cachedAyah.text.slice(0, 40)}…
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          className="mshf-bm-del"
                          onClick={() => toggleFav(ayahNum)}
                          aria-label="حذف من المفضلة"
                        >✕</button>
                      </div>
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
      {/* ══ لوحة القراء — Bottom Sheet ══ */}
      {selAyah && (
        <div
          className="mshf-sheet-overlay"
          role="presentation"
          onClick={closeReciterPanel}
          style={{ zIndex: 900 }}
        >
          <div
            className="mshf-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="الاستماع للآية"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: "55vh" }}
          >
            <div className="mshf-sheet-handle" />

            {/* رأس اللوحة */}
            <div className="mshf-sheet-head" style={{ alignItems: "flex-start", flexDirection: "column", gap: "0.35rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Volume2 size={16} strokeWidth={2} />
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {selAyah.surah.name} : {selAyah.numberInSurah.toLocaleString("ar-EG")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => toggleFav(selAyah.number)}
                    title={favAyahs.includes(selAyah.number) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                    aria-label={favAyahs.includes(selAyah.number) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                    style={{
                      border: "none", background: "transparent",
                      fontSize: "1.3rem", cursor: "pointer", lineHeight: 1,
                      opacity: favAyahs.includes(selAyah.number) ? 1 : 0.35,
                      transition: "opacity 0.15s",
                    }}
                  >⭐</button>
                  <button
                    type="button"
                    className="mshf-sheet-close"
                    onClick={closeReciterPanel}
                    aria-label="إغلاق"
                  >
                    <X size={16} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {/* نص الآية */}
              <p style={{
                fontSize: "1.05rem", lineHeight: 2, direction: "rtl",
                color: "var(--mshf-ink, #1a1a1a)", padding: "0.25rem 0", margin: 0,
                fontFamily: '"Scheherazade New","Amiri Quran",serif',
              }} lang="ar">{selAyah.text}</p>
              {/* التفسير المختصر */}
              {tafseerLoading && (
                <p style={{ fontSize: "0.7rem", color: "rgba(31,77,58,0.5)", margin: 0, fontStyle: "italic" }}>جاري تحميل التفسير…</p>
              )}
              {tafseer && !tafseerLoading && (
                <div style={{
                  fontSize: "0.78rem", lineHeight: 1.7, color: "#1F4D3A",
                  background: "rgba(31,77,58,0.05)", borderRight: "3px solid #1F4D3A",
                  padding: "0.4rem 0.6rem", borderRadius: "0 0.4rem 0.4rem 0",
                  margin: "0.2rem 0 0", direction: "rtl",
                }}>
                  <span style={{ fontWeight: 700, fontSize: "0.68rem", display: "block", opacity: 0.7, marginBottom: "0.15rem" }}>تفسير الجلالين</span>
                  {tafseer}
                </div>
              )}
            </div>

            {/* خيارات التكرار والمؤقت */}
            <div style={{ padding: "0.5rem 0.75rem 0", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {/* وضع التكرار */}
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                {(["none","verse","page","surah"] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setRepeatMode(m); }}
                    style={{
                      padding: "0.3rem 0.7rem", fontSize: "0.72rem", fontFamily: "inherit",
                      borderRadius: "999px", border: `1.5px solid ${repeatMode === m ? "#1F4D3A" : "#e8f0ec"}`,
                      background: repeatMode === m ? "#1F4D3A" : "transparent",
                      color: repeatMode === m ? "#fff" : "#1F4D3A",
                      cursor: "pointer", fontWeight: 700, transition: "all 0.14s",
                    }}
                  >
                    {m === "none" ? "⟳ إيقاف" : m === "verse" ? "🔁 آية" : m === "page" ? "📄 صفحة" : "📖 سورة"}
                  </button>
                ))}
              </div>
              {/* مؤقت التوقف */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.7rem", color: "#1F4D3A", fontWeight: 700, whiteSpace: "nowrap" }}>🕐 توقف عند:</label>
                <input
                  type="time"
                  value={stopAtTime}
                  onChange={e => setStopAtTime(e.target.value)}
                  style={{
                    border: "1.5px solid #e8f0ec", borderRadius: "0.5rem", padding: "0.25rem 0.5rem",
                    fontSize: "0.8rem", fontFamily: "inherit", background: "#f5f9f6", color: "#1F4D3A",
                    outline: "none",
                  }}
                />
                {stopAtTime && (
                  <button
                    type="button"
                    onClick={() => { setTimerActive(v => !v); }}
                    style={{
                      padding: "0.25rem 0.7rem", fontSize: "0.7rem", fontFamily: "inherit",
                      borderRadius: "999px", border: `1.5px solid ${timerActive ? "#1F4D3A" : "#cde6d8"}`,
                      background: timerActive ? "#1F4D3A" : "transparent",
                      color: timerActive ? "#fff" : "#1F4D3A",
                      cursor: "pointer", fontWeight: 700,
                    }}
                  >
                    {timerActive ? "✓ مفعّل" : "تفعيل"}
                  </button>
                )}
              </div>
            </div>

            {/* قائمة القراء */}
            <div className="mshf-sheet-body" style={{ padding: "0.5rem 0.75rem" }}>
              {RECITERS.map(r => {
                const isPlaying = playingId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => playReciter(r.id, selAyah.number)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "0.65rem 0.75rem", marginBottom: "0.4rem",
                      borderRadius: "0.6rem", border: `2px solid ${isPlaying ? "#1F4D3A" : "#e8f0ec"}`,
                      background: isPlaying ? "#1F4D3A" : "#fff",
                      color: isPlaying ? "#fff" : "#1a1a1a",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "right",
                      transition: "all 0.15s",
                    }}
                    aria-label={`${isPlaying ? "إيقاف" : "تشغيل"} ${r.name}`}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{r.name}</span>
                    <span style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: "50%",
                      background: isPlaying ? "rgba(255,255,255,0.2)" : "#f0f7f4",
                      color: isPlaying ? "#fff" : "#1F4D3A",
                      flexShrink: 0,
                    }}>
                      {isPlaying
                        ? <Pause size={14} fill="currentColor" strokeWidth={0} />
                        : <Play size={14} fill="currentColor" strokeWidth={0} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
