import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Megaphone, GraduationCap } from "lucide-react";
import { CurrentLessonsFilters } from "@/components/lessons/CurrentLessonsFilters";
import { CurrentLessonCard } from "@/components/lessons/CurrentLessonCard";
import {
  DEMO_CURRENT_LESSONS,
  filterCurrentLessons,
  getFilterOptions,
  TEMPLATE_LABELS,
  type LessonFilters,
} from "@/lib/current-lessons";

export default function AnnouncementsPage() {
  const [filters, setFilters] = useState<LessonFilters>({});

  const options = useMemo(() => getFilterOptions(DEMO_CURRENT_LESSONS), []);

  const filtered = useMemo(
    () => filterCurrentLessons(DEMO_CURRENT_LESSONS, filters),
    [filters],
  );

  return (
    <div className="la-page">
      <section className="la-page-hero">
        <div className="home-container la-page-hero__inner">
          <div className="la-page-hero__chips">
            <span className="la-ribbon">إعلانات الدروس</span>
            <Link href="/courses" className="la-link-chip">
              <GraduationCap className="la-icon" aria-hidden="true" />
              الدورات الكاملة
            </Link>
          </div>
          <h1 className="la-page-title">إعلانات الدروس والدورات</h1>
          <p className="la-page-lead">
            إعلانات الدروس الشرعية في مساجد الكويت — دروس أسبوعية، دورات علمية،
            وجداول محدّثة مع إمكانية التحميل والمشاركة.
          </p>
        </div>
      </section>

      <div className="home-container la-page-body">
        <div className="la-templates-note" aria-label="قوالب الإعلانات">
          {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
            <span key={key} className="la-template-chip">
              {label}
            </span>
          ))}
        </div>

        <CurrentLessonsFilters filters={filters} options={options} onChange={setFilters} />

        {filtered.length === 0 ? (
          <div className="la-empty-state">
            <Megaphone className="la-empty-icon" aria-hidden="true" />
            <p className="la-empty-title">لا توجد إعلانات مطابقة</p>
            <p className="la-empty-text">
              جرّب تغيير معايير البحث أو{" "}
              <button type="button" className="la-reset-btn" onClick={() => setFilters({})}>
                إعادة ضبط الفلاتر
              </button>
            </p>
          </div>
        ) : (
          <div className="la-page-grid">
            {filtered.map((lesson) => (
              <CurrentLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
