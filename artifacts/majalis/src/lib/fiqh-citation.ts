import {
  FIQH_ITEM_TYPE_LABELS,
  fiqhItemHref,
  type FiqhCouncilItem,
  type FiqhItemType,
} from "./fiqh-council-types";

const SITE = "https://majlisilm.com";

export type FiqhCitationFormat = "short" | "academic" | "links" | "research";

function accessDate() {
  return new Date().toISOString().slice(0, 10);
}

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

export function formatFiqhCitationAcademic(item: FiqhCouncilItem, baseUrl = SITE): string {
  const org = item.council_name || item.source_name || "المجمع الفقهي الإسلامي";
  const date = (item.session_date || item.published_at || "").slice(0, 10);
  const session = item.session_number ? `، الدورة ${item.session_number}` : "";
  const decision = item.decision_number ? `، رقم ${item.decision_number}` : "";
  return `${org}. (${date}). ${item.title}${session}${decision}. ${baseUrl}${fiqhItemHref(item.slug)}`;
}

export function formatFiqhCitationLinks(item: FiqhCouncilItem, baseUrl = SITE): string {
  const lines = [
    item.source_url ? `المصدر: ${item.source_url}` : "",
    `المنصة: ${baseUrl}${fiqhItemHref(item.slug)}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export function formatFiqhCitationResearch(item: FiqhCouncilItem, baseUrl = SITE): string {
  const org = item.council_name || item.source_name || "المجمع الفقهي الإسلامي";
  const date = (item.session_date || item.published_at || "").slice(0, 10);
  return [
    `${item.title}.`,
    `${org}.`,
    item.session_number ? `الدورة: ${item.session_number}.` : "",
    item.decision_number ? `رقم القرار: ${item.decision_number}.` : "",
    date ? `تاريخ النشر: ${date}.` : "",
    item.source_url ? `الرابط: ${item.source_url}.` : "",
    `رابط المنصة: ${baseUrl}${fiqhItemHref(item.slug)}.`,
    `تاريخ الاطلاع: ${accessDate()}.`,
  ].filter(Boolean).join(" ");
}

export function formatFiqhCitationByFormat(
  item: FiqhCouncilItem,
  format: FiqhCitationFormat,
  baseUrl = SITE,
): string {
  switch (format) {
    case "short":
      return formatFiqhCitationShort(item);
    case "academic":
      return formatFiqhCitationAcademic(item, baseUrl);
    case "links":
      return formatFiqhCitationLinks(item, baseUrl);
    case "research":
      return formatFiqhCitationResearch(item, baseUrl);
    default:
      return formatFiqhCitation(item, baseUrl);
  }
}

export const FIQH_CITATION_FORMAT_LABELS: Record<FiqhCitationFormat, string> = {
  short: "مختصرة",
  academic: "أكاديمية",
  links: "روابط",
  research: "بحثية",
};

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
    citation: formatFiqhCitationResearch(item),
  };
}

export const FIQH_RESEARCH_DISCLAIMER =
  "هذه خلاصة بحثية مستندة إلى مواد منشورة وموثقة في المنصة، وليست فتوى شخصية. " +
  "في المسائل الخاصة والنوازل، يُرجى سؤال أهل العلم المختصين.";

export const FIQH_NO_VERIFIED_MATERIAL_MSG =
  "لا توجد مادة موثقة كافية في قاعدة بيانات المنصة للإجابة عن هذا السؤال.";

export function downloadCitationTxt(item: FiqhCouncilItem, format: FiqhCitationFormat = "research") {
  const text = formatFiqhCitationByFormat(item, format);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fiqh-citation-${item.slug}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
