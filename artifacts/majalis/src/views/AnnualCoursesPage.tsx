import { useEffect, useState } from "react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { ShareButtons } from "@/components/ContentActions";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getAnnualCourses } from "@/lib/platform-content-service";
import { COURSE_TYPES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { fetchAllCourses, type CourseListItem } from "@/lib/learning-paths-service";
import { getCourses as getIgCourses } from "@/lib/unified-content-service";
import type { AutoImportedContent } from "@/lib/auto-content/auto-content-utils";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "مبتدئ", foundational: "تأسيسي", intermediate: "متوسط", advanced: "متقدم", specialist: "تخصصي",
};

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
  const [pathCourses, setPathCourses] = useState<CourseListItem[]>([]);
  const [igCourses, setIgCourses] = useState<AutoImportedContent[]>([]);

  usePageView("annual-courses", null);

  useEffect(() => {
    applyPageSeo({
      path: "/annual-courses",
      title: "البرامج السنوية والدورات العلمية | المجلس العلمي",
      description: "دورات علمية سنوية في الفقه والعقيدة والقرآن والسيرة، تصفح البرامج واشترك في طلب العلم المنظم.",
      keywords: ["دورات علمية", "برامج سنوية", "طلب العلم", "دورات فقه", "دورات قرآن"],
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getAnnualCourses({ type: courseType, search: debouncedSearch })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [courseType, debouncedSearch]);

  useEffect(() => {
    fetchAllCourses().then(setPathCourses).catch(() => setPathCourses([]));
  }, []);

  useEffect(() => {
    getIgCourses(9).then(setIgCourses).catch(() => setIgCourses([]));
  }, []);

  useEffect(() => {
    if (items.length === 0 || courseType !== "الكل" || debouncedSearch) return;
    applyPageSeo({
      path: "/annual-courses",
      title: "البرامج السنوية والدورات العلمية | المجلس العلمي",
      description: "دورات علمية سنوية في الفقه والعقيدة والقرآن والسيرة، تصفح البرامج واشترك في طلب العلم المنظم.",
      keywords: ["دورات علمية", "برامج سنوية", "طلب العلم", "دورات فقه", "دورات قرآن"],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: items.slice(0, 20).map((c: any, i: number) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.title || c.name,
          url: `https://www.majlisilm.com/annual-courses/${c.id}`,
        })),
      }],
    });
  }, [items, courseType, debouncedSearch]);

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="برامج طلب العلم"
        title="الدورات العلمية"
        subtitle="الدورات الحضورية السنوية والموسمية مع الجداول والمشايخ والتسجيل، إلى جانب مقررات المسارات العلمية المنظّمة ذاتية التعلّم."
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

      <div className="content-hub-chips" role="tablist" aria-label="تصفية الدورات">
        {["الكل", ...COURSE_TYPES].map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            onClick={() => setCourseType(t)}
            className={courseType === t ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            aria-selected={courseType === t}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCardGrid />
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
      {pathCourses.length > 0 && (
        <section aria-labelledby="path-courses-heading" style={{ marginTop: "2.5rem" }}>
          <h2 id="path-courses-heading" className="page-section-title">مقررات المسارات العلمية</h2>
          <p className="page-desc">مقررات ضمن المسارات العلمية المتدرجة ذاتية التعلّم — سجّل في المسار لتتبع تقدّمك فيها.</p>
          <div className="page-card-grid">
            {pathCourses.map((c) => (
              <PlatformContentCard
                key={c.id}
                href={`/learning/paths/${c.pathSlug}`}
                title={c.title}
                tag={LEVEL_LABEL[c.level] ?? c.level}
                meta={c.pathTitle}
                summary={c.description ?? undefined}
              />
            ))}
          </div>
        </section>
      )}

      {igCourses.length > 0 && (
        <section aria-labelledby="ig-courses-heading" style={{ marginTop: "2.5rem" }}>
          <h2 id="ig-courses-heading" className="page-section-title">دورات من مصادر معتمَدة على Instagram</h2>
          <p className="page-desc">دورات أعلنتها جهات ومشايخ موثوقون على حساباتهم الرسمية — روابط خارجية للتسجيل والتفاصيل الكاملة.</p>
          <div className="page-card-grid">
            {igCourses.map((c) => (
              <a
                key={c.id}
                href={c.registration_url || c.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="platform-card-link"
              >
                <article className="page-card platform-content-card">
                  <div className="page-card-header">
                    <p>{c.title}</p>
                    <span className="page-tag">{c.attribution_name || c.organization_name || c.source_name}</span>
                  </div>
                  {c.summary && <p className="page-desc">{c.summary}</p>}
                </article>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="twh-share">
        <ShareButtons title="الدورات العلمية السنوية — المجلس العلمي" url="https://www.majlisilm.com/annual-courses" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["fiqh", "akhlaq"]} title="اختبر معلوماتك في العلم الشرعي" count={4} />
      </div>
      <AdminQuickEdit section="annual-courses" />
    </div>
  );
}
