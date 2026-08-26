/**
 * نص مشاركة «فائدة من المجلس العلمي» — موحّد للصفحات المهمة.
 */
import { absoluteUrl, normalizeCanonicalUrl } from "@/lib/site-config";

export function buildFaidaShareText(title: string, url: string): string {
  const cleanTitle = title.trim() || "المجلس العلمي";
  const cleanUrl = normalizeCanonicalUrl(url);
  return `فائدة من المجلس العلمي:\n${cleanTitle}\n${cleanUrl}`;
}

export function resolveShareUrl(pathOrUrl?: string): string {
  if (typeof window !== "undefined" && !pathOrUrl) {
    return normalizeCanonicalUrl(window.location.href);
  }
  if (!pathOrUrl) return absoluteUrl("/");
  if (/^https?:\/\//i.test(pathOrUrl)) return normalizeCanonicalUrl(pathOrUrl);
  return absoluteUrl(pathOrUrl);
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function nativeShareFaida(title: string, url: string): Promise<"shared" | "copied" | "cancelled"> {
  const text = buildFaidaShareText(title, url);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: "المجلس العلمي", text, url });
      return "shared";
    }
    const ok = await copyShareText(text);
    return ok ? "copied" : "cancelled";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    const ok = await copyShareText(text);
    return ok ? "copied" : "cancelled";
  }
}
