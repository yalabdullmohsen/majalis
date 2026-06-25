import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { getPlatformUpdates } from "@/lib/platform-content-service";
import { UPDATE_TYPES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";

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
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("الكل");

  usePageView("updates", null);

  useEffect(() => {
    setLoading(true);
    getPlatformUpdates(100)
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "الكل" ? items : items.filter((i) => i.update_type === filter);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="النشاط العلمي"
        title="آخر المستجدات"
        subtitle="قرارات وفتاوى ودروس ودورات وكتب وإعلانات — مرتّبة زمنياً."
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
        <Empty text="لا توجد مستجدات." />
      ) : (
        <div className="updates-timeline">
          {filtered.map((item) => (
            <article key={item.id} className="updates-timeline-item ui-card">
              <div className="updates-timeline-meta">
                <span
                  className="updates-type-badge"
                  style={{ background: TYPE_COLORS[item.update_type] || "#64748B" }}
                >
                  {item.update_type}
                </span>
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
