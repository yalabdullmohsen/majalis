import { useEffect } from "react";
import { useLocation } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { AdminV3Shell } from "./AdminV3Shell";
import { AdminV3ErrorBoundary } from "./AdminV3ErrorBoundary";
import { AdminV3Dashboard } from "./AdminV3Dashboard";
import { AdminV3CenterStub } from "./AdminV3CenterStub";
import { resolveAdminV3Center } from "./nav";

/**
 * مدخل Admin v3 — يُحمَّل كسولًا عبر AdminLazyRoute فقط.
 * لا يُستورد من الهيكل العام (App.tsx).
 */
export default function AdminV3App() {
  const [location] = useLocation();
  const center = resolveAdminV3Center(location);
  const isHome = center.id === "home";

  useEffect(() => {
    applyPageSeo({
      path: location.split("?")[0] || "/admin/v3",
      title: isHome
        ? "لوحة التحكم v3 | سُنّة"
        : `${center.label} — لوحة التحكم v3 | سُنّة`,
      description: "لوحة تحكم سُنّة — Admin v3 (خاصة بالمشرفين).",
      robots: "noindex, nofollow",
    });
  }, [location, center.label, isHome]);

  return (
    <AdminV3ErrorBoundary>
      <AdminV3Shell>{isHome ? <AdminV3Dashboard /> : <AdminV3CenterStub />}</AdminV3Shell>
    </AdminV3ErrorBoundary>
  );
}
