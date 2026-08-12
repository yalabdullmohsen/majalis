"use client";
// =====================================================================
//  app/login/page.jsx — تسجيل الدخول وإنشاء حساب
// =====================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { C } from "@/lib/theme";

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null); setBusy(true);
    const { error } = mode === "login"
      ? await login(email, password)
      : await register(email, password, name);
    setBusy(false);
    if (error) {
      setError(
        error.message?.includes("Invalid") ? "البريد أو كلمة المرور غير صحيحة"
        : error.message?.includes("already") ? "هذا البريد مسجّل مسبقًا"
        : error.message?.includes("least") ? "كلمة المرور قصيرة جدًا (6 أحرف على الأقل)"
        : "حدث خطأ، حاول مرة أخرى"
      );
      return;
    }
    router.push("/");
  };

  return (
    <div className="max-w-sm mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>
        {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
      </h1>
      <div className="rounded-md border p-5 space-y-3" style={{ borderColor: C.line, background: C.panel }}>
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل"
            className="w-full text-sm rounded-md border px-3 py-2 outline-none"
            style={{ borderColor: C.line, background: C.parchment, color: C.ink }} />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="البريد الإلكتروني"
          className="w-full text-sm rounded-md border px-3 py-2 outline-none"
          style={{ borderColor: C.line, background: C.parchment, color: C.ink }} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="كلمة المرور"
          className="w-full text-sm rounded-md border px-3 py-2 outline-none"
          style={{ borderColor: C.line, background: C.parchment, color: C.ink }} />
        {error && <p className="text-xs" style={{ color: "#B91C1C" }}>{error}</p>}
        <button onClick={submit} disabled={busy} className="w-full text-sm font-bold px-5 py-2.5 rounded-md"
          style={{ background: C.emerald, color: C.parchment, opacity: busy ? 0.6 : 1 }}>
          {busy ? "..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
        </button>
      </div>
      <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="w-full text-xs mt-4 underline" style={{ color: C.inkSoft }}>
        {mode === "login" ? "ليس لديك حساب؟ أنشئ واحدًا" : "لديك حساب؟ سجّل الدخول"}
      </button>
    </div>
  );
}
