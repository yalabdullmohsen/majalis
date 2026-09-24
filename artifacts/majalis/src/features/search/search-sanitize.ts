/**
 * تنقية نتائج البحث: استبعاد المكسور/المسودة وإزالة التكرار الحقيقي.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";
import type { AppSearchResult } from "@/features/search/app-search";

const BLOCKED_HREF =
  /^\/(admin|dashboard|internal|login|register|auth|fiqh-council|knowledge\/quiz)(\/|$)/i;

const DRAFT_STATUSES = new Set([
  "draft",
  "archived",
  "disabled",
  "pending",
  "pending_review",
  "needs_review",
  "needs_scholar_review",
  "NEEDS_SCHOLAR_REVIEW",
  "partial",
]);

/** مسارات معروفة أنها لا تملك صفحة محتوى فعلية في البحث العام. */
const BLOCKED_EXACT_HREFS = new Set(["/search", "/knowledge/quiz"]);

export function isUnusableSearchHref(href?: string | null): boolean {
  if (!href || !href.trim()) return true;
  const clean = href.split("?")[0].split("#")[0];
  if (BLOCKED_EXACT_HREFS.has(clean)) return true;
  if (BLOCKED_HREF.test(clean)) return true;
  return false;
}

export function isDraftOrHiddenSearchStatus(status?: string | null, partial?: boolean): boolean {
  if (partial) return true;
  if (!status) return false;
  return DRAFT_STATUSES.has(status);
}

/** مفتاح كيان للـdedupe: نفس المسار الأساسي + عنوان مطبّع → كيان واحد. */
export function searchDedupKey(item: Pick<AppSearchResult, "title" | "href" | "kind">): string {
  const href = (item.href || "").split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  const title = normalizeArabic(item.title || "");
  // عناوين محاور مترادفة لنفس قسم التفسير
  const hubTitle =
    title === "علم التفسير" || title === "التفسير" || title === "تفسير"
      ? "التفسير"
      : title;
  return `${href}::${hubTitle}`;
}

export type SearchSanitizedExtras = AppSearchResult & {
  partial?: boolean;
  verification_status?: string | null;
};

/**
 * يُسقط النتائج غير القابلة للفتح ويُبقي أول ظهور لكل كيان.
 */
export function sanitizeSearchResults<T extends SearchSanitizedExtras>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (isUnusableSearchHref(item.href)) continue;
    if (isDraftOrHiddenSearchStatus(item.verification_status, item.partial)) continue;
    if (!item.title?.trim()) continue;
    const key = searchDedupKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
