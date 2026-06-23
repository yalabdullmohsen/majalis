import { useEffect, useState } from "react";
import { Link } from "wouter";
import { C, GOVERNORATES } from "@/lib/theme";
import { getLessons, registerForLesson, unregisterFromLesson, getMyRegistrations, getSupabaseErrorMessage } from "@/lib/supabase";
import { PageHeader, Loading, Empty, Chip, ErrorMessage } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import SheikhAvatar from "@/components/SheikhAvatar";

const CATEGORIES = ["الكل", "تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];

export default function LessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [city, setCity] = useState("كل المحافظات");
  const [search, setSearch] = useState("");
  const [myReg, setMyReg] = useState<string[]>([]);
  const [error, setError] = useState("");
  const { user, isLoggedIn } = useAuth() as any;

  const fetch = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await getLessons({ category, city, search });
    if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل الدروس."));
    setLessons(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [category, city]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      getMyRegistrations(user.id)
        .then(setMyReg)
        .catch((err) => setError(getSupabaseErrorMessage(err, "تعذّر تحميل تسجيلاتك.")));
    }
  }, [isLoggedIn, user]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetch(); };

  const toggleReg = async (lessonId: string) => {
    if (!isLoggedIn) return alert("يرجى تسجيل الدخول أولاً");
    if (myReg.includes(lessonId)) {
      const { error } = await unregisterFromLesson(user.id, lessonId);
      if (error) {
        setError(getSupabaseErrorMessage(error, "تعذّر إلغاء التسجيل."));
        return;
      }
      setMyReg(myReg.filter((id) => id !== lessonId));
    } else {
      const { error } = await registerForLesson(user.id, lessonId);
      if (error) {
        setError(getSupabaseErrorMessage(error, "تعذّر التسجيل في الدرس."));
        return;
      }
      setMyReg([...myReg, lessonId]);
    }
  };

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="دروس معتمدة"
        title="الدروس والدورات"
        subtitle="استعرض الدروس العلمية الشرعية المعتمدة وسجّل حضورك."
      />

      {error && <ErrorMessage text={error} onRetry={fetch} />}

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن درس..."
          style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, fontSize: "0.875rem", fontFamily: "inherit", background: C.panel, color: C.ink, outline: "none" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontSize: "0.875rem", fontFamily: "inherit" }}>بحث</button>
      </form>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {["كل المحافظات", ...GOVERNORATES].map((g) => (
          <Chip key={g} active={city === g} onClick={() => setCity(g)}>{g}</Chip>
        ))}
      </div>

      {loading ? <Loading /> : lessons.length === 0 ? <Empty text="لا توجد دروس." /> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
          {lessons.map((l: any) => (
            <div id={`lesson-${l.id}`} key={l.id} style={{ padding: "1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <SheikhAvatar sheikh={l.sheikhs} size={42} />
                  <Link href={`/lessons/${l.id}`} style={{ fontWeight: 700, color: C.emeraldDeep, fontSize: "1rem" }}>{l.title}</Link>
                </div>
                {l.category && <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: C.sage, color: C.emeraldDeep, flexShrink: 0, marginRight: "0.5rem" }}>{l.category}</span>}
              </div>
              <p style={{ fontSize: "0.75rem", color: C.brassDeep, marginBottom: "0.25rem" }}>{l.sheikhs?.name}</p>
              <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginBottom: "0.5rem" }}>
                {[l.mosque, l.city, l.schedule].filter(Boolean).join(" · ")}
              </p>
              {l.description && <p style={{ fontSize: "0.8125rem", color: C.ink, marginBottom: "0.75rem", lineHeight: "1.6" }}>{l.description}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, color: C.inkSoft }}>{l.audience || "الكل"}</span>
                <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, color: C.inkSoft }}>{l.delivery || "حضور فقط"}</span>
                {isLoggedIn && (
                  <button
                    onClick={() => toggleReg(l.id)}
                    style={{ marginRight: "auto", fontSize: "0.75rem", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${myReg.includes(l.id) ? C.line : C.emerald}`, background: myReg.includes(l.id) ? C.parchmentDeep : C.emerald, color: myReg.includes(l.id) ? C.inkSoft : C.parchment, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {myReg.includes(l.id) ? "إلغاء التسجيل" : "سجّل حضوري"}
                  </button>
                )}
                <Link href={`/lessons/${l.id}`} style={{ fontSize: "0.75rem", color: C.brassDeep, marginRight: isLoggedIn ? 0 : "auto", fontWeight: 700 }}>تفاصيل الدرس</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
