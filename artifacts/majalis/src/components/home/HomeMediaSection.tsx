import { Link } from "wouter";

const MEDIA_ITEMS = [
  {
    title: "إذاعات القرآن",
    href: "/quran-radio",
    meta: "استماع",
    summary: "إذاعات الكويت والسعودية ومحطات قرآنية متعددة.",
  },
  {
    title: "البث المباشر",
    href: "/quran-live",
    meta: "بث",
    summary: "قنوات القرآن الكريم والحرمين الشريفين.",
  },
  {
    title: "الورد اليومي",
    href: "/daily-wird",
    meta: "متابعة",
    summary: "خطة قراءة يومية محفوظة على جهازك.",
  },
];

export function HomeMediaSection() {
  return (
    <section className="home-section" aria-labelledby="home-media-heading">
      <div className="home-section-head">
        <div>
          <p className="home-section-kicker">استماع وبث</p>
          <h2 id="home-media-heading" className="home-section-title">الإذاعات والبث المباشر</h2>
          <p className="home-section-subtitle">استمع للقرآن أو تابع البث دون مغادرة المنصة.</p>
        </div>
      </div>
      <div className="home-content-rail__grid">
        {MEDIA_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="home-content-card">
            <span className="home-content-card__meta">{item.meta}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeMediaSection;
