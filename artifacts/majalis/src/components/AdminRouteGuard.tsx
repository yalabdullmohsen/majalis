import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { Loading } from "./ui-common";
import { ADMIN_ACCESS_DENIED_MESSAGE } from "@/lib/auth-messages";
import { C } from "@/lib/theme";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoggedIn, loading } = useAuth();
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

  if (!isLoggedIn) {
    return <Loading />;
  }

  if (denied || !isAdmin) {
    return (
      <div className="login-page">
        <div className="login-card login-card--denied">
          <h1 style={{ color: C.emeraldDeep, fontSize: "1.25rem", marginBottom: "0.75rem", textAlign: "center" }}>
            غير مصرح
          </h1>
          <p style={{ color: C.inkSoft, marginBottom: "1.25rem", lineHeight: 1.7, textAlign: "center" }}>
            {ADMIN_ACCESS_DENIED_MESSAGE}
          </p>
          <div className="login-actions">
            <Link href="/login" className="login-back-link">العودة لتسجيل الدخول</Link>
            <Link href="/" className="login-back-link">العودة للصفحة الرئيسية</Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
