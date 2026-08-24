import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import "@/styles/components/language-offline.css";

type Status = "online" | "offline" | "back-online";

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

  if (status === "online" && pending === 0) return null;

  const showOffline = status === "offline";
  const showBack = status === "back-online";
  const showPendingOnly = status === "online" && pending > 0;

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
    >
      {showOffline ? (
        <>
          <WifiOff size={14} aria-hidden="true" className="offline-banner__icon" />
          <span className="offline-banner__text">
            أنت غير متصل، سيتم عرض المحتوى المحفوظ
            {pending > 0 ? ` · ${pending} تغيير بانتظار المزامنة` : ""}
          </span>
        </>
      ) : showPendingOnly ? (
        <>
          <RefreshCw size={14} aria-hidden="true" className="offline-banner__icon" />
          <span className="offline-banner__text">محفوظ محليًا — جاري مزامنة {pending} عنصرًا</span>
        </>
      ) : (
        <>
          <Wifi size={14} aria-hidden="true" className="offline-banner__icon" />
          <span className="offline-banner__text">
            عاد الاتصال بالإنترنت
            {pending > 0 ? ` · مزامنة ${pending} عنصرًا` : ""}
          </span>
        </>
      )}
    </div>
  );
}
