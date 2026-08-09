/**
 * زخارف مصحف أصلية (SVG) — رسم أصلي للمجلس العلمي (لا يُستخرج من تطبيق آخر).
 * انظر CREDITS.md.
 */
import { useId } from "react";

/** طرف نباتي كثيف ممتلئ + وردة كبيرة — يملأ مساحة الطرف بلا فراغ */
function SurahBadgeEnd({ mirror }: { mirror?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const g = `${uid}-g`;
  const petals = [0, 40, 80, 120, 160, 200, 240, 280, 320];
  return (
    <svg
      className="mf2-surah-badge__end-svg"
      viewBox="0 0 100 52"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0.15" x2="1" y2="0.85">
          <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          <stop offset="55%" stopColor="var(--color-mushaf-gold, #8B6914)" />
          <stop offset="100%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
        </linearGradient>
      </defs>
      {/* طبقة خلفية نباتية كثيفة تملأ الطرف */}
      <g fill={`url(#${g})`}>
        <path d="M0 26 C6 4 26 2 44 14 C34 6 20 4 8 12 C3 18 1 23 0 26Z" opacity="0.92" />
        <path d="M0 26 C6 48 26 50 44 38 C34 46 20 48 8 40 C3 34 1 29 0 26Z" opacity="0.92" />
        <path d="M10 26 C18 10 36 8 52 18 C44 12 30 10 18 18 C13 21 11 24 10 26Z" opacity="0.95" />
        <path d="M10 26 C18 42 36 44 52 34 C44 40 30 42 18 34 C13 31 11 28 10 26Z" opacity="0.95" />
        <path d="M24 6 C36 1 54 3 66 14 C58 6 44 2 30 8 C26 10 24 8 24 6Z" opacity="0.9" />
        <path d="M24 46 C36 51 54 49 66 38 C58 46 44 50 30 44 C26 42 24 44 24 46Z" opacity="0.9" />
        <path d="M36 26 C44 12 62 10 76 20 C68 14 54 12 42 20 C38 22 36 24 36 26Z" opacity="0.88" />
        <path d="M36 26 C44 40 62 42 76 32 C68 38 54 40 42 32 C38 30 36 28 36 26Z" opacity="0.88" />
        <ellipse cx="16" cy="12" rx="7" ry="4.2" transform="rotate(-38 16 12)" opacity="0.85" />
        <ellipse cx="16" cy="40" rx="7" ry="4.2" transform="rotate(38 16 40)" opacity="0.85" />
        <ellipse cx="30" cy="8" rx="6.2" ry="3.6" transform="rotate(-22 30 8)" opacity="0.82" />
        <ellipse cx="30" cy="44" rx="6.2" ry="3.6" transform="rotate(22 30 44)" opacity="0.82" />
        <ellipse cx="44" cy="11" rx="5.8" ry="3.4" transform="rotate(-28 44 11)" opacity="0.8" />
        <ellipse cx="44" cy="41" rx="5.8" ry="3.4" transform="rotate(28 44 41)" opacity="0.8" />
        <ellipse cx="56" cy="15" rx="5.2" ry="3.1" transform="rotate(-18 56 15)" opacity="0.78" />
        <ellipse cx="56" cy="37" rx="5.2" ry="3.1" transform="rotate(18 56 37)" opacity="0.78" />
        <ellipse cx="20" cy="26" rx="8" ry="5" opacity="0.55" />
        <ellipse cx="40" cy="26" rx="7" ry="4.5" opacity="0.5" />
        <ellipse cx="58" cy="26" rx="6" ry="4" opacity="0.45" />
      </g>
      <g fill="none" stroke={`url(#${g})`} strokeWidth="1.6" opacity="0.55">
        <path d="M4 26 H62" />
        <path d="M14 14 C28 20 42 20 56 14" />
        <path d="M14 38 C28 32 42 32 56 38" />
        <path d="M22 8 C34 16 46 16 58 10" />
        <path d="M22 44 C34 36 46 36 58 42" />
      </g>
      {/* وردة دائرية مركزية — واضحة البتلات وأكبر */}
      <g transform="translate(78 26)">
        <circle r="15.2" fill="color-mix(in srgb, var(--color-mushaf-badge-bg, #E8DFD0) 70%, #fff)" stroke={`url(#${g})`} strokeWidth="1.6" />
        <circle r="12.6" fill="none" stroke={`url(#${g})`} strokeWidth="0.7" opacity="0.6" />
        {petals.map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-8.4"
            rx="3.6"
            ry="6.4"
            fill={`url(#${g})`}
            opacity="0.8"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="5" fill={`url(#${g})`} opacity="0.9" />
        <circle r="2.4" fill="color-mix(in srgb, var(--color-mushaf-badge-bg, #E8DFD0) 65%, #fff)" />
      </g>
    </svg>
  );
}

/**
 * شارة سورة: شريط بيج ممتلئ + إطار ذهبي متوسط + طرفان كثيفان + لوحة وسطى 45%.
 * الطرفان داخل الإطار؛ اللوحة متمركزة تمامًا.
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
