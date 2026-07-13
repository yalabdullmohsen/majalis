export type RightsCategory = "allah" | "ibad" | "shared";
export type SinSeverity = "kabira" | "saghira" | "depends";
export type SinType = "qalbi" | "qawli" | "mali" | "badani" | "ijtimaaei" | "ibadi";
export type ReviewStatus = "reviewed" | "pending" | "draft";

export type Evidence = {
  text: string;
  source: string;
  grade?: string;
};

export type RepentanceConditions = {
  general: string[];
  requiresRestitution: boolean;
  restitutionDetails?: string;
  requiresForgiveness: boolean;
  forgivenessDetails?: string;
  hasExpiation: boolean;
  expiationDetails?: string;
  ifOwnerUnreachable?: string;
};

export type SinTopic = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  rightsCategory: RightsCategory;
  sinSeverity: SinSeverity;
  sinType: SinType | SinType[];
  quranEvidence: Evidence[];
  hadithEvidence: Evidence[];
  explanation: string;
  effects: string[];
  repentanceConditions: RepentanceConditions;
  commonMistakes: string[];
  relatedSlugs: string[];
  references: string[];
  reviewStatus: ReviewStatus;
  reviewedAt?: string;
};

export type SinCategoryDef = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  rightsCategory: RightsCategory;
  icon: string;
  color: string;
  topicSlugs: string[];
};

export type RepentanceGuideAnswer = {
  label: string;
  steps: string[];
  notes?: string[];
  needsScholar?: boolean;
};

export type RepentanceQuestion = {
  id: string;
  question: string;
  options: { value: string; label: string }[];
  nextQuestion?: (value: string) => string | null;
  answer?: (value: string) => RepentanceGuideAnswer | null;
};

export type SelfAccountabilityItem = {
  id: string;
  category: string;
  title: string;
  status: "not_started" | "in_progress" | "done";
  notes?: string;
};
