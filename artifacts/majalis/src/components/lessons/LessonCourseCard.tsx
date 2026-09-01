import { memo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LessonCourseGroup } from "@/lib/lessons/lessonGrouping";
import { cleanDisplayText } from "@/lib/display-text";
import { formatRelativeTimeDetailed } from "@/lib/lesson-time";
import { LessonCard } from "./LessonCard";
import { LessonStatusBadge, resolveStatusVariant, WomenAttendanceBadge } from "./LessonStatusBadge";

type Props = {
  course: LessonCourseGroup;
};

export const LessonCourseCard = memo(function LessonCourseCard({ course }: Props) {
  const [expanded, setExpanded] = useState(false);
  const sheikhLine =
    course.sheikhs.length <= 2
      ? course.sheikhs.join(" · ")
      : `${course.sheikhs.slice(0, 2).join(" · ")} +${course.sheikhs.length - 2}`;
  const nearestLabel = formatRelativeTimeDetailed(
    course.nearestNextOccurrenceMs,
    course.sessions[0]?.time,
  );
  const place = [course.mosque, course.region].filter(Boolean).join(" — ");

  return (
    <article className="lesson-course-card card-v2">
      <button
        type="button"
        className="lesson-course-card__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="lesson-course-card__head">
          <div>
            <span className="lesson-course-card__kind">دورة</span>
            <h3 className="lesson-course-card__title">{cleanDisplayText(course.title)}</h3>
          </div>
          <ChevronDown
            size={18}
            className={`lesson-course-card__chevron${expanded ? " lesson-course-card__chevron--open" : ""}`}
            aria-hidden
          />
        </div>
        <dl className="lesson-course-card__facts">
          {sheikhLine ? (
            <div className="lesson-course-card__fact">
              <dt>المشايخ</dt>
              <dd>{sheikhLine}</dd>
            </div>
          ) : null}
          <div className="lesson-course-card__fact">
            <dt>المجالس</dt>
            <dd>{course.sessionCount}</dd>
          </div>
          <div className="lesson-course-card__fact">
            <dt>أقرب موعد</dt>
            <dd>{nearestLabel}</dd>
          </div>
          {place ? (
            <div className="lesson-course-card__fact">
              <dt>المكان</dt>
              <dd>{cleanDisplayText(place)}</dd>
            </div>
          ) : null}
          {course.deliveryMode ? (
            <div className="lesson-course-card__fact">
              <dt>النوع</dt>
              <dd>{course.deliveryMode}</dd>
            </div>
          ) : null}
        </dl>
        <div className="lesson-course-card__badges">
          <LessonStatusBadge label={nearestLabel} variant={resolveStatusVariant(nearestLabel)} />
          {course.hasWomenSection ? <WomenAttendanceBadge note="متاح" /> : null}
        </div>
      </button>
      {expanded ? (
        <div className="lesson-course-card__sessions" role="list">
          {course.sessions.map((session) => (
            <div key={session.id} className="lesson-course-card__session" role="listitem">
              <LessonCard lesson={session} compact />
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
});
