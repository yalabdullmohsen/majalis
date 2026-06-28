import type { QuranCircle } from "./platform-types";

export const QURAN_CIRCLES_SEED: QuranCircle[] = [
  {
    id: "tajweed-evening",
    external_key: "seed:quran-circle-tajweed",
    slug: "tajweed-evening",
    title: "حلقة تجويد مسائية",
    summary: "حلقة أسبوعية لتعليم أحكام التجويد وتحسين التلاوة.",
    circle_type: "تجويد",
    sheikh_name: "الشيخ أحمد العجمي",
    mosque: "مسجد الصباح",
    city: "العاصمة",
    day_of_week: "الثلاثاء",
    circle_time: "8:00 م",
    registration_open: true,
    status: "approved",
  },
  {
    id: "hifz-morning",
    external_key: "seed:quran-circle-hifz",
    slug: "hifz-morning",
    title: "حلقة حفظ القرآن",
    summary: "برنامج حفظ يومي مع مراجعة وتثبيت.",
    circle_type: "حفظ",
    sheikh_name: "الشيخ محمد المنصور",
    mosque: "مسجد فهد السالم",
    city: "حولي",
    day_of_week: "الأحد",
    circle_time: "6:00 ص",
    registration_open: true,
    status: "approved",
  },
];

export function findQuranCircleById(id: string): QuranCircle | null {
  return QURAN_CIRCLES_SEED.find((c) => c.id === id || c.external_key === id || c.slug === id) || null;
}
