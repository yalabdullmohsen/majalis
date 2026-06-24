import { useEffect, useMemo, useState } from "react";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { KuwaitLessonCard } from "@/components/kuwait/KuwaitLessonCard";
import {
  DEFAULT_KUWAIT_FILTERS,
  extractFilterOptions,
  filterKuwaitLessons,
  loadKuwaitLessons,
  type KuwaitLessonFilters,
  type KuwaitLessonRecord,
} from "@/lib/kuwait-lessons";

export default function KuwaitLessonsPage() {
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<KuwaitLessonFilters>(DEFAULT_KUWAIT_FILTERS);

  const load = () => {
    setLoading(true);
    loadKuwaitLessons()
      .then(setLessons)
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const options = useMemo(() => extractFilterOptions(lessons), [lessons]);

  const filtered = useMemo(
    () => filterKuwaitLessons(lessons, filters),
    [lessons, filters],
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

      <div className="page-stats-row kuwait-lessons-stats">
        <span>{filtered.length} درس متاح</span>
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
        <Empty text="لا توجد دروس مطابقة للبحث حاليًا." />
      )}

      {!loading && filtered.length > 0 && (
        <div className="home-kuwait-grid kuwait-lessons-grid">
          {filtered.map((lesson) => (
            <KuwaitLessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
