type Props = {
  nameArabic: string;
};

/**
 * شارة سورة موحّدة — شريط أرابيسك واحد (إطار مزدوج + زهرتان دائريتان + لوحة وسطى فاتحة).
 * الاسم من النص العربي دون بادئة «سورة». الأصل SVG منصّي (لا QCF_BSML — انظر LICENSE_RISKS).
 */
export function MushafSurahOrnament({ nameArabic }: Props) {
  const name = nameArabic.replace(/^سُورَةُ\s*/u, "").replace(/^سورة\s*/u, "").trim();
  const label = `سورة ${name}`;
  return (
    <div
      className="mm-surah-ornament"
      role="img"
      aria-label={label}
      data-testid="mushaf-surah-ornament"
      data-ornament="islamic-light"
    >
      <svg className="mm-surah-ornament__svg mm-surah-ornament__motif" viewBox="0 0 640 72" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="mm-arabesque-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8d7a8" />
            <stop offset="45%" stopColor="#dcc48a" />
            <stop offset="100%" stopColor="#c9a85e" />
          </linearGradient>
        </defs>
        {/* إطار خارجي مزدوج بعرض الكتلة */}
        <rect x="1.5" y="2" width="637" height="68" rx="6" fill="url(#mm-arabesque-fill)" stroke="#8d6b2f" strokeWidth="2.4" />
        <rect x="7" y="7.5" width="626" height="57" rx="4" fill="none" stroke="#b0893a" strokeWidth="1.35" />
        {/* زخرفة هندسية جانبية */}
        <path
          d="M78 36h52M78 28h52M78 44h52"
          stroke="#8d6b2f"
          strokeWidth="0.9"
          opacity="0.45"
        />
        <path
          d="M510 36h52M510 28h52M510 44h52"
          stroke="#8d6b2f"
          strokeWidth="0.9"
          opacity="0.45"
        />
        <path d="M92 22h24v28H92z" fill="none" stroke="#9a7d3c" strokeWidth="0.8" opacity="0.55" />
        <path d="M524 22h24v28h-24z" fill="none" stroke="#9a7d3c" strokeWidth="0.8" opacity="0.55" />
        {/* زهرتان دائريتان على الطرفين */}
        <g transform="translate(40 36)">
          <circle r="16.5" fill="#f3e6c4" stroke="#8d6b2f" strokeWidth="1.6" />
          <circle r="11" fill="none" stroke="#b0893a" strokeWidth="1.1" />
          <circle r="3.2" fill="#8d6b2f" />
          <g fill="#c4a36a" opacity="0.95">
            <ellipse rx="3.4" ry="6.2" transform="rotate(0)" />
            <ellipse rx="3.4" ry="6.2" transform="rotate(45)" />
            <ellipse rx="3.4" ry="6.2" transform="rotate(90)" />
            <ellipse rx="3.4" ry="6.2" transform="rotate(135)" />
          </g>
        </g>
        <g transform="translate(600 36)">
          <circle r="16.5" fill="#f3e6c4" stroke="#8d6b2f" strokeWidth="1.6" />
          <circle r="11" fill="none" stroke="#b0893a" strokeWidth="1.1" />
          <circle r="3.2" fill="#8d6b2f" />
          <g fill="#c4a36a" opacity="0.95">
            <ellipse rx="3.4" ry="6.2" transform="rotate(0)" />
            <ellipse rx="3.4" ry="6.2" transform="rotate(45)" />
            <ellipse rx="3.4" ry="6.2" transform="rotate(90)" />
            <ellipse rx="3.4" ry="6.2" transform="rotate(135)" />
          </g>
        </g>
        {/* لوحة وسطى فاتحة — جزء من الشريط لا حقل أبيض منفصل */}
        <rect x="132" y="16" width="376" height="40" rx="5" fill="#f3e6c4" stroke="#8d6b2f" strokeWidth="1.3" />
        <rect x="138" y="21" width="364" height="30" rx="3" fill="none" stroke="#c4a36a" strokeWidth="0.8" />
      </svg>
      <span className="mm-surah-ornament__name">{name}</span>
    </div>
  );
}
