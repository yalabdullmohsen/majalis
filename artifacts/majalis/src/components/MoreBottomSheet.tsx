/**
 * شيت المزيد — المحتوى من سجل الأقسام عبر MoreHubFromRegistry.
 */
import { useCallback } from "react";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { MoreHubFromRegistry } from "@/features/more/MoreHubFromRegistry";
import "@/styles/components/more-bottom-sheet.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MoreBottomSheet({ open, onClose }: Props) {
  const handleSheetClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AppBottomSheet
      open={open}
      onClose={handleSheetClose}
      title="المزيد"
      snap="full"
      closeLabel="إغلاق"
      className="bottom-sheet--services"
    >
      <div className="bottom-sheet__body-inner px-3 pb-6">
        <MoreHubFromRegistry showSearch onNavigate={handleSheetClose} />
      </div>
    </AppBottomSheet>
  );
}
