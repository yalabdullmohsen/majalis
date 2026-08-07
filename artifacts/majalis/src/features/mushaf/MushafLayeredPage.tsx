import type { ReactNode } from "react";
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";
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
  sharedFontFamily?: string;
  renderWord?: (w: QpcWord) => ReactNode;
  showAyahNumbers?: boolean;
};

/**
 * صفحة مصحف ثلاثية الطبقات:
 * 1) بصري (QPC — صور المدينة خلف flag)
 * 2) إحداثيات نسبية للضغط/التظليل
 * 3) نص مخفي للوصولية والنسخ
 */
export function MushafLayeredPage({
  layout,
  activeAyahKey,
  onAyahPress,
  onBackgroundPress,
  sharedFontFamily,
  renderWord,
  showAyahNumbers = true,
}: Props) {
  const useHit = MUSHAF_FEATURES.ayahHitLayer;
  const useText = MUSHAF_FEATURES.ayahTextLayer;

  return (
    <div className="mfl-page" data-mushaf-layers="visual+hit+text">
      {/* طبقة ١ — بصري: QPC (بديل صور المدينة حتى توريدها) */}
      <div className="mfl-visual" data-layer="visual" data-source="qpc-v2">
        <MushafPageV2
          layout={layout}
          activeAyahKey={activeAyahKey}
          onAyahPress={useHit ? undefined : onAyahPress}
          sharedFontFamily={sharedFontFamily}
          renderWord={renderWord}
          showAyahNumbers={showAyahNumbers}
          visualOnly={useHit}
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

      {/* طبقة ٣ — نص */}
      {useText ? <MushafTextLayer layout={layout} /> : null}
    </div>
  );
}
