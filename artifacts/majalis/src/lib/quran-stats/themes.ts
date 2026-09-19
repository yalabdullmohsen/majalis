/**
 * محاور عرض «القرآن في أرقام» — تجميع البطاقات المعتمدة للتصفح.
 * لا تُنشئ أرقامًا جديدة؛ تربط معرّفات موجودة فقط.
 */
import type { QuranStat } from "./types";

export type QuranStatTheme =
  | "asasi"
  | "alfaz-shahira"
  | "anbiya"
  | "awamir"
  | "nawahi"
  | "mutaqabila";

export const QURAN_STAT_THEME_LABEL: Record<QuranStatTheme, string> = {
  asasi: "أساسيات المصحف",
  "alfaz-shahira": "ألفاظ شائعة",
  anbiya: "أنبياء وأعلام",
  awamir: "أوامر لفظية",
  nawahi: "نواهٍ لفظية",
  mutaqabila: "ألفاظ متقابلة",
};

export const QURAN_STAT_THEME_BLURB: Record<QuranStatTheme, string> = {
  asasi: "عدد السور والآيات والكلمات والحروف وتقسيم المكي والمدني من مصادر العدّ المطبوعة.",
  "alfaz-shahira": "أشهر الألفاظ والمواد في المعجم المفهرس: لفظ الجلالة والربّ وقُلْ والناس وغيرها.",
  anbiya: "ورود أسماء الأنبياء والأعلام بصيغها الصريحة كما في المعجم المفهرس.",
  awamir: "صيغ أمر ومواد قريبة من الأوامر (قُلْ، التقوى، الصلاة، الزكاة، الاستغفار) بعدّ لفظي لا موضوعي موسّع.",
  nawahi: "مواد وصيغ قريبة من النواهي (الشرك، الظلم، خطوات الشيطان) بعدّ لفظي موثّق.",
  mutaqabila:
    "ألفاظ تُعرض منفصلة للمقارنة اللفظية فقط — بلا سرد «إعجاز تقابلي» أو برهان عددي.",
};

/** ترتيب العرض داخل كل محور */
export const QURAN_STAT_THEME_IDS: Record<QuranStatTheme, readonly string[]> = {
  asasi: [
    "surahs",
    "ayat-kufi",
    "words-disputed",
    "letters-disputed",
    "makki-count",
    "madani-count",
    "ajza",
    "ahzab",
    "arba",
    "pages-madinah",
    "sajda",
    "nuzul-span",
  ],
  "alfaz-shahira": [
    "allah-lafz",
    "rabb-madda",
    "qul-lafz",
    "nas-lafz",
    "insan-lafz",
    "ard-lafz",
    "qiyama-madda",
    "rahman-lafz",
    "iman-madda",
    "salah-madda",
    "zakah-madda",
    "taqwa-madda",
    "istighfar-madda",
    "dhikr-madda",
  ],
  anbiya: [
    "musa-lafz",
    "ibrahim-lafz",
    "nuh-lafz",
    "yusuf-lafz",
    "isa-lafz",
    "adam-lafz",
    "sulayman-lafz",
    "dawud-lafz",
    "muhammad-lafz",
    "ahmad-lafz",
    "firawn-lafz",
  ],
  awamir: [
    "qul-lafz",
    "taqwa-madda",
    "salah-madda",
    "zakah-madda",
    "istighfar-madda",
    "tawba-madda",
    "tawhid-mawdoo",
  ],
  nawahi: [
    "shirk-madda",
    "zulm-madda",
    "khutuwat-shaitan",
    "fasad-madda",
    "shaitan-lafz",
    "iblis-lafz",
  ],
  mutaqabila: [
    "dunya-lafz",
    "akhira-lafz",
    "malaika-madda",
    "shaitan-lafz",
    "shahr-lafz",
    "sana-madda",
  ],
};

export const QURAN_STAT_THEMES: QuranStatTheme[] = [
  "asasi",
  "alfaz-shahira",
  "anbiya",
  "awamir",
  "nawahi",
  "mutaqabila",
];

export function filterStatsByTheme(
  catalog: QuranStat[],
  theme: QuranStatTheme | "all",
): QuranStat[] {
  if (theme === "all") return catalog;
  const order = QURAN_STAT_THEME_IDS[theme];
  const byId = new Map(catalog.map((s) => [s.id, s]));
  const ordered: QuranStat[] = [];
  for (const id of order) {
    const hit = byId.get(id);
    if (hit) ordered.push(hit);
  }
  return ordered;
}

export function assertThemeIdsExist(catalogIds: Set<string>): void {
  for (const theme of QURAN_STAT_THEMES) {
    for (const id of QURAN_STAT_THEME_IDS[theme]) {
      if (!catalogIds.has(id)) {
        throw new Error(`محور ${theme}: معرّف ناقص في الكتالوج ${id}`);
      }
    }
  }
}
