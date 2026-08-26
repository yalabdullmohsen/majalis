/**
 * شارة بث حي على الرئيسية — تظهر عند وجود درس جارٍ الآن (خصوصاً مع بث مباشر).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Radio } from "lucide-react";
import { RequestManager } from "@/lib/request-manager";
import { getUnifiedActiveLessons } from "@/lib/lessons-service";
import { filterLiveStreamNowLessons, filterLiveNowLessons } from "@/lib/live-now-lessons";
import { resolveLessonDetailsHref } from "@/lib/unified-lesson-card";
import { cleanDisplayText } from "@/lib/display-text";
import { formatSheikhName } from "@/lib/sheikh-name";
import "@/styles/components/home-live-now.css";

type LiveItem = {
  id: string;
  title: string;
  sheikh: string;
  href: string;
  hasStream: boolean;
  mosque?: string;
};

function toLiveItem(lesson: ReturnType<typeof filterLiveNowLessons>[number]): LiveItem | null {
  const href = resolveLessonDetailsHref(lesson);
  if (!href) return null;
  return {
    id: lesson.id,
    title: cleanDisplayText(lesson.title),
    sheikh: formatSheikhName(lesson.sheikhName) || lesson.sheikhName,
    href,
    hasStream: Boolean(lesson.hasLiveStream),
    mosque: lesson.mosque ? cleanDisplayText(lesson.mosque) : undefined,
  };
}

export function HomeLiveNowBanner() {
  const [items, setItems] = useState<LiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(() => {
    void RequestManager.run("home:live-now", () => getUnifiedActiveLessons())
      .then(({ lessons }) => {
        if (!mountedRef.current) return;
        const withStream = filterLiveStreamNowLessons(lessons)
          .map(toLiveItem)
          .filter((x): x is LiveItem => x != null);
        const fallback = withStream.length
          ? withStream
          : filterLiveNowLessons(lessons)
              .map(toLiveItem)
              .filter((x): x is LiveItem => x != null);
        setItems(fallback.slice(0, 3));
      })
      .catch(() => {
        if (mountedRef.current) setItems([]);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
    };
  }, [refresh]);

  if (loading || items.length === 0) return null;

  const primary = items[0]!;

  return (
    <section className="hlive" aria-label="دروس جارية الآن" data-testid="home-live-now-banner">
      <div className="hlive__inner">
        <span className="hlive__pulse" aria-hidden="true">
          <Radio size={18} />
        </span>
        <div className="hlive__copy">
          <p className="hlive__eyebrow">
            <span className="hlive__badge" role="status">
              <span className="hlive__dot" aria-hidden="true" />
              LIVE
            </span>
            {primary.hasStream ? "بث مباشر الآن" : "درس جارٍ الآن"}
          </p>
          <p className="hlive__title">{primary.title}</p>
          <p className="hlive__meta">
            {primary.sheikh}
            {primary.mosque ? ` · ${primary.mosque}` : ""}
          </p>
          {items.length > 1 && (
            <p className="hlive__more">+{items.length - 1} دروس أخرى جارية</p>
          )}
        </div>
        <Link href={primary.href} className="hlive__cta mj-btn m2030-btn m2030-btn--primary">
          {primary.hasStream ? "شاهد البث" : "ادخل الدرس"}
        </Link>
      </div>
    </section>
  );
}

export default HomeLiveNowBanner;
