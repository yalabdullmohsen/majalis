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

/** خرطوش رقم الصفحة — مزخرف واضح، يُعرض وسط أسفل الصفحة */
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
      {/* جسم الخرطوش */}
      <rect
        x="36"
        y="10"
        width="128"
        height="36"
        rx="12"
        fill="var(--color-mushaf-panel, #FAF3E8)"
        stroke="var(--color-mushaf-gold-strong, #A67C3D)"
        strokeWidth="1.75"
      />
      <rect
        x="42"
        y="15"
        width="116"
        height="26"
        rx="9"
        fill="none"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="0.7"
        opacity="0.65"
      />
      {/* لفائف جانبية أوضح */}
      <g fill="none" stroke="var(--color-mushaf-gold-strong, #A67C3D)" strokeWidth="1.35">
        <path d="M28 28 C18 18 10 20 12 28 C10 36 18 38 28 28" />
        <path d="M32 28 C38 22 44 22 50 28 C44 34 38 34 32 28" />
        <circle cx="22" cy="28" r="3" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.85" />
        <path d="M172 28 C182 18 190 20 188 28 C190 36 182 38 172 28" />
        <path d="M168 28 C162 22 156 22 150 28 C156 34 162 34 168 28" />
        <circle cx="178" cy="28" r="3" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.85" />
      </g>
    </svg>
  );
}
