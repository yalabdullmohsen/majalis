import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import type { LessonEngagementStats } from "@/lib/lesson-stats";
import type { LessonsSource } from "@/lib/lessons-service";

/** Raw lesson row as returned from Supabase / seed fallback (presentation maps it). */
export type LessonDbRow = {
  id: string;
  title: string;
  speaker_name?: string;
  poster_image_url?: string;
  keywords?: string[];
  created_at?: string;
  updated_at?: string;
  category?: string;
  mosque?: string;
  city?: string;
  region?: string;
  description?: string;
  schedule?: string;
  day_of_week?: string;
  lesson_time?: string;
  stream_url?: string;
  maps_url?: string;
  website_url?: string;
  recording_url?: string;
  live_url?: string;
  book_url?: string;
  video_url?: string;
  audio_url?: string;
  activity_type?: string;
  is_course?: boolean;
  course_id?: string;
  session_count?: number;
  linked_titles?: string[];
  external_key?: string;
  sheikhs?: { id?: string; name?: string; bio?: string; photo_url?: string };
};

export type SheikhLookupRow = {
  name?: string;
  bio?: string;
};

export type LessonsRepository = {
  getById(id: string): Promise<{
    lesson: LessonDbRow | null;
    error: unknown;
    usingSeed: boolean;
  }>;
};

export type LessonCatalogPort = {
  getById(id: string): Promise<{ lesson: KuwaitLessonRecord | null; source: LessonsSource }>;
  fetchRelated(lesson: KuwaitLessonRecord, limit?: number): Promise<KuwaitLessonRecord[]>;
  fetchSameSheikh(lesson: KuwaitLessonRecord, limit?: number): Promise<KuwaitLessonRecord[]>;
  fetchSeries(lesson: KuwaitLessonRecord, limit?: number): Promise<KuwaitLessonRecord[]>;
};

export type LessonEngagementPort = {
  fetchStats(contentId: string): Promise<LessonEngagementStats>;
};

export type SheikhsLookupPort = {
  /** قائمة كاملة — لفهارس العلماء فقط، لا لمسار سيرة درس واحد. */
  list(): Promise<{ data: SheikhLookupRow[] }>;
  /** بحث موجَّه بالاسم لسيرة واحدة — يمنع O(n) شبكة على كل فتح درس. */
  findByName(name: string): Promise<SheikhLookupRow | null>;
};

export type LoadLessonDetailResult = {
  kuwaitLesson: KuwaitLessonRecord | null;
  dbLesson: LessonDbRow | null;
  similar: KuwaitLessonRecord[];
  sameSheikh: KuwaitLessonRecord[];
  seriesLessons: KuwaitLessonRecord[];
  stats: LessonEngagementStats;
  sheikhBio: string;
};

/** Primary payload for instant shell — no related/stats. */
export type LoadLessonPrimaryResult = {
  kuwaitLesson: KuwaitLessonRecord | null;
  dbLesson: LessonDbRow | null;
  sheikhBio: string;
};

export type LoadLessonExtrasResult = Pick<
  LoadLessonDetailResult,
  "similar" | "sameSheikh" | "seriesLessons" | "stats"
>;
