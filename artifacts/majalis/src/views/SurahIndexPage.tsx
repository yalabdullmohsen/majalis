import { useEffect, useMemo, useState } from "react";
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

type RevelationFilter = "all" | "meccan" | "medinan" | "favorites";

const REVELATION_LABEL: Record<"Meccan" | "Medinan", string> = {
  Meccan: "مكية",
  Medinan: "مدنية",
};

export default function SurahIndexPage() {
  const [surahs, setSurahs] = useState<SurahIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [revelationLoaded, setRevelationLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RevelationFilter>("all");
  const [favorites, setFavorites] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    applyPageSeo({
      path: "/quran/surahs",
      title: "فهرس السور | المجلس العلمي",
      description: "فهرس سور القرآن الكريم الـ114 كاملة: رقم السورة واسمها وعدد آياتها وتصنيفها المكي أو المدني، مع بحث سريع ومفضلة.",
      keywords: ["فهرس السور", "سور القرآن", "مكية ومدنية", "المصحف"],
    });
  }, []);

  useEffect(() => {
    setFavorites(readFavoriteSurahs());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSurahIndexLocal()
      .then((list) => { if (!cancelled) setSurahs(list); })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    fetchRevelationTypes().then((map) => {
      if (cancelled || map.size === 0) return;
      setSurahs((prev) => prev.map((s) => ({ ...s, revelationType: map.get(s.number) ?? s.revelationType })));
      setRevelationLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = surahs;
    if (filter === "favorites") list = list.filter((s) => favorites.has(s.number));
    else if (filter === "meccan") list = list.filter((s) => s.revelationType === "Meccan");
    else if (filter === "medinan") list = list.filter((s) => s.revelationType === "Medinan");

    const term = query.trim();
    if (!term) return list;
    return list.filter((s) => arabicMatchAny([s.name, s.englishName], term) || String(s.number).startsWith(term));
  }, [surahs, filter, query, favorites]);

  function handleToggleFavorite(number: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(toggleFavoriteSurah(number));
  }

  return (
    <div className="surah-index-page" dir="rtl">
      <header className="surah-index-hero">
        <h1>فهرس السور</h1>
        <p>١١٤ سورة — رقمها واسمها وعدد آياتها وتصنيفها، مع بحث سريع ومفضلة.</p>
      </header>

      <div className="surah-index-controls">
        <div className="surah-index-search">
          <Search size={16} strokeWidth={1.8} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن سورة بالاسم أو الرقم..."
            aria-label="ابحث عن سورة"
          />
        </div>

        <div className="surah-index-filters" role="tablist" aria-label="فلاتر السور">
          <button type="button" role="tab" aria-selected={filter === "all"} className={`surah-index-chip${filter === "all" ? " is-active" : ""}`} onClick={() => setFilter("all")}>الكل</button>
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
          <button type="button" role="tab" aria-selected={filter === "favorites"} className={`surah-index-chip${filter === "favorites" ? " is-active" : ""}`} onClick={() => setFilter("favorites")}>
            <Star size={12} strokeWidth={2} aria-hidden="true" /> المفضلة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="surah-index-skeletons" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="surah-index-skel" />)}
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
        <ol className="surah-index-list" role="list">
          {filtered.map((s) => (
            <li key={s.number}>
              <Link href={`/mushaf/${s.number}`} className="surah-index-row">
                <span className="surah-index-row__num" aria-hidden="true">{s.number}</span>
                <span className="surah-index-row__body">
                  <span className="surah-index-row__name" style={{ fontFamily: "var(--font-quran)" }}>{s.name}</span>
                  <span className="surah-index-row__meta">
                    {s.numberOfAyahs} آية
                    {s.revelationType && <> · {REVELATION_LABEL[s.revelationType]}</>}
                  </span>
                </span>
                <button
                  type="button"
                  className={`surah-index-row__fav${favorites.has(s.number) ? " is-active" : ""}`}
                  onClick={(e) => handleToggleFavorite(s.number, e)}
                  aria-label={favorites.has(s.number) ? `إزالة ${s.name} من المفضلة` : `إضافة ${s.name} إلى المفضلة`}
                  aria-pressed={favorites.has(s.number)}
                >
                  <Star size={17} strokeWidth={1.8} fill={favorites.has(s.number) ? "currentColor" : "none"} aria-hidden="true" />
                </button>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
