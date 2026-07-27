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

export function goBackOrFallback(currentPath: string, fallbackHref = "/") {
  const previous = getPreviousInternalRoute(currentPath);
  if (previous && previous !== currentPath) {
    window.history.back();
    return;
  }
  // تنقّل SPA بلا إعادة تحميل — نفس نمط Universal Links في main.tsx
  if (fallbackHref !== currentPath) {
    window.history.pushState({}, "", fallbackHref);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}
