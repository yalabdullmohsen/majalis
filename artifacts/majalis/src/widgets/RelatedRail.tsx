import "@/widgets/related-rail.css";
/**
 * شريط «ذو صلة» — يقرأ من الرسم البياني الثابت عند تمرير kind/slug.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  loadKnowledgeGraph,
  relatedFor,
  type GraphKind,
} from "@/shared/lib/knowledge-graph";

export type RelatedRailItem = {
  titleAr: string;
  href: string;
  groupAr?: string;
};

function hrefFor(kind: string, slug: string): string {
  switch (kind) {
    case "scholar":
      return `/scholars/${slug}`;
    case "book":
      return `/library/${slug}`;
    case "hadith":
      return `/hadith?ref=${encodeURIComponent(slug)}`;
    case "ruling":
      return `/rulings/${slug}`;
    case "term":
      return `/islamic-glossary#${encodeURIComponent(slug)}`;
    case "lesson":
      return `/lessons/${slug}`;
    case "surah":
      return `/quran/surahs`;
    case "dua":
      return `/duas`;
    case "prophet":
      return `/prophet-stories`;
    case "story":
      return `/islamic-stories`;
    default:
      return `/search?q=${encodeURIComponent(slug)}`;
  }
}

export function RelatedRail({
  titleAr = "ذو صلة",
  items = [],
}: {
  titleAr?: string;
  items?: readonly RelatedRailItem[];
}) {
  if (!items.length) return null;
  return (
    <section className="related-rail" aria-label={titleAr}>
      <h2 className="related-rail__title">{titleAr}</h2>
      <ul className="related-rail__list">
        {items.map((item) => (
          <li key={`${item.groupAr ?? ""}-${item.href}`}>
            <Link href={item.href}>
              {item.groupAr ? (
                <span className="related-rail__group">{item.groupAr} · </span>
              ) : null}
              {item.titleAr}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** يحمّل الروابط من links.json للكيان الحالي */
export function GraphRelatedRail({
  kind,
  slug,
  titleAr = "ذو صلة",
  limit = 8,
}: {
  kind: GraphKind;
  slug: string;
  titleAr?: string;
  limit?: number;
}) {
  const [items, setItems] = useState<RelatedRailItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadKnowledgeGraph()
      .then((doc) => {
        if (cancelled) return;
        const links = relatedFor(doc, kind, slug, limit);
        const titleByKey = new Map(
          doc.nodes.map((n) => [`${n.kind}:${n.slug}`, n.titleAr ?? n.slug]),
        );
        setItems(
          links.map((L) => ({
            titleAr: titleByKey.get(`${L.to.kind}:${L.to.slug}`) ?? L.to.slug,
            href: hrefFor(L.to.kind, L.to.slug),
            groupAr: L.labelAr,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, slug, limit]);

  return <RelatedRail titleAr={titleAr} items={items} />;
}
