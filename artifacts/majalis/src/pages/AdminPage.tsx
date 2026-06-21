import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getPendingFawaid, moderateFawaid } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth() as any;
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFawaid = () => {
    setLoading(true);
    getPendingFawaid().then((data) => {
      setFawaid(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (isAdmin) fetchFawaid();
  }, [isAdmin]);

  const moderate = async (id: string, status: string) => {
    await moderateFawaid(id, status);
    fetchFawaid();
  };

  if (authLoading) return <Loading />;
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: "24rem", margin: "4rem auto", padding: "0 1.25rem", textAlign: "center" }}>
        <p style={{ color: C.inkSoft, marginBottom: "1rem" }}>هذه الصفحة للمشرفين فقط.</p>
        <Link href="/" style={{ color: C.emeraldDeep, textDecoration: "underline" }}>العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="الإدارة"
        title="لوحة التحكم"
        subtitle="مراجعة الفوائد المقدّمة من المستخدمين."
      />

      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "1rem" }}>
        الفوائد المعلّقة ({fawaid.length})
      </h2>

      {loading ? <Loading /> : fawaid.length === 0 ? <Empty text="لا توجد فوائد معلّقة." /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {fawaid.map((f: any) => (
            <div key={f.id} style={{ padding: "1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel }}>
              <p style={{ fontSize: "0.9375rem", color: C.ink, lineHeight: "1.75", marginBottom: "0.75rem" }}>{f.text}</p>
              {f.author_name && <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginBottom: "0.75rem" }}>المُرسِل: {f.author_name}</p>}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => moderate(f.id, "approved")}
                  style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}
                >
                  قبول ✓
                </button>
                <button
                  onClick={() => moderate(f.id, "rejected")}
                  style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", background: C.parchmentDeep, color: "#dc2626", border: `1px solid ${C.line}`, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}
                >
                  رفض ✗
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
