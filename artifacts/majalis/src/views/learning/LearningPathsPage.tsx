import { useEffect, useState } from "react";
import { BookOpen, Building2, Leaf, Library, Moon, PenLine, Scale, ScrollText, Sprout, Target, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { fetchPathList, type PathSummary } from "@/lib/learning-paths-service";
import { estimateWeeksRange } from "@/lib/learning-paths/engine";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { applyPageSeo } from "@/lib/seo";

const CATEGORY_META: Record<string, { label: string; Icon: LucideIcon }> = {
  aqeedah:  { label: "العقيدة",  Icon: Moon       },
  fiqh:     { label: "الفقه",    Icon: Scale      },
  quran:    { label: "القرآن",   Icon: BookOpen   },
  hadith:   { label: "الحديث",   Icon: ScrollText },
  akhlaq:   { label: "الأخلاق",  Icon: Leaf       },
  seerah:   { label: "السيرة",   Icon: Moon       },
  language: { label: "اللغة",    Icon: PenLine    },
  dawah:    { label: "الدعوة",   Icon: Building2  },
  tarbiyah: { label: "التربية",  Icon: Target     },
  other:    { label: "أخرى",    Icon: Library    },
};

const LEVEL_ICON: Record<string, LucideIcon> = {
  beginner: Sprout, intermediate: BookOpen, advanced: Trophy,
};
const LEVEL_LABEL: Record<string, string> = {
  beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم",
};

const ALL_CAT = "الكل";

export default function LearningPathsPage() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<PathSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(ALL_CAT);
  const [enrolledSlugs, setEnrolledSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    applyPageSeo({
      path: "/learning/paths",
      title: "المسارات العلمية الشرعية | المجلس العلمي",
      description: "مسارات تعليمية منظمة في العلوم الشرعية، فقه وعقيدة وقرآن وحديث وسيرة وأخلاق. من المبتدئ إلى المتقدم مع شهادات إتمام.",
      keywords: ["مسارات تعليمية", "طلب العلم", "تعلم الفقه", "تعلم القرآن", "شهادات إسلامية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "المسارات العلمية الشرعية",
          url: "https://www.majlisilm.com/learning/paths",
          description: "مسارات تعليمية منظمة في العلوم الشرعية من المبتدئ إلى المتقدم",
          about: { "@type": "Thing", name: "التعليم الإسلامي والمسارات الشرعية" },
        },
      ],
    });
  }, []);

  useEffect(() => {
    fetchPathList().then(setPaths).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.id) { setEnrolledSlugs(new Set()); return; }
    supabase
      .from("path_enrollments")
      .select("path_id, learning_paths!inner(slug)")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const slugs = new Set<string>((data ?? []).map((r: any) => r.learning_paths?.slug).filter(Boolean));
        setEnrolledSlugs(slugs);
      });
  }, [user?.id]);

  const grouped = paths.reduce<Record<string, PathSummary[]>>((acc, p) => {
    const cat = p.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const allCategories = Object.keys(grouped);
  const displayed = activeCategory === ALL_CAT ? grouped : { [activeCategory]: grouped[activeCategory] ?? [] };
  const totalSessions = paths.reduce((s, p) => s + p.totalSessions, 0);
  const pathsWithContent = paths.filter((p) => p.coursesCount > 0).length;

  return (
    <div className="page-shell lpp-page">
      <PageHeader
        eyebrow="طلب العلم الشرعي"
        title="المسارات العلمية"
        subtitle="رحلتك في طلب العلم، مسارات منظّمة من المبتدئ إلى المتقدم، كل مسار يضم دروساً وتقييمات وشهادة إتمام."
      />

      {/* Stats bar */}
      <div className="lpp-stats-bar">
        <div className="lpp-stat">
          <strong>{paths.length}</strong>
          <span>مساراً علمياً</span>
        </div>
        <div className="lpp-stat-divider" />
        <div className="lpp-stat">
          <strong>{totalSessions}</strong>
          <span>جلسة دراسية</span>
        </div>
        <div className="lpp-stat-divider" />
        <div className="lpp-stat">
          <strong>{pathsWithContent}</strong>
          <span>مسارًا بمحتوى فعلي الآن</span>
        </div>
        <div className="lpp-stat-divider" />
        <div className="lpp-stat">
          <strong>{allCategories.length}</strong>
          <span>تخصصات</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="lpp-nav-links">
        <Link href="/my-learning" className="lpp-nav-link lpp-nav-link--primary">
          لوحتي التعليمية
        </Link>
        <Link href="/learning/certificates" className="lpp-nav-link lpp-nav-link--outline">
          التحقق من شهادة
        </Link>
      </div>

      {/* Level legend */}
      <div className="lpp-legend">
        <span className="lpp-legend-item"><Sprout size={13} className="icon-emerald" /> مبتدئ</span>
        <span className="lpp-legend-item"><BookOpen size={13} className="icon-emerald" /> متوسط</span>
        <span className="lpp-legend-item"><Trophy size={13} className="icon-ink-soft" /> متقدم</span>
      </div>

      {/* Category filter */}
      <div className="lpp-cat-bar">
        <button
          type="button"
          className={activeCategory === ALL_CAT ? "lpp-cat-btn lpp-cat-btn--active" : "lpp-cat-btn"}
          onClick={() => setActiveCategory(ALL_CAT)}
        >
          الكل
        </button>
        {allCategories.map((cat) => {
          const meta = CATEGORY_META[cat] ?? CATEGORY_META.other;
          return (
            <button
              key={cat}
              type="button"
              className={activeCategory === cat ? "lpp-cat-btn lpp-cat-btn--active" : "lpp-cat-btn"}
              onClick={() => setActiveCategory(cat)}
            >
              {(() => { const I = meta.Icon; return <I size={13} className="inline ml-1" />; })()} {meta.label}
            </button>
          );
        })}
      </div>

      {loading && <SkeletonCardGrid count={8} />}

      {!loading && Object.entries(displayed).map(([category, items]) => {
        const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
        return (
          <section key={category} className="lpp-category">
            <div className="lpp-category-header">
              <span className="lpp-cat-icon">{(() => { const I = meta.Icon; return <I size={18} strokeWidth={1.6} />; })()}</span>
              <h2 className="lpp-category-title">{meta.label}</h2>
              <span className="lpp-cat-count">{items.length}</span>
            </div>
            <div className="lpp-paths-grid">
              {items.map((path) => {
                const hasContent = path.coursesCount > 0;
                const isEnrolled = enrolledSlugs.has(path.slug);
                const weeks = estimateWeeksRange(path.totalSessions, 4);
                return (
                  <Link key={path.slug} href={`/learning/paths/${path.slug}`} className="lpp-path-link">
                    <article className={`lpp-path-card${hasContent ? "" : " lpp-path-card--pending"}`}>
                      <div className="lpp-path-card__top">
                        <h3 className="lpp-path-card__title">{path.title}</h3>
                        <span className="lpp-path-level-icon">{(() => { const I = LEVEL_ICON[path.level] ?? Sprout; return <I size={14} />; })()}</span>
                      </div>
                      {path.description && (
                        <p className="lpp-path-card__desc">{path.description}</p>
                      )}
                      <div className="lpp-path-card__meta">
                        <span className="lpp-path-card__badge lpp-path-card__badge--level">
                          {LEVEL_LABEL[path.level] ?? path.level}
                        </span>
                        {hasContent ? (
                          <span className="lpp-path-card__badge">
                            {path.totalSessions} جلسة{weeks.maxWeeks > 0 ? ` — نحو ${weeks.minWeeks}-${weeks.maxWeeks} أسابيع` : ""}
                          </span>
                        ) : (
                          <span className="lpp-path-card__badge">قيد الإعداد</span>
                        )}
                        {isEnrolled && (
                          <span className="lpp-path-card__badge lpp-path-card__badge--progress">مسجَّل</span>
                        )}
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* How it works */}
      <section className="lpp-how-section">
        <h2 className="lpp-how-title">كيف تعمل المسارات؟</h2>
        <div className="lpp-how-grid">
          <div className="lpp-how-step">
            <div className="lpp-how-num">١</div>
            <h3>اختر المسار</h3>
            <p>اختر المسار المناسب لمستواك في أي تخصص شرعي</p>
          </div>
          <div className="lpp-how-step">
            <div className="lpp-how-num">٢</div>
            <h3>تابع الدروس</h3>
            <p>تعلّم بالترتيب مع أدوات متابعة تقدّمك في كل وحدة</p>
          </div>
          <div className="lpp-how-step">
            <div className="lpp-how-num">٣</div>
            <h3>اجتز التقييمات</h3>
            <p>اختبر معلوماتك في كل وحدة للانتقال إلى التالية</p>
          </div>
          <div className="lpp-how-step">
            <div className="lpp-how-num">٤</div>
            <h3>احصل على شهادتك</h3>
            <p>احصل على شهادة رقمية موثّقة عند إتمام المسار</p>
          </div>
        </div>
      </section>
      <div className="twh-share">
        <ShareButtons title="المسارات التعليمية الشرعية — المجلس العلمي" url="https://www.majlisilm.com/learning/paths" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["fiqh", "aqeeda", "akhlaq"]} title="اختبر معلوماتك في العلوم الإسلامية" count={4} />
      </div>
    </div>
  );
}
