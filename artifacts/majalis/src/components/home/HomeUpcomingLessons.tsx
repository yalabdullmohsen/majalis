import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { RequestManager } from "@/lib/request-manager";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";

type HomeTab = "all" | "men" | "women";

const HOME_TABS: { id: HomeTab; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "men", label: "الدروس الرجالية" },
  { id: "women", label: "الدروس النسائية" },
];

function isCourse(lesson: KuwaitLessonRecord) {
  return lesson.isCourse || lesson.activityType === "دورة";
}


export function HomeUpcomingLessons({
  initialLessons,
}: {
  initialLessons?: KuwaitLessonRecord[];
} = {}) {
  const [allLessons, setAllLessons] = useState<KuwaitLessonRecord[]>(
    initialLessons ? initialLessons.filter((l) => !isCourse(l)) : [],
  );
  const [tab, setTab] = useState<HomeTab>("all");
  const [loading, setLoading] = useState(!initialLessons);

  useEffect(() => {
    if (initialLessons) return;
    void RequestManager.run("home:upcoming-lessons", () => getUnifiedActiveLessons())
      .then(({ lessons: items }) => {
        const safeItems = Array.isArray(items) ? items : [];
        setAllLessons(safeItems.filter((l) => !isCourse(l)));
      })
      .catch(() => setAllLessons([]))
      .finally(() => setLoading(false));
  }, [initialLessons]);

  const lessons = sortKuwaitLessons(
    allLessons.filter((lesson) => {
      if (tab === "men") return !lesson.hasWomenSection;
      if (tab === "women") return lesson.hasWomenSection;
      return true;
    }),
  ).slice(0, 4);

  return (
    <section className="home-section" aria-labelledby="upcoming-lessons-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">جدول الأسبوع</p>
          <h2 id="upcoming-lessons-heading">الدروس القادمة</h2>
          <p>دروس علمية مرتّبة حسب أقرب موعد.</p>
        </div>
        <div className="home-section-head-links">
          <Link href="/calendar" className="home-section-link">التقويم</Link>
          <Link href="/lessons" className="home-section-link">كل الدروس</Link>
        </div>
      </div>

      <div className="home-lessons-tabs" role="tablist" aria-label="تصفية الدروس">
        {HOME_TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`home-lessons-tab${tab === id ? " is-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      <PageLoadingGuard
        loading={loading}
        empty={!loading && lessons.length === 0}
        emptyText="لا توجد دروس في هذه الفئة"
      >
        <div className="home-kuwait-grid lesson-unified-grid">
          {lessons.map((lesson) => (
            <UnifiedLessonCard key={lesson.id} lesson={fromKuwaitLesson(lesson)} compact />
          ))}
        </div>
      </PageLoadingGuard>
    </section>
  );
}

export default HomeUpcomingLessons;
