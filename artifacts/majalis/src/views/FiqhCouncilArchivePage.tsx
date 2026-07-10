import { useEffect, useState } from "react";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getArchivedFiqhCouncilItems } from "@/lib/fiqh-council-service";
import {
  FIQH_ITEM_TYPE_LABELS,
  fiqhItemHref,
  formatFiqhItemMeta,
  type FiqhItemType,
} from "@/lib/fiqh-council-types";
import { FiqhCouncilSearchBox } from "@/components/fiqh-council/FiqhCouncilSearchBox";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { applyPageSeo } from "@/lib/seo";

export default function FiqhCouncilArchivePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/archive",
      title: "أرشيف المجمع الفقهي | المجلس العلمي",
      description: "أرشيف القرارات والفتاوى التاريخية للمجمع الفقهي الإسلامي، وثائق وقرارات مؤرشفة.",
      keywords: ["أرشيف فقهي", "قرارات تاريخية", "مجمع فقهي", "وثائق إسلامية", "تاريخ الفقه"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "أرشيف المجمع الفقهي", url: "https://majlisilm.com/fiqh-council/archive", about: { "@type": "Thing", name: "الأرشيف التاريخي للقرارات الفقهية" } }],
    });
  }, []);

  useEffect(() => {
    getArchivedFiqhCouncilItems()
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page">
      <PageHeader
        eyebrow="الفقه المعاصر"
        title="أرشيف المجمع الفقهي"
        subtitle="قرارات وفتاوى وتوصيات سابقة، للمرجعية والبحث."
      />

      <FiqhCouncilSubnav />

      <FiqhCouncilSearchBox placeholder="ابحث في الأرشيف..." />

      {loading ? (
        <SkeletonCardGrid />
      ) : items.length === 0 ? (
        <Empty text="لا توجد عناصر مؤرشفة حالياً." />
      ) : (
        <div className="page-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.slug}
              href={fiqhItemHref(item.slug)}
              title={item.title}
              tag={FIQH_ITEM_TYPE_LABELS[item.type as FiqhItemType]}
              meta={formatFiqhItemMeta(item)}
              summary={item.summary}
            />
          ))}
        </div>
      )}

      <div className="twh-share">
        <ShareButtons title="أرشيف مجلس الفقه — المجلس العلمي" url="https://majlisilm.com/fiqh-council/archive" />
      </div>
    </div>
  );
}
