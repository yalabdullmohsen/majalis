import { getLessonById } from "@/lib/supabase";
import type { LessonsRepository } from "../domain/ports";

export function createSupabaseLessonsRepository(): LessonsRepository {
  return {
    async getById(id: string) {
      const result = await getLessonById(id);
      const raw = result.lesson;
      if (!raw || typeof raw !== "object") {
        return { lesson: null, error: result.error, usingSeed: result.usingSeed };
      }
      const row = raw as Record<string, unknown>;
      const lessonId = typeof row.id === "string" ? row.id : id;
      const title = typeof row.title === "string" ? row.title : "";
      if (!title) {
        return { lesson: null, error: result.error, usingSeed: result.usingSeed };
      }
      return {
        lesson: {
          id: lessonId,
          title,
          speaker_name: typeof row.speaker_name === "string" ? row.speaker_name : undefined,
          poster_image_url: typeof row.poster_image_url === "string" ? row.poster_image_url : undefined,
          keywords: Array.isArray(row.keywords) ? row.keywords.filter((k): k is string => typeof k === "string") : undefined,
          created_at: typeof row.created_at === "string" ? row.created_at : undefined,
          updated_at: typeof row.updated_at === "string" ? row.updated_at : undefined,
          category: typeof row.category === "string" ? row.category : undefined,
          mosque: typeof row.mosque === "string" ? row.mosque : undefined,
          city: typeof row.city === "string" ? row.city : undefined,
          region: typeof row.region === "string" ? row.region : undefined,
          description: typeof row.description === "string" ? row.description : undefined,
          schedule: typeof row.schedule === "string" ? row.schedule : undefined,
          day_of_week: typeof row.day_of_week === "string" ? row.day_of_week : undefined,
          lesson_time: typeof row.lesson_time === "string" ? row.lesson_time : undefined,
          stream_url: typeof row.stream_url === "string" ? row.stream_url : undefined,
          maps_url: typeof row.maps_url === "string" ? row.maps_url : undefined,
          website_url: typeof row.website_url === "string" ? row.website_url : undefined,
          recording_url: typeof row.recording_url === "string" ? row.recording_url : undefined,
          live_url: typeof row.live_url === "string" ? row.live_url : undefined,
          book_url: typeof row.book_url === "string" ? row.book_url : undefined,
          video_url: typeof row.video_url === "string" ? row.video_url : undefined,
          audio_url: typeof row.audio_url === "string" ? row.audio_url : undefined,
          activity_type: typeof row.activity_type === "string" ? row.activity_type : undefined,
          is_course: typeof row.is_course === "boolean" ? row.is_course : undefined,
          course_id: typeof row.course_id === "string" ? row.course_id : undefined,
          session_count: typeof row.session_count === "number" ? row.session_count : undefined,
          linked_titles: Array.isArray(row.linked_titles)
            ? row.linked_titles.filter((t): t is string => typeof t === "string")
            : undefined,
          external_key: typeof row.external_key === "string" ? row.external_key : undefined,
          sheikhs:
            row.sheikhs && typeof row.sheikhs === "object"
              ? {
                  id: typeof (row.sheikhs as { id?: unknown }).id === "string" ? (row.sheikhs as { id: string }).id : undefined,
                  name: typeof (row.sheikhs as { name?: unknown }).name === "string" ? (row.sheikhs as { name: string }).name : undefined,
                  bio: typeof (row.sheikhs as { bio?: unknown }).bio === "string" ? (row.sheikhs as { bio: string }).bio : undefined,
                  photo_url:
                    typeof (row.sheikhs as { photo_url?: unknown }).photo_url === "string"
                      ? (row.sheikhs as { photo_url: string }).photo_url
                      : undefined,
                }
              : undefined,
        },
        error: result.error,
        usingSeed: result.usingSeed,
      };
    },
  };
}
