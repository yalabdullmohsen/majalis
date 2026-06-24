export type WeeklySlot = {
  day: string;
  time: string;
};

export type CourseLecture = {
  id: string;
  title: string;
  day?: string;
  time?: string;
  date?: string;
};

export type CurrentLesson = {
  id: string;
  courseId: string;
  sheikhName: string;
  sheikhImage?: string;
  title: string;
  description: string;
  day: string;
  time: string;
  mosque: string;
  region: string;
  streamUrl?: string;
  bookUrl?: string;
  mosqueMapQrUrl?: string;
  bookQrUrl?: string;
  mapsUrl?: string;
  startDate: string;
  endDate: string;
  weeklySchedule: WeeklySlot[];
  lectures: CourseLecture[];
  category?: string;
};

export type Course = {
  id: string;
  title: string;
  sheikhName: string;
  sheikhImage?: string;
  description: string;
  mosque: string;
  region: string;
  startDate: string;
  endDate: string;
  weeklySchedule: WeeklySlot[];
  lectures: CourseLecture[];
  streamUrl?: string;
  bookUrl?: string;
  mapsUrl?: string;
  lessons: CurrentLesson[];
};

const SHEIKH_OTHMAN = {
  sheikhName: "الشيخ عثمان الخميس",
  sheikhImage: undefined as string | undefined,
};

