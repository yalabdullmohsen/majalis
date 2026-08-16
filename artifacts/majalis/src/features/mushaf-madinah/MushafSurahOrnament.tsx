type Props = {
  nameArabic: string;
};

/**
 * شارة سورة SVG واحدة قابلة للتحجيم — إطار مزدوج + جناحان + لوحة اسم.
 * تحجز خانة شبكة كاملة؛ العرض ١٫٥٪→٩٨٫٤٪ عبر CSS الأب.
 */
export function MushafSurahOrnament({ nameArabic }: Props) {
  const label = nameArabic.startsWith("سورة") ? nameArabic : `سُورَةُ ${nameArabic}`;
  return (
    <div
      className="mm-surah-ornament"
      role="img"
      aria-label={label}
      data-testid="mushaf-surah-ornament"
      data-ornament="islamic-light"
    >
      <svg className="mm-surah-ornament__svg mm-surah-ornament__motif" viewBox="0 0 640 72" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* إطار خارجي */}
        <rect x="2" y="2" width="636" height="68" rx="10" fill="url(#mm-banner-fill)" stroke="var(--mm-gold-deep, #9a7d3c)" strokeWidth="2.2" />
        {/* إطار داخلي */}
        <rect x="8" y="8" width="624" height="56" rx="7" fill="none" stroke="var(--mm-gold, #bf9f5b)" strokeWidth="1.1" opacity="0.9" />
        {/* جناح يمين */}
        <rect x="14" y="14" width="108" height="44" rx="6" fill="color-mix(in srgb, var(--mm-paper-deep, #f5f0e4) 70%, var(--mm-gold-soft, #d4b870))" opacity="0.95" />
        <circle cx="68" cy="36" r="12" fill="none" stroke="var(--mm-gold-deep, #9a7d3c)" strokeWidth="1.3" />
        <path d="M68 22l3.2 9.2H81l-7.4 5.4 2.8 9.2L68 40.4 59.6 45.8l2.8-9.2L55 31.2h9.8Z" fill="var(--mm-gold-deep, #9a7d3c)" opacity="0.75" />
        {/* جناح يسار */}
        <rect x="518" y="14" width="108" height="44" rx="6" fill="color-mix(in srgb, var(--mm-paper-deep, #f5f0e4) 70%, var(--mm-gold-soft, #d4b870))" opacity="0.95" />
        <circle cx="572" cy="36" r="12" fill="none" stroke="var(--mm-gold-deep, #9a7d3c)" strokeWidth="1.3" />
        <path d="M572 22l3.2 9.2H585l-7.4 5.4 2.8 9.2L572 40.4 563.6 45.8l2.8-9.2L559 31.2h9.8Z" fill="var(--mm-gold-deep, #9a7d3c)" opacity="0.75" />
        {/* لوحة الاسم */}
        <rect x="148" y="16" width="344" height="40" rx="8" fill="var(--mm-banner-name-bg, #fffdf8)" stroke="var(--mm-gold-deep, #9a7d3c)" strokeWidth="1.4" />
        <defs>
          <linearGradient id="mm-banner-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#efe2b8" />
            <stop offset="50%" stopColor="#e0cb92" />
            <stop offset="100%" stopColor="#d4b870" />
          </linearGradient>
        </defs>
      </svg>
      <span className="mm-surah-ornament__name">{label}</span>
    </div>
  );
}
