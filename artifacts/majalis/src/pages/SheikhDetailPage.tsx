import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getSheikhById, getSupabaseErrorMessage } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading, Empty, ErrorMessage } from "@/components/ui-common";
import SheikhAvatar from "@/components/SheikhAvatar";

export default function SheikhDetailPage({ params }: { params: { id: string } }) {
  const [sheikh, setSheikh] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonSearch, setLessonSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getSheikhById(params.id).then(({ sheikh, lessons }) => {
      setSheikh(sheikh);
      setLessons(lessons);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل بيانات الشيخ."));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [params.id]);

  if (loading) return <Loading />;
  if (error) return <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}><ErrorMessage text={error} onRetry={load} /></div>;
  if (!sheikh) return <Empty text="لم يُعثر على الشيخ." />;
  const filteredLessons = lessonSearch.trim()
    ? lessons.filter((lesson) => lesson.title?.includes(lessonSearch.trim()) || lesson.description?.includes(lessonSearch.trim()) || lesson.category?.includes(lessonSearch.trim()))
    : lessons;

  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <Link href="/sheikhs" style={{ fontSize: "0.875rem", color: C.brassDeep, textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
        ← العودة إلى المشايخ
      </Link>

      <div style={{ padding: "clamp(1.25rem, 4vw, 2rem)", borderRadius: "1rem", border: `1px solid ${C.line}`, background: `linear-gradient(135deg, ${C.panel}, ${C.parchmentDeep})`, marginBottom: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <SheikhAvatar sheikh={sheikh} size={118} />
            <div>
              <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", margin: 0 }}>{sheikh.name}</h1>
              <p style={{ color: C.brassDeep, margin: "0.35rem 0 0", fontWeight: 700 }}>{sheikh.specialty || sheikh.specialties?.[0] || "علم شرعي"}</p>
              <p style={{ color: C.inkSoft, margin: "0.15rem 0 0", fontSize: "0.875rem" }}>{sheikh.country || sheikh.city || "غير محدد"}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            <div style={{ padding: "0.9rem", background: C.panel, borderRadius: "0.75rem", textAlign: "center" }}><strong style={{ color: C.emeraldDeep, fontSize: "1.4rem" }}>{lessons.length}</strong><p style={{ margin: 0, color: C.inkSoft, fontSize: "0.75rem" }}>درس</p></div>
            <div style={{ padding: "0.9rem", background: C.panel, borderRadius: "0.75rem", textAlign: "center" }}><strong style={{ color: C.brassDeep, fontSize: "1.4rem" }}>{sheikh.years_experience || 0}</strong><p style={{ margin: 0, color: C.inkSoft, fontSize: "0.75rem" }}>سنة خبرة</p></div>
            <div style={{ padding: "0.9rem", background: C.panel, borderRadius: "0.75rem", textAlign: "center" }}><strong style={{ color: C.emeraldDeep, fontSize: "1rem" }}>{sheikh.is_verified ? "معتمد" : "قيد المراجعة"}</strong><p style={{ margin: 0, color: C.inkSoft, fontSize: "0.75rem" }}>الحالة</p></div>
          </div>
        </div>

        {sheikh.ijazah && (
          <p style={{ fontSize: "0.875rem", color: C.brassDeep, margin: "1.25rem 0 0.75rem" }}>
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
      </div>

      {lessons.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", margin: 0 }}>دروس الشيخ</h2>
            <input value={lessonSearch} onChange={(e) => setLessonSearch(e.target.value)} placeholder="ابحث داخل دروس الشيخ..." style={{ flex: "1 1 240px", maxWidth: "22rem", padding: "0.6rem 0.8rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, color: C.ink, fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {filteredLessons.map((l: any) => (
              <Link href={`/lessons/${l.id}`} id={`lesson-${l.id}`} key={l.id} style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
                <p style={{ fontWeight: 700, color: C.emeraldDeep, marginBottom: "0.25rem" }}>{l.title}</p>
                <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                  {[l.mosque, l.city, l.schedule].filter(Boolean).join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
