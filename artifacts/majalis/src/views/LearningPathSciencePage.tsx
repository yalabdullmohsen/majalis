import { Suspense, lazy, useEffect, useState } from "react";
import { BookMarked, BookOpen, FlaskConical, GraduationCap, Landmark, Lightbulb, Moon, ScrollText, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import type { LPScience, LPLevel, LPProgress } from "@/lib/learning-path-service";
import { fetchScienceDetail, fetchProgress } from "@/lib/learning-path-service";

const LevelTimeline = lazy(() =>
  import("@/components/learning-path/LevelTimeline").then((m) => ({ default: m.LevelTimeline }))
);

const SCIENCE_ICON_MAP: Record<string, LucideIcon> = {
  BookOpen, BookMarked, FlaskConical, GraduationCap, Landmark, Moon, ScrollText, Star,
};
function ScienceIconEl({ name }: { name: string }) {
  const I = SCIENCE_ICON_MAP[name];
  if (I) return <I size={40} strokeWidth={1.3} />;
  return <span>{name}</span>;
}

export default function LearningPathSciencePage() {
  const { scienceSlug } = useParams<{ scienceSlug: string }>();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    applyPageSeo({
      path: "/learning-path/science",
      title: "علم في مسار التعلم | المجلس العلمي",
      description: "استكشف مستويات العلم الشرعي في مسار التعلم الإسلامي، من المبتدئ إلى المتقدم.",
      keywords: ["علم شرعي", "مسار تعلم", "مستويات علمية", "تعليم إسلامي", "فقه ومذاهب"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: "علم شرعي في مسار التعلم",
          url: "https://majlisilm.com/learning-path/science",
          description: "مسار تعليمي شرعي يتدرج من المبتدئ إلى المتقدم",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
          inLanguage: "ar",
        },
      ],
    });
  }, []);
  const [science, setScience]   = useState<LPScience | null>(null);
  const [levels, setLevels]     = useState<LPLevel[]>([]);
  const [progress, setProgress] = useState<LPProgress[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!scienceSlug) return;
    setLoading(true);
    setNotFound(false);

    const detailP = fetchScienceDetail(scienceSlug);
    const progressP = isLoggedIn
      ? supabase.auth.getSession().then(({ data }) =>
          data.session?.access_token
            ? fetchProgress(data.session.access_token).catch(() => [] as LPProgress[])
            : [] as LPProgress[])
      : Promise.resolve([] as LPProgress[]);

    Promise.all([detailP, progressP])
      .then(([d, p]) => { setScience(d.science); setLevels(d.levels); setProgress(p); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [scienceSlug, isLoggedIn]);

  if (loading) {
    return (
      <div dir="rtl" className="lps-loading">
        <span className="txt-muted opacity-60">جارٍ التحميل…</span>
      </div>
    );
  }

  if (notFound || !science) {
    return (
      <div dir="rtl" className="lps-not-found">
        <ScrollText size={48} strokeWidth={1.3} aria-hidden="true" />
        <p className="txt-muted">العلم غير موجود</p>
        <Link href="/learning-path">
          <span className="lps-not-found__link cursor-pointer">← العودة للخارطة</span>
        </Link>
      </div>
    );
  }

  const allBooks = levels.flatMap((l) => l.books);
  const completedCount = allBooks.filter((b) => progress.find((p) => p.book_id === b.id && p.status === "completed")).length;
  const pct = allBooks.length > 0 ? Math.round((completedCount / allBooks.length) * 100) : 0;

  return (
    <div dir="rtl" className="lps-shell">
      {/* Hero */}
      <div
        className="lps-hero"
        style={{ "--lps-color": science.color } as React.CSSProperties}
      >
        <div className="lps-hero__inner">
          <Link href="/learning-path">
            <span className="lps-hero__back">← خارطة طالب العلم</span>
          </Link>
          <div className="lps-hero__body">
            <span className="lps-hero__icon" aria-hidden="true">
              <ScienceIconEl name={science.icon} />
            </span>
            <div className="lps-hero__info">
              <h1 className="lps-hero__title">{science.name}</h1>
              {science.description && (
                <p className="lps-hero__desc">{science.description}</p>
              )}
              {allBooks.length > 0 && (
                <div className="lps-hero__progress">
                  <div className="lps-hero__progress-bar">
                    <div
                      className="lps-prog-fill"
                      style={{ "--lps-pct": `${pct}%` } as React.CSSProperties}
                    />
                  </div>
                  <span className="lps-hero__progress-txt">{completedCount}/{allBooks.length} كتاب</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* لماذا تدرس هذا العلم */}
      {science.why_study && (
        <div className="lps-why">
          <div className="lps-why-box">
            <p>
              <strong className="inline-flex items-center gap-1">
                <Lightbulb size={14} strokeWidth={1.8} aria-hidden="true" />
                {" "}لماذا تدرس {science.name}؟{" "}
              </strong>
              {science.why_study}
            </p>
          </div>
        </div>
      )}

      {/* المستويات */}
      <div className="lps-levels">
        <h2 className="lps-levels__title">مسار التعلم</h2>
        {levels.length === 0 ? (
          <div className="lps-levels__empty">
            <div className="lps-levels__empty-icon" aria-hidden="true">
              <BookOpen size={44} strokeWidth={1.3} />
            </div>
            <p>لم تُضَف كتب لهذا العلم بعد</p>
          </div>
        ) : (
          <Suspense fallback={<p className="txt-muted opacity-60 text-center py-8">جارٍ التحميل…</p>}>
            <LevelTimeline
              levels={levels}
              _scienceSlug={science.slug}
              progress={progress}
            />
          </Suspense>
        )}

        <div className="twh-share">
          <ShareButtons title={`${science.name} — مسار التعلم | المجلس العلمي`} url={`https://majlisilm.com/learning-path/${science.slug}`} />
        </div>
      </div>
    </div>
  );
}
