import { useEffect, useMemo, useState } from "react";
import { C, GOVERNORATES } from "@/lib/theme";
import { getLessons, registerForLesson, unregisterFromLesson, getMyRegistrations } from "@/lib/supabase";
import { DEMO_LESSONS, demoNoticeText } from "@/lib/demo-content";
import { PageHeader, Loading, Empty, Chip, ErrorState, DemoNotice } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";

const CATEGORIES = ["الكل", "تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];

export default function LessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("الكل");
  const [city, setCity] = useState("كل المحافظات");
  const [search, setSearch] = useState("");
  const [myReg, setMyReg] = useState<string[]>([]);
  const { user, isLoggedIn } = useAuth() as any;

  const fetchLessons = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await getLessons({ category, city, search });
      if (fetchError) throw fetchError;
      setLessons(data);
    } catch {
      setError("تعذر تحميل الدروس. تحقق من الاتصال وحاول مجددًا.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [category, city]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      getMyRegistrations(user.id).then(setMyReg);
    }
  }, [isLoggedIn, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLessons();
  };

  const toggleReg = async (lessonId: string) => {
    if (!isLoggedIn) return alert("يرجى تسجيل الدخول أولاً");
    if (myReg.includes(lessonId)) {
      await unregisterFromLesson(user.id, lessonId);
      setMyReg(myReg.filter((id) => id !== lessonId));
    } else {
      await registerForLesson(user.id, lessonId);
      setMyReg([...myReg, lessonId]);
    }
  };

  const usingDemo = lessons.length === 0 && !loading && !error;
  const displayed = usingDemo ? DEMO_LESSONS : lessons;

  const stats = useMemo(
    () => ({
      total: displayed.length,
      categories: new Set(displayed.map((l) => l.category).filter(Boolean)).size,
    }),
    [displayed]
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="دروس معتمدة"
        title="الدروس والدورات"
        subtitle="استعرض الدروس العلمية الشرعية المعتمدة وسجّل حضورك."
      />

      <div className="page-stats-row">
        <span>{stats.total} درس</span>
        <span>{stats.categories} تصنيف</span>
      </div>

      <form onSubmit={handleSearch} className="page-search-form">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن درس..."
        />
        <button type="submit">بحث</button>
      </form>

      <div className="page-chip-row">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
      </div>
      <div className="page-chip-row">
        {["كل المحافظات", ...GOVERNORATES].map((g) => (
          <Chip key={g} active={city === g} onClick={() => setCity(g)}>{g}</Chip>
        ))}
      </div>

      {usingDemo && <DemoNotice text={demoNoticeText("الدروس")} />}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState text={error} onRetry={fetchLessons} />
      ) : displayed.length === 0 ? (
        <Empty text="لا توجد دروس." />
      ) : (
        <div className="page-card-grid">
          {displayed.map((l: any) => (
            <article key={l.id} className="page-card">
              <div className="page-card-header">
                <p>{l.title}</p>
                {l.category && <span className="page-tag">{l.category}</span>}
              </div>
              <p className="page-meta">{l.sheikhs?.name}</p>
              <p className="page-meta">
                {[l.mosque, l.city, l.schedule].filter(Boolean).join(" · ")}
              </p>
              {l.description && <p className="page-desc">{l.description}</p>}
              <div className="page-card-footer">
                <span className="page-soft-tag">{l.audience || "الكل"}</span>
                <span className="page-soft-tag">{l.delivery || "حضور فقط"}</span>
                {isLoggedIn && !usingDemo && (
                  <button type="button" onClick={() => toggleReg(l.id)} className="page-action-btn">
                    {myReg.includes(l.id) ? "إلغاء التسجيل" : "سجّل حضوري"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
