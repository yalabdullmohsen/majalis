import { Link } from "wouter";

// ─── SectionHeader ─────────────────────────────────────────────────────────────
// رأس قسم موحّد يستخدم نمط ds-section__head + الخط الزمردي الزخرفي
export function SectionHeader({
  title,
  href,
  linkLabel = "عرض الكل",
  id,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="ds-section__head">
      <h2 className="ds-section__title" id={id}>{title}</h2>
      {href && <Link href={href} className="ds-section__link">{linkLabel}</Link>}
    </div>
  );
}

// ─── QuranQuoteBox ────────────────────────────────────────────────────────────
// عرض آية قرآنية بشكل موحّد — نسختان: على خلفية خضراء أو بيضاء
export function QuranQuoteBox({
  text,
  surah,
  ayah,
  onGreen = false,
}: {
  text: string;
  surah?: string;
  ayah?: string | number;
  onGreen?: boolean;
}) {
  return (
    <blockquote
      className={`msk-quran-box${onGreen ? " msk-quran-box--on-green" : ""}`}
      dir="rtl"
    >
      <p className="msk-quran-box__text">﴿{text}﴾</p>
      {(surah || ayah) && (
        <cite className="msk-quran-box__ref">
          {surah}{ayah ? ` [${ayah}]` : ""}
        </cite>
      )}
    </blockquote>
  );
}

// ─── HadithQuoteBox ───────────────────────────────────────────────────────────
// عرض حديث نبوي بشكل موحّد مع راوي ودرجة
const GRADE_SLUG: Record<string, string> = {
  "صحيح": "sahih",
  "حسن":  "hasan",
  "ضعيف": "daif",
  "موضوع":"mawdu",
};

export function HadithQuoteBox({
  text,
  narrator,
  source,
  grade,
}: {
  text: string;
  narrator?: string;
  source?: string;
  grade?: string;
}) {
  const gradeSlug = grade ? (GRADE_SLUG[grade] ?? "unknown") : undefined;
  return (
    <blockquote className="msk-hadith-box" dir="rtl">
      <p className="msk-hadith-box__text">{text}</p>
      {(narrator || source || grade) && (
        <footer className="msk-hadith-box__footer">
          {narrator && <span className="msk-hadith-box__narrator">رواه {narrator}</span>}
          {source && <span className="msk-hadith-box__source">{source}</span>}
          {grade && (
            <span className={`msk-hadith-box__grade msk-hadith-grade--${gradeSlug}`}>
              {grade}
            </span>
          )}
        </footer>
      )}
    </blockquote>
  );
}

// ─── FeaturedCard ─────────────────────────────────────────────────────────────
// بطاقة محتوى مميزة موحّدة للاستخدام عبر الصفحات
export function FeaturedCard({
  title,
  description,
  badge,
  href,
  icon,
  accentColor,
}: {
  title: string;
  description?: string;
  badge?: string;
  href: string;
  icon?: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <Link href={href} className="msk-featured-card ds-card">
      {accentColor && (
        <span
          className="msk-featured-card__accent"
          style={{ "--msk-accent": accentColor } as React.CSSProperties}
          aria-hidden="true"
        />
      )}
      {icon && <div className="msk-featured-card__icon" aria-hidden="true">{icon}</div>}
      {badge && <span className="msk-featured-card__badge">{badge}</span>}
      <h3 className="msk-featured-card__title">{title}</h3>
      {description && <p className="msk-featured-card__desc">{description}</p>}
    </Link>
  );
}

// ─── NumberedListCard ─────────────────────────────────────────────────────────
// بطاقة قائمة مُرقَّمة (أركان، شروط، أنواع…)
export function NumberedListCard({
  title,
  items,
  accentColor = "var(--msk-gold, #1F4D3A)",
}: {
  title: string;
  items: { num: number; label: string; desc?: string }[];
  accentColor?: string;
}) {
  return (
    <div className="msk-numbered-card ds-card">
      <h3 className="msk-numbered-card__title">{title}</h3>
      <ol className="msk-numbered-card__list">
        {items.map((item) => (
          <li key={item.num} className="msk-numbered-card__item">
            <span
              className="msk-numbered-card__num"
              style={{ "--msk-accent": accentColor } as React.CSSProperties}
              aria-hidden="true"
            >
              {item.num}
            </span>
            <div className="msk-numbered-card__body">
              <strong className="msk-numbered-card__label">{item.label}</strong>
              {item.desc && <p className="msk-numbered-card__desc">{item.desc}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
