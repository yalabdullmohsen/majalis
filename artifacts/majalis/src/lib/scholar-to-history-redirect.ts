/** تحويل معرّفات /scholars القديمة إلى عناصر التاريخ أو المذاهب عند الإمكان. */
const LEGACY_SCHOLAR_TO_HISTORY: Record<string, string> = {
  tabari: "abbasid-house-of-wisdom",
  "ibn-kathir": "mamluk-rise",
  dhahabi: "mamluk-rise",
  "ibn-hajar": "mamluk-rise",
  "ibn-khaldun": "andalus-fall-granada",
  "ibn-al-athir": "battle-hattin",
};

/** مسارات بديلة (ليست عناصر تاريخ) — 301 في vercel + توجيه العميل. */
const LEGACY_SCHOLAR_TO_PATH: Record<string, string> = {
  malik: "/madhahib",
  "imam-malik": "/madhahib",
  nawawi: "/arbaeen-nawawi",
  "al-nawawi": "/arbaeen-nawawi",
  "imam-nawawi": "/arbaeen-nawawi",
  shafi: "/madhahib",
  shafii: "/madhahib",
  "al-shafi": "/madhahib",
  "al-shafii": "/madhahib",
  "imam-shafi": "/madhahib",
  hanbali: "/madhahib",
  hanafi: "/madhahib",
  "abu-hanifa": "/madhahib",
  "ahmad-ibn-hanbal": "/madhahib",
};

export function redirectScholarPath(id?: string | null): string {
  if (!id) return "/tarikh-islami";
  const key = decodeURIComponent(String(id).trim()).toLowerCase();
  const direct = LEGACY_SCHOLAR_TO_PATH[key];
  if (direct) return direct;
  const mapped = LEGACY_SCHOLAR_TO_HISTORY[key];
  if (mapped) return `/tarikh-islami/${mapped}`;
  if (key.startsWith("pers-")) return "/library";
  return "/tarikh-islami";
}
