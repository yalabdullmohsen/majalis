import { Link } from "wouter";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

type Props = {
  lesson: KuwaitLessonRecord;
  compact?: boolean;
};

export function KuwaitLessonCard({ lesson, compact = false }: Props) {
  return (
    <article className={`ui-card home-kuwait-card${compact ? " home-kuwait-card--compact" : ""}`}>
      <div className="home-kuwait-card-top">
        <SheikhAvatar src={lesson.sheikhImage} name={lesson.sheikhName} size="responsive" />
        <div>
          <p className="home-kuwait-sheikh">{lesson.sheikhName}</p>
          <h3>{lesson.title}</h3>
          {lesson.category && <span className="home-tag">{lesson.category}</span>}
        </div>
      </div>
      <dl className="home-kuwait-meta">
        <div><dt>اليوم</dt><dd>{lesson.day || "—"}</dd></div>
        <div><dt>الوقت</dt><dd>{lesson.time || "—"}</dd></div>
        <div><dt>المسجد</dt><dd>{lesson.mosque || "—"}</dd></div>
        <div><dt>المنطقة</dt><dd>{lesson.region || "—"}</dd></div>
        <div><dt>المحافظة</dt><dd>{lesson.governorate || "—"}</dd></div>
      </dl>
      {lesson.note && <p className="home-kuwait-note">{lesson.note}</p>}
      <Link href="/kuwait-lessons" className="ui-card-btn">عرض التفاصيل</Link>
    </article>
  );
}
