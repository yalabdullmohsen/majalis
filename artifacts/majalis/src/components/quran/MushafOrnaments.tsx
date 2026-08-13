/**
 * زخارف مصحف أصلية (SVG) — رسم أصلي للمجلس العلمي.
 * علامة الآية في دقة QPC = مجسم الخط نفسه (لا تُستبدل بـ SVG).
 * انظر CREDITS.md و RELEASE_READINESS.md.
 */
import { useId } from "react";

/**
 * @deprecated الشارة الحية: SurahBanner — يُبقى للتوافق مع اختبارات قديمة.
 */
export function MushafSurahBadgeFrame({ className }: { className?: string }) {
  return (
    <div
      className={className ? `mf2-surah-badge ${className}` : "mf2-surah-badge"}
      aria-hidden="true"
    >
      <div className="mf2-surah-badge__bar" />
    </div>
  );
}

/**
 * حلقة آية للوضع Unicode/خفيف فقط — دقة QPC تستخدم مجسم الخط مع لون ذهبي.
 * يجب أن يظهر الرقم داخل الحلقة.
 */
export function MushafAyahMarkerSvg({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-ay`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          <stop offset="100%" stopColor="var(--color-mushaf-gold-strong, #A67C3D)" />
        </linearGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="18.2"
        fill="var(--color-mushaf-panel, #FAF3E8)"
        stroke={`url(#${uid}-ay)`}
        strokeWidth="1.1"
      />
      <circle
        cx="20"
        cy="20"
        r="15.4"
        fill="none"
        stroke={`url(#${uid}-ay)`}
        strokeWidth="0.45"
        opacity="0.45"
      />
    </svg>
  );
}

/** خرطوش رقم الصفحة — إطار ذهبي مزدوج · لفائف جانبية · خلفية بيج */
export function MushafPageCartoucheSvg({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 200 56"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-pg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          <stop offset="100%" stopColor="var(--color-mushaf-gold-strong, #A67C3D)" />
        </linearGradient>
      </defs>
      <path
        d="M34 28 C22 10 6 14 8 28 C6 42 22 46 34 28 Z"
        fill="var(--color-mushaf-panel, #FAF3E8)"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="1.6"
      />
      <circle cx="16" cy="28" r="4.2" fill={`url(#${uid}-pg)`} opacity="0.9" />
      <path
        d="M166 28 C178 10 194 14 192 28 C194 42 178 46 166 28 Z"
        fill="var(--color-mushaf-panel, #FAF3E8)"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="1.6"
      />
      <circle cx="184" cy="28" r="4.2" fill={`url(#${uid}-pg)`} opacity="0.9" />
      <rect
        x="32"
        y="8"
        width="136"
        height="40"
        rx="10"
        fill="var(--color-mushaf-panel, #FAF3E8)"
        stroke="var(--color-mushaf-gold-strong, #A67C3D)"
        strokeWidth="2"
      />
      <rect
        x="38"
        y="13"
        width="124"
        height="30"
        rx="7"
        fill="none"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="0.85"
        opacity="0.75"
      />
    </svg>
  );
}
