import type { ReactNode } from "react";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** ورقة تصفية — غلاف على الشيت الموحّد. */
export function FilterBottomSheet({ open, onClose, title = "بحث وتصفية", children }: Props) {
  return (
    <AppBottomSheet open={open} onClose={onClose} title={title} snap="full" closeLabel="إغلاق">
      {children}
    </AppBottomSheet>
  );
}

export function FilterToggle({
  onClick,
  label = "بحث وتصفية",
  expanded = false,
}: {
  onClick: () => void;
  label?: string;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      className="ds-filter-toggle"
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup="dialog"
    >
      {label}
    </button>
  );
}
