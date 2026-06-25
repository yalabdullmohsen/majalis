import { useEffect, useMemo, useState } from "react";
import { GOVERNORATES } from "@/lib/theme";
import { PageHeader, Loading, Chip } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { LessonsContactCard } from "@/components/lessons/LessonsContactCard";
import { ScientificAnnouncementsSection } from "@/components/scientific/ScientificAnnouncementsSection";
import {
  DEFAULT_KUWAIT_FILTERS,
  filterKuwaitLessons,
  loadAllKuwaitLessonsSplit,
  sortKuwaitLessons,
  type KuwaitLessonRecord,
} from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { registerForLesson, unregisterFromLesson, getMyRegistrations } from "@/lib/supabase";

const CATEGORIES = ["الكل", "تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];

export default function LessonsPage() {
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [city, setCity] = useState("كل المحافظات");
  const [search, setSearch] = useState("");
  const [myReg, setMyReg] = useState<string[]>([]);
  const { user, isLoggedIn } = useAuth() as any;

  useEffect(() => {
    setLoading(true);
    loadAllKuwaitLessonsSplit()
      .then(({ active }) => setLessons(sortKuwaitLessons(active)))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      getMyRegistrations(user.id).then(setMyReg).catch(() => setMyReg([]));
    }
  }, [isLoggedIn, user]);

  const filtered = useMemo(() => {
    return filterKuwaitLessons(lessons, {
      ...DEFAULT_KUWAIT_FILTERS,
      search,
      category,
      governorate: city,
    });
  }, [lessons, search, category, city]);

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
        eyebrow="دروس معتمدة"
        title="الدروس والدورات"
        subtitle="استعرض الدروس العلمية الشرعية المعتمدة مرتّبة حسب أقرب موعد."
      />

      <div className="page-stats-row">
        <span>{stats.total} درس</span>
        <span>{stats.categories} تصنيف</span>
      </div>

      <form
        className="page-search-form"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن درس..."
        />
      </form>

      <div className="page-chip-row">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
      </div>
      <div className="page-chip-row">
        {["كل المحافظات", ...GOVERNORATES].map((g) => (
          <Chip key={g} active={city === g} onClick={() => setCity(g)}>{g}</Chip>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <p className="lessons-empty-state">لا توجد دروس متاحة حاليًا.</p>
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

      <LessonsContactCard />

      <ScientificAnnouncementsSection showViewAll={false} className="lessons-sci-ann" />
    </div>
  );
}
