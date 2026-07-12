import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * شريط أعلى الشاشة عند انقطاع الشبكة.
 * لا يحجب المحتوى — يظهر بتمرير سلس ويختفي عند العودة.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="أنت غير متصل بالإنترنت"
      className="offline-banner"
    >
      <WifiOff size={14} aria-hidden="true" className="offline-banner__icon" />
      <span className="offline-banner__text">
        أنت غير متصل بالإنترنت — المصحف والأذكار متاحان
      </span>
    </div>
  );
}
