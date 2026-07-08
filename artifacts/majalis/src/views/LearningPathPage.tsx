import { Suspense, lazy, useEffect, useState } from "react";
import { BookOpen, ClipboardList, Leaf, Map as MapIcon } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import type { LPScience, LPProgress } from "@/lib/learning-path-service";
import { fetchSciences, fetchProgress } from "@/lib/learning-path-service";

const ScienceCard = lazy(() =>
  import("@/components/learning-path/ScienceCard").then((m) => ({ default: m.ScienceCard }))
);

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-[var(--majalis-parchment-deep)] rounded-2xl h-36 animate-pulse" />
      ))}
    </div>
  );
}

export default function LearningPathPage() {
  const { isLoggedIn } = useAuth();
  const [sciences, setSciences]   = useState<LPScience[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/learning-path",
      title: "مسارات التعلم الشرعي | المجلس العلمي",
      description: "ابدأ رحلة التعلم الشرعي المنهجي — مسارات علمية منظمة في الفقه والعقيدة والتفسير والحديث.",
      keywords: ["مسارات تعلم", "تعلم شرعي", "تعليم إسلامي", "منهج علمي", "دراسة شرعية"],
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

  // حساب الكتب المكتملة لكل علم
  const completedByScience = new Map<string, number>();
  for (const p of progress) {
    if (p.status === "completed") {
      // لا نملك scienceId من progress مباشرة — يكفي العرض العام
    }
  }

  const totalCompleted = progress.filter((p) => p.status === "completed").length;
  const totalProgress  = progress.length;

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] pb-24">

      {/* Hero */}
      <div
        className="relative overflow-hidden lpth-hero"
      >
        {/* زخرفة إسلامية خلفية */}
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-center">
          <div className="text-[20rem] leading-none text-white font-arabic">﷽</div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-14 text-center text-white">
          <div className="inline-flex items-center gap-2 text-emerald-200 text-sm mb-4 bg-white/10 px-4 py-1.5 rounded-full">
            <MapIcon size={15} strokeWidth={1.8} aria-hidden="true" />
            <span>خارطة طالب العلم الشرعي</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            ابدأ رحلتك في طلب العلم
          </h1>
          <p className="text-emerald-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            مسار علمي منظم يأخذك من البداية إلى التقدم في العلوم الشرعية،
            كتاباً كتاباً، مستوىً مستوى.
          </p>

          {/* إحصائيات المستخدم */}
          {isLoggedIn && totalProgress > 0 && (
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalCompleted}</div>
                <div className="text-xs text-emerald-200">كتاب مكتمل</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-bold">{totalProgress}</div>
                <div className="text-xs text-emerald-200">كتاب بدأت</div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            {isLoggedIn ? (
              <Link href="/learning-path/dashboard">
                <span className="inline-block px-6 py-2.5 bg-white text-emerald-800 font-bold rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer">
                  لوحتي التعليمية
                </span>
              </Link>
            ) : (
              <Link href="/login">
                <span className="inline-block px-6 py-2.5 bg-white/10 border border-white/30 text-white font-medium rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                  سجّل الدخول لتتبع تقدمك
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* كيف تعمل الخارطة */}
        <div className="mb-10 bg-[var(--majalis-panel)] rounded-2xl border border-[var(--majalis-line)] p-6">
          <h2 className="font-bold text-[var(--majalis-ink)] text-lg mb-4 flex items-center gap-2"><ClipboardList size={18} strokeWidth={1.8} aria-hidden="true" /> كيف تعمل الخارطة؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { n: "١", title: "اختر علماً", desc: "من العقيدة والحديث والفقه وغيرها" },
              { n: "٢", title: "تابع المستويات", desc: "من التمهيدي حتى المتقدم خطوة بخطوة" },
              { n: "٣", title: "أكمل الكتب", desc: "واختبر نفسك وتابع إنجازاتك" },
            ].map((s) => (
              <div key={s.n} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--majalis-emerald-muted)] text-[var(--majalis-emerald)] font-bold flex items-center justify-center text-sm">
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold text-[var(--majalis-ink)] text-sm">{s.title}</p>
                  <p className="text-xs text-[var(--majalis-ink-soft)] mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* العلوم */}
        <h2 className="font-extrabold text-[var(--majalis-ink)] text-xl mb-5 flex items-center gap-2">
          <Leaf size={18} strokeWidth={1.8} aria-hidden="true" /> العلوم الشرعية
        </h2>

        {error && (
          <div className="text-center py-10 text-red-500">{error}</div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : sciences.length === 0 ? (
          <div className="text-center py-16 text-[var(--majalis-ink-soft)] opacity-60">
            <div className="text-4xl mb-2" aria-hidden="true"><BookOpen size={48} strokeWidth={1.3} /></div>
            <p>لا توجد علوم متاحة بعد</p>
          </div>
        ) : (
          <Suspense fallback={<LoadingSkeleton />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}
