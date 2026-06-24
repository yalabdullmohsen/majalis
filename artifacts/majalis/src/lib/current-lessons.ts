export type AnnouncementTemplate =
  | "weekly-lesson"
  | "course"
  | "weekly-schedule"
  | "single-lecture";

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
  courseId?: string;
  template: AnnouncementTemplate;
  /** Arabic label shown on poster ribbon */
  announcementType: string;
  sheikhName: string;
  sheikh_image_url?: string;
  /** @deprecated use sheikh_image_url */
  sheikhImage?: string;
  title: string;
  description: string;
  day: string;
  time: string;
  mosque: string;
  region: string;
  streamUrl?: string;
  bookUrl?: string;
  mapsUrl?: string;
  mosque_qr_url?: string;
  book_qr_url?: string;
  live_qr_url?: string;
  /** @deprecated use mosque_qr_url */
  mosqueMapQrUrl?: string;
  /** @deprecated use book_qr_url */
  bookQrUrl?: string;
  startDate?: string;
  endDate?: string;
  /** e.g. "مستمر" — overrides formatted date range */
  periodLabel?: string;
  weeklySchedule: WeeklySlot[];
  curriculum?: string[];
  lectures?: CourseLecture[];
  featured?: boolean;
  category?: string;
};

export type Course = {
  id: string;
  title: string;
  sheikhName: string;
  sheikh_image_url?: string;
  sheikhImage?: string;
  description: string;
  mosque: string;
  region: string;
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
  weeklySchedule: WeeklySlot[];
  lectures: CourseLecture[];
  curriculum?: string[];
  streamUrl?: string;
  bookUrl?: string;
  mapsUrl?: string;
  lessons: CurrentLesson[];
};

export const TEMPLATE_LABELS: Record<AnnouncementTemplate, string> = {
  "weekly-lesson": "قالب درس أسبوعي",
  course: "قالب دورة علمية",
  "weekly-schedule": "قالب جدول أسبوعي",
  "single-lecture": "قالب محاضرة واحدة",
};

function mapsLink(mosque: string, region: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mosque} ${region} الكويت`)}`;
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

export function formatPeriod(lesson: Pick<CurrentLesson, "startDate" | "endDate" | "periodLabel">) {
  if (lesson.periodLabel) return lesson.periodLabel;
  if (lesson.startDate && lesson.endDate) {
    return `من ${fmtDate(lesson.startDate)} إلى ${fmtDate(lesson.endDate)}`;
  }
  if (lesson.startDate) return `يبدأ ${fmtDate(lesson.startDate)}`;
  return "مستمر";
}

export function formatWeeklySchedule(slots: WeeklySlot[]) {
  return slots.map((s) => `${s.day} — ${s.time}`).join(" · ");
}

export function resolveSheikhImage(lesson: Pick<CurrentLesson, "sheikh_image_url" | "sheikhImage">) {
  return lesson.sheikh_image_url || lesson.sheikhImage;
}

export function resolveMosqueQr(lesson: Pick<CurrentLesson, "mosque_qr_url" | "mosqueMapQrUrl">) {
  return lesson.mosque_qr_url || lesson.mosqueMapQrUrl;
}

export function resolveBookQr(lesson: Pick<CurrentLesson, "book_qr_url" | "bookQrUrl">) {
  return lesson.book_qr_url || lesson.bookQrUrl;
}

