import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { useVersionCheck } from "@/hooks/useVersionCheck";

/**
 * شيت سفلي هادئ عند اكتشاف نشر أحدث عبر /version.json.
 * لا إعادة تحميل قسرية — المستخدم يختار «تحديث» أو يغلق الشيت.
 */
export function UpdateAvailableBanner() {
  const { updateAvailable, applyUpdate, dismissUpdate } = useVersionCheck();

  return (
    <AppBottomSheet
      open={updateAvailable}
      onClose={dismissUpdate}
      title="تتوفر نسخة جديدة"
      snap="half"
      closeLabel="لاحقاً"
      footer={
        <button type="button" className="app-sheet__close app-sheet__close--primary" onClick={applyUpdate}>
          تحديث
        </button>
      }
    >
      <p className="update-available-sheet__copy">
        نُشرت نسخة أحدث من التطبيق. اضغط «تحديث» لتحميلها، أو «لاحقاً» للمتابعة بالنسخة الحالية.
      </p>
    </AppBottomSheet>
  );
}
