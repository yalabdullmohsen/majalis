import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  prefetchMany,
  resolveRouteEntity,
  shouldShowKnowledgeRail,
  type RouteEntityContext,
} from "@/lib/entity-graph";
import { EntityConnections } from "./EntityConnections";
import { PrevNextNav } from "./PrevNextNav";
import "@/styles/components/entity-connections.css";

/**
 * شريط معرفة عام يُحقَن أسفل المحتوى لكل الصفحات المناسبة.
 * يحل المسار → كيان → علاقات دون تعديل يدوي لكل صفحة.
 */
export function SiteKnowledgeRail() {
  const [location] = useLocation();
  const [ctx, setCtx] = useState<RouteEntityContext | null>(null);

  const show = shouldShowKnowledgeRail(location);

  useEffect(() => {
    if (!show) {
      setCtx(null);
      return;
    }
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const next = resolveRouteEntity(location);
      setCtx(next);
      const hrefs = next.sections.flatMap((s) => s.items.map((i) => i.href));
      if (next.prev) hrefs.push(next.prev.href);
      if (next.next) hrefs.push(next.next.href);
      prefetchMany(hrefs, 10);
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (typeof requestIdleCallback === "function") {
      idleId = requestIdleCallback(run, { timeout: 800 });
    } else {
      timeoutId = window.setTimeout(run, 32);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof cancelIdleCallback === "function") cancelIdleCallback(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [location, show]);

  if (!show || !ctx) return null;

  // صفحات ContentDetailLayout تعرض related/prev-next داخليًا — نُبقي هنا المتابعة والتعلم فقط
  const usesDetailLayout =
    location.startsWith("/library/") ||
    location.startsWith("/rulings/") ||
    location.startsWith("/sins-and-rights/") ||
    location.startsWith("/annual-courses/") ||
    location.startsWith("/scientific-announcements/");

  const sections = usesDetailLayout
    ? ctx.sections.filter((s) => s.id === "continue" || s.id === "keep_learning" || s.id === "you_may_like")
    : ctx.sections;

  if (!sections.length && (usesDetailLayout || (!ctx.prev && !ctx.next))) return null;

  return (
    <aside className="ek-rail" aria-label="روابط ومحتوى ذو صلة">
      {!usesDetailLayout ? <PrevNextNav prev={ctx.prev} next={ctx.next} /> : null}
      <EntityConnections sections={sections} />
    </aside>
  );
}
