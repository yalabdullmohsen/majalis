/**
 * Unregister stale service workers after deploy — prevents broken cached JS chunks.
 */
export async function purgeStaleServiceWorkers(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      const scriptUrl = reg.active?.scriptURL || reg.waiting?.scriptURL || "";
      if (scriptUrl && !scriptUrl.includes("/sw.js")) {
        await reg.unregister();
      }
    }
  } catch {
    /* ignore — SW not critical for app boot */
  }
}

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 1000; // فحص فعلي للسكربت كل دقيقة أثناء الاستخدام

export function registerProductionServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  // عند تفعيل SW جديد (skipWaiting + clients.claim من طرف sw.js → controllerchange
  // يُطلَق تلقائيًا في كل تبويب مفتوح حسب مواصفة Service Worker) أعد تحميل الصفحة
  // تلقائيًا فورًا — بلا انتظار ضغطة مستخدم، بأمر صريح من المالك.
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    void purgeStaleServiceWorkers().then(() => {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        // الفجوة الحقيقية المتبقية: registration.update() الافتراضي في
        // المتصفحات (خصوصًا Safari/iOS، جمهور المنصة الأساسي) قد يتأخر
        // ساعات قبل التحقق من تغيّر سكربت sw.js فعليًا على الخادم — بلا هذا،
        // controllerchange أعلاه لن يُطلَق أصلًا رغم نشر إصدار جديد.
        // نفرض تحققًا فعليًا متكررًا بدل انتظار مؤقّت المتصفح الداخلي.
        const forceCheck = () => { void registration.update().catch(() => undefined); };
        forceCheck();
        window.setInterval(forceCheck, SW_UPDATE_CHECK_INTERVAL_MS);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") forceCheck();
        });
      }).catch((error) => {
        console.warn("[majalis:pwa] service worker registration failed", error);
      });
    });
  });
}
