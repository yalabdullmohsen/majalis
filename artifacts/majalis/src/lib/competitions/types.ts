/**
 * إعلانات مسابقات خارجية (قرآن/حديث/تجويد…) — ليست أسئلة داخل التطبيق.
 */

export const COMPETITION_TYPES = [
  "quran_recitation",
  "quran_memorization",
  "quran_revision",
  "hadith_memorization",
  "tajweed",
  "scientific_competition",
  "children_competition",
  "women_competition",
] as const;

export type CompetitionType = (typeof COMPETITION_TYPES)[number];

export const COMPETITION_TYPE_LABELS: Record<CompetitionType, string> = {
  quran_recitation: "تسميع قرآن",
  quran_memorization: "حفظ قرآن",
  quran_revision: "مراجعة قرآن",
  hadith_memorization: "تسميع حديث",
  tajweed: "تجويد",
  scientific_competition: "مسابقة علمية",
  children_competition: "مسابقة أطفال",
  women_competition: "مسابقة نسائية",
};

export const GENDER_TARGETS = ["الكل", "رجال", "نساء", "ناشئة", "أطفال"] as const;
export type GenderTarget = (typeof GENDER_TARGETS)[number];

export const REGISTRATION_STATUSES = ["مفتوح", "قريبًا", "مغلق", "منتهية"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export type CompetitionCategory =
  | "quran"
  | "hadith"
  | "tajweed"
  | "scientific"
  | "children"
  | "women"
  | "general";

export type ExternalCompetition = {
  id: string;
  title: string;
  organizerName: string;
  sourceName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  description?: string;
  competitionType: CompetitionType;
  category: CompetitionCategory;
  genderTarget: GenderTarget;
  prizeText?: string;
  registrationStatus: RegistrationStatus;
  registrationUrl?: string;
  whatsappUrl?: string;
  phone?: string;
  location?: string;
  isRemote: boolean;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  requirements?: string[];
  levels?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  sourcePlatform: "automation" | "importedSources" | "manual" | "demo";
};

export type CompetitionFilterId =
  | "all"
  | "quran"
  | "hadith"
  | "tajweed"
  | "prizes"
  | "open"
  | "men"
  | "women"
  | "remote";

export const COMPETITION_FILTERS: ReadonlyArray<{ id: CompetitionFilterId; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "quran", label: "قرآن" },
  { id: "hadith", label: "حديث" },
  { id: "tajweed", label: "تجويد" },
  { id: "prizes", label: "جوائز" },
  { id: "open", label: "تسجيل مفتوح" },
  { id: "men", label: "رجال" },
  { id: "women", label: "نساء" },
  { id: "remote", label: "عن بعد" },
];
