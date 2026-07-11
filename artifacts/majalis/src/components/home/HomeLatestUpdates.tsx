import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchLiveAutoContent, autoContentToUpdateItem } from "@/lib/auto-content-service";
import type { MergedUpdateItem } from "@/lib/auto-content/auto-content-utils";
import { displayText } from "@/lib/display-text";

const TYPE_LABELS: Record<string, string> = {
  fatwa: "فتوى",
  decision: "قرار",
  article: "مقال",
  news: "خبر",
  general: "تحديث",
};

function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function HomeLatestUpdates() {
  const [items, setItems] = useState<MergedUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchLiveAutoContent(6)
      .then((data) => {
        if (!active) return;
        const safeData = Array.isArray(data) ? data : [];
        setItems(safeData.map(autoContentToUpdateItem).filter((item) => {
          if (!item?.title) return false;
          const src = (item.source_name || "").toLowerCase();
          const url = (item.source_url || "").toLowerCase();
          return !src.includes("فقه") && !url.includes("fiqh-council");
        }));
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="home-section" aria-labelledby="latest-updates-heading">
      <div className="home-section-head">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,1 10,6 15.5,6 11,9.5 13,15 8,11.5 3,15 5,9.5 0.5,6 6,6" fill="none" stroke="#1F4D3A" strokeWidth="1.2"/>
            <circle cx="8" cy="8" r="2.2" fill="#2d7a5a" opacity="0.4"/>
          </svg>
          <div>
            <p className="home-eyebrow">محتوى موثّق</p>
            <h2 id="latest-updates-heading">آخر التحديثات من المصادر الرسمية</h2>
          </div>
        </div>
        <Link href="/updates" className="home-section-link">جميع التحديثات</Link>
      </div>
      <div className="home-more-grid">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.source_url || `/updates/auto/${item.slug}`}
            className="home-more-card ui-card"
          >
            <span className="page-tag">{TYPE_LABELS[item.update_type] || "تحديث"}</span>
            <strong>{displayText(item.title)}</strong>
            {item.summary && <span>{displayText(item.summary.slice(0, 120))}{item.summary.length > 120 ? "…" : ""}</span>}
            <span className="home-daily-meta">
              {item.source_name && <span>{item.source_name}</span>}
              {item.published_at && <span>{formatDate(item.published_at)}</span>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeLatestUpdates;
