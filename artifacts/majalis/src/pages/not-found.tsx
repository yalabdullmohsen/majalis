import { Link } from "wouter";
import { C } from "@/lib/theme";

export default function NotFound() {
  return (
    <div style={{ minHeight: "calc(100vh - 5rem)", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1rem" }}>
      <section style={{ width: "min(100%, 44rem)", textAlign: "center", border: `1px solid ${C.line}`, borderRadius: "1.5rem", background: C.panel, padding: "clamp(2rem, 6vw, 3.25rem)", boxShadow: "0 18px 54px rgba(36, 31, 24, 0.08)" }}>
        <p style={{ color: C.brassDeep, fontWeight: 800, letterSpacing: "0.08em", marginBottom: "0.75rem" }}>404</p>
        <h1 style={{ color: C.emeraldDeep, fontFamily: "Amiri, serif", fontSize: "clamp(2rem, 7vw, 3.5rem)", lineHeight: 1.15, marginBottom: "0.85rem" }}>
          الصفحة غير موجودة
        </h1>
        <p style={{ color: C.inkSoft, fontSize: "1rem", lineHeight: 1.9, maxWidth: "34rem", margin: "0 auto 1.5rem" }}>
          يبدو أن الرابط غير صحيح أو أن الصفحة نُقلت داخل مجالس العلم. يمكنك الرجوع إلى الصفحة الرئيسية أو استخدام البحث للوصول إلى الدروس والمشايخ والكتب.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ borderRadius: "999px", background: C.emerald, color: C.parchment, padding: "0.75rem 1.25rem", fontWeight: 800 }}>
            العودة للرئيسية
          </Link>
          <Link href="/search" style={{ borderRadius: "999px", border: `1px solid ${C.line}`, color: C.emeraldDeep, padding: "0.75rem 1.25rem", fontWeight: 800, background: C.parchment }}>
            البحث في الموقع
          </Link>
        </div>
      </section>
    </div>
  );
}
