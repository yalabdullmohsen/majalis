import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { BUTTON, EMPTY } from "@/lib/ui-copy";
import "@/styles/components/language-offline.css";

type Status = "online" | "offline" | "back-online";

/** تشخيصات DEV فقط — رسائل المزامنة الصامتة لا تظهر للمستخدم العام. */
function isDevDiagnostics(): boolean {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
}

async function readPendingCount(): Promise<number> {
  try {
    const { outboxPendingCount } = await import("@/lib/sync-outbox");
    return await outboxPendingCount();
  } catch {
    return 0;
  }
}

export function OfflineBanner() {
  const [status, setStatus] = useState<Status>(
    !navigator.onLine ? "offline" : "online"
  );
  const [pending, setPending] = useState(0);
  const diagnostics = isDevDiagnostics();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refreshPending = () => {
      void readPendingCount().then(setPending);
    };
    refreshPending();

    const goOnline = () => {
      clearTimeout(timer);
      setStatus("back-online");
      refreshPending();
      timer = setTimeout(() => setStatus("online"), 3000);
    };
    const goOffline = () => {
      clearTimeout(timer);
      setStatus("offline");
      refreshPending();
    };
    const onOutbox = () => refreshPending();

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("majalis-outbox-flushed", onOutbox);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("majalis-outbox-flushed", onOutbox);
      clearTimeout(timer);
    };
  }, []);

  const showOffline = status === "offline";
  const showBack = status === "back-online";
  /* BACKGROUND_SUCCESS: مزامنة معلّقة أثناء الاتصال — DEV diagnostics فقط */
  const showPendingOnly = diagnostics && status === "online" && pending > 0;

  if (!showOffline && !showBack && !showPendingOnly) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={
        showOffline
          ? "أنت غير متصل بالإنترنت"
          : showPendingOnly
            ? "مزامنة معلّقة"
            : "عاد الاتصال"
      }
      className={`offline-banner${showBack ? " offline-banner--back" : ""}${showPendingOnly ? " offline-banner--pending" : ""}`}
      data-startup-toast-kind={showPendingOnly ? "DEBUG_ONLY" : showOffline ? "USER_ACTION_REQUIRED" : "RECOVERABLE_ERROR"}
    >
      {showOffline ? (
        <>
          <WifiOff size={14} aria-hidden="true" className="offline-banner__icon" />
          <span className="offline-banner__text">
            {EMPTY.offline}
            {pending > 0 ? ` · ${pending} تغيير بانتظار المزامنة` : ""}
          </span>
          <button
            type="button"
            className="offline-banner__retry mj-pressable"
            onClick={() => {
              /* بلا location.reload — فحص اتصال ناعم فقط */
              if (typeof navigator !== "undefined" && navigator.onLine) {
                setStatus("back-online");
                void readPendingCount().then(setPending);
                window.setTimeout(() => setStatus("online"), 3000);
              }
            }}
          >
            {BUTTON.retry}
          </button>
        </>
      ) : showPendingOnly ? (
        <>
          <RefreshCw size={14} aria-hidden="true" className="offline-banner__icon" />
          <span className="offline-banner__text">
            [dev] محفوظ محليًا — تتم مزامنة {pending} عنصرًا
          </span>
        </>
      ) : (
        <>
          <Wifi size={14} aria-hidden="true" className="offline-banner__icon" />
          <span className="offline-banner__text">عاد الاتصال بالإنترنت</span>
        </>
      )}
    </div>
  );
}
