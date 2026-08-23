import { countPublishedCompetitions } from "@/lib/competitions";

/** عدد إعلانات المسابقات الخارجية المنشورة (ليس أسئلة داخل التطبيق). */
export function totalExternalCompetitions(): number {
  return countPublishedCompetitions();
}

/** @deprecated استخدم totalExternalCompetitions */
export function totalCompetitionQuestions(): number {
  return totalExternalCompetitions();
}
