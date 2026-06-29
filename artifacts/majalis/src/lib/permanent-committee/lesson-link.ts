/** Map lesson metadata to Permanent Committee categories for cross-linking. */
const LESSON_CATEGORY_MAP: Record<string, string> = {
  زكاة: "الزكاة",
  الزكاة: "الزكاة",
  صلاة: "الصلاة",
  الصلاة: "الصلاة",
  صيام: "الصيام",
  الصيام: "الصيام",
  رمضان: "الصيام",
  حج: "الحج والعمرة",
  عمرة: "الحج والعمرة",
  عقيدة: "العقيدة",
  توحيد: "التوحيد",
  تفسير: "التفسير",
  حديث: "الحديث",
  فقه: "الفقه",
  معاملات: "المعاملات",
  أسرة: "الأسرة",
  نكاح: "الأسرة",
  طلاق: "الأسرة",
  دعوة: "الدعوة",
  أخلاق: "الأخلاق",
  آداب: "الآداب",
};

const KEYWORD_CATEGORY_RULES: Array<[string, string]> = [
  ["زكا", "الزكاة"],
  ["زكوة", "الزكاة"],
  ["صلا", "الصلاة"],
  ["جمعة", "الصلاة"],
  ["صيام", "الصيام"],
  ["رمضان", "الصيام"],
  ["حج", "الحج والعمرة"],
  ["عمرة", "الحج والعمرة"],
  ["نكاح", "الأسرة"],
  ["طلاق", "الأسرة"],
  ["ميراث", "الأسرة"],
  ["توحيد", "التوحيد"],
  ["عقيد", "العقيدة"],
  ["تفسير", "التفسير"],
  ["حديث", "الحديث"],
  ["بيع", "البيوت"],
  ["ربا", "المعاملات"],
  ["تيمم", "العبادات"],
  ["وضو", "العبادات"],
];

export function inferPcCategoryFromLesson(lesson: {
  category?: string | null;
  title?: string | null;
  description?: string | null;
}): string | undefined {
  const cat = (lesson.category || "").trim();
  if (cat && LESSON_CATEGORY_MAP[cat]) return LESSON_CATEGORY_MAP[cat];

  const blob = `${lesson.title || ""} ${lesson.description || ""} ${cat}`;
  for (const [needle, pcCat] of KEYWORD_CATEGORY_RULES) {
    if (blob.includes(needle)) return pcCat;
  }
  return cat || undefined;
}

export function buildPcSearchQueryFromLesson(lesson: {
  title?: string | null;
  category?: string | null;
  description?: string | null;
}): string {
  const parts = [lesson.title, lesson.category, lesson.description].filter(Boolean);
  return parts.join(" ").slice(0, 120);
}
