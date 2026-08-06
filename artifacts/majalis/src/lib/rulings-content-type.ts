/**
 * تصنيف محتوى موسوعة الأحكام — يمنع ظهور أسئلة المسابقة/التعليم تحت /rulings.
 */

export const RULING_CONTENT_TYPES = [
  "ruling",
  "fiqhIssue",
  "quizQuestion",
  "educationalQA",
  "legacyFatwa",
] as const;

export type RulingContentType = (typeof RULING_CONTENT_TYPES)[number];

/** الأنواع المسموح بنشرها تحت مسار /rulings فقط */
export const RULINGS_ROUTE_ALLOWED_TYPES: ReadonlySet<RulingContentType> = new Set([
  "ruling",
  "fiqhIssue",
  "legacyFatwa",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export type RulingIdentifierKind = "uuid" | "slug" | "legacyId" | "invalid";

export function classifyRulingIdentifier(raw: string): RulingIdentifierKind {
  const id = String(raw || "").trim();
  if (!id || id.length > 200) return "invalid";
  if (UUID_RE.test(id)) return "uuid";
  // مفاتيح أسئلة/مسابقة قديمة — ليست slug حكم
  if (/^(qa-|quiz-)/i.test(id) || id.includes("qa-ruling")) return "legacyId";
  if (id.startsWith("ruling-") || id.startsWith("fiqh-") || id.startsWith("issue-ruling-")) return "slug";
  if (SLUG_RE.test(id)) return "slug";
  if (/^[\w.-]+$/u.test(id)) return "legacyId";
  return "invalid";
}

export function isQuestionLikeTitle(title: string | null | undefined): boolean {
  const t = String(title || "").trim();
  if (!t) return false;
  if (/[؟?]\s*$/u.test(t)) return true;
  if (/^(هل|ما|ماذا|من|كيف|كم|أين|متى|لماذا|بم|بماذا)\b/u.test(t)) return true;
  return false;
}

export function inferRulingContentType(row: {
  id?: string | null;
  external_key?: string | null;
  slug?: string | null;
  title?: string | null;
  content_type?: string | null;
  contentType?: string | null;
}): RulingContentType {
  const explicit = (row.content_type || row.contentType || "").trim();
  if ((RULING_CONTENT_TYPES as readonly string[]).includes(explicit)) {
    return explicit as RulingContentType;
  }

  const key = String(row.external_key || row.slug || row.id || "");
  if (/^qa[-_]/i.test(key) || key.includes("qa-ruling") || key.startsWith("quiz-")) {
    return isQuestionLikeTitle(row.title) ? "quizQuestion" : "educationalQA";
  }
  if (isQuestionLikeTitle(row.title)) {
    return "educationalQA";
  }
  if (key.startsWith("ruling-") || key.startsWith("fiqh-")) {
    return key.startsWith("fiqh-") ? "fiqhIssue" : "ruling";
  }
  return "ruling";
}

export function isAllowedOnRulingsRoute(row: {
  id?: string | null;
  external_key?: string | null;
  slug?: string | null;
  title?: string | null;
  content_type?: string | null;
  contentType?: string | null;
}): boolean {
  return RULINGS_ROUTE_ALLOWED_TYPES.has(inferRulingContentType(row));
}

export function rulingPublicPath(row: {
  id?: string | null;
  external_key?: string | null;
  slug?: string | null;
}): string {
  const slug = String(row.external_key || row.slug || "").trim();
  if (slug && !UUID_RE.test(slug)) return `/rulings/${slug}`;
  return `/rulings/${row.id}`;
}
