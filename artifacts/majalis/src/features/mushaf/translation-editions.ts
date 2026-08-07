/**
 * ترجمات اختيارية لقارئ المصحف — مرحلة ٢.
 * جلب كسول لآية واحدة عبر AlQuran Cloud (نص بلا هوامش HTML).
 */

export type MushafTranslationEdition = {
  id: string;
  label: string;
  author: string;
  /** معرف الطبعة على api.alquran.cloud */
  alquranEdition: string;
  dir: "ltr" | "rtl";
};

export const MUSHAF_TRANSLATION_EDITIONS: MushafTranslationEdition[] = [
  {
    id: "en.sahih",
    label: "Saheeh International",
    author: "Saheeh International",
    alquranEdition: "en.sahih",
    dir: "ltr",
  },
  {
    id: "en.pickthall",
    label: "Pickthall",
    author: "Marmaduke Pickthall",
    alquranEdition: "en.pickthall",
    dir: "ltr",
  },
  {
    id: "fr.hamidullah",
    label: "حمي الله (فرنسية)",
    author: "Muhammad Hamidullah",
    alquranEdition: "fr.hamidullah",
    dir: "ltr",
  },
];

export const DEFAULT_MUSHAF_TRANSLATION_EDITION = MUSHAF_TRANSLATION_EDITIONS[0]!.id;

export function resolveMushafTranslationEditionId(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_MUSHAF_TRANSLATION_EDITION;
  if (MUSHAF_TRANSLATION_EDITIONS.some((e) => e.id === raw)) return raw;
  return DEFAULT_MUSHAF_TRANSLATION_EDITION;
}

export function getMushafTranslationEdition(id: string): MushafTranslationEdition | undefined {
  return MUSHAF_TRANSLATION_EDITIONS.find((e) => e.id === id);
}
