import { useEffect, useState } from "react";
import { SkeletonCardGrid } from "@/components/ui-common";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { Widget } from "@/components/widgets/Widget";

function isCourse(lesson: KuwaitLessonRecord) {
  return lesson.isCourse || lesson.activityType === "دورة";
}

const CoursesIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" style={{ marginTop: "0.15rem", flexShrink: 0 }}>
    <polygon points="9,1 11,6.5 17,6.5 12.5,10 14.5,16 9,12.5 3.5,16 5.5,10 1,6.5 7,6.5" fill="#176B57" opacity="0.75"/>
  </svg>
);

export function HomeUpcomingCourses() {
  const [courses, setCourses] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnifiedActiveLessons()
      .then(({ lessons: items }) => {
        const safeItems = Array.isArray(items) ? items : [];
        setCourses(sortKuwaitLessons(safeItems.filter(isCourse)).slice(0, 4));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && courses.length === 0) return null;

  return (
    <Widget
      id="upcoming-courses"
      icon={<CoursesIcon />}
      eyebrow="برامج علمية"
      title="الدورات القادمة"
      description="دورات علمية منظّمة مرتّبة حسب أقرب موعد."
      moreHref="/lessons?tab=courses"
      moreLabel="كل الدورات"
      state="ready"
    >
      {loading ? (
        <SkeletonCardGrid count={4} />
      ) : (
        <div className="home-kuwait-grid lesson-unified-grid">
          {courses.map((lesson) => (
            <UnifiedLessonCard key={lesson.id} lesson={fromKuwaitLesson(lesson)} compact />
          ))}
        </div>
      )}
    </Widget>
  );
}

export default HomeUpcomingCourses;