export const DEMO_CURRENT_LESSONS: CurrentLesson[] = [
  {
    id: "ann-1",
    courseId: "course-tafsir-nahl",
    template: "weekly-lesson",
    announcementType: "درس أسبوعي",
    sheikhName: "عثمان بن محمد الخميس",
    title: "تفسير سورة النحل",
    description:
      "درس أسبوعي في تفسير سورة النحل مع فضيلة الشيخ عثمان الخميس، يركز على معاني الآيات وأحكامها وربطها بالواقع.",
    day: "الجمعة",
    time: "بعد المغرب",
    mosque: "مسجد موضي",
    region: "الفروانية",
    mapsUrl: mapsLink("مسجد موضي", "الفروانية"),
    startDate: "2026-01-10",
    endDate: "2026-06-30",
    category: "تفسير",
    featured: true,
    weeklySchedule: [{ day: "الجمعة", time: "بعد المغرب" }],
    lectures: [
      { id: "l1", title: "مقدمة سورة النحل", day: "الجمعة", time: "بعد المغرب", date: "2026-01-10" },
      { id: "l2", title: "تفسير الآيات 1–10", day: "الجمعة", time: "بعد المغرب", date: "2026-01-17" },
      { id: "l3", title: "تفسير الآيات 11–20", day: "الجمعة", time: "بعد المغرب", date: "2026-01-24" },
      { id: "l4", title: "تفسير الآيات 21–30", day: "الجمعة", time: "بعد المغرب", date: "2026-01-31" },
    ],
  },
  {
    id: "ann-2",
    courseId: "course-muqni",
    template: "weekly-lesson",
    announcementType: "درس أسبوعي",
    sheikhName: "عثمان بن محمد الخميس",
    title: "شرح كتاب تلخيص مختصر المقنع",
    description:
      "درس أسبوعي في شرح كتاب تلخيص مختصر المقنع، باب الشروط في النكاح — القسم الثاني.",
    day: "الأربعاء",
    time: "بعد المغرب",
    mosque: "مسجد الياقوت",
    region: "الصديق",
    mapsUrl: mapsLink("مسجد الياقوت", "الصديق"),
    periodLabel: "مستمر",
    category: "فقه",
    featured: true,
    weeklySchedule: [{ day: "الأربعاء", time: "بعد المغرب" }],
    lectures: [
      { id: "m1", title: "مقدمة الكتاب وطريقة المؤلف", day: "الأربعاء", time: "بعد المغرب" },
      { id: "m2", title: "باب الطهارة — الوضوء", day: "الأربعاء", time: "بعد المغرب" },
      { id: "m3", title: "باب الطهارة — الغسل والتيمم", day: "الأربعاء", time: "بعد المغرب" },
      { id: "m4", title: "باب الصلاة — شروط الصلاة", day: "الأربعاء", time: "بعد المغرب" },
    ],
  },
  {
    id: "ann-3",
    courseId: "course-taaseel",
    template: "course",
    announcementType: "دورة علمية",
    sheikhName: "راشد طليم فهد الطليم",
    title: "الدورة العلمية التأصيلية",
    description: "دورة علمية تأصيلية في عدد من المتون الشرعية.",
    day: "الاثنين",
    time: "قبل المغرب بساعة، بعد المغرب، بعد العشاء",
    mosque: "مسجد أبي واقد الليثي",
    region: "القيروان",
    mapsUrl: mapsLink("مسجد أبي واقد الليثي", "القيروان"),
    periodLabel: "مستمر",
    featured: true,
    weeklySchedule: [
      { day: "الاثنين", time: "قبل المغرب بساعة" },
      { day: "الاثنين", time: "بعد المغرب" },
      { day: "الاثنين", time: "بعد العشاء" },
    ],
    curriculum: [
      "بلوغ المرام من أدلة الأحكام",
      "القواعد المثلى في صفات الله وأسمائه الحسنى",
      "قراءة في كتاب دعوى تعارض السنة النبوية مع العلم التجريبي",
    ],
    lectures: [
      { id: "t1", title: "بلوغ المرام من أدلة الأحكام", day: "الاثنين", time: "قبل المغرب بساعة" },
      { id: "t2", title: "القواعد المثلى في صفات الله وأسمائه الحسنى", day: "الاثنين", time: "بعد المغرب" },
      {
        id: "t3",
        title: "قراءة في كتاب دعوى تعارض السنة النبوية مع العلم التجريبي",
        day: "الاثنين",
        time: "بعد العشاء",
      },
    ],
  },
];

export const FEATURED_ANNOUNCEMENTS = DEMO_CURRENT_LESSONS.filter((a) => a.featured).slice(0, 3);

