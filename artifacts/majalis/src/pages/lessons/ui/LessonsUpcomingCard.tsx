import { memo, useCallback } from "react";
import { Link } from "wouter";
import { FavoriteButton } from "@/components/FavoriteButton";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import {
  downloadUnifiedCalendar,
  fromKuwaitLesson,
} from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";
import {
  lessonAttendanceLabel,
  lessonDateLabel,
  lessonPlaceLabel,
  lessonSheikhLabel,
  lessonTimeLabel,
} from "@/pages/lessons/ui/lessons-feed-shared";

type Props = {
  lesson: KuwaitLessonRecord;
  showRegister?: boolean;
  registered?: boolean;
  onToggleRegister?: () => void;
};

export const LessonsUpcomingCard = memo(function LessonsUpcomingCard({
  lesson,
  showRegister,
  registered,
  onToggleRegister,
}: Props) {
  const unified = fromKuwaitLesson(lesson, false);
  const href = unified.detailsHref || `/lessons/${lesson.id}`;

  const handleCalendar = useCallback(() => {
    downloadUnifiedCalendar(unified);
  }, [unified]);

  return (
    <article className="lessons-upcoming-card">
      <div className="lessons-upcoming-card__body">
        <h3 className="lessons-upcoming-card__title">{cleanDisplayText(lesson.title)}</h3>
        {lessonSheikhLabel(lesson) ? (
          <p className="lessons-upcoming-card__sheikh">{lessonSheikhLabel(lesson)}</p>
        ) : null}
        <dl className="lessons-upcoming-card__meta">
          {lessonDateLabel(lesson) ? (
            <div>
              <dt>التاريخ</dt>
              <dd>{lessonDateLabel(lesson)}</dd>
            </div>
          ) : null}
          <div>
            <dt>الوقت</dt>
            <dd>{lessonTimeLabel(lesson)}</dd>
          </div>
          {lessonPlaceLabel(lesson) ? (
            <div>
              <dt>المكان</dt>
              <dd>{lessonPlaceLabel(lesson)}</dd>
            </div>
          ) : null}
          {lessonAttendanceLabel(lesson) ? (
            <div>
              <dt>الحضور</dt>
              <dd>{lessonAttendanceLabel(lesson)}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <div className="lessons-upcoming-card__actions">
        <Link href={href} className="lessons-upcoming-card__btn lessons-upcoming-card__btn--primary">
          التفاصيل
        </Link>
        <FavoriteButton
          contentType="lesson"
          contentId={lesson.id}
          compact
          className="lessons-upcoming-card__btn"
        />
        <button
          type="button"
          className="lessons-upcoming-card__btn"
          onClick={handleCalendar}
        >
          أضف للتقويم
        </button>
        {showRegister && onToggleRegister ? (
          <button type="button" className="lessons-upcoming-card__btn" onClick={onToggleRegister}>
            {registered ? "مسجل" : "حضور"}
          </button>
        ) : null}
      </div>
    </article>
  );
});
