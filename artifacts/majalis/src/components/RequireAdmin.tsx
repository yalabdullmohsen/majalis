import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth() as any;

  if (loading) return <Loading />;

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: "24rem", margin: "5rem auto", padding: "2rem", textAlign: "center", background: C.panel, borderRadius: "0.5rem", border: `1px solid ${C.line}` }}>
        <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔒</p>
        <h1 style={{ color: C.emeraldDeep, fontFamily: "Amiri, serif", fontSize: "1.25rem", marginBottom: "0.75rem" }}>لوحة الإدارة محمية</h1>
        <p style={{ color: C.inkSoft, marginBottom: "1rem", fontSize: "0.9375rem" }}>لا يمكن الوصول إلى هذه الصفحة إلا للمسؤولين.</p>
        <Link href="/" style={{ color: C.emeraldDeep, textDecoration: "underline", fontSize: "0.875rem" }}>
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
