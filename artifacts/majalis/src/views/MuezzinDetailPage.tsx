import { useState } from "react";
import { Link, useRoute } from "wouter";
import {
  getMuezzin,
  playAdhan,
  stopAdhan,
  MUEZZINS,
} from "@/lib/adhan-audio";
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  PRAYER_ARABIC,
  PRAYER_ICON,
  PRAYER_KEYS,
} from "@/lib/adhan-preferences";
import {
  toggleFavorite,
  isFavorite,
  saveRating,
  getUserRating,
} from "@/lib/muezzin-favorites";

const STYLE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  "خاشع":    { bg: "#f0fdf4", text: "#065f46", border: "#bbf7d0" },
  "رسمي":    { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  "تقليدي":  { bg: "#faf5ff", text: "#6d28d9", border: "#ddd6fe" },
  "كلاسيكي": { bg: "#fff7ed", text: "#92400e", border: "#fed7aa" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: "0.1rem" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb", fontSize: "1.1rem" }}>★</span>
      ))}
    </span>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} مليون`;
  if (n >= 1_000) return `${Math.round(n / 1000)} ألف`;
  return String(n);
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type PlayState = { key: "fajr" | "general" | null };

export default function MuezzinDetailPage() {
  const [, params] = useRoute("/muezzins/:id");
  const id = params?.id ?? "";
  const muezzin = getMuezzin(id);

  const [playState, setPlayState] = useState<PlayState>({ key: null });
  const [saved, setSaved] = useState(false);
  const [fav, setFav] = useState(() => isFavorite(muezzin.id));
  const [userRating, setUserRating] = useState(() => getUserRating(muezzin.id));
  const [hoverStar, setHoverStar] = useState(0);
  const [ratedFlash, setRatedFlash] = useState(false);

  const prefs = loadAdhanPrefs();
  const isDefault = prefs.defaultMuezzinId === muezzin.id;

  const sc = STYLE_COLOR[muezzin.style] ?? { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" };

  function handlePlay(type: "fajr" | "general") {
    if (playState.key === type) {
      stopAdhan();
      setPlayState({ key: null });
      return;
    }
    stopAdhan();
    const audio = playAdhan(muezzin, type === "fajr");
    setPlayState({ key: type });
    audio.addEventListener("ended", () => setPlayState({ key: null }));
  }

  function handleSetDefault() {
    patchAdhanPrefs({ defaultMuezzinId: muezzin.id });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleToggleFav() {
    const next = toggleFavorite(muezzin.id);
    setFav(next);
  }

  function handleRate(stars: number) {
    saveRating(muezzin.id, stars);
    setUserRating(stars);
    setRatedFlash(true);
    setTimeout(() => setRatedFlash(false), 2000);
  }

  // Other muezzins for "قد يعجبك"
  const related = MUEZZINS
    .filter((m) => m.id !== muezzin.id && (m.style === muezzin.style || m.country === muezzin.country))
    .slice(0, 3);

  return (
    <div style={{ direction: "rtl", maxWidth: 600, margin: "0 auto", padding: "1rem 1rem 5rem" }}>
      {/* Back */}
      <Link href="/muezzins">
        <button type="button" style={backBtnStyle}>
          ← مكتبة المؤذنين
        </button>
      </Link>

      {/* Hero Card */}
      <div style={{
        background: "linear-gradient(135deg, #134a3a 0%, #0c3020 100%)",
        borderRadius: "1.25rem",
        padding: "1.5rem 1.25rem",
        color: "#fff",
        marginBottom: "1.25rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
          backgroundSize: "12px 12px",
        }} />

        {/* Muezzin icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", marginBottom: "0.875rem",
        }}>
          🎙️
        </div>

        <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 0.2rem" }}>
          {muezzin.name}
        </h1>
        <div style={{ fontSize: "0.82rem", opacity: 0.8, marginBottom: "0.75rem" }}>
          📍 {muezzin.origin} · {muezzin.country}
        </div>

        {/* Style badge */}
        <span style={{
          display: "inline-block",
          padding: "0.2rem 0.7rem",
          borderRadius: "999px",
          fontSize: "0.72rem",
          fontWeight: 700,
          background: sc.bg,
          color: sc.text,
          border: `1px solid ${sc.border}`,
          marginBottom: "1rem",
        }}>
          {muezzin.style} · {muezzin.category}
        </span>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{muezzin.rating}</div>
            <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>التقييم</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{formatNum(muezzin.totalRatings)}</div>
            <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>تقييم</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{formatNum(muezzin.followers)}</div>
            <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>متابع</div>
          </div>
        </div>

        {/* Favorite button */}
        <button
          type="button"
          onClick={handleToggleFav}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.45rem 1rem",
            borderRadius: "999px",
            border: `1.5px solid ${fav ? "#fca5a5" : "rgba(255,255,255,0.35)"}`,
            background: fav ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {fav ? "❤️ في المفضلة" : "🤍 أضف للمفضلة"}
        </button>
      </div>

      {/* Default muezzin status */}
      {isDefault ? (
        <div style={bannerStyle("#f0fdf4", "#065f46", "#bbf7d0")}>
          ✓ هذا هو مؤذنك الافتراضي الحالي
        </div>
      ) : saved ? (
        <div style={bannerStyle("#f0fdf4", "#065f46", "#bbf7d0")}>
          ✓ تم تعيينه كمؤذن افتراضي بنجاح
        </div>
      ) : null}

      {/* Biography */}
      <Section title="📖 نبذة">
        <p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: 1.7, margin: 0 }}>
          {muezzin.biography}
        </p>
      </Section>

      {/* Rating display + user rating */}
      <Section title="⭐ التقييم">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
          <StarRating rating={muezzin.rating} />
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>{muezzin.rating}</span>
          <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            من أصل 5.0 · {formatNum(muezzin.totalRatings)} تقييم
          </span>
        </div>

        {/* Interactive user rating */}
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
          <div style={{ fontSize: "0.78rem", color: "#374151", fontWeight: 600, marginBottom: "0.5rem" }}>
            {userRating > 0 ? "تقييمك:" : "قيّم هذا المؤذن:"}
          </div>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverStar(star)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => handleRate(star)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "1.6rem", padding: "0.1rem",
                  color: star <= (hoverStar || userRating) ? "#f59e0b" : "#e5e7eb",
                  transition: "color 0.1s",
                }}
                title={`${star} نجوم`}
              >
                ★
              </button>
            ))}
          </div>
          {ratedFlash && (
            <div style={{ fontSize: "0.75rem", color: "#065f46", fontWeight: 600, marginTop: "0.35rem" }}>
              ✓ شكراً على تقييمك!
            </div>
          )}
        </div>
      </Section>

      {/* Tags */}
      <Section title="🏷️ التصنيفات">
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {muezzin.tags.map((tag) => (
            <span key={tag} style={{
              padding: "0.25rem 0.7rem",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 600,
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #e5e7eb",
            }}>
              {tag}
            </span>
          ))}
        </div>
      </Section>

      {/* Audio player */}
      <Section title="🎵 أذانات الفريضة الخمس">
        <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.875rem" }}>
          اضغط على أي وقت للاستماع · الأذانات بصوت {muezzin.name}
        </p>

        {/* General adhan (plays for all prayers except fajr override) */}
        <AudioRow
          label="الأذان العام"
          sublabel="يُشغَّل للظهر والعصر والمغرب والعشاء"
          duration={muezzin.durationSec}
          isPlaying={playState.key === "general"}
          onPlay={() => handlePlay("general")}
          icon="🕌"
        />

        {/* Fajr — special version if available */}
        {muezzin.fajrUrl ? (
          <AudioRow
            label="أذان الفجر"
            sublabel='بزيادة "الصلاة خير من النوم"'
            duration={muezzin.durationSec + 15}
            isPlaying={playState.key === "fajr"}
            onPlay={() => handlePlay("fajr")}
            icon="🌙"
            highlight
          />
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.75rem", borderRadius: "0.6rem",
            background: "#fafafa", border: "1px solid #f3f4f6",
            marginBottom: "0.4rem",
          }}>
            <span style={{ fontSize: "1rem" }}>🌙</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 600 }}>أذان الفجر</div>
              <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>يُستخدم الأذان العام للفجر لهذا المؤذن</div>
            </div>
          </div>
        )}

        {/* Per-prayer preview labels */}
        <div style={{ marginTop: "0.5rem", padding: "0.75rem", borderRadius: "0.6rem", background: "#f8fafc", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem", fontWeight: 600 }}>
            توزيع الأذانات على الصلوات:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {PRAYER_KEYS.map((key) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                <span>{PRAYER_ICON[key]}</span>
                <span style={{ fontWeight: 600, color: "#374151", width: "3.5rem" }}>{PRAYER_ARABIC[key]}</span>
                <span style={{ color: "#6b7280" }}>
                  {key === "fajr" && muezzin.fajrUrl ? "أذان الفجر الخاص" : "الأذان العام"}
                </span>
                <span style={{ marginRight: "auto", color: "#9ca3af", fontSize: "0.72rem" }}>
                  {key === "fajr" && muezzin.fajrUrl
                    ? formatDuration(muezzin.durationSec + 15)
                    : formatDuration(muezzin.durationSec)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Set as default */}
      {!isDefault && (
        <button
          type="button"
          onClick={handleSetDefault}
          style={{
            width: "100%",
            padding: "0.875rem",
            borderRadius: "0.875rem",
            border: "none",
            background: "linear-gradient(135deg, #134a3a, #0c3020)",
            color: "#fff",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: "0.75rem",
          }}
        >
          🎙️ تعيين كمؤذن افتراضي
        </button>
      )}

      <Link href="/adhan-settings">
        <button type="button" style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "0.875rem",
          border: "1.5px solid #134a3a",
          background: "transparent",
          color: "#134a3a",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          marginBottom: "2rem",
        }}>
          ⚙️ إعدادات الأذان التفصيلية
        </button>
      </Link>

      {/* Related muezzins */}
      {related.length > 0 && (
        <Section title="🎙️ قد يعجبك أيضاً">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {related.map((m) => (
              <Link key={m.id} href={`/muezzins/${m.id}`}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "0.75rem",
                  border: "1.5px solid #f3f4f6",
                  background: "#fff",
                  cursor: "pointer",
                }}>
                  <span style={{ fontSize: "1.25rem" }}>🎙️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{m.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{m.origin} · {m.style}</div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600 }}>
                    ★ {m.rating}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function AudioRow({ label, sublabel, duration, isPlaying, onPlay, icon, highlight = false }: {
  label: string;
  sublabel: string;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.75rem 0.875rem",
      borderRadius: "0.75rem",
      border: `1.5px solid ${highlight ? "#bbf7d0" : "#e5e7eb"}`,
      background: highlight ? "#f0fdf4" : "#fafafa",
      marginBottom: "0.5rem",
    }}>
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{label}</div>
        <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{sublabel}</div>
      </div>
      <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{formatDuration(duration)}</span>
      <button
        type="button"
        onClick={onPlay}
        style={{
          width: 36, height: 36,
          borderRadius: "50%",
          border: "none",
          background: isPlaying ? "#ef4444" : "#134a3a",
          color: "#fff",
          cursor: "pointer",
          fontSize: "0.9rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
        title={isPlaying ? "إيقاف" : "استمع"}
      >
        {isPlaying ? "⏹" : "▶"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151", margin: "0 0 0.625rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {title}
      </h2>
      <div style={{ background: "#fff", borderRadius: "0.875rem", border: "1px solid #e5e7eb", padding: "0.875rem 1rem" }}>
        {children}
      </div>
    </div>
  );
}

function bannerStyle(bg: string, color: string, border: string): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: "0.6rem",
    padding: "0.6rem 0.875rem",
    marginBottom: "1rem",
    fontSize: "0.82rem",
    color,
    fontWeight: 600,
  };
}

const backBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  marginBottom: "1rem",
  padding: "0.4rem 0.875rem",
  borderRadius: "0.5rem",
  border: "1.5px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
