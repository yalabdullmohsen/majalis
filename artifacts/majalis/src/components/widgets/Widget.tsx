import type { ReactNode } from "react";
import { Link } from "wouter";
import { LogIn, type LucideIcon } from "lucide-react";

/**
 * غلاف موحّد لودجات الرئيسية (المرحلة 7) — أربع حالات إلزامية: تحميل/فارغ/
 * تسجيل دخول مطلوب/جاهز، بالإضافة لخطأ (يُدار غالبًا عبر SectionErrorBoundary
 * المحيط بالفعل بكل ودجت في HomePage.tsx). لا يفرض بنية بيانات معيّنة —
 * كل ودجت يمرّر محتواه الفعلي في state="ready"، فيبقى منطقه الداخلي كما هو.
 *
 * لماذا الآن حصرًا؟ راجع src/lib/homepage-layout.ts (سجل الودجات القابلة
 * للتخصيص، من المرحلة 4) — هذا المكوّن هو الأساس المطلوب لتوحيد شكل كل
 * الودجات المسجَّلة فيه تدريجيًا، لا إعادة كتابتها دفعة واحدة (خطر بصري
 * كبير بلا تحقق بصري شامل — راجع docs/redesign-audit.md).
 */
export type WidgetState = "loading" | "empty" | "auth-required" | "ready";

export interface WidgetProps {
  /** معرّف مستقر لـ aria-labelledby — يفضَّل أن يطابق مُعرِّف الودجت في homepage-layout.ts. */
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  moreHref?: string;
  moreLabel?: string;
  state: WidgetState;
  /** عدد صفوف الهيكل العظمي في حالة التحميل. */
  skeletonRows?: number;
  emptyIcon?: LucideIcon;
  emptyMessage?: string;
  emptyCtaHref?: string;
  emptyCtaLabel?: string;
  authMessage?: string;
  authCtaLabel?: string;
  children?: ReactNode;
}

export function Widget({
  id,
  eyebrow,
  title,
  description,
  moreHref,
  moreLabel = "عرض الكل",
  state,
  skeletonRows = 3,
  emptyIcon: EmptyIcon,
  emptyMessage = "لا يوجد محتوى بعد.",
  emptyCtaHref,
  emptyCtaLabel = "استكشف",
  authMessage = "سجّل الدخول لمتابعة هذا القسم.",
  authCtaLabel = "تسجيل الدخول",
  children,
}: WidgetProps) {
  const headingId = `widget-${id}-heading`;

  return (
    <section className="home-section widget-shell" aria-labelledby={headingId} data-widget-state={state}>
      <div className="home-section-head">
        <div>
          {eyebrow && <p className="home-eyebrow">{eyebrow}</p>}
          <h2 id={headingId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {moreHref && state === "ready" && (
          <Link href={moreHref} className="home-section-link">
            {moreLabel}
          </Link>
        )}
      </div>

      {state === "loading" && (
        <div className="widget-shell__skeletons" aria-hidden="true">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="widget-shell__skeleton" />
          ))}
        </div>
      )}

      {state === "empty" && (
        <div className="widget-shell__empty">
          {EmptyIcon && <EmptyIcon size={30} strokeWidth={1} aria-hidden="true" />}
          <p>{emptyMessage}</p>
          {emptyCtaHref && (
            <Link href={emptyCtaHref} className="widget-shell__empty-cta">
              {emptyCtaLabel}
            </Link>
          )}
        </div>
      )}

      {state === "auth-required" && (
        <div className="widget-shell__auth">
          <LogIn size={26} strokeWidth={1.5} aria-hidden="true" />
          <p>{authMessage}</p>
          <Link href="/login" className="widget-shell__empty-cta">
            <LogIn size={14} aria-hidden="true" /> {authCtaLabel}
          </Link>
        </div>
      )}

      {state === "ready" && children}
    </section>
  );
}

export default Widget;
