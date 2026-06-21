import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getSheikhs } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty } from "@/components/ui-common";

export default function SheikhsPage() {
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSheikhs().then(({ data }) => {
      setSheikhs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="نخبة معتمدة"
        title="المشايخ والدعاة"
        subtitle="تعرّف على المشايخ والدعاة المعتمدين، وإجازاتهم وتخصصاتهم ودروسهم."
      />

      {loading ? (
        <Loading />
      ) : sheikhs.length === 0 ? (
        <Empty text="لا يوجد مشايخ بعد." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {sheikhs.map((s: any) => (
            <Link key={s.id} href={`/sheikhs/${s.id}`} style={{ textDecoration: "none" }}>
              <div style={{ borderRadius: "0.375rem", border: `1px solid ${C.line}`, padding: "1rem", background: C.panel, height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontWeight: 700, color: C.emeraldDeep, fontSize: "1rem" }}>{s.name}</p>
                  {s.is_verified && (
                    <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: C.sage, color: C.emeraldDeep }}>معتمد</span>
                  )}
                </div>
                {s.ijazah && <p style={{ fontSize: "0.75rem", marginBottom: "0.25rem", color: C.brassDeep }}>{s.ijazah}</p>}
                <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                  {[s.city, s.years_experience ? `${s.years_experience} سنة خبرة` : null].filter(Boolean).join(" · ")}
                </p>
                {s.specialties?.length > 0 && (
                  <p style={{ fontSize: "0.875rem", marginTop: "0.5rem", color: C.ink }}>{s.specialties.join("، ")}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
