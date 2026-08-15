/**
 * سياسة نشر المحتوى — المجلس العلمي
 *
 * القاعدة: يُسمح بنشر الصفحات الناقصة مع وضوح الحالة،
 * وnoindex فقط عند الحالة blocked (خطر شرعي/تضليل).
 */

export type PublishStatus =
  | "published"
  | "partial"
  | "pending_review"
  | "incomplete"
  | "blocked";

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, string> = {
  published: "منشورة",
  partial: "هذه الصفحة قيد الإكمال",
  pending_review:
    "هذه المادة قيد المراجعة الشرعية، تُعرض للفائدة العامة ولا تُعد اعتمادًا نهائيًا.",
  incomplete:
    "هذه المادة مختصرة وقيد الإكمال، وسيُضاف المحتوى والمصدر عند اكتمال التوثيق.",
  blocked: "محجوبة — لا تُعرض للعامة",
};

/** عبارات توثيق ممنوعة بلا مصدر + مراجعة (ادعاءات المنصة، لا أوصاف الكتب الكلاسيكية) */
export const VERIFICATION_CLAIM_PATTERNS = [
  /موثقة\s*بالأدلة|موثّقة\s*بالأدلة/,
  /محتوى\s*معتمد/,
  /مادة\s*معتمدة/,
  /فتوى\s*موثقة|فتوى\s*موثّقة|فتاوى\s*موثقة/,
  /قرار\s*موثق|قرار\s*موثّق|قرارات\s*معتمدة/,
  /جميع\s*العلاقات\s*موثقة|جميع\s*العلاقات\s*موثّقة/,
  /مصدر\s*معتمد\s*(?:من|لدى)\s*المجلس/,
  /مراجع\s*معتمدة/,
  /مكتبة\s*علمية\s*شاملة/,
  /موسوعة\s+الأحكام(?:\s+المعتمدة)?/,
  /محتوى\s*مكتمل/,
];

export function textClaimsVerification(text: string): boolean {
  const t = String(text || "");
  return VERIFICATION_CLAIM_PATTERNS.some((re) => re.test(t));
}

export function hasUsableSource(input: {
  sourceUrl?: string | null;
  source_url?: string | null;
  external_url?: string | null;
  sourceReference?: string | null;
  source_reference?: string | null;
  sources?: string[] | null;
}): boolean {
  if (String(input.sourceUrl || input.source_url || input.external_url || "").trim()) return true;
  if (String(input.sourceReference || input.source_reference || "").trim()) return true;
  if (Array.isArray(input.sources) && input.sources.some((s) => String(s || "").trim())) return true;
  return false;
}

export function isReviewedStatus(status: string | null | undefined): boolean {
  const s = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  return s === "reviewed" || s === "verified" || s === "approved" || s === "published";
}

/**
 * هل يجوز ادعاء التوثيق في النص/الميتا؟
 * يتطلب مصدرًا + حالة مراجعة مكتملة.
 */
export function mayClaimVerified(input: {
  sourceUrl?: string | null;
  source_url?: string | null;
  external_url?: string | null;
  sourceReference?: string | null;
  source_reference?: string | null;
  sources?: string[] | null;
  reviewStatus?: string | null;
  verification_status?: string | null;
  verificationStatus?: string | null;
}): boolean {
  if (!hasUsableSource(input)) return false;
  return isReviewedStatus(
    input.reviewStatus || input.verification_status || input.verificationStatus,
  );
}

export function canIndex(status: PublishStatus): boolean {
  return status !== "blocked";
}

export function canIncludeInSitemap(status: PublishStatus): boolean {
  return status !== "blocked";
}

export function robotsForStatus(status: PublishStatus): "index, follow" | "noindex, follow" {
  return canIndex(status) ? "index, follow" : "noindex, follow";
}

/** تصنيف كتاب مكتبة */
export function classifyLibraryBook(book: {
  title?: string | null;
  description?: string | null;
  external_url?: string | null;
  contentStatus?: string | null;
}): PublishStatus {
  if (book.contentStatus === "needs_review" && !String(book.external_url || "").trim()) {
    /* نقص مصدر فقط = partial وليس blocked */
  }
  const title = String(book.title || "").trim();
  const desc = String(book.description || "").trim();
  if (!title) return "blocked";
  if (!desc || desc.length < 40) return "incomplete";
  if (!String(book.external_url || "").trim()) return "partial";
  return "published";
}

