import { Suspense, lazy, type ReactNode } from "react";
import { useLocation } from "wouter";
import { isPublicRoute } from "@/lib/public-routes";

const PublicLayoutLazy = lazy(() =>
  import("@/components/layout/PublicLayout").then((m) => ({ default: m.PublicLayout })),
);

/** يفعّل خطوط الصفحات الخارجية فقط عند المسارات العامة — بلا تغيير على body. */
export function PublicRouteOutlet({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  if (!isPublicRoute(location)) return <>{children}</>;

  return (
    <Suspense fallback={null}>
      <PublicLayoutLazy>{children}</PublicLayoutLazy>
    </Suspense>
  );
}
