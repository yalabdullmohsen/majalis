import { RefreshCw } from "lucide-react";
import { useVersionCheck } from "@/hooks/useVersionCheck";

/**
 * شريط هادئ يظهر فقط عند اكتشاف نشر جديد فعلي على الخادم (مقارنةً بما
 * حُمِّلت به هذه الجلسة عبر /version.json) — لا يُعيد التحميل تلقائيًا
 * أبدًا، فقط عند ضغط المستخدم لزر "تحديث الآن" (انظر useVersionCheck).
 */
export function UpdateAvailableBanner() {
  const { updateAvailable, applyUpdate } = useVersionCheck();

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="update-available-banner"
    >
      <RefreshCw size={14} aria-hidden="true" className="update-available-banner__icon" />
      <span className="update-available-banner__text">يتوفر تحديث جديد للموقع</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="update-available-banner__btn"
      >
        تحديث الآن
      </button>
    </div>
  );
}
