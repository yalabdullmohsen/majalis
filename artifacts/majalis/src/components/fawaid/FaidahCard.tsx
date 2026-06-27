import { displayText } from "@/lib/display-text";
import { isDemoId } from "@/lib/demo-content";
import { ReadingToolbar } from "@/components/reading/ReadingToolbar";
import { ReadingText } from "@/components/reading/ReadingText";

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

  return (
    <article className="ui-card faidah-card">
      {item.category && <span className="page-tag">{item.category}</span>}

      <ReadingText className="faidah-card__body">{cleaned}</ReadingText>

      {(item.source || item.author_name) && (
        <p className="faidah-card__meta">
          {item.source && <span>{item.source}</span>}
          {item.author_name && <span>{item.author_name}</span>}
        </p>
      )}

      <ReadingToolbar
        text={cleaned}
        title={item.category || "فائدة"}
        contentType="benefit"
        contentId={item.id}
        showSave={!isDemoId(item.id)}
      />
    </article>
  );
}

export default FaidahCard;
