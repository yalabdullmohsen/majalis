/**
 * Field definitions for lesson poster extraction.
 */
export const EXTRACTION_FIELDS = [
  "title",
  "speaker_name",
  "gregorian_date",
  "day_of_week",
  "lesson_time",
  "mosque",
  "region",
  "city",
  "country",
  "category",
  "description",
  "organizer",
  "cooperative_org",
  "phone",
  "whatsapp",
  "email",
  "live_url",
  "registration_url",
  "maps_url",
  "activity_type",
  "is_course",
  "course_name",
  "series_name",
  "language",
  "source",
  "qr_code_url",
];

export const CORE_EXTRACTION_FIELDS = [
  "title",
  "speaker_name",
  "gregorian_date",
  "day_of_week",
  "lesson_time",
  "mosque",
  "city",
  "phone",
  "registration_url",
  "category",
  "activity_type",
];

export const REQUIRED_FOR_PUBLISH = [
  "title",
  "speaker_name",
  "lesson_time",
  "mosque",
  "city",
];

export const AI_COST_ESTIMATE_USD = {
  openai_vision: 0.002,
  anthropic_vision: 0.003,
  openai_text: 0.0005,
  anthropic_text: 0.0008,
};

export const DECISION_THRESHOLDS = {
  auto_publish: 0.95,
  quick_review: 0.90,
  full_review: 0.70,
  ai_required: 0.70,
  rule_skip_ai_completeness: 0.90,
};
