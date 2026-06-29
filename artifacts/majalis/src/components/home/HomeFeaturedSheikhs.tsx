import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getSheikhs } from "@/lib/supabase";
import { Icon } from "@/lib/icons";
import { OptimizedSheikhImage } from "@/components/sheikh/OptimizedSheikhImage";

export function HomeFeaturedSheikhs() {
  const [sheikhs, setSheikhs] = useState<{ id: string; name: string; photo_url?: string | null }[]>([]);

  useEffect(() => {
    void getSheikhs()
      .then((list) => setSheikhs((list || []).slice(0, 8)))
      .catch(() => setSheikhs([]));
  }, []);

  if (sheikhs.length === 0) return null;

  return (
    <section className="home-section ds-section" aria-labelledby="home-sheikhs-heading">
      <div className="ds-section__head">
        <div>
          <p className="home-eyebrow">علماء المنصة</p>
          <h2 id="home-sheikhs-heading" className="ds-section__title">المشايخ</h2>
        </div>
        <Link href="/sheikhs" className="ds-section__link">عرض الكل</Link>
      </div>
      <div className="home-sheikhs-grid">
        {sheikhs.map((s) => (
          <Link key={s.id} href={`/sheikhs/${s.id}`} className="home-sheikh-card ui-card">
            <OptimizedSheikhImage src={s.photo_url || undefined} name={s.name} size={56} />
            <span className="home-sheikh-card__name">{s.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeFeaturedSheikhs;
