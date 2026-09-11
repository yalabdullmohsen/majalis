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
