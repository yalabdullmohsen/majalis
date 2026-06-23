import { Link } from "wouter";
import { C } from "@/lib/theme";

export default function NotFound() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: "28rem", padding: "2rem", borderRadius: "0.75rem", border: `1px solid ${C.line}`, background: C.panel, textAlign: "center" }}>
        <p style={{ fontSize: "2.4rem", marginBottom: "0.75rem" }}>🔎</p>
        <h1 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontFamily: "Amiri, serif", fontSize: "1.75rem" }}>
          الصفحة غير موجودة
        </h1>
        <p style={{ margin: "0 0 1.25rem", color: C.inkSoft, fontSize: "0.925rem", lineHeight: 1.8 }}>
          عذرًا، الرابط الذي طلبته غير متاح أو تم نقله. يمكنك العودة إلى الصفحة الرئيسية أو استخدام البحث للوصول إلى المحتوى.
        </p>
        <Link href="/" style={{ display: "inline-flex", padding: "0.65rem 1.25rem", borderRadius: "0.5rem", background: C.emerald, color: C.parchment, fontWeight: 700 }}>
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
