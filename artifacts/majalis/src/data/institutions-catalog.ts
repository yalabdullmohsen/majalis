/** كتالوج المؤسسات الإسلامية — مصدر بيانات صفحة الدليل. */
export type InstitutionType = "mosque" | "center" | "university" | "library";

export type Institution = {
  id: string;
  name: string;
  type: InstitutionType;
  city: string;
  country: string;
  description: string;
  website?: string;
  mapQuery?: string;
};

import raw from "./institutions-catalog.json";

export const INSTITUTIONS: Institution[] = raw as Institution[];
