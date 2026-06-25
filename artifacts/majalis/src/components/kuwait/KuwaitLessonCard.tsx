import { Link } from "wouter";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { hasValue } from "@/lib/lesson-display";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

type Props = {
  lesson: KuwaitLessonRecord;
  compact?: boolean;
  archived?: boolean;
};

export function KuwaitLessonCard({ lesson, compact = false, archived = false }: Props) {
  return (
    <article className={`ui-card lesson-card-pro kuwait-lesson-card${compact ? " kuwait-lesson-card--compact" : ""}${archived ? " kuwait-lesson-card--archived" : ""}`}>
      <div className="lesson-card-pro__header">
        <SheikhAvatar src={lesson.sheikhImage} name={lesson.sheikhName} size="responsive" />
        <div className="lesson-card-pro__head-copy">
          {hasValue(lesson.sheikhName) && (
            <p className="lesson-card-pro__sheikh">{lesson.sheikhName}</p>
          )}
          <h3 className="lesson-card-pro__title">{lesson.title}</h3>
          {hasValue(lesson.category) && (
            <span className="page-tag">{lesson.category}</span>
          )}
        </div>
      </div>

      <dl className="lesson-card-pro__meta">
        {hasValue(lesson.day) && (
          <div><dt>اليوم</dt><dd>{lesson.day}</dd></div>
        )}
        {hasValue(lesson.time) && (
          <div><dt>الوقت</dt><dd>{lesson.time}</dd></div>
        )}
        {hasValue(lesson.mosque) && (
          <div><dt>المسجد</dt><dd>{lesson.mosque}</dd></div>
        )}
        {hasValue(lesson.region) && (
          <div><dt>المنطقة</dt><dd>{lesson.region}</dd></div>
        )}
        {hasValue(lesson.governorate) && (
          <div><dt>المحافظة</dt><dd>{lesson.governorate}</dd></div>
        )}
      </dl>

      {hasValue(lesson.note) && (
        <p className="lesson-card-pro__desc">{lesson.note}</p>
      )}

      <div className="lesson-card-pro__footer">
        <div className="lesson-card-pro__actions">
          <Link href={`/lessons/${lesson.id}`} className="ui-card-btn lesson-card-pro__details">
            عرض التفاصيل
          </Link>
          {!lesson.id.startsWith("kuwait-static-") && (
            <FavoriteButton contentType="lesson" contentId={lesson.id} compact />
          )}
        </div>
      </div>
    </article>
  );
}
