import { isImmersiveChromePath } from "@/lib/immersive-chrome";

/** صفحات القراءة المركزة — لا زر عائم فوق المحتوى. */
const READING_FOCUS = new Set(["/library", "/search", "/quiz"]);

export function isAssistantFabHiddenPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/assistant" || p.startsWith("/admin")) return true;
  if (isImmersiveChromePath(p)) return true;
  if (READING_FOCUS.has(p)) return true;
  if (p.startsWith("/library/")) return true;
  return false;
}
