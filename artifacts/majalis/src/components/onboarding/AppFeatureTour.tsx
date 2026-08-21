import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  GraduationCap,
  Library,
  MoonStar,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { markFeatureTourCompleted } from "@/lib/feature-tour-state";
import "@/styles/components/feature-tour.css";

export type FeatureTourSlide = {
  id: string;
  title: string;
  body: string;
  hint: string;
  Icon: LucideIcon;
};

/** سبعة أماكن حقيقية في التطبيق — عنوان ≤ ٤ كلمات، وصف سطران كحدّ أقصى. */
export const FEATURE_TOUR_SLIDES: FeatureTourSlide[] = [
  {
    id: "mushaf",
    title: "المصحف والتلاوة",
    body: "قراءة بمصحف المدينة، تلاوة بالآية، تفسير، وتنزيل للاستماع بلا إنترنت.",
    hint: "من تبويب مركز القرآن",
    Icon: BookOpen,
  },
  {
    id: "prayer",
    title: "الصلاة والمواقيت",
    body: "مواقيت دقيقة، إمساكية، اتجاه القبلة، وتنبيهات الأذان لكل صلاة.",
    hint: "من تبويب الصلاة",
    Icon: MoonStar,
  },
  {
    id: "adhkar",
    title: "الأذكار والأدعية",
    body: "أذكار الصباح والمساء والنوم مع الاستماع وعداد التسبيح.",
    hint: "من تبويب الأذكار",
    Icon: Sparkles,
  },
  {
    id: "lessons",
    title: "الدروس والحلقات",
    body: "دروس قريبة، تقويم علمي، أرشيف، وحلقات تحفيظ.",
    hint: "من تبويب الدروس",
    Icon: GraduationCap,
  },
  {
    id: "sections",
    title: "الأقسام العلمية",
    body: "العقيدة والفقه والحديث والسيرة والتاريخ وأعلام الإسلام.",
    hint: "من قائمة الأقسام",
    Icon: Library,
  },
  {
    id: "search",
    title: "بحث شامل",
    body: "بحث واحد يشمل كل المحتوى — بلا تشكيل ولا همزات.",
    hint: "من شريط البحث العلوي",
    Icon: Search,
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  /** عند true: يُعلَّم الإكمال عند التخطي/الإنهاء (أول دخول). */
  persistOnExit?: boolean;
};

export function AppFeatureTour({ open, onClose, persistOnExit = true }: Props) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const total = FEATURE_TOUR_SLIDES.length;
  const slide = FEATURE_TOUR_SLIDES[index]!;
  const isLast = index === total - 1;

  const finish = useCallback(() => {
    if (persistOnExit) markFeatureTourCompleted();
    onClose();
  }, [onClose, persistOnExit]);

  const goNext = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [finish, isLast, total]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      return;
    }
    document.body.classList.add("feature-tour-open");
    const t = window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      document.body.classList.remove("feature-tour-open");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  if (!open || typeof document === "undefined") return null;

  const SlideIcon = slide.Icon;

  return createPortal(
    <div
      className="feature-tour-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) finish();
      }}
    >
      <div
        ref={dialogRef}
        className="feature-tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-tour-title"
        aria-describedby="feature-tour-body"
        tabIndex={-1}
        dir="rtl"
      >
        <div className="feature-tour-viewport" aria-live="polite">
          <section className="feature-tour-slide" aria-labelledby="feature-tour-title">
            <div className="feature-tour-icon-slot" aria-hidden="true">
              <SlideIcon className="feature-tour-icon" strokeWidth={1.6} />
            </div>
            <h2 id="feature-tour-title" className="feature-tour-title">
              {slide.title}
            </h2>
            <p id="feature-tour-body" className="feature-tour-body">
              {slide.body}
            </p>
            <p className="feature-tour-hint">{slide.hint}</p>
          </section>
        </div>

        <div className="feature-tour-dots" role="tablist" aria-label="شرائح جولة المزايا">
          {FEATURE_TOUR_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              className={`feature-tour-dot${i === index ? " is-active" : ""}`}
              aria-selected={i === index}
              aria-label={`الشريحة ${i + 1} من ${total}: ${s.title}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <footer className="feature-tour-footer">
          <div className="feature-tour-nav">
            <button
              type="button"
              className="feature-tour-btn feature-tour-btn--ghost"
              onClick={finish}
            >
              {isLast ? "إغلاق" : "تخطّي"}
            </button>
            <div className="feature-tour-nav__mid">
              {index > 0 ? (
                <button
                  type="button"
                  className="feature-tour-btn feature-tour-btn--ghost"
                  onClick={goPrev}
                >
                  السابق
                </button>
              ) : null}
              <button
                type="button"
                className="feature-tour-btn feature-tour-btn--primary"
                onClick={goNext}
              >
                {isLast ? "تم" : "التالي"}
              </button>
            </div>
          </div>
        </footer>

        <div className="feature-tour-progress" aria-hidden="true">
          <span className="feature-tour-progress__icon" aria-hidden="true">
            <SlideIcon strokeWidth={1.6} />
          </span>
          <span className="feature-tour-progress__label">
            {index + 1} / {total}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
