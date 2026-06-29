import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { Loading } from "@/components/ui-common";

type Props = {
  children: ReactNode;
  redirectTo?: string;
};

export function RequireAuth({ children, redirectTo }: Props) {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const loginHref = redirectTo || `/login?next=${encodeURIComponent(location)}`;

  if (loading) return <Loading />;
  if (!user) {
    return (
      <div className="page-shell narrow" dir="rtl">
        <div className="personal-auth-gate">
          <h1>تسجيل الدخول مطلوب</h1>
          <p>سجّل دخولك للوصول إلى مساحتك العلمية الشخصية.</p>
          <Link href={loginHref} className="ds-btn ds-btn--primary">تسجيل الدخول</Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
