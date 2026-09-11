import { useEffect, useState } from "react";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { RequestManager } from "@/lib/request-manager";
import { beginAbortScope, abortScope } from "@/lib/route-abort";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { Widget, type WidgetState } from "@/components/widgets/Widget";

function isCourse(lesson: KuwaitLessonRecord) {
  return lesson.isCourse || lesson.activityType === "دورة";
}

const CoursesIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" style={{ marginTop: "0.15rem", flexShrink: 0 }}>
    <polygon points="9,1 11,6.5 17,6.5 12.5,10 14.5,16 9,12.5 3.5,16 5.5,10 1,6.5 7,6.5" fill="var(--mj-brand-deep)" opacity="0.75"/>
  </svg>
);

export function HomeUpcomingCourses() {
  const [courses, setCourses] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const signal = beginAbortScope("home:upcoming-courses");
    setLoading(true);
    RequestManager.run(
      "home:upcoming-courses",
      () => getUnifiedActiveLessons(),
      { signal, dedupeKey: "home:upcoming-courses" },
    )
      .then(({ lessons: items }) => {
        if (cancelled) return;
        const safeItems = Array.isArray(items) ? items : [];
        setCourses(sortKuwaitLessons(safeItems.filter(isCourse)).slice(0, 4));
      })
      .catch((err) => {
        if (cancelled || (err as Error)?.name === "AbortError") return;
        /* أبقِ الدورات السابقة عند فشل إعادة الجلب */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      abortScope("home:upcoming-courses");
      RequestManager.cancel("home:upcoming-courses");
    };
  }, []);

  const state: WidgetState = loading ? "loading" : courses.length === 0 ? "empty" : "ready";

  return (
    <Widget
      id="upcoming-courses"
      icon={<CoursesIcon />}
      eyebrow="برامج علمية"
      title="الدورات القادمة"
      description="دورات علمية منظّمة مرتّبة حسب أقرب موعد."
      moreHref="/lessons#courses"
      moreLabel="كل الدورات"
      state={state}
      skeletonRows={3}
      emptyMessage="لا توجد دورات قادمة حالياً."
      emptyCtaHref="/lessons"
      emptyCtaLabel="تصفّح الدروس"
    >
      <div className="home-kuwait-grid lesson-unified-grid">
        {courses.map((lesson) => (
          <UnifiedLessonCard key={lesson.id} lesson={fromKuwaitLesson(lesson)} compact />
        ))}
      </div>
    </Widget>
  );
}

export default HomeUpcomingCourses;
