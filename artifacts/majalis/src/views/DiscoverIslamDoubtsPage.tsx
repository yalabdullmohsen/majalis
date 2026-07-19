import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { getShubuhatByCategory, type DawahShubha } from "@/lib/dawah-service";
import "@/styles/discover-islam.css";

const COMPLEXITY_LABEL: Record<string, string> = { basic: "أساسي", intermediate: "متوسط", advanced: "متقدّم" };

export default function DiscoverIslamDoubtsPage() {
  const [items, setItems] = useState<DawahShubha[] | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/discover-islam/doubts",
      title: "ردود على الشبهات حول الإسلام | التعريف بالإسلام",
      description: "ردود موثّقة وهادئة على أشهر الشبهات المثارة حول الإسلام، بصياغة الشبهة الحقيقية دون تحريف.",
    });
    getShubuhatByCategory().then(setItems);
  }, []);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader eyebrow="التعريف بالإسلام" title="الشبهات والتفنيدات" subtitle="نعرض الشبهة بصياغتها الحقيقية، ثم نجيب بالدليل والسياق — لا ردود سطحية." />

      {items === null ? (
        <SkeletonCardGrid />
      ) : items.length === 0 ? (
        <Empty text="لا توجد شبهات منشورة بعد." />
      ) : (
        <div className="page-card-grid">
          {items.map((s) => (
            <Link key={s.id} href={`/discover-islam/doubts/${s.slug}`} className="platform-card-link">
              <article className="page-card platform-content-card">
                <div className="page-card-header">
                  <p>{s.title}</p>
                  <span className="page-tag">{COMPLEXITY_LABEL[s.complexity_level]}</span>
                </div>
                <p className="page-desc">{s.short_answer}</p>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
