import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchLiveAutoContent, autoContentToUpdateItem } from "@/lib/auto-content-service";
import type { MergedUpdateItem } from "@/lib/auto-content/auto-content-utils";
import { UPDATES_SEED } from "@/lib/updates-seed";
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

function seedToMerged(item: (typeof UPDATES_SEED)[number]): MergedUpdateItem {
  return {
    id: item.id,
    slug: item.id,
    title: item.title,
    summary: item.summary,
    update_type: item.update_type,
    source_name: "المجلس العلمي",
    source_url: item.source_url,
    published_at: item.published_at,
  };
}

export function HomeLatestUpdates() {
  const [items, setItems] = useState<MergedUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchLiveAutoContent(6)
      .then((data) => {
        if (!active) return;
        if (data.length > 0) {
          setItems(data.map(autoContentToUpdateItem));
        } else {
          setItems(UPDATES_SEED.slice(0, 6).map(seedToMerged));
        }
      })
      .catch(() => {
        if (active) setItems(UPDATES_SEED.slice(0, 6).map(seedToMerged));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return null;

  return (
    <section className="home-section" aria-labelledby="latest-updates-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">محتوى موثّق</p>
          <h2 id="latest-updates-heading">آخر التحديثات</h2>
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
            {item.summary && (
              <span>
                {displayText(item.summary.slice(0, 120))}
                {item.summary.length > 120 ? "…" : ""}
              </span>
            )}
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
