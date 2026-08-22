/**
 * تحميل مسبق للمسارات الأكثر زيارة عند خمول المتصفح.
 */
/** مسارات خفيفة فقط — لا مصحف ولا فقه ولا بحث ولا دروس ثقيلة على إقلاع الرئيسية */
const TOP_ROUTES: Array<() => Promise<unknown>> = [
  () => import("@/pages/account/SectionsPage"),
];

export function prefetchTopRoutesOnIdle(): void {
  if (typeof window === "undefined") return;
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    for (const load of TOP_ROUTES) {
      void load().catch(() => undefined);
    }
  };
  const start = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(run, { timeout: 2_000 });
    } else {
      window.setTimeout(run, 1_500);
    }
  };
  const afterLoad = () => window.setTimeout(start, 10_000);
  if (document.readyState === "complete") afterLoad();
  else window.addEventListener("load", afterLoad, { once: true });
}
