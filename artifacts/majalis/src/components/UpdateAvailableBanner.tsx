import { useCallback, useRef, useState } from "react";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { clearUserRefreshFlag, useVersionCheck } from "@/hooks/useVersionCheck";

export const APPLY_WATCHDOG_MS = 3_000;
const APPLY_FAIL_MSG = "تعذر التحديث تلقائيًا، حاول مرة أخرى أو أغلق التطبيق وافتحه";

/**
 * شيت سفلي عند اكتشاف نشر أحدث عبر /version.json.
 * «تحديث» يفرض SKIP_WAITING + مسح كاش بميزانية زمنية + reload(force) + fallback ?v=
 * «لاحقاً» يغلق فورًا بلا انتظار.
 */
export function UpdateAvailableBanner() {
  const { updateAvailable, applyUpdate, dismissUpdate, shellReady } = useVersionCheck();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const applyingRef = useRef(false);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current != null) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const failApply = useCallback(() => {
    clearWatchdog();
    applyingRef.current = false;
    clearUserRefreshFlag();
    setBusy(false);
    setError(APPLY_FAIL_MSG);
  }, [clearWatchdog]);

  const onLater = useCallback(() => {
    clearWatchdog();
    applyingRef.current = false;
    clearUserRefreshFlag();
    setBusy(false);
    setError(null);
    dismissUpdate();
  }, [clearWatchdog, dismissUpdate]);

  const onUpdate = useCallback(() => {
    // Guard على ref حتى لا يُبتلع الضغط الأول بـ disabled بعد setState غير متزامن (iOS WebView).
    if (applyingRef.current || busy) return;
    applyingRef.current = true;
    setBusy(true);
    setError(null);
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[ssunnah-update] تحديث tapped");
    }

    clearWatchdog();
    watchdogRef.current = window.setTimeout(() => {
      failApply();
    }, APPLY_WATCHDOG_MS);

    void applyUpdate().catch(() => {
      failApply();
    });
  }, [applyUpdate, busy, clearWatchdog, failApply]);

  return (
    <AppBottomSheet
      open={Boolean(updateAvailable && shellReady)}
      onClose={onLater}
      title="تتوفر نسخة جديدة"
      snap="half"
      closeLabel="لاحقاً"
      elevated
      className="update-available-sheet"
      footer={
        <button
          type="button"
          className="app-sheet__close app-sheet__close--primary update-available-sheet__update-btn"
          onClick={onUpdate}
          onPointerUp={(e) => {
            // iOS Capacitor: بعض اللمسات تصل كـ pointer دون click موثوق.
            if (e.pointerType === "touch") onUpdate();
          }}
          disabled={busy}
          aria-busy={busy}
          data-testid="update-available-apply"
        >
          {busy ? "جاري التحديث…" : "تحديث"}
        </button>
      }
    >
      <p className="update-available-sheet__copy">
        نُشرت نسخة أحدث من التطبيق. اضغط «تحديث» لتحميلها، أو «لاحقاً» للمتابعة بالنسخة الحالية.
      </p>
      {error ? (
        <p className="update-available-sheet__error" role="alert" data-testid="update-available-error">
          {error}
        </p>
      ) : null}
    </AppBottomSheet>
  );
}
