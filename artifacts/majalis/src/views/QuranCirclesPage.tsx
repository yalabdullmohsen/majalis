import { useEffect, useState } from "react";
import { QuranCircleCard } from "@/components/circles/QuranCircleCard";
import { getQuranCircles, type QuranCircle, type CircleFilters } from "@/lib/quran-circles-service";
import { IslamicDivider } from "@/components/design/IslamicDivider";

const LEVEL_OPTIONS  = ["الكل", "مبتدئ", "متوسط", "متقدم"];
const TRACK_OPTIONS  = ["الكل", "رجال", "نساء", "أطفال", "عام"];
const MODE_OPTIONS   = ["الكل", "حضوري", "عن بُعد", "هجين"];

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.35rem 0.85rem",
        borderRadius: "2rem",
        border: `1px solid ${active ? "var(--majalis-emerald)" : "var(--majalis-line)"}`,
        background: active ? "var(--majalis-emerald)" : "var(--majalis-panel)",
        color: active ? "#fff" : "var(--majalis-ink-soft)",
        fontSize: "0.8rem",
        fontWeight: active ? 700 : 400,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
        minHeight: "44px",
      }}
    >
      {label}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="qc-card" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
      <div className="qc-card__head" style={{ height: "4.5rem", opacity: 0.4 }} />
      <div className="qc-card__body">
        <div style={{ height: "1rem", background: "var(--majalis-line)", borderRadius: "0.5rem", width: "60%", marginBottom: "0.5rem" }} />
        <div style={{ height: "0.8rem", background: "var(--majalis-line)", borderRadius: "0.5rem", width: "40%" }} />
      </div>
    </div>
  );
}

export default function QuranCirclesPage() {
  const [circles, setCircles]   = useState<QuranCircle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [level, setLevel]       = useState("الكل");
  const [track, setTrack]       = useState("الكل");
  const [mode, setMode]         = useState("الكل");

  useEffect(() => {
    setLoading(true);
    setError(null);
    const filters: CircleFilters = {};
    if (level !== "الكل") filters.level = level;
    if (track !== "الكل") filters.track = track;
    if (mode  !== "الكل") filters.mode  = mode;

    getQuranCircles(filters)
      .then(setCircles)
      .catch(() => setError("تعذّر تحميل الحلقات — تحقق من الاتصال وحاول مجدداً."))
      .finally(() => setLoading(false));
  }, [level, track, mode]);

  return (
    <div className="ds-page" dir="rtl">
      {/* رأس الصفحة */}
      <header style={{ padding: "1.5rem 0 1rem", borderBottom: "1px solid var(--majalis-line)", marginBottom: "1rem" }}>
        <p style={{ color: "var(--majalis-emerald)", fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          حفظ القرآن الكريم
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.4rem, 5vw, 2rem)", fontWeight: 700, color: "var(--majalis-ink)", marginBottom: "0.35rem" }}>
          حلقات التحفيظ
        </h1>
        <p style={{ color: "var(--majalis-ink-soft)", fontSize: "0.9rem" }}>
          ابحث عن حلقة تناسبك وانضم إليها — مستويات ومسارات متعددة.
        </p>
      </header>

      {/* فلاتر */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)", paddingTop: "0.4rem", whiteSpace: "nowrap" }}>المستوى:</span>
          {LEVEL_OPTIONS.map((o) => (
            <FilterPill key={o} label={o} active={level === o} onClick={() => setLevel(o)} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)", paddingTop: "0.4rem", whiteSpace: "nowrap" }}>المسار:</span>
          {TRACK_OPTIONS.map((o) => (
            <FilterPill key={o} label={o} active={track === o} onClick={() => setTrack(o)} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)", paddingTop: "0.4rem", whiteSpace: "nowrap" }}>النمط:</span>
          {MODE_OPTIONS.map((o) => (
            <FilterPill key={o} label={o} active={mode === o} onClick={() => setMode(o)} />
          ))}
        </div>
      </div>

      <IslamicDivider />

      {/* المحتوى */}
      {error ? (
        <div role="alert" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--msk-red, #C1595A)" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>⚠️ {error}</p>
          <button type="button" onClick={() => setLevel(level)}
            style={{ padding: "0.5rem 1.5rem", background: "var(--majalis-emerald)", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>
            إعادة المحاولة
          </button>
        </div>
      ) : loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : circles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--majalis-ink-soft)" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🕌</p>
          <p style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.4rem" }}>لا توجد حلقات بهذه المعايير حالياً</p>
          <p style={{ fontSize: "0.85rem" }}>جرّب تغيير الفلاتر أو تواصل مع الإدارة لإضافة حلقتك.</p>
          <button type="button"
            onClick={() => { setLevel("الكل"); setTrack("الكل"); setMode("الكل"); }}
            style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", background: "var(--majalis-sage)", color: "var(--majalis-emerald-deep)", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: 600 }}>
            إزالة الفلاتر
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          {circles.map((c) => <QuranCircleCard key={c.id} circle={c} />)}
        </div>
      )}
    </div>
  );
}
