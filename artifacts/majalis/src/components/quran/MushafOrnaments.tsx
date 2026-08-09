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

/** خرطوش رقم الصفحة — ممتلئ واضح ≈24px مع طرفين مزخرفين */
export function MushafPageCartoucheSvg({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 168 48"
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
      <rect
        x="28"
        y="8"
        width="112"
        height="32"
        rx="10"
        fill="var(--color-mushaf-panel, #FAF3E8)"
        stroke="var(--color-mushaf-gold-strong, #A67C3D)"
        strokeWidth="1.5"
      />
      <rect
        x="33"
        y="12"
        width="102"
        height="24"
        rx="8"
        fill="none"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="0.55"
        opacity="0.55"
      />
      {/* لولب صغير يمين/يسار */}
      <g fill="none" stroke="var(--color-mushaf-gold-strong, #A67C3D)" strokeWidth="1.2">
        <path d="M18 24 C12 18 8 20 10 24 C8 28 12 30 18 24" />
        <path d="M22 24 C26 20 30 20 34 24 C30 28 26 28 22 24" />
        <circle cx="16" cy="24" r="2.2" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.7" />
        <path d="M150 24 C156 18 160 20 158 24 C160 28 156 30 150 24" />
        <path d="M146 24 C142 20 138 20 134 24 C138 28 142 28 146 24" />
        <circle cx="152" cy="24" r="2.2" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.7" />
      </g>
    </svg>
  );
}
