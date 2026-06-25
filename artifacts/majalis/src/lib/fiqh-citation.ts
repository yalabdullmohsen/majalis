import {
  FIQH_ITEM_TYPE_LABELS,
  fiqhItemHref,
  type FiqhCouncilItem,
  type FiqhItemType,
} from "./fiqh-council-types";

const SITE = "https://majlisilm.com";

export function formatFiqhCitation(item: FiqhCouncilItem, baseUrl = SITE): string {
  const parts = [
    item.title,
    item.source_name ? `المصدر: ${item.source_name}` : "",
    item.decision_number ? `رقم القرار: ${item.decision_number}` : "",
    item.session_number ? `الجلسة: ${item.session_number}` : "",
    item.session_date || item.published_at
      ? `التاريخ: ${(item.session_date || item.published_at || "").slice(0, 10)}`
      : "",
    item.category ? `التصنيف: ${item.category}` : "",
    item.source_url ? `الرابط الأصلي: ${item.source_url}` : "",
    `رابط المنصة: ${baseUrl}${fiqhItemHref(item.slug)}`,
  ].filter(Boolean);

  return parts.join(" | ");
}

export function formatFiqhCitationShort(item: Pick<FiqhCouncilItem, "title" | "source_name" | "slug">) {
  return `${item.title}${item.source_name ? ` — ${item.source_name}` : ""} (${fiqhItemHref(item.slug)})`;
}

export type FiqhResearchCitation = {
  slug: string;
  title: string;
  excerpt: string;
  href: string;
  type: string;
  category: string;
  source_name?: string;
  source_url?: string;
  session_date?: string;
  decision_number?: string;
  citation: string;
};

export function toResearchCitation(item: FiqhCouncilItem, excerpt?: string): FiqhResearchCitation {
  const text = excerpt || item.summary || item.ruling_text || item.content?.slice(0, 200) || item.title;
  return {
    slug: item.slug,
    title: item.title,
    excerpt: text.slice(0, 280),
    href: fiqhItemHref(item.slug),
    type: FIQH_ITEM_TYPE_LABELS[item.type as FiqhItemType],
    category: item.category,
    source_name: item.source_name,
    source_url: item.source_url,
    session_date: item.session_date,
    decision_number: item.decision_number,
    citation: formatFiqhCitation(item),
  };
}

export const FIQH_RESEARCH_DISCLAIMER =
  "هذه خلاصة بحثية مستندة إلى مواد منشورة في المنصة، وليست فتوى شخصية. " +
  "في المسائل الخاصة والنوازل، يُرجى سؤال أهل العلم المختصين.";
