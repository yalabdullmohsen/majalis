import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Search, Star, BookOpen } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { arabicMatchAny } from "@/lib/arabic-search";
import {
  fetchSurahIndexLocal,
  fetchRevelationTypes,
  readFavoriteSurahs,
  toggleFavoriteSurah,
  type SurahIndexEntry,
} from "@/lib/surah-index";
import { surahList, mushafPageHref } from "@/lib/quran-surah-list";
import { useNumerals } from "@/hooks/useNumerals";
import { toArabicIndicDigits } from "@/lib/numerals";
import "@/styles/pages/surah-index.css";

type RevelationFilter = "all" | "meccan" | "medinan" | "favorites";
/** ترتيب العرض: "mushaf" هو الافتراضي الدائم (رقم السورة في المصحف —
 *  توقيفي، كما هو معروض في الموقع دومًا)، و"revelation" فرز زمني اختياري
 *  إضافي بحسب ترتيب النزول (راجع /quran/revelation-order للعرض البصري
 *  الكامل). لا يُغيَّر الافتراضي أبدًا — طلب صريح من المالك. */
type SortMode = "mushaf" | "revelation";

const JUMPS = [
  { id: "1-30", label: "١–٣٠", start: 1, end: 30 },
  { id: "31-60", label: "٣١–٦٠", start: 31, end: 60 },
  { id: "61-90", label: "٦١–٩٠", start: 61, end: 90 },
  { id: "91-114", label: "٩١–١١٤", start: 91, end: 114 },
] as const;

function revelationLabel(type: SurahIndexEntry["revelationType"]): string | null {
  if (type === "Meccan") return "مكية";
  if (type === "Medinan") return "مدنية";
  return null;
}

