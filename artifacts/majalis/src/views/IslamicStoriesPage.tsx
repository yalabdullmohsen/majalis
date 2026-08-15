import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Bird, BookOpen, Castle, Compass, Flower2, Gem, Landmark, Leaf, Lightbulb, Map as MapIcon, Moon, Ruler, Sailboat, Scale, Shield, Star, Sun, Sword, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { PageHeader, SkeletonCardGrid, Chip, Empty } from "@/components/ui-common";
import { loadIslamicStoriesSeed } from "@/lib/islamic-stories-seed";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { truncateAtWord } from "@/lib/utils";
import { useReadingScrollMemory } from "@/hooks/useReadingScrollMemory";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import "@/styles/pages/islamic-stories.css";

const STORY_ICON_MAP: Record<string, LucideIcon> = {
  Star, Scale, Sword, Landmark, Bird, Compass, Gem, BookOpen, Moon, Castle,
  Sun, Sailboat, Flower2, MapIcon, Ruler, Leaf, Shield,
};
function StoryIconEl({ name }: { name: string }) {
  const I = STORY_ICON_MAP[name] ?? BookOpen;
  return <I size={22} strokeWidth={1.5} />;
}

// ─────────────────── Types ────────────────────────────────────────────────────
type Category = "الكل" | "صحابة" | "فتوحات" | "تاريخ";
type Era = "الكل" | "نبوي" | "راشدي" | "أموي" | "عباسي" | "عثماني" | "حديث";

interface IslamicStory {
  id: number;
  slug: string;
  title: string;
  category: "صحابة" | "فتوحات" | "تاريخ";
  era: string;
  summary: string;
  full_content: string;
  key_lessons: string[];
  related_figures: string[];
  sources: string[];
  tags: string[];
  icon: string;
  is_approved: boolean;
}

const ERA_LABELS: Era[] = ["الكل", "نبوي", "راشدي", "أموي", "عباسي", "عثماني", "حديث"];
const CATEGORY_LABELS: Category[] = ["الكل", "صحابة", "فتوحات", "تاريخ"];

// ─────────────────── Story Card ───────────────────────────────────────────────
function StoryCard({ story, onSelect }: { story: IslamicStory; onSelect: () => void }) {
  return (
    <div
      className={`isp-card isp-card--${story.category === "صحابة" ? "companions" : story.category === "فتوحات" ? "conquests" : "history"}`}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      tabIndex={0}
      role="button"
      aria-label={`اقرأ قصة: ${story.title}`}
    >
      <div className="isp-card__head">
        <span className="isp-card__icon"><StoryIconEl name={story.icon} /></span>
        <div className="isp-card__meta-badges">
          <span className="isp-badge isp-badge--cat">{story.category}</span>
          <span className="isp-badge isp-badge--era">{story.era}</span>
        </div>
      </div>

      <div className="isp-card__divider" aria-hidden="true">
        <AdminQuickEdit section="islamic-stories" />
      </div>

      <h3 className="isp-card__title">{story.title}</h3>
      <p className="isp-card__summary">{truncateAtWord(story.summary, 120)}</p>

      <div className="isp-card__tags">
        {story.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="isp-tag">#{tag}</span>
        ))}
      </div>

      <span className="isp-card__cta">اقرأ القصة ←</span>
    </div>
  );
}

