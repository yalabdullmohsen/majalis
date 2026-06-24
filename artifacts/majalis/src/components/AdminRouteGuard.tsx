import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { Loading } from "@/components/ui-common";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoggedIn, loading } = useAuth() as any;
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      navigate("/login?next=/admin");
      return;
    }
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoggedIn, loading, navigate]);

  if (loading) return <Loading />;
  if (!isLoggedIn || !isAdmin) return <Loading />;

  return <>{children}</>;
}
