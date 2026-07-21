import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

type Status = "online" | "offline" | "back-online";

export function OfflineBanner() {
  const [status, setStatus] = useState<Status>(
    !navigator.onLine ? "offline" : "online"
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const goOnline  = () => {
      clearTimeout(timer);
      setStatus("back-online");
      timer = setTimeout(() => setStatus("online"), 3000);
    };
    const goOffline = () => {
      clearTimeout(timer);
      setStatus("offline");
    };
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
      clearTimeout(timer);
    };
  }, []);

  if (status === "online") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={status === "offline" ? "أنت غير متصل بالإنترنت" : "عاد الاتصال"}
      className={`offline-banner${status === "back-online" ? " offline-banner--back" : ""}`}
    >
      {status === "offline" ? (
        <>
          <WifiOff size={14} aria-hidden="true" className="offline-banner__icon" />
          <span className="offline-banner__text">
            أنت غير متصل بالإنترنت — المصحف والأذكار متاحان
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
