import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase, updatePassword } from "@/lib/supabase";
import { mapAuthError } from "@/lib/auth-messages";
import { Loading } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/auth.css";

/**
 * تحديث كلمة المرور بعد رابط الاستعادة (جلسة PASSWORD_RECOVERY).
 * يُفتح من /auth/callback عند event === PASSWORD_RECOVERY.
 */
export default function UpdatePasswordPage() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/auth/update-password",
      title: "تعيين كلمة مرور جديدة | المجلس العلمي",
      description: "عيّن كلمة مرور جديدة لحسابك في المجلس العلمي.",
      robots: "noindex, nofollow",
    });
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) throw updateError;
      setOk(true);
      window.setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login-page">
        <Loading />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-card__title">انتهت صلاحية الرابط</h1>
          <p className="login-card__subtitle">اطلب رابط استعادة جديدًا من صفحة الدخول.</p>
          <Link href="/login" className="login-back-link login-back-link--primary">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <h1 className="login-card__title">كلمة مرور جديدة</h1>
          <p className="login-card__subtitle">أدخل كلمة المرور الجديدة لحسابك</p>
        </div>
        {error ? (
          <p className="login-alert login-alert--error" role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="login-alert" role="status">
            تم تحديث كلمة المرور. جارٍ التحويل…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="new-password">كلمة المرور الجديدة</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>
            <div className="login-field">
              <label htmlFor="confirm-password">تأكيد كلمة المرور</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
