import type { ReactNode } from "react";
import "@/styles/igds/components.css";

type Props = {
  children: ReactNode;
  chrome?: ReactNode;
  footer?: ReactNode;
};

/** غلاف التطبيق البصري للنظام الجديد — لا يغيّر التوجيه. */
export function IgdsAppShell({ children, chrome, footer }: Props) {
  return (
    <div className="igds-shell" data-igds-shell="">
      {chrome}
      <div className="igds-shell__main">{children}</div>
      {footer}
    </div>
  );
}
