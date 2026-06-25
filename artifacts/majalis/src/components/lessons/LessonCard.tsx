import { Link } from "wouter";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { extractLessonSchedule, hasValue } from "@/lib/lesson-display";
import { isDemoId } from "@/lib/demo-content";

type LessonLike = {
  id: string;
  title: string;
  category?: string;
  mosque?: string;
  city?: string;
  region?: string;
  audience?: string;
  description?: string;
  schedule?: string;
  day_of_week?: string;
  lesson_time?: string;
  start_date?: string;
  speaker_name?: string;
  sheikhs?: { name?: string };
};

type Props = {
  lesson: LessonLike;
  showRegister?: boolean;
  registered?: boolean;
  onToggleRegister?: () => void;
};

export function LessonCard({ lesson, showRegister, registered, onToggleRegister }: Props) {
  const sheikhName = lesson.sheikhs?.name || lesson.speaker_name || "";
  const { day, time, dateLabel } = extractLessonSchedule(lesson);
  const locationParts = [lesson.mosque, lesson.region, lesson.city].filter(hasValue);

  return (
    <article className="ui-card lesson-card-pro">
      <div className="lesson-card-pro__header">
        <SheikhAvatar
          src={resolveLessonSheikhImage(lesson)}
          name={sheikhName || "شيخ"}
          size="responsive"
        />
        <div className="lesson-card-pro__head-copy">
          {hasValue(sheikhName) && (
            <p className="lesson-card-pro__sheikh">{sheikhName}</p>
          )}
          <h3 className="lesson-card-pro__title">{lesson.title}</h3>
        </div>
      </div>

      {(hasValue(day) || hasValue(time) || hasValue(dateLabel) || locationParts.length > 0) && (
        <dl className="lesson-card-pro__meta">
          {hasValue(day) && (
            <div>
              <dt>اليوم</dt>
              <dd>{day}</dd>
            </div>
          )}
          {hasValue(dateLabel) && dateLabel !== day && (
            <div>
              <dt>التاريخ</dt>
              <dd>{dateLabel}</dd>
            </div>
          )}
          {hasValue(time) && (
            <div>
              <dt>الوقت</dt>
              <dd>{time}</dd>
            </div>
          )}
          {hasValue(lesson.mosque) && (
            <div>
              <dt>المسجد</dt>
              <dd>{lesson.mosque}</dd>
            </div>
          )}
          {hasValue(lesson.region) && (
            <div>
              <dt>المنطقة</dt>
              <dd>{lesson.region}</dd>
            </div>
          )}
          {hasValue(lesson.city) && (
            <div>
              <dt>المحافظة</dt>
              <dd>{lesson.city}</dd>
            </div>
          )}
        </dl>
      )}

      {hasValue(lesson.description) && (
        <p className="lesson-card-pro__desc">{lesson.description}</p>
      )}

      <div className="lesson-card-pro__footer">
        <div className="lesson-card-pro__tags">
          {hasValue(lesson.category) && (
            <span className="page-tag">{lesson.category}</span>
          )}
          {hasValue(lesson.audience) && (
            <span className="page-soft-tag">{lesson.audience}</span>
          )}
        </div>
        <div className="lesson-card-pro__actions">
          <Link href={`/lessons/${lesson.id}`} className="ui-card-btn lesson-card-pro__details">
            عرض التفاصيل
          </Link>
          {!isDemoId(lesson.id) && (
            <FavoriteButton contentType="lesson" contentId={lesson.id} compact />
          )}
          {showRegister && onToggleRegister && (
            <button type="button" onClick={onToggleRegister} className="page-action-btn">
              {registered ? "إلغاء التسجيل" : "سجّل حضوري"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default LessonCard;
