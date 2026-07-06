import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { MUEZZINS, previewAdhan, stopAdhan, type Muezzin, type MuezzinStyle } from "@/lib/adhan-audio";
import { patchAdhanPrefs, loadAdhanPrefs } from "@/lib/adhan-preferences";
import { toggleFavorite, loadFavorites } from "@/lib/muezzin-favorites";
import { loadCommunityMuezzins, type CommunityMuezzin } from "@/lib/user-submissions-service";

const STYLES: MuezzinStyle[] = ["خاشع", "رسمي", "تقليدي", "كلاسيكي"];
const COUNTRIES = [...new Set(MUEZZINS.map((m) => m.country))];

const STYLE_COLOR: Record<string, { bg: string; text: string }> = {
  "خاشع":    { bg: "#f0fdf4", text: "#065f46" },
  "رسمي":    { bg: "#eff6ff", text: "#1d4ed8" },
  "تقليدي":  { bg: "#faf5ff", text: "#6d28d9" },
  "كلاسيكي": { bg: "#fff7ed", text: "#0E6E52" },
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const frac = rating - full;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem", fontSize: "0.8rem" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{
          color: i <= full ? "#f59e0b" : i === full + 1 && frac >= 0.5 ? "#f59e0b" : "#e5e7eb",
          fontSize: "0.85rem",
        }}>★</span>
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
  const sc = STYLE_COLOR[muezzin.style] ?? { bg: "#f9fafb", text: "#374151" };
  const isPlaying = previewing === muezzin.id;

  return (
    <div style={{
      background: "var(--majalis-panel, rgba(255,255,255,0.08))",
      borderRadius: "1rem",
      border: `1.5px solid ${isFav ? "#bbf7d0" : "#e5e7eb"}`,
      padding: "1.1rem 1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.6rem",
      transition: "border-color 0.15s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--majalis-ink)", marginBottom: "0.15rem" }}>
            {muezzin.name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--txt-subdued, #6B7280)" }}>
            📍 {muezzin.origin} · {muezzin.country}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onToggleFav(muezzin.id); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "1.1rem", padding: "0.1rem 0.2rem",
              color: isFav ? "#ef4444" : "#d1d5db",
              transition: "color 0.15s",
            }}
            title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            {isFav ? "❤️" : "🤍"}
          </button>
          <span style={{
            padding: "0.2rem 0.55rem",
            borderRadius: "999px",
            fontSize: "0.68rem",
            fontWeight: 600,
            background: sc.bg,
            color: sc.text,
          }}>
            {muezzin.style}
          </span>
        </div>
      </div>

      {/* Category */}
      <div style={{ fontSize: "0.72rem", color: "var(--txt-muted, #52525B)" }}>{muezzin.category}</div>

      {/* Rating row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <StarRating rating={muezzin.rating} />
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--majalis-ink-soft)" }}>{muezzin.rating}</span>
        <span style={{ fontSize: "0.72rem", color: "var(--txt-muted, #52525B)" }}>({formatNum(muezzin.totalRatings)} تقييم)</span>
      </div>

      {/* Followers */}
      <div style={{ fontSize: "0.75rem", color: "var(--txt-subdued, #6B7280)" }}>
        👥 {formatNum(muezzin.followers)} متابع
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onPreview(muezzin); }}
          style={{
            flex: 1,
            padding: "0.45rem 0",
            borderRadius: "0.5rem",
            border: "none",
            background: isPlaying ? "#ef4444" : "#134a3a",
            color: "#fff",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {isPlaying ? "⏹ إيقاف" : "▶ معاينة"}
        </button>
        <Link href={`/muezzins/${muezzin.id}`}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: "0.45rem 0",
              borderRadius: "0.5rem",
              border: "1.5px solid #134a3a",
              background: "transparent",
              color: "var(--majalis-emerald)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            التفاصيل
          </button>
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
    <div style={{ direction: "rtl", maxWidth: 640, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--majalis-emerald)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.25rem" }}>
              الأذان
            </p>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--majalis-ink)", margin: "0 0 0.35rem" }}>
              🎙️ مكتبة المؤذنين
            </h1>
          </div>
          <Link href="/muezzins/favorites">
            <button type="button" style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.4rem 0.875rem",
              borderRadius: "999px",
              border: "1.5px solid #fca5a5",
              background: favorites.size > 0 ? "#fef2f2" : "#fff",
              color: "#dc2626",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              marginTop: "0.25rem",
            }}>
              ❤️ {favorites.size > 0 ? `${favorites.size} مفضلة` : "المفضلة"}
            </button>
          </Link>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--txt-subdued, #6B7280)", margin: 0 }}>
          اختر مؤذنك المفضل من أصوات مختارة من أرجاء العالم الإسلامي.
        </p>
      </div>

      {/* Default muezzin banner */}
      {defaultSet && (
        <div style={{ background: "rgba(46,139,103,0.10)", border: "1px solid rgba(46,139,103,0.25)", borderRadius: "0.6rem", padding: "0.6rem 0.875rem", marginBottom: "1rem", fontSize: "0.82rem", color: "var(--majalis-emerald)", fontWeight: 600 }}>
          ✓ تم تعيين المؤذن الافتراضي بنجاح
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "0.875rem" }}>
        <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--txt-muted, #52525B)", fontSize: "1rem" }}>🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو الدولة أو الأسلوب..."
          style={{
            width: "100%",
            padding: "0.65rem 2.25rem 0.65rem 0.875rem",
            borderRadius: "0.75rem",
            border: "1.5px solid rgba(255,255,255,0.10)",
            fontSize: "0.875rem",
            fontFamily: "inherit",
            direction: "rtl",
            background: "var(--majalis-panel, rgba(255,255,255,0.08))",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>
        {/* Style filter */}
        <select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value as MuezzinStyle | "")}
          style={selectStyle}
        >
          <option value="">كل الأساليب</option>
          {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Country filter */}
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">كل الدول</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          style={selectStyle}
        >
          <option value="rating">الأعلى تقييماً</option>
          <option value="followers">الأكثر متابعة</option>
          <option value="favorites">❤️ المفضلة فقط</option>
          <option value="name">الاسم (أ–ي)</option>
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontSize: "0.78rem", color: "var(--txt-subdued, #6B7280)", marginBottom: "0.875rem" }}>
        {isAdmin && <>{filtered.length} مؤذن</>}
        {(styleFilter || countryFilter || query) && (
          <button
            type="button"
            onClick={() => { setStyleFilter(""); setCountryFilter(""); setQuery(""); }}
            style={{ marginRight: "0.5rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}
          >
            × مسح الفلاتر
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--txt-muted, #52525B)", fontSize: "0.9rem" }}>
          لا توجد نتائج مطابقة
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "0.875rem" }}>
          {filtered.map((m) => (
            <div key={m.id} style={{ position: "relative" }}>
              {m.id === defaultMuezzinId && (
                <div style={{
                  position: "absolute",
                  top: "-0.4rem",
                  right: "0.75rem",
                  zIndex: 1,
                  background: "#134a3a",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  padding: "0.1rem 0.5rem",
                  borderRadius: "999px",
                }}>
                  ✓ الافتراضي
                </div>
              )}
              <MuezzinCard
                muezzin={m}
                onPreview={handlePreview}
                previewing={previewing}
                isFav={favorites.has(m.id)}
                onToggleFav={handleToggleFav}
              />
              {m.id !== defaultMuezzinId && (
                <button
                  type="button"
                  onClick={() => handleSetDefault(m.id)}
                  style={{
                    width: "100%",
                    marginTop: "0.35rem",
                    padding: "0.35rem",
                    borderRadius: "0.5rem",
                    border: "1px dashed #d1d5db",
                    background: "transparent",
                    color: "var(--txt-subdued, #6B7280)",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  تعيين كمؤذن افتراضي
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── أذانات المجتمع ── */}
      {community.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--majalis-ink)", margin: 0 }}>
              🌍 أذانات من المجتمع
            </h2>
            {isAdmin && (
              <span style={{ padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 600, background: "#eff6ff", color: "#1d4ed8" }}>
                {community.length} تسجيل
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "0.75rem" }}>
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

      {/* ── Upload CTA ── */}
      <div style={{
        marginTop: "2rem",
        background: "linear-gradient(135deg, #f0fdf4, #eff6ff)",
        border: "1.5px solid #bbf7d0",
        borderRadius: "1rem",
        padding: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}>
        <div style={{ fontSize: "2rem" }}>🎙️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--majalis-emerald)", marginBottom: "0.2rem" }}>
            هل لديك تسجيل أذان جميل؟
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--txt-subdued, #6B7280)" }}>
            شارك صوتك مع مجتمع المجالس — يُراجع الفريق ويُنشر في المكتبة.
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <Link href="/upload">
            <button type="button" style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "0.6rem",
              border: "none",
              background: "#134a3a",
              color: "#fff",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              📤 ارفع أذانك
            </button>
          </Link>
          <Link href="/my-submissions">
            <button type="button" style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "0.6rem",
              border: "1.5px solid #134a3a",
              background: "transparent",
              color: "var(--majalis-emerald)",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              مساهماتي
            </button>
          </Link>
        </div>
      </div>

      {/* Link to settings */}
      <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
        <Link href="/adhan-settings">
          <span style={{ fontSize: "0.82rem", color: "var(--majalis-emerald)", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
            إعدادات الأذان التفصيلية ←
          </span>
        </Link>
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
    <div style={{
      background: "var(--majalis-panel, rgba(255,255,255,0.08))",
      borderRadius: "1rem",
      border: "1.5px solid #bfdbfe",
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--majalis-ink)" }}>{muezzin.name}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--txt-subdued, #6B7280)" }}>📍 {muezzin.origin} · {muezzin.country}</div>
        </div>
        <span style={{ padding: "0.15rem 0.45rem", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 700, background: "#eff6ff", color: "#1d4ed8" }}>
          مجتمع
        </span>
      </div>
      {muezzin.biography && (
        <p style={{ fontSize: "0.72rem", color: "var(--txt-muted, #52525B)", margin: 0, lineHeight: 1.5 }}>
          {muezzin.biography.length > 80 ? `${muezzin.biography.slice(0, 80)}...` : muezzin.biography}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.4rem", fontSize: "0.72rem", color: "var(--txt-subdued, #6B7280)" }}>
        <span>🎨 {muezzin.style}</span>
        {muezzin.rating > 0 && <span>★ {muezzin.rating}</span>}
      </div>
      <button
        type="button"
        onClick={() => onPreview(muezzin.id, muezzin.audio_url)}
        style={{
          width: "100%",
          padding: "0.45rem",
          borderRadius: "0.5rem",
          border: "none",
          background: isPlaying ? "#ef4444" : "#1d4ed8",
          color: "#fff",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          marginTop: "0.25rem",
        }}
      >
        {isPlaying ? "⏹ إيقاف" : "▶ معاينة"}
      </button>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "0.45rem 0.75rem",
  borderRadius: "0.6rem",
  border: "1.5px solid rgba(255,255,255,0.10)",
  background: "var(--majalis-panel, rgba(255,255,255,0.08))",
  fontSize: "0.8rem",
  fontFamily: "inherit",
  color: "var(--majalis-ink-soft)",
  cursor: "pointer",
  direction: "rtl",
};
