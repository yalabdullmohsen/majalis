/**
 * Native deep-link path resolver for Capacitor iOS/Android.
 * Supports:
 * - https://majlisilm.com/prayer-times?...
 * - majlisilm://prayer-times?...
 * - majlisilm:///prayer-times?...
 */
export function resolveNativeDeepLinkPath(url: string): string | null {
  // Reject traversal before URL normalization swallows ".."
  if (url.includes("..")) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const scheme = parsed.protocol.replace(/:$/, "").toLowerCase();
  let path = "";

  if (scheme === "http" || scheme === "https") {
    path = `${parsed.pathname || "/"}${parsed.search}${parsed.hash}`;
  } else if (scheme === "majlisilm") {
    // Custom scheme forms:
    //   majlisilm://prayer-times          → host=prayer-times, path=/
    //   majlisilm:///mushaf               → host=, path=/mushaf
    //   majlisilm://fiqh/topics/tahara    → host=fiqh, path=/topics/tahara
    const host = parsed.hostname || "";
    const pathname = parsed.pathname || "";
    if (host && pathname && pathname !== "/") {
      path = `/${host}${pathname}${parsed.search}${parsed.hash}`.replace(/\/{2,}/g, "/");
    } else if (host) {
      path = `/${host}${parsed.search}${parsed.hash}`;
    } else if (pathname.startsWith("/")) {
      path = `${pathname}${parsed.search}${parsed.hash}`;
    } else {
      path = `/${pathname}${parsed.search}${parsed.hash}`;
    }
  } else {
    return null;
  }

  if (!path.startsWith("/")) path = `/${path}`;
  // Block path traversal
  if (path.includes("..")) return null;
  return path;
}

export function shouldNavigateNativeDeepLink(current: string, next: string | null): boolean {
  if (!next) return false;
  return next !== current;
}
