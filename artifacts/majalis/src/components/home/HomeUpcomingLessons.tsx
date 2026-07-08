import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { RequestManager } from "@/lib/request-manager";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { sortKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { computeNextOccurrenceMs, getKuwaitClock, isLessonThisDay } from "@/lib/lesson-time";

type HomeTab = "all" | "men" | "women";

const HOME_TABS: { id: HomeTab; label: string }[] = [
  { id: "all",   label: "الكل" },
  { id: "men",   label: "الدروس الرجالية" },
  { id: "women", label: "للنساء فقط" },
];

const TAB_STORAGE_KEY = "majalis-lesson-tab";

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

function readStoredTab(): HomeTab {
  if (typeof window === "undefined") return "all";
  const v = window.localStorage.getItem(TAB_STORAGE_KEY);
  return v === "men" || v === "women" ? v : "all";
}

export function HomeUpcomingLessons({
  initialLessons,
}: {
  initialLessons?: KuwaitLessonRecord[];
} = {}) {
  const [allLessons, setAllLessons] = useState<KuwaitLessonRecord[]>(
    initialLessons ? initialLessons.filter((l) => !isCourse(l)) : [],
  );
  const [tab, setTab] = useState<HomeTab>(readStoredTab);
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

  function handleTab(t: HomeTab) {
    setTab(t);
    if (typeof window !== "undefined") window.localStorage.setItem(TAB_STORAGE_KEY, t);
  }

  const clock = getKuwaitClock();
  const todayArabic = ARABIC_WEEKDAY[clock.weekday] ?? "";

  // الوقت الحالي بالمللي ثانية (توقيت الكويت)
  const nowMs = clock.dayStartMs + (clock.hour * 60 + clock.minute) * 60_000;
  const TWO_HOURS_MS = 2 * 3_600_000;

  function applyTabFilter(lesson: KuwaitLessonRecord) {
    if (tab === "men")   return !lesson.isWomenOnly;
    if (tab === "women") return lesson.isWomenOnly === true;
    return true;
  }

  // دروس اليوم: يُعرض الدرس فقط إذا لم يمرّ على بدايته أكثر من ساعتين
  const todayLessons = allLessons
    .filter(l => isLessonThisDay(l.day) && applyTabFilter(l))
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

  const todayIds = new Set(todayLessons.map(l => l.id));
  const upcomingLessons = sortKuwaitLessons(
    allLessons.filter((lesson) => applyTabFilter(lesson) && !todayIds.has(lesson.id)),
  ).slice(0, 4);

  const filterStrip = (
    <div className="home-lessons-tabs" role="tablist" aria-label="تصفية الدروس">
      {HOME_TABS.map(({ id, label }) => (
        <button
                  type="button"
          key={id}
          role="tab"
          aria-selected={tab === id}
          onClick={() => handleTab(id)}
          className={`home-lessons-tab${tab === id ? " is-active" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* ── دروس اليوم ── */}
      {(loading || todayLessons.length > 0) && (
        <section className="home-section" aria-labelledby="today-lessons-heading">
          <div className="home-section-head">
            <div>
              <p className="home-eyebrow">اليوم · {todayArabic}</p>
              <h2 id="today-lessons-heading">دروس اليوم</h2>
              <p>الدروس المجدولة لهذا اليوم — القادمة والمنتهية.</p>
            </div>
            <div className="home-section-head-links">
              <Link href="/lessons" className="home-section-link">كل الدروس</Link>
            </div>
          </div>

          {filterStrip}

          <PageLoadingGuard
            loading={loading}
            empty={!loading && todayLessons.length === 0}
            emptyText="لا توجد دروس في هذه الفئة اليوم"
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

        {filterStrip}

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
