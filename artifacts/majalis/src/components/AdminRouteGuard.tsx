import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { Loading } from "./ui-common";
import { C } from "@/lib/theme";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoggedIn, loading } = useAuth() as {
    isAdmin: boolean;
    isLoggedIn: boolean;
    loading: boolean;
  };
  const [, navigate] = useLocation();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      navigate("/login?next=/admin");
      return;
    }
    if (!isAdmin) {
      setDenied(true);
    }
  }, [isAdmin, isLoggedIn, loading, navigate]);

  if (loading) return <Loading />;

  if (denied || !isLoggedIn || !isAdmin) {
    if (denied) {
      return (
        <div style={{ maxWidth: "28rem", margin: "4rem auto", padding: "0 1.25rem", textAlign: "center" }}>
          <h1 style={{ color: C.emeraldDeep, fontSize: "1.25rem", marginBottom: "0.75rem" }}>غير مصرح</h1>
          <p style={{ color: C.inkSoft, marginBottom: "1.25rem", lineHeight: 1.7 }}>
            لا تملك صلاحية الوصول إلى لوحة التحكم.
          </p>
          <Link href="/" style={{ color: C.brassDeep, fontWeight: 700 }}>العودة للرئيسية</Link>
        </div>
      );
    }
    return <Loading />;
  }

  return <>{children}</>;
}
