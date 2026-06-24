import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getSheikhById } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading, Empty } from "@/components/ui-common";
import ContentActions from "@/components/ContentActions";

export default function SheikhDetailPage({ params }: { params: { id: string } }) {
  const [sheikh, setSheikh] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSheikhById(params.id).then(({ sheikh, lessons }) => {
      setSheikh(sheikh);
      setLessons(lessons);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return <Loading />;
  if (!sheikh) return <Empty text="لم يُعثر على الشيخ." />;

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <Link href="/sheikhs" style={{ fontSize: "0.875rem", color: C.brassDeep, textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
        ← العودة إلى المشايخ
      </Link>

      <div style={{ padding: "1.5rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>{sheikh.name}</h1>
          {sheikh.is_verified && (
            <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", borderRadius: "0.25rem", background: C.sage, color: C.emeraldDeep }}>شيخ معتمد</span>
          )}
        </div>

        {sheikh.ijazah && (
          <p style={{ fontSize: "0.875rem", color: C.brassDeep, marginBottom: "0.75rem" }}>
            <strong>الإجازة:</strong> {sheikh.ijazah}
          </p>
        )}
        {sheikh.city && (
          <p style={{ fontSize: "0.875rem", color: C.inkSoft, marginBottom: "0.5rem" }}>
            <strong>المحافظة:</strong> {sheikh.city}
            {sheikh.years_experience && ` · ${sheikh.years_experience} سنة خبرة`}
          </p>
        )}
        {sheikh.specialties?.length > 0 && (
          <div style={{ marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: C.ink, marginBottom: "0.25rem" }}>التخصصات:</p>
            <p style={{ fontSize: "0.875rem", color: C.inkSoft }}>{sheikh.specialties.join("، ")}</p>
          </div>
        )}
        {sheikh.bio && (
          <p style={{ fontSize: "0.875rem", color: C.ink, lineHeight: "1.75", marginBottom: "0.75rem" }}>{sheikh.bio}</p>
        )}
        {sheikh.biography && (
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: C.ink, marginBottom: "0.25rem" }}>السيرة العلمية:</p>
            <p style={{ fontSize: "0.875rem", color: C.ink, lineHeight: "1.75" }}>{sheikh.biography}</p>
          </div>
        )}
        <div style={{ marginTop: "1rem" }}>
          <ContentActions contentType="scholar" contentId={sheikh.id} />
        </div>
      </div>

      {lessons.length > 0 && (
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", marginBottom: "1rem" }}>دروس الشيخ</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {lessons.map((l: any) => (
              <div key={l.id} style={{ padding: "1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel }}>
                <p style={{ fontWeight: 700, color: C.ink, marginBottom: "0.25rem" }}>{l.title}</p>
                <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                  {[l.mosque, l.city, l.schedule].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
