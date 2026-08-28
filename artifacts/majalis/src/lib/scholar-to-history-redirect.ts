/** تحويل معرّفات /scholars القديمة إلى عناصر التاريخ الإسلامي عند الإمكان. */
const LEGACY_SCHOLAR_TO_HISTORY: Record<string, string> = {
  tabari: "pers-al-tabari",
  "ibn-kathir": "pers-ibn-kathir",
  dhahabi: "pers-al-dhahabi",
  "ibn-hajar": "pers-ibn-hajar",
  "ibn-khaldun": "pers-ibn-khaldun",
  "ibn-al-athir": "pers-ibn-al-athir",
};

export function redirectScholarPath(id?: string | null): string {
  if (!id) return "/tarikh-islami?tab=personalities";
  const key = decodeURIComponent(String(id).trim());
  const mapped = LEGACY_SCHOLAR_TO_HISTORY[key];
  if (mapped) return `/tarikh-islami/${mapped}`;
  return "/tarikh-islami?tab=personalities";
}
