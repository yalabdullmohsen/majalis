import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { getSheikhs } from "@/lib/supabase";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveSheikhImageUrl } from "@/lib/sheikh-image";
import { cleanDisplayText } from "@/lib/display-text";

export function HomeLatestSheikhs() {
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSheikhs()
      .then(({ data }) => setSheikhs((data || []).slice(0, 4)))
      .catch(() => setSheikhs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="latest-sheikhs-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">دليل العلماء</p>
          <h2 id="latest-sheikhs-heading">أحدث المشايخ</h2>
        </div>
        <Link href="/sheikhs" className="home-section-link">كل المشايخ</Link>
      </div>
      {loading ? (
        <Loading />
      ) : sheikhs.length === 0 ? (
        <p className="lessons-empty-state">لا توجد بيانات مشايخ حالياً.</p>
      ) : (
        <div className="home-sheikhs-grid home-sheikhs-grid--v3">
          {sheikhs.map((sheikh) => (
            <Link key={sheikh.id} href={`/sheikhs/${sheikh.id}`} className="home-sheikh-card ui-card">
              <SheikhAvatar src={resolveSheikhImageUrl(sheikh)} name={sheikh.name} size={64} />
              <h3>{cleanDisplayText(sheikh.name)}</h3>
              {sheikh.specialty && <p>{cleanDisplayText(sheikh.specialty)}</p>}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeLatestSheikhs;
