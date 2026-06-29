/** Verified field — only displayed publicly when verified=true and value is non-empty. */
export type VerifiedField<T = string> = {
  value: T;
  verified: boolean;
  source?: string;
};

export type OfficialAccount = { platform: string; url: string };

export type ScholarBiographyData = {
  full_name?: VerifiedField;
  birth_date?: VerifiedField;
  birth_place?: VerifiedField;
  nationality?: VerifiedField;
  qualifications?: VerifiedField<string[]>;
  certificates?: VerifiedField<string[]>;
  teachers?: VerifiedField<string[]>;
  students?: VerifiedField<string[]>;
  ijazat?: VerifiedField<string[]>;
  notable_works?: VerifiedField<string[]>;
  positions?: VerifiedField<string[]>;
  dawah_activity?: VerifiedField;
  publications?: VerifiedField<string[]>;
  scientific_contributions?: VerifiedField<string[]>;
  awards?: VerifiedField<string[]>;
  official_websites?: VerifiedField<string[]>;
  official_accounts?: VerifiedField<OfficialAccount[]>;
  extended_bio?: VerifiedField;
};

export type BiographyStatus = "draft" | "review" | "published" | "archived";

export type LifeStatus = "alive" | "deceased" | "unknown";

export type ScholarProfile = {
  id: string;
  name: string;
  fullName?: string;
  kunya?: string;
  title?: string;
  bio?: string;
  biography?: string;
  city?: string;
  country?: string;
  nationality?: string;
  life_status?: LifeStatus | null;
  ijazah?: string;
  role?: string;
  specialties?: string[];
  qualifications?: string[];
  years_experience?: number | null;
  photo_url?: string;
  image_url?: string;
  is_verified?: boolean;
  biography_data?: ScholarBiographyData;
  biography_status?: BiographyStatus;
  biography_sources?: { url?: string; label?: string; fetched_at?: string }[];
  official_website?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  facebook_url?: string;
  telegram_url?: string;
  links?: { label: string; url: string }[];
  subjects?: string[];
  mutoon?: string[];
  keywords?: string[];
};

export type BiographySectionDef = {
  key: keyof ScholarBiographyData | "_legacy";
  label: string;
  type: "text" | "list" | "accounts";
};

export const BIOGRAPHY_SECTIONS: BiographySectionDef[] = [
  { key: "full_name", label: "الاسم الكامل", type: "text" },
  { key: "birth_date", label: "تاريخ الميلاد", type: "text" },
  { key: "birth_place", label: "مكان الميلاد", type: "text" },
  { key: "nationality", label: "الجنسية", type: "text" },
  { key: "qualifications", label: "المؤهلات العلمية", type: "list" },
  { key: "certificates", label: "الشهادات", type: "list" },
  { key: "teachers", label: "أبرز المشايخ الذين درس عليهم", type: "list" },
  { key: "students", label: "أبرز التلاميذ", type: "list" },
  { key: "ijazat", label: "الإجازات العلمية", type: "list" },
  { key: "notable_works", label: "أبرز الأعمال", type: "list" },
  { key: "positions", label: "المناصب", type: "list" },
  { key: "dawah_activity", label: "النشاط الدعوي", type: "text" },
  { key: "publications", label: "المؤلفات", type: "list" },
  { key: "scientific_contributions", label: "المشاركات العلمية", type: "list" },
  { key: "awards", label: "الجوائز", type: "list" },
  { key: "official_websites", label: "المواقع الرسمية", type: "list" },
  { key: "official_accounts", label: "الحسابات الرسمية", type: "accounts" },
  { key: "extended_bio", label: "نبذة موسعة", type: "text" },
];
