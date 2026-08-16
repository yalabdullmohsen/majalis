type Props = {
  nameArabic: string;
};

/**
 * شارة سورة SVG — إطار إسلامي مزخرف + اسم السورة في الوسط.
 */
export function MushafSurahOrnament({ nameArabic }: Props) {
  const label = nameArabic.startsWith("سورة") ? nameArabic : `سُورَةُ ${nameArabic}`;
  return (
    <div
      className="mm-surah-ornament"
      role="img"
      aria-label={label}
      data-testid="mushaf-surah-ornament"
      data-ornament="islamic-ayah"
    >
      <svg
        className="mm-surah-ornament__svg mm-surah-ornament__motif"
        viewBox="0 0 640 78"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="mm-banner-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#efe2b8" />
            <stop offset="50%" stopColor="#e0cb92" />
            <stop offset="100%" stopColor="#d4b870" />
          </linearGradient>
          <linearGradient id="mm-banner-wing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5f0e4" />
            <stop offset="100%" stopColor="#d4b870" />
          </linearGradient>
        </defs>
        {/* إطار خارجي مزخرف */}
        <path
          d="M18 10h604c8 0 14 6 14 14v30c0 8-6 14-14 14H18c-8 0-14-6-14-14V24c0-8 6-14 14-14Z"
          fill="url(#mm-banner-fill)"
          stroke="var(--mm-gold-deep, #9a7d3c)"
          strokeWidth="2.2"
        />
        <rect
          x="10"
          y="16"
          width="620"
          height="46"
          rx="8"
          fill="none"
          stroke="var(--mm-gold, #bf9f5b)"
          strokeWidth="1.1"
          opacity="0.95"
        />
        {/* جناح يمين */}
        <rect x="16" y="20" width="112" height="38" rx="7" fill="url(#mm-banner-wing)" opacity="0.95" />
        <circle cx="72" cy="39" r="11" fill="none" stroke="var(--mm-gold-deep, #9a7d3c)" strokeWidth="1.35" />
        <path
          d="M72 26l2.9 8.4H84l-6.8 4.9 2.6 8.4L72 42.8 64.3 47.7l2.6-8.4L60 34.4h9.1Z"
          fill="var(--mm-gold-deep, #9a7d3c)"
          opacity="0.8"
        />
        {/* جناح يسار */}
        <rect x="512" y="20" width="112" height="38" rx="7" fill="url(#mm-banner-wing)" opacity="0.95" />
        <circle cx="568" cy="39" r="11" fill="none" stroke="var(--mm-gold-deep, #9a7d3c)" strokeWidth="1.35" />
        <path
          d="M568 26l2.9 8.4H580l-6.8 4.9 2.6 8.4L568 42.8 560.3 47.7l2.6-8.4L556 34.4h9.1Z"
          fill="var(--mm-gold-deep, #9a7d3c)"
          opacity="0.8"
        />
        {/* لوحة الاسم */}
        <rect
          x="146"
          y="20"
          width="348"
          height="38"
          rx="9"
          fill="var(--mm-banner-name-bg, #fffdf8)"
          stroke="var(--mm-gold-deep, #9a7d3c)"
          strokeWidth="1.45"
        />
        <path
          d="M154 28h332M154 50h332"
          fill="none"
          stroke="var(--mm-gold, #bf9f5b)"
          strokeWidth="0.7"
          opacity="0.55"
        />
      </svg>
      <span className="mm-surah-ornament__name">{label}</span>
    </div>
  );
}
