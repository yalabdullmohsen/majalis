import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { T } from "@/lib/terminology";
import { getMergedPlatformUpdates } from "@/lib/auto-content-service";
import { UPDATE_TYPES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";
import type { MergedUpdateItem } from "@/lib/auto-content/auto-content-utils";

const TYPE_COLORS: Record<string, string> = {
  قرار: "#164E3C",
  فتوى: "#2563EB",
  درس: "#7C3AED",
  دورة: "#D97706",
  كتاب: "#059669",
  إعلان: "#DC2626",
  "خبر علمي": "#0891B2",
};

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default function UpdatesPage() {
  const [items, setItems] = useState<MergedUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("الكل");

  usePageView("updates", null);

  useEffect(() => {
    setLoading(true);
    getMergedPlatformUpdates(100)
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "الكل" ? items : items.filter((i) => i.update_type === filter);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="نشاط المنصة"
        title={T.updatesPageTitle}
        subtitle={T.updatesPageSubtitle}
      />

      <div className="content-hub-chips">
        {["الكل", ...UPDATE_TYPES].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={filter === t ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty text={T.updatesEmpty} />
      ) : (
        <div className="updates-timeline">
          {filtered.map((item) => (
            <article key={`${item.isAuto ? "auto" : "platform"}-${item.id}`} className="updates-timeline-item ui-card">
              <div className="updates-timeline-meta">
                <span
                  className="updates-type-badge"
                  style={{ background: TYPE_COLORS[item.update_type] || "#64748B" }}
                >
                  {item.update_type}
                </span>
                {item.isAuto && (
                  <span className="updates-type-badge" style={{ background: "#0F766E", marginInlineStart: "0.35rem" }}>
                    مصدر موثوق
                  </span>
                )}
                <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
              </div>
              {item.source_url ? (
                <Link href={item.source_url} style={{ textDecoration: "none" }}>
                  <h2 className="updates-timeline-title">{item.title}</h2>
                </Link>
              ) : (
                <h2 className="updates-timeline-title">{item.title}</h2>
              )}
              {item.summary && <p className="updates-timeline-summary">{item.summary}</p>}
              {item.isAuto && item.source_name && (
                <p className="updates-timeline-summary" style={{ fontSize: "0.8125rem", opacity: 0.85 }}>
                  المصدر: {item.source_name}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
