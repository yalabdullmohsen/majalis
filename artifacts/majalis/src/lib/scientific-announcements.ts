import { format, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";
import {
  SCIENTIFIC_ANNOUNCEMENTS,
  type ScientificAnnouncement,
} from "./scientific-announcements-seed";

export type { ScientificAnnouncement, AnnouncementKind, BroadcastLink } from "./scientific-announcements-seed";
export { SCIENTIFIC_ANNOUNCEMENTS };

const DAY_MAP: Record<string, number> = {
  الأحد: 0,
  الاثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

export type ScientificCalendarEvent = {
  id: string;
  title: string;
  sheikh: string;
  mosque: string;
  time: string;
  day: string;
  date?: string;
  recurring: boolean;
  description?: string;
  href: string;
};

export function getScientificAnnouncements(): ScientificAnnouncement[] {
  return SCIENTIFIC_ANNOUNCEMENTS;
}

export function getScientificAnnouncementById(id: string): ScientificAnnouncement | undefined {
  return SCIENTIFIC_ANNOUNCEMENTS.find((item) => item.id === id);
}

export function getLocationLabel(item: ScientificAnnouncement): string {
  return item.mosque || item.venue || "غير محدد";
}

export function formatAnnouncementDate(item: ScientificAnnouncement): string {
  if (!item.date) return "غير محدد";
  try {
    return format(parseISO(item.date), "EEEE d MMMM yyyy", { locale: arSA });
  } catch {
    return item.date;
  }
}

export function buildShareText(item: ScientificAnnouncement): string {
  const lines = [
    item.announcementTitle,
    item.lessonTitle,
    item.sheikh,
  ];

  if (item.bookTitle) lines.push(`المتن: ${item.bookTitle}`);
  if (item.day) lines.push(`اليوم: ${item.day}`);
  if (item.date) lines.push(`التاريخ: ${formatAnnouncementDate(item)}`);
  if (item.time) lines.push(`الوقت: ${item.time}`);

  const place = getLocationLabel(item);
  if (place !== "غير محدد") lines.push(`المكان: ${place}`);
  if (item.region) lines.push(`المنطقة: ${item.region}`);
  if (item.governorate && item.governorate !== "غير محدد") {
    lines.push(`المحافظة: ${item.governorate}`);
  }

  if (item.notes.length) {
    lines.push("", ...item.notes);
  }

  lines.push("", "المجلس العلمي — majlisilm.com");
  return lines.join("\n");
}

export function buildCalendarEventsFromAnnouncements(
  items: ScientificAnnouncement[] = SCIENTIFIC_ANNOUNCEMENTS,
): ScientificCalendarEvent[] {
  const events: ScientificCalendarEvent[] = [];

  for (const item of items) {
    const mosque = getLocationLabel(item);
    const base = {
      title: item.lessonTitle,
      sheikh: item.sheikh,
      mosque,
      time: item.time || "غير محدد",
      description: item.announcementTitle,
      href: `/scientific-announcements/${item.id}`,
    };

    if (item.kind === "weekly" && item.recurrenceDay) {
      events.push({
        ...base,
        id: item.id,
        day: item.recurrenceDay,
        recurring: true,
      });
      continue;
    }

    if (item.kind === "one_time" && item.date) {
      events.push({
        ...base,
        id: item.id,
        day: item.day || "",
        date: item.date,
        recurring: false,
      });
    }
  }

  return events;
}

export function scientificEventsForDate(
  date: Date,
  events: ScientificCalendarEvent[],
): ScientificCalendarEvent[] {
  const weekday = date.getDay();
  const dateStr = format(date, "yyyy-MM-dd");

  return events.filter((event) => {
    if (event.date && !event.recurring) {
      return event.date === dateStr;
    }
    if (event.recurring && event.day) {
      return DAY_MAP[event.day] === weekday;
    }
    return false;
  });
}

export const SCIENTIFIC_DAY_MAP = DAY_MAP;
