import { Suspense, lazy, useEffect, useState } from "react";
import { BookMarked, BookOpen, FlaskConical, GraduationCap, Landmark, Lightbulb, Moon, ScrollText, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/components/AuthProvider";
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
      description: "استكشف مستويات العلم الشرعي في مسار التعلم الإسلامي — من المبتدئ إلى المتقدم.",
      keywords: ["علم شرعي", "مسار تعلم", "مستويات علمية", "تعليم إسلامي", "فقه ومذاهب"],
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
      <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] flex items-center justify-center">
        <div className="text-[var(--majalis-ink-soft)] opacity-60">جارٍ التحميل…</div>
      </div>
    );
  }

  if (notFound || !science) {
    return (
      <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] flex flex-col items-center justify-center gap-4">
        <div className="text-5xl" aria-hidden="true"><ScrollText size={48} strokeWidth={1.3} /></div>
        <p className="text-[var(--majalis-ink-soft)]">العلم غير موجود</p>
        <Link href="/learning-path">
          <span className="text-[var(--majalis-emerald)] hover:underline cursor-pointer text-sm">← العودة للخارطة</span>
        </Link>
      </div>
    );
  }

  const allBooks = levels.flatMap((l) => l.books);
  const completedCount = allBooks.filter((b) => progress.find((p) => p.book_id === b.id && p.status === "completed")).length;
  const pct = allBooks.length > 0 ? Math.round((completedCount / allBooks.length) * 100) : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] pb-24">
      {/* Hero */}
      <div
        className="relative py-10 px-4 lps-hero"
        style={{ "--lps-color": science.color } as React.CSSProperties}
      >
        <div className="max-w-4xl mx-auto">
          <Link href="/learning-path">
            <span className="text-white/80 hover:text-white text-sm cursor-pointer inline-flex items-center gap-1 mb-4">
              ← خارطة طالب العلم
            </span>
          </Link>
          <div className="flex items-start gap-4">
            <span className="text-5xl"><ScienceIconEl name={science.icon} /></span>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">{science.name}</h1>
              {science.description && (
                <p className="text-white/80 text-sm leading-relaxed max-w-xl">{science.description}</p>
              )}
              {allBooks.length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 max-w-xs h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all lps-prog-fill" style={{ "--lps-pct": `${pct}%` } as React.CSSProperties} />
                  </div>
                  <span className="text-white/80 text-xs">{completedCount}/{allBooks.length} كتاب</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* لماذا تدرس هذا العلم */}
      {science.why_study && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-[var(--majalis-emerald-muted)] border border-[var(--majalis-emerald)] rounded-2xl p-4 lps-why-box">
            <p className="text-[var(--majalis-emerald)] text-sm leading-relaxed">
              <strong className="inline-flex items-center gap-1"><Lightbulb size={14} strokeWidth={1.8} aria-hidden="true" /> لماذا تدرس {science.name}؟ </strong>
              {science.why_study}
            </p>
          </div>
        </div>
      )}

      {/* المستويات */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <h2 className="font-bold text-[var(--majalis-ink)] text-lg mb-6">مسار التعلم</h2>
        {levels.length === 0 ? (
          <div className="text-center py-16 text-[var(--majalis-ink-soft)] opacity-60">
            <div className="text-4xl mb-2" aria-hidden="true"><BookOpen size={44} strokeWidth={1.3} /></div>
            <p>لم تُضَف كتب لهذا العلم بعد</p>
          </div>
        ) : (
          <Suspense fallback={<div className="text-[var(--majalis-ink-soft)] opacity-60 text-center py-8">جارٍ التحميل…</div>}>
            <LevelTimeline
              levels={levels}
              _scienceSlug={science.slug}
              progress={progress}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
