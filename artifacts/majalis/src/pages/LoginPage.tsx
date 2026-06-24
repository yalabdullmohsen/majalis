import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { C } from "@/lib/theme";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth() as any;
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await login(email, password);
        if (error) throw error;
      } else {
        const { error } = await register(email, password, fullName);
        if (error) throw error;
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "حدث خطأ، يرجى المحاولة مجدداً.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "24rem", margin: "4rem auto", padding: "0 1.25rem" }}>
      <div style={{ padding: "2rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", textAlign: "center", marginBottom: "1.5rem" }}>
          {mode === "login" ? "تسجيل الدخول إلى مجالس العلم" : "إنشاء حساب في مجالس العلم"}
        </h1>

        {error && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem", padding: "0.5rem", background: "#fef2f2", borderRadius: "0.375rem", textAlign: "center" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontSize: "0.875rem", color: C.ink, display: "block", marginBottom: "0.25rem" }}>الاسم الكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, fontSize: "0.875rem", fontFamily: "inherit", outline: "none", background: C.parchment, color: C.ink }}
              />
            </div>
          )}
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: "0.875rem", color: C.ink, display: "block", marginBottom: "0.25rem" }}>البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, fontSize: "0.875rem", fontFamily: "inherit", outline: "none", background: C.parchment, color: C.ink }}
            />
          </div>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.875rem", color: C.ink, display: "block", marginBottom: "0.25rem" }}>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, fontSize: "0.875rem", fontFamily: "inherit", outline: "none", background: C.parchment, color: C.ink }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700, fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "جارٍ المعالجة..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: C.inkSoft }}>
          {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب؟ "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ color: C.emeraldDeep, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", textDecoration: "underline" }}
          >
            {mode === "login" ? "سجّل الآن" : "سجّل دخولك"}
          </button>
        </p>
      </div>
    </div>
  );
}
