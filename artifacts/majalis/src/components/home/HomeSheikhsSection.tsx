import { useEffect, useState } from "react";
import { Link } from "wouter";
import { UserRound } from "lucide-react";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { IslamicHeadingOrnament } from "@/components/islamic/IslamicOrnament";
import { getSheikhs } from "@/lib/supabase";
import { displayText } from "@/lib/display-text";

type SheikhRow = {
  id: string;
  name: string;
  city?: string | null;
  bio?: string | null;
};

export function HomeSheikhsSection() {
  const [sheikhs, setSheikhs] = useState<SheikhRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSheikhs()
      .then(({ data }) => setSheikhs(((data as SheikhRow[]) || []).slice(0, 8)))
      .catch(() => setSheikhs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="home-sheikhs-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">أهل العلم</p>
          <h2 id="home-sheikhs-heading">العلماء والمشايخ</h2>
          <IslamicHeadingOrnament />
        </div>
        <Link href="/sheikhs" className="home-section-link">
          جميع المشايخ
        </Link>
      </div>
      <PageLoadingGuard loading={loading} empty={!loading && sheikhs.length === 0} emptyText="لا بيانات حالياً">
        <div className="home-sheikh-grid">
          {sheikhs.map((sheikh) => (
            <Link key={sheikh.id} href={`/sheikhs/${sheikh.id}`} className="home-mini-card ui-card--ornate">
              <UserRound size={18} strokeWidth={1.75} aria-hidden="true" color="var(--ds-emerald)" />
              <h3>{displayText(sheikh.name)}</h3>
              <p>{sheikh.city || sheikh.bio?.slice(0, 60) || "ملف الشيخ"}</p>
            </Link>
          ))}
        </div>
      </PageLoadingGuard>
    </section>
  );
}

export default HomeSheikhsSection;
