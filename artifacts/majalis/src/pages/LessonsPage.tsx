import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { LessonsContactCard } from "@/components/lessons/LessonsContactCard";
import {
  DEFAULT_KUWAIT_FILTERS,
  buildSearchSuggestions,
  extractFilterOptions,
  filterKuwaitLessons,
  type KuwaitLessonFilters,
  type KuwaitLessonRecord,
} from "@/lib/kuwait-lessons";
import { loadAllKuwaitLessonsSplit } from "@/lib/lessons-service";
import { regionsForGovernorate } from "@/lib/kuwait-regions";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { registerForLesson, unregisterFromLesson, getMyRegistrations } from "@/lib/supabase";

type TabId = "all" | "lessons" | "courses" | "lectures";

const TAB_LABELS: Record<TabId, string> = {
  all: "الكل",
  lessons: "دروس",
  courses: "دورات",
  lectures: "محاضرات",
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
  if (value === "courses" || value === "lessons" || value === "lectures") return value;
  return "all";
}

function filterByTab(lessons: KuwaitLessonRecord[], tab: TabId): KuwaitLessonRecord[] {
  if (tab === "courses") return lessons.filter((l) => l.isCourse || l.activityType === "دورة");
  if (tab === "lectures") return lessons.filter((l) => l.activityType === "محاضرة");
  if (tab === "lessons") return lessons.filter((l) => !l.isCourse && l.activityType !== "دورة" && l.activityType !== "محاضرة");
  return lessons;
}

export default function LessonsPage() {
  const [activeLessons, setActiveLessons] = useState<KuwaitLessonRecord[]>([]);
  const [archivedLessons, setArchivedLessons] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<KuwaitLessonFilters>(DEFAULT_KUWAIT_FILTERS);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [myReg, setMyReg] = useState<string[]>([]);
  const [tab, setTab] = useTabFromUrl();
  const { user, isLoggedIn } = useAuth() as any;

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
      lectures: filterByTab(activeLessons, "lectures").length,
    }),
    [activeLessons],
  );

  const options = useMemo(() => extractFilterOptions(tabLessons), [tabLessons]);

  const regionOptions = useMemo(() => {
    if (filters.governorate === "كل المحافظات") return options.regions;
    return ["كل المناطق", ...regionsForGovernorate(filters.governorate)];
  }, [filters.governorate, options.regions]);

  const filtered = useMemo(
    () => filterKuwaitLessons(tabLessons, filters),
    [tabLessons, filters],
  );

  const filteredArchived = useMemo(
    () => filterKuwaitLessons(archivedLessons, filters),
    [archivedLessons, filters],
  );

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

  const stats = useMemo(
    () => ({
      total: filtered.length,
      categories: new Set(filtered.map((l) => l.category).filter(Boolean)).size,
    }),
    [filtered],
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="المجلس العلمي"
        title="الدروس"
        subtitle="جميع الدروس والمحاضرات والدورات العلمية في مكان واحد — مرتّبة حسب أقرب موعد."
      />

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

      <div className="page-stats-row">
        <span>{stats.total} {tab === "courses" ? "دورة" : tab === "lectures" ? "محاضرة" : "درس"}</span>
        <span>{stats.categories} تصنيف</span>
      </div>

      <form className="page-search-form lessons-search-form" onSubmit={(e) => e.preventDefault()}>
        <input
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="ابحث: عنوان، شيخ، مسجد، منطقة، تصنيف..."
          aria-autocomplete="list"
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
          نوع المحتوى
          <select value={filters.contentKind} onChange={(e) => setFilter("contentKind", e.target.value)}>
            {options.contentKinds.map((v) => (
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

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <p className="lessons-empty-state">لا توجد {TAB_LABELS[tab]} مطابقة حاليًا.</p>
      ) : (
        <div className="page-card-grid lesson-unified-grid">
          {filtered.map((lesson) => (
            <UnifiedLessonCard
              key={lesson.id}
              lesson={fromKuwaitLesson(lesson)}
              showRegister={isLoggedIn && !lesson.id.startsWith("kw-")}
              registered={myReg.includes(lesson.id)}
              onToggleRegister={() => toggleReg(lesson.id)}
            />
          ))}
        </div>
      )}

      {!loading && filteredArchived.length > 0 && (
        <section className="lessons-past-section" aria-labelledby="past-lessons-heading">
          <h2 id="past-lessons-heading" className="lessons-past-section__title">الدروس السابقة</h2>
          <div className="page-card-grid lesson-unified-grid">
            {filteredArchived.map((lesson) => (
              <UnifiedLessonCard
                key={`archived-${lesson.id}`}
                lesson={fromKuwaitLesson(lesson, true)}
              />
            ))}
          </div>
        </section>
      )}

      <LessonsContactCard />
    </div>
  );
}
