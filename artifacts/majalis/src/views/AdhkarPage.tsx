import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ADHKAR_CATEGORIES, type AdhkarItem } from "@/lib/adhkar-seed";
import { usePublishedAdhkarItems } from "@/lib/adhkar-service";
import { PageHeader, Empty } from "@/components/ui-common";

const FEATURED_CATEGORY_SLUGS = new Set([
  "morning", "evening", "sleep", "wakeup", "home-in", "home-out",
  "mosque", "wudu", "salah", "after-salah", "travel", "food",
  "rain", "wind", "distress", "istikharah", "istighfar", "misc",
]);

const FEATURED_CATEGORIES = ADHKAR_CATEGORIES.filter((c) =>
  FEATURED_CATEGORY_SLUGS.has(c.slug),
);

function toArabicNumeral(n: number): string {
  return n.toLocaleString("ar-EG", { useGrouping: false });
}

function DhikrBottomSheet({
  item,
  onClose,
}: {
  item: AdhkarItem;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="adhkar-sheet-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="تفاصيل الذكر"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={ref} className="adhkar-sheet">
        <div className="adhkar-sheet-handle" aria-hidden="true" />
        <button
          type="button"
          className="adhkar-sheet-close"
          onClick={onClose}
          aria-label="إغلاق"
        >
          ✕
        </button>
        <h2 className="adhkar-sheet-title">تفاصيل الذكر</h2>

        <div className="adhkar-sheet-text">{item.text}</div>

        <dl className="adhkar-sheet-details">
          <div className="adhkar-sheet-row">
            <dt>عدد المرات</dt>
            <dd>{toArabicNumeral(item.count)} مرة</dd>
          </div>
          {item.narrator && (
            <div className="adhkar-sheet-row">
              <dt>الراوي</dt>
              <dd>{item.narrator}</dd>
            </div>
          )}
          {item.source && (
            <div className="adhkar-sheet-row">
              <dt>المصدر</dt>
              <dd>{item.source}</dd>
            </div>
          )}
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
          {item.reference && (
            <div className="adhkar-sheet-row">
              <dt>المرجع</dt>
              <dd>{item.reference}</dd>
            </div>
          )}
        </dl>

        <button type="button" className="adhkar-sheet-dismiss" onClick={onClose}>
          إغلاق
        </button>
      </div>
    </div>
  );
}

export default function AdhkarPage() {
  const [location] = useLocation();
  const [category, setCategory] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSheet, setShowSheet] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const { data: publishedItems = [], isLoading, isError } = usePublishedAdhkarItems();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat) {
      const match = ADHKAR_CATEGORIES.find((c) => c.slug === cat || c.id === cat);
      if (match) {
        setCategory(match.id);
        setCurrentIndex(0);
      }
    }
  }, [location]);

  const items = useMemo(() => {
    if (category === "all") return publishedItems;
    return publishedItems.filter((i) => i.categoryId === category);
  }, [category, publishedItems]);

  const current = items[currentIndex] ?? null;
  const total = items.length;

  function changeCategory(catId: string) {
    setCategory(catId);
    setCurrentIndex(0);
    setAnimKey((k) => k + 1);
  }

  function goNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setAnimKey((k) => k + 1);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setAnimKey((k) => k + 1);
    }
  }

  const activeCategory = ADHKAR_CATEGORIES.find((c) => c.id === category);

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
        >
          الكل
        </button>
        {FEATURED_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`content-hub-chip${category === cat.id ? " content-hub-chip--active" : ""}`}
            onClick={() => changeCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {activeCategory && category !== "all" && (
        <p className="adhkar-category-desc">{activeCategory.description}</p>
      )}

      {/* منطقة الذكر الرئيسية */}
      {isLoading ? (
        <p className="adhkar-loading-hint">جاري تحميل الأذكار…</p>
      ) : isError ? (
        <Empty text="تعذّر تحميل الأذكار من قاعدة البيانات." />
      ) : total === 0 ? (
        <Empty text="لا توجد أذكار في هذا القسم." />
      ) : current ? (
        <div className="adhkar-focus-shell">
          {/* عداد */}
          <p className="adhkar-focus-counter" aria-live="polite">
            {toArabicNumeral(currentIndex + 1)} / {toArabicNumeral(total)}
          </p>

          {/* نص الذكر */}
          <div key={animKey} className="adhkar-focus-card adhkar-anim-fade">
            <p className="adhkar-focus-text" lang="ar" dir="rtl">
              {current.text}
            </p>

            {current.count > 1 && (
              <p className="adhkar-focus-count">
                {toArabicNumeral(current.count)} مرة
              </p>
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
            >
              ← السابق
            </button>

            <button
              type="button"
              className="adhkar-focus-btn adhkar-focus-btn--details"
              onClick={() => setShowSheet(true)}
              aria-label="عرض تفاصيل الذكر"
            >
              التفاصيل
            </button>

            <button
              type="button"
              className="adhkar-focus-btn adhkar-focus-btn--next"
              onClick={goNext}
              disabled={currentIndex === total - 1}
              aria-label="الذكر التالي"
            >
              التالي →
            </button>
          </div>

          {/* شريط التقدم */}
          <div className="adhkar-focus-progress" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={total}>
            <div
              className="adhkar-focus-progress-fill"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Bottom Sheet للتفاصيل */}
      {showSheet && current && (
        <DhikrBottomSheet item={current} onClose={() => setShowSheet(false)} />
      )}
    </div>
  );
}
