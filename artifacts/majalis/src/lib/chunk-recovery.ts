/**
 * استعادة موحّدة بعد نشر جديد: chunk hashes قديمة في تبويب مفتوح.
 * ينسّق بين lazyWithRetry و ErrorBoundary حتى لا تظهر شاشة خطأ صلبة
 * أثناء إعادة التحميل التلقائية.
 */
import { safeLocationReload } from "@/lib/safe-reload";
import {
  CHUNK_RELOAD_KEY,
  clearChunkReloadGuard,
  consumeChunkReloadAllowance,
  isChunkLoadError,
} from "@/lib/lazy-with-retry";

export const CHUNK_RECOVERING_EVENT = "majalis:chunk-recovering";
export { isChunkLoadError, clearChunkReloadGuard, CHUNK_RELOAD_KEY };

let recoveryInFlight = false;

export function isChunkRecoveryInFlight(): boolean {
  return recoveryInFlight;
}

function announceRecovering(): void {
  try {
    window.dispatchEvent(
      new CustomEvent(CHUNK_RECOVERING_EVENT, {
        detail: { message: "تم تحديث المنصة، جاري تحسين العرض…" },
      }),
    );
  } catch {
    /* ignore */
  }
}

/** اطلب من SW حذف كاش القشرة/الأصول غير الموثوقة قبل reload. */
function requestSwShellPurge(): void {
  try {
    const ctrl = navigator.serviceWorker?.controller;
    ctrl?.postMessage({ type: "MAJALIS_PURGE_SHELL_ASSETS" });
  } catch {
    /* ignore */
  }
}

/**
 * محاولة استعادة واحدة لكل جلسة تبويب.
 * تُرجع true إن شُرعت الاستعادة (أو كانت جارية) — لا تعرض خطأً صلبًا.
 */
export function tryRecoverFromStaleChunk(label = "1"): boolean {
  if (typeof window === "undefined") return false;
  if (recoveryInFlight) return true;
  if (!consumeChunkReloadAllowance(label)) return false;

  recoveryInFlight = true;
  announceRecovering();
  requestSwShellPurge();

  // تأخير قصير ليظهر المؤشر قبل reload، وليفوز postMessage إلى SW.
  window.setTimeout(() => {
    safeLocationReload({ force: true });
  }, 80);
  return true;
}

/**
 * استعادة أقوى بعد فشل المحاولة الأولى: مسح Cache Storage + إلغاء SW.
 * يُستدعى من زر المستخدم فقط (لا حلقة تلقائية).
 */
export async function hardRecoverStaleDeploy(): Promise<void> {
  recoveryInFlight = true;
  announceRecovering();
  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  try {
    if (navigator.serviceWorker?.getRegistrations) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* ignore */
  }
  clearChunkReloadGuard();
  try {
    sessionStorage.removeItem("majalis-safe-reload-ts");
  } catch {
    /* ignore */
  }
  window.location.reload();
}
