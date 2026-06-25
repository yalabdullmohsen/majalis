import { useEffect, useMemo, useState } from "react";
import { getLessons, registerForLesson, unregisterFromLesson, getMyRegistrations } from "@/lib/supabase";
import { DEMO_LESSONS, demoNoticeText } from "@/lib/demo-content";
import { GOVERNORATES } from "@/lib/theme";
import { PageHeader, Loading, Empty, Chip, DemoNotice } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import { LessonCard } from "@/components/lessons/LessonCard";

const CATEGORIES = ["الكل", "تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];

export default function LessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [category, setCategory] = useState("الكل");
  const [city, setCity] = useState("كل المحافظات");
  const [search, setSearch] = useState("");
  const [myReg, setMyReg] = useState<string[]>([]);
  const { user, isLoggedIn } = useAuth() as any;

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const { data, usingSeed } = await getLessons({ category, city, search });
      setLessons(data);
      setUsingDemo(Boolean(usingSeed));
    } catch {
      setLessons(DEMO_LESSONS);
      setUsingDemo(true);
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

  const stats = useMemo(
    () => ({
      total: lessons.length,
      categories: new Set(lessons.map((l) => l.category).filter(Boolean)).size,
    }),
    [lessons],
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
      ) : lessons.length === 0 ? (
        <Empty text="لا توجد دروس." />
      ) : (
        <div className="page-card-grid lesson-cards-grid">
          {lessons.map((l) => (
            <LessonCard
              key={l.id}
              lesson={l}
              showRegister={isLoggedIn && !usingDemo}
              registered={myReg.includes(l.id)}
              onToggleRegister={() => toggleReg(l.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
