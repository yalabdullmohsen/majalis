import type { AnnualCourse } from "./platform-types";

export const ANNUAL_COURSES_SEED: AnnualCourse[] = [
  {
    id: "course-ijazah-tahrir-2026",
    external_key: "course-ijazah-tahrir-2026",
    title: "دورة الإجازة في التحرير — 1447هـ",
    summary: "دورة سنوية لإجازة طلاب العلم في متن التحرير في أصول الفقه.",
    body: `**عن الدورة:**
دورة علمية سنوية تُقام لإجازة طلاب العلم في متن «التحرير في أصول الفقه» للإمام ابن تيمية رحمه الله.

**المتون:**
- التحرير في أصول الفقه
- مختصر التحرير

**البرنامج:**
- دروس أسبوعية
- اختبارات شهرية
- مجلس إجازة في ختام الدورة`,
    course_type: "سنوية",
    season: "1447هـ",
    year: 2026,
    sheikh_names: ["د. عثمان الخميس", "د. سالم الطويل"],
    mutoon: ["التحرير في أصول الفقه", "مختصر التحرير"],
    schedule: [
      { day: "السبت", time: "بعد المغرب", topic: "شرح المتن", sheikh: "د. عثمان الخميس" },
      { day: "الثلاثاء", time: "بعد العشاء", topic: "مسائل تطبيقية", sheikh: "د. سالم الطويل" },
    ],
    venue_name: "مسجد الصحابة",
    venue_address: "الجابرية، شارع 10",
    venue_city: "الكويت",
    map_url: "https://maps.google.com/?q=مسجد+الصحابة+الكويت",
    registration_url: "/lessons?tab=courses",
    registration_open: true,
    start_date: "2026-01-15",
    end_date: "2026-12-20",
    keywords: ["إجازة", "تحرير", "أصول", "دورة"],
    status: "approved",
    view_count: 890,
    created_at: "2025-12-01T08:00:00Z",
  },
  {
    id: "course-ramadan-intensive",
    external_key: "course-ramadan-intensive",
    title: "البرنامج العلمي الرمضاني",
    summary: "برنامج موسمي يومي في رمضان — تفسير وحديث وفقه.",
    body: `**البرنامج الرمضاني:**
- تفسير جزء يومياً
- درس حديث بعد العصر
- فقه الصيام والتراويح`,
    course_type: "موسمية",
    season: "رمضان 1447",
    year: 2026,
    sheikh_names: ["د. راشد السليم", "د. منصور الخالدي"],
    mutoon: ["تفسير ابن كثير", "رياض الصالحين"],
    schedule: [
      { day: "يومياً", time: "بعد التراويح", topic: "تفسير", sheikh: "د. راشد السليم" },
      { day: "يومياً", time: "بعد العصر", topic: "حديث", sheikh: "د. منصور الخالدي" },
    ],
    venue_name: "مسجد الإمام مالك",
    venue_city: "الكويت",
    registration_open: true,
    start_date: "2026-02-28",
    end_date: "2026-03-29",
    keywords: ["رمضان", "تفسير", "برنامج"],
    status: "approved",
    view_count: 1200,
    created_at: "2025-11-15T07:00:00Z",
  },
  {
    id: "course-alfiqh-almuqaran",
    external_key: "course-alfiqh-almuqaran",
    title: "برنامج الفقه المقارن",
    summary: "برنامج علمي لمقارنة المذاهب في المسائل الفقهية المعاصرة.",
    course_type: "برنامج",
    season: "1446-1447",
    year: 2025,
    sheikh_names: ["د. حامد المسعد"],
    mutoon: ["الفقه المقارن"],
    venue_name: "مركز المجلس العلمي",
    venue_city: "الكويت",
    registration_open: false,
    keywords: ["فقه", "مقارن", "مذاهب"],
    status: "approved",
    view_count: 560,
    created_at: "2025-09-01T06:00:00Z",
  },
  {
    id: "mutoon-alfiyyah",
    external_key: "mutoon-alfiyyah",
    title: "متن الألفية في النحو",
    summary: "حلقة علمية لحفظ وشرح متن الألفية.",
    course_type: "متن",
    year: 2026,
    sheikh_names: ["د. أسامة الشatti"],
    mutoon: ["ألفية ابن مالك"],
    schedule: [{ day: "الأحد", time: "بعد الفجر", topic: "حفظ وشرح", sheikh: "د. أسامة الشatti" }],
    venue_city: "الكويت",
    registration_open: true,
    keywords: ["ألفية", "نحو", "متن"],
    status: "approved",
    view_count: 430,
    created_at: "2025-10-20T05:00:00Z",
  },
];

export function findAnnualCourseById(id: string) {
  return ANNUAL_COURSES_SEED.find((c) => c.id === id || c.external_key === id) || null;
}
