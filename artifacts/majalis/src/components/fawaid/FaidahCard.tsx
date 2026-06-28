import { filterPublicRecords } from "@/lib/production-guard";
import { sanitizePublicText } from "@/lib/public-content-sanitize";
import { isDemoId } from "@/lib/demo-content";
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
  const cleaned = sanitizePublicText(item.text);
  const meta = [
    item.source ? { label: "المصدر", value: item.source, role: "source" as const } : null,
    item.author_name ? { label: "المؤلف", value: item.author_name, role: "sheikh" as const } : null,
  ].filter(Boolean) as { label: string; value: string; role: "source" | "sheikh" }[];

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
      className="faidah-card"
    />
  );
}

export default FaidahCard;
