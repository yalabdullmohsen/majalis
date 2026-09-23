/**
 * إدخال تنقّل مسار الحفظ — يظهر فقط عند العلم ON.
 */
import { isHifzPathEnabled } from "@/lib/memorization-path";
import type { NavLinkItem } from "@/config/navigation";

export const HIFZ_PATH_NAV_HREF = "/hifz-path" as const;

export function getHifzPathNavEntry(): NavLinkItem | null {
  if (!isHifzPathEnabled()) return null;
  return {
    id: "hifz-path",
    href: HIFZ_PATH_NAV_HREF,
    label: "مسار الحفظ",
  };
}
