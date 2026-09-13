import { memo } from "react";
import { displaySurahNameFromLabel } from "@/lib/quran-display";

type Props = {
  nameArabic: string;
};

/** إطار سورة أصلي لهوية سُنّة — أبعاد ثابتة ضمن Render Model */
export const MushafSurahBanner = memo(function MushafSurahBanner({ nameArabic }: Props) {
  const label = displaySurahNameFromLabel(nameArabic);
  return (
    <div
      className="nm-surah-banner"
      data-testid="nm-surah-banner"
      data-surah-frame="sunnah-v1"
      role="heading"
      aria-level={2}
    >
      <span className="nm-surah-banner__label">{`سورة ${label}`}</span>
    </div>
  );
});
