import { useEffect, useMemo, useState, useCallback, startTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { ShareButtons } from "@/components/ContentActions";
import { Link, useLocation } from "wouter";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { PageHeader, ErrorState, Empty } from "@/components/ui-common";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { useAuth } from "@/components/AuthProvider";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { computeNextOccurrenceMs } from "@/lib/lesson-time";
import { supabase } from "@/lib/supabase";
import { safeLocationReload } from "@/lib/safe-reload";
import {
  DEFAULT_KUWAIT_FILTERS,
  buildSearchSuggestions,
  extractFilterOptions,
  filterFeaturedHomeLessons,
  filterKuwaitLessons,
  getFeaturedHomeStatusLabel,
  sortKuwaitLessons,
  type KuwaitLessonFilters,
  type KuwaitLessonRecord,
} from "@/lib/kuwait-lessons";
import { getUnifiedLessonsSplit } from "@/lib/lessons-service";
import { RequestManager } from "@/lib/request-manager";
import { regionsForGovernorate } from "@/lib/kuwait-regions";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import "@/styles/pages/lessons.css";
import "@/styles/pages/lessons-legacy.css";
import { registerForLesson, unregisterFromLesson, getMyRegistrations } from "@/lib/supabase";
import { applyPageSeo } from "@/lib/seo";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { formatSheikhName } from "@/lib/sheikh-name";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  ActiveFilters,
  FilterBar,
  FilterSheet,
  SegmentedFilter,
  type ActiveFilterItem,
} from "@/components/filters";

import { SITE_URL } from "@/lib/site-config";
type TabId = "all" | "men" | "women" | "courses" | "makkah" | "madinah";

const TAB_LABELS: Record<TabId, string> = {
  all: "الكل",
  men: "الدروس الرجالية",
  women: "الدروس النسائية",
  courses: "دورات",
  makkah: "الحرم المكي",
  madinah: "المسجد النبوي",
};

const TAB_COMING_SOON: Partial<Record<TabId, boolean>> = { makkah: true, madinah: true };

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
      const params = new URLSearchParams(window.location.search);
      if (next === "all") params.delete("tab");
      else params.set("tab", next);
      const q = params.toString();
      setLocation(q ? `/lessons?${q}` : "/lessons");
      setTabState(next);
    },
    [setLocation],
  );

  return [tab, setTab];
}

function readTabFromUrl(): TabId {
  if (typeof window === "undefined") return "all";
  const value = new URLSearchParams(window.location.search).get("tab");
  if (value === "courses" || value === "men" || value === "women" || value === "makkah" || value === "madinah") {
    return value;
  }
  return "all";
}

function filterByTab(lessons: KuwaitLessonRecord[], tab: TabId): KuwaitLessonRecord[] {
  if (tab === "courses") return lessons.filter((l) => l.isCourse || l.activityType === "دورة");
  if (tab === "men") return lessons.filter((l) => !l.hasWomenSection);
  if (tab === "women") return lessons.filter((l) => l.hasWomenSection);
  if (tab === "makkah") {
    return lessons.filter((l) => /مك[ةه]|الحرم المك|المسجد الحرام|البيت الحرام/u.test(l.mosque || ""));
  }
  if (tab === "madinah") {
    return lessons.filter((l) => /المدين[ةه]|المسجد النبوي|الحرم النبوي/u.test(l.mosque || ""));
  }
  return lessons;
}

function countActiveFacetFilters(filters: KuwaitLessonFilters): number {
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
}

