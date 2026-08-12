import { toWesternDigits } from "@/shared/arabic-normalize";
import { parseMushafJumpQuery } from "@/features/search/mushaf-jump";

export type QuickNavResult = {
  href: string;
  titleAr: string;
};

/**
 * أوامر سريعة: «البقرة ٢٥٥» → آية، «صحيح البخاري ١» → حديث، «٢٨٣» → صفحة مصحف.
 * يُفحص الحديث قبل نمط السورة+الرقم حتى لا يُلتقط «صحيح البخاري 1» كآية.
 */
export function parseQuickNav(raw: string): QuickNavResult | null {
  const q = toWesternDigits(raw.trim());
  if (!q) return null;

  const bukhari = q.match(/^(?:صحيح\s+)?البخاري\s+(\d{1,5})$/u);
  if (bukhari) {
    const num = bukhari[1];
    return {
      href: `/hadith#bukhari-${num}`,
      titleAr: `صحيح البخاري ${num}`,
    };
  }

  const muslim = q.match(/^(?:صحيح\s+)?مسلم\s+(\d{1,5})$/u);
  if (muslim) {
    const num = muslim[1];
    return {
      href: `/hadith#muslim-${num}`,
      titleAr: `صحيح مسلم ${num}`,
    };
  }

  // مصحف: صفحة / سورة:آية / اسم سورة (+ آية) بأي رسم أرقام
  const mushaf = parseMushafJumpQuery(q);
  if (mushaf?.kind === "page") {
    return {
      href: `/mushaf/page/${mushaf.page}`,
      titleAr: `المصحف · صفحة ${mushaf.page}`,
    };
  }
  if (mushaf?.kind === "ayah") {
    return {
      href: `/mushaf/page/${mushaf.pageHint}?ayah=${mushaf.surah}:${mushaf.ayah}`,
      titleAr: `آية ${mushaf.surah}:${mushaf.ayah}`,
    };
  }

  return null;
}
