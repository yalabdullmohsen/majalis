/**
 * زخارف مصحف أصلية (SVG) — شريط نباتي داخل إطار واحد قابل للتمدد.
 * مصدر التصميم: رسم أصلي للمجلس العلمي (لا يُستخرج من تطبيق آخر).
 * انظر CREDITS.md.
 */
import { useId } from "react";

/** طرف داخلي: وردة + نقش نباتي بحشو بيج — جزء من الشريط لا عنصر معلّق */
function BadgeEnd({
  mirror,
  uid,
}: {
  mirror?: boolean;
  uid: string;
}) {
  const g = `${uid}-e${mirror ? "m" : "s"}`;
  return (
    <svg
      className="mf2-surah-badge__end"
      viewBox="0 0 80 40"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          <stop offset="100%" stopColor="var(--color-mushaf-gold, #8B6914)" />
        </linearGradient>
      </defs>
      <rect
        x="0"
        y="0"
        width="80"
        height="40"
        fill="var(--color-mushaf-badge-bg, #F3EBE0)"
      />
      {/* نقش نباتي متكرر داخل الطرف */}
      <g fill="none" stroke={`url(#${g})`} strokeWidth="0.7" opacity="0.78">
        <path d="M4 20 C10 8 22 8 28 20 C22 32 10 32 4 20Z" />
        <path d="M12 20 C16 13 22 13 26 20 C22 27 16 27 12 20Z" opacity="0.7" />
        <path d="M30 20 C36 10 46 10 52 20 C46 30 36 30 30 20Z" />
        <path d="M28 11 C34 7 40 9 42 13" />
        <path d="M28 29 C34 33 40 31 42 27" />
      </g>
      {/* وردة دائرية واضحة */}
      <g>
        <circle
          cx="64"
          cy="20"
          r="9"
          fill="color-mix(in srgb, var(--color-mushaf-paper, #F7F0E4) 60%, #fff)"
          stroke={`url(#${g})`}
          strokeWidth="0.9"
        />
        <circle cx="64" cy="20" r="5.2" fill="none" stroke={`url(#${g})`} strokeWidth="0.55" opacity="0.7" />
        <circle cx="64" cy="20" r="2.2" fill={`url(#${g})`} opacity="0.5" />
        <path
          d="M64 12.2 Q67.2 16.2 64 20 Q60.8 16.2 64 12.2Z M64 27.8 Q67.2 23.8 64 20 Q60.8 23.8 64 27.8Z M56.2 20 Q60.2 23.2 64 20 Q60.2 16.8 56.2 20Z M71.8 20 Q67.8 23.2 64 20 Q67.8 16.8 71.8 20Z"
          fill={`url(#${g})`}
          opacity="0.38"
        />
      </g>
    </svg>
  );
}

/** شارة سورة: إطار رفيع موحّد، طرفان مزخرفان بالداخل، وسط فاتح يمتد */
export function MushafSurahBadgeFrame({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const stroke = `${uid}-stroke`;
  return (
    <div className={className ? `mf2-surah-badge ${className}` : "mf2-surah-badge"} aria-hidden="true">
      {/* إطار خارجي رفيع يوحّد الطرفين والوسط */}
      <svg className="mf2-surah-badge__outline" viewBox="0 0 100 40" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id={stroke} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
            <stop offset="50%" stopColor="var(--color-mushaf-gold, #8B6914)" />
            <stop offset="100%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          </linearGradient>
        </defs>
        <rect
          x="0.4"
          y="0.4"
          width="99.2"
          height="39.2"
          rx="3"
          fill="var(--color-mushaf-badge-bg, #F3EBE0)"
          stroke={`url(#${stroke})`}
          strokeWidth="0.7"
        />
      </svg>
      <div className="mf2-surah-badge__row">
        <BadgeEnd uid={uid} />
        <svg className="mf2-surah-badge__mid" viewBox="0 0 200 40" preserveAspectRatio="none" focusable="false">
          <rect
            x="0"
            y="4"
            width="200"
            height="32"
            fill="color-mix(in srgb, var(--color-mushaf-paper, #F7F0E4) 72%, #fff)"
          />
          <line
            x1="0"
            y1="5"
            x2="200"
            y2="5"
            stroke="var(--color-mushaf-gold-soft, #C9B07A)"
            strokeWidth="0.45"
            opacity="0.55"
          />
          <line
            x1="0"
            y1="35"
            x2="200"
            y2="35"
            stroke="var(--color-mushaf-gold-soft, #C9B07A)"
            strokeWidth="0.45"
            opacity="0.55"
          />
        </svg>
        <BadgeEnd mirror uid={uid} />
      </div>
    </div>
  );
}

/** خرطوش رقم الصفحة — بيضوي مستدير مع حلية طرفية */
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
        x="30"
        y="6"
        width="108"
        height="32"
        rx="14"
        fill="var(--color-mushaf-badge-bg, #F3EBE0)"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="0.85"
      />
      <rect
        x="34"
        y="10"
        width="100"
        height="24"
        rx="11"
        fill="none"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="0.45"
        opacity="0.4"
      />
      <g fill="none" stroke={`url(#${uid}-pg)`} strokeWidth="0.9">
        <circle cx="18" cy="22" r="4.2" />
        <circle cx="18" cy="22" r="1.8" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.5" />
        <path d="M23 22 C28 15 34 17 38 22 C34 27 28 29 23 22Z" />
        <circle cx="150" cy="22" r="4.2" />
        <circle cx="150" cy="22" r="1.8" fill={`url(#${uid}-pg)`} stroke="none" opacity="0.5" />
        <path d="M145 22 C140 15 134 17 130 22 C134 27 140 29 145 22Z" />
      </g>
    </svg>
  );
}
