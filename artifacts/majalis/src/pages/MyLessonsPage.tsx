import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import SheikhAvatar from "@/components/SheikhAvatar";
import { Card, Empty, ErrorMessage, Loading, PageHeader } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { getMyRegisteredLessons, getSupabaseErrorMessage } from "@/lib/supabase";

export default function MyLessonsPage() {
  const { user, isLoggedIn } = useAuth() as any;
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!isLoggedIn || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    getMyRegisteredLessons(user.id).then(({ data, error }) => {
      if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل دروسك المسجلة."));
      setLessons(data);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل دروسك المسجلة."));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [isLoggedIn, user?.id]);

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: "32rem", margin: "4rem auto", padding: "0 1.25rem" }}>
        <Card>
          <Empty text="يرجى تسجيل الدخول لعرض دروسك المسجلة." />
          <Link href="/login" style={{ display: "block", textAlign: "center", color: C.emeraldDeep, fontWeight: 700 }}>تسجيل الدخول</Link>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader eyebrow="متابعتي" title="دروسي المسجلة" subtitle="كل الدروس التي سجلت حضورك فيها من خلال المنصة." />
      {error && <ErrorMessage text={error} onRetry={load} />}
      {loading ? <Loading /> : lessons.length === 0 ? <Empty text="لا توجد دروس مسجلة بعد." /> : (
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {lessons.map((lesson: any) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`} style={{ display: "block" }}>
              <article style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "1rem", borderRadius: "0.65rem", border: `1px solid ${C.line}`, background: C.panel }}>
                <SheikhAvatar sheikh={lesson.sheikhs} size={52} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 0.3rem", color: C.emeraldDeep, fontFamily: "Amiri, serif", fontSize: "1.15rem" }}>{lesson.title}</h2>
                  <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.82rem" }}>
                    {[lesson.sheikhs?.name, lesson.city, lesson.schedule].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span style={{ color: C.brassDeep, fontSize: "0.78rem" }}>
                  {lesson.registered_at ? new Date(lesson.registered_at).toLocaleDateString("ar-KW") : ""}
                </span>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
