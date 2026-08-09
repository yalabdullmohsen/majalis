/**
 * زخارف مصحف أصلية (SVG) — نقش نباتي + وردة دائرية.
 * مصدر التصميم: رسم أصلي للمجلس العلمي (لا يُستخرج من تطبيق آخر).
 * انظر CREDITS.md.
 */
import { useId } from "react";

/** طرف زخرفي ثابت العرض — وردة + أوراق */
function OrnamentEnd({
  mirror,
  gradId,
}: {
  mirror?: boolean;
  gradId: string;
}) {
  return (
    <svg
      className="mf2-surah-badge__end"
      viewBox="0 0 56 52"
      width="56"
      height="52"
      aria-hidden="true"
      focusable="false"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-mushaf-gold-soft, #C9B07A)" />
          <stop offset="100%" stopColor="var(--color-mushaf-gold, #8B6914)" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gradId})`} strokeWidth="1.05">
        <path d="M8 26 C14 12 28 14 36 26 C28 38 14 40 8 26Z" />
        <path d="M8 26 C12 18 20 19 26 26 C20 33 12 34 8 26Z" opacity="0.75" />
        <circle cx="40" cy="26" r="5.4" />
        <circle cx="40" cy="26" r="2.3" fill={`url(#${gradId})`} stroke="none" opacity="0.55" />
        <path
          d="M40 20.6 Q42 23.5 40 26 Q38 23.5 40 20.6Z M40 31.4 Q42 28.5 40 26 Q38 28.5 40 31.4Z M34.6 26 Q37.5 28 40 26 Q37.5 24 34.6 26Z M45.4 26 Q42.5 28 40 26 Q42.5 24 45.4 26Z"
          fill={`url(#${gradId})`}
          stroke="none"
          opacity="0.35"
        />
        <path
          d="M30 18 C34 14 38 15 40 18 C36 19 32 20 30 18Z"
          fill={`url(#${gradId})`}
          stroke="none"
          opacity="0.45"
        />
        <path
          d="M30 34 C34 38 38 37 40 34 C36 33 32 32 30 34Z"
          fill={`url(#${gradId})`}
          stroke="none"
          opacity="0.45"
        />
      </g>
    </svg>
  );
}

/** شارة سورة عريضة: الطرفان يثبتان والوسط يمتد */
export function MushafSurahBadgeFrame({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <div className={className ? `mf2-surah-badge ${className}` : "mf2-surah-badge"} aria-hidden="true">
      <OrnamentEnd gradId={`${uid}-g1`} />
      <svg
        className="mf2-surah-badge__mid"
        viewBox="0 0 200 52"
        preserveAspectRatio="none"
        focusable="false"
      >
        <rect
          x="1"
          y="5"
          width="198"
          height="42"
          rx="4"
          fill="none"
          stroke="var(--color-mushaf-gold, #8B6914)"
          strokeWidth="1.35"
        />
        <rect
          x="5"
          y="11"
          width="190"
          height="30"
          rx="2.5"
          fill="var(--color-mushaf-badge-bg, #F3EBE0)"
          stroke="var(--color-mushaf-gold-soft, #C9B07A)"
          strokeWidth="0.7"
        />
        <rect
          x="8"
          y="14.5"
          width="184"
          height="23"
          rx="1.5"
          fill="none"
          stroke="var(--color-mushaf-gold-soft, #C9B07A)"
          strokeWidth="0.45"
          opacity="0.45"
        />
      </svg>
      <OrnamentEnd mirror gradId={`${uid}-g2`} />
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
        strokeWidth="1.25"
      />
      <rect
        x="34"
        y="10"
        width="100"
        height="24"
        rx="11"
        fill="none"
        stroke={`url(#${uid}-pg)`}
        strokeWidth="0.55"
        opacity="0.45"
      />
      <g fill="none" stroke={`url(#${uid}-pg)`} strokeWidth="1">
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
