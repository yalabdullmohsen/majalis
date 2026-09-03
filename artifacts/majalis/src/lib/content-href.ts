/**
 * باني روابط المحتوى الداخلي — مصدر واحد للحقيقة.
 * يمنع تكرار خرائط TYPE_HREF / CONTENT_TYPE_HREF / getNodeHref التي كانت
 * تنحرف عن بعضها وتُسقِط المعرّف بصمت.
 */

import { ADHKAR_CATEGORIES } from "@/lib/adhkar-seed";
import { redirectScholarPath } from "@/lib/scholar-to-history-redirect";

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

/** المكتبة أُزيلت من الواجهة العامة — الروابط القديمة تتجه للبحث. */
export function hrefLibrary(id?: string | null): string {
  void id;
  return "/search";
}

export function hrefIslamicHistory(id?: string | null): string {
  return pathWithId("/tarikh-islami", id);
}

/** صفحات علماء أساسية على /scholars — مجهول → فهرس العلماء */
export function hrefScholars(id?: string | null): string {
  const target = redirectScholarPath(id);
  if (target) return target;
  const t = idOrEmpty(id);
  return t ? `/scholars/${encodeURIComponent(t)}` : "/scholars";
}

/** مشايخ معاصرون من دروس الكويت — slug مُشتق من sheikhNameKey. */
export function hrefTeachers(slug?: string | null): string {
  const t = idOrEmpty(slug);
  return t ? `/teachers/${encodeURIComponent(decodeURIComponent(t))}` : "/teachers";
}

export function hrefRulings(_id?: string | null): string {
  return "/fiqh";
}

export function hrefQa(id?: string | null): string {
  const t = idOrEmpty(id);
  return t ? `/quiz?qa=${encodeURIComponent(t)}` : "/quiz";
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

export function resolveAdhkarCategory(token: string | null | undefined) {
  if (!token) return null;
  return ADHKAR_CATEGORIES.find((c) => c.slug === token || c.id === token) ?? null;
}

/** مسار تصنيف الأذكار: `/adhkar/:slug` — يقبل slug أو id (`adh-morning` → morning). */
export function hrefAdhkar(cat?: string | null): string {
  const t = idOrEmpty(cat);
  if (!t) return "/adhkar";
  const match = resolveAdhkarCategory(t);
  const slug = match?.slug ?? (t.startsWith("adh-") ? t.slice(4) : t);
  return `/adhkar/${encodeURIComponent(slug)}`;
}

/** يحوّل `?cat=…` القديم إلى `/adhkar/:slug` مع بقية الاستعلام إن وُجد. */
export function adhkarCatRedirectPath(search: string): string | null {
  const qs = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const cat = qs.get("cat");
  if (!cat) return null;
  const match = resolveAdhkarCategory(cat);
  if (!match) return null;
  qs.delete("cat");
  const rest = qs.toString();
  return `${hrefAdhkar(match.slug)}${rest ? `?${rest}` : ""}`;
}

export function hrefQuranHub(): string {
  return "/quran-hub";
}

/** @deprecated موسوعة الأحكام أُرشفت — يُعاد التوجيه إلى بوابة الفقه */
export function hrefRulingsFilter(_category?: string, _subcategory?: string): string {
  return "/fiqh";
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
