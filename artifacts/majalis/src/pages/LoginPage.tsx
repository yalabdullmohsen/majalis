import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { TurnstileCaptcha, isCaptchaConfigured } from "@/components/TurnstileCaptcha";
import { C } from "@/lib/theme";

const MAX_AUTH_ATTEMPTS = 5;
const AUTH_COOLDOWN_MS = 15 * 60 * 1000;

function authAttemptKey(mode: "login" | "register", email: string) {
  return `majalis-auth-attempts:${mode}:${email.trim().toLowerCase()}`;
}

function readAuthAttempts(mode: "login" | "register", email: string) {
  const raw = window.localStorage.getItem(authAttemptKey(mode, email));
  if (!raw) return { count: 0, lockedUntil: 0 };
  try {
    return JSON.parse(raw) as { count: number; lockedUntil: number };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function writeAuthAttempts(mode: "login" | "register", email: string, attempts: { count: number; lockedUntil: number }) {
  window.localStorage.setItem(authAttemptKey(mode, email), JSON.stringify(attempts));
}

function clearAuthAttempts(mode: "login" | "register", email: string) {
  window.localStorage.removeItem(authAttemptKey(mode, email));
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth() as any;
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const attempts = readAuthAttempts(mode, email);
      if (attempts.lockedUntil > Date.now()) {
        const minutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
        throw new Error(`محاولات كثيرة. حاول مرة أخرى بعد ${minutes} دقيقة.`);
      }
      if (!isCaptchaConfigured() || !captchaToken) {
        throw new Error("يرجى إكمال التحقق الأمني قبل المتابعة.");
      }
      if (mode === "login") {
        const { error } = await login(email, password, captchaToken);
        if (error) throw error;
      } else {
        const { error } = await register(email, password, fullName, captchaToken);
        if (error) throw error;
      }
      clearAuthAttempts(mode, email);
      navigate("/");
    } catch (err: any) {
      const attempts = readAuthAttempts(mode, email);
      const nextCount = attempts.count + 1;
      writeAuthAttempts(mode, email, {
        count: nextCount,
        lockedUntil: nextCount >= MAX_AUTH_ATTEMPTS ? Date.now() + AUTH_COOLDOWN_MS : 0,
      });
      setCaptchaToken("");
      setCaptchaResetKey((key) => key + 1);
      setError(err.message || "حدث خطأ، يرجى المحاولة مجدداً.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "24rem", margin: "4rem auto", padding: "0 1.25rem" }}>
      <div style={{ padding: "2rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", textAlign: "center", marginBottom: "1.5rem" }}>
          {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
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
          <TurnstileCaptcha key={`${mode}-${captchaResetKey}`} onToken={setCaptchaToken} />
          <button
            type="submit"
            disabled={loading || !captchaToken}
            style={{ width: "100%", padding: "0.625rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: loading || !captchaToken ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 700, fontFamily: "inherit", opacity: loading || !captchaToken ? 0.7 : 1 }}
          >
            {loading ? "جارٍ المعالجة..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.875rem", color: C.inkSoft }}>
          {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب؟ "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setCaptchaToken(""); setCaptchaResetKey((key) => key + 1); }}
            style={{ color: C.emeraldDeep, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", textDecoration: "underline" }}
          >
            {mode === "login" ? "سجّل الآن" : "سجّل دخولك"}
          </button>
        </p>
      </div>
    </div>
  );
}
