import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { SkeletonPage } from "@/components/ui-common";
import {
  fetchPathDetail,
  fetchEnrollment,
  enrollInPath,
  fetchCompletionEvents,
  logCompletionEvent,
  type PathDetail,
  type CourseDetail,
} from "@/lib/learning-paths-service";
import {
  computeCourseProgress,
  computeTotalSessions,
  estimateWeeksRange,
  isCourseComplete,
  isCourseUnlocked,
  isItemComplete,
} from "@/lib/learning-paths/engine";
import type { CompletionEvent } from "@/lib/learning-paths/types";
import { useAuth } from "@/components/AuthProvider";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { applyPageSeo } from "@/lib/seo";
import {
  BookOpen, FileQuestion, BookMarked, CheckSquare,
  CheckCircle2, ChevronRight, ChevronDown, Clock, Lock,
  BarChart3, UserPlus, type LucideProps,
} from "lucide-react";

type LucideIcon = React.ComponentType<Omit<LucideProps, "ref">>;

const ITEM_ICONS: Record<string, LucideIcon> = {
  lesson: BookOpen,
  book: BookMarked,
  activity: CheckSquare,
  assessment: FileQuestion,
};

// المسار (learning_paths.level) يستخدم مفردات beginner/intermediate/advanced
// بينما المقرر (courses.level) يستخدم foundational/intermediate/advanced/specialist
// — خريطة واحدة تخدم الاثنين معًا بلا تعارض مفاتيح.
const LEVEL_LABEL: Record<string, string> = {
  beginner: "مبتدئ", foundational: "تأسيسي", intermediate: "متوسط", advanced: "متقدم", specialist: "تخصصي",
};

function ProgressRing({ pct }: { pct: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const off = circ - (Math.min(100, pct) / 100) * circ;
  return (
    <div className="lpd2-ring" aria-label={`${Math.round(pct)}% مكتمل`}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
        <circle cx="38" cy="38" r={r} strokeWidth="6" className="lpd2-ring__track" fill="none" />
        <circle
          cx="38" cy="38" r={r} strokeWidth="6" className="lpd2-ring__fill" fill="none"
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 38 38)"
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div className="lpd2-ring__pct">{Math.round(pct)}%</div>
    </div>
  );
}

