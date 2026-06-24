import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  Radio,
} from "lucide-react";
import { CurrentLessonsFilters } from "@/components/lessons/CurrentLessonsFilters";
import {
  DEMO_COURSES,
  DEMO_CURRENT_LESSONS,
  downloadCalendar,
  filterCurrentLessons,
  getFilterOptions,
  sheikhAvatarUrl,
  type LessonFilters,
} from "@/lib/current-lessons";

export default function CoursesPage() {
  const [filters, setFilters] = useState<LessonFilters>({});

  const options = useMemo(() => getFilterOptions(DEMO_CURRENT_LESSONS), []);

  const filteredLessons = useMemo(
    () => filterCurrentLessons(DEMO_CURRENT_LESSONS, filters),
    [filters],
  );

  const visibleCourseIds = useMemo(
    () => new Set(filteredLessons.map((l) => l.courseId)),
    [filteredLessons],
  );

  const courses = useMemo(() => {
    const hasFilters =
      filters.sheikh || filters.mosque || filters.region || filters.day;
    if (!hasFilters) return DEMO_COURSES;
    return DEMO_COURSES.filter((c) => visibleCourseIds.has(c.id));
  }, [filters, visibleCourseIds]);

  return (
    <div className="cl-page">
      <section className="cl-page-hero">
        <div className="home-container cl-page-hero__inner">
          <div className="cl-page-hero__chips">
            <span className="cl-ribbon">الدورات</span>
            <Link href="/lessons/current" className="cl-link-chip">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              الدروس الحالية
            </Link>
          </div>
          <h1 className="cl-page-title">الدورات الشرعية</h1>
          <p className="cl-page-lead">
            عرض الدورة كاملة مع جميع المحاضرات والجدول الأسبوعي.
          </p>
        </div>
      </section>

      <div className="home-container cl-page-body">
        <CurrentLessonsFilters filters={filters} options={options} onChange={setFilters} />

        {courses.length === 0 ? (
          <div className="cl-empty-state">
            <GraduationCap className="cl-empty-icon" aria-hidden="true" />
            <p className="cl-empty-title">لا توجد دورات مطابقة</p>
          </div>
        ) : (
          <div className="cl-courses-stack">
            {courses.map((course) => {
              const primary = course.lessons[0];

              return (
                <article key={course.id} id={course.id} className="cl-course-panel">
                  <div className="cl-course-header">
                    <img
                      src={sheikhAvatarUrl(course.sheikhName, course.sheikhImage)}
                      alt={course.sheikhName}
                      className="cl-course-avatar"
                      loading="lazy"
                    />
                    <div className="cl-course-intro">
                      <p className="cl-course-sheikh">{course.sheikhName}</p>
                      <h2 className="cl-course-title">{course.title}</h2>
                      <p className="cl-course-desc">{course.description}</p>
                      <div className="cl-course-meta">
                        <span className="cl-meta-pill">
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          {course.startDate} — {course.endDate}
                        </span>
                        <span className="cl-meta-pill">
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                          {course.mosque} — {course.region}
                        </span>
                        {primary && (
                          <span className="cl-meta-pill">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            {primary.day} · {primary.time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="cl-course-body">
                    <h3 className="cl-subheading">
                      <BookOpen className="w-5 h-5" aria-hidden="true" />
                      محاضرات الدورة
                    </h3>
                    <ol className="cl-lecture-list">
                      {course.lectures.map((lecture, idx) => (
                        <li key={lecture.id} className="cl-lecture-item">
                          <span className="cl-lecture-num">{idx + 1}</span>
                          <div>
                            <p className="cl-lecture-title">{lecture.title}</p>
                            {(lecture.day || lecture.date) && (
                              <p className="cl-lecture-meta">
                                {[lecture.day, lecture.time, lecture.date].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>

                    {course.weeklySchedule.length > 0 && (
                      <>
                        <h3 className="cl-subheading cl-subheading--spaced">
                          <Calendar className="w-5 h-5" aria-hidden="true" />
                          الجدول الأسبوعي
                        </h3>
                        <div className="cl-weekly-grid">
                          {course.weeklySchedule.map((slot) => (
                            <div key={`${slot.day}-${slot.time}`} className="cl-weekly-slot">
                              <p className="cl-weekly-day">{slot.day}</p>
                              <p className="cl-weekly-time">{slot.time}</p>
                              <p className="cl-weekly-mosque">{course.mosque}</p>
                              <p className="cl-weekly-area">{course.region}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {primary && (
                      <div className="cl-course-actions">
                        <Link href={`/courses#${course.id}`} className="cl-btn cl-btn--primary">
                          عرض التفاصيل
                        </Link>
                        <button
                          type="button"
                          className="cl-btn cl-btn--secondary"
                          onClick={() => downloadCalendar(primary)}
                        >
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          إضافة إلى التقويم
                        </button>
                        {primary.mapsUrl && (
                          <a
                            href={primary.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cl-btn cl-btn--ghost"
                          >
                            <MapPin className="w-4 h-4" aria-hidden="true" />
                            فتح الموقع على الخريطة
                          </a>
                        )}
                        {primary.streamUrl && (
                          <a
                            href={primary.streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cl-btn cl-btn--ghost"
                          >
                            <Radio className="w-4 h-4" aria-hidden="true" />
                            رابط البث
                          </a>
                        )}
                        {primary.bookUrl && (
                          <a
                            href={primary.bookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cl-btn cl-btn--ghost"
                          >
                            <ExternalLink className="w-4 h-4" aria-hidden="true" />
                            رابط الكتاب
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
