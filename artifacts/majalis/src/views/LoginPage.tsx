import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ADMIN_ACCESS_DENIED_MESSAGE, mapAuthError } from "@/lib/auth-messages";
import { hasUnrestrictedAdminAccess, isOwnerAuthUser, resolveUserEmail } from "@/lib/owner-config";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { bootstrapSupabaseFromServer } from "@/lib/supabase-bootstrap";
import { signInWithGoogle } from "@/lib/supabase";
import { preloadRoute } from "@/lib/lazy-with-retry";
import { Loading } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";

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

  useEffect(() => {
    applyPageSeo({
      path: "/login",
      title: "تسجيل الدخول | المجلس العلمي",
      description: "سجّل دخولك إلى المجلس العلمي للوصول إلى محتوى شخصي وأدوات متقدمة.",
      keywords: ["تسجيل دخول", "المجلس العلمي"],
      robots: "noindex, follow",
    });
  }, []);
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
      <div className="login-page">
        <Loading />
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <img src="/logo.png" alt="المجلس العلمي" className="login-logo" loading="eager" decoding="async" />
          <p className="login-card__brand">المجلس العلمي</p>
          <h1 className="login-card__title">{adminLogin ? "دخول المسؤول" : "تسجيل الدخول"}</h1>
          <p className="login-card__subtitle">
            {adminLogin ? "سجّل الدخول للوصول إلى لوحة التحكم" : "سجّل الدخول للوصول إلى حسابك"}
          </p>
        </div>

        {!authEnabled && (
          <p className="login-alert login-alert--error" role="alert">
            {mapAuthError(null)}
          </p>
        )}

        {error && (
          <p className="login-alert login-alert--error" role="alert">
            {error}
          </p>
        )}

        {denied && (
          <p className="login-alert login-alert--warn" role="status">
            {ADMIN_ACCESS_DENIED_MESSAGE}
          </p>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
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

          <div className="login-field">
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

          <button type="submit" className="login-submit" disabled={loading || !authEnabled}>
            {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
          </button>
        </form>

        {!adminLogin && authEnabled && (
          <div className="login-oauth">
            <div className="login-oauth__divider"><span>أو</span></div>
            <button
              type="button"
              className="login-oauth__btn"
              onClick={() => signInWithGoogle(`${window.location.origin}${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`)}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                <path fill="#FBBC05" d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.044l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.956L3.964 7.288C4.672 5.161 6.656 3.58 9 3.58z"/>
              </svg>
              تسجيل الدخول بـ Google
            </button>
          </div>
        )}

        <div className="login-actions">
          {!adminLogin && (
            <Link href="/register" className="login-back-link login-back-link--primary">
              إنشاء حساب جديد
            </Link>
          )}
          <Link href="/" className="login-back-link">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
