import { useEffect, useState } from "react";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { HubCard } from "@/components/ui/HubCard";
import { DiscoverIslamShell } from "@/components/discover-islam/DiscoverIslamShell";
import { applyPageSeo } from "@/lib/seo";
import { getShubuhatByCategory, type DawahShubha } from "@/lib/dawah-service";

const COMPLEXITY_LABEL: Record<string, string> = { basic: "أساسي", intermediate: "متوسط", advanced: "متقدّم" };

export default function DiscoverIslamDoubtsPage() {
  const [items, setItems] = useState<DawahShubha[] | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/discover-islam/doubts",
      title: "ردود على الشبهات حول الإسلام | التعريف بالإسلام",
      description: "ردود موثّقة وهادئة على أشهر الشبهات المثارة حول الإسلام، بصياغة الشبهة الحقيقية دون تحريف. محتوى معتمد في منهج سُنّة",
    });
    getShubuhatByCategory().then(setItems);
  }, []);

  return (
    <DiscoverIslamShell>
      <PageHeader eyebrow="التعريف بالإسلام" title="الشبهات والتفنيدات" subtitle="نعرض الشبهة بصياغتها الحقيقية، ثم نجيب بالدليل والسياق — لا ردود سطحية." />

      {items === null ? (
        <SkeletonCardGrid />
      ) : items.length === 0 ? (
        <Empty text="لا توجد شبهات منشورة بعد." />
      ) : (
        <div className="hub-card-grid dii-list-grid dii-section">
          {items.map((s) => (
            <HubCard
              key={s.id}
              href={`/discover-islam/doubts/${s.slug}`}
              title={s.title}
              description={s.short_answer}
              badge={COMPLEXITY_LABEL[s.complexity_level] || "شبهة"}
              className="dii-hub-card dii-list-card"
            />
          ))}
        </div>
      )}
    </DiscoverIslamShell>
  );
}
