import { ADHKAR_CATEGORIES, type AdhkarItem } from "@/lib/adhkar-seed";
import { HighlightedContentCard } from "@/components/reading/HighlightedContentCard";
import { TasbeehCounter } from "@/components/reading/TasbeehCounter";
import { isDemoId } from "@/lib/demo-content";

type Props = {
  item: AdhkarItem;
};

export function AdhkarCard({ item }: Props) {
  const category = ADHKAR_CATEGORIES.find((c) => c.id === item.categoryId);
  const meta = [
    item.narrator ? { label: "الراوي", value: item.narrator } : null,
    item.source ? { label: "المصدر", value: item.source } : null,
    item.reference ? { label: "المرجع", value: item.reference } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <HighlightedContentCard
      id={item.id}
      section="adhkar"
      primaryText={item.text}
      tags={category ? [category.name] : []}
      repeatCount={item.count}
      grade={item.grade}
      meta={meta}
      contentType="adhkar"
      contentId={item.id}
      showSave={!isDemoId(item.id)}
      shareTitle={category?.name || "ذكر"}
      shareText={item.text}
      extra={<TasbeehCounter storageId={`adhkar-${item.id}`} target={item.count} compact label="عداد الذكر" />}
      className="adhkar-card"
      adminEditType="adhkar"
      adminEditData={{ text: item.text, times: item.count ? String(item.count) : "", category: category?.name || "" }}
    />
  );
}

export default AdhkarCard;
