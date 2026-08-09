/**
 * زخارف مصحف أصلية (SVG) — رسم أصلي للمجلس العلمي (لا يُستخرج من تطبيق آخر).
 * انظر CREDITS.md.
 */
import { useId } from "react";

/** طرف نباتي كثيف ممتلئ + وردة مركزية كبيرة — داخل الإطار */
function SurahBadgeEnd({ mirror }: { mirror?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const g = `${uid}-g`;
  const petals = [0, 40, 80, 120, 160, 200, 240, 280, 320];
  return (
    <svg
      className="mf2-surah-badge__end-svg"
      viewBox="0 0 120 56"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C9B07A" />
          <stop offset="45%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#C9B07A" />
        </linearGradient>
      </defs>
      {/* حشو بيج الطرف */}
      <rect x="0" y="0" width="120" height="56" fill="#D4C4A8" />
      {/* أوراق/سيقان ممتلئة تغطي المساحة بالكامل حول الوردة */}
      <g fill={`url(#${g})`}>
        <path d="M0 28 C10 2 38 0 58 16 C48 6 28 2 12 12 C5 18 1 24 0 28Z" opacity="0.95" />
        <path d="M0 28 C10 54 38 56 58 40 C48 50 28 54 12 44 C5 38 1 32 0 28Z" opacity="0.95" />
        <path d="M62 28 C72 8 96 6 118 18 C108 10 90 8 74 18 C67 22 63 26 62 28Z" opacity="0.95" />
        <path d="M62 28 C72 48 96 50 118 38 C108 46 90 48 74 38 C67 34 63 30 62 28Z" opacity="0.95" />
        <path d="M8 8 C28 0 52 2 70 14 C56 4 34 0 16 10 C11 12 8 10 8 8Z" opacity="0.9" />
        <path d="M8 48 C28 56 52 54 70 42 C56 52 34 56 16 46 C11 44 8 46 8 48Z" opacity="0.9" />
        <path d="M50 6 C70 0 94 2 112 12 C98 4 76 0 58 8 C53 10 50 8 50 6Z" opacity="0.88" />
        <path d="M50 50 C70 56 94 54 112 44 C98 52 76 56 58 48 C53 46 50 48 50 50Z" opacity="0.88" />
        <ellipse cx="18" cy="14" rx="9" ry="5.5" transform="rotate(-40 18 14)" />
        <ellipse cx="18" cy="42" rx="9" ry="5.5" transform="rotate(40 18 42)" />
        <ellipse cx="36" cy="10" rx="8" ry="4.8" transform="rotate(-25 36 10)" />
        <ellipse cx="36" cy="46" rx="8" ry="4.8" transform="rotate(25 36 46)" />
        <ellipse cx="84" cy="12" rx="8" ry="4.8" transform="rotate(25 84 12)" />
        <ellipse cx="84" cy="44" rx="8" ry="4.8" transform="rotate(-25 84 44)" />
        <ellipse cx="102" cy="16" rx="7.5" ry="4.5" transform="rotate(35 102 16)" />
        <ellipse cx="102" cy="40" rx="7.5" ry="4.5" transform="rotate(-35 102 40)" />
        <ellipse cx="28" cy="28" rx="11" ry="7" opacity="0.65" />
        <ellipse cx="92" cy="28" rx="11" ry="7" opacity="0.65" />
      </g>
      <g fill="none" stroke={`url(#${g})`} strokeWidth="2.2" opacity="0.65">
        <path d="M4 28 H48" />
        <path d="M72 28 H116" />
        <path d="M16 12 C30 20 42 20 52 14" />
        <path d="M16 44 C30 36 42 36 52 42" />
        <path d="M68 14 C82 20 94 20 108 12" />
        <path d="M68 42 C82 36 94 36 108 44" />
      </g>
      {/* وردة في مركز الطرف */}
      <g transform="translate(60 28)">
        <circle r="16.5" fill="#EDE4D4" stroke={`url(#${g})`} strokeWidth="2" />
        <circle r="13.8" fill="none" stroke={`url(#${g})`} strokeWidth="0.9" opacity="0.65" />
        {petals.map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-9.2"
            rx="4"
            ry="7.2"
            fill={`url(#${g})`}
            opacity="0.88"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="5.6" fill={`url(#${g})`} />
        <circle r="2.6" fill="#EDE4D4" />
      </g>
    </svg>
  );
}

/**
 * شارة سورة: شريط بيج ممتلئ + إطار ذهبي متوسط + طرفان كثيفان + لوحة وسطى 45%.
 */
export function MushafSurahBadgeFrame({ className }: { className?: string }) {
  return (
    <div className={className ? `mf2-surah-badge ${className}` : "mf2-surah-badge"} aria-hidden="true">
      <div className="mf2-surah-badge__bar">
        <div className="mf2-surah-badge__end">
          <SurahBadgeEnd />
        </div>
        <div className="mf2-surah-badge__mid" />
        <div className="mf2-surah-badge__end">
          <SurahBadgeEnd mirror />
        </div>
      </div>
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
