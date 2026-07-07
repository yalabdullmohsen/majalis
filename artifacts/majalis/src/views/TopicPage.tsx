import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { SearchSkeleton } from "@/components/ui-common";
import { displayText } from "@/lib/display-text";
import {
  fetchTopicContent,
  SECTION_LABELS,
  type IntelligentSearchResult,
  type TopicSection,
} from "@/lib/scholarly-intelligence-service";

function SectionGroup({
  title,
  items,
}: {
  title: string;
  items: IntelligentSearchResult[];
}) {
  if (!items.length) return null;
  return (
    <section className="search-results-group tpc-section-group">
      <h2 className="search-results-group-title">
        {title}
        <span className="search-results-count">{items.length}</span>
      </h2>
      <div className="search-results-list">
        {items.map((item) => (
          <Link key={`${item.kind}-${item.id || item.title}`} href={item.href} className="tpc-result-link">
            <div className="search-result-row">
              <div className="search-result-copy">
                <span>{displayText(item.title)}</span>
                <span className="search-result-meta">
                  {[item.kind_label, item.source_name, item.verification_status === "verified" ? "موثق" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function TopicPage() {
  const params = useParams();
  const slug = params.slug || "";
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<{ slug: string; title: string; title_en?: string; category?: string } | null>(null);
  const [sections, setSections] = useState<TopicSection | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [relatedTopics, setRelatedTopics] = useState<Array<{ slug: string; title: string }>>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchTopicContent(slug)
      .then((data) => {
        if (data?.ok) {
          setTopic(data.topic);
          setSections(data.sections);
          setTotalCount(data.total_count);
          setRelatedTopics(data.related_topics || []);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <SearchSkeleton />;

  if (!topic) {
    return (
      <div className="page-shell narrow">
        <h1>الموضوع غير موجود</h1>
        <Link href="/topics">العودة للموضوعات</Link>
      </div>
    );
  }

  return (
    <div className="page-shell narrow search-page">
      <nav className="tpc-breadcrumb">
        <Link href="/topics">الموضوعات العلمية</Link>
        <span className="tpc-sep">/</span>
        <span>{topic.title}</span>
      </nav>

      <h1 className="search-page-title">{topic.title}</h1>
      {topic.title_en && (
        <p className="search-page-hint tpc-title-en">
          {topic.title_en}
        </p>
      )}

      <p className="search-page-summary">
        {totalCount} عنصر علمي مرتبط بهذا الموضوع
      </p>

      {sections && (
        <>
          {(Object.keys(SECTION_LABELS) as Array<keyof TopicSection>).map((key) => (
            <SectionGroup key={key} title={SECTION_LABELS[key]} items={sections[key] || []} />
          ))}
        </>
      )}

      {relatedTopics.length > 0 && (
        <aside className="tpc-related">
          <h2 className="tpc-related__title">موضوعات ذات صلة</h2>
          <div className="tpc-related__chips">
            {relatedTopics.map((t) => (
              <Link key={t.slug} href={`/topics/${t.slug}`} className="tpc-related__chip">
                {t.title}
              </Link>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
