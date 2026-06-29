import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { mapAuthError } from "@/lib/auth-messages";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { bootstrapSupabaseFromServer } from "@/lib/supabase-bootstrap";
import { supabase } from "@/lib/supabase";
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
        setTimeout(() => navigate("/"), 1200);
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
          <h1 className="auth-card--v2026__title">إنشاء حساب</h1>
          <p className="auth-card--v2026__subtitle">انضم للمنصة للمتابعة والوصول إلى المحتوى</p>
        </div>

        {!authEnabled && (
          <p className="auth-alert--v2026 auth-alert--v2026--error" role="alert">
            {mapAuthError(null)}
          </p>
        )}

        <form onSubmit={handleSubmit} className="auth-form--v2026" noValidate>
          <div className="auth-field--v2026">
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

          <div className="auth-field--v2026">
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

          <div className="auth-field--v2026">
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

          <div className="auth-field--v2026">
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
            <p className="auth-alert--v2026 auth-alert--v2026--error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="auth-alert--v2026 auth-alert--v2026--warn" role="status">
              {success}
            </p>
          )}

          <button type="submit" className="auth-submit--v2026" disabled={loading || !authEnabled}>
            {loading ? "جاري الإنشاء…" : "إنشاء حساب"}
          </button>
        </form>

        <div className="auth-links--v2026">
          <Link href="/login">لديك حساب؟ تسجيل الدخول</Link>
          <Link href="/">العودة للصفحة الرئيسية</Link>
        </div>
      </div>
    </div>
  );
}
