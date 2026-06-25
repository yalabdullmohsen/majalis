import type { PlatformUpdate } from "./platform-types";

export const UPDATES_SEED: PlatformUpdate[] = [
  {
    id: "update-fiqh-crypto",
    title: "قرار جديد: حكم التعامل بالعملات الرقمية",
    summary: "صدر قرار المجمع الفقهي بشأن العملات الرقمية.",
    update_type: "قرار",
    source_type: "fiqh_decision",
    source_id: "fiqh-crypto-2024",
    source_url: "/fiqh-council/fiqh-crypto-2024",
    published_at: "2024-03-15T10:00:00Z",
    status: "approved",
  },
  {
    id: "update-fatwa-travel",
    title: "فتوى جديدة: الإفطار للمسافر في رمضان",
    summary: "إضافة فتوى حول جواز الإفطار للمسافر.",
    update_type: "فتوى",
    source_type: "fatwa",
    source_id: "fatwa-fasting-travel",
    source_url: "/fatwa/fatwa-fasting-travel",
    published_at: "2024-02-28T09:00:00Z",
    status: "approved",
  },
  {
    id: "update-course-ijazah",
    title: "فتح التسجيل: دورة الإجازة 1447هـ",
    summary: "بدء التسجيل في الدورة السنوية للإجازة.",
    update_type: "دورة",
    source_type: "annual_course",
    source_id: "course-ijazah-tahrir-2026",
    source_url: "/annual-courses/course-ijazah-tahrir-2026",
    published_at: "2025-12-01T08:00:00Z",
    status: "approved",
  },
  {
    id: "update-lesson-tafsir",
    title: "درس جديد: تفسير سورة النحل",
    summary: "انضم درس تفسير سورة النحل إلى جدول الدروس.",
    update_type: "درس",
    source_type: "lesson",
    source_id: "kw-othman-tafsir-nahl-0",
    source_url: "/lessons/kw-othman-tafsir-nahl-0",
    published_at: "2025-11-20T07:00:00Z",
    status: "approved",
  },
  {
    id: "update-library-book",
    title: "كتاب جديد: رياض الصالحين",
    summary: "إضافة كتاب رياض الصالحين إلى المكتبة العلمية.",
    update_type: "كتاب",
    source_type: "library",
    source_url: "/library",
    published_at: "2025-11-10T06:00:00Z",
    status: "approved",
  },
  {
    id: "update-announcement-ramadan",
    title: "إعلان: البرنامج العلمي الرمضاني 1447",
    summary: "إعلان عن بدء البرنامج العلمي في شهر رمضان.",
    update_type: "إعلان",
    source_url: "/annual-courses/course-ramadan-intensive",
    published_at: "2025-11-15T07:00:00Z",
    status: "approved",
  },
  {
    id: "update-news-conference",
    title: "خبر علمي: مؤتمر الفقه المعاصر",
    summary: "انعقاد مؤتمر الفقه المعاصر ونشر أبحاثه.",
    update_type: "خبر علمي",
    source_url: "/fiqh-council",
    published_at: "2025-10-01T05:00:00Z",
    status: "approved",
  },
];

export function getSortedUpdates(limit?: number) {
  const sorted = [...UPDATES_SEED].sort(
    (a, b) => (b.published_at || "").localeCompare(a.published_at || ""),
  );
  return limit ? sorted.slice(0, limit) : sorted;
}
