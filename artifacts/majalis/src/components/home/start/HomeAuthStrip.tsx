import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { mapAuthError } from "@/lib/auth-messages";
import { AppCard } from "@/components/home/start/AppCard";

const DISMISS_KEY = "majlis-home-auth-dismissed-v1";

export function isHomeAuthStripDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function dismissStrip() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}

type Mode = "idle" | "login" | "register";

export function HomeAuthStrip() {
  const { login, register, isLoggedIn, loading } = useAuth();
  const [dismissed, setDismissed] = useState(isHomeAuthStripDismissed);
  const [mode, setMode] = useState<Mode>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading || isLoggedIn || dismissed) return null;

  const resetForm = () => {
    setMode("idle");
    setError("");
    setPassword("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        const { error: err } = await register(email.trim(), password, fullName.trim());
        if (err) {
          setError(mapAuthError(err));
          return;
        }
        dismissStrip();
        setDismissed(true);
        return;
      }
      const { error: err } = await login(email.trim(), password);
      if (err) {
        setError(mapAuthError(err));
        return;
      }
      dismissStrip();
      setDismissed(true);
    } finally {
      setBusy(false);
    }
  };

  if (mode === "idle") {
    return (
      <AppCard className="mj-home-auth" as="section" aria-label="الحساب">
        <div className="mj-home-auth__idle">
          <button type="button" className="mj-home-auth__primary" onClick={() => setMode("login")}>
            تسجيل الدخول
          </button>
          <button type="button" className="mj-home-auth__secondary" onClick={() => setMode("register")}>
            إنشاء حساب
          </button>
        </div>
        <button
          type="button"
          className="mj-home-auth__guest"
          onClick={() => {
            dismissStrip();
            setDismissed(true);
          }}
        >
          المتابعة كزائر
        </button>
      </AppCard>
    );
  }

  const isRegister = mode === "register";

  return (
    <AppCard className="mj-home-auth" as="section" aria-label={isRegister ? "إنشاء حساب" : "تسجيل الدخول"}>
      <form className="mj-home-auth__form" onSubmit={onSubmit}>
        {isRegister ? (
          <label className="mj-home-auth__field">
            <span>الاسم</span>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
        ) : null}
        <label className="mj-home-auth__field">
          <span>البريد الإلكتروني</span>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mj-home-auth__field">
          <span>كلمة المرور</span>
          <input
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        {error ? <p className="mj-home-auth__error" role="alert">{error}</p> : null}
        <button type="submit" className="mj-home-auth__submit" disabled={busy}>
          {isRegister ? "إنشاء حساب" : "تسجيل الدخول"}
        </button>
        {!isRegister ? (
          <Link href="/login?tab=forgot" className="mj-home-auth__forgot">
            نسيت كلمة المرور؟
          </Link>
        ) : null}
        <button type="button" className="mj-home-auth__back" onClick={resetForm}>
          العودة
        </button>
      </form>
    </AppCard>
  );
}
