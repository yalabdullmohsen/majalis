import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { filterLessonsByPeriod, getPlatformLessons } from "@/lib/platform-api";
import type { PlatformLesson } from "@/lib/platform-types";
import { DEFAULT_KUWAIT_FILTERS, extractFilterOptions, filterKuwaitLessons } from "@/lib/kuwait-lessons";
import { KuwaitLessonCard } from "@/components/kuwait/KuwaitLessonCard";
import { loadKuwaitLessons, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";

type Period = "today" | "week" | "month" | "archive";

export default function CalendarPage() {
  const [lessons, setLessons] = useState<PlatformLesson[]>([]);
  const [kuwaitLessons, setKuwaitLessons] = useState<KuwaitLessonRecord[]>([]);
  const [period, setPeriod] = useState<Period>("week");
  const [filters, setFilters] = useState(DEFAULT_KUWAIT_FILTERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPlatformLessons(), loadKuwaitLessons()])
      .then(([p, k]) => {
        setLessons(p);
        setKuwaitLessons(k);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPlatform = useMemo(
    () => filterLessonsByPeriod(lessons, period),
    [lessons, period],
  );

  const filteredKuwait = useMemo(
    () => filterKuwaitLessons(kuwaitLessons, filters),
    [kuwaitLessons, filters],
  );

  const options = useMemo(() => extractFilterOptions(kuwaitLessons), [kuwaitLessons]);

  return (
    <div className="page-shell">
      <PageHeader eyebrow="التقويم" title="التقويم العلمي" subtitle="دروس اليوم والأسبوع والشهر." />

      <div className="calendar-period-row">
        {([
          ["today", "اليوم"],
          ["week", "الأسبوع"],
          ["month", "الشهر"],
          ["archive", "الأرشيف"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`calendar-period-btn${period === key ? " is-active" : ""}`}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="kuwait-filters-grid">
        {[
          ["governorate", "المحافظة", options.governorates],
          ["region", "المنطقة", options.regions],
          ["mosque", "المسجد", options.mosques],
          ["sheikh", "الشيخ", options.sheikhs],
          ["category", "التصنيف", options.categories],
          ["day", "اليوم", options.days],
        ].map(([key, label, values]) => (
          <label key={key as string}>
            {label as string}
            <select
              value={filters[key as keyof typeof filters] as string}
              onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
            >
              {(values as string[]).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {loading && <Loading />}

      {!loading && filteredPlatform.length === 0 && filteredKuwait.length === 0 && (
        <Empty text="لا توجد دروس مطابقة." />
      )}

      <div className="home-kuwait-grid">
        {filteredKuwait.map((l) => (
          <KuwaitLessonCard key={l.id} lesson={l} />
        ))}
      </div>

      {filteredPlatform.length > 0 && (
        <section className="home-section">
          <h2 className="calendar-subtitle">دروس إضافية</h2>
          <div className="calendar-lesson-list">
            {filteredPlatform.map((l) => (
              <article key={l.id} className="ui-card calendar-lesson-row">
                <div>
                  <h3>{l.title}</h3>
                  <p>{l.sheikh_name} — {l.mosque_name} — {l.day} {l.start_time}</p>
                </div>
                <Link href="/lessons" className="ui-card-btn ui-card-btn--ghost">التفاصيل</Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
