const STACK_KEY = "majalis:navigation-stack:v1";

function readStack(): string[] {
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string" && v.startsWith("/")) : [];
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

export function recordNavigationVisit(path: string, mode: "push" | "pop" = "push") {
  const stack = readStack();
  const last = stack[stack.length - 1];
  if (mode === "pop") {
    if (stack.length > 1 && stack[stack.length - 2] === path) {
      stack.pop();
      writeStack(stack);
      return;
    }
  }
  if (last !== path) {
    stack.push(path);
    writeStack(stack);
  }
}

export function getPreviousInternalRoute(currentPath: string): string | null {
  const stack = readStack();
  if (stack.length < 2) return null;
  const last = stack[stack.length - 1];
  if (last !== currentPath) return last || null;
  return stack[stack.length - 2] || null;
}

/**
 * عند غياب تاريخ داخلي (رابط عميق / cold start) نرجع لقسم أب منطقي
 * بدل القفز دائمًا إلى الرئيسية.
 */
export function sectionAwareFallback(currentPath: string): string {
  const p = currentPath.replace(/\/+$/, "") || "/";
  if (p === "/" || p === "") return "/";
  if (p.startsWith("/mushaf") || p.startsWith("/quran-hub") || p.startsWith("/quran")) return "/mushaf";
  if (p.startsWith("/prayer") || p.startsWith("/qibla") || p.startsWith("/adhan") || p.startsWith("/tasbih")) {
    return "/prayer-times";
  }
  if (p.startsWith("/fiqh-council")) return "/fiqh-council";
  if (p.startsWith("/fiqh")) return "/fiqh";
  if (p.startsWith("/hadith")) return "/hadith";
  if (p.startsWith("/lessons") || p.startsWith("/kuwait-lessons")) return "/lessons";
  if (p.startsWith("/adhkar") || p.startsWith("/daily-wird")) return "/adhkar";
  if (p.startsWith("/discover-islam")) return "/discover-islam";
  if (p.startsWith("/library")) return "/library";
  if (p.startsWith("/learn") || p.startsWith("/learning")) return "/learn";
  if (p.startsWith("/admin")) return "/admin";
  if (p.startsWith("/fawaid")) return "/fawaid";
  if (p.startsWith("/seerah") || p.startsWith("/prophet")) return "/seerah";
  const parts = p.split("/").filter(Boolean);
  if (parts.length >= 2) return `/${parts[0]}`;
  return "/";
}

export function goBackOrFallback(currentPath: string, fallbackHref?: string) {
  const previous = getPreviousInternalRoute(currentPath);
  if (previous && previous !== currentPath) {
    window.history.back();
    return;
  }
  const target = fallbackHref ?? sectionAwareFallback(currentPath);
  // تنقّل SPA بلا إعادة تحميل — نفس نمط Universal Links في main.tsx
  if (target !== currentPath) {
    window.history.pushState({}, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}
