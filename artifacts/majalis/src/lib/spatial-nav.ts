import { normalizeNavPath } from "@/lib/navigation-back";

/** نوع حركة التنقّل المكاني (Instagram-style، بدون framer-motion). */
export type NavMotionKind = "push" | "pop" | "tab" | "modal" | "none";

/** جذور التبويب — مسارات ثابتة لتقليل حزمة الإقلاع. */
const TAB_ROOTS = new Set<string>([
  "/",
  "/quran-hub",
  "/mushaf",
  "/lessons",
  "/prayer-times",
  "/fiqh",
  "/sections",
  "/more",
  "/adhkar",
  "/hadith",
  "/library",
  "/learn",
  "/nations",
  "/seerah",
  "/stats",
]);

/** مسارات تُعامل كشيت/مودال: تدخل من الأسفل. */
const MODAL_PREFIXES = [
  "/search",
  "/settings",
  "/notifications",
  "/privacy-center",
  "/support",
  "/contact",
];

let skipMotionOnce = false;

/** تخطّي حركة الدخول التالية (بعد سحب حافة مكتمل). */
export function skipNextRouteMotion() {
  skipMotionOnce = true;
}

export function consumeSkipRouteMotion(): boolean {
  if (!skipMotionOnce) return false;
  skipMotionOnce = false;
  return true;
}

export function isTabRootPath(path: string): boolean {
  return TAB_ROOTS.has(normalizeNavPath(path));
}

export function routeDepth(path: string): number {
  const p = normalizeNavPath(path);
  if (p === "/") return 0;
  return p.split("/").filter(Boolean).length;
}

export function isModalNavPath(path: string): boolean {
  const p = normalizeNavPath(path);
  return MODAL_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/**
 * يصنّف اتجاه الحركة بين مسارين.
 * popstate يفرض pop؛ تبويبات الجذر = خفوت؛ المودال = من الأسفل؛ وإلا push/pop بالعمق.
 */
export function classifyNavMotion(from: string, to: string, isPop: boolean): NavMotionKind {
  if (consumeSkipRouteMotion()) return "none";
  const a = normalizeNavPath(from);
  const b = normalizeNavPath(to);
  if (a === b) return "none";
  if (isPop) {
    // مغادرة مودال: كشف ناعم للصفحة السابقة (لا دخول من الأسفل).
    if (isModalNavPath(a) && !isModalNavPath(b)) return "tab";
    return "pop";
  }
  if (isTabRootPath(a) && isTabRootPath(b)) return "tab";
  if (isModalNavPath(b) && !isModalNavPath(a)) return "modal";
  if (isModalNavPath(a) && !isModalNavPath(b)) return "pop";
  const da = routeDepth(a);
  const db = routeDepth(b);
  if (db > da) return "push";
  if (db < da) return "pop";
  // نفس العمق: دخول فرعي أو استبدال → push مكاني
  if (b.startsWith(`${a}/`)) return "push";
  if (a.startsWith(`${b}/`)) return "pop";
  return "push";
}

export const NAV_MOTION_MS: Record<Exclude<NavMotionKind, "none">, number> = {
  push: 340,
  pop: 300,
  tab: 220,
  modal: 360,
};

export function reducedMotionPreferred(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
