import { Link } from "wouter";
import { formatShortLessonTime, formatLessonTimeDisplay } from "@/lib/lesson-time";
import { resolveKuwaitSheikhProfile, sheikhProfileHref } from "@/lib/kuwait-sheikh-profiles";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

type Props = {
  lesson: KuwaitLessonRecord;
};

export function HomeLessonCard({ lesson }: Props) {
  const sheikhProfile = resolveKuwaitSheikhProfile(lesson.sheikhName);
  const sheikhDisplay = lesson.sheikhName.replace(/^الشيخ:\s*/u, "").trim();

  return (
    <article className="ui-card home-kuwait-card">
      <div className="home-kuwait-card-top">
        <div>
          <h3>{lesson.title}</h3>
          {sheikhDisplay && (
            sheikhProfile ? (
              <Link href={sheikhProfileHref(sheikhProfile)} className="home-kuwait-sheikh home-kuwait-sheikh--link">
                {sheikhDisplay}
              </Link>
            ) : (
              <p className="home-kuwait-sheikh">{sheikhDisplay}</p>
            )
          )}
        </div>
      </div>

      <dl className="home-kuwait-meta">
        {lesson.gregorianDate && (
          <div>
            <dt>التاريخ</dt>
            <dd>{lesson.gregorianDate}</dd>
          </div>
        )}
        {lesson.time && (
          <div>
            <dt>الوقت</dt>
            <dd>{formatShortLessonTime(lesson.time)}</dd>
          </div>
        )}
        {lesson.region && (
          <div>
            <dt>المنطقة</dt>
            <dd>{lesson.region}</dd>
          </div>
        )}
      </dl>

      <Link href={`/lessons/${lesson.id}`} className="btn btn-primary btn-sm home-kuwait-card__cta">
        التفاصيل
      </Link>
    </article>
  );
}

export default HomeLessonCard;
