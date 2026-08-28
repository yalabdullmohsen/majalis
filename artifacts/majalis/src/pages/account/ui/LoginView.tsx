import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ADMIN_ACCESS_DENIED_MESSAGE, mapAuthError } from "@/lib/auth-messages";
import { hasUnrestrictedAdminAccess, isOwnerAuthUser, resolveUserEmail } from "@/lib/owner-config";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { bootstrapSupabaseFromServer } from "@/lib/supabase-bootstrap";
import {
  resetPasswordForEmail,
  supabase,
} from "@/lib/supabase";
import { preloadRoute } from "@/lib/lazy-with-retry";
import { Loading } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { sanitizeAuthNext } from "@/lib/auth-redirect";
import "@/styles/pages/auth.css";

type AuthTab = "login" | "register" | "forgot";

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
  return sanitizeAuthNext(params.get("next"));
}

function isAdminLogin(nextPath: string) {
  return nextPath.startsWith("/admin");
}

function resolveInitialTab(pathname: string): AuthTab {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/register" || p.startsWith("/auth/register")) return "register";
  if (typeof window !== "undefined") {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "register") return "register";
    if (tab === "forgot") return "forgot";
  }
  return "login";
}

export default function LoginPage() {
  const [location, navigate] = useLocation();
  const [tab, setTab] = useState<AuthTab>(() => resolveInitialTab(location));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(isSupabaseConfigured());
  const [resetSent, setResetSent] = useState(false);

  const { login, register, logout, refreshUser, isAdmin, isLoggedIn, loading: authLoading } = useAuth();
  const nextPath = useMemo(() => getNextPath(), [location]);
  const adminLogin = isAdminLogin(nextPath);
  const authEnabled = authReady;

  useEffect(() => {
    const next = resolveInitialTab(location);
    setTab((prev) => (prev === "forgot" && next === "login" ? prev : next));
  }, [location]);

  useEffect(() => {
    const isRegister = tab === "register";
    applyPageSeo({
      path: isRegister ? "/register" : "/login",
      title: isRegister
        ? "إنشاء حساب | المجلس العلمي"
        : tab === "forgot"
          ? "استعادة كلمة المرور | المجلس العلمي"
          : "تسجيل الدخول | المجلس العلمي",
      description: isRegister
        ? "إنشاء حساب في المجلس العلمي."
        : "تسجيل الدخول إلى المجلس العلمي.",
      keywords: isRegister ? ["إنشاء حساب", "تسجيل", "المجلس العلمي"] : ["تسجيل دخول", "المجلس العلمي"],
      robots: "noindex, follow",
    });
  }, [tab]);

  useEffect(() => {
    if (authReady) return;
    void bootstrapSupabaseFromServer().then((ok) => setAuthReady(ok || isSupabaseConfigured()));
  }, [authReady]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) return;
    if (adminLogin && isAdmin) {
      navigate(nextPath);
      return;
    }
    if (!adminLogin) navigate(nextPath);
  }, [authLoading, isLoggedIn, isAdmin, navigate, nextPath, adminLogin]);

  const switchTab = (next: AuthTab) => {
    setError("");
    setSuccess("");
    setDenied(false);
    setResetSent(false);
    setTab(next);
    if (adminLogin) return;
    if (next === "register") {
      navigate(nextPath !== "/" ? `/register?next=${encodeURIComponent(nextPath)}` : "/register");
    } else if (next === "login") {
      navigate(nextPath !== "/" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
    }
  };

  const validateRegister = (): string | null => {
    if (fullName.trim().length < 2) return "يرجى إدخال الاسم (حرفان على الأقل).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "البريد غير صحيح";
    if (password.length < 8) return "كلمة المرور قصيرة";
    if (password !== confirmPassword) return "كلمة المرور غير متطابقة";
    return null;
  };

  const validateLogin = (): string | null => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "البريد غير صحيح";
    if (!password) return "أدخل كلمة المرور";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authEnabled) {
      setError(mapAuthError(null));
      return;
    }

    setError("");
    setSuccess("");
    setDenied(false);
    setLoading(true);

    try {
      if (tab === "forgot") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError("البريد غير صحيح");
          return;
        }
        const { error: resetError } = await resetPasswordForEmail(email.trim());
        if (resetError) throw resetError;
        setResetSent(true);
        return;
      }

      if (tab === "register") {
        const validationError = validateRegister();
        if (validationError) {
          setError(validationError);
          return;
        }
        const { data, error: signUpError } = await register(email.trim(), password, fullName.trim());
        if (signUpError) throw signUpError;

        const userId = data?.user?.id;
        if (userId) {
          await supabase.from("profiles").upsert(
            { id: userId, full_name: fullName.trim(), email: email.trim(), role: "user" },
            { onConflict: "id" },
          );
        }

        if (data?.session) {
          setSuccess("تم إنشاء حسابك بنجاح.");
          navigate(nextPath || "/");
          return;
        }
        setSuccess("تم إنشاء حسابك. راجع بريدك لتأكيد الحساب ثم سجّل الدخول.");
        return;
      }

      const loginValidation = validateLogin();
      if (loginValidation) {
        setError(loginValidation);
        return;
      }

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
      <div className="login-page" dir="rtl">
        <Loading />
      </div>
    );
  }

  const title =
    tab === "forgot"
      ? "استعادة كلمة المرور"
      : adminLogin
        ? "دخول المسؤول"
        : null;

  return (
    <div className="login-page" dir="rtl">
      <div className="login-card">
        <header className="login-card__header">
          <div className="login-app-icon" aria-hidden="true">
            <img
              src="/brand/icon-1024.png"
              alt=""
              className="login-app-icon__img"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              width={56}
              height={56}
            />
          </div>
          <p className="login-card__brand">المجلس العلمي</p>
          {title ? <h1 className="login-card__title">{title}</h1> : null}
        </header>

        {!adminLogin && tab !== "forgot" ? (
          <div className="login-tabs" role="tablist" aria-label="وضع الحساب">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "login"}
              className={`login-tab${tab === "login" ? " is-active" : ""}`}
              onClick={() => switchTab("login")}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "register"}
              className={`login-tab${tab === "register" ? " is-active" : ""}`}
              onClick={() => switchTab("register")}
            >
              إنشاء حساب
            </button>
          </div>
        ) : null}

        {!authEnabled && (
          <p className="login-alert login-alert--error" role="alert">
            {mapAuthError(null)}
          </p>
        )}

        {error ? (
          <p className="login-alert login-alert--error" role="alert">
            {error}
          </p>
        ) : null}

        {denied ? (
          <p className="login-alert login-alert--warn" role="status">
            {ADMIN_ACCESS_DENIED_MESSAGE}
          </p>
        ) : null}

        {success ? (
          <p className="login-alert login-alert--success" role="status">
            {success}
          </p>
        ) : null}

        {resetSent ? (
          <p className="login-alert login-alert--success" role="status">
            إن وُجد حساب بهذا البريد فستصلك رسالة لإعادة تعيين كلمة المرور.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {tab === "register" ? (
              <div className="login-field">
                <label htmlFor="auth-name">الاسم</label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  placeholder="اسمك الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  disabled={loading || !authEnabled}
                />
              </div>
            ) : null}

            <div className="login-field">
              <label htmlFor="auth-email">البريد الإلكتروني</label>
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !authEnabled}
              />
            </div>

            {tab !== "forgot" ? (
              <div className="login-field">
                <label htmlFor="auth-password">كلمة المرور</label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={tab === "register" ? "new-password" : "current-password"}
                  placeholder={tab === "register" ? "٨ أحرف على الأقل" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={tab === "register" ? 8 : undefined}
                  disabled={loading || !authEnabled}
                />
              </div>
            ) : null}

            {tab === "register" ? (
              <div className="login-field">
                <label htmlFor="auth-confirm">تأكيد كلمة المرور</label>
                <input
                  id="auth-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading || !authEnabled}
                />
              </div>
            ) : null}

            <button type="submit" className="login-submit" disabled={loading || !authEnabled}>
              {loading
                ? tab === "register"
                  ? "جاري الإنشاء…"
                  : tab === "forgot"
                    ? "جارٍ الإرسال…"
                    : "جارٍ التحقق…"
                : tab === "register"
                  ? "إنشاء حساب"
                  : tab === "forgot"
                    ? "إرسال رابط الاستعادة"
                    : "تسجيل الدخول"}
            </button>
          </form>
        )}

        {!adminLogin && tab === "login" && authEnabled ? (
          <button
            type="button"
            className="login-text-btn"
            onClick={() => switchTab("forgot")}
          >
            نسيت كلمة المرور؟
          </button>
        ) : null}

        {tab === "forgot" ? (
          <button type="button" className="login-text-btn" onClick={() => switchTab("login")}>
            العودة لتسجيل الدخول
          </button>
        ) : null}

        {!adminLogin ? (
          <div className="login-actions">
            <Link href="/" className="login-guest-link">
              المتابعة كزائر
            </Link>
          </div>
        ) : (
          <div className="login-actions">
            <Link href="/" className="login-text-btn">
              العودة للصفحة الرئيسية
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
