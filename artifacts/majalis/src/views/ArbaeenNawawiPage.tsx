import { useEffect } from "react";
import { PageHeader } from "@/components/ui-common";
import { ARBAEEN_NAWAWI } from "@/lib/arbaeen-nawawi-seed";
import { HighlightedContentCard } from "@/components/reading/HighlightedContentCard";
import { applyPageSeo } from "@/lib/seo";

export default function ArbaeenNawawiPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/arbaeen",
      title: "الأربعون النووية — أحاديث نووية مشروحة | المجلس العلمي",
      description: "الأربعون حديثاً النووية مع شرح موجز وفوائد ومصدر لكل حديث — مرجع حديثي مختصر لطالب العلم.",
      keywords: ["الأربعون النووية", "أحاديث نووية", "شرح الأحاديث", "الحديث النبوي", "نووي"],
    });
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="السنة"
        title="الأربعون النووية"
        subtitle="أحاديث مختصرة مع شرح موجز وفوائد ومصدر."
      />

      <div className="nawawi-grid">
        {ARBAEEN_NAWAWI.map((hadith) => (
          <HighlightedContentCard
            key={hadith.id}
            id={String(hadith.id)}
            section="hadith"
            title={hadith.title}
            primaryText={hadith.text}
            secondaryText={hadith.explanation}
            tags={[`${hadith.id}`]}
            meta={[
              { label: "المصدر", value: hadith.source },
              { label: "الفوائد", value: hadith.benefits },
            ]}
            shareTitle={hadith.title}
            shareText={`${hadith.text}\n\n${hadith.explanation}\n\n${hadith.source}`}
            className="nawawi-card"
          />
        ))}
      </div>
    </div>
  );
}
