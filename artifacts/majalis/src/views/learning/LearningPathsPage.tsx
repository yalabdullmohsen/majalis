import { useEffect, useState } from "react";
import { BookOpen, Building2, Leaf, Library, Moon, PenLine, Scale, ScrollText, Sprout, Target, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { fetchLearningPaths, levelLabel, type LearningPath } from "@/lib/digital-learning-service";
import { applyPageSeo } from "@/lib/seo";

// ── Static fallback paths ─────────────────────────────────────────────────────

const STATIC_PATHS: LearningPath[] = [
  // عقيدة
  { slug: "tawhid-basics",        title: "مدخل إلى التوحيد",                description: "أسس عقيدة أهل السنة والجماعة في التوحيد وأقسامه الثلاثة.",            level: "beginner",     category: "aqeedah", estimated_hours: 8  },
  { slug: "aqeedah-wasitiyya",    title: "شرح العقيدة الواسطية",            description: "شرح متن الواسطية لشيخ الإسلام ابن تيمية دراسةً وافيةً.",             level: "intermediate", category: "aqeedah", estimated_hours: 20 },
  // فقه
  { slug: "fiqh-ibadah",          title: "فقه العبادات الأساسية",           description: "أحكام الطهارة والصلاة والصيام والزكاة والحج من المبتدئين.",           level: "beginner",     category: "fiqh",    estimated_hours: 15 },
  { slug: "fiqh-muamalat",        title: "فقه المعاملات المالية",           description: "أحكام البيع والشراء والعقود والتعاملات المصرفية المعاصرة.",           level: "intermediate", category: "fiqh",    estimated_hours: 18 },
  { slug: "fiqh-usul",            title: "مدخل إلى أصول الفقه",            description: "مبادئ الاستنباط الفقهي والمصادر الشرعية والقواعد الكلية.",            level: "advanced",     category: "fiqh",    estimated_hours: 25 },
  // قرآن
  { slug: "tajwid-level1",        title: "أحكام التجويد للمبتدئين",         description: "أحكام النون الساكنة والتنوين والمدود وصفات الحروف.",                 level: "beginner",     category: "quran",   estimated_hours: 10 },
  { slug: "tafsir-juz-amma",      title: "تفسير جزء عمّ",                   description: "تفسير موجز لقصار السور مع بيان المعاني وأسباب النزول.",              level: "beginner",     category: "quran",   estimated_hours: 12 },
  { slug: "ulum-quran-intro",     title: "مدخل في علوم القرآن",             description: "تاريخ جمع القرآن ومناهج التفسير والإعجاز وأنواع القراءات.",          level: "intermediate", category: "quran",   estimated_hours: 16 },
  // حديث
  { slug: "arbaeen-study",        title: "دراسة الأربعون النووية",           description: "شرح الأربعين حديثاً مع الفوائد المستنبطة والتطبيق العملي.",          level: "beginner",     category: "hadith",  estimated_hours: 12 },
  { slug: "mustalah-hadith",      title: "مصطلح الحديث",                    description: "أنواع الحديث من صحيح وحسن وضعيف وقواعد الجرح والتعديل.",           level: "intermediate", category: "hadith",  estimated_hours: 20 },
  // أخلاق
  { slug: "akhlaq-islamiyya",     title: "الأخلاق الإسلامية",               description: "الفضائل والرذائل والآداب الشرعية في الإسلام من الكتاب والسنة.",      level: "beginner",     category: "akhlaq",  estimated_hours: 10 },
  { slug: "tazkiyah-nafs",        title: "تزكية النفس",                     description: "أساليب تزكية النفس وعلاج الأمراض القلبية وبناء العلاقة مع الله.",   level: "intermediate", category: "akhlaq",  estimated_hours: 14 },
  // سيرة
  { slug: "seerah-mukhtasara",    title: "السيرة النبوية المختصرة",         description: "نبذة وافية عن حياة النبي ﷺ من المولد إلى الوفاة.",                  level: "beginner",     category: "seerah",  estimated_hours: 12 },
  { slug: "ghazawat",             title: "غزوات النبي ﷺ",                   description: "دراسة تفصيلية للغزوات والمعارك الكبرى ودروسها وعبرها.",              level: "intermediate", category: "seerah",  estimated_hours: 18 },
  // تربية
  { slug: "tarbiyah-dhati",       title: "التربية الذاتية لطالب العلم",     description: "منهج طالب العلم في تنظيم الوقت والمذاكرة والثبات على الطلب.",       level: "beginner",     category: "tarbiyah",estimated_hours: 8  },
];

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

const ALL_CAT = "الكل";

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(ALL_CAT);

  useEffect(() => {
    applyPageSeo({
      path: "/learning-path",
      title: "المسارات العلمية الشرعية | المجلس العلمي",
      description: "مسارات تعليمية منظمة في العلوم الشرعية، فقه وعقيدة وقرآن وحديث وسيرة وأخلاق. من المبتدئ إلى المتقدم مع شهادات إتمام.",
      keywords: ["مسارات تعليمية", "طلب العلم", "تعلم الفقه", "تعلم القرآن", "شهادات إسلامية"],
    });
  }, []);

  useEffect(() => {
    fetchLearningPaths()
      .then(setPaths)
      .finally(() => setLoading(false));
  }, []);

  // Merge API paths with static (API first, then static extras)
  const merged: LearningPath[] = [...paths];
  for (const sp of STATIC_PATHS) {
    if (!merged.some((p) => p.slug === sp.slug)) merged.push(sp);
  }

  const grouped = merged.reduce<Record<string, LearningPath[]>>((acc, p) => {
    const cat = p.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const allCategories = Object.keys(grouped);
  const displayed = activeCategory === ALL_CAT ? grouped : { [activeCategory]: grouped[activeCategory] ?? [] };

  const totalHours = merged.reduce((s, p) => s + (p.estimated_hours ?? 0), 0);

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
          <strong>{merged.length}+</strong>
          <span>مساراً علمياً</span>
        </div>
        <div className="lpp-stat-divider" />
        <div className="lpp-stat">
          <strong>{totalHours}+</strong>
          <span>ساعة تعليمية</span>
        </div>
        <div className="lpp-stat-divider" />
        <div className="lpp-stat">
          <strong>٣</strong>
          <span>مستويات</span>
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
        <Link href="/quiz" className="lpp-nav-link lpp-nav-link--outline">
          المسابقات التعليمية
        </Link>
        <Link href="/certificate/verify" className="lpp-nav-link lpp-nav-link--outline">
          التحقق من شهادة
        </Link>
      </div>

      {/* Level legend */}
      <div className="lpp-legend">
        <span className="lpp-legend-item"><Sprout size={14} className="icon-emerald" /> مبتدئ</span>
        <span className="lpp-legend-item"><BookOpen size={14} className="icon-emerald" /> متوسط</span>
        <span className="lpp-legend-item"><Trophy size={14} className="icon-ink-soft" /> متقدم</span>
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

      {Object.entries(displayed).map(([category, items]) => {
        const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
        return (
          <section key={category} className="lpp-category">
            <div className="lpp-category-header">
              <span className="lpp-cat-icon">{(() => { const I = meta.Icon; return <I size={18} strokeWidth={1.6} />; })()}</span>
              <h2 className="lpp-category-title">{meta.label}</h2>
              <span className="lpp-cat-count">{items.length}</span>
            </div>
            <div className="lpp-paths-grid">
              {items.map((path) => (
                <Link key={path.slug} href={`/learning/paths/${path.slug}`} className="lpp-path-link">
                  <article className="lpp-path-card">
                    <div className="lpp-path-card__top">
                      <h3 className="lpp-path-card__title">{path.title}</h3>
                      <span className="lpp-path-level-icon">{(() => { const I = LEVEL_ICON[path.level] ?? Sprout; return <I size={14} />; })()}</span>
                    </div>
                    {path.description && (
                      <p className="lpp-path-card__desc">{path.description}</p>
                    )}
                    <div className="lpp-path-card__meta">
                      <span className="lpp-path-card__badge lpp-path-card__badge--level">
                        {levelLabel(path.level)}
                      </span>
                      {path.estimated_hours && (
                        <span className="lpp-path-card__badge">
                          ~{path.estimated_hours} ساعة
                        </span>
                      )}
                      {typeof path.progress_pct === "number" && path.progress_pct > 0 && (
                        <span className="lpp-path-card__badge lpp-path-card__badge--progress">
                          {path.progress_pct}% مكتمل
                        </span>
                      )}
                    </div>
                    {typeof path.progress_pct === "number" && path.progress_pct > 0 && (
                      <div className="lpp-progress-bar" role="progressbar" aria-valuenow={path.progress_pct} aria-valuemin={0} aria-valuemax={100}>
                        <div className="lpp-progress-fill" style={{ "--lpp-pct": `${path.progress_pct}%` } as React.CSSProperties} />
                      </div>
                    )}
                  </article>
                </Link>
              ))}
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
        <ShareButtons title="المسارات التعليمية الشرعية — المجلس العلمي" url="https://majlisilm.com/learning/paths" />
      </div>
    </div>
  );
}
