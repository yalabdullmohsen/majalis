/** Shared library content-type logic (used by app + regression tests). */

export const CONTENT_TYPES = ["book", "article", "research"];

export const CONTENT_TYPE_LABELS = {
  book: "كتاب",
  article: "مقال",
  research: "بحث",
};

export const LIBRARY_ROUTES = {
  hub: "/library",
  books: "/library/books",
  articles: "/library/articles",
  research: "/research",
};

export const PUBLIC_ALIASES = {
  books: "/books",
  articles: "/articles",
  research: "/research",
};

const LEGACY_TYPE_MAP = {
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

export function isContentType(v) {
  return typeof v === "string" && CONTENT_TYPES.includes(v);
}

export function classifyContentType(row) {
  if (isContentType(row.content_type)) return row.content_type;

  const blob = `${row.title || ""} ${row.description || ""} ${row.category || ""}`.toLowerCase();
  if (RESEARCH_KEYWORDS.some((k) => blob.includes(k))) return "research";

  const legacy = String(row.type || row.item_type || "").trim();
  if (legacy && LEGACY_TYPE_MAP[legacy]) return LEGACY_TYPE_MAP[legacy];

  if (ARTICLE_KEYWORDS.some((k) => blob.includes(k))) return "article";
  if (BOOK_KEYWORDS.some((k) => blob.includes(k))) return "book";
  if (legacy === "مقال") return "article";
  if (legacy) return "book";

  return null;
}

export function inferContentTypeFromFileName(name) {
  const n = name.toLowerCase();
  if (/thesis|dissertation|research|رسالة|ماجستير|دكتورah/.test(n)) return "research";
  if (/article|مقال|essay/.test(n)) return "article";
  return "book";
}

export function inferContentTypeFromCmsKind(kind) {
  if (kind === "article") return "article";
  if (kind === "book") return "book";
  return "book";
}

export function validateContentTypeForSection(contentType, section) {
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

export function assertNoCrossContamination(items, expected) {
  return items.filter((item) => {
    const ct = item.content_type ?? classifyContentType(item);
    return ct === expected;
  });
}

export function detailPath(contentType, id) {
  switch (contentType) {
    case "book":
      return `${LIBRARY_ROUTES.books}/${id}`;
    case "article":
      return `${LIBRARY_ROUTES.articles}/${id}`;
    case "research":
      return `${LIBRARY_ROUTES.research}/${id}`;
    default:
      return `${LIBRARY_ROUTES.hub}/${id}`;
  }
}

export function listPath(contentType) {
  switch (contentType) {
    case "book":
      return LIBRARY_ROUTES.books;
    case "article":
      return LIBRARY_ROUTES.articles;
    case "research":
      return LIBRARY_ROUTES.research;
    default:
      return LIBRARY_ROUTES.hub;
  }
}

/** Split mixed library search rows — research must never land in books/articles buckets. */
export function splitLibrarySearchRows(rows) {
  const books = [];
  const articles = [];
  for (const row of rows) {
    const ct =
      row.content_type === "research" || classifyContentType(row) === "research"
        ? "research"
        : row.content_type === "article" || row.type === "مقال"
          ? "article"
          : "book";
    if (ct === "research") continue;
    if (ct === "article") articles.push(row);
    else books.push(row);
  }
  return { books, articles, library: books };
}

/** Reject library_items payloads that belong in research_papers. */
export function rejectResearchInLibraryItems(payload) {
  const ct = classifyContentType(payload);
  if (ct === "research") {
    return { ok: false, error: "research must use research_papers, not library_items" };
  }
  return { ok: true, contentType: ct || payload.content_type };
}

/** Publishing guard — approved library_items require content_type book|article only. */
export function canPublishLibraryItem(row) {
  if (row.status !== "approved") return { ok: true };
  const ct = row.content_type ?? classifyContentType(row);
  if (!ct) return { ok: false, error: "missing content_type" };
  if (ct === "research") return { ok: false, error: "research cannot publish to library_items" };
  if (!isContentType(ct) || (ct !== "book" && ct !== "article")) {
    return { ok: false, error: `invalid content_type: ${ct}` };
  }
  return { ok: true, contentType: ct };
}
