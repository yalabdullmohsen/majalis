import { Link } from "wouter";
import { FEATURED } from "@/lib/home-feature-catalog";
import "@/styles/components/surface-polish.css";

/** استكشاف الرئيسية: ٦ أبواب فقط — بقية الأقسام عبر /more. */
export function HomeExplorePlatform() {
  return (
    <section aria-labelledby="features-heading" className="hp-explore">
      <div className="hp-explore__head">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <polygon points="11,1 13.5,8 21,8 15,13 17.5,20 11,16 4.5,20 7,13 1,8 8.5,8" fill="none" stroke="#12362A" strokeWidth="1.2"/>
          <circle cx="11" cy="11" r="3.5" fill="none" stroke="#12362A" strokeWidth="0.8"/>
        </svg>
        <h2 id="features-heading" className="hp-explore__title">
          استكشف الأقسام
        </h2>
      </div>

      <p className="hp-explore__lead" style={{ color: "#524e4a", marginBottom: "1rem", lineHeight: 1.7 }}>
        ستة أبواب واضحة — القرآن الكريم، الدروس، الصلاة، الفقه، الأذكار، والمزيد.
      </p>

      <div className="hp-explore__featured" aria-label="أهم الأقسام">
        {FEATURED.map(({ href, Icon, title, desc, cta }) => (
          <Link key={href} href={href} aria-label={title} className="hp-featured-card">
            <svg aria-hidden="true" className="hp-featured-card__deco" width="80" height="80" viewBox="0 0 80 80">
              <polygon points="40,5 55,25 75,20 65,40 75,60 55,55 40,75 25,55 5,60 15,40 5,20 25,25" fill="none" stroke="white" strokeWidth="1"/>
              <circle cx="40" cy="40" r="15" fill="none" stroke="white" strokeWidth="0.6"/>
            </svg>
            <Icon size={22} strokeWidth={1.5} className="hp-featured-card__icon" />
            <strong className="hp-featured-card__title">{title}</strong>
            <p className="hp-featured-card__desc">{desc}</p>
            <span className="hp-featured-card__cta">{cta} ←</span>
          </Link>
        ))}
      </div>

      <div className="hp-explore__footer">
        <Link href="/more" className="hp-explore__sitemap">
          المزيد من العلوم ←
        </Link>
      </div>
    </section>
  );
}
