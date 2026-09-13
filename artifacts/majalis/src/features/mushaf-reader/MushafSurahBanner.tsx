import { memo } from "react";
import { displaySurahNameFromLabel } from "@/lib/quran-display";

type Props = {
  nameArabic: string;
};

/**
 * MushafSurahFrame — إطار سورة مطبعي (هوية سُنّة)، ليس Card تطبيق.
 * زخرفة هندسية بسيطة بلا علامات ×. الأبعاد ثابتة بعد الرسم.
 */
export const MushafSurahFrame = memo(function MushafSurahFrame({ nameArabic }: Props) {
  const label = displaySurahNameFromLabel(nameArabic);
  return (
    <div
      className="nm-surah-banner"
      data-testid="nm-surah-banner"
      data-surah-frame="sunnah-v1"
      data-component="MushafSurahFrame"
      role="heading"
      aria-level={2}
    >
      <span className="nm-surah-banner__ornament" aria-hidden="true" />
      <span className="nm-surah-banner__label">{`سورة ${label}`}</span>
      <span className="nm-surah-banner__ornament" aria-hidden="true" />
    </div>
  );
});

/** توافق خلفي */
export const MushafSurahBanner = MushafSurahFrame;
