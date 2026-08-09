/**
 * زخارف مصحف أصلية (SVG) — رسم أصلي للمجلس العلمي (لا يُستخرج من تطبيق آخر).
 * انظر CREDITS.md.
 */
import { useId } from "react";

/** نقش طرف نباتي كثيف + وردة — داخل viewBox ثابت */
function floralEndPaths(gradId: string) {
  return (
    <>
      <rect x="0" y="0" width="88" height="40" fill="var(--color-mushaf-badge-bg, #F3EBE0)" />
      <g fill="none" stroke={`url(#${gradId})`} strokeWidth="0.65" opacity="0.85">
        <path d="M3 20 C9 6 21 6 28 20 C21 34 9 34 3 20Z" />
        <path d="M10 20 C15 11 23 11 28 20 C23 29 15 29 10 20Z" opacity="0.75" />
        <path d="M26 20 C33 8 44 8 51 20 C44 32 33 32 26 20Z" />
        <path d="M34 20 C39 13 46 13 51 20 C46 27 39 27 34 20Z" opacity="0.7" />
        <path d="M24 9 C32 4 40 6 46 12" />
        <path d="M24 31 C32 36 40 34 46 28" />
        <path d="M8 12 C14 8 18 10 22 14" opacity="0.65" />
        <path d="M8 28 C14 32 18 30 22 26" opacity="0.65" />
        <path d="M48 11 C52 8 56 10 58 14 M48 29 C52 32 56 30 58 26" opacity="0.55" />
      </g>
      <circle
        cx="70"
        cy="20"
        r="10"
        fill="color-mix(in srgb, var(--color-mushaf-paper, #F7F0E4) 55%, #fff)"
        stroke={`url(#${gradId})`}
        strokeWidth="0.95"
      />
      <circle cx="70" cy="20" r="6.2" fill="none" stroke={`url(#${gradId})`} strokeWidth="0.55" opacity="0.75" />
      <circle cx="70" cy="20" r="2.4" fill={`url(#${gradId})`} opacity="0.55" />
      <path
        d="M70 11.2 Q74 16 70 20 Q66 16 70 11.2Z M70 28.8 Q74 24 70 20 Q66 24 70 28.8Z M61.2 20 Q66 24 70 20 Q66 16 61.2 20Z M78.8 20 Q74 24 70 20 Q74 16 78.8 20Z"
        fill={`url(#${gradId})`}
        opacity="0.42"
      />
      <path
        d="M70 14.5 L71.2 18.2 L75 18.5 L72 21.1 L72.9 24.8 L70 22.8 L67.1 24.8 L68 21.1 L65 18.5 L68.8 18.2Z"
        fill={`url(#${gradId})`}
        opacity="0.35"
      />
    </>
  );
}

/**
 * شارة سورة — SVG جذر واحد: الطرفان بعرض ثابت نسبي (~27.5%) والوسط يمتد (~45%).
 */
export function MushafSurahBadgeFrame({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const stroke = `${uid}-stroke`;
  const gL = `${uid}-gl`;
  const gR = `${uid}-gr`;
  return (
    <div className={className ? `mf2-surah-badge ${className}` : "mf2-surah-badge"} aria-hidden="true">
      <svg
        className="mf2-surah-badge__svg"
        width="100%"
        height="100%"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id={stroke} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
            <stop offset="50%" stopColor="var(--color-mushaf-gold, #8B6914)" />
            <stop offset="100%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          </linearGradient>
          <linearGradient id={gL} x1="0" y1="0.5" x2="1" y2="0.5">
            <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
            <stop offset="100%" stopColor="var(--color-mushaf-gold, #8B6914)" />
          </linearGradient>
          <linearGradient id={gR} x1="0" y1="0.5" x2="1" y2="0.5">
            <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
            <stop offset="100%" stopColor="var(--color-mushaf-gold, #8B6914)" />
          </linearGradient>
        </defs>
        <rect
          x="0.5"
          y="0.5"
          width="399"
          height="39"
          rx="2.5"
          fill="var(--color-mushaf-badge-bg, #F3EBE0)"
          stroke={`url(#${stroke})`}
          strokeWidth="0.85"
        />
        {/* وسط فاتح ≈ 45% — يمتد مع العرض */}
        <svg x="110" y="0" width="180" height="40" viewBox="0 0 180 40" preserveAspectRatio="none">
          <rect
            x="1"
            y="5"
            width="178"
            height="30"
            rx="1.5"
            fill="color-mix(in srgb, var(--color-mushaf-paper, #F7F0E4) 70%, #fff)"
            stroke="var(--color-mushaf-gold-soft, #C9B07A)"
            strokeWidth="0.55"
          />
        </svg>
        {/* طرفان: meet يحافظ على نسبة النقش */}
        <svg x="2" y="1" width="108" height="38" viewBox="0 0 88 40" preserveAspectRatio="xMidYMid meet">
          {floralEndPaths(gL)}
        </svg>
        <svg x="290" y="1" width="108" height="38" viewBox="0 0 88 40" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(88,0) scale(-1,1)">{floralEndPaths(gR)}</g>
        </svg>
      </svg>
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
