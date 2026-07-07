import { useEffect, useState } from "react";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
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

export default function FiqhCouncilArchivePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Loading />
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
    </div>
  );
}
