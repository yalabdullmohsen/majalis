import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Leaf, X } from "lucide-react";
import { useLocation } from "wouter";
import { ADHKAR_CATEGORIES, type AdhkarItem } from "@/lib/adhkar-seed";
import { usePublishedAdhkarItems } from "@/lib/adhkar-service";
import { PageHeader, Empty } from "@/components/ui-common";
import { ShareButton } from "@/components/ShareButton";
import { applyPageSeo } from "@/lib/seo";

const FEATURED_CATEGORY_SLUGS = new Set([
  "morning", "evening", "sleep", "wakeup", "home-in", "home-out",
  "mosque", "wudu", "salah", "after-salah", "travel", "food",
  "rain", "wind", "distress", "istikharah", "istighfar", "misc",
]);

const FEATURED_CATEGORIES = ADHKAR_CATEGORIES.filter((c) =>
  FEATURED_CATEGORY_SLUGS.has(c.slug),
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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--majalis-emerald-muted, rgba(14,110,82,0.12))" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--majalis-emerald, #0E6E52)" strokeWidth="6"
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
          {item.narrator && <div className="adhkar-sheet-row"><dt>الراوي</dt><dd>{item.narrator}</dd></div>}
          {item.source && <div className="adhkar-sheet-row"><dt>المصدر</dt><dd>{item.source}</dd></div>}
          {item.grade && (
            <div className="adhkar-sheet-row">
              <dt>الدرجة</dt>
              <dd>
                <span className={`adhkar-grade adhkar-grade--${item.grade === "صحيح" ? "sahih" : item.grade === "حسن" ? "hasan" : "other"}`}>
                  {item.grade}
                </span>
              </dd>
            </div>
          )}
          {item.reference && <div className="adhkar-sheet-row"><dt>المرجع</dt><dd>{item.reference}</dd></div>}
        </dl>
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

/* ══ الصفحة الرئيسية ══ */
export default function AdhkarPage() {
  const [location] = useLocation();
  const [category, setCategory]       = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSheet, setShowSheet]     = useState(false);
  const [animKey, setAnimKey]         = useState(0);
  const [tapCount, setTapCount]       = useState(0);
  const [done, setDone]               = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: publishedItems = [], isLoading, isError } = usePublishedAdhkarItems();

  useEffect(() => {
    applyPageSeo({
      path: "/adhkar",
      title: "الأذكار والأدعية الإسلامية | المجلس العلمي",
      description: "أذكار الصباح والمساء وما بعد الصلاة وسائر الأذكار المأثورة — مع التسبيح التفاعلي وعداد الذكر.",
      keywords: ["أذكار", "أدعية", "أذكار الصباح", "أذكار المساء", "ذكر الله", "أذكار إسلامية"],
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat) {
      const match = ADHKAR_CATEGORIES.find((c) => c.slug === cat || c.id === cat);
      if (match) { setCategory(match.id); setCurrentIndex(0); }
    }
  }, [location]);

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

  /* ── النقر للعدّ ── */
  const handleTap = useCallback(() => {
    if (!current || done) return;
    const target = current.count || 1;

    /* اهتزاز خفيف */
    try { if (navigator.vibrate) navigator.vibrate(18); } catch { /* */ }

    setTapCount((c) => {
      const next = c + 1;
      if (next >= target) {
        setDone(true);
        try { if (navigator.vibrate) navigator.vibrate([30, 60, 30]); } catch { /* */ }
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
            return i;
          });
        }, 700);
      }
      return next;
    });
  }, [current, done, items.length]);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const activeCategory = ADHKAR_CATEGORIES.find((c) => c.id === category);
  const target  = current?.count || 1;
  const ringPct = Math.min(tapCount / target, 1);
  const isLast  = currentIndex === total - 1;

  return (
    <div className="page-shell narrow content-hub-page adhkar-page adhkar-page--focus">
      <PageHeader
        eyebrow="العبادة اليومية"
        title="الأذكار"
        subtitle="قراءة ذكر واحد بتركيز كامل، من القرآن والسنة الصحيحة."
      />

      {/* شريط التصنيفات */}
      <div className="content-hub-chips adhkar-chips">
        <button
          type="button"
          className={`content-hub-chip${category === "all" ? " content-hub-chip--active" : ""}`}
          onClick={() => changeCategory("all")}
        >الكل</button>
        {FEATURED_CATEGORIES.map((cat) => (
          <button
            key={cat.id} type="button"
            className={`content-hub-chip${category === cat.id ? " content-hub-chip--active" : ""}`}
            onClick={() => changeCategory(cat.id)}
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
        <Empty text="تعذّر تحميل الأذكار من قاعدة البيانات." />
      ) : total === 0 ? (
        <Empty text="لا توجد أذكار في هذا القسم." />
      ) : current ? (
        <div className="adhkar-focus-shell">
          {/* عداد الأذكار */}
          <p className="adhkar-focus-counter" aria-live="polite">
            {toAr(currentIndex + 1)} / {toAr(total)}
          </p>

          {/* نص الذكر */}
          <div key={animKey} className="adhkar-focus-card adhkar-anim-fade">
            <p className="adhkar-focus-text" lang="ar" dir="rtl">{current.text}</p>
          </div>

          {/* زر النقر للعدّ (التسبيح) */}
          {target > 1 ? (
            <div className="adhkar-tapper-wrap">
              <button
                type="button"
                className={`adhkar-tapper${done ? " adhkar-tapper--done" : ""}`}
                onClick={handleTap}
                aria-label={done ? "اكتمل الذكر" : `اضغط للعدّ — ${toAr(tapCount)} من ${toAr(target)}`}
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
              {!done && (
                <p className="adhkar-tapper__hint">اضغط للعدّ</p>
              )}
              {done && isLast && (
                <p className="adhkar-tapper__complete"><Leaf size={15} strokeWidth={1.8} aria-hidden="true" /> أكملت جميع الأذكار</p>
              )}
            </div>
          ) : (
            /* ذكر مرة واحدة — لا داعي للعداد */
            <p className="adhkar-focus-count">مرة واحدة</p>
          )}

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
    </div>
  );
}
