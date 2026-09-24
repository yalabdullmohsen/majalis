/**
 * سياسة روابط المصدر الأصلي — v1 بلا رفع PDF.
 */

const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/**
 * يرفض بروتوكولات غير آمنة ويفرض http(s) فقط.
 * لا يفتح توجيهًا مفتوحًا — يُستخدم لاحقًا مع allowlist نطاقات.
 */
export function isSafeExternalHttpUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || BLOCKED_PROTOCOLS.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (!u.hostname || u.hostname === "localhost") return false;
    return true;
  } catch {
    return false;
  }
}

/** v1: لا رفع ملفات. */
export const SCHOLARLY_RESEARCH_PDF_UPLOAD_ALLOWED = false as const;

export const SCHOLARLY_SUGGEST_CTA = "اقترح بحثًا" as const;
export const SCHOLARLY_FORBIDDEN_PUBLISH_CTA = "انشر بحثًا" as const;

/** زر المصدر — ليس تحميلًا من سُنّة. */
export const SCHOLARLY_OPEN_ORIGINAL_CTA = "فتح المصدر الأصلي" as const;
export const SCHOLARLY_FORBIDDEN_HOSTED_DOWNLOAD_CTA = "تحميل من سُنّة" as const;

/**
 * رابط مصدر أصلي آمن للعرض العام — null إن غير صالح.
 * لا يمرّر javascript: ولا localhost.
 */
export function safeOriginalSourceHref(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  return isSafeExternalHttpUrl(raw) ? raw.trim() : null;
}
