import type { CompetitionCategory, CompetitionType } from "./types";

/** كلمات تدل على إعلان مسابقة خارجية من المصادر الموثوقة. */
export const COMPETITION_SIGNAL_WORDS = [
  "مسابقة",
  "جوائز",
  "جائزة",
  "حفظ",
  "تسميع",
  "مراجعة",
  "الماهر",
  "حديث",
  "أجزاء",
  "جزء",
  "القرآن",
  "قرآن",
  "تجويد",
] as const;

export function looksLikeCompetitionAnnouncement(title: string, body = ""): boolean {
  const hay = `${title} ${body}`.trim();
  if (!hay) return false;
  return COMPETITION_SIGNAL_WORDS.some((w) => hay.includes(w));
}

export function classifyCompetitionType(title: string, body = ""): CompetitionType {
  const hay = `${title} ${body}`;
  if (/نساء|نسائي|للأخوات|طالبات/.test(hay)) return "women_competition";
  if (/أطفال|ناشئة|فتيان|فتيات|صغار/.test(hay)) return "children_competition";
  if (/تجويد|أحكام التجويد|مخارج/.test(hay)) return "tajweed";
  if (/حديث|أحاديث|تسميع.{0,12}حديث|حفظ.{0,12}حديث/.test(hay)) return "hadith_memorization";
  if (/مراجعة|مراجعات/.test(hay) && /قرآن|جزء|أجزاء|سورة/.test(hay)) return "quran_revision";
  if (/حفظ|الحفظ|الماهر/.test(hay) && /قرآن|جزء|أجزاء|سورة|الماهر/.test(hay)) {
    return "quran_memorization";
  }
  if (/تسميع|الماهر|قرآن|جزء|أجزاء/.test(hay)) return "quran_recitation";
  if (/علمية|فقه|عقيدة|سيرة/.test(hay)) return "scientific_competition";
  return "scientific_competition";
}

export function categoryFromType(type: CompetitionType): CompetitionCategory {
  switch (type) {
    case "quran_recitation":
    case "quran_memorization":
    case "quran_revision":
      return "quran";
    case "hadith_memorization":
      return "hadith";
    case "tajweed":
      return "tajweed";
    case "children_competition":
      return "children";
    case "women_competition":
      return "women";
    default:
      return "scientific";
  }
}
