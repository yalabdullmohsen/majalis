import { normalizeArabic, toWesternDigits } from "@/shared/arabic-normalize";

export type QuickNavResult = {
  href: string;
  titleAr: string;
};

/**
 * أوامر سريعة: «البقرة ٢٥٥» → آية، «صحيح البخاري ١» → حديث.
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

  // سورة + رقم آية: البقرة 255 / البقرة ٢٥٥
  const ayah = q.match(/^(?:سورة\s+)?(.+?)\s+(\d{1,3})$/u);
  if (ayah) {
    const name = normalizeArabic(ayah[1] ?? "");
    const n = Number(ayah[2]);
    if (name && n >= 1 && n <= 286) {
      return {
        href: `/quran/search?q=${encodeURIComponent(`${ayah[1]} ${n}`)}`,
        titleAr: `آية: ${ayah[1]} ${n}`,
      };
    }
  }

  return null;
}
