import { ADHKAR_CATEGORIES, type AdhkarItem } from "@/lib/adhkar-seed";
import { ReadingToolbar } from "@/components/reading/ReadingToolbar";
import { ReadingText } from "@/components/reading/ReadingText";
import { TasbeehCounter } from "@/components/reading/TasbeehCounter";

type Props = {
  item: AdhkarItem;
};

export function AdhkarCard({ item }: Props) {
  const category = ADHKAR_CATEGORIES.find((c) => c.id === item.categoryId);

  return (
    <article className="ui-card adhkar-card">
      <div className="adhkar-card__head">
        {category && <span className="page-tag">{category.name}</span>}
        <span className="adhkar-card__count">× {item.count}</span>
      </div>

      <ReadingText className="adhkar-card__text">{item.text}</ReadingText>

      <dl className="adhkar-card__meta">
        {item.narrator && (
          <div><dt>الراوي</dt><dd>{item.narrator}</dd></div>
        )}
        {item.source && (
          <div><dt>المصدر</dt><dd>{item.source}</dd></div>
        )}
        {item.grade && (
          <div><dt>الدرجة</dt><dd>{item.grade}</dd></div>
        )}
        {item.reference && (
          <div><dt>المرجع</dt><dd>{item.reference}</dd></div>
        )}
      </dl>

      <TasbeehCounter target={item.count} />

      <ReadingToolbar text={item.text} title={category?.name || "ذكر"} />
    </article>
  );
}

export default AdhkarCard;
