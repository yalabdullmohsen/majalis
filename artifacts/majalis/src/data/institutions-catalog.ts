/** كتالوج المؤسسات الإسلامية — مصدر بيانات صفحة الدليل. */
export type InstitutionType = "mosque" | "center" | "university" | "library";

export type InstitutionContentStatus =
  | "draft"
  | "needs_review"
  | "verified"
  | "published"
  | "archived";

export type Institution = {
  id: string;
  name: string;
  type: InstitutionType;
  city: string;
  country: string;
  description: string;
  website?: string;
  mapQuery?: string;
  /** رابط المصدر (غالبًا الموقع الرسمي) — لا يعني اكتمال التحقق البشري */
  sourceUrl?: string;
  sourceType?: "official_website" | "unknown" | string;
  /** لا تُضبط إلى verified دون مراجعة بشرية مؤرخة */
  contentStatus?: InstitutionContentStatus;
};

import raw from "./institutions-catalog.json";

export const INSTITUTIONS: Institution[] = raw as Institution[];

/** مواقع مميزة لشريط Discover — دون تعديل نصوص الكتالوج. */
export const FEATURED_INSTITUTION_IDS = [
  "masjid-haram",
  "masjid-nabawi",
  "masjid-aqsa",
  "al-azhar-mosque-inst",
  "medina-university",
  "qarawiyyin",
] as const;

export function getInstitutionById(id: string): Institution | undefined {
  return INSTITUTIONS.find((inst) => inst.id === id);
}

export function getFeaturedInstitutions(): Institution[] {
  return FEATURED_INSTITUTION_IDS.map((id) => getInstitutionById(id)).filter(
    (inst): inst is Institution => Boolean(inst),
  );
}

export const INSTITUTION_COUNTRIES: string[] = [
  "الكل",
  ...Array.from(new Set(INSTITUTIONS.map((i) => i.country))).sort((a, b) =>
    a.localeCompare(b, "ar"),
  ),
];
