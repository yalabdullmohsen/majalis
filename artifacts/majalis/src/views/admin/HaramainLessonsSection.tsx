import { useState } from "react";
import {
  HARAMAIN_LESSONS,
  getHaramainLessonsByType,
  haramainToLessonPayload,
  type HaramainLesson,
} from "@/lib/haramain-lessons";
import { adminUpsertLesson } from "@/lib/supabase";
import { useAdminShell } from "./AdminShell";

export function HaramainLessonsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [filter, setFilter] = useState<"all" | "مكة" | "المدينة">("all");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ ok: number; fail: number; errors: string[] } | null>(null);

  const lessons = getHaramainLessonsByType(filter);

  const importAll = async (subset: HaramainLesson[]) => {
    setImporting(true);
    setResult(null);
    setProgress({ done: 0, total: subset.length });
    let ok = 0;
    let fail = 0;
    const errors: string[] = [];

    for (let i = 0; i < subset.length; i++) {
      try {
        const payload = haramainToLessonPayload(subset[i]);
        const { error } = await adminUpsertLesson(payload);
        if (error) {
          fail++;
          errors.push(`${subset[i].title}: ${error.message}`);
        } else {
          ok++;
        }
      } catch (e: any) {
        fail++;
        errors.push(`${subset[i].title}: ${e?.message || e}`);
      }
      setProgress({ done: i + 1, total: subset.length });
    }

    setImporting(false);
    setResult({ ok, fail, errors });
    if (ok > 0) showSuccess(`تم استيراد ${ok} درس من الحرمين الشريفين`);
    if (fail > 0) showError(`فشل استيراد ${fail} درس`);
  };

  return (
    <div className="hrm-wrapper">
      <div className="hrm-header">
        <div>
          <h2 className="hrm-title">دروس الحرمين الشريفين</h2>
          <p className="hrm-subtitle">
            {HARAMAIN_LESSONS.length} درس من المسجد الحرام والمسجد النبوي
          </p>
        </div>
        <div className="hrm-actions">
          <button
            onClick={() => importAll(lessons)}
            disabled={importing}
            className="hrm-import-btn"
          >
            {importing ? `جارٍ الاستيراد... ${progress.done}/${progress.total}` : `استيراد الكل (${lessons.length})`}
          </button>
        </div>
      </div>

      <div className="hrm-filters">
        {(["all", "مكة", "المدينة"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="hrm-filter-btn"
            style={{
              "--hrm-fb-bg": filter === t ? "var(--majalis-emerald)" : "var(--majalis-panel)",
              "--hrm-fb-color": filter === t ? "var(--majalis-parchment)" : "var(--majalis-ink)",
              "--hrm-fb-border": filter === t ? "var(--majalis-emerald)" : "var(--majalis-line)",
            } as React.CSSProperties}
          >
            {t === "all" ? "الكل" : t === "مكة" ? "المسجد الحرام" : "المسجد النبوي"}
          </button>
        ))}
      </div>

      {result && (
        <div className={`hrm-result${result.fail > 0 ? " hrm-result--fail" : " hrm-result--ok"}`}>
          <p className="hrm-result__text">
            تم استيراد {result.ok} درس{result.fail > 0 ? ` · فشل ${result.fail}` : ""}
          </p>
          {result.errors.length > 0 && (
            <ul className="hrm-result__errors">
              {result.errors.map((er, i) => (
                <li key={i} className="hrm-result__err">{er}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="hrm-grid">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="hrm-card">
            <div className="hrm-card__badge">
              {lesson.haramain_type === "مكة" ? "🕋 المسجد الحرام" : "🕌 المسجد النبوي"}
            </div>
            <h3 className="hrm-card__title">{lesson.title}</h3>
            <p className="hrm-card__speaker">{lesson.speaker_name}</p>
            <p className="hrm-card__meta">
              <span className="hrm-card__cat">{lesson.category}</span>
              <span className="hrm-card__sep">·</span>
              <span>{lesson.day_of_week}</span>
              <span className="hrm-card__sep">·</span>
              <span>{lesson.lesson_time}</span>
            </p>
            <p className="hrm-card__desc">{lesson.description}</p>
            <div className="hrm-card__footer">
              <span className="hrm-card__type">{lesson.activity_type}</span>
              {lesson.is_recurring && <span className="hrm-card__recurring">متكرر</span>}
              <button
                onClick={() => importAll([lesson])}
                disabled={importing}
                className="hrm-card__import-btn"
              >
                استيراد
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
