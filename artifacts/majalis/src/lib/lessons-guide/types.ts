/**
 * عقد دليل الدروس — يعيد استخدام بيانات الدروس الحالية دون نظام موازٍ.
 * لا أسماء مسجد/جهة خارج البيانات · لا إحداثيات مخترعة.
 */

export const LESSONS_GUIDE_SCHEMA_VERSION = 1 as const;

/** حالات العرض في الدليل (مستقلة عن content_status في DB). */
export type LessonsGuideScheduleStatus =
  | "upcoming"
  | "live"
  | "completed"
  | "cancelled"
  | "postponed"
  | "draft";

export type LessonsGuidePublicationState = "public" | "draft" | "archived";

export type LessonsGuideSourceStatus = "supabase" | "seed" | "unknown";

/**
 * الحد الأدنى للدرس المجدول في الدليل.
 * الحقول الجغرافية اختيارية وموثّقة فقط.
 */
export type ScheduledLessonGuideItem = {
  lessonId: string;
  title: string;
  description?: string;
  categoryId?: string;
  /** ISO date YYYY-MM-DD إن توفرت؛ وإلا تُشتق من التكرار الأسبوعي */
  date?: string;
  startTime?: string;
  endTime?: string;
  timezone: string;
  status: LessonsGuideScheduleStatus;
  locationName?: string;
  address?: string;
  /** فقط إن وُجدت أرقام صريحة موثّقة — لا اشتقاق من اسم المكان */
  latitude?: number;
  longitude?: number;
  onlineUrl?: string;
  reminderEnabled?: boolean;
  reminderOffset?: number;
  favorite?: boolean;
  publicationState: LessonsGuidePublicationState;
  sourceStatus: LessonsGuideSourceStatus;
  /** ms للموعد القادم المحسوب — إن كان صالحًا */
  nextOccurrenceMs?: number;
  /** هل يصلح كنقطة خريطة؟ */
  mapEligible: boolean;
  /** هل يصلح في الخط الزمني كقادم؟ */
  timelineUpcomingEligible: boolean;
  speakerName?: string;
};

/** حالة توفر الطبقة الجغرافية */
export type LessonsGuideGeoCapability =
  | "ready"
  | "BLOCKED_DATA"
  | "partial_url_coords";

export type LessonsGuideGeoReport = {
  capability: LessonsGuideGeoCapability;
  /** أعمدة lat/lng في المخطط المستضاف */
  hasDedicatedCoordinatesColumn: false;
  /** عدد العناصر ذات إحداثيات صريحة من maps_url فقط */
  itemsWithExplicitCoords: number;
  note: string;
};
