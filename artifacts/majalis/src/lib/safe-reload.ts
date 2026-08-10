/**
 * إعادة تحميل الصفحة مع حماية من التكرار خلال نافذة قصيرة.
 * يمنع سباقًا بين Service Worker (controllerchange) وفحص /version.json
 * يُنتج reloadين متتاليين.
 *
 * `force: true` لتجاوز الحارس عند استعادة chunk بعد نشر (مسار حرج).
 */
const GUARD_KEY = "majalis-safe-reload-ts";
const GUARD_WINDOW_MS = 4000;

export function safeLocationReload(opts?: { force?: boolean }): void {
  if (!opts?.force) {
    try {
      const raw = sessionStorage.getItem(GUARD_KEY);
      if (raw != null) {
        const last = Number(raw);
        const now = Date.now();
        if (Number.isFinite(last) && now - last < GUARD_WINDOW_MS) return;
      }
      sessionStorage.setItem(GUARD_KEY, String(Date.now()));
    } catch {
      /* sessionStorage قد يُرفض في وضع خاص — نتابع reload واحدًا */
    }
  } else {
    try {
      sessionStorage.setItem(GUARD_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }
  window.location.reload();
}
