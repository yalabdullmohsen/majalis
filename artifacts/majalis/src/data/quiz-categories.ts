/** تصنيفات لعبة الاختبار فقط — ملف خفيف بلا بنك الأسئلة. */
export type GameCategory = {
  id: string;
  name: string;
  icon: string;
};

export const GAME_CATEGORIES: GameCategory[] = [
  { id: "quran", name: "القرآن الكريم", icon: "book-open" },
  { id: "hadith", name: "الحديث الشريف", icon: "scroll-text" },
  { id: "sira", name: "السيرة النبوية", icon: "moon" },
  { id: "anbiya", name: "قصص الأنبياء", icon: "star" },
  { id: "fiqh", name: "الفقه", icon: "scale" },
  { id: "aqeeda", name: "العقيدة", icon: "building-2" },
  { id: "tarikh", name: "التاريخ الإسلامي", icon: "landmark" },
  { id: "akhlaq", name: "الأخلاق والصحابة", icon: "gem" },
];
