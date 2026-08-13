import type { ReactNode } from "react";
import type { MushafPageLayout } from "@/lib/mushaf-v2-data";
import { MushafPageV2 } from "@/components/quran/MushafPageV2";
import { MUSHAF_FEATURES } from "@/features/mushaf/config";
import { MushafHitLayer } from "@/features/mushaf/MushafHitLayer";
import { MushafTextLayer } from "@/features/mushaf/MushafTextLayer";
import "@/features/mushaf/mushaf-layered.css";

type Props = {
  layout: MushafPageLayout | null;
  activeAyahKey?: string | null;
  onAyahPress?: (verseKey: string) => void;
  onBackgroundPress?: () => void;
  /** @deprecated يُتجاهل — مسار QPC موحّد */
  sharedFontFamily?: string;
  /** @deprecated يُتجاهل — مسار QPC موحّد */
  renderWord?: (w: unknown) => ReactNode;
  showAyahNumbers?: boolean;
  mushafScale?: number;
};

/**
 * صفحة مصحف ثلاثية الطبقات:
 * 1) بصري (QPC دائمًا — مقياس عبر --mushaf-scale)
 * 2) إحداثيات نسبية للضغط/التظليل
 * 3) نص مخفي للوصولية والنسخ (بحث فقط)
 */
export function MushafLayeredPage({
  layout,
  activeAyahKey,
  onAyahPress,
  onBackgroundPress,
  showAyahNumbers = true,
  mushafScale = 1,
}: Props) {
  const useHit = MUSHAF_FEATURES.ayahHitLayer;
  const useText = MUSHAF_FEATURES.ayahTextLayer;

  return (
    <div className="mfl-page" data-mushaf-layers="visual+hit+text" data-mushaf-scale={mushafScale}>
      {/* طبقة ١ — بصري: QPC فقط */}
      <div className="mfl-visual" data-layer="visual" data-source="qpc-v2">
        <MushafPageV2
          layout={layout}
          activeAyahKey={activeAyahKey}
          onAyahPress={useHit ? undefined : onAyahPress}
          showAyahNumbers={showAyahNumbers}
          visualOnly={useHit}
          mushafScale={mushafScale}
          bare
        />
      </div>

      {/* طبقة ٢ — إحداثيات */}
      {useHit ? (
        <MushafHitLayer
          layout={layout}
          activeAyahKey={activeAyahKey}
          onAyahPress={onAyahPress}
          onBackgroundPress={onBackgroundPress}
        />
      ) : null}

      {/* طبقة ٣ — نص مخفي للبحث فقط */}
      {useText ? <MushafTextLayer layout={layout} /> : null}
    </div>
  );
}
