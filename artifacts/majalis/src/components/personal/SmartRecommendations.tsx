import { useEffect, useState } from "react";
import { UnifiedContentCard } from "@/components/platform/UnifiedContentCard";
import { fetchPersonalRecommendations, type RecommendationSection } from "@/lib/personal-learning/recommendations";

type Props = {
  limit?: number;
  className?: string;
};

export function SmartRecommendations({ limit = 6, className = "" }: Props) {
  const [sections, setSections] = useState<RecommendationSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPersonalRecommendations(limit)
      .then((s) => { if (!cancelled) setSections(s); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [limit]);

  if (loading || !sections.length) return null;

  return (
    <div className={`smart-recommendations ${className}`.trim()} dir="rtl">
      {sections.map((section) => (
        <section key={section.id} className="home-section smart-recommendations__section" aria-label={section.title}>
          <div className="home-section-head">
            <h2 className="home-section-title">{section.title}</h2>
            <p className="home-section-sub smart-recommendations__reason">{section.reason}</p>
          </div>
          <div className="page-card-grid">
            {section.items.map((item) => (
              <UnifiedContentCard key={`${section.id}-${item.href}`} item={item} compact />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default SmartRecommendations;
