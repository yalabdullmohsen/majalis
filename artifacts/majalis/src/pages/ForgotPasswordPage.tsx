import { useState } from "react";
import { Link } from "wouter";
import { ErrorMessage } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { getSupabaseErrorMessage, resetPassword } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSent(false);
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      setError(getSupabaseErrorMessage(error, "تعذّر إرسال رابط استعادة كلمة المرور."));
      return;
    }
    setSent(true);
  };

  return (
    <div style={{ maxWidth: "26rem", margin: "4rem auto", padding: "0 1.25rem" }}>
      <div style={{ padding: "2rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", textAlign: "center", marginBottom: "0.75rem" }}>
          استعادة كلمة المرور
        </h1>
        <p style={{ color: C.inkSoft, fontSize: "0.875rem", lineHeight: 1.8, textAlign: "center", marginBottom: "1.25rem" }}>
          أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
        </p>

        {error && <ErrorMessage text={error} />}
        {sent && (
          <p style={{ color: C.emeraldDeep, fontSize: "0.875rem", marginBottom: "1rem", padding: "0.7rem", background: C.sage, borderRadius: "0.375rem", textAlign: "center" }}>
            تم إرسال رابط الاستعادة إن كان البريد مسجلًا لدينا.
          </p>
        )}

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: "0.35rem", color: C.ink, fontSize: "0.875rem" }}>البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchment, color: C.ink, fontFamily: "inherit", marginBottom: "1rem" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "0.7rem", borderRadius: "0.5rem", border: "none", background: C.emerald, color: C.parchment, fontWeight: 700, fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: C.inkSoft }}>
          <Link href="/login" style={{ color: C.emeraldDeep, textDecoration: "underline" }}>العودة إلى تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
