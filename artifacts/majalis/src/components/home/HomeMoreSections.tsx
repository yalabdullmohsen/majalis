import { Link } from "wouter";
import { IslamicHeadingOrnament } from "@/components/islamic/IslamicOrnament";
import { HOME_MORE_SECTIONS } from "@/lib/navigation";

export function HomeMoreSections() {
  return (
    <section className="home-section" aria-labelledby="more-sections-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">استكشف المزيد</p>
          <h2 id="more-sections-heading">أقسام إضافية</h2>
          <IslamicHeadingOrnament />
        </div>
      </div>
      <div className="home-more-grid">
        {HOME_MORE_SECTIONS.map((item) => (
          <Link key={item.href} href={item.href} className="home-more-card ui-card ui-card--ornate">
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeMoreSections;
