import { useEffect, useState } from "react";
import { Link } from "wouter";
import { History } from "lucide-react";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";

export function HomeRecentPagesBar() {
  const [pages, setPages] = useState<RecentPage[]>([]);
  useEffect(() => { setPages(getRecentPages(6)); }, []);
  if (pages.length < 2) return null;
  return (
    <nav className="hp-recent-bar" aria-label="آخر صفحات زرتَها">
      <span className="hp-recent-bar__label" aria-hidden="true">
        <History size={14} strokeWidth={1.8} />
        زرتَ مؤخراً
      </span>
      <div className="hp-recent-bar__chips">
        {pages.map((p) => (
          <Link key={p.href} href={p.href} className="hp-recent-chip">
            {p.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
