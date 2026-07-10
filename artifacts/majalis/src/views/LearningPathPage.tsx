import { Suspense, lazy, useEffect, useState } from "react";
import { BookOpen, ClipboardList, Leaf, Map as MapIcon } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { supabase } from "@/lib/supabase";
import type { LPScience, LPProgress } from "@/lib/learning-path-service";
import { fetchSciences, fetchProgress } from "@/lib/learning-path-service";
import { SkeletonCardGrid } from "@/components/ui-common";

const ScienceCard = lazy(() =>
  import("@/components/learning-path/ScienceCard").then((m) => ({ default: m.ScienceCard }))
);

export default function LearningPathPage() {
  const { isLoggedIn } = useAuth();
  const [sciences, setSciences]   = useState<LPScience[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/learning-path",
      title: "مسارات التعلم الشرعي | المجلس العلمي",
      description: "ابدأ رحلة التعلم الشرعي المنهجي، مسارات علمية منظمة في الفقه والعقيدة والتفسير والحديث.",
      keywords: ["مسارات تعلم", "تعلم شرعي", "تعليم إسلامي", "منهج علمي", "دراسة شرعية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "EducationalOccupationalProgram",
          name: "مسارات التعلم الشرعي",
          url: "https://majlisilm.com/learning-path",
          description: "مسارات علمية منهجية في الفقه والعقيدة والتفسير والحديث",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
          inLanguage: "ar",
          educationalLevel: "متعدد المستويات",
        },
      ],
    });
  }, []);
  const [progress, setProgress]   = useState<LPProgress[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const sciencesP = fetchSciences().catch(() => [] as LPScience[]);
    const progressP = isLoggedIn
      ? supabase.auth.getSession().then(({ data }) => data.session?.access_token
          ? fetchProgress(data.session.access_token).catch(() => [] as LPProgress[])
          : [] as LPProgress[])
      : Promise.resolve([] as LPProgress[]);

    Promise.all([sciencesP, progressP])
      .then(([s, p]) => { setSciences(s); setProgress(p); })
      .catch(() => setError("حدث خطأ في تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const completedByScience = new Map<string, number>();
  for (const p of progress) {
    if (p.status === "completed") {
      // العداد العام بدون scienceId مباشرة
    }
  }

  const totalCompleted = progress.filter((p) => p.status === "completed").length;
  const totalProgress  = progress.length;

  return (
    <div className="lp-page-bg">

      {/* Hero */}
      <div className="lpth-hero">
        <div className="lpth-hero__deco" aria-hidden="true">
          <span className="lpth-hero__deco-text">﷽</span>
        </div>

        <div className="lpth-hero__inner">
          <div className="lpth-hero__eyebrow">
            <MapIcon size={15} strokeWidth={1.8} aria-hidden="true" />
            <span>خارطة طالب العلم الشرعي</span>
          </div>
          <h1 className="lpth-hero__title">ابدأ رحلتك في طلب العلم</h1>
          <p className="lpth-hero__subtitle">
            مسار علمي منظم يأخذك من البداية إلى التقدم في العلوم الشرعية،
            كتاباً كتاباً، مستوىً مستوى.
          </p>

          {isLoggedIn && totalProgress > 0 && (
            <div className="lpth-hero__stats">
              <div className="lpth-hero__stat">
                <span className="lpth-hero__stat-num">{totalCompleted}</span>
                <span className="lpth-hero__stat-label">كتاب مكتمل</span>
              </div>
              <div className="lpth-hero__stat-divider" aria-hidden="true" />
              <div className="lpth-hero__stat">
                <span className="lpth-hero__stat-num">{totalProgress}</span>
                <span className="lpth-hero__stat-label">كتاب بدأت</span>
              </div>
            </div>
          )}

          <div className="lpth-hero__actions">
            {isLoggedIn ? (
              <Link href="/learning-path/dashboard">
                <span className="lpth-hero__btn-primary">لوحتي التعليمية</span>
              </Link>
            ) : (
              <Link href="/login">
                <span className="lpth-hero__btn-ghost">سجّل الدخول لتتبع تقدمك</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* كيف تعمل الخارطة */}
        <div className="lpth-how-card">
          <h2 className="lpth-how-card__title">
            <ClipboardList size={18} strokeWidth={1.8} aria-hidden="true" /> كيف تعمل الخارطة؟
          </h2>
          <div className="lpth-how-grid">
            {[
              { n: "١", title: "اختر علماً", desc: "من العقيدة والحديث والفقه وغيرها" },
              { n: "٢", title: "تابع المستويات", desc: "من التمهيدي حتى المتقدم خطوة بخطوة" },
              { n: "٣", title: "أكمل الكتب", desc: "واختبر نفسك وتابع إنجازاتك" },
            ].map((s) => (
              <div key={s.n} className="lpth-how-step">
                <span className="lpth-how-step__num">{s.n}</span>
                <div>
                  <p className="lpth-how-step__title">{s.title}</p>
                  <p className="lpth-how-step__desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* العلوم */}
        <h2 className="lpth-sciences-title">
          <Leaf size={18} strokeWidth={1.8} aria-hidden="true" /> العلوم الشرعية
        </h2>

        {error && (
          <div className="lp-error">{error}</div>
        )}

        {loading ? (
          <SkeletonCardGrid count={6} />
        ) : sciences.length === 0 ? (
          <div className="lpth-empty">
            <div aria-hidden="true"><BookOpen size={48} strokeWidth={1.3} /></div>
            <p>لا توجد علوم متاحة بعد</p>
          </div>
        ) : (
          <Suspense fallback={<SkeletonCardGrid count={6} />}>
            <div className="page-card-grid">
              {sciences.map((sci) => (
                <ScienceCard
                  key={sci.id}
                  science={sci}
                  progressCount={completedByScience.get(sci.id) ?? 0}
                />
              ))}
            </div>
          </Suspense>
        )}
      </div>

      <div className="twh-share">
        <ShareButtons title="المسار التعليمي الإسلامي — المجلس العلمي" url="https://majlisilm.com/learning-path" />
      </div>
    </div>
  );
}
