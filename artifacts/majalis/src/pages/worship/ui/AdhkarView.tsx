import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Leaf, X } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { navigateTo } from "@/lib/navigation-intent";
import { ADHKAR_CATEGORIES, FEATURED_ADHKAR_SLUGS, type AdhkarItem } from "@/lib/adhkar-seed";
import { usePublishedAdhkarItems } from "@/lib/adhkar-service";
import { PageHeader, Empty } from "@/components/ui-common";
import { PageShell } from "@/components/layout/PageShell";
import { ShareButton } from "@/components/ShareButton";
import { IsnadAttributionBar } from "@/components/IsnadAttributionBar";
import { adhkarCatRedirectPath, hrefAdhkar, resolveAdhkarCategory } from "@/lib/content-href";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { useReadingScrollMemory } from "@/hooks/useReadingScrollMemory";
import { haptics } from "@/lib/haptics";
import { markMorningAdhkarDone } from "@/lib/local-milestones";
import { recordUserActivity } from "@/lib/user-streak";
import "@/styles/pages/adhkar.css";
import "@/styles/components/thumb-zone.css";

const FEATURED_CATEGORIES = ADHKAR_CATEGORIES.filter((c) =>
  FEATURED_ADHKAR_SLUGS.has(c.slug),
);

function toAr(n: number): string {
  return n.toLocaleString("ar-EG", { useGrouping: false });
}

/* ── حلقة SVG للتقدم الدائري ── */
function RingProgress({ pct, size = 120 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="adhkar-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--majalis-emerald-muted, rgba(23,61,53,0.12))" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--majalis-emerald, var(--mj-brand-deep))" strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="adhkar-ring-fill"
      />
    </svg>
  );
}

/* ── تفاصيل الذكر (bottom sheet) ── */
function DhikrSheet({ item, onClose }: { item: AdhkarItem; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
    // مساران بديلان كاملان بلوحة المفاتيح.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      className="adhkar-sheet-overlay"
      role="dialog" aria-modal="true" aria-label="تفاصيل الذكر"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="adhkar-sheet">
        <div className="adhkar-sheet-handle" aria-hidden="true" />
        <button type="button" className="adhkar-sheet-close" onClick={onClose} aria-label="إغلاق"><X size={18} strokeWidth={1.8} aria-hidden="true" /></button>
        <h2 className="adhkar-sheet-title">تفاصيل الذكر</h2>
        <div className="adhkar-sheet-text">{item.text}</div>
        <dl className="adhkar-sheet-details">
          <div className="adhkar-sheet-row"><dt>عدد المرات</dt><dd>{toAr(item.count)} مرة</dd></div>
        </dl>
        <IsnadAttributionBar
          data={{
            source: item.source,
            grade: item.grade,
            narrator: item.narrator,
            reference: item.reference,
            needsReview: !item.source || !item.grade,
            reportContentType: "adhkar",
            reportContentId: item.id,
          }}
        />
        <ShareButton
          title="ذكر"
          text={`${item.text}${item.source ? `\n— ${item.source}` : ""}`}
          size="sm"
          className="adhkar-sheet-share"
        />
        <button type="button" className="adhkar-sheet-dismiss" onClick={onClose}>إغلاق</button>
      </div>
    </div>
  );
}

