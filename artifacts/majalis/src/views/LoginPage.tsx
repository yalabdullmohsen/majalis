import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ADMIN_ACCESS_DENIED_MESSAGE, mapAuthError } from "@/lib/auth-messages";
import { Loading } from "@/components/ui-common";

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
  const { login, logout, refreshUser, isAdmin, isLoggedIn, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const nextPath = getNextPath();
  const adminLogin = isAdminLogin(nextPath);

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
    setError("");
    setDenied(false);
    setLoading(true);

    try {
      const { error: signInError } = await login(email.trim(), password);
      if (signInError) throw signInError;

      const current = await refreshUser();

      if (adminLogin) {
        if (current?.profile?.role === "admin" || current?.governance_role === "super_admin") {
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

  if (authLoading) {
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
          <img src="/logo.png" alt="المجلس العلمي" className="login-logo" />
          <p className="login-card__brand">المجلس العلمي</p>
          <h1 className="login-card__title">{adminLogin ? "دخول المسؤول" : "تسجيل الدخول"}</h1>
          <p className="login-card__subtitle">
            {adminLogin ? "سجّل الدخول للوصول إلى لوحة التحكم" : "سجّل الدخول للوصول إلى حسابك"}
          </p>
        </div>

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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
          </button>
        </form>

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
