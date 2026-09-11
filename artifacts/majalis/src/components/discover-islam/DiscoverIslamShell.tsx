/**
 * غلاف موحّد لقسم التعريف بالإسلام — hub والقوائم والتفاصيل.
 */
import type { ReactNode } from "react";
import { UtilityScreen } from "@/components/design-system/screens";
import "@/styles/discover-islam.css";

type Props = {
  children: ReactNode;
  /** صفحة قراءة داخلية (تفاصيل سؤال/شبهة/مقال…) */
  detail?: boolean;
  className?: string;
};

export function DiscoverIslamShell({ children, detail = false, className }: Props) {
  const classes = [
    "page-shell",
    "narrow",
    "content-hub-page",
    "dii-page",
    detail ? "dii-page--detail" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <UtilityScreen compose="mark">
      <div className={classes}>{children}</div>
    </UtilityScreen>
  );
}
