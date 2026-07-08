import { useEffect, useState } from "react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getAnnualCourses } from "@/lib/platform-content-service";
import { COURSE_TYPES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function AnnualCoursesPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseType, setCourseType] = useState("الكل");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  usePageView("annual-courses", null);

  useEffect(() => {
    applyPageSeo({
      path: "/annual-courses",
      title: "البرامج السنوية والدورات العلمية | المجلس العلمي",
      description: "دورات علمية سنوية في الفقه والعقيدة والقرآن والسيرة — تصفح البرامج واشترك في طلب العلم المنظم.",
      keywords: ["دورات علمية", "برامج سنوية", "طلب العلم", "دورات فقه", "دورات قرآن"],
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getAnnualCourses({ type: courseType, search: debouncedSearch })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [courseType, debouncedSearch]);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="برامج طلب العلم"
        title="الدورات العلمية"
        subtitle="الدورات السنوية والموسمية والبرامج العلمية والمتون، مع الجداول والمشايخ والتسجيل."
      />

      <div className="page-stats-row">
        {isAdmin && <span>{items.length} دورة</span>}
        <Link href="/calendar" className="page-link-inline">التقويم</Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الدورات..."
        className="page-search-input full content-hub-search"
        aria-label="بحث في الدورات العلمية"
      />

      <div className="content-hub-chips">
        {["الكل", ...COURSE_TYPES].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setCourseType(t)}
            className={courseType === t ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد دورات مطابقة." />
      ) : (
        <div className="page-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`/annual-courses/${item.id}`}
              title={item.title}
              tag={item.course_type}
              meta={[item.season, item.venue_city, item.registration_open ? "التسجيل مفتوح" : "التسجيل مغلق"].filter(Boolean).join(" · ")}
              summary={item.summary}
            />
          ))}
        </div>
      )}
      <AdminQuickEdit section="annual-courses" />
    </div>
  );
}
