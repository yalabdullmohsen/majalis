import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getLessonById } from "@/lib/supabase";
import { Loading, Empty } from "@/components/ui-common";
import { LessonCard } from "@/components/lessons/LessonCard";
import ContentActions from "@/components/ContentActions";
import { isDemoId } from "@/lib/demo-content";
import { extractLessonSchedule, hasValue } from "@/lib/lesson-display";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ScientificAnnouncementsSection } from "@/components/scientific/ScientificAnnouncementsSection";

export default function LessonDetailPage({ params }: { params: { id: string } }) {
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLessonById(params.id)
      .then(({ lesson }) => setLesson(lesson))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <Loading />;
  if (!lesson) return <Empty text="لم يُعثر على الدرس." />;

  const sheikhName = lesson.sheikhs?.name || lesson.speaker_name || "";
  const { day, time, dateLabel } = extractLessonSchedule(lesson);
  const sheikhId = lesson.sheikh_id || lesson.sheikhs?.id;

  return (
    <div className="page-shell narrow lesson-detail-page">
      <Link href="/lessons" className="lesson-detail-back">
        ← العودة إلى الدروس
      </Link>

      <article className="ui-card lesson-detail-card">
        <div className="lesson-detail-hero">
          <SheikhAvatar
            src={resolveLessonSheikhImage(lesson)}
            name={sheikhName || "شيخ"}
            size={120}
          />
          <div className="lesson-detail-hero__copy">
            {hasValue(sheikhName) && (
              sheikhId ? (
                <Link href={`/sheikhs/${sheikhId}`} className="lesson-detail-sheikh-link">
                  {sheikhName}
                </Link>
              ) : (
                <p className="lesson-card-pro__sheikh">{sheikhName}</p>
              )
            )}
            <h1 className="lesson-detail-title">{lesson.title}</h1>
            <div className="lesson-detail-tags">
              {hasValue(lesson.category) && <span className="page-tag">{lesson.category}</span>}
              {hasValue(lesson.audience) && <span className="page-soft-tag">{lesson.audience}</span>}
              {hasValue(lesson.delivery) && <span className="page-soft-tag">{lesson.delivery}</span>}
            </div>
          </div>
        </div>

        <dl className="lesson-card-pro__meta lesson-detail-meta">
          {hasValue(day) && (
            <div><dt>اليوم</dt><dd>{day}</dd></div>
          )}
          {hasValue(dateLabel) && dateLabel !== day && (
            <div><dt>التاريخ</dt><dd>{dateLabel}</dd></div>
          )}
          {hasValue(time) && (
            <div><dt>الوقت</dt><dd>{time}</dd></div>
          )}
          {hasValue(lesson.mosque) && (
            <div><dt>المسجد</dt><dd>{lesson.mosque}</dd></div>
          )}
          {hasValue(lesson.region) && (
            <div><dt>المنطقة</dt><dd>{lesson.region}</dd></div>
          )}
          {hasValue(lesson.city) && (
            <div><dt>المحافظة</dt><dd>{lesson.city}</dd></div>
          )}
        </dl>

        {hasValue(lesson.description) && (
          <div className="lesson-detail-body">
            <h2>عن الدرس</h2>
            <p>{lesson.description}</p>
          </div>
        )}

        <div className="lesson-detail-actions">
          {!isDemoId(lesson.id) && (
            <>
              <FavoriteButton contentType="lesson" contentId={lesson.id} />
              <ContentActions contentType="lesson" contentId={lesson.id} />
            </>
          )}
        </div>
      </article>

      <ScientificAnnouncementsSection limit={3} />
    </div>
  );
}
