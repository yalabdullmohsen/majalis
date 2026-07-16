import type { RulingRelationLink, ShariaRulingExtended } from "./rulings-types";
import { SEED_QA } from "./qa-seed";
import { FIQH_COUNCIL_SEED } from "./fiqh-council-service";

export function buildRulingRelations(ruling: ShariaRulingExtended): RulingRelationLink[] {
  const links: RulingRelationLink[] = [];

  for (const qaId of ruling.linked_qa_ids ?? []) {
    const qa = SEED_QA.find((q) => q.id === qaId);
    if (qa) {
      links.push({
        type: "qa",
        id: qa.id,
        title: qa.question,
        href: `/qa#${qa.id}`,
        meta: qa.qa_categories?.name,
      });
    }
  }

  for (const fiqhId of ruling.linked_fiqh_ids ?? []) {
    const item = FIQH_COUNCIL_SEED.find((x) => x.id === fiqhId);
    if (item) {
      links.push({
        type: "fiqh",
        id: item.id,
        title: item.title,
        href: `/fiqh-council/${item.slug || item.id}`,
        meta: item.category,
      });
    }
  }

  for (const relatedId of ruling.related_ids ?? []) {
    links.push({
      type: "ruling",
      id: relatedId,
      title: "حكم مرتبط",
      href: `/rulings/${relatedId}`,
    });
  }

  // Keyword-based suggestions
  const kw = ruling.keywords?.[0] || ruling.subcategory;
  if (kw) {
    links.push({
      type: "qa",
      id: "search",
      title: `أسئلة في ${kw}`,
      href: `/qa?search=${encodeURIComponent(kw)}`,
      meta: "بحث",
    });
    links.push({
      type: "lesson",
      id: "search",
      title: `دروس في ${kw}`,
      href: `/lessons?search=${encodeURIComponent(kw)}`,
      meta: "بحث",
    });
  }

  return links;
}

export function groupRelations(links: RulingRelationLink[]) {
  const groups: Record<string, RulingRelationLink[]> = {};
  for (const link of links) {
    if (!groups[link.type]) groups[link.type] = [];
    groups[link.type].push(link);
  }
  return groups;
}

export const RELATION_TYPE_LABELS: Record<string, string> = {
  qa: "أسئلة وأجوبة",
  fatwa: "فتاوى",
  fiqh: "المجمع الفقهي",
  ruling: "أحكام مرتبطة",
  lesson: "دروس",
  fawaid: "فوائد",
  article: "مقالات",
};
