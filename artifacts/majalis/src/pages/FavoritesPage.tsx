import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { getUserFavorites } from "@/lib/favorites";
import { useAuth } from "@/components/AuthProvider";
import { LoginPrompt } from "@/components/platform/FavoriteButton";

const TYPE_LABELS: Record<string, string> = {
  lesson: "درس",
  book: "كتاب",
  sheikh: "شيخ",
  series: "سلسلة",
  mosque: "مسجد",
  scholar: "شيخ",
};

const TYPE_HREF: Record<string, string> = {
  lesson: "/lessons",
  book: "/books",
  sheikh: "/sheikhs",
  scholar: "/sheikhs",
  series: "/series",
  mosque: "/mosques",
};

export default function FavoritesPage() {
  const { isLoggedIn } = useAuth() as any;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    getUserFavorites().then(setItems).finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="page-shell">
        <PageHeader title="المفضلة" subtitle="محفوظاتك من الدروس والكتب والمشايخ." />
        <LoginPrompt />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader title="المفضلة" subtitle="دروسك وكتبك ومشايخك المحفوظة." />
      {loading && <Loading />}
      {!loading && items.length === 0 && <Empty text="لا توجد عناصر محفوظة بعد." />}
      <div className="favorites-list">
        {items.map((item) => (
          <article key={item.id} className="ui-card favorite-row">
            <span className="home-tag">{TYPE_LABELS[item.item_type] || item.item_type}</span>
            <p>{item.item_id}</p>
            <Link href={`${TYPE_HREF[item.item_type] || "/"}/${item.item_id}`} className="ui-card-btn ui-card-btn--ghost">
              فتح
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
