import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, Trash2, ShieldOff, CheckCircle } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function AccountDeletionPage() {
  const { user, isLoggedIn, logout } = useAuth();
  const [step, setStep] = useState<"info" | "confirm" | "typing" | "deleting" | "done">("info");
  const [confirmWord, setConfirmWord] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/account-deletion",
      title: "حذف الحساب نهائياً | مجالس العلم",
      description: "طلب حذف حسابك وجميع بياناتك من منصة مجالس العلم نهائياً.",
      robots: "noindex, nofollow",
    });
  }, []);

  async function handleDelete() {
    if (confirmWord !== "حذف") { setError("يجب كتابة كلمة «حذف» بالضبط للتأكيد."); return; }
    if (!user?.id) { setError("يجب تسجيل الدخول أولاً."); return; }
    setStep("deleting");
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("لا يوجد JWT صالح");
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "فشل حذف الحساب");
      }
      await logout();
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setStep("typing");
    }
  }

  if (step === "done") {
    return (
      <div className="page-shell">
        <div className="accd-done">
          <CheckCircle size={48} className="accd-done__icon" aria-hidden="true" />
          <h1>تم حذف حسابك</h1>
          <p>جميع بياناتك قد حُذفت نهائياً. نأسف لمغادرتك، ويسعدنا استقبالك من جديد دوماً.</p>
          <Link href="/" className="btn-primary">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="accd-hero">
        <ShieldOff size={36} className="accd-hero__icon" aria-hidden="true" />
        <h1>حذف الحساب نهائياً</h1>
        <p>هذه العملية لا يمكن التراجع عنها.</p>
      </header>

      <section className="accd-info ui-card">
        <h2 className="accd-info__title">
          <AlertTriangle size={16} aria-hidden="true" /> ماذا سيُحذف؟
        </h2>
        <ul className="accd-info__list">
          <li>حسابك وبيانات المصادقة</li>
          <li>سجل تقدمك في الدروس والقرآن والدورات</li>
          <li>بطاقاتك المراجَعة (SM-2)</li>
          <li>مفضلاتك وإنجازاتك</li>
          <li>جميع البيانات الشخصية المرتبطة بحسابك</li>
        </ul>
        <p className="accd-info__note">
          المحتوى العام (الدروس، الفتاوى، القرآن) يبقى متاحاً للجميع وغير مرتبط بحسابك.
        </p>
      </section>

      {!isLoggedIn && (
        <div className="accd-login-prompt">
          <p>يجب تسجيل الدخول أولاً لحذف حسابك.</p>
          <Link href="/login" className="btn-primary">تسجيل الدخول</Link>
        </div>
      )}

      {isLoggedIn && step === "info" && (
        <div className="accd-actions">
          <p className="accd-actions__email">تسجيل الدخول الحالي: <strong>{user?.email}</strong></p>
          <button type="button" className="btn-danger" onClick={() => setStep("confirm")}>
            <Trash2 size={16} /> أريد حذف حسابي
          </button>
          <Link href="/settings" className="btn-secondary">إلغاء</Link>
        </div>
      )}

      {isLoggedIn && (step === "confirm" || step === "typing") && (
        <div className="accd-confirm ui-card">
          <p className="accd-confirm__warning">
            ⚠️ لتأكيد الحذف النهائي، اكتب كلمة <strong>«حذف»</strong> في الحقل أدناه:
          </p>
          <input
            type="text"
            className="accd-confirm__input"
            placeholder="اكتب: حذف"
            value={confirmWord}
            onChange={e => { setConfirmWord(e.target.value); setError(""); setStep("typing"); }}
            dir="rtl"
            autoComplete="off"
            aria-label="كلمة التأكيد"
          />
          {error && <p className="accd-confirm__error" role="alert">{error}</p>}
          <div className="accd-confirm__btns">
            <button
              type="button"
              className="btn-danger"
              disabled={confirmWord !== "حذف"}
              onClick={handleDelete}
            >
              <Trash2 size={16} /> حذف حسابي نهائياً
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setStep("info"); setConfirmWord(""); setError(""); }}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {step === "deleting" && (
        <div className="accd-deleting" role="status" aria-live="polite">
          <div className="accd-deleting__spinner" aria-hidden="true" />
          <p>جارٍ حذف حسابك وبياناتك…</p>
        </div>
      )}

      <div className="accd-footer">
        <Link href="/privacy">سياسة الخصوصية</Link>
        <Link href="/contact">تواصل معنا</Link>
      </div>
    </div>
  );
}