/** تصنيف حكم موسوعة */
export function classifyRuling(row: {
  title?: string | null;
  body?: string | null;
  summary?: string | null;
  status?: string | null;
  verification_status?: string | null;
}): PublishStatus {
  const title = String(row.title || "").trim();
  const body = String(row.body || "").trim();
  const verification = String(row.verification_status || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  const status = String(row.status || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (!title && !body) return "blocked";
  if (verification === "rejected" || status === "rejected" || status === "deleted" || status === "removed") {
    return "blocked";
  }
  if (verification === "archived" || status === "archived") return "blocked";
  if (verification === "draft" || status === "draft") return "blocked";
  if (!title || !body) return "incomplete";
  if (
    verification === "pending_review" ||
    verification === "needs_review" ||
    verification === "pending" ||
    status === "pending_review" ||
    status === "needs_review" ||
    status === "pending"
  ) {
    return "pending_review";
  }
  if (verification === "approved" || verification === "published") return "published";
  return "pending_review";
}

export function classifyHub(opts: {
  claimedComplete: boolean;
  hasRecords: boolean;
  recordCount: number;
}): PublishStatus {
  if (!opts.hasRecords || opts.recordCount <= 0) return "incomplete";
  if (opts.claimedComplete) return "published";
  return "partial";
}

export function sanitizeMetaDescription(text: string, status: PublishStatus): string {
  let out = String(text || "").replace(/\s+/g, " ").trim();
  if (status !== "published") {
    out = out
      .replace(/موثقة\s*بالأدلة|موثّقة\s*بالأدلة/g, "قيد الإكمال")
      .replace(/محتوى\s*معتمد[^.،]*/g, "محتوى قيد الإكمال")
      .replace(/مكتبة\s*شاملة/g, "مجموعة قيد الإكمال")
      .replace(/موسوعة\s+شاملة/g, "قسم قيد الإكمال");
    if (status === "pending_review" && !/قيد المراجعة/.test(out)) {
      out = `${out} — قيد المراجعة الشرعية.`.replace(/\s+/g, " ").trim();
    } else if ((status === "partial" || status === "incomplete") && !/قيد الإكمال/.test(out)) {
      out = `${out} — صفحة قيد الإكمال.`.replace(/\s+/g, " ").trim();
    }
  }
  return out;
}

/** مادة مجمع مختصرة (سطر واحد تقريباً) */
export function isThinFiqhBody(input: {
  summary?: string | null;
  content?: string | null;
  ruling_text?: string | null;
  ruling_summary?: string | null;
  evidence_summary?: string | null;
  description?: string | null;
}): boolean {
  const chunks = [
    input.summary,
    input.content,
    input.ruling_text,
    input.ruling_summary,
    input.evidence_summary,
    input.description,
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  const longest = chunks.reduce((m, s) => Math.max(m, s.length), 0);
  return longest < 80;
}

export function classifyFiqhMaterial(input: {
  title?: string | null;
  status?: string | null;
  summary?: string | null;
  content?: string | null;
  ruling_text?: string | null;
  ruling_summary?: string | null;
  evidence_summary?: string | null;
  description?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  documentation_level?: string | null;
}): PublishStatus {
  const status = String(input.status || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  const title = String(input.title || "").trim();
  if (!title) return "blocked";
  if (status === "rejected" || status === "deleted" || status === "removed") return "blocked";
  if (status === "archived" || status === "draft") return "blocked";
  if (status === "pending_review" || status === "needs_review" || status === "pending") {
    return "pending_review";
  }
  if (isThinFiqhBody(input)) return "incomplete";
  const rulingBlob = [input.ruling_text, input.ruling_summary, input.content, input.summary]
    .map((s) => String(s || ""))
    .join(" ");
  if (/لم يصدر حكم قاطع|تأجيل البت|أوصى.*مزيد من البحث/.test(rulingBlob)) {
    return "partial";
  }
  if (
    input.documentation_level === "official_verified" &&
    hasUsableSource({ sourceUrl: input.source_url, sourceReference: input.source_name })
  ) {
    return "published";
  }
  if (!hasUsableSource({ sourceUrl: input.source_url, sourceReference: input.source_name })) {
    return "partial";
  }
  return "partial";
}

/**
 * هل النص يدّعي توثيقًا بلا أهلية؟
 * يفشل السياسة عندما status ≠ published أو لا مصدر+مراجعة.
 */
export function violatesVerificationClaimPolicy(
  text: string,
  credentials: Parameters<typeof mayClaimVerified>[0],
  status: PublishStatus,
): boolean {
  if (!textClaimsVerification(text)) return false;
  if (status === "blocked") return true;
  if (status === "pending_review" || status === "partial" || status === "incomplete") return true;
  return !mayClaimVerified(credentials);
}

/** صفحة ناقصة بلا تنبيه ظاهر في HTML/نص الواجهة */
export function missingIncompleteNotice(htmlOrText: string, status: PublishStatus): boolean {
  if (status === "published" || status === "blocked") return false;
  const t = String(htmlOrText || "");
  if (status === "pending_review") {
    return !/قيد المراجعة الشرعية|لا تُعد اعتمادًا|لا تعد اعتمادا/i.test(t);
  }
  return !/قيد الإكمال|مختصرة وقيد الإكمال|سيُضاف/i.test(t);
}
