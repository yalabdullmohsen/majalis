import { memo } from "react";
import { displaySurahNameFromLabel } from "@/lib/quran-display";

type Props = {
  nameArabic: string;
};

/**
 * MushafSurahFramePremium — خرطوش عثماني مطبعي (هوية سُنّة).
 * زخرفة أفقية ممتدة بلا بطاقة ظل/بانر تطبيق، بلا ×، بلا نجوم UI.
 * الأبعاد داخل خانة الشبكة — لا FittedBox ولا قصّ لاسم السورة.
 */
export const MushafSurahFramePremium = memo(function MushafSurahFramePremium({
  nameArabic,
}: Props) {
  const label = displaySurahNameFromLabel(nameArabic);
  return (
    <div
      className="nm-surah-banner"
      data-testid="nm-surah-banner"
      data-surah-frame="sunnah-cartouche-v1"
      data-sunnah-frame="sunnah-v1"
      data-component="SunnahSurahTitleCartouche"
      role="heading"
      aria-level={2}
    >
      <span className="nm-surah-banner__rail nm-surah-banner__rail--start" aria-hidden="true">
        <span className="nm-surah-banner__band" />
        <span className="nm-surah-banner__ornament" />
      </span>
      <span className="nm-surah-banner__center">
        <span className="nm-surah-banner__flourish" />
        <span className="nm-surah-banner__label">{`سورة ${label}`}</span>
        <span className="nm-surah-banner__flourish" />
      </span>
      <span className="nm-surah-banner__rail nm-surah-banner__rail--end" aria-hidden="true">
        <span className="nm-surah-banner__ornament" />
        <span className="nm-surah-banner__band" />
      </span>
    </div>
  );
});

/** توافق بوابات/استيرادات قديمة */
export const MushafSurahFrame = MushafSurahFramePremium;
export const MushafSurahBanner = MushafSurahFramePremium;
