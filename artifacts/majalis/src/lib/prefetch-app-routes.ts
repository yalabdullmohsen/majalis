/**
 * تسخين هيكل المسارات + صفحات التبويب — يُستدعى عند نية التنقّل (pointer/touch)
 * حتى لا يدفع الزائر ثمن تحميل AppRoutes ثم الصفحة على التوالي.
 */
let appRoutesWarm = false;

export function prefetchAppRoutesShell(): void {
  if (appRoutesWarm || typeof window === "undefined") return;
  appRoutesWarm = true;
  void import("@/AppRoutes").catch(() => {
    appRoutesWarm = false;
  });
}
