import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { PageHeader, ErrorState, Empty } from "@/components/ui-common";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { useAuth } from "@/components/AuthProvider";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { LessonsContactCard } from "@/components/lessons/LessonsContactCard";
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

type TabId = "all" | "lessons" | "courses";

const TAB_LABELS: Record<TabId, string> = {
  all: "الكل",
  lessons: "دروس",
  courses: "دورات",
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
  if (value === "courses" || value === "lessons") return value;
  return "all";
}

function filterByTab(lessons: KuwaitLessonRecord[], tab: TabId): KuwaitLessonRecord[] {
  if (tab === "courses") return lessons.filter((l) => l.isCourse || l.activityType === "دورة");
  if (tab === "lessons") return lessons.filter((l) => !l.isCourse && l.activityType !== "دورة");
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
  const { user, isLoggedIn } = useAuth() as any;

  const loadLessons = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    return RequestManager.run("lessons:unified-split", () => getUnifiedLessonsSplit())
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
  }, []);

  useEffect(() => {
    if (initialActive) return;
    void loadLessons();
  }, [initialActive, loadLessons]);

  useEffect(() => {
    if (initialActive) return;
    const onReady = () => {
      void loadLessons();
    };
    window.addEventListener("majalis:supabase-ready", onReady);
    return () => window.removeEventListener("majalis:supabase-ready", onReady);
  }, [initialActive, loadLessons]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      getMyRegistrations(user.id).then(setMyReg).catch(() => setMyReg([]));
    }
  }, [isLoggedIn, user]);

  const tabLessons = useMemo(() => filterByTab(activeLessons, tab), [activeLessons, tab]);

  const tabCounts = useMemo(
    () => ({
      all: activeLessons.length,
      lessons: filterByTab(activeLessons, "lessons").length,
      courses: filterByTab(activeLessons, "courses").length,
    }),
    [activeLessons],
  );

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
    const lessons = filterByTab(activeLessons, "lessons").length;
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
    const upcoming = sorted.slice(0, 4);
    const popular = [...tabLessons]
      .sort((a, b) => (b.keywords?.length || 0) - (a.keywords?.length || 0))
      .slice(0, 4);
    const featured = tabLessons.filter((l) => l.hasLiveStream).slice(0, 4);
    return { upcoming, popular, featured: featured.length ? featured : upcoming.slice(0, 3) };
  }, [tabLessons]);

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

  const toggleReg = async (lessonId: string) => {
    if (!isLoggedIn) return alert("يرجى تسجيل الدخول أولاً");
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

  const renderGrid = (lessons: KuwaitLessonRecord[], prefix = "") => (
    <div className="page-card-grid lesson-unified-grid">
      {lessons.map((lesson) => (
        <UnifiedLessonCard
          key={`${prefix}${lesson.id}`}
          lesson={fromKuwaitLesson(lesson, prefix.startsWith("archived"))}
          showRegister={isLoggedIn && !lesson.id.startsWith("kw-")}
          registered={myReg.includes(lesson.id)}
          onToggleRegister={() => toggleReg(lesson.id)}
        />
      ))}
    </div>
  );

  return (
    <div className="page-shell lessons-page-v2 ds-page">
      <PageHeader
        eyebrow="المجلس العلمي"
        title="الدروس"
        subtitle="جميع الدروس والدورات العلمية — مرتّبة حسب أقرب موعد."
      />

      <div className="lessons-v2-stats">
        <div className="lessons-v2-stat"><strong>{pageStats.lessons}</strong><span>درس</span></div>
        <div className="lessons-v2-stat"><strong>{pageStats.courses}</strong><span>دورة</span></div>
        <div className="lessons-v2-stat"><strong>{pageStats.sheikhs}</strong><span>شيخ</span></div>
        <div className="lessons-v2-stat"><strong>{pageStats.mosques}</strong><span>مسجد</span></div>
        <div className="lessons-v2-stat"><strong>{pageStats.lastUpdate}</strong><span>آخر تحديث</span></div>
      </div>

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
              {TAB_LABELS[tabId]} ({tabCounts[tabId]})
            </button>
          ))}
        </div>
        <button
          type="button"
          className="lessons-v2-filter-toggle"
          onClick={() => setFiltersOpen(true)}
          aria-label="فتح التصفية"
        >
          تصفية وبحث
        </button>
      </div>

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
                      <h2 className="lessons-v2-section__title">المميز — بث مباشر</h2>
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
                  {filtered.length} {tab === "courses" ? "دورة" : "درس"}
                </h2>
                {filtered.length === 0 ? (
                  <p className="lessons-empty-state">لا توجد {TAB_LABELS[tab]} مطابقة حاليًا.</p>
                ) : (
                  renderGrid(filtered)
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

      <LessonsContactCard />
    </div>
  );
}
