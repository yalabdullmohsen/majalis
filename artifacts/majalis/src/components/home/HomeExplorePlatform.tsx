import { Link } from "wouter";
import { FEATURED, FEATURE_CATS } from "@/lib/home-feature-catalog";
import { isComingSoonPath } from "@/lib/nav-visibility";
import "@/styles/components/surface-polish.css";

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

      <p className="hp-explore__lead" style={{ color: '#524e4a', marginBottom: '1rem', lineHeight: 1.7 }}>
        الأقسام الأساسية للمنصة — قرآن، حديث، فقه، حفظ، مناسبات، دليل، صلاة، وحسابك.
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

      {/* أقسام بالتصنيف — معاينة مختصرة (٤ عناصر) + رابط لعرض الكل */}
      {FEATURE_CATS.map(cat => {
        const PREVIEW_COUNT = 4;
        const preview = cat.items.slice(0, PREVIEW_COUNT);
        const remaining = cat.items.length - preview.length;
        return (
          <div key={cat.id} className="hp-explore-cat">
            <div className="hp-explore-cat__head">
              <svg aria-hidden="true" width="28" height="28" viewBox="0 0 28 28" className="hp-explore-cat__ornament">
                <polygon points="14,2 20,9 27,9 22,16 25,24 14,20 3,24 6,16 1,9 8,9" fill="var(--mj-brand-deep)"/>
                <polygon points="14,6 18,11 23,11 19,15.5 21,21 14,18 7,21 9,15.5 5,11 10,11" fill="var(--mj-brand-deep)" opacity="0.6"/>
                <circle cx="14" cy="14" r="3" fill="#FAFAF8"/>
              </svg>
              <h3 className="hp-explore-cat__title">{cat.label}</h3>
              <span className="hp-explore-cat__count">{cat.items.length} قسم</span>
            </div>
            <div className="hp-explore-cat__grid">
              {preview.map(({ href, Icon: ItemIcon, title, desc }) => {
                const soon = isComingSoonPath(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`hp-explore-item${soon ? " hp-explore-item--soon" : ""}`}
                    aria-label={soon ? `${title} — قريبًا` : undefined}
                  >
                    <span className="hp-explore-item__icon">
                      <ItemIcon size={14} strokeWidth={2} />
                    </span>
                    <div className="hp-explore-item__body">
                      <strong className="hp-explore-item__title">
                        {title}
                        {soon ? <span className="nav-soon-badge">قريبًا</span> : null}
                      </strong>
                      <span className="hp-explore-item__desc">{desc}</span>
                    </div>
                  </Link>
                );
              })}
              {remaining > 0 && (
                <Link href="/sitemap" className="hp-explore-more">
                  +{remaining} أقسام أخرى ←
                </Link>
              )}
            </div>
          </div>
        );
      })}

      <div className="hp-explore__footer">
        <Link href="/sitemap" className="hp-explore__sitemap">
          تصفّح كل أقسام المنصة ←
        </Link>
      </div>
    </section>
  );
}
