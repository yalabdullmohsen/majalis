import { CalendarDays, MapPin, Phone, Globe, ExternalLink, UserCheck } from "lucide-react";
import type { QuranCircle } from "@/lib/quran-circles-service";
import { GeometricPattern } from "@/components/design/GeometricPattern";
import { formatSheikhName } from "@/lib/sheikh-name";

const LEVEL_MOD: Record<string, string> = {
  "مبتدئ": "qcl--mubtadi",
  "متوسط": "qcl--mutawassit",
  "متقدم": "qcl--mutaqaddim",
};

const MODE_COLOR: Record<string, string> = {
  "حضوري":   "qc-badge--mode-inperson",
  "عن بُعد": "qc-badge--mode-remote",
  "هجين":    "qc-badge--mode-hybrid",
};

interface Props {
  circle: QuranCircle;
}

function isPhone(v: string): boolean {
  return /^[\d+\s()-]{6,}$/.test(v.trim());
}

function phoneHref(v: string): string {
  const digits = v.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

function whatsappHref(v: string): string {
  const digits = v.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

export function QuranCircleCard({ circle: c }: Props) {
  const pct = c.capacity && c.enrolled_count
    ? Math.min(100, Math.round((c.enrolled_count / c.capacity) * 100))
    : null;

  const daysLabel = c.schedule_days?.join(" · ") ?? "";
  const hasPhone   = !!c.contact_info && isPhone(c.contact_info);
  const isRemote   = c.mode === "عن بُعد" || c.mode === "هجين";

  return (
    <div className="qc-card">
      <div className="qc-card__head">
        <GeometricPattern pattern="stars" color="#fff" opacity={0.12} />
        <p className="qc-card__title">{c.name}</p>
        {c.sheikh_name && <p className="qc-card__sheikh">{formatSheikhName(c.sheikh_name)}</p>}
      </div>

      <div className="qc-card__body">
        {/* الشارات */}
        <div className="qc-card__badges">
          <span className={`qc-badge qc-badge--level ${LEVEL_MOD[c.level] ?? ""}`}>
            {c.level}
          </span>
          <span className={`qc-badge qc-badge--mode ${MODE_COLOR[c.mode] ?? ""}`}>
            {c.mode}
          </span>
          {c.track !== "عام" && (
            <span className="qc-badge qc-badge--track">{c.track}</span>
          )}
          {(c as any).governorate && (
            <span className="qc-badge qc-badge--gov">{(c as any).governorate}</span>
          )}
        </div>

        {/* الجدول */}
        {daysLabel && (
          <p className="qc-card__meta">
            <CalendarDays size={13} className="inline ml-1" aria-hidden="true" />
            {daysLabel}
            {c.schedule_time ? ` — ${c.schedule_time}` : ""}
          </p>
        )}

        {/* الموقع */}
        {c.location && (
          <p className="qc-card__meta">
            <MapPin size={13} className="inline ml-1" aria-hidden="true" />
            {c.location}
          </p>
        )}

        {/* الوصف */}
        {c.description && (
          <p className="qc-card__desc">{c.description}</p>
        )}

        {/* الطاقة الاستيعابية */}
        {pct !== null && (
          <div>
            <p className="qc-card__capacity-label">
              {c.enrolled_count}/{c.capacity} مشترك
              {pct >= 90 && " · المقاعد تنتهي"}
            </p>
            <div className="qc-card__capacity">
              <div
                className="qc-card__capacity-bar"
                style={{
                  "--qcc-pct": `${pct}%`,
                  "--qcc-bar-color": pct >= 90
                    ? "var(--majalis-danger, #9B1C1C)"
                    : "var(--majalis-emerald)",
                } as React.CSSProperties}
              />
            </div>
          </div>
        )}
      </div>

      {/* الأزرار */}
      <div className="qc-card__footer qc-card__footer--multi">
        {/* زر التسجيل */}
        {(c as any).registration_url && (
          <a
            href={(c as any).registration_url}
            target="_blank" rel="noopener noreferrer"
            className="qc-card__reg-btn"
          >
            <UserCheck size={14} aria-hidden="true" />
            سجّل الآن
          </a>
        )}

        {/* زر الانضمام عن بُعد */}
        {isRemote && c.meeting_link && !(c as any).registration_url && (
          <a
            href={c.meeting_link}
            target="_blank" rel="noopener noreferrer"
            className="qc-card__join-btn"
          >
            <ExternalLink size={14} aria-hidden="true" />
            انضم عبر الإنترنت
          </a>
        )}

        {/* الموقع الإلكتروني */}
        {(c as any).website_url && (
          <a
            href={(c as any).website_url}
            target="_blank" rel="noopener noreferrer"
            className="qc-card__site-btn"
            aria-label="الموقع الإلكتروني"
          >
            <Globe size={14} aria-hidden="true" />
            الموقع
          </a>
        )}

        {/* الهاتف / واتساب */}
        {c.contact_info && hasPhone && (
          <div className="qc-card__contact-row">
            <a href={phoneHref(c.contact_info)} className="qc-card__contact-link" aria-label={`اتصال: ${c.contact_info}`}>
              <Phone size={13} aria-hidden="true" />
              {c.contact_info}
            </a>
            {c.contact_info.startsWith("+") && (
              <a
                href={whatsappHref(c.contact_info)}
                target="_blank" rel="noopener noreferrer"
                className="qc-card__wa-link"
                aria-label="واتساب"
              >
                واتساب
              </a>
            )}
          </div>
        )}

        {/* نص إذا لم يكن رقم هاتف (مثل رابط موقع) */}
        {c.contact_info && !hasPhone && !(c as any).website_url && (
          <span className="qc-card__contact">
            <Globe size={13} className="inline ml-1" />
            {c.contact_info}
          </span>
        )}
      </div>
    </div>
  );
}
