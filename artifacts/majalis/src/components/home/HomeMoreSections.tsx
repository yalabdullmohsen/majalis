import { Link } from "wouter";
import { HOME_MORE_SECTIONS } from "@/lib/navigation";

export function HomeMoreSections() {
  return (
    <section className="home-section home-section--v2026" aria-labelledby="home-more-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">المزيد</p>
          <h2 id="home-more-heading">أقسام إضافية</h2>
          <p>فتاوى، مسارات تعليمية، مسابقات، ومحتوى علمي متنوع.</p>
        </div>
      </div>
      <div className="home-more-grid--v2026">
        {HOME_MORE_SECTIONS.slice(0, 12).map((section) => (
          <Link key={section.href} href={section.href} className="home-more-card--v2026">
            <strong>{section.title}</strong>
            <span>{section.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeMoreSections;
