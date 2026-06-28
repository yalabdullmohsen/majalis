import type { MutoonText } from "./platform-types";

export const MUTOON_SEED: MutoonText[] = [
  {
    id: "alfiyyah-ibn-malik",
    external_key: "seed:mutoon-alfiyyah",
    slug: "alfiyyah-ibn-malik",
    title: "ألفية ابن مالك",
    author: "ابن مالك",
    summary: "منظومة في النحو — أشهر متون اللغة العربية.",
    category: "منظومة",
    level: "متوسط",
    total_pages: 1000,
    total_lessons: 50,
    status: "approved",
  },
  {
    id: "tuhfatul-atfal",
    external_key: "seed:mutoon-tuhfatul-atfal",
    slug: "tuhfatul-atfal",
    title: "تحفة الأطفال",
    author: "سليمان الجمل",
    summary: "متن مختصر في التجويد.",
    category: "متن",
    level: "مبتدئ",
    total_pages: 40,
    total_lessons: 12,
    status: "approved",
  },
  {
    id: "arbaeen-nawawi",
    external_key: "seed:mutoon-arbaeen-nawawi",
    slug: "arbaeen-nawawi",
    title: "الأربعون النووية",
    author: "النووي",
    summary: "أربعون حديثاً من أصول الدين.",
    category: "متن",
    level: "مبتدئ",
    total_pages: 80,
    total_lessons: 40,
    status: "approved",
  },
];

export function findMutoonById(id: string): MutoonText | null {
  return MUTOON_SEED.find((m) => m.id === id || m.external_key === id || m.slug === id) || null;
}
