import { useState, useMemo, useEffect, useRef } from "react";
import { Globe, Heart, MapPin, Mic2, Palette, Search, Star, Upload, Users } from "lucide-react";
import { Link } from "wouter";
import { ShareButtons } from "@/components/ContentActions";
import { useAuth } from "@/components/AuthProvider";
import { MUEZZINS, previewAdhan, stopAdhan, type Muezzin, type MuezzinStyle } from "@/lib/adhan-audio";
import { patchAdhanPrefs, loadAdhanPrefs } from "@/lib/adhan-preferences";
import { toggleFavorite, loadFavorites } from "@/lib/muezzin-favorites";
import { loadCommunityMuezzins, type CommunityMuezzin } from "@/lib/user-submissions-service";
import { applyPageSeo } from "@/lib/seo";

const STYLES: MuezzinStyle[] = ["خاشع", "رسمي", "تقليدي", "كلاسيكي"];
const COUNTRIES = [...new Set(MUEZZINS.map((m) => m.country))];

const STYLE_CLASS: Record<string, string> = {
  "خاشع":    "khashi",
  "رسمي":    "rasmi",
  "تقليدي":  "taqlidi",
  "كلاسيكي": "kilasiki",
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const frac = rating - full;
  return (
    <span className="mzp-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`mzp-star${(i <= full || (i === full + 1 && frac >= 0.5)) ? " is-active" : ""}`}
        ><Star size={12} /></span>
      ))}
    </span>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`;
  if (n >= 1_000) return `${Math.round(n / 1000)}ك`;
  return String(n);
}

function MuezzinCard({ muezzin, onPreview, previewing, isFav, onToggleFav }: {
  muezzin: Muezzin;
  onPreview: (m: Muezzin) => void;
  previewing: string | null;
  isFav: boolean;
  onToggleFav: (id: string) => void;
}) {
  const styleMod = STYLE_CLASS[muezzin.style] ?? "khashi";
  const isPlaying = previewing === muezzin.id;

  return (
    <div className={`mzp-card${isFav ? " mzp-card--fav" : ""}`}>
      <div className="mzp-card__head">
        <div className="mzp-card__info">
          <div className="mzp-card__name">{muezzin.name}</div>
          <div className="mzp-card__origin"><MapPin size={11} strokeWidth={1.8} aria-hidden="true" /> {muezzin.origin} · {muezzin.country}</div>
        </div>
        <div className="mzp-card__head-actions">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onToggleFav(muezzin.id); }}
            className={`mzp-fav-btn${isFav ? " is-fav" : ""}`}
            title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            {isFav ? <Heart size={16} className="icon-danger--filled" /> : <Heart size={16} />}
          </button>
          <span className={`mzp-style-badge mzp-style-badge--${styleMod}`}>{muezzin.style}</span>
        </div>
      </div>

      <div className="mzp-card__category">{muezzin.category}</div>

      <div className="mzp-card__rating-row">
        <StarRating rating={muezzin.rating} />
        <span className="mzp-card__rating-num">{muezzin.rating}</span>
        <span className="mzp-card__rating-count">({formatNum(muezzin.totalRatings)} تقييم)</span>
      </div>

      <div className="mzp-card__followers"><Users size={13} className="inline ml-1" />{formatNum(muezzin.followers)} متابع</div>

      <div className="mzp-card__btns">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onPreview(muezzin); }}
          className={`mzp-card__preview-btn${isPlaying ? " is-playing" : ""}`}
        >
          {isPlaying ? "⏹ إيقاف" : "▶ معاينة"}
        </button>
        <Link href={`/muezzins/${muezzin.id}`}>
          <button type="button" className="mzp-card__detail-btn">التفاصيل</button>
        </Link>
      </div>
    </div>
  );
}

export default function MuezzinsPage() {
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState<MuezzinStyle | "">("");
  const [countryFilter, setCountryFilter] = useState("");
  const [sortKey, setSortKey] = useState<"rating" | "followers" | "favorites" | "name">("rating");
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [defaultSet, setDefaultSet] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [community, setCommunity] = useState<CommunityMuezzin[]>([]);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultMuezzinId = loadAdhanPrefs().defaultMuezzinId;

  useEffect(() => {
    applyPageSeo({
      path: "/muezzins",
      title: "الأذان والمؤذنون | المجلس العلمي",
      description: "استمع إلى الأذان بأصوات أشهر المؤذنين وخصّص إعدادات الأذان، مكتبة متنوعة من أصوات الأذان العالمية.",
      keywords: ["أذان", "مؤذنون", "صوت الأذان", "أذان اسلامي", "مواقيت الصلاة"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "الأذان والمؤذنون", url: "https://majlisilm.com/muezzins", about: { "@type": "Thing", name: "مكتبة أصوات الأذان الإسلامي" } }],
    });
  }, []);

  useEffect(() => {
    loadCommunityMuezzins().then(setCommunity).catch(() => {});
  }, []);

  useEffect(() => () => {
    stopAdhan();
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (defaultTimerRef.current) clearTimeout(defaultTimerRef.current);
  }, []);

  function handleToggleFav(id: string) {
    toggleFavorite(id);
    setFavorites(loadFavorites());
  }

  const filtered = useMemo(() => {
    let list = [...MUEZZINS];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((m) =>
        m.name.includes(q) ||
        m.origin.includes(q) ||
        m.country.includes(q) ||
        m.category.includes(q) ||
        m.tags.some((t) => t.includes(q))
      );
    }
    if (styleFilter) list = list.filter((m) => m.style === styleFilter);
    if (countryFilter) list = list.filter((m) => m.country === countryFilter);
    if (sortKey === "favorites") list = list.filter((m) => favorites.has(m.id));

    list.sort((a, b) => {
      if (sortKey === "rating" || sortKey === "favorites") return b.rating - a.rating;
      if (sortKey === "followers") return b.followers - a.followers;
      return a.name.localeCompare(b.name, "ar");
    });
    return list;
  }, [query, styleFilter, countryFilter, sortKey, favorites]);

  function handlePreview(m: Muezzin) {
    if (previewing === m.id) {
      stopAdhan();
      setPreviewing(null);
      return;
    }
    const audio = previewAdhan(m);
    setPreviewing(m.id);
    audio.addEventListener("ended", () => setPreviewing(null), { once: true });
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => setPreviewing((p) => (p === m.id ? null : p)), 16_000);
  }

  function handleSetDefault(id: string) {
    patchAdhanPrefs({ defaultMuezzinId: id });
    setDefaultSet(id);
    if (defaultTimerRef.current) clearTimeout(defaultTimerRef.current);
    defaultTimerRef.current = setTimeout(() => setDefaultSet(null), 2500);
  }

  return (
    <div className="mzp-page">
      {/* Header */}
      <div className="mzp-header">
        <div className="mzp-header__top">
          <div>
            <p className="mzp-eyebrow">الأذان</p>
            <h1 className="mzp-title"><Mic2 size={20} strokeWidth={1.6} aria-hidden="true" /> مكتبة المؤذنين</h1>
          </div>
          <Link href="/muezzins/favorites">
            <button
              type="button"
              className={`mzp-fav-link-btn${favorites.size > 0 ? " has-favs" : ""}`}
            >
              <Heart size={14} strokeWidth={2} aria-hidden="true" /> {favorites.size > 0 ? `${favorites.size} مفضلة` : "المفضلة"}
            </button>
          </Link>
        </div>
        <p className="mzp-subtitle">اختر مؤذنك المفضل من أصوات مختارة من أرجاء العالم الإسلامي.</p>
      </div>

      {/* Default-set banner */}
      {defaultSet && (
        <div className="mzp-banner">✓ تم تعيين المؤذن الافتراضي بنجاح</div>
      )}

      {/* Search */}
      <div className="mzp-search-wrap">
        <span className="mzp-search-icon" aria-hidden="true"><Search size={16} strokeWidth={1.8} /></span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو الدولة أو الأسلوب..."
          className="mzp-search-input"
        />
      </div>

      {/* Filters */}
      <div className="mzp-filters">
        <select value={styleFilter} onChange={(e) => setStyleFilter(e.target.value as MuezzinStyle | "")} className="mzp-filter-select">
          <option value="">كل الأساليب</option>
          {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="mzp-filter-select">
          <option value="">كل الدول</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)} className="mzp-filter-select">
          <option value="rating">الأعلى تقييماً</option>
          <option value="followers">الأكثر متابعة</option>
          <option value="favorites">المفضلة فقط</option>
          <option value="name">الاسم (أ–ي)</option>
        </select>
      </div>

      {/* Results meta */}
      <div className="mzp-results-meta">
        {isAdmin && <>{filtered.length} مؤذن</>}
        {(styleFilter || countryFilter || query) && (
          <button type="button" className="mzp-clear-btn" onClick={() => { setStyleFilter(""); setCountryFilter(""); setQuery(""); }}>
            × مسح الفلاتر
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mzp-empty">لا توجد نتائج مطابقة</div>
      ) : (
        <div className="mzp-grid">
          {filtered.map((m) => (
            <div key={m.id} className="mzp-grid-item">
              {m.id === defaultMuezzinId && (
                <div className="mzp-default-badge">✓ الافتراضي</div>
              )}
              <MuezzinCard
                muezzin={m}
                onPreview={handlePreview}
                previewing={previewing}
                isFav={favorites.has(m.id)}
                onToggleFav={handleToggleFav}
              />
              {m.id !== defaultMuezzinId && (
                <button type="button" className="mzp-set-default-btn" onClick={() => handleSetDefault(m.id)}>
                  تعيين كمؤذن افتراضي
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Community muezzins */}
      {community.length > 0 && (
        <div className="mzp-community">
          <div className="mzp-community__head">
            <h2 className="mzp-community__title"><Globe size={18} className="inline ml-1" />أذانات من المجتمع</h2>
            {isAdmin && (
              <span className="mzp-community__count">{community.length} تسجيل</span>
            )}
          </div>
          <div className="mzp-community-grid">
            {community.map((m) => (
              <CommunityMuezzinCard
                key={m.id}
                muezzin={m}
                previewing={previewing}
                onPreview={(id, url) => {
                  if (previewing === id) { stopAdhan(); setPreviewing(null); return; }
                  stopAdhan();
                  const audio = new Audio(url);
                  audio.volume = 0.8;
                  audio.play().catch(() => {});
                  setPreviewing(id);
                  audio.addEventListener("ended", () => setPreviewing((p) => p === id ? null : p), { once: true });
                  if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
                  previewTimerRef.current = setTimeout(() => setPreviewing((p) => p === id ? null : p), 16_000);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload CTA */}
      <div className="mzp-cta">
        <div className="mzp-cta__icon" aria-hidden="true"><Mic2 size={28} strokeWidth={1.4} /></div>
        <div className="mzp-cta__info">
          <div className="mzp-cta__title">هل لديك تسجيل أذان جميل؟</div>
          <div className="mzp-cta__desc">شارك صوتك مع مجتمع المجالس، يُراجع الفريق ويُنشر في المكتبة.</div>
        </div>
        <div className="mzp-cta__btns">
          <Link href="/upload" className="mzp-cta__upload-btn">
            <Upload size={14} strokeWidth={2} aria-hidden="true" /> ارفع أذانك
          </Link>
          <Link href="/my-submissions" className="mzp-cta__submissions-btn">
            مساهماتي
          </Link>
        </div>
      </div>

      {/* Settings link */}
      <div className="mzp-settings-footer">
        <Link href="/adhan-settings">
          <span className="mzp-settings-link">إعدادات الأذان التفصيلية ←</span>
        </Link>
      </div>

      <div className="twh-share">
        <ShareButtons title="مكتبة المؤذنين — المجلس العلمي" url="https://majlisilm.com/muezzins" />
      </div>
    </div>
  );
}

function CommunityMuezzinCard({ muezzin, previewing, onPreview }: {
  muezzin: CommunityMuezzin;
  previewing: string | null;
  onPreview: (id: string, url: string) => void;
}) {
  const isPlaying = previewing === muezzin.id;
  return (
    <div className="mzp-com-card">
      <div className="mzp-com-card__head">
        <div className="mzp-com-card__info">
          <div className="mzp-com-card__name">{muezzin.name}</div>
          <div className="mzp-com-card__origin"><MapPin size={11} strokeWidth={1.8} aria-hidden="true" /> {muezzin.origin} · {muezzin.country}</div>
        </div>
        <span className="mzp-com-badge">مجتمع</span>
      </div>
      {muezzin.biography && (
        <p className="mzp-com-card__bio">
          {muezzin.biography.length > 80 ? `${muezzin.biography.slice(0, 80)}...` : muezzin.biography}
        </p>
      )}
      <div className="mzp-com-card__meta">
        <span><Palette size={12} strokeWidth={1.8} aria-hidden="true" /> {muezzin.style}</span>
        {muezzin.rating > 0 && <span><Star size={11} className="inline ml-1" />{muezzin.rating}</span>}
      </div>
      <button
        type="button"
        onClick={() => onPreview(muezzin.id, muezzin.audio_url)}
        className={`mzp-com-card__play-btn${isPlaying ? " is-playing" : ""}`}
      >
        {isPlaying ? "⏹ إيقاف" : "▶ معاينة"}
      </button>
    </div>
  );
}
