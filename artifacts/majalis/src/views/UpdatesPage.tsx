import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { getMergedPlatformUpdates } from "@/lib/auto-content-service";
import { UPDATE_TYPES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";
import { ShareButtons } from "@/components/ContentActions";
import type { MergedUpdateItem } from "@/lib/auto-content/auto-content-utils";
import { applyPageSeo } from "@/lib/seo";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

const TYPE_COLORS: Record<string, string> = {
  قرار: "#164E3C",
  فتوى: "#2563EB",
  درس: "#7C3AED",
  دورة: "#1E4A37",
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
  const [search, setSearch] = useState("");

  usePageView("updates", null);

  useEffect(() => {
    applyPageSeo({
      path: "/updates",
      title: "آخر المستجدات | المجلس العلمي",
      description: "آخر المستجدات العلمية والإضافات الجديدة في المجلس العلمي، قرارات وفتاوى ودروس ودورات حديثة.",
      keywords: ["مستجدات إسلامية", "أخبار علمية", "جديد المجلس", "تحديثات شرعية", "أخبار فقهية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "آخر المستجدات العلمية",
          url: "https://majlisilm.com/updates",
          description: "مستجدات وتحديثات المجلس العلمي من دروس ودورات وفتاوى وقرارات حديثة",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
        },
      ],
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getMergedPlatformUpdates(100)
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = filter === "الكل" ? items : items.filter((i) => i.update_type === filter);
    if (search.trim()) list = list.filter((i) => arabicMatchAny([i.title, i.summary ?? "", i.source_name ?? "", i.update_type], search));
    return list;
  }, [items, filter, search]);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="النشاط العلمي"
        title="آخر المستجدات"
        subtitle="قرارات وفتاوى ودروس ودورات وكتب وإعلانات، مرتّبة زمنياً. يُحدَّث تلقائياً كل 6 ساعات من مصادر موثوقة."
      />

      <div className="content-hub-chips">
        {["الكل", ...UPDATE_TYPES].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={filter === t ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            aria-pressed={filter === t}
          >
            {t}
          </button>
        ))}
      </div>

      {!loading && (
        <div className="upd-search-wrap">
          <input
            type="search"
            className="ds-input upd-search-input"
            placeholder="ابحث في المستجدات..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="بحث في المستجدات"
          />
        </div>
      )}

      {loading ? (
        <SkeletonCardGrid />
      ) : filtered.length === 0 ? (
        <Empty text="لا توجد مستجدات." />
      ) : (
        <div className="updates-timeline">
          {filtered.map((item) => (
            <article key={`${item.isAuto ? "auto" : "platform"}-${item.id}`} className="updates-timeline-item ui-card">
              <div className="updates-timeline-meta">
                <span
                  className="updates-type-badge"
                  style={{ "--badge-color": TYPE_COLORS[item.update_type] || "#64748B" } as React.CSSProperties}
                >
                  {item.update_type}
                </span>
                {item.isAuto && (
                  <span className="updates-type-badge upd-auto-badge">
                    مصدر موثوق
                  </span>
                )}
                <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
              </div>
              {item.source_url ? (
                <Link href={item.source_url} className="upd-title-link">
                  <h2 className="updates-timeline-title">{item.title}</h2>
                </Link>
              ) : (
                <h2 className="updates-timeline-title">{item.title}</h2>
              )}
              {item.summary && <p className="updates-timeline-summary">{item.summary}</p>}
              {item.isAuto && item.source_name && (
                <p className="updates-timeline-summary upd-source-name">
                  المصدر: {item.source_name}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="twh-share">
        <ShareButtons title="آخر التحديثات — المجلس العلمي" url="https://majlisilm.com/updates" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["tarikh", "fiqh"]} title="اختبر معلوماتك في التاريخ الإسلامي والفقه" count={4} />
      </div>
    </div>
  );
}
