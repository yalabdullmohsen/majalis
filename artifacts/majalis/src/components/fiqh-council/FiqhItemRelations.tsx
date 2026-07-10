import { Link } from "wouter";
import { fiqhItemHref } from "@/lib/fiqh-council-types";
import type { FiqhMaterialRelations } from "@/lib/fiqh-council-service";

type Props = {
  relations: FiqhMaterialRelations;
};

function RelationGroup({ title, items }: { title: string; items: { slug: string; title: string; meta?: string }[] }) {
  if (!items.length) return null;
  return (
    <section className="fiqh-relations-group">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={fiqhItemHref(item.slug)}>{item.title}</Link>
            {item.meta && <span className="fiqh-relations-meta">، {item.meta}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FiqhItemRelations({ relations }: Props) {
  const hasAny =
    relations.sameCategory.length ||
    relations.sameSource.length ||
    relations.sameTags.length ||
    relations.relatedType.length;

  if (!hasAny) return null;

  return (
    <section className="content-detail-evidence ui-card fiqh-item-relations">
      <h2>مواد ذات صلة</h2>
      <RelationGroup title="نفس التصنيف" items={relations.sameCategory} />
      <RelationGroup title="نفس المصدر" items={relations.sameSource} />
      <RelationGroup title="وسوم مشتركة" items={relations.sameTags} />
      <RelationGroup title="مواد مرتبطة" items={relations.relatedType} />
    </section>
  );
}