// ─────────────────── Story Detail ────────────────────────────────────────────
function StoryDetail({ story, onBack }: { story: IslamicStory; onBack: () => void }) {
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [story.slug]);

  return (
    <div className="isp-detail">
      <button type="button" className="isp-detail__back" onClick={onBack}>
        ← العودة إلى القصص
      </button>

      <div className="isp-detail__hero">
        <div className="isp-detail__badges">
          <span className="isp-badge isp-badge--cat">{story.category}</span>
          <span className="isp-badge isp-badge--era">{story.era}</span>
        </div>
        <div className="isp-detail__icon"><StoryIconEl name={story.icon} /></div>
        <h1 className="isp-detail__title">{story.title}</h1>
        <p className="isp-detail__summary">{story.summary}</p>
      </div>

      <section className="isp-detail__section isp-detail__section--content">
        <h2 className="isp-detail__section-title"><BookOpen size={18} strokeWidth={1.8} aria-hidden="true" /> تفاصيل القصة</h2>
        <div className="isp-detail__body">{story.full_content}</div>
      </section>

      {story.key_lessons.length > 0 && (
        <section className="isp-detail__section isp-detail__section--lessons">
          <h2 className="isp-detail__section-title isp-detail__section-title--green"><Lightbulb size={18} strokeWidth={1.8} aria-hidden="true" /> الدروس المستفادة</h2>
          <ul className="isp-lessons-list">
            {story.key_lessons.map((lesson, i) => (
              <li key={i} className="isp-lessons-list__item">
                <span className="isp-lessons-list__star">✦</span>
                <span>{lesson}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="isp-detail__grid">
        {story.related_figures.length > 0 && (
          <section className="isp-detail__section isp-detail__section--figures">
            <h2 className="isp-detail__section-title isp-detail__section-title--purple"><Users size={18} strokeWidth={1.8} aria-hidden="true" /> الشخصيات</h2>
            <div className="isp-detail__list">
              {story.related_figures.map((fig, i) => (
                <span key={i} className="isp-detail__list-item">• {fig}</span>
              ))}
            </div>
          </section>
        )}

        {story.sources.length > 0 && (
          <section className="isp-detail__section isp-detail__section--sources">
            <h2 className="isp-detail__section-title isp-detail__section-title--gold"><BookOpen size={18} strokeWidth={1.8} aria-hidden="true" /> المصادر</h2>
            <div className="isp-detail__list">
              {story.sources.map((src, i) => (
                <span key={i} className="isp-detail__list-item">• {src}</span>
              ))}
            </div>
          </section>
        )}
      </div>

      {story.tags.length > 0 && (
        <div className="isp-detail__tags">
          {story.tags.map((tag) => (
            <span key={tag} className="isp-tag isp-tag--large">#{tag}</span>
          ))}
        </div>
      )}
      <div className="isp-detail__share">
        <ShareButtons title={story.title} url={`https://www.majlisilm.com/stories?slug=${encodeURIComponent(story.slug)}`} />
      </div>
    </div>
  );
}

// ─────────────────── Main Page ───────────────────────────────────────────────
export default function IslamicStoriesPage() {
  useReadingScrollMemory("stories");
  const [stories, setStories] = useState<IslamicStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("الكل");
  const [era, setEra] = useState<Era>("الكل");
  const [search, setSearch] = useState("");

  const syncSlugToUrl = useCallback((slug: string | null) => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("slug", slug);
    else url.searchParams.delete("slug");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", next);
  }, []);

  const openStory = useCallback((slug: string) => {
    setSelectedSlug(slug);
    syncSlugToUrl(slug);
  }, [syncSlugToUrl]);

  const closeStory = useCallback(() => {
    setSelectedSlug(null);
    syncSlugToUrl(null);
  }, [syncSlugToUrl]);

  // رابط `?cat=...` و`?slug=...` للمشاركة العميقة
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    const slug = params.get("slug");
    const valid: Category[] = ["الكل", "صحابة", "فتوحات", "تاريخ"];
    if (cat && (valid as string[]).includes(cat)) setCategory(cat as Category);
    if (slug) setSelectedSlug(slug);
  }, []);

  useEffect(() => {
    applyPageSeo({
      path: "/stories",
      title: "قصص الصحابة والفتوحات الإسلامية | المجلس العلمي",
      description: "قصص الصحابة الكرام والفتوحات الإسلامية والأحداث التاريخية، من الهجرة النبوية إلى فتح مكة وما بعدها من عصور الإسلام. يُعرض للتعلّم والاطلاع. ",
      keywords: ["قصص إسلامية", "الصحابة", "الفتوحات الإسلامية", "التاريخ الإسلامي", "السيرة"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أقسام القصص الإسلامية",
          description: "قصص الصحابة والفتوحات والتاريخ الإسلامي عبر العصور؛ يُعرض للتعلّم والاطلاع. في المجلس العلمي",
          itemListElement: CATEGORY_LABELS.filter(c => c !== "الكل").map((cat, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: cat,
            url: `https://www.majlisilm.com/stories?cat=${encodeURIComponent(cat)}`,
          })),
        },
      ],
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const applySeed = async () => {
      const seed = (await loadIslamicStoriesSeed()) as unknown as IslamicStory[];
      if (!cancelled) setStories(seed);
    };

    if (!isSupabaseConfigured()) {
      void applySeed().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    Promise.resolve(
      supabase
        .from("islamic_stories")
        .select(
          "id, slug, title, category, era, icon, summary, full_content, key_lessons, related_figures, sources, tags, is_approved",
        )
        .eq("is_approved", true)
        .order("category")
        .order("era"),
    )
      .then(async ({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError("تعذّر تحميل القصص.");
          await applySeed();
        } else {
          const rows = (data || []) as IslamicStory[];
          if (rows.length > 0) setStories(rows);
          else await applySeed();
        }
      })
      .catch(async () => {
        if (cancelled) return;
        setError("تعذّر تحميل القصص.");
        await applySeed();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = stories.filter((s) => {
    if (category !== "الكل" && s.category !== category) return false;
    if (era !== "الكل" && s.era !== era) return false;
    if (search.trim()) {
      return arabicMatchAny([s.title, s.summary, ...s.tags], search);
    }
    return true;
  });

  const selectedStory = selectedSlug ? stories.find((s) => s.slug === selectedSlug) : null;

  const counts = {
    صحابة: stories.filter((s) => s.category === "صحابة").length,
    فتوحات: stories.filter((s) => s.category === "فتوحات").length,
    تاريخ: stories.filter((s) => s.category === "تاريخ").length,
  };

  if (selectedStory) {
    return (
      <div className="page-shell narrow isp-page">
        <StoryDetail story={selectedStory} onBack={closeStory} />
        <ExploreAlsoNav
          title="استكشف أيضًا"
          links={[
            { href: "/quran/surah-stories", label: "قصص سور القرآن" },
            { href: "/nations", label: "الأمم السابقة" },
            { href: "/seerah", label: "السيرة النبوية" },
            { href: "/learning/paths", label: "مسارات التعلم" },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="page-shell narrow isp-page">
      <PageHeader
        eyebrow="التاريخ الإسلامي"
        title="القصص الإسلامية"
        subtitle="صحابة الكرام · الفتوحات الإسلامية · التاريخ الحضاري"
      />

      {/* إحصائيات التصنيفات */}
      {!loading && stories.length > 0 && (
        <div className="isp-stats-row">
          {(["صحابة", "فتوحات", "تاريخ"] as const).map((cat) => (
            <div key={cat} className={`isp-stat-chip isp-stat-chip--${cat === "صحابة" ? "companions" : cat === "فتوحات" ? "conquests" : "history"}`}>
              {cat} · {counts[cat]}
            </div>
          ))}
        </div>
      )}

      {/* البحث والفلاتر */}
      {!loading && (
        <div className="isp-controls">
          <input
            className="isp-search"
            aria-label="ابحث في القصص…" placeholder="ابحث في القصص…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="isp-filter-group">
            <span className="isp-filter-label">التصنيف</span>
            <div className="isp-filter-chips" role="group" aria-label="تصفية التصنيف">
              {CATEGORY_LABELS.map((cat) => (
                <Chip key={cat} active={category === cat} className="isp-chip" onClick={() => setCategory(cat)}>
                  {cat}
                </Chip>
              ))}
            </div>
          </div>

          <div className="isp-filter-group">
            <span className="isp-filter-label">الحقبة الزمنية</span>
            <div className="isp-filter-chips" role="group" aria-label="تصفية الحقبة">
              {ERA_LABELS.map((e) => (
                <Chip key={e} active={era === e} className="isp-chip" onClick={() => setEra(e)}>
                  {e}
                </Chip>
              ))}
            </div>
          </div>

          <p className="isp-result-count" aria-live="polite" aria-atomic="true">
            {filtered.length} قصة
            {search && `، نتائج البحث عن "${search}"`}
          </p>
        </div>
      )}

      {/* المحتوى */}
      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : error ? (
        <div className="isp-error">
          <span className="isp-error__icon"><AlertTriangle size={20} strokeWidth={1.5} /></span>
          <span>{error}</span>
        </div>
      ) : stories.length === 0 ? (
        <Empty title="لا توجد قصص معتمدة بعد" text="يمكن اعتماد القصص من لوحة التحكم." />
      ) : filtered.length === 0 ? (
        <Empty text="لا توجد نتائج للبحث أو الفلتر المحدد." />
      ) : (
        <div className="isp-grid">
          {filtered.map((story) => (
            <StoryCard
              key={story.slug}
              story={story}
              onSelect={() => openStory(story.slug)}
            />
          ))}
        </div>
      )}

      {!loading && (
        <>
          <RelatedKnowledge kind="story" title="قصص ومعارف ذات صلة" limit={6} />
          <ExploreAlsoNav
            title="استكشف أيضًا"
            links={[
              { href: "/quran/surah-stories", label: "قصص سور القرآن" },
              { href: "/nations", label: "الأمم السابقة" },
              { href: "/seerah", label: "السيرة النبوية" },
              { href: "/learning/paths", label: "مسارات التعلم" },
            ]}
          />
          <SectionQuiz
            categoryId={["tarikh", "sira", "akhlaq"]}
            title="اختبر معلوماتك في التاريخ الإسلامي"
            count={4}
          />
        </>
      )}
    </div>
  );
}
