import { Link } from "wouter";
import { DEMO_SHEIKHS } from "@/lib/demo-content";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";

export function HomeSheikhs() {
  const sheikhs = DEMO_SHEIKHS.slice(0, 4);

  return (
    <section className="home-section" aria-labelledby="home-sheikhs-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">العلماء</p>
          <h2 id="home-sheikhs-heading">المشايخ</h2>
        </div>
        <Link href="/sheikhs" className="home-section-link">عرض الكل</Link>
      </div>
      <div className="home-sheikhs-grid">
        {sheikhs.map((s) => (
          <Link key={s.id} href={`/sheikhs/${s.id}`} className="ui-card home-sheikh-card">
            <SheikhAvatar name={s.name} size={56} />
            <div>
              <h3>{s.name}</h3>
              <p>{(s.specialties || []).slice(0, 2).join(" · ")}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