function LessonsFilterFields({
  filters,
  setFilter,
  options,
  regionOptions,
}: {
  filters: KuwaitLessonFilters;
  setFilter: <K extends keyof KuwaitLessonFilters>(key: K, value: KuwaitLessonFilters[K]) => void;
  options: ReturnType<typeof extractFilterOptions>;
  regionOptions: string[];
}) {
  return (
    <div className="mj-filter-fields">
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
            <option key={v} value={v}>
              {v === "كل المشايخ" ? v : (formatSheikhName(v) || v)}
            </option>
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
  const [filters, setFilters] = useState<KuwaitLessonFilters>(() => {
    const base = { ...DEFAULT_KUWAIT_FILTERS };
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("search");
      if (q) base.search = q;
    }
    return base;
  });
  const [searchDraft, setSearchDraft] = useState(() => filters.search);
  const debouncedSearch = useDebouncedValue(searchDraft, 250);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [myReg, setMyReg] = useState<string[]>([]);
  const [tab, setTab] = useTabFromUrl();
  const [, navigateTo] = useLocation();
  const { user, isLoggedIn, isAdmin } = useAuth();

  useEffect(() => {
    setFilters((prev) => (prev.search === debouncedSearch ? prev : { ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get("search") || "";
    if ((debouncedSearch || "") === current) return;
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    else params.delete("search");
    const q = params.toString();
    const next = q ? `/lessons?${q}` : "/lessons";
    window.history.replaceState(window.history.state, "", next);
  }, [debouncedSearch]);

  useEffect(() => {
    applyPageSeo({
      path: "/lessons",
      canonicalPath: "/lessons",
      title: "الدروس الشرعية والعلمية | المجلس العلمي",
      description:
        "دروس شرعية وعلمية من أئمة وعلماء الكويت والعالم، فقه وعقيدة وقرآن وسيرة ولغة عربية. محتوى معتمد في منهج المجلس العلمي",
      keywords: ["دروس شرعية", "دروس دينية", "دروس علمية", "علماء الكويت", "حلقات علمية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "الدروس الشرعية والدورات العلمية",
          description:
            "دروس ودورات علمية من أئمة وعلماء الكويت في الفقه والعقيدة والقرآن والسيرة؛ محتوى معتمد في منهج المجلس العلمي",
          numberOfItems: 4,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "جميع الدروس", url: `${SITE_URL}/lessons` },
            { "@type": "ListItem", position: 2, name: "الدورات العلمية", url: `${SITE_URL}/lessons?tab=courses` },
            { "@type": "ListItem", position: 3, name: "الدروس الرجالية", url: `${SITE_URL}/lessons?tab=men` },
            { "@type": "ListItem", position: 4, name: "الدروس النسائية", url: `${SITE_URL}/lessons?tab=women` },
          ],
        },
      ],
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

  const featuredSections = useMemo(() => {
    const pool = filterFeaturedHomeLessons(tabLessons);
    const sorted = sortKuwaitLessons(pool);
    const now = Date.now();
    const THRESHOLD_MS = 36 * 60 * 60 * 1000;
    const upcoming = sorted
      .filter((l) => {
        const label = getFeaturedHomeStatusLabel(l);
        if (label === "مستمر" || label === "يبدأ اليوم") return true;
        return label === "قادم" && computeNextOccurrenceMs(l.day, l.time) - now <= THRESHOLD_MS;
      })
      .slice(0, 4);
    const upcomingIds = new Set(upcoming.map((l) => l.id));
    const popular = [...pool]
      .sort((a, b) => (b.keywords?.length || 0) - (a.keywords?.length || 0))
      .filter((l) => !upcomingIds.has(l.id))
      .slice(0, 4);
    const popularIds = new Set(popular.map((l) => l.id));
    const shownIds = new Set([...upcomingIds, ...popularIds]);
    const featured = pool.filter((l) => l.hasLiveStream && !shownIds.has(l.id)).slice(0, 4);
    return { upcoming, popular, featured };
  }, [tabLessons]);

  const showFeatured = !filters.search && filters.governorate === "كل المحافظات" && tab === "all";
  const featuredIds = useMemo(() => {
    if (!showFeatured) return new Set<string>();
    return new Set([
      ...featuredSections.upcoming.map((l) => l.id),
      ...featuredSections.popular.map((l) => l.id),
      ...featuredSections.featured.map((l) => l.id),
    ]);
  }, [featuredSections, showFeatured]);

  const mainList = useMemo(
    () => filtered.filter((l) => !featuredIds.has(l.id)),
    [filtered, featuredIds],
  );

  useEffect(() => {
    if (!searchDraft.trim()) {
      setSuggestions([]);
      return;
    }
    setSuggestions(buildSearchSuggestions([...tabLessons, ...archivedLessons], searchDraft));
  }, [searchDraft, tabLessons, archivedLessons]);

  const setFilter = <K extends keyof KuwaitLessonFilters>(key: K, value: KuwaitLessonFilters[K]) => {
    startTransition(() => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "governorate") next.region = "كل المناطق";
        return next;
      });
    });
  };

  const clearAllFilters = useCallback(() => {
    setSearchDraft("");
    setFilters(DEFAULT_KUWAIT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => countActiveFacetFilters(filters), [filters]);

  const activeFilterItems = useMemo<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];
    if (filters.search.trim()) {
      items.push({
        id: "search",
        label: `بحث: ${filters.search.trim()}`,
        onRemove: () => {
          setSearchDraft("");
          setFilter("search", "");
        },
      });
    }
    if (filters.governorate !== DEFAULT_KUWAIT_FILTERS.governorate) {
      items.push({
        id: "gov",
        label: filters.governorate,
        onRemove: () => setFilter("governorate", DEFAULT_KUWAIT_FILTERS.governorate),
      });
    }
    if (filters.region !== DEFAULT_KUWAIT_FILTERS.region) {
      items.push({
        id: "region",
        label: filters.region,
        onRemove: () => setFilter("region", DEFAULT_KUWAIT_FILTERS.region),
      });
    }
    if (filters.sheikh !== DEFAULT_KUWAIT_FILTERS.sheikh) {
      items.push({
        id: "sheikh",
        label: formatSheikhName(filters.sheikh) || filters.sheikh,
        onRemove: () => setFilter("sheikh", DEFAULT_KUWAIT_FILTERS.sheikh),
      });
    }
    if (filters.category !== DEFAULT_KUWAIT_FILTERS.category) {
      items.push({
        id: "cat",
        label: filters.category,
        onRemove: () => setFilter("category", DEFAULT_KUWAIT_FILTERS.category),
      });
    }
    if (filters.day !== DEFAULT_KUWAIT_FILTERS.day) {
      items.push({
        id: "day",
        label: filters.day,
        onRemove: () => setFilter("day", DEFAULT_KUWAIT_FILTERS.day),
      });
    }
    if (filters.timeSlot !== DEFAULT_KUWAIT_FILTERS.timeSlot) {
      items.push({
        id: "time",
        label: filters.timeSlot,
        onRemove: () => setFilter("timeSlot", DEFAULT_KUWAIT_FILTERS.timeSlot),
      });
    }
    if (filters.activityType !== DEFAULT_KUWAIT_FILTERS.activityType) {
      items.push({
        id: "activity",
        label: filters.activityType,
        onRemove: () => setFilter("activityType", DEFAULT_KUWAIT_FILTERS.activityType),
      });
    }
    if (filters.hasLiveStream !== null) {
      items.push({
        id: "live",
        label: filters.hasLiveStream ? "بث مباشر" : "بدون بث",
        onRemove: () => setFilter("hasLiveStream", null),
      });
    }
    return items;
  }, [filters]);

  const toggleReg = async (lessonId: string) => {
    if (!isLoggedIn || !user) {
      navigateTo(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      if (myReg.includes(lessonId)) {
        setMyReg(myReg.filter((id) => id !== lessonId));
        await unregisterFromLesson(user.id, lessonId);
      } else {
        setMyReg([...myReg, lessonId]);
        await registerForLesson(user.id, lessonId);
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

  const renderGrid = (lessons: KuwaitLessonRecord[], prefix = "", featuredHome = false) => (
    <div className="page-card-grid lesson-unified-grid">
      {lessons.map((lesson) => (
        <div key={`${prefix}${lesson.id}`} className={isAdmin ? "lesson-card-admin-wrap" : ""}>
          <UnifiedLessonCard
            lesson={fromKuwaitLesson(lesson, prefix.startsWith("archived"), { featuredHome })}
            compact
            showRegister={isLoggedIn && !lesson.id.startsWith("kw-")}
            registered={myReg.includes(lesson.id)}
            onToggleRegister={() => toggleReg(lesson.id)}
          />
          {isAdmin && (
            <div className="lesson-admin-toolbar">
              <a
                href={`/admin?edit=${lesson.id}`}
                className="lesson-admin-btn lesson-admin-btn--edit"
                aria-label="تعديل"
              >
                <Pencil size={13} strokeWidth={1.4} aria-hidden="true" />
                تعديل
              </a>
              {!lesson.id.startsWith("kw-") && (
                <button
                  type="button"
                  className="lesson-admin-btn lesson-admin-btn--delete"
                  aria-label="حذف"
                  onClick={() => handleAdminDelete(lesson.id)}
                >
                  <Trash2 size={13} strokeWidth={1.4} aria-hidden="true" />
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
    <div className="page-shell lessons-page-v2 lessons-page-v3 ds-page mj-page">
      <PageHeader title="الدروس" subtitle="أقرب المواعيد أولًا" showBack={false} />
      <p className="lessons-v3-calendar-link">
        <Link href="/calendar" className="mj-link">تقويم الدروس</Link>
        {" · "}
        <Link href="/lessons/archive" className="mj-link">الأرشيف</Link>
      </p>

      <div className="lessons-v3-sticky">
        <FilterBar
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="ابحث عن درس أو شيخ أو مسجد…"
          searchAriaLabel="بحث في الدروس"
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          onSuggestionsOpenChange={setShowSuggestions}
          onSuggestionPick={(item) => {
            setSearchDraft(item);
            setFilter("search", item);
          }}
          activeCount={activeFilterCount}
          onOpenFilters={() => setFiltersOpen(true)}
          filtersOpen={filtersOpen}
          filterToggleLabel="تصفية"
          onClearAll={activeFilterCount > 0 ? clearAllFilters : undefined}
          listboxId="lessons-search-listbox"
        />

        <SegmentedFilter
          ariaLabel="تبويبات الدروس"
          value={tab}
          onChange={(id) => setTab(id as TabId)}
          className="lessons-v3-tabs filter-chips"
          items={(Object.keys(TAB_LABELS) as TabId[]).map((tabId) => ({
            id: tabId,
            label: TAB_LABELS[tabId],
            soon: TAB_COMING_SOON[tabId],
          }))}
        />

        <ActiveFilters
          items={activeFilterItems}
          onClearAll={clearAllFilters}
          resultCount={activeFilterCount > 0 && !loading ? filtered.length : null}
        />
      </div>

      <div className="lessons-v2-layout lessons-v3-layout">
        <main className="lessons-v2-main">
          {loadError && !loading ? (
            <ErrorState text={loadError} onRetry={() => safeLocationReload()} />
          ) : null}

          <PageLoadingGuard
            loading={loading}
            error={null}
            empty={false}
            emptyText="لا توجد دروس مطابقة للتصفية الحالية."
            onRetry={() => safeLocationReload()}
          >
            <>
              {TAB_COMING_SOON[tab] ? (
                <Empty
                  text={`لم تُوثَّق بعدُ دروس ${TAB_LABELS[tab]} من مصدر معتمد. تصفّح تبويب «الكل» للمتاح الآن.`}
                />
              ) : (
                <>
                  {showFeatured && featuredSections.upcoming.length > 0 && (
                    <section className="lessons-v2-section">
                      <h2 className="lessons-v2-section__title">
                        {featuredSections.upcoming.some((l) => getFeaturedHomeStatusLabel(l) === "مستمر")
                          ? "دروس اليوم"
                          : "الأقرب موعدًا"}
                      </h2>
                      {renderGrid(featuredSections.upcoming, "", true)}
                    </section>
                  )}

                  {showFeatured && featuredSections.featured.length > 0 && (
                    <section className="lessons-v2-section">
                      <h2 className="lessons-v2-section__title">بث مباشر</h2>
                      {renderGrid(featuredSections.featured, "feat-", true)}
                    </section>
                  )}

                  <section className="lessons-v2-section">
                    <h2 className="lessons-v2-section__title">
                      {tab === "courses"
                        ? "الدورات"
                        : tab === "women"
                          ? "دروس نسائية"
                          : tab === "men"
                            ? "دروس رجالية"
                            : "كل الدروس"}
                    </h2>
                    {mainList.length === 0 ? (
                      <Empty text="لا توجد دروس مطابقة — جرّب مسح الفلاتر أو توسيع البحث." />
                    ) : (
                      renderGrid(mainList)
                    )}
                  </section>
                </>
              )}

              {!loading && !loadError ? (
                <section className="lessons-past-section" aria-labelledby="past-lessons-heading">
                  <h2 id="past-lessons-heading" className="lessons-past-section__title">الدروس السابقة</h2>
                  <p className="lessons-empty-state">
                    الدروس المنتهية في{" "}
                    <Link href="/lessons/archive">الأرشيف</Link>
                    {archivedLessons.length > 0 ? ` (${archivedLessons.length})` : " — لا يوجد مؤرشف حالياً"}
                    .
                  </p>
                </section>
              ) : null}
            </>
          </PageLoadingGuard>
        </main>

        <aside className="lessons-v2-sidebar" aria-label="تصفية سطح المكتب">
          <div className="lessons-v2-filters ui-card mj-card">
            <div className="lessons-v2-filters__head">
              <h2>تصفية الدروس</h2>
            </div>
            <LessonsFilterFields
              filters={filters}
              setFilter={setFilter}
              options={options}
              regionOptions={regionOptions}
            />
          </div>
        </aside>
      </div>

      <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="تصفية الدروس">
        <LessonsFilterFields
          filters={filters}
          setFilter={setFilter}
          options={options}
          regionOptions={regionOptions}
        />
      </FilterSheet>

      <div className="twh-share">
        <ShareButtons aria-label="الدروس العلمية — المجلس العلمي" url={`${SITE_URL}/lessons`} />
      </div>
      <ExploreAlsoNav
        title="استكشف أيضًا"
        links={[
          { href: "/learning/paths", label: "مسارات التعلم" },
          { href: "/scholars", label: "العلماء" },
          { href: "/quran-knowledge", label: "القرآن وعلومه" },
          { href: "/hadith", label: "الحديث وعلومه" },
          { href: "/fiqh", label: "الفقه والأحكام" },
        ]}
      />
      <div className="lessons-v3-footer-pad">
        <SectionQuiz categoryId={["hadith", "fiqh"]} aria-label="اختبر معلوماتك في الدروس الشرعية" count={4} />
      </div>
    </div>
  );
}
