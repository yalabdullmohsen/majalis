import { FEATURED } from "@/lib/home-feature-catalog";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Link } from "wouter";
import "@/styles/components/surface-polish.css";

/** استكشاف الرئيسية: بطاقتان كبيرتان + ثلاث ميزات — بقية الأقسام عبر /sections. */
export function HomeExplorePlatform() {
  const [heroA, heroB, ...rest] = FEATURED;
  const small = rest.slice(0, 3);

  return (
    <section id="explore" aria-labelledby="features-heading" className="hp-explore">
      <div className="hp-explore__head">
        <h2 id="features-heading" className="hp-explore__title">
          استكشف الأقسام
        </h2>
      </div>

      <p className="hp-explore__lead">
        أبواب واضحة للقرآن والدروس والصلاة — دون ازدحام من أول دخول.
      </p>

      <div className="hp-explore__featured" aria-label="أهم الأقسام">
        {heroA ? (
          <FeatureCard
            href={heroA.href}
            title={heroA.title}
            description={heroA.desc}
            cta={heroA.cta}
            icon={heroA.Icon}
            hero
          />
        ) : null}
        {heroB ? (
          <FeatureCard
            href={heroB.href}
            title={heroB.title}
            description={heroB.desc}
            cta={heroB.cta}
            icon={heroB.Icon}
            hero
          />
        ) : null}
        {small.map(({ href, Icon, title, desc, cta }) => (
          <FeatureCard key={href} href={href} title={title} description={desc} cta={cta} icon={Icon} />
        ))}
      </div>

      <div className="hp-explore__footer">
        <Link href="/sections" className="hp-explore__sitemap">
          جميع الأقسام ←
        </Link>
      </div>
    </section>
  );
}
