/**
 * كatalog الدروس الرسمية خارج lesson-ads — تُدمج في LESSONS_SEED.
 * يشمل إعلانات علمية موثقة (سالم الطويل، ملتقى إجازتي طاعة، وغيرها).
 */
import {
  SCIENTIFIC_ANNOUNCEMENTS,
  type ScientificAnnouncement,
} from "@/lib/scientific-announcements-seed";
import { resolveRegion, resolveGovernorateForUi } from "@/lib/kuwait-regions";
import { cleanTimeText } from "@/lib/lesson-time";
import type { LessonSeedRow } from "@/lib/lessons-seed";

function categoryFromTags(tags: string[]): string {
  for (const tag of tags) {
    if (["تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "تأصيل"].includes(tag)) return tag;
  }
  return "أخرى";
}

function activityType(item: ScientificAnnouncement): LessonSeedRow["activity_type"] {
  if (item.kind === "online_course" || item.tags.some((t) => t.includes("دورة"))) return "دورة";
  if (item.tags.some((t) => t.includes("محاضرة") || t.includes("ملتقى"))) return "محاضرة";
  return "درس";
}

function venueLabel(item: ScientificAnnouncement): string {
  return item.mosque || item.venue || "";
}

function rowFromAnnouncement(item: ScientificAnnouncement, sessionIndex = 0): LessonSeedRow {
  const place = venueLabel(item);
  const region = resolveRegion(item.region || "");
  const governorate = resolveGovernorateForUi(item.governorate || "", item.region || "");
  const isCourse = activityType(item) === "دورة";
  const externalKey =
    sessionIndex > 0 ? `${item.id}-${sessionIndex}` : item.id;

  const title =
    sessionIndex > 0 && item.lessonTitle !== item.announcementTitle
      ? `${item.announcementTitle} — ${item.lessonTitle}`
      : item.lessonTitle;

  const hasLive =
    item.tags.some((t) => /بث|مباشر|live/i.test(t)) || Boolean(item.liveUrl);

  return {
    id: externalKey,
    external_key: externalKey,
    title,
    speaker_name: item.sheikh,
    sheikh_image_url: item.sheikh.includes("سالم") ? "/logo.png" : undefined,
    poster_image_url: item.posterImage,
    category: categoryFromTags(item.tags),
    city: governorate,
    region,
    mosque: place,
    day_of_week: item.day || item.recurrenceDay || "",
    lesson_time: cleanTimeText(item.time || ""),
    schedule: [item.day || item.recurrenceDay, cleanTimeText(item.time || "")]
      .filter(Boolean)
      .join(" — "),
    description: [...item.notes, item.bookTitle ? `المتن: ${item.bookTitle}` : ""]
      .filter(Boolean)
      .join(" · "),
    audience: "الكل",
    delivery: hasLive ? "كلاهما" : "حضور فقط",
    status: "approved",
    keywords: item.tags,
    live_url: item.liveUrl || item.broadcastLinks?.[0]?.url,
    book_url: item.websiteUrl || item.registrationUrl,
    maps_url: item.mapUrl,
    start_date: item.date,
    end_date: null,
    is_recurring: item.kind === "weekly",
    activity_type: activityType(item),
    is_course: isCourse,
    course_id: isCourse ? item.id.replace(/-\d+$/, "") : undefined,
    session_count: isCourse ? undefined : undefined,
    linked_titles: undefined,
    sheikhs: { name: item.sheikh },
  };
}

/** ملتقى إجازتي طاعة — دورة بجلسات متعددة */
function ijazatiTaahCourseRows(): LessonSeedRow[] {
  const courseId = "course-ijazati-taah-2026";
  const sessions = SCIENTIFIC_ANNOUNCEMENTS.filter((a) => a.id.startsWith("sci-ijazati-taah"));
  return sessions.map((item, index) => {
    const row = rowFromAnnouncement(item, index);
    return {
      ...row,
      id: `${courseId}-${index}`,
      external_key: `${courseId}-${index}`,
      title: `ملتقى إجازتي طاعة — ${item.lessonTitle}`,
      is_course: true,
      course_id: courseId,
      activity_type: "دورة" as const,
      session_count: sessions.length,
      linked_titles: sessions.map((s) => s.lessonTitle),
    };
  });
}

export function buildCatalogLessonRows(): LessonSeedRow[] {
  const standalone = SCIENTIFIC_ANNOUNCEMENTS.filter(
    (item) =>
      !item.id.startsWith("sci-ijazati-taah") &&
      item.id !== "sci-talae-alilm-murtaqaa",
  ).map((item) => rowFromAnnouncement(item));

  const ijazati = ijazatiTaahCourseRows();

  const murtaqaa = rowFromAnnouncement(
    SCIENTIFIC_ANNOUNCEMENTS.find((a) => a.id === "sci-talae-alilm-murtaqaa")!,
  );
  murtaqaa.is_course = true;
  murtaqaa.course_id = "course-talae-alilm-murtaqaa";
  murtaqaa.activity_type = "دورة";

  return [...standalone, ...ijazati, murtaqaa];
}
