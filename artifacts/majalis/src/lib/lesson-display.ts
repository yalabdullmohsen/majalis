const KUWAIT_DAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

export type LessonScheduleParts = {
  day: string;
  time: string;
  dateLabel: string;
};

function formatKuwaitDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-KW", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function extractLessonSchedule(lesson: {
  schedule?: string;
  day_of_week?: string;
  lesson_time?: string;
  start_date?: string;
  end_date?: string;
}): LessonScheduleParts {
  const day =
    lesson.day_of_week?.trim() ||
    KUWAIT_DAYS.find((d) => lesson.schedule?.includes(d)) ||
    "";

  let time = lesson.lesson_time?.trim() || "";
  if (!time && lesson.schedule?.trim()) {
    const parts = lesson.schedule.trim().split(/\s+/);
    if (parts.length > 1) {
      time = parts.slice(1).join(" ");
    } else if (!day) {
      time = parts[0];
    }
  }

  let dateLabel = "";
  if (lesson.start_date) {
    const parsed = new Date(`${lesson.start_date}T12:00:00+03:00`);
    if (!Number.isNaN(parsed.getTime())) {
      dateLabel = formatKuwaitDate(parsed);
    }
  } else if (day) {
    dateLabel = day;
  }

  return { day, time, dateLabel };
}

export function hasValue(value?: string | null): value is string {
  return Boolean(value?.trim());
}
