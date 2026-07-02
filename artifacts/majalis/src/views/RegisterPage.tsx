import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { mapAuthError } from "@/lib/auth-messages";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { bootstrapSupabaseFromServer } from "@/lib/supabase-bootstrap";
import { supabase, signInWithGoogle } from "@/lib/supabase";
import { Loading } from "@/components/ui-common";

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(isSupabaseConfigured());
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); }, []);
  const authEnabled = authReady;

  useEffect(() => {
    if (authReady) return;
    void bootstrapSupabaseFromServer().then((ok) => setAuthReady(ok || isSupabaseConfigured()));
  }, [authReady]);

  useEffect(() => {
    if (!authLoading && user) navigate("/");
  }, [authLoading, user, navigate]);

  const validate = (): string | null => {
    const name = fullName.trim();
    if (name.length < 2) return "يرجى إدخال الاسم (حرفان على الأقل).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "يرجى إدخال بريد إلكتروني صحيح.";
    if (password.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل.";
    if (password !== confirmPassword) return "كلمتا المرور غير متطابقتين.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!authEnabled) {
      setError(mapAuthError(null));
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await register(email.trim(), password, fullName.trim());
      if (signUpError) {
        setError(mapAuthError(signUpError));
        return;
      }

      const userId = data?.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert(
          { id: userId, full_name: fullName.trim(), email: email.trim(), role: "user" },
          { onConflict: "id" },
        );
      }

      if (data?.session) {
        setSuccess("تم إنشاء حسابك بنجاح. جاري تحويلك…");
        navTimerRef.current = setTimeout(() => navigate("/"), 1200);
        return;
      }

      setSuccess("تم إنشاء حسابك. راجع بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.");
    } catch {
      setError("حدث خطأ أثناء إنشاء الحساب. حاول مجدداً.");
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
          <img src="/logo.png" alt="المجلس العلمي" className="login-logo" />
          <p className="login-card__brand">المجلس العلمي</p>
          <h1 className="login-card__title">إنشاء حساب</h1>
          <p className="login-card__subtitle">انضم للمنصة للمتابعة والوصول إلى المحتوى</p>
        </div>

        {!authEnabled && (
          <p className="login-alert login-alert--error" role="alert">
            {mapAuthError(null)}
          </p>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="register-name">الاسم</label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              disabled={loading || !authEnabled}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-email">البريد الإلكتروني</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || !authEnabled}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-password">كلمة المرور</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading || !authEnabled}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-confirm">تأكيد كلمة المرور</label>
            <input
              id="register-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading || !authEnabled}
            />
          </div>

          {error && (
            <p className="login-alert login-alert--error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="login-alert login-alert--success" role="status">
              {success}
            </p>
          )}

          <button type="submit" className="login-submit" disabled={loading || !authEnabled}>
            {loading ? "جاري الإنشاء…" : "إنشاء حساب"}
          </button>
        </form>

        {authEnabled && (
          <div className="login-oauth">
            <div className="login-oauth__divider"><span>أو</span></div>
            <button
              type="button"
              className="login-oauth__btn"
              onClick={() => signInWithGoogle()}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                <path fill="#FBBC05" d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.044l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.956L3.964 7.288C4.672 5.161 6.656 3.58 9 3.58z"/>
              </svg>
              إنشاء حساب بـ Google
            </button>
          </div>
        )}

        <div className="login-actions">
          <Link href="/login" className="login-back-link">
            لديك حساب؟ تسجيل الدخول
          </Link>
          <Link href="/" className="login-back-link">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