export const DEMO_COURSES: Course[] = [
  {
    id: "course-tafsir-nahl",
    title: "تفسير سورة النحل",
    sheikhName: DEMO_CURRENT_LESSONS[0].sheikhName,
    description: DEMO_CURRENT_LESSONS[0].description,
    mosque: "مسجد موضي",
    region: "الفروانية",
    startDate: "2026-01-10",
    endDate: "2026-06-30",
    weeklySchedule: DEMO_CURRENT_LESSONS[0].weeklySchedule,
    lectures: DEMO_CURRENT_LESSONS[0].lectures ?? [],
    mapsUrl: DEMO_CURRENT_LESSONS[0].mapsUrl,
    lessons: [DEMO_CURRENT_LESSONS[0]],
  },
  {
    id: "course-muqni",
    title: "شرح كتاب تلخيص مختصر المقنع",
    sheikhName: DEMO_CURRENT_LESSONS[1].sheikhName,
    description: DEMO_CURRENT_LESSONS[1].description,
    mosque: "مسجد الياقوت",
    region: "الصديق",
    periodLabel: "مستمر",
    weeklySchedule: DEMO_CURRENT_LESSONS[1].weeklySchedule,
    lectures: DEMO_CURRENT_LESSONS[1].lectures ?? [],
    mapsUrl: DEMO_CURRENT_LESSONS[1].mapsUrl,
    lessons: [DEMO_CURRENT_LESSONS[1]],
  },
  {
    id: "course-taaseel",
    title: "الدورة العلمية التأصيلية",
    sheikhName: DEMO_CURRENT_LESSONS[2].sheikhName,
    description: DEMO_CURRENT_LESSONS[2].description,
    mosque: "مسجد أبي واقد الليثي",
    region: "القيروان",
    periodLabel: "مستمر",
    weeklySchedule: DEMO_CURRENT_LESSONS[2].weeklySchedule,
    curriculum: DEMO_CURRENT_LESSONS[2].curriculum,
    lectures: DEMO_CURRENT_LESSONS[2].lectures ?? [],
    mapsUrl: DEMO_CURRENT_LESSONS[2].mapsUrl,
    lessons: [DEMO_CURRENT_LESSONS[2]],
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
  filters: LessonFilters,
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
  const uniq = (vals: string[]) => ["الكل", ...Array.from(new Set(vals)).sort((a, b) => a.localeCompare(b, "ar"))];
  return {
    sheikhs: uniq(lessons.map((l) => l.sheikhName)),
    mosques: uniq(lessons.map((l) => l.mosque)),
    regions: uniq(lessons.map((l) => l.region)),
    days: uniq(lessons.map((l) => l.day)),
  };
}

export function sheikhInitial(name: string) {
  const cleaned = name
    .replace(/^(الشيخ|فضيلة|فضيلة الشيخ)\s+/u, "")
    .replace(/[^\u0600-\u06FFa-zA-Z]/g, "")
    .trim();
  return cleaned.charAt(0) || "ش";
}

/** @deprecated use SheikhAvatar component */
export function sheikhAvatarUrl(name: string, image?: string) {
  if (image) return image;
  const initial = sheikhInitial(name);
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#164E3C"/>
          <stop offset="100%" stop-color="#1F6E54"/>
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="118" fill="url(#g)" stroke="#B08D2E" stroke-width="4"/>
      <text x="120" y="138" text-anchor="middle" fill="#FAF5EA" font-size="88" font-family="Amiri, serif">${initial}</text>
    </svg>`,
  )}`;
}

export function buildCalendarIcs(lesson: CurrentLesson): string {
  const dt = (lesson.startDate ?? "20260101").replace(/-/g, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Majalis//Lesson Announcements//AR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${lesson.id}@majalis`,
    `DTSTAMP:${dt}T120000Z`,
    `DTSTART;VALUE=DATE:${dt}`,
    `SUMMARY:${lesson.title} — ${lesson.sheikhName}`,
    `DESCRIPTION:${lesson.description.replace(/\n/g, " ")}`,
    `LOCATION:${lesson.mosque}، ${lesson.region}`,
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
  a.download = `إعلان-${lesson.title}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildShareText(lesson: CurrentLesson) {
  const lines = [
    lesson.announcementType,
    `فضيلة الشيخ ${lesson.sheikhName}`,
    lesson.title,
    `${lesson.day} — ${lesson.time}`,
    `${lesson.mosque} — ${lesson.region}`,
    formatPeriod(lesson),
    formatWeeklySchedule(lesson.weeklySchedule),
  ];
  return lines.filter(Boolean).join("\n");
}

export async function shareAnnouncement(lesson: CurrentLesson) {
  const text = buildShareText(lesson);
  const shareData = { title: lesson.title, text };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ ...shareData, url: window.location.href });
      return;
    } catch {
      /* user cancelled or unsupported payload */
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    alert("تم نسخ نص الإعلان.");
    return;
  }

  alert(text);
}

export function getCourseById(id: string) {
  return DEMO_COURSES.find((c) => c.id === id);
}

export function getLessonById(id: string) {
  return DEMO_CURRENT_LESSONS.find((l) => l.id === id);
}
