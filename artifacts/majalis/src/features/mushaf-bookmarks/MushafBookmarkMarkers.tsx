import { memo, useLayoutEffect, useMemo, useState } from "react";
import {
  getBookmarksOnPage,
  type MyBookmark,
} from "@/lib/quran-my-bookmarks";
import { resolveBookmarkColor } from "@/lib/quran-bookmark-kinds";

type Props = {
  page: number;
  container: HTMLElement | null;
  /** لا تقيس أثناء السحب */
  enabled?: boolean;
  onOpenAyah?: (ayahKey: string) => void;
};

type Marker = {
  id: number;
  ayahKey: string;
  top: number;
  color: string;
  label: string;
};

/**
 * مؤشرات هامش صغيرة — خارج صندوق النص، بلا تغطية للآية.
 */
export const MushafBookmarkMarkers = memo(function MushafBookmarkMarkers({
  page,
  container,
  enabled = true,
  onOpenAyah,
}: Props) {
  const bookmarks = useMemo(() => getBookmarksOnPage(page), [page]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const dark =
    typeof document !== "undefined" &&
    (document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark");

  useLayoutEffect(() => {
    if (!container || !enabled || bookmarks.length === 0) {
      setMarkers([]);
      return;
    }
    const origin = container.getBoundingClientRect();
    const next: Marker[] = [];
    const seen = new Set<string>();
    for (const b of bookmarks) {
      if (seen.has(b.ayahKey)) continue;
      seen.add(b.ayahKey);
      const node = container.querySelector<HTMLElement>(
        `[data-verse="${CSS.escape(b.ayahKey)}"]`,
      );
      if (!node) continue;
      const r = node.getBoundingClientRect();
      if (r.height < 1) continue;
      next.push({
        id: b.id,
        ayahKey: b.ayahKey,
        top: r.top - origin.top + r.height / 2 - 3,
        color: resolveBookmarkColor(b.kind, b.customColor, dark),
        label: b.customName || b.label,
      });
    }
    setMarkers(next);
  }, [container, enabled, bookmarks, dark]);

  if (!enabled || markers.length === 0) return null;

  return (
    <div className="rb-markers" data-testid="mushaf-bookmark-markers" aria-hidden="true">
      {markers.map((m) => (
        <button
          key={`${m.id}-${m.ayahKey}`}
          type="button"
          className="rb-markers__dot"
          style={{ top: `${m.top}px`, background: m.color }}
          title={m.label}
          aria-label={m.label}
          onClick={() => onOpenAyah?.(m.ayahKey)}
        />
      ))}
    </div>
  );
});

/** للاختبارات — عدد فواصل الصفحة دون DOM */
export function countPageBookmarks(page: number): number {
  return getBookmarksOnPage(page).length;
}

export type { MyBookmark };
