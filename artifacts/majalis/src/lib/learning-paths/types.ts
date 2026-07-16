/**
 * أنواع بيانات منظومة المسارات العلمية — طبقة منطق نقية بلا اعتماد على React
 * أو Supabase مباشرة، لتكون قابلة للاختبار بمعزل تام (نفس نمط src/lib/inheritance/).
 */

export type ItemType = "book" | "lesson" | "activity" | "assessment";
export type CompletionMethod =
  | "manual_confirm"
  | "watch_percent"
  | "read_scroll"
  | "assessment_pass"
  | "activity_submit";

export type LearningItem = {
  id: string;
  unitId: string;
  itemType: ItemType;
  title: string;
  sessionEstimate: number;
  minutesEstimate: number | null;
  weight: number;
  isRequired: boolean;
  completionMethod: CompletionMethod;
  completionThreshold: number | null;
};

export type CompletionEventType = "started" | "progress_update" | "completed" | "reopened";

export type CompletionEvent = {
  learningItemId: string;
  eventType: CompletionEventType;
  evidenceValue: number | null;
  occurredAt: string;
};

export type ItemState = {
  status: "not_started" | "in_progress" | "completed";
  latestEvidenceValue: number | null;
  completedAt: string | null;
};

export type Course = {
  id: string;
  stageId: string;
  title: string;
  passPercentage: number;
};

export type CourseAssessmentResult = {
  courseId: string;
  passed: boolean;
} | null;

export type Prerequisite = { courseId: string; requiresCourseId: string };

export type StudyPace = {
  weeklySessions: number;
  preferredDays: number[]; // 0=أحد .. 6=سبت
};

export type ScheduledSession = {
  learningItemId: string;
  scheduledDate: string; // YYYY-MM-DD
};
