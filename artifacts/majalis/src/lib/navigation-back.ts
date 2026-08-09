const STACK_KEY = "majalis:navigation-stack:v1";
/** عدد تنقّلات SPA للأمام في جلسة المستند الحالية — يمنع history.back() عند cold start. */
const SPA_PUSH_KEY = "majalis:nav-spa-pushes:v1";

/** يوحّد مسار المقارنة: pathname فقط بلا ?# وبلا شرطة مائلة زائدة. */
export function normalizeNavPath(path: string): string {
  const raw = String(path || "/").trim() || "/";
  try {
    const u = new URL(raw, "https://majlisilm.local");
    return u.pathname.replace(/\/+$/, "") || "/";
  } catch {
    const bare = raw.split("?")[0].split("#")[0];
    return bare.replace(/\/+$/, "") || "/";
  }
}

function readStack(): string[] {
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((v): v is string => typeof v === "string" && v.startsWith("/"))
          .map(normalizeNavPath)
      : [];
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-40)));
  } catch {
    /* ignore storage issues */
  }
}

function readSpaPushCount(): number {
  try {
    const n = Number(sessionStorage.getItem(SPA_PUSH_KEY) || "0");
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeSpaPushCount(n: number) {
  try {
    sessionStorage.setItem(SPA_PUSH_KEY, String(Math.max(0, n)));
  } catch {
    /* ignore */
  }
}

export function recordNavigationVisit(path: string, mode: "push" | "pop" = "push") {
  const normalized = normalizeNavPath(path);
  const stack = readStack();
  const last = stack[stack.length - 1];
  if (mode === "pop") {
    if (stack.length > 1 && stack[stack.length - 2] === normalized) {
      stack.pop();
      writeStack(stack);
      writeSpaPushCount(Math.max(0, readSpaPushCount() - 1));
      return;
    }
  }
  if (last !== normalized) {
    stack.push(normalized);
    writeStack(stack);
    if (mode === "push") writeSpaPushCount(readSpaPushCount() + 1);
  }
}

export function getPreviousInternalRoute(currentPath: string): string | null {
  const current = normalizeNavPath(currentPath);
  const stack = readStack();
  if (stack.length < 2) return null;
  const last = stack[stack.length - 1];
  if (last !== current) return last || null;
  return stack[stack.length - 2] || null;
}

/**
 * عند غياب تاريخ داخلي (رابط عميق / cold start) نرجع لقسم أب منطقي
 * بدل القفز دائمًا إلى الرئيسية.
 */
export function sectionAwareFallback(currentPath: string): string {
  const p = normalizeNavPath(currentPath);
  if (p === "/" || p === "") return "/";
  if (p.startsWith("/mushaf")) return "/quran-hub";
  if (p === "/quran-hub" || p.startsWith("/quran-hub/")) return "/quran-hub";
  if (p === "/quran-memorization" || p.startsWith("/quran/memorization")) return "/quran-memorization";
  if (p.startsWith("/quran-circles")) return "/quran-circles";
  if (p.startsWith("/quran/recitation")) return "/quran-hub";
  if (p === "/quran" || p.startsWith("/quran/")) return "/quran-hub";
  if (p.startsWith("/prayer") || p.startsWith("/qibla") || p.startsWith("/adhan") || p.startsWith("/tasbih")) {
    return "/prayer-times";
  }
  if (p.startsWith("/fiqh-council")) return "/fiqh-council";
  if (p.startsWith("/fiqh")) return "/fiqh";
  if (p.startsWith("/hadith")) return "/hadith";
  if (p.startsWith("/lessons") || p.startsWith("/kuwait-lessons")) return "/lessons";
  if (p.startsWith("/adhkar") || p.startsWith("/daily-wird")) return "/adhkar";
  if (p.startsWith("/discover-islam")) return "/discover-islam";
  if (p.startsWith("/library")) return "/";
  if (p.startsWith("/learn") || p.startsWith("/learning")) return "/learn";
  if (p.startsWith("/admin")) return "/admin";
  if (p.startsWith("/fawaid")) return "/fawaid";
  if (p.startsWith("/nations/")) return "/nations";
  if (p.startsWith("/seerah") || p.startsWith("/prophet")) return "/seerah";
  if (p.startsWith("/search")) return "/search";
  const parts = p.split("/").filter(Boolean);
  if (parts.length >= 2) return `/${parts[0]}`;
  return "/";
}

/**
 * رجوع آمن: history.back فقط إن سُجِّل تنقّل SPA في هذه الجلسة،
 * وإلا دفع fallback داخلي بلا الخروج من التطبيق.
 */
export function goBackOrFallback(currentPath: string, fallbackHref?: string) {
  const current = normalizeNavPath(currentPath);
  const previous = getPreviousInternalRoute(current);
  const spaPushes = readSpaPushCount();
  const canUseHistoryBack =
    Boolean(previous && previous !== current) &&
    spaPushes > 0 &&
    typeof window !== "undefined" &&
    window.history.length > 1;

  if (canUseHistoryBack) {
    writeSpaPushCount(spaPushes - 1);
    window.history.back();
    return;
  }

  const target = normalizeNavPath(fallbackHref ?? sectionAwareFallback(current));
  if (target !== current) {
    window.history.pushState({}, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}
