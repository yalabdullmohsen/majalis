/** زخارف SVG مشتركة — بدون صور خارجية */

/** زوايا زخرفية ذهبية للتصميم الكلاسيكي */
export function CornerOrnaments({ color = "#d4af37" }: { color?: string }) {
  const corner = (transform: string) => (
    <g transform={transform} stroke={color} fill="none" strokeWidth="1.5">
      <path d="M0 28 L0 0 L28 0" />
      <path d="M6 22 L6 6 L22 6" strokeWidth="0.75" opacity="0.7" />
    </g>
  );
  return (
    <>
      {corner("translate(12,12)")}
      {corner("translate(588,12) scale(-1,1)")}
      {corner("translate(12,888) scale(1,-1)")}
      {corner("translate(588,888) scale(-1,-1)")}
    </>
  );
}

/** فاصل هلال */
export function CrescentDivider({ color = "#d4af37" }: { color?: string }) {
  return (
    <svg viewBox="0 0 120 24" className="mx-auto block" width="120" height="24" aria-hidden="true">
      <path
        d="M60 4c-8 0-14 6-14 8s6 8 14 8 14-6 14-8-6-8-14-8zm0 2.5c5.8 0 10.5 4.2 10.5 5.5S65.8 17.5 60 17.5 49.5 13.3 49.5 12 54.2 6.5 60 6.5z"
        fill={color}
        opacity="0.85"
      />
      <line x1="10" y1="12" x2="44" y2="12" stroke={color} strokeWidth="0.75" opacity="0.5" />
      <line x1="76" y1="12" x2="110" y2="12" stroke={color} strokeWidth="0.75" opacity="0.5" />
    </svg>
  );
}

/** نقوش هندسية إسلامية شفافة */
export function IslamicWatermark() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" aria-hidden="true">
      <defs>
        <pattern id="islamic-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M24 0 L48 24 L24 48 L0 24 Z" fill="none" stroke="#6b21a8" strokeWidth="1" />
          <circle cx="24" cy="24" r="6" fill="none" stroke="#6b21a8" strokeWidth="0.75" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-grid)" />
    </svg>
  );
}

/** نجمة ثمانية للفاصل الدمشقي */
export function EightPointStar({ color = "#d4af37" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
      />
      <circle cx="12" cy="12" r="2.5" fill={color} opacity="0.6" />
    </svg>
  );
}

/** إطار من نقاط دائرية ذهبية */
export function DottedGoldBorder() {
  return (
    <svg className="pointer-events-none absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)]" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="calc(100% - 8px)"
        height="calc(100% - 8px)"
        rx="4"
        fill="none"
        stroke="#d4af37"
        strokeWidth="2"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
    </svg>
  );
}
