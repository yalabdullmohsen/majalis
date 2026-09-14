import { memo } from "react";
import { displaySurahNameFromLabel } from "@/lib/quran-display";

type Props = {
  nameArabic: string;
};

/**
 * SunnahSurahCartoucheCompact — لوحة اسم سورة مستقلة صغيرة (هوية سُنّة).
 * عرض يعتمد على الاسم ضمن حد أدنى/أقصى؛ بلا شريط بعرض الصفحة، بلا ظل/زر UI.
 * الارتفاع داخل خانة الشبكة ثابت — لا FittedBox ولا قصّ للاسم.
 */
export const MushafSurahFramePremium = memo(function MushafSurahFramePremium({
  nameArabic,
}: Props) {
  const label = displaySurahNameFromLabel(nameArabic);
  return (
    <div
      className="nm-surah-banner"
      data-testid="nm-surah-banner"
      data-surah-frame="sunnah-cartouche-compact-v1"
      data-sunnah-frame="sunnah-v1"
      data-component="SunnahSurahCartoucheCompact"
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
