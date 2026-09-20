/**
 * محاور عرض «القرآن في أرقام» — تجميع البطاقات المعتمدة للتصفح.
 * لا تُنشئ أرقامًا جديدة؛ تربط معرّفات موجودة فقط.
 * كل بطاقة في reviewed-ids يجب أن تظهر في محور واحد على الأقل.
 */
import type { QuranStat } from "./types";

export type QuranStatTheme =
  | "asasi"
  | "alfaz-shahira"
  | "anbiya"
  | "awamir"
  | "nawahi"
  | "mutaqabila"
  | "suwar"
  | "mawdoo"
  | "ajaib";

export const QURAN_STAT_THEME_LABEL: Record<QuranStatTheme, string> = {
  asasi: "أساسيات المصحف",
  "alfaz-shahira": "ألفاظ ومواد",
  anbiya: "أنبياء وأعلام",
  awamir: "أوامر لفظية",
  nawahi: "نواهٍ لفظية",
  mutaqabila: "ألفاظ متقابلة",
  suwar: "السور والآيات",
  mawdoo: "موضوعات ومعاد",
  ajaib: "لطائف موثّقة",
};

export const QURAN_STAT_THEME_BLURB: Record<QuranStatTheme, string> = {
  asasi: "عدد السور والآيات والكلمات والحروف وتقسيم المكي والمدني من مصادر العدّ المطبوعة.",
  "alfaz-shahira":
    "ألفاظ ومواد من المعجم المفهرس: لفظ الجلالة والربّ والصلاة والزكاة والعلم وغيرها — بلا ترك بطاقة معتمدة.",
  anbiya: "ورود أسماء الأنبياء والأعلام بصيغها الصريحة كما في المعجم المفهرس.",
  awamir: "صيغ أمر ومواد قريبة من الأوامر (قُلْ، التقوى، الصلاة، الزكاة، الاستغفار) بعدّ لفظي لا موضوعي موسّع.",
  nawahi: "مواد وصيغ قريبة من النواهي (الشرك، الظلم، خطوات الشيطان) بعدّ لفظي موثّق.",
  mutaqabila:
    "ألفاظ تُعرض منفصلة للمقارنة اللفظية فقط — بلا سرد «إعجاز تقابلي» أو برهان عددي.",
  suwar: "أعداد آيات سور مختارة وأطول/أقصر سورة وآية من مصادر العدّ الكوفي المطبوعة.",
  mawdoo: "الجنة والنار والآخرة والبعث والحساب وما يتصل بالمعاد — بعدّ مادّي أو موضوعي موثّق.",
  ajaib: "لطائف اصطلاحية موثّقة: الطوال، الحروف المقطّعة، البسملات، وأسماء الفاتحة.",
};

/** ترتيب العرض داخل كل محور — يغطي كل reviewed-ids بلا تيتيم */
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
    "rahman-lafz",
    "rabb-madda",
    "asma-husna",
    "wahd-madda",
    "qul-lafz",
    "nas-lafz",
    "insan-lafz",
    "ard-lafz",
    "iman-madda",
    "kufr-madda",
    "nifaq-madda",
    "islam-madda",
    "salah-madda",
    "zakah-madda",
    "sawm-madda",
    "hajj-madda",
    "dhikr-madda",
    "dua-madda",
    "tawba-madda",
    "istighfar-madda",
    "jihad-madda",
    "sabr-madda",
    "taqwa-madda",
    "ihsan-madda",
    "adl-madda",
    "rahma-madda",
    "ilm-madda",
    "hikma-madda",
    "longest-word",
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
    "jinn-madda",
  ],
  mutaqabila: [
    "dunya-lafz",
    "akhira-lafz",
    "malaika-madda",
    "shaitan-lafz",
    "shahr-lafz",
    "sana-madda",
  ],
  suwar: [
    "baqara-ayahs",
    "kawthar-ayahs",
    "ikhlas-ayahs",
    "fatiha-ayahs",
    "yasin-ayahs",
    "naml-ayahs",
    "longest-surah-ayahs",
    "shortest-surah-ayahs",
    "longest-ayah",
    "shortest-ayah",
  ],
  mawdoo: [
    "jannah-madda",
    "jannah-names",
    "nar-madda",
    "nar-names",
    "akhira-lafz",
    "qiyama-madda",
    "bath-madda",
    "hisab-mawdoo",
    "mizan-mawdoo",
    "sirat-mawdoo",
    "barzakh-mawdoo",
    "adhab-qabr-mawdoo",
    "tawhid-mawdoo",
    "dunya-lafz",
  ],
  ajaib: [
    "classification",
    "huruf-muqatta",
    "seven-tiwal",
    "prophet-named-surahs",
    "basmala-twice",
    "basmala-count",
    "sajda-surahs-count",
    "fatiha-names",
  ],
};

export const QURAN_STAT_THEMES: QuranStatTheme[] = [
  "asasi",
  "alfaz-shahira",
  "anbiya",
  "awamir",
  "nawahi",
  "mutaqabila",
  "suwar",
  "mawdoo",
  "ajaib",
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

/** يمنع بقاء بطاقة معتمدة بلا محور عرض */
export function assertNoOrphanThemeCoverage(catalogIds: Set<string>): void {
  const covered = new Set<string>();
  for (const theme of QURAN_STAT_THEMES) {
    for (const id of QURAN_STAT_THEME_IDS[theme]) covered.add(id);
  }
  const orphans = [...catalogIds].filter((id) => !covered.has(id)).sort();
  if (orphans.length > 0) {
    throw new Error(`بطاقات بلا محور عرض: ${orphans.join(", ")}`);
  }
}
