import { RefreshCw } from "lucide-react";
import { useVersionCheck } from "@/hooks/useVersionCheck";

/**
 * شريط هادئ يظهر فقط عند اكتشاف نشر جديد فعلي على الخادم (مقارنةً بما
 * حُمِّلت به هذه الجلسة عبر /version.json)، ثم **يُعيد تحميل الصفحة
 * تلقائيًا** بعد مهلة قصيرة (انظر AUTO_RELOAD_GRACE_MS في useVersionCheck)
 * — لا حاجة لأي ضغطة من المستخدم. زر "تحديث الآن" يبقى متاحًا لمن يريد
 * تجاوز المهلة القصيرة والتحديث فورًا.
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
      <RefreshCw size={14} aria-hidden="true" className="update-available-banner__icon update-available-banner__icon--spin" />
      <span className="update-available-banner__text">يتوفر تحديث جديد — جارٍ التحديث تلقائيًا…</span>
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
