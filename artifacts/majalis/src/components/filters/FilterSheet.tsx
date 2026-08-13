import type { ReactNode } from "react";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** ورقة فلاتر موحّدة للجوال — غلاف على الشيت المشترك. */
export function FilterSheet({
  open,
  onClose,
  title = "بحث وتصفية",
  children,
}: SheetProps) {
  return (
    <FilterBottomSheet open={open} onClose={onClose} title={title}>
      <div className="mj-filter-sheet-body">{children}</div>
    </FilterBottomSheet>
  );
}

export { FilterToggle };
