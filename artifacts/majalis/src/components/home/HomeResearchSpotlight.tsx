import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Icon } from "@/lib/icons";

type Paper = {
  id: string;
  slug: string;
  title: string;
  author_name?: string;
  degree_type?: string;
};

export function HomeResearchSpotlight() {
  const [papers, setPapers] = useState<Paper[]>([]);

  useEffect(() => {
    fetch("/api/scientific-research?action=list&limit=4")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.papers)) setPapers(d.papers.slice(0, 4));
      })
      .catch(() => setPapers([]));
  }, []);

  if (papers.length === 0) return null;

  return (
    <section className="home-section ds-section" aria-labelledby="home-research-heading">
      <div className="ds-section__head">
        <div>
          <p className="home-eyebrow">بحث علمي</p>
          <h2 id="home-research-heading" className="ds-section__title">الأبحاث العلمية</h2>
        </div>
        <Link href="/research" className="ds-section__link">عرض الكل</Link>
      </div>
      <div className="home-research-grid">
        {papers.map((p) => (
          <Link key={p.id} href={`/research/${p.slug}`} className="home-research-card ui-card">
            <Icon name="book" size={18} className="home-research-card__icon" />
            <h3>{p.title}</h3>
            {p.author_name && <p>{p.author_name}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeResearchSpotlight;
