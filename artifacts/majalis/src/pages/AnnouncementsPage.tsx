import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Megaphone } from "lucide-react";
import { LessonAdCard } from "@/components/lessons/LessonAdCard";
import { LessonAdFilters } from "@/components/lessons/LessonAdFilters";
import { LessonAdModal } from "@/components/lessons/LessonAdModal";
import {
  CATEGORY_LABELS,
  filterLessonAds,
  getLessonAdFilterOptions,
  lessonAds,
  sortLessonAds,
  type LessonAd,
  type LessonAdFilters as Filters,
} from "@/lib/lesson-ads";

export default function AnnouncementsPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [activeItem, setActiveItem] = useState<LessonAd | null>(null);

  const options = useMemo(() => getLessonAdFilterOptions(lessonAds), []);

  const filtered = useMemo(
    () => sortLessonAds(filterLessonAds(lessonAds, filters)),
    [filters],
  );

  return (
    <div className="la-page">
      <section className="la-page-hero">
        <div className="home-container la-page-hero__inner">
          <div className="la-page-hero__chips">
            <span className="la-ribbon">إعلانات الدروس</span>
            <Link href="/lessons?tab=courses" className="la-link-chip">
              الدورات العلمية
            </Link>
          </div>
          <h1 className="la-page-title">إعلانات الدروس والدورات</h1>
          <p className="la-page-lead">
            بطاقات موحّدة للدروس والبرامج — مع تفاصيل كاملة وروابط
            مباشرة للخريطة والبث والمادة العلمية.
          </p>
        </div>
      </section>

      <div className="home-container la-page-body">
        <div className="la-templates-note" aria-label="أنواع الإعلانات">
          {Object.values(CATEGORY_LABELS).map((label) => (
            <span key={label} className="la-template-chip">
              {label}
            </span>
          ))}
        </div>

        <LessonAdFilters filters={filters} options={options} onChange={setFilters} />

        {filtered.length === 0 ? (
          <div className="la-empty-state">
            <Megaphone className="la-empty-icon" aria-hidden="true" />
            <p className="la-empty-title">لا توجد إعلانات مطابقة</p>
            <p className="la-empty-text">
              جرّب تغيير معايير البحث أو{" "}
              <button type="button" className="la-reset-btn" onClick={() => setFilters({})}>
                إعادة ضبط الفلاتر
              </button>
            </p>
          </div>
        ) : (
          <div className="lad-page-grid">
            {filtered.map((item) => (
              <LessonAdCard key={item.id} item={item} onOpen={setActiveItem} />
            ))}
          </div>
        )}
      </div>

      <LessonAdModal item={activeItem} onClose={() => setActiveItem(null)} />
    </div>
  );
}
