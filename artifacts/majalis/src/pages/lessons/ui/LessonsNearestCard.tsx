import { Link } from "wouter";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";
import {
  lessonAttendanceLabel,
  lessonContentType,
  lessonPlaceLabel,
  lessonSheikhLabel,
  lessonTimeLabel,
} from "@/pages/lessons/ui/lessons-feed-shared";

type Props = {
  lesson: KuwaitLessonRecord;
};

export function LessonsNearestCard({ lesson }: Props) {
  const unified = fromKuwaitLesson(lesson, false, { featuredHome: true });
  const href = unified.detailsHref || `/lessons/${lesson.id}`;

  return (
    <article className="lessons-nearest-card" aria-labelledby="lessons-nearest-title">
      <div className="lessons-nearest-card__eyebrow">
        <span className="lessons-nearest-card__type">{lessonContentType(lesson)}</span>
        <span className="lessons-nearest-card__badge">أقرب درس</span>
      </div>
      <h2 id="lessons-nearest-title" className="lessons-nearest-card__title">
        {cleanDisplayText(lesson.title)}
      </h2>
      {lessonSheikhLabel(lesson) ? (
        <p className="lessons-nearest-card__sheikh">{lessonSheikhLabel(lesson)}</p>
      ) : null}
      <dl className="lessons-nearest-card__facts">
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
      <div className="lessons-nearest-card__actions">
        <Link href={href} className="lessons-nearest-card__btn">
          التفاصيل
        </Link>
      </div>
    </article>
  );
}
