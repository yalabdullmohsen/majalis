import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { RequestManager } from "@/lib/request-manager";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { computeNextOccurrenceMs, getKuwaitClock, isLessonToday } from "@/lib/lesson-time";

type HomeTab = "all" | "men" | "women";

const HOME_TABS: { id: HomeTab; label: string }[] = [
  { id: "all",   label: "الكل" },
  { id: "men",   label: "الدروس الرجالية" },
  { id: "women", label: "للنساء فقط" },
];

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

  const clock = getKuwaitClock();
  const todayArabic = ARABIC_WEEKDAY[clock.weekday] ?? "";

  // نعيد حساب nextOccurrenceMs بشكل حديث لكل درس — لا نعتمد على القيم المُخزّنة
  // لأن القيم المخزّنة تصبح قديمة إذا مرّ وقت الدرس دون إعادة تحميل
  const todayLessons = sortKuwaitLessons(
    allLessons.filter((l) => {
      const freshMs = computeNextOccurrenceMs(l.day, l.time);
      return isLessonToday(freshMs);
    }),
  ).slice(0, 6);

  const upcomingLessons = sortKuwaitLessons(
    allLessons.filter((lesson) => {
      // "الدروس الرجالية": كل الدروس غير المخصصة للنساء فقط (عام + رجالي)
      if (tab === "men")   return !lesson.isWomenOnly;
      // "للنساء فقط": الدروس المخصصة للنساء حصراً بنص صريح
      if (tab === "women") return lesson.isWomenOnly === true;
      return true;
    }),
  ).slice(0, 4);

  return (
    <>
      {/* ── دروس اليوم ── */}
      {(loading || todayLessons.length > 0) && (
        <section className="home-section" aria-labelledby="today-lessons-heading">
          <div className="home-section-head">
            <div>
              <p className="home-eyebrow">اليوم · {todayArabic}</p>
              <h2 id="today-lessons-heading">دروس اليوم</h2>
              <p>الدروس المجدولة لهذا اليوم ولم يمرّ وقتها بعد.</p>
            </div>
            <div className="home-section-head-links">
              <Link href="/lessons" className="home-section-link">كل الدروس</Link>
            </div>
          </div>

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
        </section>
      )}

      {/* ── الدروس القادمة ── */}
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
          empty={!loading && upcomingLessons.length === 0}
          emptyText="لا توجد دروس في هذه الفئة"
        >
          <div className="home-kuwait-grid lesson-unified-grid">
            {upcomingLessons.map((lesson) => (
              <UnifiedLessonCard key={lesson.id} lesson={fromKuwaitLesson(lesson)} compact />
            ))}
          </div>
        </PageLoadingGuard>
      </section>
    </>
  );
}

export default HomeUpcomingLessons;
