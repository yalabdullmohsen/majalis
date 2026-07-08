import { useEffect, useMemo, useState, useCallback } from "react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { useAuth } from "@/components/AuthProvider";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_KUWAIT_FILTERS,
  buildSearchSuggestions,
  extractFilterOptions,
  filterKuwaitLessons,
  sortKuwaitLessons,
  type KuwaitLessonFilters,
  type KuwaitLessonRecord,
} from "@/lib/kuwait-lessons";
import { getUnifiedLessonsSplit } from "@/lib/lessons-service";
import { RequestManager } from "@/lib/request-manager";
import { regionsForGovernorate } from "@/lib/kuwait-regions";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { registerForLesson, unregisterFromLesson, getMyRegistrations } from "@/lib/supabase";
import { applyPageSeo } from "@/lib/seo";

type TabId = "all" | "men" | "women" | "courses" | "makkah" | "madinah";

const TAB_LABELS: Record<TabId, string> = {
  all: "الكل",
  men: "الدروس الرجالية",
  women: "الدروس النسائية",
  courses: "دورات",
  makkah: "الحرم المكي",
  madinah: "المسجد النبوي",
};

function useTabFromUrl(): [TabId, (tab: TabId) => void] {
  const [, setLocation] = useLocation();
  const [tab, setTabState] = useState<TabId>(() => readTabFromUrl());

  useEffect(() => {
    const sync = () => setTabState(readTabFromUrl());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const setTab = useCallback(
    (next: TabId) => {
      setLocation(next === "all" ? "/lessons" : `/lessons?tab=${next}`);
      setTabState(next);
    },
    [setLocation],
  );

  return [tab, setTab];
}

function readTabFromUrl(): TabId {
  if (typeof window === "undefined") return "all";
  const params = new URLSearchParams(window.location.search);
  const value = params.get("tab");
  if (value === "courses" || value === "men" || value === "women" || value === "makkah" || value === "madinah") return value;
  return "all";
}

function filterByTab(lessons: KuwaitLessonRecord[], tab: TabId): KuwaitLessonRecord[] {
  if (tab === "courses") return lessons.filter((l) => l.isCourse || l.activityType === "دورة");
  if (tab === "men") return lessons.filter((l) => !l.hasWomenSection);
  if (tab === "women") return lessons.filter((l) => l.hasWomenSection);
  if (tab === "makkah") return lessons.filter((l) =>
    /مك[ةه]|الحرم المك|المسجد الحرام|البيت الحرام/u.test(l.mosque || "")
  );
  if (tab === "madinah") return lessons.filter((l) =>
    /المدين[ةه]|المسجد النبوي|الحرم النبوي/u.test(l.mosque || "")
  );
  return lessons;
}

function LessonsFilterPanel({
  filters,
  setFilter,
  options,
  regionOptions,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  onClose,
}: {
  filters: KuwaitLessonFilters;
  setFilter: <K extends keyof KuwaitLessonFilters>(key: K, value: KuwaitLessonFilters[K]) => void;
  options: ReturnType<typeof extractFilterOptions>;
  regionOptions: string[];
  suggestions: string[];
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  onClose?: () => void;
}) {
  return (
    <div className="lessons-v2-filters ui-card">
      <div className="lessons-v2-filters__head">
        <h2>تصفية الدروس</h2>
        {onClose && (
          <button type="button" className="lessons-v2-filters__close" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        )}
      </div>

      <form className="lessons-v2-search" onSubmit={(e) => e.preventDefault()}>
        <input
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="ابحث: عنوان، شيخ، مسجد..."
          aria-label="بحث في الدروس"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="lessons-search-suggestions" role="listbox">
            {suggestions.map((item) => (
              <li key={item}>
                <button type="button" onMouseDown={() => setFilter("search", item)}>
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="lessons-v2-filters-grid">
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
            {regionOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          الشيخ
          <select value={filters.sheikh} onChange={(e) => setFilter("sheikh", e.target.value)}>
            {options.sheikhs.map((v) => (
              <option key={v} value={v}>{v === "كل المشايخ" ? v : `الشيخ: ${v}`}</option>
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
        <label>
          اليوم
          <select value={filters.day} onChange={(e) => setFilter("day", e.target.value)}>
            {options.days.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          الوقت
          <select value={filters.timeSlot} onChange={(e) => setFilter("timeSlot", e.target.value)}>
            {options.timeSlots.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          نوع النشاط
          <select value={filters.activityType} onChange={(e) => setFilter("activityType", e.target.value)}>
            {options.activityTypes.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          بث مباشر
          <select
            value={filters.hasLiveStream === null ? "الكل" : filters.hasLiveStream ? "نعم" : "لا"}
            onChange={(e) => {
              const v = e.target.value;
              setFilter("hasLiveStream", v === "الكل" ? null : v === "نعم");
            }}
          >
            <option value="الكل">الكل</option>
            <option value="نعم">يوجد بث</option>
            <option value="لا">بدون بث</option>
          </select>
        </label>
      </div>
      <AdminQuickEdit section="lessons" />
    </div>
  );
}

export default function LessonsPage({
  initialActive,
  initialArchived,
}: {
  initialActive?: KuwaitLessonRecord[];
  initialArchived?: KuwaitLessonRecord[];
} = {}) {
  const [activeLessons, setActiveLessons] = useState<KuwaitLessonRecord[]>(initialActive ?? []);
  const [archivedLessons, setArchivedLessons] = useState<KuwaitLessonRecord[]>(initialArchived ?? []);
  const [loading, setLoading] = useState(!initialActive);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<KuwaitLessonFilters>(DEFAULT_KUWAIT_FILTERS);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [myReg, setMyReg] = useState<string[]>([]);
  const [tab, setTab] = useTabFromUrl();
  const { user, isLoggedIn, isAdmin } = useAuth();

  useEffect(() => {
    applyPageSeo({
      path: "/lessons",
      title: "الدروس الشرعية والعلمية | المجلس العلمي",
      description: "دروس شرعية وعلمية من أئمة وعلماء الكويت والعالم — فقه وعقيدة وقرآن وسيرة ولغة عربية.",
      keywords: ["دروس شرعية", "دروس دينية", "دروس علمية", "علماء الكويت", "حلقات علمية"],
    });
  }, []);

  useEffect(() => {
    if (initialActive) return;
    setLoading(true);
    setLoadError(null);
    RequestManager.run("lessons:unified-split", () => getUnifiedLessonsSplit())
      .then(({ active, archived }) => {
        setActiveLessons(active);
        setArchivedLessons(archived);
      })
      .catch((err) => {
        setLoadError(String((err as Error)?.message || err));
        setActiveLessons([]);
        setArchivedLessons([]);
      })
      .finally(() => setLoading(false));
  }, [initialActive]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      getMyRegistrations(user.id).then(setMyReg).catch(() => setMyReg([]));
    }
  }, [isLoggedIn, user]);

  const tabLessons = useMemo(() => filterByTab(activeLessons, tab), [activeLessons, tab]);

  const options = useMemo(() => extractFilterOptions(tabLessons), [tabLessons]);

  const regionOptions = useMemo(() => {
    if (filters.governorate === "كل المحافظات") return options.regions;
    return ["كل المناطق", ...regionsForGovernorate(filters.governorate)];
  }, [filters.governorate, options.regions]);

  const filtered = useMemo(
    () => sortKuwaitLessons(filterKuwaitLessons(tabLessons, filters)),
    [tabLessons, filters],
  );

  const filteredArchived = useMemo(
    () => filterKuwaitLessons(archivedLessons, filters),
    [archivedLessons, filters],
  );

  const pageStats = useMemo(() => {
    const sheikhs = new Set(activeLessons.map((l) => l.sheikhName).filter(Boolean));
    const mosques = new Set(activeLessons.map((l) => l.mosque).filter(Boolean));
    const courses = filterByTab(activeLessons, "courses").length;
    const lessons = filterByTab(activeLessons, "men").length + filterByTab(activeLessons, "women").length;
    const latest = sortKuwaitLessons(activeLessons)[0];
    return {
      lessons,
      courses,
      sheikhs: sheikhs.size,
      mosques: mosques.size,
      lastUpdate: latest?.gregorianDate || "—",
    };
  }, [activeLessons]);

  const featuredSections = useMemo(() => {
    const sorted = sortKuwaitLessons(tabLessons);

    // كل قسم يستبعد ما ظهر في الأقسام السابقة
    const upcoming = sorted.slice(0, 4);
    const upcomingIds = new Set(upcoming.map((l) => l.id));

    const popular = [...tabLessons]
      .sort((a, b) => (b.keywords?.length || 0) - (a.keywords?.length || 0))
      .filter((l) => !upcomingIds.has(l.id))
      .slice(0, 4);
    const popularIds = new Set(popular.map((l) => l.id));

    const shownIds = new Set([...upcomingIds, ...popularIds]);
    const featured = tabLessons
      .filter((l) => l.hasLiveStream && !shownIds.has(l.id))
      .slice(0, 4);

    return { upcoming, popular, featured };
  }, [tabLessons]);

  // الدروس المعروضة في الأقسام المميزة — لاستبعادها من القائمة الرئيسية
  const featuredIds = useMemo(() => {
    const showFeatured = !filters.search && filters.governorate === "كل المحافظات";
    if (!showFeatured) return new Set<string>();
    return new Set([
      ...featuredSections.upcoming.map((l) => l.id),
      ...featuredSections.popular.map((l) => l.id),
      ...featuredSections.featured.map((l) => l.id),
    ]);
  }, [featuredSections, filters.search, filters.governorate]);

  useEffect(() => {
    if (!filters.search.trim()) {
      setSuggestions([]);
      return;
    }
    setSuggestions(buildSearchSuggestions([...tabLessons, ...archivedLessons], filters.search));
  }, [filters.search, tabLessons, archivedLessons]);

  const setFilter = <K extends keyof KuwaitLessonFilters>(key: K, value: KuwaitLessonFilters[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "governorate") next.region = "كل المناطق";
      return next;
    });
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.search.trim()) n++;
    if (filters.governorate !== DEFAULT_KUWAIT_FILTERS.governorate) n++;
    if (filters.region !== DEFAULT_KUWAIT_FILTERS.region) n++;
    if (filters.mosque !== DEFAULT_KUWAIT_FILTERS.mosque) n++;
    if (filters.sheikh !== DEFAULT_KUWAIT_FILTERS.sheikh) n++;
    if (filters.day !== DEFAULT_KUWAIT_FILTERS.day) n++;
    if (filters.category !== DEFAULT_KUWAIT_FILTERS.category) n++;
    if (filters.timeSlot !== DEFAULT_KUWAIT_FILTERS.timeSlot) n++;
    if (filters.activityType !== DEFAULT_KUWAIT_FILTERS.activityType) n++;
    if (filters.hasLiveStream !== DEFAULT_KUWAIT_FILTERS.hasLiveStream) n++;
    return n;
  }, [filters]);

  const toggleReg = async (lessonId: string) => {
    if (!isLoggedIn || !user) return alert("يرجى تسجيل الدخول أولاً");
    try {
      if (myReg.includes(lessonId)) {
        await unregisterFromLesson(user.id, lessonId);
        setMyReg(myReg.filter((id) => id !== lessonId));
      } else {
        await registerForLesson(user.id, lessonId);
        setMyReg([...myReg, lessonId]);
      }
    } catch {
      /* silent */
    }
  };

  const handleAdminDelete = useCallback(async (lessonId: string) => {
    if (!isAdmin) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا الدرس؟")) return;
    try {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
      if (error) throw error;
      setActiveLessons((prev) => prev.filter((l) => l.id !== lessonId));
      setArchivedLessons((prev) => prev.filter((l) => l.id !== lessonId));
    } catch (err) {
      alert(`فشل الحذف: ${(err as Error)?.message || err}`);
    }
  }, [isAdmin]);

  const renderGrid = (lessons: KuwaitLessonRecord[], prefix = "") => (
    <div className="page-card-grid lesson-unified-grid">
      {lessons.map((lesson) => (
        <div key={`${prefix}${lesson.id}`} className={isAdmin ? "lesson-card-admin-wrap" : ""}>
          <UnifiedLessonCard
            lesson={fromKuwaitLesson(lesson, prefix.startsWith("archived"))}
            showRegister={isLoggedIn && !lesson.id.startsWith("kw-")}
            registered={myReg.includes(lesson.id)}
            onToggleRegister={() => toggleReg(lesson.id)}
          />
          {isAdmin && (
            <div className="lesson-admin-toolbar">
              <a
                href={`/admin?edit=${lesson.id}`}
                className="lesson-admin-btn lesson-admin-btn--edit"
                title="تعديل"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M9.5 1.5L12.5 4.5L4 13H1V10L9.5 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
                تعديل
              </a>
              {!lesson.id.startsWith("kw-") && (
                <button
                  type="button"
                  className="lesson-admin-btn lesson-admin-btn--delete"
                  title="حذف"
                  onClick={() => handleAdminDelete(lesson.id)}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v4M8.5 6v4M3 3.5l.5 8h7l.5-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  حذف
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="page-shell lessons-page-v2 ds-page">
      {/* نمط هندسي إسلامي — أطباق نجمية كلاسيكية */}
      <div className="lessons-geo-banner" aria-hidden="true">
        <svg className="lessons-geo-banner__pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            {/* نمط الأطباق النجمية الثمانية مع الموصلات الهندسية */}
            <pattern id="girih-8star" x="0" y="0" width="112" height="112" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="currentColor" strokeWidth="0.75">
                {/* نجمة ثمانية مركزية */}
                <polygon points="56,34 60.4,45.6 72,41.2 67.6,52.8 79.2,57.2 67.6,61.6 72,73.2 60.4,68.8 56,80.4 51.6,68.8 40,73.2 44.4,61.6 32.8,57.2 44.4,52.8 40,41.2 51.6,45.6" opacity="0.65"/>
                {/* مثمن داخلي */}
                <polygon points="56,42 62.5,47.5 68,47.5 70,54 68,60.5 62.5,66 56,68 49.5,66 44,60.5 42,54 44,47.5 49.5,42" opacity="0.35"/>
                {/* نجوم ربعية في الزوايا */}
                <polygon points="0,0 5.6,11.2 17.2,6.8 11.6,18.4 23.2,22.8 11.6,27.2 17.2,38.8 5.6,34.4 0,45.6 -5.6,34.4 -17.2,38.8 -11.6,27.2 -23.2,22.8 -11.6,18.4 -17.2,6.8 -5.6,11.2" opacity="0.55"/>
                <polygon points="112,0 117.6,11.2 129.2,6.8 123.6,18.4 135.2,22.8 123.6,27.2 129.2,38.8 117.6,34.4 112,45.6 106.4,34.4 94.8,38.8 100.4,27.2 88.8,22.8 100.4,18.4 94.8,6.8 106.4,11.2" opacity="0.55"/>
                <polygon points="0,112 5.6,123.2 17.2,118.8 11.6,130.4 23.2,134.8 11.6,139.2 17.2,150.8 5.6,146.4 0,157.6 -5.6,146.4 -17.2,150.8 -11.6,139.2 -23.2,134.8 -11.6,130.4 -17.2,118.8 -5.6,123.2" opacity="0.55"/>
                <polygon points="112,112 117.6,123.2 129.2,118.8 123.6,130.4 135.2,134.8 123.6,139.2 129.2,150.8 117.6,146.4 112,157.6 106.4,146.4 94.8,150.8 100.4,139.2 88.8,134.8 100.4,130.4 94.8,118.8 106.4,123.2" opacity="0.55"/>
                {/* خطوط الوصل الهندسية */}
                <line x1="56" y1="34" x2="56" y2="0" opacity="0.2"/>
                <line x1="56" y1="80.4" x2="56" y2="112" opacity="0.2"/>
                <line x1="32.8" y1="57.2" x2="0" y2="57.2" opacity="0.2"/>
                <line x1="79.2" y1="57.2" x2="112" y2="57.2" opacity="0.2"/>
                {/* موصلات قطرية */}
                <line x1="40" y1="41.2" x2="17.2" y2="18.4" opacity="0.15"/>
                <line x1="72" y1="41.2" x2="94.8" y2="18.4" opacity="0.15"/>
                <line x1="40" y1="73.2" x2="17.2" y2="96" opacity="0.15"/>
                <line x1="72" y1="73.2" x2="94.8" y2="96" opacity="0.15"/>
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#girih-8star)"/>
        </svg>
      </div>
      <PageHeader
        eyebrow="المجلس العلمي"
        title="الدروس"
        subtitle="جميع الدروس والدورات العلمية، مرتّبة حسب أقرب موعد."
      />

      <div className="lessons-v2-toolbar">
        <div className="kuwait-tabs" role="tablist" aria-label="تبويبات الدروس">
          {(Object.keys(TAB_LABELS) as TabId[]).map((tabId) => (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={tab === tabId}
              className={`kuwait-tab${tab === tabId ? " kuwait-tab--active" : ""}`}
              onClick={() => setTab(tabId)}
            >
              {TAB_LABELS[tabId]}
            </button>
          ))}
        </div>
        <div className="lessons-v2-toolbar-actions">
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="lessons-v2-clear-btn"
              onClick={() => setFilters(DEFAULT_KUWAIT_FILTERS)}
              aria-label="مسح جميع الفلاتر"
            >
              مسح ✕
            </button>
          )}
          <button
            type="button"
            className={`lessons-v2-filter-toggle${activeFilterCount > 0 ? " lessons-v2-filter-toggle--active" : ""}`}
            onClick={() => setFiltersOpen(true)}
            aria-label="فتح التصفية"
          >
            تصفية وبحث
            {activeFilterCount > 0 && (
              <span className="lessons-v2-filter-badge" aria-label={`${activeFilterCount} فلتر نشط`}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeFilterCount > 0 && !loading && (
        <p className="lessons-v2-result-count" aria-live="polite">
          {filtered.length === 0
            ? "لا توجد نتائج مطابقة"
            : `${filtered.length} ${filtered.length === 1 ? "نتيجة" : "نتائج"} مطابقة`}
        </p>
      )}

      <div className="lessons-v2-layout">
        <main className="lessons-v2-main">
          <PageLoadingGuard
            loading={loading}
            error={loadError}
            empty={!loading && !loadError && activeLessons.length === 0 && archivedLessons.length === 0}
            emptyText="لا توجد بيانات حالياً"
            onRetry={() => window.location.reload()}
          >
            <>
              {!filters.search && filters.governorate === "كل المحافظات" && (
                <>
                  <section className="lessons-v2-section">
                    <h2 className="lessons-v2-section__title">الأقرب موعدًا</h2>
                    {renderGrid(featuredSections.upcoming)}
                  </section>
                  {featuredSections.featured.length > 0 && (
                    <section className="lessons-v2-section">
                      <h2 className="lessons-v2-section__title">المميز: بث مباشر</h2>
                      {renderGrid(featuredSections.featured, "feat-")}
                    </section>
                  )}
                  <section className="lessons-v2-section">
                    <h2 className="lessons-v2-section__title">الشائع</h2>
                    {renderGrid(featuredSections.popular, "pop-")}
                  </section>
                </>
              )}

              <section className="lessons-v2-section">
                <h2 className="lessons-v2-section__title">
                  {tab === "courses" ? "دورات" : tab === "women" ? "نشاطات للنساء" : tab === "men" ? "دروس رجالية" : "جميع الدروس"}
                  {isAdmin && ` (${filtered.filter((l) => !featuredIds.has(l.id)).length})`}
                </h2>
                {filtered.filter((l) => !featuredIds.has(l.id)).length === 0 ? (
                  <p className="lessons-empty-state">لا توجد {TAB_LABELS[tab]} مطابقة حاليًا.</p>
                ) : (
                  renderGrid(filtered.filter((l) => !featuredIds.has(l.id)))
                )}
              </section>

              {filteredArchived.length > 0 && (
                <section className="lessons-past-section" aria-labelledby="past-lessons-heading">
                  <h2 id="past-lessons-heading" className="lessons-past-section__title">الدروس السابقة</h2>
                  {renderGrid(filteredArchived, "archived-")}
                </section>
              )}
            </>
          </PageLoadingGuard>
        </main>

        <aside className="lessons-v2-sidebar">
          <LessonsFilterPanel
            filters={filters}
            setFilter={setFilter}
            options={options}
            regionOptions={regionOptions}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
          />
        </aside>
      </div>

      <div className="lessons-v2-stats">
        <div className="lessons-v2-stat"><strong>{pageStats.lessons}</strong><span>درس</span></div>
        <div className="lessons-v2-stat"><strong>{pageStats.courses}</strong><span>دورة</span></div>
        <div className="lessons-v2-stat"><strong>{pageStats.sheikhs}</strong><span>شيخ</span></div>
        <div className="lessons-v2-stat"><strong>{pageStats.mosques}</strong><span>مسجد</span></div>
        <div className="lessons-v2-stat"><strong>{pageStats.lastUpdate}</strong><span>آخر تحديث</span></div>
      </div>

      {filtersOpen && (
        <div className="lessons-v2-sheet-backdrop" onClick={() => setFiltersOpen(false)} role="presentation">
          <div className="lessons-v2-sheet" onClick={(e) => e.stopPropagation()}>
            <LessonsFilterPanel
              filters={filters}
              setFilter={setFilter}
              options={options}
              regionOptions={regionOptions}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              onClose={() => setFiltersOpen(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
