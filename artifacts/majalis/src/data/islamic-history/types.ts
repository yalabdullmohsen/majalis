export type HistoryCategory =
  | "seerah"
  | "rashidun"
  | "umayyad"
  | "abbasid"
  | "andalus"
  | "seljuk-ayyubid"
  | "mamluk"
  | "ottoman"
  | "civilization"
  | "modern";

export type HistoryKind = "era" | "event" | "institution" | "city";

export type VerificationLevel = "confirmed" | "likely" | "disputed" | "needs-review";

export type IslamicHistoryItem = {
  id: string;
  title: string;
  kind: HistoryKind;
  category: HistoryCategory;
  era: string;
  hijriDate?: string;
  gregorianDate?: string;
  place?: string;
  relatedPersons?: string[];
  summary: string;
  detail: string;
  causes?: string;
  outcomes?: string;
  lessons?: string;
  sources: string[];
  verification: VerificationLevel;
  relatedLinks?: Array<{ href: string; label: string }>;
  /** رابط بوابة لقسم تفصيلي (مثل السيرة) بدل تكرار المحتوى في الخط الزمني */
  portalHref?: string;
  portalLabel?: string;
  /** ترتيب الخط الزمني من قبل البعثة إلى يومنا */
  timelineOrder?: number;
  featured?: boolean;
  startHere?: boolean;
};
