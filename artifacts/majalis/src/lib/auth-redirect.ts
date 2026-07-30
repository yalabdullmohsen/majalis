/**
 * روابط استعادة/تأكيد/OAuth يجب أن تعود إلى النطاق الإنتاجي majlisilm.com
 * وليس إلى capacitor://localhost أو origin مؤقت — وإلا تكسر روابط البريد.
 */
import { SITE_URL } from "@/lib/site-config";

const SITE = SITE_URL.replace(/\/$/, "");

/** يسمح فقط بمسارات داخلية نسبية آمنة — يرفض //evil.com وjavascript: وغيرها. */
export function sanitizeAuthNext(raw: string | null | undefined): string {
  const next = String(raw || "/").trim() || "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  if (next.includes("://")) return "/";
  if (/[\s\\]/.test(next)) return "/";
  if (!/^\/[A-Za-z0-9._~/-]*$/.test(next)) return "/";
  return next;
}

/** مسار callback مطلق على majlisilm.com مع next داخلي آمن اختياري. */
export function getAuthCallbackUrl(nextPath?: string | null): string {
  const next = sanitizeAuthNext(nextPath);
  if (next && next !== "/") {
    return `${SITE}/auth/callback?next=${encodeURIComponent(next)}`;
  }
  return `${SITE}/auth/callback`;
}

/** رابط تأكيد البريد / استعادة كلمة المرور. */
export function getAuthEmailRedirectUrl(nextPath?: string | null): string {
  return getAuthCallbackUrl(nextPath);
}
