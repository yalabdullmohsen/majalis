/**
 * احتواء الروابط داخل تطبيق Capacitor — يمنع فتح Safari للمسارات الداخلية،
 * ويفتح الروابط الخارجية عبر Browser plugin مع تأكيد اختياري.
 */
import { Capacitor } from "@capacitor/core";
import { openExternalUrl } from "@/lib/capacitor-utils";

const APP_HOSTS = new Set([
  "www.ssunnah.com",
  "ssunnah.com",
  "majlisilm.com",
  "www.majlisilm.com",
  "localhost",
  "127.0.0.1",
]);

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isAppHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  return (
    APP_HOSTS.has(h) ||
    h.endsWith(".majlisilm.com") ||
    h.endsWith(".ssunnah.com")
  );
}

export function resolveInternalPath(href: string, base = window.location.href): string | null {
  try {
    const u = new URL(href, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!isAppHost(u.hostname)) return null;
    const path = `${u.pathname}${u.search}${u.hash}` || "/";
    if (path.startsWith("//")) return null;
    return path.startsWith("/") ? path : `/${path}`;
  } catch {
    return null;
  }
}

function shouldIgnoreAnchor(a: HTMLAnchorElement): boolean {
  if (a.hasAttribute("download")) return true;
  if (a.dataset.external === "true" || a.dataset.allowExternal === "true") return true;
  const rel = (a.getAttribute("rel") || "").toLowerCase();
  if (rel.includes("external")) return true;
  const href = a.getAttribute("href") || "";
  if (!href || href === "#" || href.startsWith("#")) return true;
  if (/^(mailto:|tel:|sms:|javascript:)/i.test(href)) return true;
  return false;
}

function navigateInApp(path: string): void {
  if (!path.startsWith("/") || path.startsWith("//")) return;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * يُثبَّت مرة واحدة على document capture في البيئة الأصلية فقط.
 */
export function installInAppNavigationGuard(): void {
  if (!isNative()) return;
  if (typeof document === "undefined") return;
  if ((window as unknown as { __mjInAppNav?: boolean }).__mjInAppNav) return;
  (window as unknown as { __mjInAppNav?: boolean }).__mjInAppNav = true;

  document.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const a = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!a || shouldIgnoreAnchor(a)) return;

      const href = a.getAttribute("href") || "";
      const internal = resolveInternalPath(href);
      if (internal) {
        // أي رابط لنطاقاتنا — داخل التطبيق فقط (لا Safari / لا إعادة تحميل بعيدة)
        event.preventDefault();
        event.stopPropagation();
        navigateInApp(internal);
        return;
      }

      // خارجي
      try {
        const abs = new URL(href, window.location.href);
        if (abs.protocol !== "http:" && abs.protocol !== "https:") return;
        event.preventDefault();
        event.stopPropagation();
        void openExternalUrl(abs.toString(), { confirmLeave: true });
      } catch {
        /* ignore */
      }
    },
    true,
  );

  // window.open لنطاقاتنا → تنقل داخلي (يمنع SFSafariViewController → Universal Link → ارتداد)
  const w = window as unknown as { open: typeof window.open; __mjOpenPatched?: boolean };
  if (!w.__mjOpenPatched) {
    w.__mjOpenPatched = true;
    const nativeOpen = window.open.bind(window);
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      if (url != null) {
        const internal = resolveInternalPath(String(url));
        if (internal) {
          navigateInApp(internal);
          return null;
        }
      }
      return nativeOpen(url, target, features);
    }) as typeof window.open;
  }
}
