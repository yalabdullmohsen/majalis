import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { Loading } from "./ui-common";
import { ADMIN_ACCESS_DENIED_MESSAGE } from "@/lib/auth-messages";
import { C } from "@/lib/theme";

function adminLoginNextPath(location: string): string {
  const path = location.split("?")[0] || "/admin";
  return path.startsWith("/admin") ? path : "/admin";
}

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoggedIn, loading } = useAuth();
  const [location, navigate] = useLocation();
  const [denied, setDenied] = useState(false);
  const loginNext = adminLoginNextPath(location);

  useEffect(() => {
    if (loading) return;

    if (isAdmin) {
      setDenied(false);
      return;
    }

    if (!isLoggedIn) {
      navigate(`/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }

    setDenied(true);
  }, [isAdmin, isLoggedIn, loading, navigate, loginNext]);

  if (loading) return <Loading />;

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="ds-empty">جاري التحويل إلى صفحة الدخول…</p>
          <Link href={`/login?next=${encodeURIComponent(loginNext)}`} className="login-back-link">
            الذهاب لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
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
