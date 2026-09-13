import { useEffect, useState } from "react";
import { Link } from "wouter";
import { History } from "lucide-react";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";

/** زرت مؤخراً — عنوان واضح وآخر 3 عناصر فقط بلا تداخل نصي */
export function HomeRecentPagesBar() {
  const [pages, setPages] = useState<RecentPage[]>([]);
  useEffect(() => {
    setPages(getRecentPages(3));
  }, []);
  if (pages.length < 1) return null;
  return (
    <section className="hp-recent-bar" aria-labelledby="home-recent-title">
      <div className="hp-recent-bar__head">
        <History size={16} strokeWidth={1.8} aria-hidden="true" />
        <h2 id="home-recent-title" className="hp-recent-bar__title">
          زرت مؤخراً
        </h2>
      </div>
      <ul className="hp-recent-bar__list">
        {pages.map((p) => (
          <li key={p.href} className="hp-recent-bar__item">
            <Link href={p.href} className="hp-recent-chip">
              <span className="hp-recent-chip__label">{p.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
