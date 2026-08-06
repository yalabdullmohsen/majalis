/**
 * باني روابط المحتوى الداخلي — مصدر واحد للحقيقة.
 * يمنع تكرار خرائط TYPE_HREF / CONTENT_TYPE_HREF / getNodeHref التي كانت
 * تنحرف عن بعضها وتُسقِط المعرّف بصمت.
 */

function idOrEmpty(id?: string | null): string {
  return String(id ?? "").trim();
}

function pathWithId(base: string, id?: string | null): string {
  const t = idOrEmpty(id);
  return t ? `${base}/${encodeURIComponent(t)}` : base;
}

export function hrefLessons(id?: string | null): string {
  return pathWithId("/lessons", id);
}

export function hrefLibrary(id?: string | null): string {
  return pathWithId("/library", id);
}

export function hrefScholars(id?: string | null): string {
  return pathWithId("/scholars", id);
}

export function hrefRulings(id?: string | null): string {
  return pathWithId("/rulings", id);
}

export function hrefQa(id?: string | null): string {
  const t = idOrEmpty(id);
  return t ? `/quiz?id=${encodeURIComponent(t)}` : "/quiz";
}

export function hrefFawaid(id?: string | null): string {
  const t = idOrEmpty(id);
  return t ? `/fawaid#${encodeURIComponent(t)}` : "/fawaid";
}

export function hrefHadith(id?: string | null): string {
  const t = idOrEmpty(id);
  return t ? `/hadith#${encodeURIComponent(t)}` : "/hadith";
}

export function hrefStories(slug?: string | null): string {
  const t = idOrEmpty(slug);
  return t ? `/stories?slug=${encodeURIComponent(t)}` : "/stories";
}

export function hrefMiracles(id?: string | null): string {
  const t = idOrEmpty(id);
  return t ? `/miracles#${encodeURIComponent(t)}` : "/miracles";
}

export function hrefAdhkar(cat?: string | null): string {
  const t = idOrEmpty(cat);
  return t ? `/adhkar?cat=${encodeURIComponent(t)}` : "/adhkar";
}

export function hrefQuranHub(): string {
  return "/quran-hub";
}

/** فلتر موسوعة الأحكام حسب التصنيف (لصفحات أبواب الفقه). */
export function hrefRulingsFilter(category?: string, subcategory?: string): string {
  if (!category) return "/rulings";
  const q = new URLSearchParams({ category });
  if (subcategory) q.set("subcategory", subcategory);
  return `/rulings?${q.toString()}`;
}

/** أنواع التوصيات الذكية */
export type ContentHrefType =
  | "lesson"
  | "hadith"
  | "fatwa"
  | "benefit"
  | "book"
  | "scholar"
  | "qa"
  | "ruling"
  | "story"
  | "miracle"
  | "dhikr"
  | "quran_ayah";

export const CONTENT_TYPE_HREF: Record<ContentHrefType, (id: string) => string> = {
  lesson: (id) => hrefLessons(id),
  hadith: (id) => hrefHadith(id),
  fatwa: (id) => hrefRulings(id),
  benefit: (id) => hrefFawaid(id),
  book: (id) => hrefLibrary(id),
  scholar: (id) => hrefScholars(id),
  qa: (id) => hrefQa(id),
  ruling: (id) => hrefRulings(id),
  story: (id) => hrefStories(id),
  miracle: (id) => hrefMiracles(id),
  dhikr: (id) => hrefAdhkar(id),
  quran_ayah: () => hrefQuranHub(),
};

/** أنواع علاقات الرسم المعرفي في KnowledgeRelatedItems */
export type KnowledgeRelatedHrefType = "scholar" | "lesson" | "book" | "fawaid" | "question";

export const KNOWLEDGE_RELATED_HREF: Record<KnowledgeRelatedHrefType, (id: string) => string> = {
  scholar: (id) => hrefScholars(id),
  lesson: (id) => hrefLessons(id),
  book: (id) => hrefLibrary(id),
  fawaid: (id) => hrefFawaid(id),
  question: (id) => hrefQa(id),
};

/** أنواع عقد الرسم المعرفي */
export type KnowledgeNodeHrefType =
  | "quran_ayah"
  | "hadith"
  | "fatwa"
  | "scholar"
  | "book"
  | "lesson"
  | "benefit"
  | "prophet_story"
  | "term";

export function hrefKnowledgeNode(
  nodeType: string,
  referenceId?: string | null,
  title?: string,
): string {
  const ref = idOrEmpty(referenceId);
  switch (nodeType as KnowledgeNodeHrefType | string) {
    case "quran_ayah":
      return hrefQuranHub();
    case "hadith":
      return hrefHadith(ref || null);
    case "fatwa":
      return hrefRulings(ref || null);
    case "scholar":
      return hrefScholars(ref || null);
    case "book":
      return hrefLibrary(ref || null);
    case "lesson":
      return hrefLessons(ref || null);
    case "benefit":
      return hrefFawaid(ref || null);
    case "prophet_story":
      return "/prophets";
    case "term":
      return `/search/${encodeURIComponent(title || "")}`;
    default:
      return "/knowledge-graph";
  }
}
