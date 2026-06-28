import { Link } from "wouter";

export function HomeMiraclesSection() {
  return (
    <section className="home-v4-banner-cta" aria-labelledby="home-miracles-heading">
      <div className="home-container home-v4-banner-cta__inner">
        <div>
          <p className="home-eyebrow">الإعجاز العلمي</p>
          <h2 id="home-miracles-heading">اكتشف الإعجاز في كتاب الله</h2>
          <p>محتوى علمي موثّق يربط الآيات بالاكتشافات المعاصرة بضوابط شرعية.</p>
        </div>
        <Link href="/miracles" className="ds-btn ds-btn--primary">استكشف الإعجاز</Link>
      </div>
    </section>
  );
}
