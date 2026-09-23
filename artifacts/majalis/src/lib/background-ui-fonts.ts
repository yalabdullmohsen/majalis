/**
 * تسخين خطوط واجهة اختيارية في الخلفية بعد INTERACTIVE.
 * لا Toast · لا remount · لا يحجب الإقلاع.
 */
import { isInteractive, subscribeAppStartup } from "@/lib/app-startup-controller";

let scheduled = false;

function warmOptionalUiFonts(): void {
  try {
    if (typeof document === "undefined" || !document.fonts) return;
    // أوزان Amiri الأساسية محمّلة عند الإقلاع؛ هنا Noto اختياري فقط إن طُلب لاحقًا
    void document.fonts.load('400 16px "Noto Naskh Arabic"').catch(() => {});
  } catch {
    /* ignore */
  }
}

/** يُستدعى مرة من main بعد mount — ينتظر INTERACTIVE ثم يسخّن بهدوء. */
export function scheduleBackgroundUiFontWarm(): void {
  if (scheduled) return;
  scheduled = true;

  const run = () => {
    warmOptionalUiFonts();
  };

  if (isInteractive()) {
    run();
    return;
  }

  const unsub = subscribeAppStartup((next) => {
    if (next === "INTERACTIVE" || next === "BACKGROUND_REFRESH") {
      unsub();
      run();
    }
  });
}
