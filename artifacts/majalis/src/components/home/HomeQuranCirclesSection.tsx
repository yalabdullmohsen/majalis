import { Link } from "wouter";
import { getQuranCircles } from "@/lib/quran-circles";

export function HomeQuranCirclesSection() {
  const preview = getQuranCircles().slice(0, 3);

  return (
    <section className="home-v4-strip home-v4-strip--halaqa" aria-labelledby="home-halaqa-heading">
      <div className="home-container">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">القرآن الكريم</p>
            <h2 id="home-halaqa-heading">حلقات القرآن</h2>
            <p>حفظ ومراجعة وتجويد — مع بحث وفلترة.</p>
          </div>
          <Link href="/quran-circles" className="home-section-link">كل الحلقات</Link>
        </div>
        <div className="home-v4-strip__rows">
          {preview.map((c) => (
            <Link key={c.id} href={`/quran-circles/${c.id}`} className="home-v4-strip__row">
              <div>
                <strong>{c.name}</strong>
                <span>{c.sheikh_name} · {c.city} · {c.days}</span>
              </div>
              <span className="page-tag">{c.categories[0]}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
