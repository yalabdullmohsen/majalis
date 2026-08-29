import { memo } from "react";
import { displaySurahNameFromLabel } from "@/lib/quran-display";

type Props = {
  nameArabic: string;
};

/** شريط عنوان سورة محلي — مطابق لهدوء المرجع */
export const MushafSurahBanner = memo(function MushafSurahBanner({ nameArabic }: Props) {
  const label = displaySurahNameFromLabel(nameArabic);
  return (
    <div className="nm-surah-banner" data-testid="nm-surah-banner" role="heading" aria-level={2}>
      <span className="nm-surah-banner__label">{`سورة ${label}`}</span>
    </div>
  );
});
