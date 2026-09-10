import { Link } from "wouter";
import { BookOpen, PlayCircle, BookMarked, ArrowLeft, PlayCircle as EmptyIcon } from "lucide-react";
import { useRecentProgress } from "@/hooks/useRecentProgress";
import { useAuth } from "@/components/AuthProvider";
import { Widget, type WidgetState } from "@/components/widgets/Widget";
import type { ContentType } from "@/lib/user-progress-service";
import { EMPTY, ACTION } from "@/lib/ui-copy";

const ICONS: Record<ContentType, typeof BookOpen> = {
  lesson: PlayCircle,
  lesson_detail: PlayCircle,
  course: BookMarked,
  quran: BookOpen,
};

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="hcw-card__bar" aria-hidden="true">
      <span style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

/**
 * مُنقَّح للمرحلة 7 لاستخدام <Widget> الموحّد — أهم فرق سلوكي عن ما قبله:
 * حالة "غير مسجّل" كانت تُخفي الودجت تمامًا (return null) وهو ما يخالف
 * "تسجيل دخول مطلوب" كحالة إلزامية مرئية بالمواصفة — الآن تظهر دعوة صريحة
 * لتسجيل الدخول بدل الاختفاء الصامت (2026-07-18).
 */
export function HomeContinueWidget() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { items, loading } = useRecentProgress(4);

  // أثناء initializing لا نعرض «سجّل الدخول» ثم نقلب فجأة — هيكل تحميل ثابت
  const state: WidgetState = authLoading
    ? "loading"
    : !isLoggedIn
      ? "auth-required"
      : loading
        ? "loading"
        : items.length === 0
          ? "empty"
          : "ready";

  return (
    <Widget
      id="continue"
      eyebrow="متابعة التعلم"
      title="متابعة من حيث توقفت"
      description="آخر الدروس والمحتويات التي كنت تتابعها."
      moreHref="/my-learning"
      moreLabel={ACTION.continueListening}
      state={state}
      skeletonRows={3}
      emptyIcon={EmptyIcon}
      emptyMessage={EMPTY.continueEmpty}
      emptyCtaHref="/lessons"
      emptyCtaLabel={ACTION.browseAll}
      authMessage="سجّل الدخول لمتابعة آخر ما كنت تتعلّمه."
    >
      <div className="hcw-grid">
        {items.map((item) => {
          const Icon = ICONS[item.content_type] ?? BookOpen;
          const href = item.content_url ?? "#";
          return (
            <Link key={item.id} href={href} className="hcw-card ui-card">
              <span className="hcw-card__icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div className="hcw-card__body">
                <p className="hcw-card__title">{item.content_title ?? "محتوى"}</p>
                <ProgressBar pct={item.progress_pct} />
                <p className="hcw-card__pct">{item.progress_pct}%</p>
              </div>
              <ArrowLeft size={16} className="hcw-card__go" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </Widget>
  );
}

export default HomeContinueWidget;
