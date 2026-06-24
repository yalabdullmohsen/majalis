import { useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, GraduationCap } from "lucide-react";
import { CurrentLessonsFilters } from "@/components/lessons/CurrentLessonsFilters";
import { CurrentLessonCard } from "@/components/lessons/CurrentLessonCard";
import {
  DEMO_CURRENT_LESSONS,
  filterCurrentLessons,
  getFilterOptions,
  type LessonFilters,
} from "@/lib/current-lessons";

export default function CurrentLessonsPage() {
  const [filters, setFilters] = useState<LessonFilters>({});

  const options = useMemo(() => getFilterOptions(DEMO_CURRENT_LESSONS), []);

  const filtered = useMemo(
    () => filterCurrentLessons(DEMO_CURRENT_LESSONS, filters),
    [filters],
  );

  return (
    <div className="cl-page">
      <section className="cl-page-hero">
        <div className="home-container cl-page-hero__inner">
          <div className="cl-page-hero__chips">
            <span className="cl-ribbon">الدروس الحالية</span>
            <Link href="/courses" className="cl-link-chip">
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              الدورات الكاملة
            </Link>
          </div>
          <h1 className="cl-page-title">الدروس والدورات الحالية</h1>
          <p className="cl-page-lead">
            جداول أسبوعية للدروس الشرعية في مساجد الكويت — مع روابط البث والكتب
            ومواقع المساجد.
          </p>
        </div>
      </section>

      <div className="home-container cl-page-body">
        <CurrentLessonsFilters filters={filters} options={options} onChange={setFilters} />

        {filtered.length === 0 ? (
          <div className="cl-empty-state">
            <BookOpen className="cl-empty-icon" aria-hidden="true" />
            <p className="cl-empty-title">لا توجد دروس مطابقة</p>
            <p className="cl-empty-text">
              جرّب تغيير معايير البحث أو{" "}
              <button type="button" className="cl-reset-btn" onClick={() => setFilters({})}>
                إعادة ضبط الفلاتر
              </button>
            </p>
          </div>
        ) : (
          <div className="cl-page-grid">
            {filtered.map((lesson) => (
              <CurrentLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
