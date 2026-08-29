/**
 * شيت المزيد — المحتوى من سجل الأقسام عبر MoreHubFromRegistry.
 */
import { useCallback } from "react";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { MoreSheetThemeToggle } from "@/components/more/MoreSheetThemeToggle";
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
      title="سُنّة"
      snap="full"
      closeLabel="إغلاق"
      className="bottom-sheet--services more-hub-sheet"
      headerExtra={<MoreSheetThemeToggle />}
    >
      <div className="more-hub-sheet__body" data-more-sheet-body="1">
        <MoreHubFromRegistry showSearch onNavigate={handleSheetClose} />
      </div>
    </AppBottomSheet>
  );
}
