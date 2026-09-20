import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type HeaderOrnamentProps = HTMLAttributes<HTMLSpanElement> & {
  /** توسيط تحت عناوين الصفحة عند الحاجة */
  centered?: boolean;
};

/**
 * زخرفة هندسية خفيفة أسفل العناوين المهمة — بديل الخط الأخضر القصير المتكرر.
 * pointer-events عبر CSS · خارج ترتيب القراءة.
 */
export function HeaderOrnament({ className, centered, ...rest }: HeaderOrnamentProps) {
  return (
    <span
      {...rest}
      className={cn("svl-header-ornament", centered && "svl-header-ornament--center", className)}
      aria-hidden="true"
      data-svl-ornament="header"
    />
  );
}
