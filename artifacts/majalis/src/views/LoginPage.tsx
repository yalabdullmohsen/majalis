import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ADMIN_ACCESS_DENIED_MESSAGE, mapAuthError } from "@/lib/auth-messages";
import { hasUnrestrictedAdminAccess, isOwnerAuthUser, resolveUserEmail } from "@/lib/owner-config";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { bootstrapSupabaseFromServer } from "@/lib/supabase-bootstrap";
import { preloadRoute } from "@/lib/lazy-with-retry";
import { Loading } from "@/components/ui-common";

function canAccessAdminUser(current: Awaited<ReturnType<typeof import("@/lib/supabase").getCurrentUser>>) {
  if (!current) return false;
  return (
    current.is_owner === true ||
    isOwnerAuthUser(current, current.profile) ||
    hasUnrestrictedAdminAccess({
      email: resolveUserEmail(current),
      profile: current.profile,
      governanceRole: current.governance_role,
    }) ||
    current.governance_role === "super_admin" ||
    current.profile?.role === "admin" ||
    current.profile?.role === "super_admin" ||
    current.profile?.is_owner === true
  );
}

function getNextPath() {
  if (typeof window === "undefined") return "/";
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

function isAdminLogin(nextPath: string) {
  return nextPath.startsWith("/admin");
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(isSupabaseConfigured());
  const { login, logout, refreshUser, isAdmin, isLoggedIn, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const nextPath = getNextPath();
  const adminLogin = isAdminLogin(nextPath);
  const authEnabled = authReady;

  useEffect(() => {
    if (authReady) return;
    void bootstrapSupabaseFromServer().then((ok) => setAuthReady(ok || isSupabaseConfigured()));
  }, [authReady]);

  useEffect(() => {
    if (authLoading) return;
    if (isLoggedIn) {
      if (adminLogin && isAdmin) {
        navigate(nextPath);
        return;
      }
      if (!adminLogin) {
        navigate(nextPath);
      }
    }
  }, [authLoading, isLoggedIn, isAdmin, navigate, nextPath, adminLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEnabled) {
      setError(mapAuthError(null));
      return;
    }

    setError("");
    setDenied(false);
    setLoading(true);

    try {
      const { error: signInError } = await login(email.trim(), password);
      if (signInError) throw signInError;

      const current = await refreshUser();

      if (adminLogin) {
        if (canAccessAdminUser(current)) {
          preloadRoute(() => import("@/views/AdminPage"));
          navigate(nextPath);
          return;
        }
        await logout();
        setDenied(true);
        setError(ADMIN_ACCESS_DENIED_MESSAGE);
        return;
      }

      navigate(nextPath);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !authReady) {
    return (
      <div className="auth-page--v2026">
        <Loading />
      </div>
    );
  }

  return (
    <div className="auth-page--v2026">
      <div className="auth-card--v2026">
        <div className="auth-card--v2026__header">
          <img src="/logo.png" alt="المجلس العلمي" className="auth-card--v2026__logo" />
          <p className="auth-card--v2026__brand">المجلس العلمي</p>
          <h1 className="auth-card--v2026__title">{adminLogin ? "دخول المسؤول" : "تسجيل الدخول"}</h1>
          <p className="auth-card--v2026__subtitle">
            {adminLogin ? "سجّل الدخول للوصول إلى لوحة التحكم" : "سجّل الدخول للوصول إلى حسابك"}
          </p>
        </div>

        {!authEnabled && (
          <p className="auth-alert--v2026 auth-alert--v2026--error" role="alert">
            {mapAuthError(null)}
          </p>
        )}

        {error && (
          <p className="auth-alert--v2026 auth-alert--v2026--error" role="alert">
            {error}
          </p>
        )}

        {denied && (
          <p className="auth-alert--v2026 auth-alert--v2026--warn" role="status">
            {ADMIN_ACCESS_DENIED_MESSAGE}
          </p>
        )}

        <form onSubmit={handleSubmit} className="auth-form--v2026">
          <div className="auth-field--v2026">
            <label htmlFor="login-email">البريد الإلكتروني</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || !authEnabled}
            />
          </div>

          <div className="auth-field--v2026">
            <label htmlFor="login-password">كلمة المرور</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || !authEnabled}
            />
          </div>

          <button type="submit" className="auth-submit--v2026" disabled={loading || !authEnabled}>
            {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="auth-links--v2026">
          {!adminLogin && (
            <Link href="/register">إنشاء حساب جديد</Link>
          )}
          <Link href="/">العودة للصفحة الرئيسية</Link>
        </div>
      </div>
    </div>
  );
}
