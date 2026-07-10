import { Link } from "wouter";
import { BookOpen, PlayCircle, BookMarked, ArrowLeft } from "lucide-react";
import { useRecentProgress } from "@/hooks/useRecentProgress";
import { useAuth } from "@/components/AuthProvider";
import type { ContentType } from "@/lib/user-progress-service";

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

export function HomeContinueWidget() {
  const { isLoggedIn } = useAuth();
  const { items, loading } = useRecentProgress(4);

  if (!isLoggedIn || (!loading && items.length === 0)) return null;

  return (
    <section className="home-section" aria-labelledby="hcw-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">استمر في التعلم</p>
          <h2 id="hcw-heading">استمر من حيث توقفت</h2>
          <p>آخر المحتويات التي تصفحتها.</p>
        </div>
        <Link href="/my-learning" className="home-section-link">
          كل نشاطي
        </Link>
      </div>

      {loading ? (
        <div className="hcw-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hcw-card hcw-card--skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : (
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
      )}
    </section>
  );
}

export default HomeContinueWidget;