export default function SurahIndexPage() {
  const fmt = useNumerals();
  const [surahs, setSurahs] = useState<SurahIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [revelationLoaded, setRevelationLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RevelationFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("mushaf");
  const [favorites, setFavorites] = useState<Set<number>>(() => new Set());
  const [activeJump, setActiveJump] = useState<string | null>(null);
  const rowRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  useEffect(() => {
    applyPageSeo({
      path: "/quran/surahs",
      title: "فهرس السور | المجلس العلمي",
      description:
        "فهرس سور القرآن الكريم الـ114 كاملة: رقم السورة واسمها وعدد آياتها وتصنيفها المكي أو المدني، مع بحث سريع ومفضلة. محتوى معتمد في منهج مجالس",
      keywords: ["فهرس السور", "سور القرآن", "مكية ومدنية", "المصحف"],
    });
  }, []);

  useEffect(() => {
    setFavorites(readFavoriteSurahs());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSurahIndexLocal()
      .then((list) => {
        if (!cancelled) setSurahs(list);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetchRevelationTypes().then((map) => {
      if (cancelled || map.size === 0) return;
      setSurahs((prev) =>
        prev.map((s) => ({ ...s, revelationType: map.get(s.number) ?? s.revelationType })),
      );
      setRevelationLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pageById = useMemo(
    () => new Map(surahList.map((item) => [item.id, item.page] as const)),
    [],
  );

  const filtered = useMemo(() => {
    let list = surahs;
    if (filter === "favorites") list = list.filter((s) => favorites.has(s.number));
    else if (filter === "meccan") list = list.filter((s) => s.revelationType === "Meccan");
    else if (filter === "medinan") list = list.filter((s) => s.revelationType === "Medinan");

    const term = query.trim();
    if (term) {
      list = list.filter(
        (s) =>
          arabicMatchAny([s.name, s.englishName], term) ||
          String(s.number).startsWith(term) ||
          toArabicIndicDigits(s.number).startsWith(term),
      );
    }

    if (sortMode === "revelation") {
      list = [...list].sort((a, b) => a.revelationOrder - b.revelationOrder);
    }
    return list;
  }, [surahs, filter, query, favorites, sortMode]);

  function handleToggleFavorite(number: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(toggleFavoriteSurah(number));
  }

  function handleJump(jump: (typeof JUMPS)[number]) {
    setActiveJump(jump.id);
    const target = filtered.find((s) => s.number >= jump.start && s.number <= jump.end);
    if (!target) return;
    rowRefs.current.get(target.number)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function metaLine(s: SurahIndexEntry, startPage: number): string {
    const parts: string[] = [];
    const rev = revelationLabel(s.revelationType);
    if (rev) parts.push(rev);
    parts.push(`${fmt(s.numberOfAyahs)} آيات`);
    parts.push(`صفحة ${fmt(startPage)}`);
    if (sortMode === "revelation") {
      parts.push(`سورة رقم ${fmt(s.number)} في المصحف`);
    }
    return parts.join(" · ");
  }

  return (
    <div className="surah-index-page" dir="rtl" data-testid="surah-index-page">
      <header className="surah-index-hero">
        <h1>فهرس السور</h1>

      </header>

      <div className="surah-index-controls">
        <div className="surah-index-sort" role="tablist" aria-label="ترتيب العرض">
          <button
            type="button"
            role="tab"
            aria-selected={sortMode === "mushaf"}
            className={`surah-index-chip${sortMode === "mushaf" ? " is-active" : ""}`}
            onClick={() => setSortMode("mushaf")}
          >
            ترتيب المصحف
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sortMode === "revelation"}
            className={`surah-index-chip${sortMode === "revelation" ? " is-active" : ""}`}
            onClick={() => setSortMode("revelation")}
          >
            ترتيب النزول
          </button>
        </div>

        <div className="surah-index-search">
          <Search className="surah-index-search__icon" size={16} strokeWidth={1.8} aria-hidden="true" />
          <input
            type="search"
            enterKeyHint="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            placeholder="ابحث عن سورة بالاسم أو الرقم..."
            aria-label="ابحث عن سورة"
            autoComplete="off"
            data-search-field="1"
          />
        </div>

        <div className="surah-index-filters" role="tablist" aria-label="تصفية السور">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={`surah-index-chip${filter === "all" ? " is-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            الكل
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "meccan"}
            className={`surah-index-chip${filter === "meccan" ? " is-active" : ""}`}
            onClick={() => setFilter("meccan")}
            disabled={!revelationLoaded}
            title={!revelationLoaded ? "يحتاج اتصالاً بالإنترنت لتحميل التصنيف" : undefined}
          >
            مكية
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "medinan"}
            className={`surah-index-chip${filter === "medinan" ? " is-active" : ""}`}
            onClick={() => setFilter("medinan")}
            disabled={!revelationLoaded}
            title={!revelationLoaded ? "يحتاج اتصالاً بالإنترنت لتحميل التصنيف" : undefined}
          >
            مدنية
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "favorites"}
            className={`surah-index-chip${filter === "favorites" ? " is-active" : ""}`}
            onClick={() => setFilter("favorites")}
          >
            <Star size={12} strokeWidth={2} aria-hidden="true" /> المفضلة
          </button>
        </div>

        <div className="surah-index-jumps" role="group" aria-label="انتقال سريع">
          {JUMPS.map((jump) => (
            <button
              key={jump.id}
              type="button"
              className={`surah-index-jump${activeJump === jump.id ? " is-active" : ""}`}
              aria-pressed={activeJump === jump.id}
              onClick={() => handleJump(jump)}
            >
              {jump.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="surah-index-skeletons" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="surah-index-skel" />
          ))}
        </div>
      ) : loadError ? (
        <div className="surah-index-empty">
          <BookOpen size={32} strokeWidth={1} aria-hidden="true" />
          <p>تعذّر تحميل فهرس السور. تحقّق من اتصالك وأعد المحاولة.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="surah-index-empty">
          <BookOpen size={32} strokeWidth={1} aria-hidden="true" />
          <p>{filter === "favorites" ? "لا سور في مفضلتك بعد." : "لا نتائج مطابقة."}</p>
        </div>
      ) : (
        <ol className="surah-index-list">
          {filtered.map((s) => {
            const startPage = pageById.get(s.number) ?? 1;
            const fav = favorites.has(s.number);
            const displayNum = sortMode === "revelation" ? s.revelationOrder : s.number;
            return (
              <li
                key={s.number}
                ref={(node) => {
                  if (node) rowRefs.current.set(s.number, node);
                  else rowRefs.current.delete(s.number);
                }}
              >
                <Link
                  href={mushafPageHref(startPage)}
                  className="surah-index-row"
                  title={s.description || undefined}
                >
                  <span className="surah-index-row__num" aria-hidden="true">
                    {fmt(displayNum)}
                  </span>
                  <span className="surah-index-row__body">
                    <span className="surah-index-row__name">{s.name}</span>
                    <span className="surah-index-row__meta">{metaLine(s, startPage)}</span>
                  </span>
                  <button
                    type="button"
                    className={`surah-index-row__fav${fav ? " is-active" : ""}`}
                    onClick={(e) => handleToggleFavorite(s.number, e)}
                    aria-label={fav ? `إزالة ${s.name} من المفضلة` : `إضافة ${s.name} إلى المفضلة`}
                    aria-pressed={fav}
                  >
                    <Star
                      size={18}
                      strokeWidth={1.8}
                      fill={fav ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                  </button>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
