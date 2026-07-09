import { CalendarDays, MapPin, Phone } from "lucide-react";
import type { QuranCircle } from "@/lib/quran-circles-service";
import { GeometricPattern } from "@/components/design/GeometricPattern";

const LEVEL_COLOR: Record<string, string> = {
  "مبتدئ": "var(--majalis-emerald-soft, #EBF5F0)",
  "متوسط": "var(--majalis-emerald-muted, rgba(14,110,82,0.08))",
  "متقدم": "var(--majalis-danger-muted, rgba(155,28,28,0.08))",
};
const LEVEL_TEXT: Record<string, string> = {
  "مبتدئ": "var(--majalis-emerald-deep, #0A5040)",
  "متوسط": "var(--majalis-emerald, #1F4D3A)",
  "متقدم": "var(--majalis-danger, #9B1C1C)",
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
          <span
            className="qc-badge qc-badge--level"
            style={{ "--qcl-bg": LEVEL_COLOR[c.level] ?? "#f3f4f6", "--qcl-color": LEVEL_TEXT[c.level] ?? "#374151" } as React.CSSProperties}
          >
            {c.level}
          </span>
          <span className="qc-badge qc-badge--mode">{c.mode}</span>
          {c.track !== "عام" && <span className="qc-badge qc-badge--track">{c.track}</span>}
        </div>

        {daysLabel && (
          <p className="qc-card__meta">
            <CalendarDays size={13} className="inline ml-1" />{daysLabel}{c.schedule_time ? ` — ${c.schedule_time}` : ""}
          </p>
        )}

        {c.location && (
          <p className="qc-card__meta"><MapPin size={13} className="inline ml-1" />{c.location}</p>
        )}

        {c.description && (
          <p className="qc-card__desc">{c.description}</p>
        )}

        {pct !== null && (
          <div>
            <p className="qc-card__capacity-label">
              {c.enrolled_count}/{c.capacity} مشترك
              {pct >= 90 && " · المقاعد تنتهي"}
            </p>
            <div className="qc-card__capacity">
              <div
                className="qc-card__capacity-bar"
                style={{ "--qcc-pct": `${pct}%`, "--qcc-bar-color": pct >= 90 ? "var(--majalis-danger, #9B1C1C)" : "var(--majalis-emerald)" } as React.CSSProperties}
              />
            </div>
          </div>
        )}
      </div>

      {c.contact_info && (
        <div className="qc-card__footer">
          {c.mode !== "حضوري" && c.meeting_link ? (
            <a href={c.meeting_link} target="_blank" rel="noopener noreferrer" className="qc-card__join-btn">
              انضم عن بُعد
            </a>
          ) : (
            <span className="qc-card__contact">
              <Phone size={13} className="inline ml-1" />{c.contact_info}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