/* ── مساعدات localStorage للتقدم عبر الجلسات ── */
function ssKey(cat: string) { return `adhkar_progress_${cat}`; }
function ssGet(cat: string): { currentIndex: number; tapCount: number } | null {
  try {
    const raw = localStorage.getItem(ssKey(cat)) ?? sessionStorage.getItem(ssKey(cat));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function ssSave(cat: string, currentIndex: number, tapCount: number) {
  try {
    const payload = JSON.stringify({ currentIndex, tapCount });
    localStorage.setItem(ssKey(cat), payload);
    sessionStorage.removeItem(ssKey(cat));
    void import("@/lib/native-storage").then(({ setAdhkarProgress }) => {
      setAdhkarProgress(ssKey(cat), payload);
    });
  } catch { /* */ }
}

/* ── اهتزاز عبر الكتالوج الموحّد ── */
function hapticsLight() {
  haptics.light();
}
function hapticsComplete() {
  haptics.success();
}

/* ══ الصفحة الرئيسية ══ */
export default function AdhkarPage() {
  useReadingScrollMemory("adhkar");
  const [location] = useLocation();
  const routeParams = useParams<{ slug?: string }>();
  const [category, setCategory]       = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSheet, setShowSheet]     = useState(false);
  const [animKey, setAnimKey]         = useState(0);
  const [tapCount, setTapCount]       = useState(0);
  const [done, setDone]               = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: publishedItems = [], isLoading, isError } = usePublishedAdhkarItems();

  useEffect(() => {
    const active = resolveAdhkarCategory(routeParams.slug);
    const path = active ? hrefAdhkar(active.slug) : "/adhkar";
    applyPageSeo({
      path,
      canonicalPath: path,
      title: active
        ? `${active.name} | الأذكار | المجلس العلمي`
        : "الأذكار والأدعية الإسلامية | المجلس العلمي",
      description: active
        ? `${active.description.slice(0, 140)}… مع بيان المصدر والدرجة قدر الإمكان.`
        : "أذكار وأدعية مأثورة مع بيان المصدر والدرجة قدر الإمكان؛ ما لم يكتمل توثيقه يُعرض بوسم قيد المراجعة.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أقسام الأذكار الإسلامية",
          description: "أذكار الصباح والمساء والصلاة والسفر والنوم وسائر المناسبات؛ محتوى معتمد في منهج المجلس العلمي",
          numberOfItems: ADHKAR_CATEGORIES.length,
          itemListElement: ADHKAR_CATEGORIES.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            url: `https://majlisilm.com${hrefAdhkar(c.slug)}`,
          })),
        },
      ],
    });
  }, [routeParams.slug]);

  /* ?cat= → /adhkar/:slug (استبدال دائم في العميل؛ Vercel يكمّل 301 للزحف) */
  useEffect(() => {
    const target = adhkarCatRedirectPath(window.location.search);
    if (target) navigateTo(target, { mode: "state" });
  }, [location]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cat")) return;
    const match = resolveAdhkarCategory(routeParams.slug);
    if (match) {
      if (category !== match.id) {
        setCategory(match.id);
        setCurrentIndex(0);
        setAnimKey((k) => k + 1);
        setTapCount(0);
        setDone(false);
      }
      return;
    }
    if (!routeParams.slug && category !== "all") {
      setCategory("all");
      setCurrentIndex(0);
    }
  }, [routeParams.slug, location, category]);

  const items = useMemo(() => {
    if (category === "all") return publishedItems;
    return publishedItems.filter((i) => i.categoryId === category);
  }, [category, publishedItems]);

  const current = items[currentIndex] ?? null;
  const total   = items.length;

  const resetCounter = () => { setTapCount(0); setDone(false); };

  function changeCategory(catId: string) {
    setCategory(catId);
    setCurrentIndex(0);
    setAnimKey((k) => k + 1);
    resetCounter();
    if (catId === "all") navigateTo("/adhkar", { mode: "state" });
    else {
      const match = ADHKAR_CATEGORIES.find((c) => c.id === catId);
      if (match) navigateTo(hrefAdhkar(match.slug), { mode: "state" });
    }
  }

  const goNext = useCallback(() => {
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null; }
    setCurrentIndex((i) => Math.min(i + 1, items.length - 1));
    setAnimKey((k) => k + 1);
    resetCounter();
  }, [items.length]);

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setAnimKey((k) => k + 1);
      resetCounter();
    }
  }

  /* ── حفظ التقدم في sessionStorage عند كل تغيير ── */
  useEffect(() => {
    ssSave(category, currentIndex, tapCount);
  }, [category, currentIndex, tapCount]);

  /* ── استعادة التقدم عند تغيير الفئة ── */
  useEffect(() => {
    const saved = ssGet(category);
    if (saved) {
      setCurrentIndex(Math.max(0, saved.currentIndex));
      setTapCount(Math.max(0, saved.tapCount));
    }
  }, [category]);

  /* ── النقر للعدّ ── */
  const handleTap = useCallback(() => {
    if (!current || done) return;
    const target = current.count || 1;

    hapticsLight();

    setTapCount((c) => {
      const next = c + 1;
      if (next >= target) {
        setDone(true);
        hapticsComplete();
        /* انتقال تلقائي بعد 700ms */
        advanceTimer.current = setTimeout(() => {
          setCurrentIndex((i) => {
            const ni = i + 1;
            if (ni < items.length) {
              setAnimKey((k) => k + 1);
              setTapCount(0);
              setDone(false);
              return ni;
            }
            // أكمل القسم — أذكار الصباح تغذي شارة التتابع
            if (category === "adh-morning") {
              markMorningAdhkarDone();
              try {
                recordUserActivity();
              } catch {
                /* ignore */
              }
            }
            return i;
          });
        }, 700);
      }
      return next;
    });
  }, [current, done, items.length, category]);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const activeCategory = ADHKAR_CATEGORIES.find((c) => c.id === category);
  const target  = current?.count || 1;
  const ringPct = Math.min(tapCount / target, 1);
  const isLast  = currentIndex === total - 1;

  return (
    <PageShell variant="narrow" className="content-hub-page adhkar-page adhkar-page--focus">
      <PageHeader
        eyebrow="العبادة اليومية"
        title="الأذكار"
        subtitle="أذكار الصباح والمساء والنوم وبعد الصلاة من القرآن والسنة — مع العدّ والحفظ والمشاركة."
      />

      {/* شريط التصنيفات */}
      <div className="content-hub-chips adhkar-chips" role="tablist" aria-label="تصفية الأذكار">
        <button
          role="tab"
          type="button"
          className={`content-hub-chip${category === "all" ? " content-hub-chip--active" : ""}`}
          onClick={() => changeCategory("all")}
          aria-selected={category === "all"}
        >الكل</button>
        {FEATURED_CATEGORIES.map((cat) => (
          <button
            key={cat.id} role="tab" type="button"
            className={`content-hub-chip${category === cat.id ? " content-hub-chip--active" : ""}`}
            onClick={() => changeCategory(cat.id)}
            aria-selected={category === cat.id}
          >{cat.name}</button>
        ))}
      </div>

      {activeCategory && category !== "all" && (
        <p className="adhkar-category-desc">{activeCategory.description}</p>
      )}

      {/* منطقة الذكر */}
      {isLoading ? (
        <p className="adhkar-loading-hint">جاري تحميل الأذكار…</p>
      ) : isError ? (
        <Empty text="تعذّر تحميل الأذكار." />
      ) : total === 0 ? (
        <Empty text="لا توجد أذكار في هذا القسم." />
      ) : current ? (
        <div className="adhkar-focus-shell">
          {/* عداد الأذكار — سياق واضح: الذكر ن من م */}
          <p className="adhkar-focus-counter" aria-live="polite">
            الذكر {toAr(currentIndex + 1)} من {toAr(total)}
          </p>

          {/* نص الذكر */}
          <div key={animKey} className="adhkar-focus-card adhkar-anim-fade">
            <p className="adhkar-focus-text" lang="ar" dir="rtl">{current.text}</p>
          </div>

          {/* زر النقر للعدّ (التسبيح) — المنطقة بارتفاع ثابت لإبقاء الأزرار في مكانها */}
          <div className="adhkar-tapper-zone">
            {target > 1 ? (
              <div className="adhkar-tapper-wrap">
                <button
                  type="button"
                  className={`adhkar-tapper${done ? " adhkar-tapper--done" : ""}`}
                  onClick={handleTap}
                  aria-label={done ? "اكتمل الذكر" : `اضغط للعدّ، ${toAr(tapCount)} من ${toAr(target)}`}
                >
                  <RingProgress pct={ringPct} />
                  <div className="adhkar-tapper__inner">
                    {done ? (
                      <span className="adhkar-tapper__check" aria-hidden="true">✓</span>
                    ) : (
                      <>
                        <span className="adhkar-tapper__cur">{toAr(tapCount)}</span>
                        <span className="adhkar-tapper__sep">/</span>
                        <span className="adhkar-tapper__tot">{toAr(target)}</span>
                      </>
                    )}
                  </div>
                </button>
                {done && (
                  <button
                    type="button"
                    className="adhkar-focus-btn adhkar-focus-btn--reset"
                    onClick={() => {
                      resetCounter();
                      ssSave(category, currentIndex, 0);
                    }}
                  >
                    إعادة ضبط
                  </button>
                )}
                {!done && (
                  <p className="adhkar-tapper__hint">اضغط للعدّ</p>
                )}
                {done && isLast && (
                  <p className="adhkar-tapper__complete"><Leaf size={15} strokeWidth={1.8} aria-hidden="true" /> أكملت جميع الأذكار</p>
                )}
              </div>
            ) : (
              /* ذكر مرة واحدة — زر تم واضح */
              <div className="adhkar-once">
                <button
                  type="button"
                  className={`adhkar-focus-btn adhkar-focus-btn--done${done ? " is-done" : ""}`}
                  onClick={() => {
                    if (done) {
                      resetCounter();
                      ssSave(category, currentIndex, 0);
                      return;
                    }
                    setDone(true);
                    setTapCount(1);
                    hapticsComplete();
                  }}
                >
                  {done ? "أُنجز — إعادة ضبط" : "تم"}
                </button>
              </div>
            )}
          </div>

          {/* أزرار التنقل */}
          <div className="adhkar-focus-nav">
            <button
              type="button"
              className="adhkar-focus-btn adhkar-focus-btn--prev"
              onClick={goPrev}
              disabled={currentIndex === 0}
              aria-label="الذكر السابق"
            >← السابق</button>

            <button
              type="button"
              className="adhkar-focus-btn adhkar-focus-btn--details"
              onClick={() => setShowSheet(true)}
              aria-label="عرض تفاصيل الذكر"
            >التفاصيل</button>

            <button
              type="button"
              className="adhkar-focus-btn adhkar-focus-btn--next"
              onClick={goNext}
              disabled={currentIndex === total - 1}
              aria-label="الذكر التالي"
            >التالي →</button>
          </div>

          <div className="adhkar-focus-nav adhkar-focus-nav--reset">
            <button
              type="button"
              className="adhkar-focus-btn adhkar-focus-btn--ghost"
              onClick={() => {
                setCurrentIndex(0);
                resetCounter();
                ssSave(category, 0, 0);
              }}
            >
              إعادة ضبط التقدّم
            </button>
          </div>

          {/* شريط تقدم الأذكار */}
          <div className="adhkar-focus-progress" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={total}>
            <div
              className="adhkar-focus-progress-fill adhkar-prog-fill"
              style={{ "--adhkar-pct": `${((currentIndex + 1) / total) * 100}%` } as React.CSSProperties}
            />
          </div>
        </div>
      ) : null}

      {showSheet && current && (
        <DhikrSheet item={current} onClose={() => setShowSheet(false)} />
      )}
      <div className="px-4 pb-6 mt-4 adhkar-page-footer">
        <ExploreAlsoNav
          title="استكشف أيضًا"
          links={[
            { href: "/duas", label: "الأدعية الشرعية" },
            { href: "/daily-wird", label: "الورد اليومي" },
            { href: "/hadith", label: "الحديث وعلومه" },
            { href: "/mushaf", label: "المصحف" },
          ]}
        />
        <SectionQuiz sectionId="adhkar" title="اختبر معلوماتك في الأخلاق والآداب" count={4} />
      </div>
    </PageShell>
  );
}
