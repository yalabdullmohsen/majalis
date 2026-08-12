/**
 * Flutter `EducationalCoursesWidget` — course progress + daily Adhkar.
 */
import { useEducationalProgress } from "@/hooks/useEducationalProgress";
import type { EducationalProgressController } from "@/lib/educational-progress-controller";
import "@/styles/majlisilm-shell.css";

export type EducationalCoursesWidgetProps = {
  controller?: EducationalProgressController;
  className?: string;
};

export function EducationalCoursesWidget({
  controller: external,
  className,
}: EducationalCoursesWidgetProps) {
  const { courseProgress, dailyAdhkar, toggleAdhkar } =
    useEducationalProgress(external);

  return (
    <div className={`edu-courses${className ? ` ${className}` : ""}`} dir="rtl">
      <h2 className="edu-courses__title">المسارات العلمية النشطة</h2>
      <ul className="edu-courses__list">
        {Object.entries(courseProgress).map(([title, value]) => (
          <li key={title} className="edu-courses__card">
            <p className="edu-courses__card-title">{title}</p>
            <div
              className="edu-courses__bar"
              role="progressbar"
              aria-valuenow={Math.round(value * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={title}
            >
              <span style={{ width: `${Math.round(value * 100)}%` }} />
            </div>
            <p className="edu-courses__pct">%{Math.round(value * 100)} مكتمل</p>
          </li>
        ))}
      </ul>

      <h2 className="edu-courses__title edu-courses__title--spaced">
        متابعة الأذكار اليومية
      </h2>
      <ul className="edu-courses__adhkar">
        {Object.entries(dailyAdhkar).map(([title, done]) => (
          <li key={title}>
            <label className="edu-courses__check">
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggleAdhkar(title)}
              />
              <span>{title}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EducationalCoursesWidget;
