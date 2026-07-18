import { useEffect, useState } from "react";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { RequestManager } from "@/lib/request-manager";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { computeNextOccurrenceMs, getKuwaitClock, isLessonThisDay } from "@/lib/lesson-time";
import { Widget } from "@/components/widgets/Widget";

const LessonsIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
    <polygon points="8,1 10,6 15.5,6 11,9.5 13,15 8,11.5 3,15 5,9.5 0.5,6 6,6" fill="none" stroke="#176B57" strokeWidth="1.2"/>
  </svg>
);

const ARABIC_WEEKDAY: Record<number, string> = {
  0: "الأحد",
  1: "الاثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};

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

  const clock = getKuwaitClock();
  const todayArabic = ARABIC_WEEKDAY[clock.weekday] ?? "";

  // الوقت الحالي بالمللي ثانية (توقيت الكويت)
  const nowMs = clock.dayStartMs + (clock.hour * 60 + clock.minute) * 60_000;
  const TWO_HOURS_MS = 2 * 3_600_000;

  // دروس اليوم: يُعرض الدرس فقط إذا لم يمرّ على بدايته أكثر من ساعتين
  const todayLessons = allLessons
    .filter(l => isLessonThisDay(l.day))
    .map(l => {
      const freshMs = computeNextOccurrenceMs(l.day, l.time);
      // إذا انتقل الحساب للأسبوع القادم (مرّ الوقت)، أعِد وقت اليوم نفسه
      const todayMs = freshMs > clock.dayStartMs + 24 * 3_600_000
        ? freshMs - 7 * 24 * 3_600_000
        : freshMs;
      return { ...l, nextOccurrenceMs: todayMs };
    })
    .filter(l => nowMs <= l.nextOccurrenceMs + TWO_HOURS_MS)
    .sort((a, b) => a.nextOccurrenceMs - b.nextOccurrenceMs)
    .slice(0, 6);

  return (
    <Widget
      id="today-lessons"
      icon={<LessonsIcon />}
      eyebrow={`اليوم · ${todayArabic}`}
      title="دروس اليوم"
      moreHref="/lessons"
      moreLabel="كل الدروس"
      state="ready"
    >
      <PageLoadingGuard
        loading={loading}
        empty={!loading && todayLessons.length === 0}
        emptyText="لا توجد دروس مجدولة اليوم"
      >
        <div className="home-kuwait-grid lesson-unified-grid">
          {todayLessons.map((lesson) => (
            <UnifiedLessonCard key={lesson.id} lesson={fromKuwaitLesson(lesson)} compact />
          ))}
        </div>
      </PageLoadingGuard>
    </Widget>
  );
}

export default HomeUpcomingLessons;
