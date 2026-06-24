import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  Megaphone,
} from "lucide-react";
import { CurrentLessonsFilters } from "@/components/lessons/CurrentLessonsFilters";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import {
  DEMO_COURSES,
  DEMO_CURRENT_LESSONS,
  downloadCalendar,
  filterCurrentLessons,
  formatPeriod,
  getFilterOptions,
  resolveSheikhImage,
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
    () => new Set(filteredLessons.map((l) => l.courseId).filter(Boolean) as string[]),
    [filteredLessons],
  );

  const courses = useMemo(() => {
    const hasFilters =
      filters.sheikh || filters.mosque || filters.region || filters.day;
    if (!hasFilters) return DEMO_COURSES;
    return DEMO_COURSES.filter((c) => visibleCourseIds.has(c.id));
  }, [filters, visibleCourseIds]);

  return (
    <div className="la-page">
      <section className="la-page-hero">
        <div className="home-container la-page-hero__inner">
          <div className="la-page-hero__chips">
            <span className="la-ribbon">الدورات</span>
            <Link href="/announcements" className="la-link-chip">
              <Megaphone className="la-icon" aria-hidden="true" />
              إعلانات الدروس
            </Link>
          </div>
          <h1 className="la-page-title">الدورات الشرعية</h1>
          <p className="la-page-lead">
            عرض الدورة كاملة مع جميع المحاضرات والجدول الأسبوعي.
          </p>
        </div>
      </section>

      <div className="home-container la-page-body">
        <CurrentLessonsFilters filters={filters} options={options} onChange={setFilters} />

        {courses.length === 0 ? (
          <div className="la-empty-state">
            <GraduationCap className="la-empty-icon" aria-hidden="true" />
            <p className="la-empty-title">لا توجد دورات مطابقة</p>
          </div>
        ) : (
          <div className="la-courses-stack">
            {courses.map((course) => {
              const primary = course.lessons[0];
              const sheikhImage = resolveSheikhImage({
                sheikh_image_url: course.sheikh_image_url,
                sheikhImage: course.sheikhImage,
              });

              return (
                <article key={course.id} id={course.id} className="la-course-panel">
                  <div className="la-course-header">
                    <SheikhAvatar name={course.sheikhName} imageUrl={sheikhImage} size="lg" />
                    <div className="la-course-intro">
                      <p className="la-course-honorific">فضيلة الشيخ</p>
                      <p className="la-course-sheikh">{course.sheikhName}</p>
                      <h2 className="la-course-title">{course.title}</h2>
                      <p className="la-course-desc">{course.description}</p>
                      <div className="la-course-meta">
                        <span className="la-meta-pill">
                          <Calendar className="la-icon la-icon--sm" aria-hidden="true" />
                          {formatPeriod(course)}
                        </span>
                        <span className="la-meta-pill">
                          <MapPin className="la-icon la-icon--sm" aria-hidden="true" />
                          {course.mosque} — {course.region}
                        </span>
                        {primary && (
                          <span className="la-meta-pill">
                            <Clock className="la-icon la-icon--sm" aria-hidden="true" />
                            {primary.day} · {primary.time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="la-course-body">
                    {course.curriculum && course.curriculum.length > 0 && (
                      <>
                        <h3 className="la-subheading">
                          <BookOpen className="la-icon" aria-hidden="true" />
                          محتوى الدورة
                        </h3>
                        <ul className="la-curriculum-list">
                          {course.curriculum.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    <h3 className="la-subheading la-subheading--spaced">
                      <BookOpen className="la-icon" aria-hidden="true" />
                      محاضرات الدورة
                    </h3>
                    <ol className="la-lecture-list">
                      {course.lectures.map((lecture, idx) => (
                        <li key={lecture.id} className="la-lecture-item">
                          <span className="la-lecture-num">{idx + 1}</span>
                          <div>
                            <p className="la-lecture-title">{lecture.title}</p>
                            {(lecture.day || lecture.date) && (
                              <p className="la-lecture-meta">
                                {[lecture.day, lecture.time, lecture.date].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>

                    {course.weeklySchedule.length > 0 && (
                      <>
                        <h3 className="la-subheading la-subheading--spaced">
                          <Calendar className="la-icon" aria-hidden="true" />
                          الجدول الأسبوعي
                        </h3>
                        <div className="la-weekly-grid">
                          {course.weeklySchedule.map((slot, i) => (
                            <div key={`${slot.day}-${slot.time}-${i}`} className="la-weekly-slot">
                              <p className="la-weekly-day">{slot.day}</p>
                              <p className="la-weekly-time">{slot.time}</p>
                              <p className="la-weekly-mosque">{course.mosque}</p>
                              <p className="la-weekly-area">{course.region}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {primary && (
                      <div className="la-course-actions">
                        <Link href={`/courses#${course.id}`} className="la-btn la-btn--primary">
                          عرض التفاصيل
                        </Link>
                        <button
                          type="button"
                          className="la-btn la-btn--secondary"
                          onClick={() => downloadCalendar(primary)}
                        >
                          إضافة إلى التقويم
                        </button>
                        {primary.mapsUrl && (
                          <a
                            href={primary.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="la-btn la-btn--ghost"
                          >
                            <MapPin className="la-icon la-icon--sm" aria-hidden="true" />
                            فتح الموقع على الخريطة
                          </a>
                        )}
                        {primary.streamUrl && (
                          <a
                            href={primary.streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="la-btn la-btn--ghost"
                          >
                            <ExternalLink className="la-icon la-icon--sm" aria-hidden="true" />
                            رابط البث
                          </a>
                        )}
                        {primary.bookUrl && (
                          <a
                            href={primary.bookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="la-btn la-btn--ghost"
                          >
                            <ExternalLink className="la-icon la-icon--sm" aria-hidden="true" />
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
