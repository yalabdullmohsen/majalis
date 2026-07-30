/**
 * هوية المنصة — المصدر الوحيد.
 * القيم من site.config.json، وهو نفسه ما تقرؤه سكربتات البناء، فلا يتفرّع الاسم أو النطاق.
 */
import config from "../../site.config.json";

export const SITE_NAME = config.siteName;
export const SITE_SHORT_NAME = config.siteShortName;
export const SITE_DESCRIPTION = config.siteDescription;
export const SITE_URL = config.siteUrl;
export const TITLE_SUFFIX = config.titleSuffix;
/** بريد التواصل الرسمي الوحيد للمنصة كاملةً — لا تكتب بريدًا آخر يدويًا في أي مكوّن. */
export const CONTACT_EMAIL = config.contactEmail;
export const DEFAULT_IMAGE = config.defaultImage;

/** رابط mailto: بموضوع محدَّد مسبقًا حسب نوع الطلب (استفسار عام، إبلاغ خطأ...). */
export function mailtoWithSubject(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/** صيغة العنوان المعتمدة: «[اسم الصفحة] | المجلس العلمي». الرئيسية وحدها بلا لاحقة. */
export function pageTitle(pageName?: string | null): string {
  const name = (pageName || "").trim();
  if (!name || name === SITE_NAME) return SITE_NAME;
  if (name.endsWith(TITLE_SUFFIX)) return name;
  return `${name}${TITLE_SUFFIX}`;
}

/** رابط مطلق على النطاق المعتمد. */
export function absoluteUrl(path: string): string {
  return new URL(path || "/", SITE_URL).toString();
}

/**
 * Convert any same-site / legacy-www absolute URL into a path for SPA navigation.
 * Rejects cross-origin URLs so history.pushState never throws SecurityError.
 */
export function toAppPath(href: string, currentOrigin?: string): string | null {
  const raw = String(href || "").trim();
  if (!raw) return null;
  if (raw.includes("..")) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  // Relative non-path inputs (e.g. "lessons/x") are not SPA-safe here.
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw) && !raw.startsWith("//")) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw, currentOrigin || SITE_URL);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = new Set<string>([
    "majlisilm.com",
    "www.majlisilm.com",
    ...((config.legacyOrigins || []) as string[]).map((o) => {
      try {
        return new URL(o).hostname.toLowerCase();
      } catch {
        return "";
      }
    }).filter(Boolean),
  ]);
  if (currentOrigin) {
    try {
      allowed.add(new URL(currentOrigin).hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  if (!allowed.has(host)) return null;
  const path = `${parsed.pathname || "/"}${parsed.search}${parsed.hash}`;
  if (path.includes("..")) return null;
  return path;
}

/** Guard for router navigation — never pass absolute cross-origin URLs to pushState/navigate. */
export function assertAppNavigationHref(href: string): asserts href is string {
  if (/^https?:\/\//i.test(href) || href.startsWith("//")) {
    throw new Error(`cross_origin_navigation_blocked:${href}`);
  }
  if (!href.startsWith("/")) {
    throw new Error(`non_path_navigation_blocked:${href}`);
  }
}
