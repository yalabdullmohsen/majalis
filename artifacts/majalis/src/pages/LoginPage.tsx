import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ADMIN_ACCESS_DENIED_MESSAGE, mapAuthError } from "@/lib/auth-messages";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { Loading } from "@/components/ui-common";

function getNextPath() {
  if (typeof window === "undefined") return "/admin";
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/admin";
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
  const authEnabled = isSupabaseConfigured();

  useEffect(() => {
    if (authLoading) return;
    if (isLoggedIn && isAdmin) {
      navigate(nextPath);
    }
  }, [authLoading, isLoggedIn, isAdmin, navigate, nextPath]);

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
      if (current?.profile?.role === "admin") {
        navigate(nextPath);
        return;
      }

      await logout();
      setDenied(true);
      setError(ADMIN_ACCESS_DENIED_MESSAGE);
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
          <h1 className="login-card__title">دخول المسؤول</h1>
          <p className="login-card__subtitle">سجّل الدخول للوصول إلى لوحة التحكم</p>
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
            <label htmlFor="admin-email">البريد الإلكتروني</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || !authEnabled}
            />
          </div>

          <div className="login-field">
            <label htmlFor="admin-password">كلمة المرور</label>
            <input
              id="admin-password"
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

        <div className="login-actions">
          <Link href="/" className="login-back-link">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
