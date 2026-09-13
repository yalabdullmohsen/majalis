import { memo } from "react";
import { displaySurahNameFromLabel } from "@/lib/quran-display";

type Props = {
  nameArabic: string;
};

/**
 * MushafSurahFramePremium — إطار سورة مطبعي عثماني (هوية سُنّة).
 * زخرفة هندسية متماثلة بلا بطاقة ظل، بلا علامات ×، بلا نجوم منفصلة كـ UI.
 * الأبعاد ثابتة بعد الرسم — لا FittedBox ولا قصّ لاسم السورة.
 */
export const MushafSurahFramePremium = memo(function MushafSurahFramePremium({
  nameArabic,
}: Props) {
  const label = displaySurahNameFromLabel(nameArabic);
  return (
    <div
      className="nm-surah-banner"
      data-testid="nm-surah-banner"
      data-surah-frame="premium-uthmanic-v1"
      data-component="MushafSurahFramePremium"
      role="heading"
      aria-level={2}
    >
      <span className="nm-surah-banner__rail nm-surah-banner__rail--start" aria-hidden="true">
        <span className="nm-surah-banner__ornament" />
      </span>
      <span className="nm-surah-banner__center">
        <span className="nm-surah-banner__label">{`سورة ${label}`}</span>
      </span>
      <span className="nm-surah-banner__rail nm-surah-banner__rail--end" aria-hidden="true">
        <span className="nm-surah-banner__ornament" />
      </span>
    </div>
  );
});

/** توافق بوابات/استيرادات قديمة */
export const MushafSurahFrame = MushafSurahFramePremium;
export const MushafSurahBanner = MushafSurahFramePremium;
