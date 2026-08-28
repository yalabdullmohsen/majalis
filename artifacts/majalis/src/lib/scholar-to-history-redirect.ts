/** تحويل معرّفات /scholars القديمة إلى عناصر التاريخ الإسلامي عند الإمكان. */
const LEGACY_SCHOLAR_TO_HISTORY: Record<string, string> = {
  tabari: "abbasid-house-of-wisdom",
  "ibn-kathir": "mamluk-rise",
  dhahabi: "mamluk-rise",
  "ibn-hajar": "mamluk-rise",
  "ibn-khaldun": "andalus-fall-granada",
  "ibn-al-athir": "battle-hattin",
};

export function redirectScholarPath(id?: string | null): string {
  if (!id) return "/tarikh-islami";
  const key = decodeURIComponent(String(id).trim());
  const mapped = LEGACY_SCHOLAR_TO_HISTORY[key];
  if (mapped) return `/tarikh-islami/${mapped}`;
  if (key.startsWith("pers-")) return "/library";
  return "/tarikh-islami";
}
