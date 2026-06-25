import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading, Empty } from "@/components/ui-common";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { LessonCard } from "@/components/lessons/LessonCard";
import { loadSheikhContent } from "@/lib/sheikh-content";
import { resolveSheikhImageUrl } from "@/lib/sheikh-image";
import { hasValue } from "@/lib/lesson-display";
import { formatPeriod, formatWeeklySchedule } from "@/lib/current-lessons";
import { isDemoId } from "@/lib/demo-content";

export default function SheikhDetailPage({ params }: { params: { id: string } }) {
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof loadSheikhContent>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadSheikhContent(params.id)
      .then(setBundle)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Loading />;
  if (!bundle?.sheikh) return <Empty text="لم يُعثر على الشيخ." />;

  const { sheikh, lessons, courses, series, socialLinks } = bundle;
  const bio = sheikh.bio || sheikh.biography;

  return (
    <div className="page-shell sheikh-detail-page">
      <Link href="/sheikhs" className="lesson-detail-back">
        ← العودة إلى المشايخ
      </Link>

      <section className="ui-card sheikh-detail-hero">
        <div className="sheikh-detail-hero__main">
          <SheikhAvatar
            src={resolveSheikhImageUrl(sheikh)}
            name={sheikh.name}
            size={128}
            className="sheikh-detail-avatar"
          />
          <div className="sheikh-detail-hero__copy">
            <div className="sheikh-detail-hero__title-row">
              <h1 className="sheikh-detail-name">{sheikh.name}</h1>
              {sheikh.is_verified && (
                <span className="sheikh-detail-badge">شيخ معتمد</span>
              )}
            </div>
            {hasValue(bio) && (
              <p className="sheikh-detail-bio">{bio}</p>
            )}
            <div className="sheikh-detail-meta-row">
              {hasValue(sheikh.city) && (
                <span className="page-soft-tag">{sheikh.city}</span>
              )}
              {sheikh.years_experience && (
                <span className="page-soft-tag">{sheikh.years_experience} سنة خبرة</span>
              )}
              {Array.isArray(sheikh.specialties) && sheikh.specialties.length > 0 && (
                <span className="page-soft-tag">{sheikh.specialties.join("، ")}</span>
              )}
            </div>
            <div className="sheikh-detail-actions-row">
              {!isDemoId(sheikh.id) && (
                <FavoriteButton contentType="scholar" contentId={sheikh.id} />
              )}
            </div>
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div className="sheikh-detail-social">
            <h2 className="sheikh-detail-section-title">حساباته الرسمية</h2>
            <div className="sheikh-detail-social-links">
              {socialLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sheikh-social-link"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {lessons.length > 0 && (
        <section className="sheikh-detail-section">
          <h2 className="sheikh-detail-section-title">جميع الدروس ({lessons.length})</h2>
          <div className="page-card-grid lesson-cards-grid">
            {lessons.map((lesson: any) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>
      )}

      {courses.length > 0 && (
        <section className="sheikh-detail-section">
          <h2 className="sheikh-detail-section-title">جميع الدورات ({courses.length})</h2>
          <div className="sheikh-courses-grid">
            {courses.map((course) => (
              <article key={course.id} className="ui-card sheikh-course-card">
                <h3 className="lesson-card-pro__title">{course.title}</h3>
                {hasValue(course.description) && (
                  <p className="sheikh-course-desc">{course.description}</p>
                )}
                <dl className="lesson-card-pro__meta">
                  {hasValue(course.mosque) && (
                    <div><dt>المسجد</dt><dd>{course.mosque}</dd></div>
                  )}
                  {hasValue(course.region) && (
                    <div><dt>المنطقة</dt><dd>{course.region}</dd></div>
                  )}
                  {course.weeklySchedule?.length > 0 && (
                    <div><dt>الجدول</dt><dd>{formatWeeklySchedule(course.weeklySchedule)}</dd></div>
                  )}
                  {(course.startDate || course.endDate || course.periodLabel) && (
                    <div><dt>الفترة</dt><dd>{formatPeriod(course)}</dd></div>
                  )}
                </dl>
                <Link href={`/lessons?tab=courses#${course.id}`} className="ui-card-btn">
                  عرض الدورة
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section className="sheikh-detail-section">
          <h2 className="sheikh-detail-section-title">جميع السلاسل ({series.length})</h2>
          <div className="sheikh-series-grid">
            {series.map((item) => (
              <article key={`series-${item.id}`} className="ui-card sheikh-series-card">
                <h3 className="lesson-card-pro__title">{item.title}</h3>
                {item.lectures && item.lectures.length > 0 && (
                  <ul className="sheikh-series-list">
                    {item.lectures.slice(0, 6).map((lecture) => (
                      <li key={lecture.id}>{lecture.title}</li>
                    ))}
                    {item.lectures.length > 6 && (
                      <li className="sheikh-series-more">+ {item.lectures.length - 6} محاضرات أخرى</li>
                    )}
                  </ul>
                )}
                <Link href={`/lessons?tab=courses#${item.id}`} className="ui-card-btn">
                  متابعة السلسلة
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
