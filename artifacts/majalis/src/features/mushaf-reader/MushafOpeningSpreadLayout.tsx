/**
 * MushafOpeningSpreadLayout — غلاف تخطيط موحّد لص١–ص٢ (صف المتن فقط).
 * الرأس وMushafPageNumber يبقيان أبناء مباشرين لشبكة .nm-page الثلاثية.
 * لا يمسّ نص القرآن · يوحّد مقياس العلامة/الميتاداتا عبر CSS فقط.
 */
import type { ReactNode } from "react";

type Props = {
  pageNumber: 1 | 2;
  children: ReactNode;
  className?: string;
};

export function MushafOpeningSpreadLayout({
  pageNumber,
  children,
  className = "",
}: Props) {
  const kind = pageNumber === 1 ? "opening" : "lead";
  return (
    <div
      className={["nm-opening-spread", className].filter(Boolean).join(" ")}
      data-component="MushafOpeningSpreadLayout"
      data-opening-spread={kind}
      data-page={pageNumber}
    >
      {children}
    </div>
  );
}
