/** Mandatory content type — separates books, articles, and research. */
export const CONTENT_TYPES = ["book", "article", "research"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  book: "كتاب",
  article: "مقال",
  research: "بحث",
};

export const LIBRARY_ROUTES = {
  hub: "/library",
  books: "/library/books",
  articles: "/library/articles",
  research: "/research",
} as const;

export const PUBLIC_ALIASES = {
  books: "/books",
  articles: "/articles",
  research: "/research",
} as const;

/** Legacy Arabic `type` → canonical content_type */
const LEGACY_TYPE_MAP: Record<string, ContentType> = {
  كتاب: "book",
  متن: "book",
  شروح: "book",
  موسوعة: "book",
  مخطوط: "book",
  مقال: "article",
  تفريغ: "article",
  ملخص: "article",
  صوت: "book",
  مرئي: "book",
};

const BOOK_KEYWORDS = ["كتاب", "متن", "شروح", "موسوعة", "مخطوط", "صحيح", "سنن", "تفسير"];
const ARTICLE_KEYWORDS = ["مقال", "تفريغ", "ملخص", "بحث قصير"];
const RESEARCH_KEYWORDS = ["رسالة", "ماجستير", "دكتوراه", "dissertation", "thesis", "محكمة"];

export function isContentType(v: unknown): v is ContentType {
  return typeof v === "string" && CONTENT_TYPES.includes(v as ContentType);
}

export function classifyContentType(row: {
  content_type?: unknown;
  type?: unknown;
  item_type?: unknown;
  title?: unknown;
  description?: unknown;
  category?: unknown;
}): ContentType | null {
  if (isContentType(row.content_type)) return row.content_type;

  const legacy = String(row.type || row.item_type || "").trim();
  if (legacy && LEGACY_TYPE_MAP[legacy]) return LEGACY_TYPE_MAP[legacy];

  const blob = `${row.title || ""} ${row.description || ""} ${row.category || ""}`.toLowerCase();
  if (RESEARCH_KEYWORDS.some((k) => blob.includes(k))) return "research";
  if (ARTICLE_KEYWORDS.some((k) => blob.includes(k))) return "article";
  if (BOOK_KEYWORDS.some((k) => blob.includes(k))) return "book";
  if (legacy === "مقال") return "article";
  if (legacy) return "book";

  return null;
}

export function inferContentTypeFromFileName(name: string): ContentType {
  const n = name.toLowerCase();
  if (/thesis|dissertation|research|رسالة|ماجستير|دكتورah/.test(n)) return "research";
  if (/article|مقال|essay/.test(n)) return "article";
  return "book";
}

export function inferContentTypeFromCmsKind(kind: string): ContentType {
  if (kind === "article") return "article";
  if (kind === "book") return "book";
  return "book";
}

/** Reject publish if content_type missing or mismatched with section. */
export function validateContentTypeForSection(
  contentType: unknown,
  section: ContentType,
): { ok: true; contentType: ContentType } | { ok: false; error: string } {
  if (!isContentType(contentType)) {
    return { ok: false, error: "حقل content_type إلزامي (book | article | research)" };
  }
  if (contentType !== section) {
    return {
      ok: false,
      error: `نوع المحتوى "${contentType}" لا يطابق القسم "${section}"`,
    };
  }
  return { ok: true, contentType };
}

export function assertNoCrossContamination<T extends { content_type?: ContentType }>(
  items: T[],
  expected: ContentType,
): T[] {
  return items.filter((item) => {
    const ct = item.content_type ?? classifyContentType(item);
    return ct === expected;
  });
}

export function detailPath(contentType: ContentType, id: string): string {
  switch (contentType) {
    case "book":
      return `${LIBRARY_ROUTES.books}/${id}`;
    case "article":
      return `${LIBRARY_ROUTES.articles}/${id}`;
    case "research":
      return `${LIBRARY_ROUTES.research}/${id}`;
  }
}

export function listPath(contentType: ContentType): string {
  switch (contentType) {
    case "book":
      return LIBRARY_ROUTES.books;
    case "article":
      return LIBRARY_ROUTES.articles;
    case "research":
      return LIBRARY_ROUTES.research;
  }
}

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
  const content_type = classifyContentType(row) ?? defaultType;
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
