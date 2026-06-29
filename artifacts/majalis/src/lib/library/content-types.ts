/** Mandatory content type — separates books, articles, and research. */
export {
  CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  LIBRARY_ROUTES,
  PUBLIC_ALIASES,
  isContentType,
  classifyContentType,
  inferContentTypeFromFileName,
  inferContentTypeFromCmsKind,
  validateContentTypeForSection,
  assertNoCrossContamination,
  detailPath,
  listPath,
} from "../../../lib/library/content-types.mjs";

import { classifyContentType } from "../../../lib/library/content-types.mjs";

export type ContentType = "book" | "article" | "research";

export function hubLabel(contentType: ContentType): string {
  switch (contentType) {
    case "book":
      return "الكتب";
    case "article":
      return "المقالات";
    case "research":
      return "الأبحاث العلمية";
  }
}

export function normalizeContentTypeFields(
  row: Record<string, unknown>,
  defaultType: ContentType = "book",
): Record<string, unknown> {
  const content_type = (classifyContentType(row) ?? defaultType) as ContentType;
  const legacyType = String(row.type || row.item_type || "").trim();
  const type =
    content_type === "article"
      ? legacyType || "مقال"
      : legacyType || "كتاب";

  return {
    ...row,
    content_type,
    type,
    item_type: type,
  };
}
