/**
 * زخارف مصحف أصلية (SVG) — رسم أصلي للمجلس العلمي (لا يُستخرج من تطبيق آخر).
 * شارة السورة: شريط بسيط بلا نقش طرفي (الخيار الثاني).
 * انظر CREDITS.md و RELEASE_READINESS.md (بند QCF_BSML المؤجّل).
 */
import { useId } from "react";

/**
 * شارة سورة بسيطة: شريط بيج فاتح + إطار ذهبي رفيع — بلا زخرفة في الطرفين.
 * الاسم يُرسم فوق الشريط في المكوّن الأب.
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

/** علامة رقم آية زخرفية — للوضع Unicode/خفيف؛ دقة QPC تبقى بمحارف خط الصفحة. */
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
          <stop offset="100%" stopColor="var(--color-mushaf-gold, #8B6914)" />
        </linearGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="18.2"
        fill="var(--color-mushaf-badge-bg, #F3EBE0)"
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
      <path
        d="M12 7.2 C16 5.2 24 5.2 28 7.2 M14 9 C18 7.4 22 7.4 26 9"
        fill="none"
        stroke={`url(#${uid}-ay)`}
        strokeWidth="0.7"
        opacity="0.7"
      />
      <path
        d="M12 32.8 C16 34.8 24 34.8 28 32.8 M14 31 C18 32.6 22 32.6 26 31"
        fill="none"
        stroke={`url(#${uid}-ay)`}
        strokeWidth="0.7"
        opacity="0.7"
      />
      <circle cx="20" cy="6.2" r="1.1" fill={`url(#${uid}-ay)`} opacity="0.55" />
      <circle cx="20" cy="33.8" r="1.1" fill={`url(#${uid}-ay)`} opacity="0.55" />
    </svg>
  );
}

/** خرطوش رقم الصفحة — مستطيل بحواف مستديرة وحلية في كل طرف */
export function MushafPageCartoucheSvg({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 168 44"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-pg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          <stop offset="100%" stopColor="var(--color-mushaf-gold, #8B6914)" />
        </linearGradient>
      </defs>
      <rect
        x="28"
        y="6"
        width="112"
        height="32"
        rx="12"
        fill="var(--color-mushaf-badge-bg, #F3EBE0)"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="0.9"
      />
      <rect
        x="32"
        y="10"
        width="104"
        height="24"
        rx="10"
        fill="none"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="0.45"
        opacity="0.4"
      />
      <g fill="none" stroke={`url(#${uid}-pg)`} strokeWidth="0.9">
        <circle cx="16" cy="22" r="4.4" />
        <circle cx="16" cy="22" r="1.9" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.5" />
        <path d="M21.5 22 C27 14.5 33 16.5 37.5 22 C33 27.5 27 29.5 21.5 22Z" />
        <circle cx="152" cy="22" r="4.4" />
        <circle cx="152" cy="22" r="1.9" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.5" />
        <path d="M146.5 22 C141 14.5 135 16.5 130.5 22 C135 27.5 141 29.5 146.5 22Z" />
      </g>
    </svg>
  );
}
