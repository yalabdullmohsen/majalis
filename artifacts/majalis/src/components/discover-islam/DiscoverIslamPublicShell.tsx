import type { ReactNode } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";

/** غلاف خطوط الصفحات العامة لقسم اكتشف الإسلام. */
export function DiscoverIslamPublicShell({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