function CourseCard({
  course,
  unlocked,
  events,
  userId,
  onCompleteItem,
}: {
  course: CourseDetail;
  unlocked: boolean;
  events: CompletionEvent[];
  userId: string | undefined;
  onCompleteItem: (itemId: string, method: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const progress = computeCourseProgress(course.items, events);
  const complete = isCourseComplete(course.items, events, null);

  return (
    <div className={`lpd2-course-card${unlocked ? "" : " lpd2-course-card--locked"}`}>
      <button type="button" className="lpd2-course-card__head" onClick={() => unlocked && setOpen((v) => !v)} disabled={!unlocked}>
        <div className="lpd2-course-card__head-main">
          {!unlocked ? <Lock size={16} aria-hidden="true" /> : complete ? <CheckCircle2 size={16} className="lpd2-module__check" aria-hidden="true" /> : null}
          <span className="lpd2-course-card__title">{course.title}</span>
        </div>
        <div className="lpd2-course-card__head-meta">
          <span>{course.totalSessions} جلسة</span>
          <span>{LEVEL_LABEL[course.level] ?? course.level}</span>
          {unlocked && <ChevronDown size={16} className={open ? "lpd2-chevron--open" : ""} aria-hidden="true" />}
        </div>
      </button>

      {unlocked && (
        <div className="lpd2-course-card__bar" aria-hidden="true">
          <div className="lpd2-course-card__bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
      {!unlocked && <p className="lpd2-course-card__locked-note">مقفل حتى إكمال المقرر السابق</p>}

      {open && unlocked && (
        <div className="lpd2-course-card__body">
          {course.description && <p className="lpd2-course-card__desc">{course.description}</p>}

          {course.items.length === 0 ? (
            <p className="lpd2-course-card__empty">لا محتوى منشور بعد لهذا المقرر — قيد المراجعة العلمية.</p>
          ) : (
            <div className="lpd2-modules">
              {course.items.map((item, i) => {
                const done = isItemComplete(item, events);
                const Icon = ITEM_ICONS[item.itemType] ?? BookOpen;
                const books = course.books.filter((b) => b.learningItemId === item.id);
                return (
                  <div key={item.id} className={`lpd2-module${done ? " lpd2-module--done" : ""}`}>
                    <div className="lpd2-module__num" aria-hidden="true">
                      {done ? <CheckCircle2 size={18} strokeWidth={2} className="lpd2-module__check" /> : <span>{i + 1}</span>}
                    </div>
                    <div className="lpd2-module__body">
                      <span className="lpd2-module__type-row"><Icon size={15} aria-hidden="true" /> {item.sessionEstimate} جلسة</span>
                      <h3 className="lpd2-module__title">{item.title}</h3>
                      {books.map((b) => (
                        <div key={b.id} className="lpd2-book-chip">
                          <BookMarked size={12} aria-hidden="true" />
                          <span><strong>{b.bookTitle}</strong>{b.bookAuthor ? ` — ${b.bookAuthor}` : ""}</span>
                          <span className="lpd2-book-chip__role">{b.materialRole}</span>
                        </div>
                      ))}
                    </div>
                    <div className="lpd2-module__action">
                      {done ? (
                        <span className="lpd2-module__done-tag"><CheckCircle2 size={12} aria-hidden="true" /> مكتمل</span>
                      ) : !userId ? (
                        <Link href="/login" className="lpd2-complete-btn">سجّل الدخول</Link>
                      ) : (
                        <button type="button" onClick={() => onCompleteItem(item.id, item.completionMethod)} className="lpd2-complete-btn">
                          إكمال
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LearningPathDetailPage() {
  const params = useParams();
  const slug = params.slug || "";
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<PathDetail | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [events, setEvents] = useState<CompletionEvent[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: `/learning/paths/${slug}`,
      title: "مسار تعليمي | المجلس العلمي",
      description: "تفاصيل مسار التعلم الإسلامي، المراحل والمقررات والدروس والكتب وشهادة الإتمام.",
      keywords: ["مسار تعليمي", "تعلم إسلامي", "مقررات دراسية", "شهادة إتمام"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: "مسار تعليمي شرعي",
          url: `https://www.majlisilm.com/learning/paths/${slug}`,
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
          inLanguage: "ar",
        },
      ],
    });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchPathDetail(slug).then((data) => {
      setPath(data);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    if (!user?.id || !path) return;
    fetchEnrollment(user.id, path.id).then((e) => setEnrolled(!!e));
    const allItemIds = path.stages.flatMap((s) => s.courses.flatMap((c) => c.items.map((i) => i.id)));
    fetchCompletionEvents(user.id, allItemIds).then(setEvents);
  }, [user?.id, path]);

  const allCourses = useMemo(() => path?.stages.flatMap((s) => s.courses) ?? [], [path]);
  const allRequiredItems = useMemo(() => allCourses.flatMap((c) => c.items), [allCourses]);
  const pathProgress = allRequiredItems.length ? computeCourseProgress(allRequiredItems, events) : 0;
  const completedCourseIds = useMemo(
    () => new Set(allCourses.filter((c) => isCourseComplete(c.items, events, null)).map((c) => c.id)),
    [allCourses, events],
  );
  const prerequisites = useMemo(
    () => allCourses.flatMap((c) => c.requiresCourseIds.map((r) => ({ courseId: c.id, requiresCourseId: r }))),
    [allCourses],
  );
  const weeks = path ? estimateWeeksRange(computeTotalSessions(allRequiredItems, true), 4) : { minWeeks: 0, maxWeeks: 0 };

  const handleEnroll = async () => {
    if (!user?.id || !path) return;
    setEnrolling(true);
    try {
      await enrollInPath(user.id, path.id);
      setEnrolled(true);
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteItem = async (itemId: string, method: string) => {
    if (!user?.id) return;
    await logCompletionEvent(user.id, itemId, "completed", method as any, 100);
    setEvents((prev) => [...prev, { learningItemId: itemId, eventType: "completed", evidenceValue: 100, occurredAt: new Date().toISOString() }]);
  };

  if (loading) return <SkeletonPage />;
  if (!path) return <div className="page-shell"><p>المسار غير موجود.</p></div>;

  return (
    <div className="page-shell narrow lpd2-page" dir="rtl">
      <div className="lpd2-hero">
        <nav className="lpd2-breadcrumb" aria-label="مسار التنقل">
          <Link href="/learning/paths">المسارات</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span>{path.title}</span>
        </nav>

        <div className="lpd2-hero__body">
          <div className="lpd2-hero__info">
            <div className="lpd2-hero__badges">
              <span className="lpd2-badge lpd2-badge--level">
                <BarChart3 size={11} aria-hidden="true" /> {LEVEL_LABEL[path.level] ?? path.level}
              </span>
              <span className="lpd2-badge lpd2-badge--hours">
                <Clock size={11} aria-hidden="true" /> {path.totalSessions} جلسة
                {weeks.maxWeeks > 0 ? ` — نحو ${weeks.minWeeks}-${weeks.maxWeeks} أسابيع بوتيرة 4 جلسات/أسبوع` : ""}
              </span>
              <span className="lpd2-badge lpd2-badge--mods">
                <BookOpen size={11} aria-hidden="true" /> {path.coursesCount} مقرر
              </span>
            </div>
            <h1 className="lpd2-hero__title">{path.title}</h1>
            {path.description && <p className="lpd2-hero__desc">{path.description}</p>}
          </div>
          <ProgressRing pct={pathProgress} />
        </div>

        {pathProgress > 0 && (
          <div className="lpd2-hero__bar" aria-hidden="true">
            <div className="lpd2-hero__bar-fill" style={{ width: `${Math.min(100, pathProgress)}%` }} />
          </div>
        )}
      </div>

      {path.whatYouLearn.length > 0 && (
        <section className="lpd2-what-you-learn">
          <h2 className="lpd2-section-title">ماذا ستتعلم؟</h2>
          <ul>
            {path.whatYouLearn.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </section>
      )}

      {!enrolled && user?.id && (
        <button type="button" onClick={handleEnroll} disabled={enrolling} className="lpd2-enroll-btn" aria-busy={enrolling}>
          <UserPlus size={16} aria-hidden="true" />
          {enrolling ? "جارٍ التسجيل…" : "سجّل في المسار مجاناً"}
        </button>
      )}
      {!user?.id && (
        <Link href="/login" className="lpd2-enroll-btn">
          <UserPlus size={16} aria-hidden="true" /> سجّل الدخول لتتبّع تقدّمك
        </Link>
      )}

      <h2 className="lpd2-section-title">خطة المسار</h2>
      {path.stages.length === 0 && (
        <p className="lpd2-course-card__empty">هذا المسار قيد المراجعة العلمية، لم يُنشَر محتواه بعد.</p>
      )}
      {path.stages.map((stage) => (
        <section key={stage.id} className="lpd2-stage">
          <h3 className="lpd2-stage__title">{stage.title}</h3>
          {stage.description && <p className="lpd2-stage__desc">{stage.description}</p>}
          {stage.courses.length === 0 ? (
            <p className="lpd2-course-card__empty">لا مقررات منشورة بعد في هذه المرحلة.</p>
          ) : (
            <div className="lpd2-stage__courses">
              {stage.courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  unlocked={isCourseUnlocked(course.id, prerequisites, completedCourseIds)}
                  events={events}
                  userId={user?.id}
                  onCompleteItem={handleCompleteItem}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="twh-share">
        <ShareButtons title="تفاصيل المسار التعليمي — المجلس العلمي" url={`https://www.majlisilm.com/learning/paths/${slug}`} />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["fiqh", "aqeeda", "hadith"]} title="اختبر معلوماتك في العلوم الشرعية" count={4} />
      </div>
    </div>
  );
}
