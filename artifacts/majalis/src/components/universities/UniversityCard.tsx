import { Link } from "wouter";
import type { University } from "@/lib/universities-service";
import { ACCREDITATION_LABELS, ACCREDITATION_COLOR } from "@/lib/universities-service";
import { useCompare } from "./CompareContext";

interface Props {
  university: University;
  compact?:   boolean;
}

export function UniversityCard({ university: u, compact = false }: Props) {
  const { isInCompare, addToCompare, removeFromCompare, canAdd } = useCompare();
  const inCompare = isInCompare(u.slug);

  const programs = u.university_programs?.filter((p) => p.is_active) ?? [];
  const degrees  = [...new Set(programs.map((p) => p.degree_level))];
  const modes    = [...new Set(programs.map((p) => p.study_mode))];
  const hasScholarship = programs.some((p) => p.has_scholarship);
  const accColor = ACCREDITATION_COLOR[u.accreditation_status] || "var(--majalis-line)";

  return (
    <div dir="rtl" className="univ-card">
      {/* رأس البطاقة */}
      <div className="univ-card__head">
        {u.logo_url ? (
          <img src={u.logo_url} alt={u.name_ar} loading="lazy" decoding="async"
            className="w-10 h-10 rounded-full object-contain"
            style={{ background: "rgba(255,255,255,0.9)" }} />
        ) : (
          <div className="univ-card__head-avatar">{u.name_ar[0]}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm leading-snug line-clamp-2">{u.name_ar}</p>
          {u.name_en && <p className="univ-card__head-en">{u.name_en}</p>}
        </div>
      </div>

      {/* محتوى */}
      <div className="p-4 flex-1 space-y-3">
        {/* الموقع */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--majalis-ink-soft)" }}>
          <span>📍</span>
          <span>{u.city ? `${u.city}، ` : ""}{u.country}</span>
          {u.is_verified && (
            <span className="mr-auto univ-badge univ-badge--verified">✓ موثقة</span>
          )}
        </div>

        {/* الاعتماد */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accColor }} />
          <span className="text-xs" style={{ color: "var(--majalis-ink-soft)" }}>
            {ACCREDITATION_LABELS[u.accreditation_status]}
          </span>
        </div>

        {!compact && u.about && (
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--majalis-ink-soft)" }}>
            {u.about}
          </p>
        )}

        {/* الدرجات */}
        {degrees.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {degrees.map((d) => (
              <span key={d} className="univ-badge univ-badge--degree">{d}</span>
            ))}
          </div>
        )}

        {/* أنماط الدراسة */}
        <div className="flex flex-wrap gap-1">
          {modes.map((m) => (
            <span key={m} className="univ-badge univ-badge--mode">{m}</span>
          ))}
          {hasScholarship && (
            <span className="univ-badge univ-badge--scholarship">🎓 منح متاحة</span>
          )}
        </div>

        {/* آخر تحديث */}
        <p className="text-xs" style={{ color: "var(--majalis-line)" }}>
          آخر تحديث: {new Date(u.last_updated_at).toLocaleDateString("ar-SA")}
        </p>
      </div>

      {/* أزرار */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap">
        <Link href={`/universities/${u.slug}`} className="univ-btn univ-btn--primary flex-1 text-center">
          عرض التفاصيل
        </Link>

        {u.website_url && (
          <a
            href={u.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="univ-btn univ-btn--ghost"
            title="الموقع الرسمي"
          >
            🌐 الموقع
          </a>
        )}

        <button
          type="button"
          title={inCompare ? "إزالة من المقارنة" : canAdd ? "أضف للمقارنة" : "تعبأت المقارنة (4)"}
          onClick={() => inCompare ? removeFromCompare(u.slug) : addToCompare(u)}
          className={`univ-btn ${inCompare ? "univ-btn--compare-active" : "univ-btn--ghost"}`}
          disabled={!inCompare && !canAdd}
        >
          {inCompare ? "✓ مقارنة" : "⇔"}
        </button>
      </div>
    </div>
  );
}
