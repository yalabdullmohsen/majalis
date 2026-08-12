import { useMemo, useRef } from "react";
import type { MushafPageLayout } from "@/lib/mushaf-v2-data";
import { AYAH_PRESS_DELAY_MS } from "@/features/mushaf/config";
import { buildAyahHitRegions } from "@/features/mushaf/ayah-hit-regions";

type Props = {
  layout: MushafPageLayout | null;
  /** لم يعد يُستخدم للتظليل — الطبقة شفافة دائماً (التظليل على الكلمات فقط) */
  activeAyahKey?: string | null;
  onAyahPress?: (verseKey: string) => void;
  onBackgroundPress?: () => void;
};

/**
 * طبقة إحداثيات: مستطيلات SVG نسبية (viewBox 0..1) فوق الصفحة.
 * بلا تظليل بصري — الضغط فقط؛ التظليل يلتصق بـ .mf2-ayah-group.
 */
export function MushafHitLayer({
  layout,
  onAyahPress,
  onBackgroundPress,
}: Props) {
  const regions = useMemo(() => buildAyahHitRegions(layout), [layout]);
  const timers = useRef(new Map<string, number>());

  if (!layout || !regions.length) return null;

  const clearTimer = (key: string) => {
    const t = timers.current.get(key);
    if (t) window.clearTimeout(t);
    timers.current.delete(key);
  };

  return (
    <svg
      className="mfl-hit"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden="true"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onBackgroundPress?.();
      }}
    >
      {regions.map((region) =>
        region.rects.map((r, i) => {
          const key = `${region.verseKey}-${i}`;
          return (
            <rect
              key={key}
              className="mfl-hit__ayah"
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              data-verse={region.verseKey}
              data-page={region.page}
              onPointerDown={(e) => {
                if (e.button !== 0 && e.pointerType === "mouse") return;
                e.stopPropagation();
                clearTimer(key);
                const timer = window.setTimeout(() => {
                  onAyahPress?.(region.verseKey);
                  timers.current.delete(key);
                }, AYAH_PRESS_DELAY_MS);
                timers.current.set(key, timer);
              }}
              onPointerUp={() => clearTimer(key)}
              onPointerCancel={() => clearTimer(key)}
              onPointerLeave={() => clearTimer(key)}
            />
          );
        }),
      )}
    </svg>
  );
}
