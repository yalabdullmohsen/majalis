import { useState, useMemo } from "react";
import { Calendar, CheckCircle2, Clock, Landmark, Link2, RefreshCw, User, Users, XCircle } from "lucide-react";
import {
  HARAMAIN_LESSONS,
  getHaramainLessonsByType,
  haramainToLessonPayload,
  type HaramainLesson,
} from "@/lib/haramain-lessons";
import { adminUpsertLesson } from "@/lib/supabase";
import { useAdminShell } from "./AdminShell";

const CATEGORIES = ["الكل", "تفسير", "حديث", "فقه", "عقيدة", "سيرة", "قرآن", "تجويد", "لغة عربية", "رقائق", "دورة علمية", "علوم القرآن", "علوم الحديث", "أصول الفقه", "فقه معاصر", "تأصيل"];

export function HaramainLessonsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [filter, setFilter]     = useState<"all" | "مكة" | "المدينة">("all");
  const [category, setCategory] = useState("الكل");
  const [search, setSearch]     = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult]     = useState<{ ok: number; fail: number; errors: string[] } | null>(null);

  const baseLessons = getHaramainLessonsByType(filter);

  const lessons = useMemo(() => {
    let list = baseLessons;
    if (category !== "الكل") list = list.filter((l) => l.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.speaker_name.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return list;
  }, [baseLessons, category, search]);

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

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="hrm-wrapper">
      <div className="hrm-header">
        <div>
          <h2 className="hrm-title"><Landmark size={20} className="inline ml-2" />دروس الحرمين الشريفين</h2>
          <p className="hrm-subtitle">
            {HARAMAIN_LESSONS.length} درس — المسجد الحرام والمسجد النبوي · يظهر {lessons.length} درس
          </p>
        </div>
        <div className="hrm-actions">
          <button
            onClick={() => importAll(lessons)}
            disabled={importing || lessons.length === 0}
            className="hrm-import-btn"
          >
            {importing
              ? `جارٍ الاستيراد... ${progress.done}/${progress.total}`
              : `استيراد الظاهر (${lessons.length})`}
          </button>
          <button
            onClick={() => importAll(HARAMAIN_LESSONS)}
            disabled={importing}
            className="hrm-import-btn hrm-import-btn--all"
          >
            {importing ? "…" : `استيراد الكل (${HARAMAIN_LESSONS.length})`}
          </button>
        </div>
      </div>

      {/* شريط التقدم */}
      {importing && (
        <div className="hrm-progress-wrap">
          <div className="hrm-progress-bar">
            <div
              className="hrm-progress-fill"
              style={{ "--hrm-pf-w": `${pct}%` } as React.CSSProperties}
            />
          </div>
          <span className="hrm-progress-label">{pct}%</span>
        </div>
      )}

      {/* نتيجة الاستيراد */}
      {result && (
        <div className={`hrm-result${result.fail > 0 ? " hrm-result--fail" : " hrm-result--ok"}`}>
          <p className="hrm-result__text">
            <CheckCircle2 size={13} className="inline ml-1" />نجح: {result.ok} · {result.fail > 0 ? <><XCircle size={13} className="inline ml-1" />فشل: {result.fail}</> : "بدون أخطاء"}
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

      {/* الفلاتر */}
      <div className="hrm-filter-section">
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
              {t === "all" ? "الكل" : t === "مكة" ? <><Landmark size={13} className="inline ml-1" />المسجد الحرام</> : <><Landmark size={13} className="inline ml-1" />المسجد النبوي</>}
            </button>
          ))}
        </div>
        <div className="hrm-filters hrm-filters--cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="hrm-filter-btn hrm-filter-btn--sm"
              style={{
                "--hrm-fb-bg": category === cat ? "var(--majalis-emerald-deep)" : "var(--majalis-panel)",
                "--hrm-fb-color": category === cat ? "#fff" : "var(--majalis-ink-soft)",
                "--hrm-fb-border": category === cat ? "var(--majalis-emerald-deep)" : "var(--majalis-line)",
              } as React.CSSProperties}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="ابحث في الدروس..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="hrm-search"
        />
      </div>

      {lessons.length === 0 && (
        <p className="hrm-empty">لا توجد دروس مطابقة للفلتر</p>
      )}

      <div className="hrm-grid">
        {lessons.map((lesson) => (
          <div key={lesson.id} className={`hrm-card${lesson.haramain_type === "مكة" ? " hrm-card--makkah" : " hrm-card--madinah"}`}>
            <div className="hrm-card__head">
              <span className="hrm-card__badge">
                <Landmark size={11} className="inline ml-0.5" />{lesson.haramain_type === "مكة" ? "الحرام" : "النبوي"}
              </span>
              <span className="hrm-card__cat">{lesson.category}</span>
              {lesson.is_course && <span className="hrm-card__course-tag">دورة</span>}
            </div>
            <h3 className="hrm-card__title">{lesson.title}</h3>
            <p className="hrm-card__speaker"><User size={11} className="inline ml-0.5" />{lesson.speaker_name}</p>
            <p className="hrm-card__meta">
              <span><Calendar size={11} className="inline ml-0.5" />{lesson.day_of_week}</span>
              <span className="hrm-card__sep">·</span>
              <span><Clock size={11} className="inline ml-0.5" />{lesson.lesson_time}</span>
            </p>
            <p className="hrm-card__desc">{lesson.description}</p>
            <div className="hrm-card__tags">
              <span className="hrm-card__tag"><Users size={11} className="inline ml-0.5" />{lesson.audience}</span>
              <span className="hrm-card__tag">{lesson.delivery}</span>
              {lesson.is_recurring && <span className="hrm-card__tag hrm-card__tag--recurring"><RefreshCw size={11} className="inline ml-0.5" />متكرر</span>}
            </div>
            <div className="hrm-card__footer">
              {lesson.live_url && (
                <a href={lesson.live_url} target="_blank" rel="noopener noreferrer" className="hrm-card__link">
                  <Link2 size={11} className="inline ml-0.5" />رابط مباشر
                </a>
              )}
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
