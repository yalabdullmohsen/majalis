import { useEffect, type ReactNode } from "react";
import { bootstrapPublicFonts } from "@/lib/public-fonts";

type Props = {
  children: ReactNode;
};

/** غلاف الصفحات الخارجية — يفعّل خطوط التسويق دون المساس بالصفحات الداخلية. */
export function PublicLayout({ children }: Props) {
  useEffect(() => {
    bootstrapPublicFonts();
  }, []);

  return <div className="public-layout marketing-page">{children}</div>;
}
