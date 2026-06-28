import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import {
  getQuranCircles,
  QURAN_CIRCLE_CATEGORIES,
  DEFAULT_QURAN_CIRCLE_FILTERS,
  filterQuranCircles,
  getQuranCircleCities,
  type QuranCircleFilters,
} from "@/lib/quran-circles";

export default function QuranCirclesPage() {
  const [filters, setFilters] = useState<QuranCircleFilters>(DEFAULT_QURAN_CIRCLE_FILTERS);
  const allCircles = useMemo(() => getQuranCircles(), []);
  const circles = useMemo(() => filterQuranCircles(allCircles, filters), [allCircles, filters]);
  const cities = useMemo(() => getQuranCircleCities(allCircles), [allCircles]);

  const set = <K extends keyof QuranCircleFilters>(key: K, value: QuranCircleFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="ds-page page-shell">
      <PageHeader
        eyebrow="القرآن الكريم"
        title="حلقات القرآن"
        subtitle="حلقات حفظ ومراجعة وتجويد في الكويت — مع بحث وفلترة حسب التصنيف والمدينة والمستوى."
      />

      <div className="hub-filters ui-card">
        <input
          className="hub-filters__search"
          placeholder="ابحث عن حلقة، شيخ، مسجد..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          aria-label="بحث في الحلقات"
        />
        <select value={filters.category} onChange={(e) => set("category", e.target.value)} aria-label="التصنيف">
          <option value="">كل التصنيفات</option>
          {QURAN_CIRCLE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={filters.city} onChange={(e) => set("city", e.target.value)} aria-label="المدينة">
          <option value="">كل المدن</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={filters.level} onChange={(e) => set("level", e.target.value)} aria-label="المستوى">
          <option value="">كل المستويات</option>
          {["مبتدئ", "متوسط", "متقدم", "حفظ كامل"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {circles.length === 0 ? (
        <Empty text="لا توجد حلقات مطابقة للبحث." />
      ) : (
        <div className="halaqa-list">
          {circles.map((c) => (
            <Link key={c.id} href={`/quran-circles/${c.id}`} className="halaqa-row ui-card">
              <div className="halaqa-row__media">
                <img src={c.image_url || "/logo.png"} alt="" width={72} height={72} loading="lazy" />
              </div>
              <div className="halaqa-row__body">
                <div className="halaqa-row__tags">
                  {c.categories.slice(0, 3).map((tag) => (
                    <span key={tag} className="page-tag">{tag}</span>
                  ))}
                  <span className={`halaqa-status halaqa-status--${c.status}`}>
                    {c.status === "open" ? "متاح" : c.status === "full" ? "مكتمل" : "مغلق"}
                  </span>
                </div>
                <h2>{c.name}</h2>
                <p className="halaqa-row__meta">
                  {c.sheikh_name} · {c.city}
                  {c.mosque_name ? ` · ${c.mosque_name}` : ""}
                </p>
                <p className="halaqa-row__schedule">{c.days} — {c.time}</p>
                {c.seats_available != null && (
                  <p className="halaqa-row__seats">المقاعد المتاحة: {c.seats_available} / {c.seats_total}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
