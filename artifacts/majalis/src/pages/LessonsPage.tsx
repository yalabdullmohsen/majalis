import { useEffect, useMemo, useState } from "react";
import { C, GOVERNORATES } from "@/lib/theme";
import { getLessons, registerForLesson, unregisterFromLesson, getMyRegistrations } from "@/lib/supabase";
import { DEMO_LESSONS, demoNoticeText, isDemoId } from "@/lib/demo-content";
import { PageHeader, Loading, Empty, Chip, DemoNotice } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import ContentActions from "@/components/ContentActions";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveLessonSheikhImage, parseLessonSchedule } from "@/lib/sheikh-image";
import { Link } from "wouter";

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

  const displayed = lessons;

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
      ) : displayed.length === 0 ? (
        <Empty text="لا توجد دروس." />
      ) : (
        <div className="page-card-grid lesson-cards-grid">
          {displayed.map((l: any) => {
            const sheikhName = l.sheikhs?.name || l.speaker_name || "شيخ معتمد";
            const { day, time } = parseLessonSchedule(l.schedule);
            return (
              <article key={l.id} className="page-card lesson-card">
                <div className="lesson-card-header">
                  <SheikhAvatar
                    src={resolveLessonSheikhImage(l)}
                    name={sheikhName}
                    size="responsive"
                  />
                  <div className="lesson-card-head-text">
                    <p className="lesson-card-sheikh">{sheikhName}</p>
                    <h3 className="lesson-card-title">{l.title}</h3>
                  </div>
                </div>
                <div className="lesson-card-meta-grid">
                  <div>
                    <span className="lesson-card-label">المسجد</span>
                    <strong>{l.mosque || "—"}</strong>
                  </div>
                  <div>
                    <span className="lesson-card-label">اليوم</span>
                    <strong>{day}</strong>
                  </div>
                  <div>
                    <span className="lesson-card-label">الوقت</span>
                    <strong>{time}</strong>
                  </div>
                </div>
                {l.description && <p className="page-desc">{l.description}</p>}
                {!isDemoId(l.id) && (
                  <ContentActions contentType="lesson" contentId={l.id} />
                )}
                <div className="page-card-footer">
                  <span className="page-tag">{l.category || "درس"}</span>
                  <span className="page-soft-tag">{l.audience || "الكل"}</span>
                  <Link href="/lessons" className="page-action-btn lesson-card-details-btn">
                    عرض التفاصيل
                  </Link>
                  {isLoggedIn && !usingDemo && (
                    <button type="button" onClick={() => toggleReg(l.id)} className="page-action-btn">
                      {myReg.includes(l.id) ? "إلغاء التسجيل" : "سجّل حضوري"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
