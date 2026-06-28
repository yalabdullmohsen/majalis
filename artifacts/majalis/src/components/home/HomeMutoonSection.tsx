import { Link } from "wouter";
import { getAllMutoon } from "@/lib/mutoon";

export function HomeMutoonSection() {
  const preview = getAllMutoon().slice(0, 4);

  return (
    <section className="home-v4-mutoon" aria-labelledby="home-mutoon-heading">
      <div className="home-container">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">المتون العلمية</p>
            <h2 id="home-mutoon-heading">موسوعة المتون</h2>
          </div>
          <Link href="/mutoon" className="home-section-link">عرض الكل</Link>
        </div>
        <div className="home-v4-mutoon__cols">
          {preview.map((m) => (
            <Link key={m.id} href={`/mutoon/${m.id}`} className="home-v4-mutoon__col">
              <span className="page-tag">{m.category}</span>
              <h3>{m.name}</h3>
              <p>{m.author}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
