import { useEffect, useMemo, useState } from "react";
import { PageHeader, Loading } from "@/components/ui-common";
import { LessonsContactCard } from "@/components/lessons/LessonsContactCard";
import { KuwaitLessonCard } from "@/components/kuwait/KuwaitLessonCard";
import {
  DEFAULT_KUWAIT_FILTERS,
  extractFilterOptions,
  filterKuwaitLessons,
  loadAllKuwaitLessonsSplit,
  type KuwaitLessonFilters,
  type KuwaitLessonRecord,
} from "@/lib/kuwait-lessons";

type TabId = "active" | "archive";

export default function KuwaitLessonsPage() {
  const [activeLessons, setActiveLessons] = useState<KuwaitLessonRecord[]>([]);
  const [archivedLessons, setArchivedLessons] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("active");
  const [filters, setFilters] = useState<KuwaitLessonFilters>(DEFAULT_KUWAIT_FILTERS);

  useEffect(() => {
    setLoading(true);
    loadAllKuwaitLessonsSplit()
      .then(({ active, archived }) => {
        setActiveLessons(active);
        setArchivedLessons(archived);
      })
      .catch(() => {
        setActiveLessons([]);
        setArchivedLessons([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const sourceLessons = tab === "active" ? activeLessons : archivedLessons;

  const options = useMemo(() => extractFilterOptions(sourceLessons), [sourceLessons]);

  const filtered = useMemo(
    () => filterKuwaitLessons(sourceLessons, filters),
    [sourceLessons, filters],
  );

  const setFilter = <K extends keyof KuwaitLessonFilters>(key: K, value: KuwaitLessonFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="الكويت"
        title="دروس الكويت"
        subtitle="مرجع شامل للدروس الشرعية في مساجد الكويت — محدّث وقابل للإدارة من لوحة التحكم."
      />

      <div className="kuwait-tabs" role="tablist" aria-label="تبويبات دروس الكويت">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "active"}
          className={`kuwait-tab${tab === "active" ? " kuwait-tab--active" : ""}`}
          onClick={() => setTab("active")}
        >
          الدروس الحالية ({activeLessons.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "archive"}
          className={`kuwait-tab${tab === "archive" ? " kuwait-tab--active" : ""}`}
          onClick={() => setTab("archive")}
        >
          الأرشيف ({archivedLessons.length})
        </button>
      </div>

      <div className="page-stats-row kuwait-lessons-stats">
        <span>{filtered.length} {tab === "active" ? "درس متاح" : "درس مؤرشف"}</span>
        <span>{options.sheikhs.length - 1} شيخ</span>
        <span>{options.mosques.length - 1} مسجد</span>
      </div>

      <form
        className="page-search-form kuwait-lessons-search"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          placeholder="بحث سريع: شيخ، مسجد، منطقة، عنوان..."
        />
      </form>

      <div className="kuwait-filters-grid">
        <label>
          المحافظة
          <select value={filters.governorate} onChange={(e) => setFilter("governorate", e.target.value)}>
            {options.governorates.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          المنطقة
          <select value={filters.region} onChange={(e) => setFilter("region", e.target.value)}>
            {options.regions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          المسجد
          <select value={filters.mosque} onChange={(e) => setFilter("mosque", e.target.value)}>
            {options.mosques.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          الشيخ
          <select value={filters.sheikh} onChange={(e) => setFilter("sheikh", e.target.value)}>
            {options.sheikhs.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          اليوم
          <select value={filters.day} onChange={(e) => setFilter("day", e.target.value)}>
            {options.days.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          التصنيف
          <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)}>
            {options.categories.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <Loading />}

      {!loading && filtered.length === 0 && (
        <p className="lessons-empty-state">
          {tab === "active" ? "لا توجد دروس متاحة حاليًا." : "لا توجد دروس مؤرشفة مطابقة."}
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="page-card-grid lesson-unified-grid kuwait-lessons-grid">
          {filtered.map((lesson) => (
            <KuwaitLessonCard key={lesson.id} lesson={lesson} archived={tab === "archive"} />
          ))}
        </div>
      )}

      {!loading && tab === "active" && <LessonsContactCard />}
    </div>
  );
}
