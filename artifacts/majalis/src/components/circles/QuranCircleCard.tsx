import type { QuranCircle } from "@/lib/quran-circles-service";
import { GeometricPattern } from "@/components/design/GeometricPattern";

const LEVEL_COLOR: Record<string, string> = {
  "مبتدئ": "#d1fae5",
  "متوسط": "rgba(14,110,82,0.08)",
  "متقدم": "#fee2e2",
};
const LEVEL_TEXT: Record<string, string> = {
  "مبتدئ": "#065f46",
  "متوسط": "#0E6E52",
  "متقدم": "#991b1b",
};

interface Props {
  circle: QuranCircle;
}

export function QuranCircleCard({ circle: c }: Props) {
  const pct = c.capacity && c.enrolled_count
    ? Math.min(100, Math.round((c.enrolled_count / c.capacity) * 100))
    : null;

  const daysLabel = c.schedule_days?.join(" • ") ?? "";

  return (
    <div className="qc-card">
      <div className="qc-card__head">
        <GeometricPattern pattern="stars" color="#fff" opacity={0.12} />
        <p className="qc-card__title">{c.name}</p>
        {c.sheikh_name && <p className="qc-card__sheikh">الشيخ: {c.sheikh_name}</p>}
      </div>

      <div className="qc-card__body">
        <div className="qc-card__badges">
          <span className="qc-badge qc-badge--level"
            style={{ background: LEVEL_COLOR[c.level] ?? "#f3f4f6", color: LEVEL_TEXT[c.level] ?? "#374151" }}>
            {c.level}
          </span>
          <span className="qc-badge qc-badge--mode">{c.mode}</span>
          {c.track !== "عام" && <span className="qc-badge qc-badge--track">{c.track}</span>}
        </div>

        {daysLabel && (
          <p style={{ fontSize: "0.78rem", color: "var(--majalis-ink-soft)" }}>
            📅 {daysLabel}{c.schedule_time ? ` — ${c.schedule_time}` : ""}
          </p>
        )}

        {c.location && (
          <p style={{ fontSize: "0.78rem", color: "var(--majalis-ink-soft)" }}>📍 {c.location}</p>
        )}

        {c.description && (
          <p style={{ fontSize: "0.8rem", color: "var(--majalis-ink-soft)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {c.description}
          </p>
        )}

        {pct !== null && (
          <div>
            <p style={{ fontSize: "0.7rem", color: "var(--majalis-ink-soft)", marginBottom: "0.25rem" }}>
              {c.enrolled_count}/{c.capacity} مشترك
              {pct >= 90 && " · المقاعد تنتهي"}
            </p>
            <div className="qc-card__capacity">
              <div className="qc-card__capacity-bar"
                style={{ width: `${pct}%`, background: pct >= 90 ? "#ef4444" : "var(--majalis-emerald)" }} />
            </div>
          </div>
        )}
      </div>

      {c.contact_info && (
        <div className="qc-card__footer">
          {c.mode !== "حضوري" && c.meeting_link ? (
            <a href={c.meeting_link} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, textAlign: "center", padding: "0.5rem", background: "var(--majalis-emerald)", color: "#fff", borderRadius: "0.6rem", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none" }}>
              انضم عن بُعد
            </a>
          ) : (
            <span style={{ flex: 1, fontSize: "0.78rem", color: "var(--majalis-ink-soft)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              📞 {c.contact_info}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