function qrFor(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(url)}`;
}

function mapsLink(mosque: string, region: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mosque} ${region} الكويت`)}`;
}

export const DEMO_CURRENT_LESSONS: CurrentLesson[] = [
  {
    id: "cl-1",
    courseId: "course-tafsir-nahl",
    ...SHEIKH_OTHMAN,
    title: "تفسير سورة النحل",
    description:
      "درس أسبوعي في تفسير سورة النحل مع الشيخ عثمان الخميس — يركّز على معاني الآيات وأحكامها وربطها بالواقع.",
    day: "الجمعة",
    time: "بعد المغرب",
    mosque: "مسجد موضي",
    region: "الفروانية",
    streamUrl: "https://youtube.com/@othmanalkhamis",
    bookUrl: "https://example.com/book/tafsir-nahl",
    mapsUrl: mapsLink("مسجد موضي", "الفروانية"),
    mosqueMapQrUrl: qrFor(mapsLink("مسجد موضي", "الفروانية")),
    bookQrUrl: qrFor("https://example.com/book/tafsir-nahl"),
    startDate: "2026-01-10",
    endDate: "2026-06-30",
    category: "تفسير",
    weeklySchedule: [{ day: "الجمعة", time: "بعد المغرب" }],
    lectures: [
      { id: "l1", title: "مقدمة سورة النحل", day: "الجمعة", time: "بعد المغرب", date: "2026-01-10" },
      { id: "l2", title: "تفسير الآيات 1–10", day: "الجمعة", time: "بعد المغرب", date: "2026-01-17" },
      { id: "l3", title: "تفسير الآيات 11–20", day: "الجمعة", time: "بعد المغرب", date: "2026-01-24" },
      { id: "l4", title: "تفسير الآيات 21–30", day: "الجمعة", time: "بعد المغرب", date: "2026-01-31" },
    ],
  },
  {
    id: "cl-2",
    courseId: "course-muqni",
    ...SHEIKH_OTHMAN,
    title: "تلخيص مختصر المقنع",
    description:
      "شرح مختصر لكتاب المقنع في الفقه الحنبلي — مناسب لطالب العلم الذي يريد ضبط المسائل الأصولية بأسلوب ميسّر.",
    day: "الأربعاء",
    time: "بعد المغرب",
    mosque: "مسجد الياقوت",
    region: "حولي",
    streamUrl: "https://youtube.com/@othmanalkhamis",
    bookUrl: "https://example.com/book/muqni",
    mapsUrl: mapsLink("مسجد الياقوت", "حولي"),
    mosqueMapQrUrl: qrFor(mapsLink("مسجد الياقوت", "حولي")),
    bookQrUrl: qrFor("https://example.com/book/muqni"),
    startDate: "2026-02-01",
    endDate: "2026-08-01",
    category: "فقه",
    weeklySchedule: [{ day: "الأربعاء", time: "بعد المغرب" }],
    lectures: [
      { id: "m1", title: "مقدمة الكتاب وطريقة المؤلف", day: "الأربعاء", time: "بعد المغرب", date: "2026-02-01" },
      { id: "m2", title: "باب الطهارة — الوضوء", day: "الأربعاء", time: "بعد المغرب", date: "2026-02-08" },
      { id: "m3", title: "باب الطهارة — الغسل والتيمم", day: "الأربعاء", time: "بعد المغرب", date: "2026-02-15" },
      { id: "m4", title: "باب الصلاة — شروط الصلاة", day: "الأربعاء", time: "بعد المغرب", date: "2026-02-22" },
    ],
  },
];

export const DEMO_COURSES: Course[] = [
  {
    id: "course-tafsir-nahl",
    title: "تفسير سورة النحل",
    ...SHEIKH_OTHMAN,
    description: DEMO_CURRENT_LESSONS[0].description,
    mosque: "مسجد موضي",
    region: "الفروانية",
    startDate: "2026-01-10",
    endDate: "2026-06-30",
    weeklySchedule: DEMO_CURRENT_LESSONS[0].weeklySchedule,
    lectures: DEMO_CURRENT_LESSONS[0].lectures,
    streamUrl: DEMO_CURRENT_LESSONS[0].streamUrl,
    bookUrl: DEMO_CURRENT_LESSONS[0].bookUrl,
    mapsUrl: DEMO_CURRENT_LESSONS[0].mapsUrl,
    lessons: [DEMO_CURRENT_LESSONS[0]],
  },
  {
    id: "course-muqni",
    title: "تلخيص مختصر المقنع",
    ...SHEIKH_OTHMAN,
    description: DEMO_CURRENT_LESSONS[1].description,
    mosque: "مسجد الياقوت",
    region: "حولي",
    startDate: "2026-02-01",
    endDate: "2026-08-01",
    weeklySchedule: DEMO_CURRENT_LESSONS[1].weeklySchedule,
    lectures: DEMO_CURRENT_LESSONS[1].lectures,
    streamUrl: DEMO_CURRENT_LESSONS[1].streamUrl,
    bookUrl: DEMO_CURRENT_LESSONS[1].bookUrl,
    mapsUrl: DEMO_CURRENT_LESSONS[1].mapsUrl,
    lessons: [DEMO_CURRENT_LESSONS[1]],
  },
];

export type LessonFilters = {
  sheikh?: string;
  mosque?: string;
  region?: string;
  day?: string;
};

export function filterCurrentLessons(
  lessons: CurrentLesson[],
  filters: LessonFilters
): CurrentLesson[] {
  return lessons.filter((l) => {
    if (filters.sheikh && filters.sheikh !== "الكل" && l.sheikhName !== filters.sheikh) return false;
    if (filters.mosque && filters.mosque !== "الكل" && l.mosque !== filters.mosque) return false;
    if (filters.region && filters.region !== "الكل" && l.region !== filters.region) return false;
    if (filters.day && filters.day !== "الكل" && l.day !== filters.day) return false;
    return true;
  });
}

export function getFilterOptions(lessons: CurrentLesson[]) {
  const uniq = (vals: string[]) => ["الكل", ...Array.from(new Set(vals)).sort()];
  return {
    sheikhs: uniq(lessons.map((l) => l.sheikhName)),
    mosques: uniq(lessons.map((l) => l.mosque)),
    regions: uniq(lessons.map((l) => l.region)),
    days: uniq(lessons.map((l) => l.day)),
  };
}

export function sheikhAvatarUrl(name: string, image?: string) {
  if (image) return image;
  const initial = name.replace(/[^\u0600-\u06FFa-zA-Z]/g, "").charAt(0) || "ش";
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#164E3C"/>
      <text x="100" y="118" text-anchor="middle" fill="#FAF5EA" font-size="72" font-family="serif">${initial}</text>
    </svg>`
  )}`;
}

export function buildCalendarIcs(lesson: CurrentLesson): string {
  const dt = lesson.startDate.replace(/-/g, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Majalis//Current Lessons//AR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${lesson.id}@majalis`,
    `DTSTAMP:${dt}T120000Z`,
    `DTSTART;VALUE=DATE:${dt}`,
    `SUMMARY:${lesson.title} — ${lesson.sheikhName}`,
    `DESCRIPTION:${lesson.description.replace(/\n/g, " ")}`,
    `LOCATION:${lesson.mosque}, ${lesson.region}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadCalendar(lesson: CurrentLesson) {
  const blob = new Blob([buildCalendarIcs(lesson)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${lesson.title}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getCourseById(id: string) {
  return DEMO_COURSES.find((c) => c.id === id);
}

export function getLessonById(id: string) {
  return DEMO_CURRENT_LESSONS.find((l) => l.id === id);
}
