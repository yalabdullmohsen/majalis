import { displayText } from "@/lib/display-text";
import { isDemoId } from "@/lib/demo-id";
import { HighlightedContentCard } from "@/components/reading/HighlightedContentCard";

type FaidahLike = {
  id: string;
  text: string;
  category?: string;
  source?: string;
  author_name?: string;
};

type Props = {
  item: FaidahLike;
};

export function FaidahCard({ item }: Props) {
  const cleaned = displayText(item.text);
  const meta = [
    item.source ? { label: "المصدر", value: item.source } : null,
    item.author_name ? { label: "المؤلف", value: item.author_name } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <HighlightedContentCard
      id={item.id}
      section="fawaid"
      primaryText={cleaned}
      tags={item.category ? [item.category] : []}
      meta={meta}
      contentType="benefit"
      contentId={item.id}
      showSave={!isDemoId(item.id)}
      shareTitle={item.category || "فائدة"}
      shareText={cleaned}
      showImageCard
      imageCardCategory={item.category}
      imageCardSource={item.source}
      className="faidah-card"
      adminEditType="fawaid"
      adminEditData={{ text: item.text, source: item.source || "", category: item.category || "" }}
    />
  );
}

export default FaidahCard;
