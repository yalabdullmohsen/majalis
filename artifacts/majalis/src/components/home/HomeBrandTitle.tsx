/**
 * عنوان هوية الرئيسية — «المجلس العلمي» بخط زخرفي (رقعة/ثلث بصري)
 * داخل إطار زمردي/ذهبي بهوية المجلس، بعرض نحو ثلث الشريط.
 */
const GOLD = "var(--color-mushaf-gold-soft, #C9B07A)";
const EMERALD = "var(--mj-brand-deep, #123F2E)";

function SideFlourish({ mirror }: { mirror?: boolean }) {
  return (
    <svg
      className="home-brand-title__flourish"
      viewBox="0 0 48 48"
      width="48"
      height="48"
      aria-hidden="true"
      focusable="false"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <circle cx="24" cy="24" r="15.5" fill="none" stroke={GOLD} strokeWidth="1.1" opacity="0.85" />
      <circle cx="24" cy="24" r="10" fill="color-mix(in srgb, var(--mj-brand, #1F7A5A) 14%, transparent)" stroke={EMERALD} strokeWidth="1.15" />
      <circle cx="24" cy="24" r="3.2" fill={EMERALD} />
      <circle cx="24" cy="24" r="1.2" fill={GOLD} />
      <path
        d="M8 24 Q16 10 24 24 Q16 38 8 24"
        fill="none"
        stroke={GOLD}
        strokeWidth="0.9"
        opacity="0.7"
      />
    </svg>
  );
}

export function HomeBrandTitle({ label = "المجلس العلمي" }: { label?: string }) {
  return (
    <span className="home-brand-title" data-majlis-brand="1">
      <SideFlourish />
      <span className="home-brand-title__panel">
        <span className="home-brand-title__text" lang="ar" dir="rtl">
          {label}
        </span>
      </span>
      <SideFlourish mirror />
    </span>
  );
}

export default HomeBrandTitle;
